/* ============================================================
   ErrTrack — Form Module
   Controla a página "Registrar Erro" (formulário manual) e a
   página "Colar Dados" (importação por texto livre).
   Depende de Utils, Config, Storage, UI e Sidebar/Dashboard.
   ============================================================ */

'use strict';

var ErrTrack = ErrTrack || {};

ErrTrack.Form = (function () {

  var U = ErrTrack.Utils;

  var _selectedSev = null; // gravidade escolhida no formulário "Registrar Erro"

  /* ── Persistência comum ────────────────────────────── */

  /**
   * Garante que o funcionário existe no DB e retorna sua referência.
   * @param {Object} db
   * @param {string} nome
   * @param {string} [cargo]
   * @returns {Object} registro do funcionário
   */
  function ensureEmployee(db, nome, cargo) {
    if (!db[nome]) {
      db[nome] = { cargo: cargo || '', erros: [] };
    } else if (cargo && !db[nome].cargo) {
      db[nome].cargo = cargo;
    }
    if (!db[nome].erros) db[nome].erros = [];
    return db[nome];
  }

  /**
   * Salva o DB, recarrega o estado em memória e atualiza a UI.
   */
  function persistAndRefresh() {
    var db = ErrTrack.App.getDB();
    ErrTrack.Storage.save(db);
    ErrTrack.App.reloadDB();
    var fresh = ErrTrack.App.getDB();
    ErrTrack.Sidebar.render(fresh);
    /* Só re-renderiza o painel se ele estiver visível, para não
       sobrescrever a tela de detalhe aberta pelo usuário. */
    var painel = document.getElementById('pg-painel');
    if (painel && painel.classList.contains('on')) {
      ErrTrack.Dashboard.render(fresh);
    }
  }

  /* ── Registrar Erro ────────────────────────────────── */

  function initSeverityPicker() {
    var options = document.querySelectorAll('#pg-registrar .so[data-sev]');

    options.forEach(function (opt) {
      opt.addEventListener('click', function () {
        var sev = this.dataset.sev;

        options.forEach(function (o) {
          o.classList.remove('a-bx', 'a-md', 'a-al', 'a-cr');
        });

        this.classList.add('a-' + U.sevClass(sev));
        _selectedSev = sev;
      });
    });
  }

  function clearRegistrarForm() {
    ['f-nome', 'f-cargo', 'f-periodo', 'f-cat'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    var desc = document.getElementById('f-desc');
    if (desc) desc.value = '';

    document.querySelectorAll('#pg-registrar .so[data-sev]').forEach(function (o) {
      o.classList.remove('a-bx', 'a-md', 'a-al', 'a-cr');
    });
    _selectedSev = null;
  }

  function showSaveMsg(msg, ok) {
    var el = document.getElementById('save-msg');
    if (!el) return;
    el.textContent = msg;
    el.style.color = ok ? 'var(--gn)' : 'var(--rd)';
  }

  function initRegistrarForm() {
    var btn = document.getElementById('btn-save');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var nome = (document.getElementById('f-nome') || {}).value || '';
      var cargo = (document.getElementById('f-cargo') || {}).value || '';
      var periodo = (document.getElementById('f-periodo') || {}).value || '';
      var categoria = (document.getElementById('f-cat') || {}).value || '';
      var descricao = (document.getElementById('f-desc') || {}).value || '';

      nome = nome.trim();
      periodo = periodo.trim();
      descricao = descricao.trim();

      if (!nome || !periodo || !descricao || !_selectedSev) {
        showSaveMsg('Preencha os campos obrigatórios (*) e selecione a gravidade.', false);
        ErrTrack.UI.toast('Preencha os campos obrigatórios.', 'er');
        return;
      }

      var db = ErrTrack.App.getDB();
      var emp = ensureEmployee(db, nome, cargo.trim());

      emp.erros.push({
        id: U.genId(),
        periodo: periodo,
        categoria: categoria.trim(),
        descricao: descricao,
        gravidade: _selectedSev,
        data: U.nowISO()
      });

      persistAndRefresh();

      showSaveMsg('Registro salvo com sucesso!', true);
      ErrTrack.UI.toast('Erro registrado com sucesso.', 'ok');
      clearRegistrarForm();
    });
  }

  /* ── Colar Dados ───────────────────────────────────── */

  /**
   * Interpreta uma linha de texto livre em { periodo, descricao, gravidade }.
   * Aceita separadores -, |, :, e ,
   * @param {string} line
   * @returns {{periodo:string, descricao:string, gravidade:string}}
   */
  function parseLine(line) {
    var gravidade = U.detectSeverity(line);

    var parts = line
      .split(/\s*[-|:]\s*/)
      .map(function (p) { return p.trim(); })
      .filter(Boolean);

    var periodo = parts.length ? parts[0] : line.trim();
    var rest = parts.length > 1 ? parts.slice(1).join(' — ') : line.trim();

    /* Remove vírgulas residuais e a própria palavra de gravidade do fim */
    rest = rest.replace(/,\s*(crítica|critica|urgente|alta|grave|s[ée]rio|m[ée]dia|moderad[ao]|baixa|leve|simples)\s*$/i, '').trim();

    return { periodo: periodo, descricao: rest, gravidade: gravidade };
  }

  function initColarForm() {
    var btn = document.getElementById('btn-paste');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var nome = (document.getElementById('p-nome') || {}).value || '';
      var cargo = (document.getElementById('p-cargo') || {}).value || '';
      var dados = (document.getElementById('p-dados') || {}).value || '';

      nome = nome.trim();
      var lines = U.splitLines(dados);

      if (!nome || !lines.length) {
        ErrTrack.UI.toast('Informe o funcionário e os dados a importar.', 'er');
        return;
      }

      var db = ErrTrack.App.getDB();
      var emp = ensureEmployee(db, nome, cargo.trim());

      var parsed = lines.map(parseLine);

      parsed.forEach(function (p) {
        emp.erros.push({
          id: U.genId(),
          periodo: p.periodo,
          categoria: '',
          descricao: p.descricao || p.periodo,
          gravidade: p.gravidade,
          data: U.nowISO()
        });
      });

      persistAndRefresh();
      renderParsePreview(parsed);

      ErrTrack.UI.toast(parsed.length + ' registro(s) importado(s) para ' + nome + '.', 'ok');

      var dadosEl = document.getElementById('p-dados');
      if (dadosEl) dadosEl.value = '';
    });
  }

  function renderParsePreview(parsed) {
    var box = document.getElementById('parse-result');
    if (!box) return;

    box.innerHTML = parsed.map(function (p) {
      var sevCls = U.sevClass(p.gravidade);
      var sevLbl = U.sevLabel(p.gravidade);
      return '' +
        '<div class="prw">' +
          '<span class="dt d-' + sevCls + '"></span>' +
          '<span><strong>' + U.htmlEsc(p.periodo) + '</strong> — ' + U.htmlEsc(p.descricao) +
          ' <em>(' + sevLbl + ')</em></span>' +
        '</div>';
    }).join('');

    box.style.display = parsed.length ? 'block' : 'none';
  }

  /* ── Init geral ────────────────────────────────────── */

  function init() {
    initSeverityPicker();
    initRegistrarForm();
    initColarForm();
    console.log('[ErrTrack.Form] Formulários iniciados');
  }

  return { init: init };

}());
