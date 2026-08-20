# Contexto do projeto — OdontoRec

Cole este arquivo (ou seu conteúdo) como primeira mensagem no Claude Code
para retomar o projeto exatamente de onde paramos.

## O que já existe

Já construímos um **protótipo funcional em React** de um sistema de
prontuário odontológico, hoje rodando como artifact no claude.ai (arquivo
`dental-system.jsx` anexo a esta pasta). Ele cobre:

- Cadastro de pacientes (dados pessoais, contato de emergência, alergias,
  condições sistêmicas, convênio, dentição decídua vs. permanente).
- Agenda de atendimentos com status (agendado/confirmado/concluído/cancelado).
- Prontuário por paciente, com histórico de atendimentos (queixa, anamnese,
  procedimentos, prescrição).
- Odontograma interativo (32 dentes permanentes ou 20 decíduos, conforme o
  paciente), com condições por dente (cárie, restaurado, coroa, canal,
  implante, extraído, ausente, fratura, indicação de extração).
- Exportação/impressão do prontuário em PDF via impressão do navegador.
- Persistência hoje é só local (`window.storage`, específico do ambiente de
  artifact do claude.ai) — **isso precisa ser substituído** por um backend
  real, que é o objetivo desta etapa.

## Objetivo desta etapa: evoluir para produção

O sistema vai ser usado por uma clínica odontológica real, com volume de
dados de pacientes e mais de uma pessoa acessando (dentista + recepção).
Isso exige resolver:

1. **Backend real** — banco de dados compartilhado, não mais local ao
   navegador de cada pessoa.
2. **Autenticação e perfis de acesso** — dentista, recepção, admin.
3. **Prontuário legalmente correto** — no Brasil, o Conselho Federal de
   Odontologia exige que o prontuário seja append-only (correções geram
   nova entrada, nunca sobrescrevem o registro original).
4. **LGPD** — dado de saúde é dado sensível: precisa de consentimento
   registrado, trilha de auditoria, e mecanismo de exportação/exclusão a
   pedido do titular.
5. **Agenda sem conflito de horário** para o mesmo dentista.

## Arquitetura já decidida

- **Frontend**: evoluir o React que já existe (`dental-system.jsx`) para uma
  aplicação de verdade.
- **Backend**: Supabase (Postgres gerenciado + Auth + Row Level Security).
  Motivo: dá banco relacional real, autenticação pronta e controle de
  acesso por linha sem precisar escrever um servidor do zero — reduz a
  superfície de código sensível que precisa ser mantida com segurança.
- **Schema do banco de dados**: já desenhado, está no arquivo
  `odontorec-plano-producao.md` anexo (tabelas: `clinicas`, `usuarios`,
  `pacientes`, `consentimentos`, `agendamentos`, `prontuario_entradas`
  (append-only), `prontuario_procedimentos`, `odontograma_eventos`
  (histórico por dente), `audit_log`). Inclui também exemplo de políticas
  de Row Level Security.
- **Roteiro em 5 fases**: (1) fundação — Supabase + auth; (2) prontuário e
  odontograma auditáveis; (3) LGPD; (4) operação da clínica (perfis, sem
  conflito de agenda); (5) deploy (frontend hospedado, domínio, HTTPS).

## O que peço para você (Claude Code) fazer agora

1. Leia `dental-system.jsx` e `odontorec-plano-producao.md` nesta pasta.
2. Me ajude a estruturar o projeto (frontend + configuração do Supabase)
   seguindo a Fase 1 do roteiro.
3. Antes de começar a escrever código, me dê um resumo do plano de ataque
   e confirme comigo — é um sistema com dado de paciente real, prefiro
   revisar decisões antes de aplicar.
