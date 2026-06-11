# ErrTrack — Painel da Equipe

Painel de QA para registrar, importar e acompanhar erros por funcionário,
com dashboard, gráficos (Chart.js) e tema claro/escuro. Os dados ficam
salvos no `localStorage` do navegador e podem ser exportados/importados
em `.json` para compartilhar com a equipe (aba **Sincronizar**).

## Estrutura do projeto

```
index.html
css/
  variables.css   (tokens de cor, tipografia)
  theme.css       (tema claro/escuro)
  layout.css      (grid principal, sidebar)
  components.css  (componentes da UI)
  responsive.css  (breakpoints)
js/
  config.js       (constantes)
  storage.js      (acesso ao localStorage)
  utils.js        (helpers: datas, gravidades, parsing)
  ui.js           (toast, tema, sidebar mobile)
  sidebar.js      (lista de funcionários)
  dashboard.js    (KPIs, grade, detalhe, gráfico)
  nav.js          (troca de páginas/abas)
  form.js         (registrar erro / colar dados)
  sync.js         (exportar/importar/apagar dados)
  app.js          (bootstrap — inicializa tudo na ordem certa)
server.js         (servidor estático Node, sem dependências)
render.yaml       (configuração de deploy no Render)
```

## Rodando localmente

Não precisa de build nem dependências. Duas opções:

```bash
# Opção 1: servidor incluso
node server.js
# abre em http://localhost:3000

# Opção 2: qualquer servidor estático (ex: Live Server do VS Code,
# python -m http.server, etc.) — basta abrir index.html via servidor
# (não funciona com file:// por causa do fetch de CSS/JS por módulos).
```

## Deploy no Render via GitHub

1. Suba esta pasta inteira para um repositório no GitHub.
2. No [Render](https://dashboard.render.com), clique em **New +** →
   **Web Service** (ou **Blueprint**, que vai ler o `render.yaml`
   automaticamente).
3. Conecte o repositório.
4. Configurações (caso não use o Blueprint):
   - **Environment**: Node
   - **Build Command**: deixe em branco
   - **Start Command**: `node server.js`
5. Clique em **Create Web Service**. Pronto — o Render vai instalar (nada
   a instalar), iniciar o servidor e expor uma URL pública.

> Alternativa mais simples: no Render, criar um **Static Site** apontando
> para a raiz do repositório, com **Build Command** vazio e **Publish
> Directory** = `.` — também funciona, pois o app é 100% estático
> (HTML/CSS/JS), sem backend de verdade.

## O que foi corrigido neste pacote

O `.zip` original veio com os arquivos completamente embaralhados:
extensões trocadas (um `.html` era na verdade uma imagem JPEG, um `.css`
era um PNG), conteúdos de CSS/JS com nomes errados, e **5 módulos
JavaScript inteiros estavam faltando** (`config.js`, `utils.js`,
`dashboard.js`, `form.js`, `sync.js`). Esses 5 módulos foram reescritos do
zero com base no `index.html`/CSS originais (IDs, classes e fluxo de
chamadas entre módulos), reproduzindo as funcionalidades:

- **Painel Geral**: KPIs (total, críticos, piorando, melhorando), grade de
  funcionários, tela de detalhe com gráfico de gravidade por período e
  histórico de erros (com exclusão).
- **Registrar Erro**: formulário com seletor de gravidade.
- **Colar Dados**: importação por texto livre, detectando o período, a
  descrição e a gravidade automaticamente.
- **Sincronizar**: exportar `.json`, importar (mesclando), substituir tudo
  ou apagar tudo.

Como esses módulos são uma reimplementação (o original não veio no zip),
vale revisar o comportamento depois do deploy e me avisar se algo precisa
funcionar diferente — ajusto rapidinho.
