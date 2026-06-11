/* ============================================================
   ErrTrack — App (Bootstrap)
   Ponto de entrada da aplicação.
   Inicializa todos os módulos na ordem correta e expõe
   o estado global (DB) para os outros módulos via getDB/reloadDB.
   ============================================================ */

'use strict';

var ErrTrack = ErrTrack || {};

ErrTrack.App = (function () {

  /* Estado central: único DB em memória */
  var _db = {};

  /**
   * Retorna referência ao DB em memória.
   * @returns {Object}
   */
  function getDB() {
    return _db;
  }

  /**
   * Recarrega o DB do localStorage para a memória.
   * Use após operações destrutivas (replace, clear).
   */
  function reloadDB() {
    _db = ErrTrack.Storage.load();
  }

  /**
   * Inicializa toda a aplicação.
   */
  function init() {
    /* 1. Carrega dados persistidos */
    _db = ErrTrack.Storage.load();

    /* 2. UI primitives (tema + sidebar mobile) */
    ErrTrack.UI.initTheme();
    var mobile = ErrTrack.UI.initMobileSidebar();

    /* 3. Navegação entre abas */
    ErrTrack.Nav.init(mobile.closeSidebar);

    /* 4. Botão voltar (detalhe → lista) */
    var btnBack = document.getElementById('btn-back');
    if (btnBack) {
      btnBack.addEventListener('click', function () {
        ErrTrack.Dashboard.showList(_db);
      });
    }

    /* 5. Formulários */
    ErrTrack.Form.init();

    /* 6. Sincronização */
    ErrTrack.Sync.init();

    /* 7. Renderiza dashboard inicial */
    ErrTrack.Dashboard.render(_db);

    console.log('[ErrTrack] ✓ Sistema iniciado com sucesso');
  }

  /* Inicia quando o DOM estiver pronto */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { getDB, reloadDB };

}());
