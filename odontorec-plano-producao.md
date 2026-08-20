# OdontoRec — Plano de evolução para produção

## 1. Por que sair do artifact

O protótipo atual roda inteiramente no navegador, com os dados salvos numa
chave-valor pessoal ligada à sua conta. Isso significa:

- Nenhum outro computador/usuário da clínica vê os mesmos pacientes.
- Não há login, nem perfis de acesso (dentista, recepção).
- Editar um atendimento sobrescreve o registro anterior — o Conselho Federal
  de Odontologia exige que o prontuário seja **complementável, mas não
  reescrito**.
- Não há criptografia, backup automático, nem trilha de auditoria — exigidos
  para dado sensível de saúde pela LGPD.

Resolver isso exige um backend real (banco de dados + API + autenticação).

## 2. Arquitetura recomendada

Para uma clínica pequena/média, o caminho mais rápido e sustentável é:

```
┌─────────────────┐        ┌──────────────────────────┐
│  Frontend React  │ <----> │  Supabase (Postgres +     │
│  (a UI que já    │  API   │  Auth + Row Level         │
│  temos, adaptada)│        │  Security + Storage)      │
└─────────────────┘        └──────────────────────────┘
```

**Por que Supabase (ou equivalente gerenciado) em vez de servidor 100% custom:**
- Banco Postgres real, com backup automático e criptografia em repouso.
- Autenticação pronta (e-mail/senha, recuperação de senha, sessões).
- **Row Level Security (RLS)**: você define no banco quem pode ver/editar
  cada linha — ex: só usuários da clínica X veem pacientes da clínica X.
  Isso evita reimplementar controle de acesso manualmente no backend.
- Reduz drasticamente a superfície de código que você precisa manter e
  proteger — menos risco de vulnerabilidade em dado sensível.

Se no futuro a clínica crescer muito (múltiplas unidades, integrações
complexas), dá para migrar para um backend 100% custom sem jogar fora o
frontend.

## 3. Modelo de dados (schema SQL — Postgres/Supabase)

Pontos de design importantes:
- `prontuario_entradas` é **append-only**: nunca faça `UPDATE` nela pelo
  app. Uma "correção" cria uma nova linha referenciando `entrada_original_id`.
- `odontograma_eventos` guarda o **histórico de mudanças** dente a dente;
  o estado atual do odontograma é sempre a última entrada por dente.
- Toda tabela clínica tem `criado_por` e `criado_em` para auditoria.
- `pacientes.clinica_id` isola dados entre clínicas caso o sistema atenda
  mais de uma unidade no futuro (multi-tenant).

```sql
-- Clínicas / unidades (permite crescer para mais de uma unidade)
create table clinicas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_em timestamptz not null default now()
);

-- Usuários da equipe (dentistas, recepção, admin)
create table usuarios (
  id uuid primary key references auth.users(id),
  clinica_id uuid not null references clinicas(id),
  nome text not null,
  papel text not null check (papel in ('dentista', 'recepcao', 'admin')),
  cro text, -- registro no Conselho Regional de Odontologia, se dentista
  criado_em timestamptz not null default now()
);

-- Pacientes
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

-- Consentimento LGPD (obrigatório para dado sensível de saúde)
create table consentimentos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references pacientes(id),
  tipo text not null, -- ex: 'tratamento_dados', 'uso_imagem'
  aceito boolean not null,
  registrado_em timestamptz not null default now(),
  registrado_por uuid references usuarios(id)
);

-- Agendamentos
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

-- Evita dois agendamentos no mesmo horário para o mesmo dentista
create unique index idx_agendamento_sem_conflito
  on agendamentos (dentista_id, data, hora)
  where status <> 'cancelado';

-- Prontuário — append-only, nunca dá UPDATE/DELETE pelo app
create table prontuario_entradas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references pacientes(id),
  agendamento_id uuid references agendamentos(id),
  entrada_original_id uuid references prontuario_entradas(id), -- se for correção de outra entrada
  data date not null,
  queixa_principal text,
  anamnese text,
  prescricao text,
  observacoes text,
  criado_por uuid not null references usuarios(id), -- dentista responsável
  criado_em timestamptz not null default now()
);

-- Procedimentos realizados em cada atendimento
create table prontuario_procedimentos (
  id uuid primary key default gen_random_uuid(),
  prontuario_entrada_id uuid not null references prontuario_entradas(id),
  dente integer not null,
  procedimento text not null,
  observacao text
);

-- Histórico do odontograma (o estado atual = última linha por dente)
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

-- Trilha de auditoria geral (login, exportações, exclusões solicitadas via LGPD)
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id),
  acao text not null,
  entidade text,
  entidade_id uuid,
  detalhes jsonb,
  criado_em timestamptz not null default now()
);
```

### Row Level Security (exemplo)

```sql
alter table pacientes enable row level security;

create policy "usuarios veem pacientes da propria clinica"
  on pacientes for select
  using (
    clinica_id in (
      select clinica_id from usuarios where id = auth.uid()
    )
  );

create policy "apenas dentista/admin edita pacientes"
  on pacientes for update
  using (
    exists (
      select 1 from usuarios
      where id = auth.uid()
        and clinica_id = pacientes.clinica_id
        and papel in ('dentista','admin')
    )
  );
```

(Políticas equivalentes se repetem para `agendamentos`, `prontuario_entradas`
etc. — dentista vê/edita tudo da clínica, recepção só mexe em pacientes e
agenda, não em prontuário clínico.)

## 4. Roteiro de implementação (fases)

**Fase 1 — Fundação**
- Criar projeto Supabase, aplicar o schema acima.
- Autenticação: login por e-mail/senha, um usuário por membro da equipe.
- Migrar o frontend atual para consumir a API do Supabase em vez de
  `window.storage`.

**Fase 2 — Prontuário e odontograma auditáveis**
- Trocar "editar registro" por "criar nova entrada" (com referência à
  entrada original, se for correção).
- Odontograma como histórico de eventos, com o estado atual calculado.

**Fase 3 — LGPD**
- Tela de consentimento no cadastro do paciente.
- Endpoint/rotina de exportação e exclusão de dados do paciente
  (direitos do titular).
- Log de auditoria de acessos e exportações.

**Fase 4 — Operação da clínica**
- Impedir conflito de horário na agenda (já modelado no schema acima).
- Perfis de acesso (dentista / recepção / admin) refletidos na UI.
- Backups automáticos (o Supabase já oferece; validar frequência/retention).

**Fase 5 — Deploy**
- Hospedar o frontend (Vercel, Netlify ou similar).
- Domínio próprio + HTTPS.
- Ambiente de homologação separado do de produção.

## 5. Próximo passo prático

Este é um projeto de múltiplos arquivos com backend, banco de dados e deploy
contínuo — o ambiente ideal para isso é o **Claude Code**, que trabalha
diretamente no seu repositório de código, mantém o projeto ao longo do
tempo e pode rodar comandos de setup/deploy. Este chat consegue seguir
ajudando no design e no código, mas a construção contínua fica mais robusta
lá.
