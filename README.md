# Site — Jônatas Melo Personal Trainer

Site institucional em página única com rolagem (`index.html`) + área de treino
por dia da semana (`treino.html`).

## Estrutura
```
site-jonatas-melo/
├── index.html          → site principal (hero, trabalho, resultados, planos, contato)
├── treino.html          → área de treino, dividida por dia da semana
├── css/
│   ├── style.css        → tokens de cor/tipografia + estilos do site principal
│   └── treino.css       → estilos específicos da área de treino
├── js/
│   ├── script.js         → barra de progresso, contadores e animações de rolagem
│   └── treino.js         → alternância entre os dias da semana
└── assets/               → onde entram fotos, logo e vídeos (pasta ainda vazia)
```

## O que ainda precisa ser substituído
Tudo o que está com `assets/algumacoisa.jpg` ou `.mp4` é placeholder — as imagens
ainda não existem na pasta. Basta colocar os arquivos reais em `assets/` com o
mesmo nome (ou trocar o `src` no HTML):

- `assets/logo-jonatas.png` — a logo em PNG/SVG com fundo transparente (a foto
  que você mandou é print de um Reels; se puder, peça pra quem fez a arte o
  arquivo original em alta resolução)
- `assets/foto-hero.jpg` — foto do Jônatas para o painel inicial
- `assets/foto-treino-bg.jpg` — foto de fundo da página de treino
- `assets/resultado-1.jpg` a `resultado-4.jpg` — fotos de resultados (2ª página)
- `assets/caso-1.jpg` a `caso-3.jpg` — fotos de antes/depois (3ª página)
- `assets/exercicios/*.mp4` + `assets/video-poster-*.jpg` — vídeos e capas de
  cada exercício na área de treino

Também é preciso ajustar:
- **Número de WhatsApp**: procure por `5500000000000` em `index.html` e
  `treino.html` e troque pelo número real, no formato `55DDNÚMERO` (ex:
  `5581999999999`)
- **Valores dos planos**: em `index.html`, seção `#planos`, troque `R$ XXX`
  pelos valores reais de cada plano (2x, 3x, 5x por semana)
- **Depoimentos**: em `index.html`, seção `#resultados`, troque os textos e
  nomes de exemplo pelos depoimentos reais dos alunos
- **Treinos de terça a sábado**: em `treino.html`, cada dia (exceto segunda)
  está com um aviso "em montagem" — copie o padrão do bloco de segunda-feira
  (`<article class="exercise">`) pra cada exercício real

## Como abrir
Não precisa de servidor nem instalação — só abrir `index.html` no navegador,
ou usar a extensão **Live Server** no VS Code pra já ver atualizando ao vivo
enquanto edita.

## Paleta usada (tirada da logo)
- Preto de fundo: `#0A0A0B`
- Preto de seção: `#131315`
- Vermelho de destaque: `#E5231B`
- Branco de texto: `#F5F4F0`
- Cinza de apoio: `#9A9A9E`

Tipografia: **Anton** (títulos, bem impactante, combina com a pegada da logo)
+ **Inter** (texto corrido), ambas do Google Fonts — já linkadas no `<head>`.

## Sistema de alunos (login, treino personalizado, progresso)

Usa o [Supabase](https://supabase.com) como banco de dados e autenticação —
não precisa de servidor próprio.

### Arquivos novos
```
├── login.html            → tela de login (aluno e Jônatas usam a mesma)
├── area-aluno.html        → treino do aluno + registro de peso/progresso
├── admin.html              → painel do Jônatas: cadastra treino, vê progresso
├── sql/schema.sql          → script pra rodar UMA VEZ no Supabase (cria as tabelas)
├── css/auth.css, css/app.css
└── js/supabase-config.js, js/auth.js, js/area-aluno.js, js/admin.js
```

### Configuração inicial (fazer uma vez)
1. No Supabase, abra **SQL Editor → New query**, cole o conteúdo de
   `sql/schema.sql` e rode. Isso cria as tabelas `profiles`, `treinos` e
   `progresso`, já com as regras de segurança (cada aluno só vê o próprio
   treino e progresso; o Jônatas vê e edita tudo).
2. `js/supabase-config.js` já está com a URL e a chave do projeto do
   Jônatas configuradas.

### Cadastrando o Jônatas como admin
1. Supabase → **Authentication → Users → Add user** → cria com e-mail/senha
   do próprio Jônatas
2. No SQL Editor, rode (trocando o e-mail):
   ```sql
   insert into profiles (id, nome, is_admin)
   select id, 'Jônatas Melo', true
   from auth.users where email = 'email-do-jonatas@exemplo.com';
   ```
3. Ele já pode logar em `login.html` e cai direto no `admin.html`

### Cadastrando um aluno novo
1. Supabase → **Authentication → Users → Add user** → e-mail/senha do aluno
   (essa senha inicial é combinada com o aluno por fora, ex: WhatsApp)
2. No SQL Editor:
   ```sql
   insert into profiles (id, nome, is_admin)
   select id, 'Nome do Aluno', false
   from auth.users where email = 'email-do-aluno@exemplo.com';
   ```
3. O aluno já aparece na lista lateral do `admin.html` — o Jônatas monta o
   treino dele por lá (dia da semana, exercício, séries/repetições, link do
   vídeo)
4. O aluno loga em `login.html` com esse e-mail/senha e cai em
   `area-aluno.html`, vendo só o próprio treino

### Vídeos dos exercícios
No painel admin, o campo "Link do vídeo" aceita qualquer URL direta de vídeo
(ex: um arquivo `.mp4` hospedado, ou um link do Supabase Storage). Links do
YouTube não tocam direto assim — se quiser usar YouTube, me avise que ajusto
o código pra embutir o player certo.

### Importante sobre a chave do Supabase
A chave em `js/supabase-config.js` é a **publicável** (`sb_publishable_...`),
feita pra ficar exposta no código do site — a segurança de verdade está nas
regras (RLS) criadas pelo `schema.sql`. **Nunca** coloque a chave
`service_role` em nenhum arquivo do site — essa dá acesso total ao banco,
sem restrição nenhuma.
