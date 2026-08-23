-- OdontoRec — Fase 1: schema base + RLS
-- Fonte do desenho de dados: odontorec-plano-producao.md

-- ------------------------------------------------------------------
-- Tabelas
-- ------------------------------------------------------------------

create table clinicas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_em timestamptz not null default now()
);

create table usuarios (
  id uuid primary key references auth.users(id),
  clinica_id uuid not null references clinicas(id),
  nome text not null,
  papel text not null check (papel in ('dentista', 'recepcao', 'admin')),
  cro text,
  criado_em timestamptz not null default now()
);

create table pacientes (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references clinicas(id),
  nome text not null,
  data_nascimento date,
  sexo text,
  cpf text,
  rg text,
  telefone text,
  email text,
  endereco text,
  profissao text,
  convenio text,
  contato_emergencia_nome text,
  contato_emergencia_telefone text,
  alergias text,
  condicoes_sistemicas text,
  medicamentos_em_uso text,
  observacoes_gerais text,
  dentes_deciduos boolean not null default false,
  criado_por uuid references usuarios(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table consentimentos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references pacientes(id),
  tipo text not null,
  aceito boolean not null,
  registrado_em timestamptz not null default now(),
  registrado_por uuid references usuarios(id)
);

create table agendamentos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references clinicas(id),
  paciente_id uuid not null references pacientes(id),
  dentista_id uuid not null references usuarios(id),
  data date not null,
  hora time not null,
  tipo text,
  status text not null default 'agendado'
    check (status in ('agendado','confirmado','concluido','cancelado')),
  observacoes text,
  criado_por uuid references usuarios(id),
  criado_em timestamptz not null default now()
);

create unique index idx_agendamento_sem_conflito
  on agendamentos (dentista_id, data, hora)
  where status <> 'cancelado';

create table prontuario_entradas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references pacientes(id),
  agendamento_id uuid references agendamentos(id),
  entrada_original_id uuid references prontuario_entradas(id),
  data date not null,
  queixa_principal text,
  anamnese text,
  prescricao text,
  observacoes text,
  criado_por uuid not null references usuarios(id),
  criado_em timestamptz not null default now()
);

create table prontuario_procedimentos (
  id uuid primary key default gen_random_uuid(),
  prontuario_entrada_id uuid not null references prontuario_entradas(id),
  dente integer not null,
  procedimento text not null,
  observacao text
);

create table odontograma_eventos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references pacientes(id),
  dente integer not null,
  condicao text not null,
  observacao text,
  prontuario_entrada_id uuid references prontuario_entradas(id),
  criado_por uuid not null references usuarios(id),
  criado_em timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id),
  acao text not null,
  entidade text,
  entidade_id uuid,
  detalhes jsonb,
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Funções auxiliares (security definer) para as policies de RLS
--
-- Evitam recursão: uma policy em `usuarios` que fizesse
-- `select clinica_id from usuarios where id = auth.uid()` diretamente
-- seria filtrada pela própria RLS que está tentando avaliar. Uma
-- função security definer roda com os privilégios do dono (bypassa
-- RLS internamente) só para essa checagem pontual.
-- ------------------------------------------------------------------

create function public.usuario_clinica_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select clinica_id from usuarios where id = auth.uid()
$$;

create function public.usuario_papel()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select papel from usuarios where id = auth.uid()
$$;

-- ------------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------------

alter table clinicas enable row level security;
alter table usuarios enable row level security;
alter table pacientes enable row level security;
alter table consentimentos enable row level security;
alter table agendamentos enable row level security;
alter table prontuario_entradas enable row level security;
alter table prontuario_procedimentos enable row level security;
alter table odontograma_eventos enable row level security;
alter table audit_log enable row level security;

-- clinicas: cada usuário só enxerga a própria clínica
create policy "usuarios veem a propria clinica"
  on clinicas for select
  using (id = usuario_clinica_id());

-- usuarios: equipe vê os colegas da mesma clínica
create policy "usuarios veem colegas da propria clinica"
  on usuarios for select
  using (clinica_id = usuario_clinica_id());

-- pacientes
create policy "usuarios veem pacientes da propria clinica"
  on pacientes for select
  using (clinica_id = usuario_clinica_id());

create policy "equipe da clinica cadastra pacientes"
  on pacientes for insert
  with check (
    clinica_id = usuario_clinica_id()
    and usuario_papel() in ('dentista','recepcao','admin')
  );

create policy "equipe da clinica edita pacientes"
  on pacientes for update
  using (
    clinica_id = usuario_clinica_id()
    and usuario_papel() in ('dentista','recepcao','admin')
  );

create policy "admin remove pacientes"
  on pacientes for delete
  using (
    clinica_id = usuario_clinica_id()
    and usuario_papel() = 'admin'
  );

-- consentimentos (segue o paciente)
create policy "equipe ve consentimentos da propria clinica"
  on consentimentos for select
  using (
    exists (
      select 1 from pacientes
      where pacientes.id = consentimentos.paciente_id
        and pacientes.clinica_id = usuario_clinica_id()
    )
  );

create policy "equipe registra consentimentos"
  on consentimentos for insert
  with check (
    exists (
      select 1 from pacientes
      where pacientes.id = consentimentos.paciente_id
        and pacientes.clinica_id = usuario_clinica_id()
    )
  );

-- agendamentos
create policy "usuarios veem agendamentos da propria clinica"
  on agendamentos for select
  using (clinica_id = usuario_clinica_id());

create policy "equipe da clinica cria agendamentos"
  on agendamentos for insert
  with check (
    clinica_id = usuario_clinica_id()
    and usuario_papel() in ('dentista','recepcao','admin')
  );

create policy "equipe da clinica edita agendamentos"
  on agendamentos for update
  using (
    clinica_id = usuario_clinica_id()
    and usuario_papel() in ('dentista','recepcao','admin')
  );

create policy "equipe da clinica remove agendamentos"
  on agendamentos for delete
  using (
    clinica_id = usuario_clinica_id()
    and usuario_papel() in ('dentista','recepcao','admin')
  );

-- prontuario_entradas: só dentista/admin, e nunca update/delete pelo app
-- (append-only — nenhuma policy de update/delete é criada de propósito)
create policy "dentista/admin ve prontuario da propria clinica"
  on prontuario_entradas for select
  using (
    exists (
      select 1 from pacientes
      where pacientes.id = prontuario_entradas.paciente_id
        and pacientes.clinica_id = usuario_clinica_id()
    )
  );

create policy "dentista/admin cria entradas de prontuario"
  on prontuario_entradas for insert
  with check (
    usuario_papel() in ('dentista','admin')
    and exists (
      select 1 from pacientes
      where pacientes.id = prontuario_entradas.paciente_id
        and pacientes.clinica_id = usuario_clinica_id()
    )
  );

-- prontuario_procedimentos: segue a entrada de prontuário (também append-only)
create policy "dentista/admin ve procedimentos da propria clinica"
  on prontuario_procedimentos for select
  using (
    exists (
      select 1 from prontuario_entradas pe
      join pacientes on pacientes.id = pe.paciente_id
      where pe.id = prontuario_procedimentos.prontuario_entrada_id
        and pacientes.clinica_id = usuario_clinica_id()
    )
  );

create policy "dentista/admin registra procedimentos"
  on prontuario_procedimentos for insert
  with check (
    usuario_papel() in ('dentista','admin')
    and exists (
      select 1 from prontuario_entradas pe
      join pacientes on pacientes.id = pe.paciente_id
      where pe.id = prontuario_procedimentos.prontuario_entrada_id
        and pacientes.clinica_id = usuario_clinica_id()
    )
  );

-- odontograma_eventos: histórico append-only, mesmo padrão
create policy "equipe ve odontograma da propria clinica"
  on odontograma_eventos for select
  using (
    exists (
      select 1 from pacientes
      where pacientes.id = odontograma_eventos.paciente_id
        and pacientes.clinica_id = usuario_clinica_id()
    )
  );

create policy "dentista/admin registra evento de odontograma"
  on odontograma_eventos for insert
  with check (
    usuario_papel() in ('dentista','admin')
    and exists (
      select 1 from pacientes
      where pacientes.id = odontograma_eventos.paciente_id
        and pacientes.clinica_id = usuario_clinica_id()
    )
  );

-- audit_log: cada usuário só grava/lê o log da propria clinica (via usuario_id)
create policy "admin ve audit log da propria clinica"
  on audit_log for select
  using (
    usuario_papel() = 'admin'
    and exists (
      select 1 from usuarios u
      where u.id = audit_log.usuario_id
        and u.clinica_id = usuario_clinica_id()
    )
  );

create policy "sistema registra audit log do proprio usuario"
  on audit_log for insert
  with check (usuario_id = auth.uid());
