/* ============================================================
   ErrTrack — UI Module
   Primitivos de UI: toast, tema e navegação mobile.
   ============================================================ */

'use strict';

var ErrTrack = ErrTrack || {};

ErrTrack.UI = (function () {

  var _toastTimer = null;

  /* ── Toast ─────────────────────────────────────────── */

  /**
   * Exibe uma notificação toast na tela.
   * @param {string} msg   - Mensagem a exibir
   * @param {'ok'|'er'|'wn'} type - Tipo: ok (verde), er (vermelho), wn (amarelo)
   */
  function toast(msg, type) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast on t-' + (type || 'ok');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () {
      t.classList.remove('on');
    }, ErrTrack.Config.TOAST_DURATION);
  }

  /* ── Theme ─────────────────────────────────────────── */

  /**
   * Aplica um tema ao body e atualiza o ícone do botão.
   * @param {'dark'|'light'} theme
   */
  function applyTheme(theme) {
    var btn = document.getElementById('theme-btn');
    if (theme === 'light') {
      document.body.classList.add('light');
      if (btn) btn.textContent = '☀️';
    } else {
      document.body.classList.remove('light');
      if (btn) btn.textContent = '🌙';
    }
  }

  /**
   * Inicializa o toggle de tema e carrega o tema salvo.
   */
  function initTheme() {
    var saved = ErrTrack.Storage.getTheme();
    applyTheme(saved);

    var btn = document.getElementById('theme-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        var isLight = document.body.classList.contains('light');
        var next = isLight ? 'dark' : 'light';
        applyTheme(next);
        ErrTrack.Storage.setTheme(next);
      });
    }
  }

  /* ── Mobile Sidebar ────────────────────────────────── */

  /**
   * Inicializa o comportamento da sidebar mobile (drawer).
   */
  function initMobileSidebar() {
    var mBtn    = document.getElementById('mobile-menu');
    var overlay = document.getElementById('sidebar-overlay');
    var sidebar = document.getElementById('sidebar');

    function closeSidebar() {
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('on');
    }

    if (mBtn) {
      mBtn.addEventListener('click', function () {
        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('on');
      });
    }
    if (overlay) overlay.addEventListener('click', closeSidebar);

    return { closeSidebar };
  }

  return { toast, applyTheme, initTheme, initMobileSidebar };

}());
