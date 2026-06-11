/* ============================================================
   ErrTrack — Storage Module
   Camada de persistência. Isola todo acesso ao localStorage.
   Outros módulos não devem tocar em localStorage diretamente.
   ============================================================ */

'use strict';

var ErrTrack = ErrTrack || {};

ErrTrack.Storage = (function () {

  var KEY = ErrTrack.Config.STORAGE_KEY;

  /**
   * Carrega o banco de dados do localStorage.
   * @returns {Object} DB object ou {} em caso de erro/vazio.
   */
  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch (e) {
      console.error('[ErrTrack.Storage] Falha ao carregar DB:', e);
      return {};
    }
  }

  /**
   * Persiste o banco de dados no localStorage.
   * @param {Object} db
   * @returns {boolean} true se bem-sucedido.
   */
  function save(db) {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
      return true;
    } catch (e) {
      console.error('[ErrTrack.Storage] Falha ao salvar DB:', e);
      ErrTrack.UI.toast('Erro ao salvar dados localmente.', 'er');
      return false;
    }
  }

  /**
   * Apaga todos os dados do localStorage.
   */
  function clear() {
    localStorage.removeItem(KEY);
  }

  /**
   * Retorna o tema salvo ('dark' ou 'light').
   * @returns {string}
   */
  function getTheme() {
    return localStorage.getItem(ErrTrack.Config.STORAGE_THEME_KEY) || 'dark';
  }

  /**
   * Salva o tema escolhido.
   * @param {string} theme - 'dark' ou 'light'
   */
  function setTheme(theme) {
    localStorage.setItem(ErrTrack.Config.STORAGE_THEME_KEY, theme);
  }

  return { load, save, clear, getTheme, setTheme };

}());
