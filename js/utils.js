/* ============================================================
   ErrTrack — Utils Module
   Funções auxiliares puras: escape de HTML, datas, ids,
   gravidades e reconhecimento de texto livre.
   Depende apenas de Config.
   ============================================================ */

'use strict';

var ErrTrack = ErrTrack || {};

ErrTrack.Utils = (function () {

  var SEV = ErrTrack.Config.SEVERITY;

  /* ── Strings / HTML ────────────────────────────────── */

  /**
   * Escapa caracteres especiais de HTML para evitar injeção.
   * @param {*} str
   * @returns {string}
   */
  function htmlEsc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Gera um id único simples baseado em timestamp + aleatório.
   * @returns {string}
   */
  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* ── Datas ─────────────────────────────────────────── */

  /**
   * Retorna a data/hora atual em ISO 8601.
   * @returns {string}
   */
  function nowISO() {
    return new Date().toISOString();
  }

  /**
   * Formata uma data ISO para o padrão dd/mm/aaaa.
   * @param {string} iso
   * @returns {string}
   */
  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var yy = d.getFullYear();
    return dd + '/' + mm + '/' + yy;
  }

  /* ── Gravidade ─────────────────────────────────────── */

  /**
   * Retorna os metadados de uma gravidade (label, weight, css).
   * Usa a gravidade padrão se a informada for inválida.
   * @param {string} sev
   * @returns {{label:string, weight:number, css:string}}
   */
  function sevInfo(sev) {
    return SEV[sev] || SEV[ErrTrack.Config.DEFAULT_SEVERITY];
  }

  /** @returns {string} Rótulo legível da gravidade ('Baixa', 'Crítica'...) */
  function sevLabel(sev) {
    return sevInfo(sev).label;
  }

  /** @returns {string} Sufixo de classe CSS ('bx', 'md', 'al', 'cr') */
  function sevClass(sev) {
    return sevInfo(sev).css;
  }

  /** @returns {number} Peso numérico da gravidade (1 a 4) */
  function sevWeight(sev) {
    return sevInfo(sev).weight;
  }

  /**
   * Calcula a média aritmética de um array de números.
   * @param {number[]} arr
   * @returns {number}
   */
  function average(arr) {
    if (!arr || !arr.length) return 0;
    var sum = arr.reduce(function (a, b) { return a + b; }, 0);
    return sum / arr.length;
  }

  /**
   * Tenta detectar a gravidade a partir de um trecho de texto livre,
   * procurando por palavras-chave conhecidas.
   * @param {string} text
   * @returns {string} 'baixa' | 'media' | 'alta' | 'critica'
   */
  function detectSeverity(text) {
    var t = (text || '').toLowerCase();

    if (/cr[ií]tic|urgente|gravíssim/.test(t)) return 'critica';
    if (/\balt[ao]\b|grave|s[ée]rio/.test(t))   return 'alta';
    if (/m[ée]di[ao]|moderad/.test(t))          return 'media';
    if (/baix[ao]|leve|simples/.test(t))        return 'baixa';

    return ErrTrack.Config.DEFAULT_SEVERITY;
  }

  /**
   * Quebra um bloco de texto colado em linhas não vazias.
   * @param {string} text
   * @returns {string[]}
   */
  function splitLines(text) {
    return (text || '')
      .split(/\r?\n/)
      .map(function (l) { return l.trim(); })
      .filter(Boolean);
  }

  return {
    htmlEsc: htmlEsc,
    genId: genId,
    nowISO: nowISO,
    formatDate: formatDate,
    sevInfo: sevInfo,
    sevLabel: sevLabel,
    sevClass: sevClass,
    sevWeight: sevWeight,
    average: average,
    detectSeverity: detectSeverity,
    splitLines: splitLines
  };

}());
