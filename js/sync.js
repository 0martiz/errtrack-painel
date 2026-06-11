/* ============================================================
   ErrTrack — Sync Module
   Exporta, importa, substitui e apaga os dados locais via
   arquivo .json — usado para compartilhar dados entre a equipe.
   Depende de Storage, UI e Dashboard.
   ============================================================ */

'use strict';

var ErrTrack = ErrTrack || {};

ErrTrack.Sync = (function () {

  /* ── Refresh helper ────────────────────────────────── */

  function refreshUI() {
    ErrTrack.App.reloadDB();
    var db = ErrTrack.App.getDB();
    ErrTrack.Sidebar.render(db);
    ErrTrack.Dashboard.render(db);
  }

  /* ── Exportar ──────────────────────────────────────── */

  function exportData() {
    var db = ErrTrack.App.getDB();
    var json = JSON.stringify(db, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);

    var date = new Date().toISOString().slice(0, 10);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'errtrack-dados-' + date + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    ErrTrack.UI.toast('Dados exportados com sucesso.', 'ok');
  }

  /* ── Importar (merge) ──────────────────────────────── */

  /**
   * Lê um arquivo .json e devolve o objeto via Promise.
   * @param {File} file
   * @returns {Promise<Object>}
   */
  function readJSONFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          resolve(JSON.parse(e.target.result));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function mergeDB(current, incoming) {
    Object.keys(incoming || {}).forEach(function (nome) {
      var inEmp = incoming[nome] || {};
      var inErros = inEmp.erros || [];

      if (!current[nome]) {
        current[nome] = { cargo: inEmp.cargo || '', erros: [] };
      } else if (inEmp.cargo && !current[nome].cargo) {
        current[nome].cargo = inEmp.cargo;
      }
      if (!current[nome].erros) current[nome].erros = [];

      var existingIds = {};
      current[nome].erros.forEach(function (e) {
        if (e && e.id) existingIds[e.id] = true;
      });

      inErros.forEach(function (e) {
        if (e && e.id && existingIds[e.id]) return; // evita duplicar
        current[nome].erros.push(e);
      });
    });

    return current;
  }

  function importFile(file) {
    if (!file) return;

    readJSONFile(file).then(function (incoming) {
      var db = ErrTrack.App.getDB();
      mergeDB(db, incoming);
      ErrTrack.Storage.save(db);
      refreshUI();
      ErrTrack.UI.toast('Dados importados e mesclados com sucesso.', 'ok');
    }).catch(function () {
      ErrTrack.UI.toast('Arquivo inválido. Verifique se é um .json exportado pelo ErrTrack.', 'er');
    });
  }

  /* ── Substituir tudo ───────────────────────────────── */

  function replaceFile(file) {
    if (!file) return;

    var ok = window.confirm('Isso vai apagar TODOS os dados atuais e substituir pelo conteúdo do arquivo. Deseja continuar?');
    if (!ok) return;

    readJSONFile(file).then(function (incoming) {
      ErrTrack.Storage.save(incoming || {});
      refreshUI();
      ErrTrack.UI.toast('Dados substituídos com sucesso.', 'ok');
    }).catch(function () {
      ErrTrack.UI.toast('Arquivo inválido. Verifique se é um .json exportado pelo ErrTrack.', 'er');
    });
  }

  /* ── Apagar tudo ───────────────────────────────────── */

  function clearAll() {
    var ok = window.confirm('Isso vai apagar TODOS os dados salvos neste navegador. Esta ação não pode ser desfeita. Continuar?');
    if (!ok) return;

    ErrTrack.Storage.clear();
    refreshUI();
    ErrTrack.UI.toast('Todos os dados foram apagados.', 'wn');
  }

  /* ── Init ──────────────────────────────────────────── */

  function init() {
    var btnExport    = document.getElementById('btn-export');
    var btnExportTop = document.getElementById('btn-export-top');
    var btnReplace   = document.getElementById('btn-replace');
    var btnClear     = document.getElementById('btn-clear');

    var dropZone     = document.getElementById('drop-zone');
    var fileImport   = document.getElementById('file-import');
    var fileReplace  = document.getElementById('file-replace');

    if (btnExport)    btnExport.addEventListener('click', exportData);
    if (btnExportTop) btnExportTop.addEventListener('click', exportData);

    if (btnReplace && fileReplace) {
      btnReplace.addEventListener('click', function () { fileReplace.click(); });
      fileReplace.addEventListener('change', function () {
        replaceFile(this.files && this.files[0]);
        this.value = '';
      });
    }

    if (btnClear) btnClear.addEventListener('click', clearAll);

    if (dropZone && fileImport) {
      dropZone.addEventListener('click', function () { fileImport.click(); });

      fileImport.addEventListener('change', function () {
        importFile(this.files && this.files[0]);
        this.value = '';
      });

      ['dragenter', 'dragover'].forEach(function (evt) {
        dropZone.addEventListener(evt, function (e) {
          e.preventDefault();
          dropZone.classList.add('drag');
        });
      });

      ['dragleave', 'drop'].forEach(function (evt) {
        dropZone.addEventListener(evt, function (e) {
          e.preventDefault();
          dropZone.classList.remove('drag');
        });
      });

      dropZone.addEventListener('drop', function (e) {
        var files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length) importFile(files[0]);
      });
    }

    console.log('[ErrTrack.Sync] Sincronização iniciada');
  }

  return { init: init };

}());
