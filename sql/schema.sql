cat /home/claude/site-jonatas-melo/sql/schema.sql | head -5

-- ============================================================
-- Jônatas Melo Personal Trainer — Estrutura do banco (Supabase)
-- Rode este script uma vez em: Supabase → SQL Editor → New query
-- ============================================================

-- 1. Perfis dos alunos (e do Jônatas como admin)
-- Cada linha aqui está ligada a um usuário criado em Authentication > Users
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Cada pessoa só vê/edita o próprio perfil; admin vê todos
create policy "Ver o próprio perfil"
  on profiles for select
  using (auth.uid() = id);

create policy "Admin vê todos os perfis"
  on profiles for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "Admin cria perfis"
  on profiles for insert
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));


-- 2. Treinos — cada linha é UM exercício de UM aluno em UM dia da semana
create table treinos (
  id bigint generated always as identity primary key,
  aluno_id uuid references profiles(id) on delete cascade not null,
  dia_semana text not null check (dia_semana in ('seg','ter','qua','qui','sex','sab','dom')),
  exercicio text not null,
  series_reps text not null,       -- ex: "4x10"
  observacao text,
  video_url text,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

alter table treinos enable row level security;

create policy "Aluno vê o próprio treino"
  on treinos for select
  using (auth.uid() = aluno_id);

create policy "Admin gerencia todos os treinos"
  on treinos for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));


-- 3. Progresso — registros de peso/medidas ao longo do tempo
create table progresso (
  id bigint generated always as identity primary key,
  aluno_id uuid references profiles(id) on delete cascade not null,
  data date not null default current_date,
  peso_kg numeric(5,2),
  observacao text,
  created_at timestamptz not null default now()
);

alter table progresso enable row level security;

create policy "Aluno vê o próprio progresso"
  on progresso for select
  using (auth.uid() = aluno_id);

create policy "Aluno registra o próprio progresso"
  on progresso for insert
  with check (auth.uid() = aluno_id);

create policy "Admin vê o progresso de todos"
  on progresso for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));


-- ============================================================
-- PRÓXIMO PASSO (fazer manualmente, fora deste script):
--
-- 1. Vá em Authentication → Users → Add user
--    Crie o usuário do PRÓPRIO JÔNATAS primeiro (e-mail + senha)
--
-- 2. Volte aqui no SQL Editor e rode (trocando o e-mail):
--
--    insert into profiles (id, nome, is_admin)
--    select id, 'Jônatas Melo', true
--    from auth.users where email = 'email-do-jonatas@exemplo.com';
--
-- 3. Pra cada aluno novo: Authentication → Users → Add user
--    Depois rode (trocando e-mail e nome):
--
--    insert into profiles (id, nome, is_admin)
--    select id, 'Nome do Aluno', false
--    from auth.users where email = 'email-do-aluno@exemplo.com';
-- ============================================================
