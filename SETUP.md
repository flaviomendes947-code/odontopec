# OdontoRec — Setup da Fase 1 (Supabase + autenticação)

Passo a passo para colocar o projeto rodando localmente contra um backend
Supabase de verdade.

## 1. Criar o projeto no Supabase

1. Acesse https://supabase.com e crie uma conta (ou faça login).
2. Clique em **New project**.
3. Escolha a organização (ou crie uma), dê um nome ao projeto (ex:
   `odontorec`), defina uma senha forte para o banco (guarde-a — é
   diferente da anon key) e escolha uma região perto da clínica.
4. Aguarde o projeto terminar de provisionar (leva 1-2 minutos).

## 2. Pegar a URL e a chave pública (anon key)

Em **Project Settings → API**, copie:
- **Project URL**
- **anon public key**

## 3. Aplicar o schema do banco

Em **SQL Editor** (menu lateral do Supabase), abra uma nova query, cole o
conteúdo inteiro de `supabase/migrations/0001_init.sql` deste repositório
e clique em **Run**. Isso cria todas as tabelas, funções auxiliares e
políticas de Row Level Security.

(Quando entrarmos na Fase 5 — deploy — dá para trocar isso por
`supabase db push` via CLI, mantendo migrations versionadas. Por
enquanto, colar no SQL Editor é suficiente.)

## 4. Criar a primeira clínica e o primeiro usuário (admin)

Isso precisa ser feito manualmente porque decidimos que o cadastro de
equipe **não é público** — só o admin cria contas.

**4.1 — Criar a clínica.** No SQL Editor:

```sql
insert into clinicas (nome) values ('Nome da sua clínica') returning id;
```

Guarde o `id` retornado.

**4.2 — Criar o usuário de autenticação.** Em **Authentication → Users →
Add user**, crie o primeiro usuário (e-mail + senha) — normalmente o
dentista responsável ou quem vai administrar o sistema. Copie o **UUID**
desse usuário (aparece na lista de usuários).

**4.3 — Vincular esse login a um papel na clínica.** No SQL Editor:

```sql
insert into usuarios (id, clinica_id, nome, papel)
values (
  'uuid-do-usuario-criado-no-passo-4.2',
  'id-da-clinica-do-passo-4.1',
  'Nome completo',
  'admin'
);
```

Repita o passo 4.2 + 4.3 (com `papel` = `dentista` ou `recepcao`) para
cada pessoa da equipe.

## 5. Configurar as variáveis de ambiente locais

```bash
cp .env.example .env
```

Edite `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
com os valores do passo 2. Esse arquivo não vai para o git.

## 6. Rodar o projeto

```bash
npm install
npm run dev
```

Acesse o endereço mostrado no terminal e entre com o e-mail/senha
criados no passo 4.2.

## O que já funciona nesta fase

- Login/logout via Supabase Auth.
- Pacientes e Agenda lendo e gravando direto no Postgres do Supabase,
  com Row Level Security isolando os dados por clínica.
- Agenda bloqueia dois agendamentos no mesmo horário para o mesmo
  dentista (índice único no banco).

## O que ainda não persiste (Fase 2)

Prontuário e odontograma continuam funcionando na tela, mas só em
memória — eles ainda não gravam no banco. A estrutura append-only
exigida pelo Conselho Federal de Odontologia (`prontuario_entradas`,
`odontograma_eventos`) já existe no schema aplicado no passo 3, mas a
migração do frontend para usá-la é o escopo da Fase 2.
