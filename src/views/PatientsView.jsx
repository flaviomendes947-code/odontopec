import { useState, useMemo, useEffect } from "react";
import { Plus, User, Search, Pencil, Trash2, ChevronRight, Phone, Mail, AlertTriangle } from "lucide-react";
import { S } from "../styles.js";
import { calcAge, fmtDate } from "../lib/utils.js";
import {
  ViewHeader, EmptyState, IconBtn, Field, ModalShell, ModalFooter, ConfirmDialog,
} from "../components/Shared.jsx";
import { supabase } from "../lib/supabaseClient.js";

function emptyPatient(clinicaId, criadoPor) {
  return {
    id: null,
    clinica_id: clinicaId,
    nome: "",
    data_nascimento: "",
    cpf: "",
    telefone: "",
    email: "",
    endereco: "",
    alergias: "",
    observacoes_gerais: "",
    criado_por: criadoPor,
  };
}

export default function PatientsView({ patients, onOpenChart, notify, usuario, savePatient, deletePatient }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      p.nome.toLowerCase().includes(q) || (p.cpf || "").includes(q) || (p.telefone || "").includes(q)
    );
  }, [patients, query]);

  const handleSave = async (p) => {
    const { consentimento, ...patientData } = p;
    setSaving(true);
    const { error } = await savePatient(patientData, consentimento);
    setSaving(false);
    if (error) {
      notify(`Erro ao salvar: ${error.message}`);
      return;
    }
    setEditing(null);
    notify(patientData.id ? "Paciente atualizado" : "Paciente cadastrado");
  };

  const handleDelete = async (id) => {
    const { error } = await deletePatient(id);
    setConfirmDelete(null);
    if (error) {
      notify(`Erro ao remover: ${error.message}`);
      return;
    }
    notify("Paciente removido");
  };

  return (
    <div>
      <ViewHeader
        title="Pacientes"
        subtitle={`${patients.length} paciente${patients.length === 1 ? "" : "s"} cadastrado${patients.length === 1 ? "" : "s"}`}
        action={
          <button style={S.primaryBtn} onClick={() => setEditing(emptyPatient(usuario.clinica_id, usuario.id))}>
            <Plus size={16} /> Novo paciente
          </button>
        }
      />

      <div style={S.searchBar}>
        <Search size={15} color="#8b968f" />
        <input
          style={S.searchInput}
          placeholder="Buscar por nome, CPF ou telefone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={User}
          title={patients.length === 0 ? "Nenhum paciente cadastrado" : "Nenhum resultado"}
          text={patients.length === 0 ? "Cadastre o primeiro paciente para começar a usar o sistema." : "Tente buscar por outro termo."}
        />
      ) : (
        <div style={S.cardGrid}>
          {filtered.map((p) => (
            <div key={p.id} style={S.patientCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={S.patientName}>{p.nome || "(sem nome)"}</div>
                  <div style={S.patientMeta}>
                    {p.data_nascimento ? `${calcAge(p.data_nascimento)} anos · ${fmtDate(p.data_nascimento)}` : "Data de nascimento não informada"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <IconBtn title="Editar" onClick={() => setEditing(p)}><Pencil size={14} /></IconBtn>
                  <IconBtn title="Excluir" danger onClick={() => setConfirmDelete(p.id)}><Trash2 size={14} /></IconBtn>
                </div>
              </div>
              <div style={S.patientDetailRow}>
                {p.telefone && <span><Phone size={12} /> {p.telefone}</span>}
                {p.email && <span><Mail size={12} /> {p.email}</span>}
              </div>
              {p.alergias && (
                <div style={S.allergyPill}><AlertTriangle size={12} /> Alergia: {p.alergias}</div>
              )}
              <button style={S.chartLinkBtn} onClick={() => onOpenChart(p.id)}>
                Abrir prontuário <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <PatientModal
          patient={editing}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          text="Remover este paciente? Esta ação não pode ser desfeita."
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
}

function PatientModal({ patient, onCancel, onSave, saving }) {
  const isNew = !patient.id;
  const [form, setForm] = useState({ ...patient, consentimento: false });
  const [consentAtual, setConsentAtual] = useState(isNew ? "novo" : null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const valid = form.nome.trim().length > 1 && (!isNew || form.consentimento);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("consentimentos")
        .select("aceito, registrado_em")
        .eq("paciente_id", patient.id)
        .eq("tipo", "tratamento_dados")
        .order("registrado_em", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setConsentAtual(data || "nenhum");
    })();
    return () => { cancelled = true; };
  }, [isNew, patient.id]);

  return (
    <ModalShell title={patient.id ? "Editar paciente" : "Novo paciente"} onCancel={onCancel} width={560}>
      <div style={S.formGrid2}>
        <Field label="Nome completo *" full>
          <input style={S.input} value={form.nome} onChange={set("nome")} placeholder="Ex: Maria da Silva Santos" />
        </Field>
        <Field label="Data de nascimento">
          <input type="date" style={S.input} value={form.data_nascimento || ""} onChange={set("data_nascimento")} />
        </Field>
        <Field label="CPF">
          <input style={S.input} value={form.cpf || ""} onChange={set("cpf")} placeholder="000.000.000-00" />
        </Field>
        <Field label="Telefone">
          <input style={S.input} value={form.telefone || ""} onChange={set("telefone")} placeholder="(00) 00000-0000" />
        </Field>
        <Field label="E-mail">
          <input style={S.input} value={form.email || ""} onChange={set("email")} placeholder="paciente@email.com" />
        </Field>
        <Field label="Endereço" full>
          <input style={S.input} value={form.endereco || ""} onChange={set("endereco")} placeholder="Rua, número, bairro, cidade" />
        </Field>
        <Field label="Alergias / condições relevantes" full>
          <input style={S.input} value={form.alergias || ""} onChange={set("alergias")} placeholder="Ex: alergia a penicilina, hipertensão…" />
        </Field>
        <Field label="Observações gerais" full>
          <textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} value={form.observacoes_gerais || ""} onChange={set("observacoes_gerais")} />
        </Field>
        <Field label={isNew ? "Consentimento LGPD *" : "Consentimento LGPD"} full>
          {isNew ? (
            <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: "#3E524E" }}>
              <input
                type="checkbox"
                checked={form.consentimento}
                onChange={(e) => setForm({ ...form, consentimento: e.target.checked })}
                style={{ marginTop: 2 }}
              />
              <span>
                O paciente (ou responsável legal) consentiu com o tratamento dos dados pessoais e de
                saúde registrados neste sistema, conforme a LGPD.
              </span>
            </label>
          ) : consentAtual === null ? (
            <span style={{ fontSize: 12.5, color: "#8b968f" }}>Carregando…</span>
          ) : consentAtual !== "nenhum" && consentAtual.aceito ? (
            <span style={{ fontSize: 12.5, color: "#2C6E68" }}>
              Registrado em {fmtDate((consentAtual.registrado_em || "").slice(0, 10))}
            </span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12.5, color: "#A5402F" }}>Nenhum consentimento registrado.</span>
              <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: "#3E524E" }}>
                <input
                  type="checkbox"
                  checked={form.consentimento}
                  onChange={(e) => setForm({ ...form, consentimento: e.target.checked })}
                  style={{ marginTop: 2 }}
                />
                <span>Registrar consentimento agora.</span>
              </label>
            </div>
          )}
        </Field>
      </div>
      <ModalFooter onCancel={onCancel} onSave={() => onSave(form)} disabled={!valid || saving} />
    </ModalShell>
  );
}
