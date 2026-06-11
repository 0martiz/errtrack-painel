/* ============================================================
   ErrTrack — Dashboard Module
   Renderiza KPIs, grade de funcionários, tela de detalhe
   (gráfico + histórico de erros) e mantém a sidebar em sincronia.
   Depende de Utils, Config, Storage, UI e Sidebar.
   ============================================================ */

'use strict';

var ErrTrack = ErrTrack || {};

ErrTrack.Dashboard = (function () {

  var U = ErrTrack.Utils;

  var _chart = null;       // instância atual do Chart.js
  var _currentEmp = null;  // funcionário aberto na tela de detalhe

  /* ── Helpers internos ──────────────────────────────── */

  /**
   * Calcula a tendência de um funcionário comparando o último
   * registro com a média dos anteriores.
   * @param {Object} emp - { cargo, erros: [...] }
   * @returns {{key:'up'|'down'|'flat', label:string, cls:string}}
   */
  function trendOf(emp) {
    var erros = (emp && emp.erros) || [];
    if (erros.length < 2) {
      return { key: 'flat', label: 'Estável', cls: 't-fl' };
    }

    var last = U.sevWeight(erros[erros.length - 1].gravidade);
    var prevWeights = erros.slice(0, -1).map(function (e) {
      return U.sevWeight(e.gravidade);
    });
    var prevAvg = U.average(prevWeights);

    if (last > prevAvg)  return { key: 'up',   label: 'Piorando',   cls: 't-up' };
    if (last < prevAvg)  return { key: 'down', label: 'Melhorando', cls: 't-dn' };
    return { key: 'flat', label: 'Estável', cls: 't-fl' };
  }

  /**
   * Mostra a tela de lista (grade de funcionários) e esconde o detalhe.
   */
  function showListView() {
    var list = document.getElementById('pn-list');
    var detail = document.getElementById('pn-detail');
    if (list) list.style.display = '';
    if (detail) detail.style.display = 'none';
  }

  /**
   * Mostra a tela de detalhe e esconde a lista.
   */
  function showDetailView() {
    var list = document.getElementById('pn-list');
    var detail = document.getElementById('pn-detail');
    if (list) list.style.display = 'none';
    if (detail) detail.style.display = '';
  }

  /* ── KPIs ──────────────────────────────────────────── */

  function renderKPIs(db) {
    var names = Object.keys(db);
    var total = 0;
    var criticos = 0;
    var piora = 0;
    var melhora = 0;

    names.forEach(function (name) {
      var emp = db[name];
      var erros = (emp && emp.erros) || [];
      total += erros.length;
      erros.forEach(function (e) {
        if (e.gravidade === 'critica') criticos++;
      });

      var t = trendOf(emp);
      if (t.key === 'up') piora++;
      if (t.key === 'down') melhora++;
    });

    setText('kpi-total', total);
    setText('kpi-critica', criticos);
    setText('kpi-piora', piora);
    setText('kpi-melhora', melhora);
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /* ── Grade de funcionários ─────────────────────────── */

  function renderEmpGrid(db) {
    var grid = document.getElementById('emp-grid');
    var empty = document.getElementById('emp-empty');
    if (!grid) return;

    var names = Object.keys(db);

    if (!names.length) {
      grid.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';

    grid.innerHTML = names.map(function (name) {
      var emp = db[name] || {};
      var erros = emp.erros || [];
      var total = erros.length;
      var avgW = U.average(erros.map(function (e) { return U.sevWeight(e.gravidade); }));
      var t = trendOf(emp);

      return '' +
        '<div class="ec" data-emp="' + encodeURIComponent(name) + '">' +
          '<div class="ec-stripe"></div>' +
          '<div class="ec-n">' + U.htmlEsc(name) + '</div>' +
          '<div class="ec-m">' + U.htmlEsc(emp.cargo || 'Sem cargo') + ' · ' + total + (total === 1 ? ' registro' : ' registros') + '</div>' +
          '<div class="ec-s">' +
            '<div class="es"><div class="esv">' + total + '</div><div class="esl">Total</div></div>' +
            '<div class="es"><div class="esv">' + avgW.toFixed(1) + '</div><div class="esl">Média Grav.</div></div>' +
          '</div>' +
          '<span class="tb ' + t.cls + '"><span class="dt"></span>' + t.label + '</span>' +
        '</div>';
    }).join('');

    grid.querySelectorAll('[data-emp]').forEach(function (card) {
      card.addEventListener('click', function () {
        openDetail(decodeURIComponent(this.dataset.emp), ErrTrack.App.getDB());
      });
    });
  }

  /* ── Tela de detalhe ───────────────────────────────── */

  function openDetail(name, db) {
    var emp = db[name];
    if (!emp) {
      ErrTrack.UI.toast('Funcionário não encontrado.', 'er');
      return;
    }

    _currentEmp = name;

    var erros = emp.erros || [];
    var total = erros.length;
    var avgW = U.average(erros.map(function (e) { return U.sevWeight(e.gravidade); }));
    var criticos = erros.filter(function (e) { return e.gravidade === 'critica'; }).length;
    var lastPeriod = total ? erros[erros.length - 1].periodo : '—';
    var t = trendOf(emp);

    setText('d-name', name);
    setText('d-cargo', emp.cargo || 'Sem cargo');
    setText('dm-total', total);
    setText('dm-avg', avgW.toFixed(1));
    setText('dm-period', lastPeriod);
    setText('dm-critica', criticos);

    var trendEl = document.getElementById('d-trend');
    if (trendEl) {
      trendEl.innerHTML = '<span class="tb ' + t.cls + '"><span class="dt"></span>' + t.label + '</span>';
    }

    renderChart(erros);
    renderErrList(name, erros);

    showDetailView();
  }

  function showList(db) {
    _currentEmp = null;
    render(db);
  }

  /* ── Gráfico (gravidade média por período) ─────────── */

  function renderChart(erros) {
    var canvas = document.getElementById('chart-canvas');
    if (!canvas || typeof Chart === 'undefined') return;

    /* Agrupa por período mantendo a ordem de primeira ocorrência */
    var periods = [];
    var sums = {};
    var counts = {};

    erros.forEach(function (e) {
      var p = e.periodo || '—';
      if (!(p in sums)) {
        periods.push(p);
        sums[p] = 0;
        counts[p] = 0;
      }
      sums[p] += U.sevWeight(e.gravidade);
      counts[p]++;
    });

    var data = periods.map(function (p) { return +(sums[p] / counts[p]).toFixed(2); });

    if (_chart) {
      _chart.destroy();
      _chart = null;
    }

    var styles = getComputedStyle(document.documentElement);
    var primary = styles.getPropertyValue('--primary').trim() || '#8b5cf6';
    var border  = styles.getPropertyValue('--border').trim() || 'rgba(255,255,255,0.06)';
    var muted   = styles.getPropertyValue('--mt').trim() || '#64748b';

    _chart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: periods,
        datasets: [{
          label: 'Gravidade média',
          data: data,
          borderColor: primary,
          backgroundColor: primary + '33',
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: primary
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            min: 0,
            max: 4,
            ticks: {
              stepSize: 1,
              color: muted,
              callback: function (val) {
                var labels = ['', 'Baixa', 'Média', 'Alta', 'Crítica'];
                return labels[val] || val;
              }
            },
            grid: { color: border }
          },
          x: {
            ticks: { color: muted },
            grid: { color: border }
          }
        }
      }
    });
  }

  /* ── Histórico de erros ────────────────────────────── */

  function renderErrList(name, erros) {
    var list = document.getElementById('err-list');
    if (!list) return;

    if (!erros.length) {
      list.innerHTML = '<div class="empty"><div class="empty-i">📋</div><h3>Nenhum erro registrado</h3><p>Use "Registrar Erro" ou "Colar Dados" para adicionar.</p></div>';
      return;
    }

    /* Mais recentes primeiro */
    var ordered = erros.map(function (e, i) { return { e: e, i: i }; }).reverse();

    list.innerHTML = ordered.map(function (item) {
      var e = item.e;
      var sevCls = U.sevClass(e.gravidade);
      var sevLbl = U.sevLabel(e.gravidade);
      var meta = [e.periodo, e.categoria, U.formatDate(e.data)].filter(Boolean).join(' · ');

      return '' +
        '<div class="er">' +
          '<span class="sp s-' + sevCls + '">' + sevLbl + '</span>' +
          '<div style="flex:1;min-width:0">' +
            '<div class="ed">' + U.htmlEsc(e.descricao) + '</div>' +
            '<div class="em">' + U.htmlEsc(meta) + '</div>' +
          '</div>' +
          '<button class="db" title="Excluir registro" data-idx="' + item.i + '">×</button>' +
        '</div>';
    }).join('');

    list.querySelectorAll('[data-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        deleteErro(name, parseInt(this.dataset.idx, 10));
      });
    });
  }

  function deleteErro(name, idx) {
    var db = ErrTrack.App.getDB();
    var emp = db[name];
    if (!emp || !emp.erros || !emp.erros[idx]) return;

    emp.erros.splice(idx, 1);
    ErrTrack.Storage.save(db);
    ErrTrack.App.reloadDB();
    ErrTrack.UI.toast('Registro excluído.', 'ok');

    var freshDB = ErrTrack.App.getDB();
    if (freshDB[name]) {
      openDetail(name, freshDB);
    } else {
      showList(freshDB);
    }
  }

  /* ── Render principal ──────────────────────────────── */

  function render(db) {
    ErrTrack.Sidebar.render(db);
    renderKPIs(db);
    renderEmpGrid(db);
    showListView();
  }

  return {
    render: render,
    showList: showList,
    openDetail: openDetail
  };

}());
