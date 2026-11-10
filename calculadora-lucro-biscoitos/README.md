# Minha Calculadora de Lucro — Biscoitos de Natal

Mini aplicativo web para calcular custo de produção, preço de venda e lucro
estimado na venda de biscoitos de Natal. Feito para ser oferecido como Order
Bump do produto **Renda Extra com Biscoitos de Natal**.

- 100% HTML + CSS + JavaScript puro, sem frameworks e sem dependências externas.
- Funciona como site estático — sem backend, sem banco de dados.
- Todos os dados ficam salvos **só no navegador da pessoa** (`localStorage`).
  Nada é enviado para nenhum servidor.

## Arquivos

- `index.html` — estrutura das telas (entrada, ingredientes, receita, preço,
  resultados, histórico).
- `style.css` — identidade visual natalina (verde-escuro, vermelho, dourado,
  cantos arredondados, layout responsivo para celular/tablet/computador).
- `script.js` — toda a lógica: cálculo proporcional de custo de ingredientes,
  cálculo de receita, formação de preço (margem vs. taxas), painel de
  resultados, histórico, e exportar/importar/apagar dados.

## Como testar no seu computador, antes de publicar

Não precisa de nenhuma instalação. Basta abrir o arquivo `index.html` direto
no navegador (duplo clique nele, ou arraste pro Chrome/Firefox). Todas as
telas e cálculos funcionam normalmente abrindo o arquivo localmente.

## Como testar no celular (antes de publicar)

Enquanto o site ainda não está publicado, a forma mais simples de ver no
celular é:

1. Publicar primeiro no GitHub Pages (passo a passo abaixo) — leva poucos
   minutos e gera um link público.
2. Abrir esse link no navegador do celular (Chrome ou Safari).
3. Testar: cadastrar um ingrediente, calcular uma receita, calcular um preço
   de venda, conferir se os botões respondem bem ao toque e se o texto está
   confortável de ler sem precisar dar zoom.

## Como publicar no GitHub Pages

Isso eu não posso fazer sozinho — publicar depende da sua conta do GitHub, e
eu não tenho acesso a ela. Aqui está o passo a passo exato para você (ou
alguém de confiança) publicar:

1. **Crie uma conta no GitHub**, se ainda não tiver: https://github.com/signup
2. **Crie um novo repositório**:
   - Clique em "New repository".
   - Dê um nome, por exemplo `calculadora-lucro-biscoitos`.
   - Deixe como "Public" (precisa ser público para o GitHub Pages gratuito
     funcionar sem assinatura paga).
   - Não marque nenhuma opção de "adicionar README" (já temos um).
3. **Envie os 4 arquivos** (`index.html`, `style.css`, `script.js`,
   `README.md`) para esse repositório:
   - Mais fácil: na página do repositório recém-criado, clique em
     "uploading an existing file" e arraste os 4 arquivos.
   - Clique em "Commit changes" para salvar.
4. **Ative o GitHub Pages**:
   - No repositório, vá em "Settings" (Configurações).
   - No menu lateral, clique em "Pages".
   - Em "Source", selecione a branch `main` (ou `master`) e a pasta `/root`.
   - Clique em "Save".
5. **Aguarde 1 a 2 minutos.** O GitHub mostra o link público do site nessa
   mesma tela, algo como:
   `https://SEU-USUARIO.github.io/calculadora-lucro-biscoitos/`
6. **Abra esse link** no computador e no celular para conferir se tudo
   funciona, antes de divulgar ou entregar como bônus.

Se preferir, eu também posso publicar diretamente para você, desde que me dê
acesso a um repositório do GitHub (me diga o nome de usuário/organização e o
nome do repositório, ou peça para conectar sua conta do GitHub a esta
conversa). Só depois de eu confirmar que a publicação realmente aconteceu e
que o link está no ar é que vou te passar o link como pronto — não vou dizer
que está publicado sem ter certeza.

## Privacidade e dados

O aplicativo não tem login, não tem cadastro de conta e não envia nenhuma
informação para fora do navegador da pessoa. Tudo (nome, ingredientes,
receitas, cálculos) fica guardado localmente, no próprio celular ou
computador de quem está usando.

Dentro do app, no ícone de cadeado (🔒) no topo, a pessoa pode:
- **Exportar os dados** em um arquivo `.json` (um backup para guardar ou
  levar para outro aparelho).
- **Importar dados** de um arquivo `.json` exportado anteriormente.
- **Apagar todos os dados** salvos naquele navegador.

## O que foi testado

Antes de entregar, o fluxo completo foi testado automaticamente num
navegador (Chromium), incluindo:
- Cadastro, edição e exclusão de ingredientes.
- Cálculo de receita com conversão de unidades (ex: ingrediente comprado em
  kg, usado em gramas na receita).
- Formação de preço com margem de lucro e taxas adicionais, usando a fórmula
  `preço de venda = custo total ÷ (1 − margem − taxas)`.
- Painel de resultados e histórico (abrir, duplicar, excluir receitas).
- Exportar e importar dados (round-trip completo).
- Validação de campos vazios e números negativos.
- Layout em tela de celular (390px) e de computador (1280px).

Nenhum erro de JavaScript apareceu no console em nenhum desses testes.
