/* ============================================================
   ErrTrack — Sidebar Module
   Renderiza a lista de funcionários na sidebar e gerencia
   a navegação entre páginas.
   ============================================================ */

'use strict';

var ErrTrack = ErrTrack || {};

ErrTrack.Sidebar = (function () {

  var U = ErrTrack.Utils;

  /**
   * Renderiza os botões de funcionários na sidebar.
   * @param {Object} db
   */
  function render(db) {
    var wrap = document.getElementById('sidebar-emps');
    if (!wrap) return;

    var names = Object.keys(db);

    if (!names.length) {
      wrap.innerHTML = '<div style="padding:4px 10px;font-size:10px;color:var(--mt);font-family:var(--mo)">Nenhum</div>';
      return;
    }

    wrap.innerHTML = names.map(function (n) {
      return '<button class="ni" style="font-size:11.5px;padding:7px 11px" data-emp-name="'
        + encodeURIComponent(n) + '">' + U.htmlEsc(n) + '</button>';
    }).join('');

    wrap.querySelectorAll('[data-emp-name]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        ErrTrack.Nav.goTo('painel');
        ErrTrack.Dashboard.openDetail(decodeURIComponent(this.dataset.empName), ErrTrack.App.getDB());
      });
    });
  }

  return { render };

}());
