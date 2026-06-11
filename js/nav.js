/* ============================================================
   ErrTrack — Navigation Module
   Controla a troca de páginas (abas) e fecha a sidebar mobile
   ao navegar.
   ============================================================ */

'use strict';

var ErrTrack = ErrTrack || {};

ErrTrack.Nav = (function () {

  var _closeSidebar = null;

  /**
   * Navega para uma página pelo id (sem o prefixo "pg-").
   * @param {string} page - 'painel' | 'registrar' | 'colar' | 'sincronizar'
   */
  function goTo(page) {
    /* Troca visibilidade das páginas */
    document.querySelectorAll('.pg').forEach(function (p) {
      p.classList.remove('on');
    });
    var pg = document.getElementById('pg-' + page);
    if (pg) pg.classList.add('on');

    /* Atualiza estado dos botões de nav */
    document.querySelectorAll('.ni[data-page]').forEach(function (b) {
      b.classList.toggle('on', b.dataset.page === page);
    });

    /* Fecha drawer mobile */
    if (_closeSidebar) _closeSidebar();

    /* Re-renderiza o dashboard ao entrar na aba */
    if (page === 'painel') {
      ErrTrack.Dashboard.render(ErrTrack.App.getDB());
    }
  }

  /**
   * Inicializa os listeners dos botões de navegação.
   * @param {Function} closeSidebarFn - callback para fechar sidebar mobile
   */
  function init(closeSidebarFn) {
    _closeSidebar = closeSidebarFn || function () {};

    document.querySelectorAll('.ni[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        goTo(this.dataset.page);
      });
    });

    console.log('[ErrTrack.Nav] Navegação iniciada');
  }

  return { goTo, init };

}());
