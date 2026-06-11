/* ============================================================
   ErrTrack — Config Module
   Constantes globais da aplicação. Não possui dependências —
   deve ser o primeiro script carregado.
   ============================================================ */

'use strict';

var ErrTrack = ErrTrack || {};

ErrTrack.Config = {

  /* Chave usada no localStorage para o banco de dados */
  STORAGE_KEY: 'errtrack_db_v1',

  /* Chave usada no localStorage para o tema (dark/light) */
  STORAGE_THEME_KEY: 'errtrack_theme',

  /* Duração (ms) que o toast fica visível */
  TOAST_DURATION: 3000,

  /* Definição das gravidades: rótulo, peso (para médias) e
     sufixo de classe CSS (.s-xx, .d-xx, .so.a-xx) */
  SEVERITY: {
    baixa:   { label: 'Baixa',   weight: 1, css: 'bx' },
    media:   { label: 'Média',   weight: 2, css: 'md' },
    alta:    { label: 'Alta',    weight: 3, css: 'al' },
    critica: { label: 'Crítica', weight: 4, css: 'cr' }
  },

  /* Ordem padrão das gravidades (do menor para o maior impacto) */
  SEVERITY_ORDER: ['baixa', 'media', 'alta', 'critica'],

  /* Gravidade usada quando nenhuma é informada/reconhecida */
  DEFAULT_SEVERITY: 'media'

};
