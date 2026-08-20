import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, User, Calendar as CalendarIcon, FileText, Search, X, Check,
  Trash2, Pencil, ChevronRight, Smile, Clock, Phone, Mail, MapPin,
  AlertTriangle, Save, ArrowLeft, Stethoscope, Loader2
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Design tokens & constants                                          */
/* ------------------------------------------------------------------ */

const TOOTH_CONDITIONS = {
  higido:     { label: "Hígido",           color: "#FFFFFF", border: "#C7CFC9", text: "#16302E" },
  carie:      { label: "Cárie",            color: "#C2503D", border: "#a03f30", text: "#FFFFFF" },
  restaurado: { label: "Restaurado",       color: "#2C6E68", border: "#1D4F4B", text: "#FFFFFF" },
  coroa:      { label: "Coroa",            color: "#C08A2E", border: "#a3751f", text: "#FFFFFF" },
  canal:      { label: "Tratamento de canal", color: "#6B5B95", border: "#544874", text: "#FFFFFF" },
  implante:   { label: "Implante",         color: "#3D7FA6", border: "#2f637f", text: "#FFFFFF" },
  extraido:   { label: "Extraído",         color: "#E9E6DD", border: "#9aa39d", text: "#5B6F6C", strike: true },
  ausente:    { label: "Ausente",          color: "transparent", border: "#B9C1BB", text: "#5B6F6C", dashed: true },
  fratura:    { label: "Fratura",          color: "#D98A3D", border: "#b06e2b", text: "#FFFFFF" },
  a_extrair:  { label: "Indicado extração",color: "#F6F3EC", border: "#C2503D", text: "#C2503D", dashed: true },
};

const PROCEDURE_TO_CONDITION = {
  restauracao: "restaurado",
  extracao: "extraido",
  canal: "canal",
  coroa: "coroa",
  implante: "implante",
  fratura: "fratura",
  indicacao_extracao: "a_extrair",
  profilaxia: null,
  clareamento: null,
  aparelho_ortodontico: null,
  outro: null,
};

const PROCEDURE_LABELS = {
  restauracao: "Restauração",
  extracao: "Extração",
  canal: "Tratamento de canal",
  coroa: "Coroa protética",
  implante: "Implante",
  fratura: "Reparo de fratura",
  indicacao_extracao: "Indicação de extração",
  profilaxia: "Profilaxia / limpeza",
  clareamento: "Clareamento",
  aparelho_ortodontico: "Manutenção ortodôntica",
  outro: "Outro procedimento",
};

const UPPER_TEETH = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const LOWER_TEETH = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

const APPT_STATUS = {
  agendado:  { label: "Agendado",   color: "#3D7FA6" },
  confirmado:{ label: "Confirmado", color: "#2C6E68" },
  concluido: { label: "Concluído",  color: "#5B8A5A" },
  cancelado: { label: "Cancelado",  color: "#9aa39d" },
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function calcAge(iso) {
  if (!iso) return null;
  const b = new Date(iso + "T00:00:00");
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
}

/* ------------------------------------------------------------------ */
/* Storage helpers                                                    */
/* ------------------------------------------------------------------ */

async function loadKey(key, fallback) {
  try {
    const res = await window.storage.get(key, false);
    return res ? JSON.parse(res.value) : fallback;
  } catch {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), false);
  } catch (e) {
    console.error("Erro ao salvar", key, e);
  }
}

/* ------------------------------------------------------------------ */
/* Root App                                                            */
/* ------------------------------------------------------------------ */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [tab, setTab] = useState("pacientes");
  const [activePatientId, setActivePatientId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      const [p, a, r] = await Promise.all([
        loadKey("patients", []),
        loadKey("appointments", []),
        loadKey("records", []),
      ]);
      setPatients(p);
      setAppointments(a);
      setRecords(r);
      setLoading(false);
    })();
  }, []);

  const notify = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const persistPatients = useCallback(async (next) => {
    setPatients(next);
    await saveKey("patients", next);
  }, []);
  const persistAppointments = useCallback(async (next) => {
    setAppointments(next);
    await saveKey("appointments", next);
  }, []);
  const persistRecords = useCallback(async (next) => {
    setRecords(next);
    await saveKey("records", next);
  }, []);

  const openPatientChart = (id) => {
    setActivePatientId(id);
    setTab("prontuario");
  };

  if (loading) {
    return (
      <div style={S.loadingWrap}>
        <FontFaces />
        <Loader2 className="spin" size={22} color="#2C6E68" />
        <span style={{ fontFamily: "Inter, sans-serif", color: "#5B6F6C", fontSize: 14 }}>
          Carregando sistema…
        </span>
        <style>{`.spin{animation:spin 0.9s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={S.app}>
      <FontFaces />
      <GlobalStyle />
      <Sidebar tab={tab} setTab={(t) => { setTab(t); if (t !== "prontuario") setActivePatientId(null); }} />
      <main style={S.main}>
        {tab === "pacientes" && (
          <PatientsView
            patients={patients}
            setPatients={persistPatients}
            onOpenChart={openPatientChart}
            notify={notify}
          />
        )}
        {tab === "agenda" && (
          <AgendaView
            patients={patients}
            appointments={appointments}
            setAppointments={persistAppointments}
            onOpenChart={openPatientChart}
            notify={notify}
          />
        )}
        {tab === "prontuario" && (
          <ProntuarioView
            patients={patients}
            setPatients={persistPatients}
            records={records}
            setRecords={persistRecords}
            appointments={appointments}
            setAppointments={persistAppointments}
            activePatientId={activePatientId}
            setActivePatientId={setActivePatientId}
            notify={notify}
          />
        )}
      </main>
      {toast && <div style={S.toast}><Check size={15} /> {toast}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

function Sidebar({ tab, setTab }) {
  const items = [
    { id: "pacientes", label: "Pacientes", icon: User },
    { id: "agenda", label: "Agenda", icon: CalendarIcon },
    { id: "prontuario", label: "Prontuário", icon: FileText },
  ];
  return (
    <aside style={S.sidebar}>
      <div style={S.brand}>
        <div style={S.brandMark}><Smile size={18} color="#F6F3EC" /></div>
        <div>
          <div style={S.brandName}>OdontoRec</div>
          <div style={S.brandSub}>Prontuário &amp; agenda</div>
        </div>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 18 }}>
        {items.map((it) => {
          const Icon = it.icon;
          const active = tab === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              style={{ ...S.navBtn, ...(active ? S.navBtnActive : {}) }}
            >
              <Icon size={16} />
              {it.label}
            </button>
          );
        })}
      </nav>
      <div style={S.sidebarFoot}>
        Dados salvos automaticamente neste navegador.
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Pacientes                                                           */
/* ------------------------------------------------------------------ */

function emptyPatient() {
  return {
    id: uid(),
    nome: "",
    dataNascimento: "",
    cpf: "",
    telefone: "",
    email: "",
    endereco: "",
    alergias: "",
    observacoesGerais: "",
    odontograma: {},
    criadoEm: todayISO(),
  };
}

function PatientsView({ patients, setPatients, onOpenChart, notify }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // patient object being edited, or null
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      p.nome.toLowerCase().includes(q) || (p.cpf || "").includes(q) || (p.telefone || "").includes(q)
    );
  }, [patients, query]);

  const savePatient = async (p) => {
    const exists = patients.some((x) => x.id === p.id);
    const next = exists ? patients.map((x) => (x.id === p.id ? p : x)) : [...patients, p];
    await setPatients(next);
    setEditing(null);
    notify(exists ? "Paciente atualizado" : "Paciente cadastrado");
  };

  const deletePatient = async (id) => {
    await setPatients(patients.filter((p) => p.id !== id));
    setConfirmDelete(null);
    notify("Paciente removido");
  };

  return (
    <div>
      <ViewHeader
        title="Pacientes"
        subtitle={`${patients.length} paciente${patients.length === 1 ? "" : "s"} cadastrado${patients.length === 1 ? "" : "s"}`}
        action={
          <button style={S.primaryBtn} onClick={() => setEditing(emptyPatient())}>
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
                    {p.dataNascimento ? `${calcAge(p.dataNascimento)} anos · ${fmtDate(p.dataNascimento)}` : "Data de nascimento não informada"}
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
          onSave={savePatient}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          text="Remover este paciente e todo o histórico de agendamentos/prontuário associado? Esta ação não pode ser desfeita."
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => deletePatient(confirmDelete)}
        />
      )}
    </div>
  );
}

function PatientModal({ patient, onCancel, onSave }) {
  const [form, setForm] = useState(patient);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const valid = form.nome.trim().length > 1;

  return (
    <ModalShell title={patient.nome ? "Editar paciente" : "Novo paciente"} onCancel={onCancel} width={560}>
      <div style={S.formGrid2}>
        <Field label="Nome completo *" full>
          <input style={S.input} value={form.nome} onChange={set("nome")} placeholder="Ex: Maria da Silva Santos" />
        </Field>
        <Field label="Data de nascimento">
          <input type="date" style={S.input} value={form.dataNascimento} onChange={set("dataNascimento")} />
        </Field>
        <Field label="CPF">
          <input style={S.input} value={form.cpf} onChange={set("cpf")} placeholder="000.000.000-00" />
        </Field>
        <Field label="Telefone">
          <input style={S.input} value={form.telefone} onChange={set("telefone")} placeholder="(00) 00000-0000" />
        </Field>
        <Field label="E-mail">
          <input style={S.input} value={form.email} onChange={set("email")} placeholder="paciente@email.com" />
        </Field>
        <Field label="Endereço" full>
          <input style={S.input} value={form.endereco} onChange={set("endereco")} placeholder="Rua, número, bairro, cidade" />
        </Field>
        <Field label="Alergias / condições relevantes" full>
          <input style={S.input} value={form.alergias} onChange={set("alergias")} placeholder="Ex: alergia a penicilina, hipertensão…" />
        </Field>
        <Field label="Observações gerais" full>
          <textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} value={form.observacoesGerais} onChange={set("observacoesGerais")} />
        </Field>
      </div>
      <ModalFooter onCancel={onCancel} onSave={() => onSave(form)} disabled={!valid} />
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Agenda                                                               */
/* ------------------------------------------------------------------ */

function emptyAppointment(pacienteId = "") {
  return {
    id: uid(),
    pacienteId,
    data: todayISO(),
    hora: "09:00",
    tipo: "Consulta de rotina",
    status: "agendado",
    observacoes: "",
  };
}

function AgendaView({ patients, appointments, setAppointments, onOpenChart, notify }) {
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState("todos");
  const patientName = (id) => patients.find((p) => p.id === id)?.nome || "Paciente removido";

  const sorted = useMemo(() => {
    let list = [...appointments].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
    if (filterStatus !== "todos") list = list.filter((a) => a.status === filterStatus);
    return list;
  }, [appointments, filterStatus]);

  const grouped = useMemo(() => {
    const g = {};
    sorted.forEach((a) => {
      g[a.data] = g[a.data] || [];
      g[a.data].push(a);
    });
    return Object.entries(g);
  }, [sorted]);

  const save = async (appt) => {
    const exists = appointments.some((a) => a.id === appt.id);
    const next = exists ? appointments.map((a) => (a.id === appt.id ? appt : a)) : [...appointments, appt];
    await setAppointments(next);
    setEditing(null);
    notify(exists ? "Agendamento atualizado" : "Agendamento criado");
  };

  const setStatus = async (id, status) => {
    await setAppointments(appointments.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const remove = async (id) => {
    await setAppointments(appointments.filter((a) => a.id !== id));
    notify("Agendamento removido");
  };

  return (
    <div>
      <ViewHeader
        title="Agenda"
        subtitle={`${appointments.length} agendamento${appointments.length === 1 ? "" : "s"} no total`}
        action={
          <button
            style={S.primaryBtn}
            disabled={patients.length === 0}
            title={patients.length === 0 ? "Cadastre um paciente primeiro" : ""}
            onClick={() => setEditing(emptyAppointment())}
          >
            <Plus size={16} /> Novo agendamento
          </button>
        }
      />

      <div style={S.filterRow}>
        {["todos", "agendado", "confirmado", "concluido", "cancelado"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{ ...S.filterChip, ...(filterStatus === s ? S.filterChipActive : {}) }}
          >
            {s === "todos" ? "Todos" : APPT_STATUS[s].label}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <EmptyState icon={CalendarIcon} title="Nenhum agendamento" text="Crie um agendamento para um paciente cadastrado." />
      ) : (
        grouped.map(([date, appts]) => (
          <div key={date} style={{ marginBottom: 22 }}>
            <div style={S.dateHeading}>{fmtDate(date)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {appts.map((a) => (
                <div key={a.id} style={S.apptRow}>
                  <div style={S.apptTime}><Clock size={13} /> {a.hora}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.apptPatient}>{patientName(a.pacienteId)}</div>
                    <div style={S.apptType}>{a.tipo}</div>
                  </div>
                  <select
                    value={a.status}
                    onChange={(e) => setStatus(a.id, e.target.value)}
                    style={{ ...S.statusSelect, color: APPT_STATUS[a.status].color, borderColor: APPT_STATUS[a.status].color }}
                  >
                    {Object.entries(APPT_STATUS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <IconBtn title="Ver prontuário" onClick={() => onOpenChart(a.pacienteId)}><FileText size={14} /></IconBtn>
                  <IconBtn title="Editar" onClick={() => setEditing(a)}><Pencil size={14} /></IconBtn>
                  <IconBtn title="Remover" danger onClick={() => remove(a.id)}><Trash2 size={14} /></IconBtn>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {editing && (
        <AppointmentModal
          appt={editing}
          patients={patients}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function AppointmentModal({ appt, patients, onCancel, onSave }) {
  const [form, setForm] = useState(appt);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const valid = !!form.pacienteId && !!form.data && !!form.hora;

  return (
    <ModalShell title={appt.pacienteId && patients.some(p=>p.id===appt.pacienteId) ? "Editar agendamento" : "Novo agendamento"} onCancel={onCancel} width={480}>
      <div style={S.formGrid2}>
        <Field label="Paciente *" full>
          <select style={S.input} value={form.pacienteId} onChange={set("pacienteId")}>
            <option value="">Selecione…</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </Field>
        <Field label="Data *">
          <input type="date" style={S.input} value={form.data} onChange={set("data")} />
        </Field>
        <Field label="Hora *">
          <input type="time" style={S.input} value={form.hora} onChange={set("hora")} />
        </Field>
        <Field label="Tipo de consulta" full>
          <input style={S.input} value={form.tipo} onChange={set("tipo")} placeholder="Ex: Avaliação, Restauração, Retorno…" />
        </Field>
        <Field label="Status">
          <select style={S.input} value={form.status} onChange={set("status")}>
            {Object.entries(APPT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="Observações" full>
          <textarea style={{ ...S.input, minHeight: 60 }} value={form.observacoes} onChange={set("observacoes")} />
        </Field>
      </div>
      <ModalFooter onCancel={onCancel} onSave={() => onSave(form)} disabled={!valid} />
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Prontuário (patient chart) + Odontograma                            */
/* ------------------------------------------------------------------ */

function ProntuarioView({ patients, setPatients, records, setRecords, appointments, setAppointments, activePatientId, setActivePatientId, notify }) {
  const [query, setQuery] = useState("");
  const [newRecordOpen, setNewRecordOpen] = useState(false);

  const patient = patients.find((p) => p.id === activePatientId);

  if (!patient) {
    const filtered = patients.filter((p) => p.nome.toLowerCase().includes(query.trim().toLowerCase()));
    return (
      <div>
        <ViewHeader title="Prontuário" subtitle="Selecione um paciente para ver o histórico clínico e o odontograma" />
        <div style={S.searchBar}>
          <Search size={15} color="#8b968f" />
          <input style={S.searchInput} placeholder="Buscar paciente…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {patients.length === 0 ? (
          <EmptyState icon={FileText} title="Nenhum paciente cadastrado" text="Cadastre um paciente na aba Pacientes para abrir um prontuário." />
        ) : (
          <div style={S.listSelect}>
            {filtered.map((p) => (
              <button key={p.id} style={S.listSelectRow} onClick={() => setActivePatientId(p.id)}>
                <User size={15} color="#2C6E68" />
                <span style={{ flex: 1, textAlign: "left" }}>{p.nome}</span>
                <ChevronRight size={15} color="#8b968f" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const patientRecords = records
    .filter((r) => r.pacienteId === patient.id)
    .sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm));

  const updateOdontograma = async (toothNumber, condition, obs) => {
    const next = {
      ...patient,
      odontograma: {
        ...patient.odontograma,
        [toothNumber]: { condicao: condition, obs: obs || "" },
      },
    };
    await setPatients(patients.map((p) => (p.id === patient.id ? next : p)));
  };

  const saveRecord = async (record) => {
    await setRecords([...records, record]);
    // apply procedures to odontogram
    let odonto = { ...patient.odontograma };
    record.procedimentos.forEach((proc) => {
      const cond = PROCEDURE_TO_CONDITION[proc.procedimento];
      if (cond) {
        odonto[proc.dente] = { condicao: cond, obs: proc.obs || "" };
      }
    });
    const nextPatient = { ...patient, odontograma: odonto };
    await setPatients(patients.map((p) => (p.id === patient.id ? nextPatient : p)));
    setNewRecordOpen(false);
    notify("Atendimento registrado no prontuário");
  };

  return (
    <div>
      <button style={S.backBtn} onClick={() => setActivePatientId(null)}>
        <ArrowLeft size={14} /> Todos os pacientes
      </button>

      <div style={S.patientHeader}>
        <div style={S.patientHeaderAvatar}>{(patient.nome || "?").trim().charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div style={S.patientHeaderName}>{patient.nome}</div>
          <div style={S.patientHeaderMeta}>
            {patient.dataNascimento && <span>{calcAge(patient.dataNascimento)} anos</span>}
            {patient.telefone && <span>{patient.telefone}</span>}
            {patient.cpf && <span>CPF {patient.cpf}</span>}
          </div>
          {patient.alergias && (
            <div style={{ ...S.allergyPill, marginTop: 8 }}><AlertTriangle size={12} /> Alergia: {patient.alergias}</div>
          )}
        </div>
        <button style={S.primaryBtn} onClick={() => setNewRecordOpen(true)}>
          <Plus size={16} /> Novo atendimento
        </button>
      </div>

      <SectionLabel icon={Smile} text="Odontograma" />
      <Odontogram odontograma={patient.odontograma} onChange={updateOdontograma} />

      <SectionLabel icon={FileText} text="Histórico de atendimentos" />
      {patientRecords.length === 0 ? (
        <EmptyState icon={Stethoscope} title="Nenhum atendimento registrado" text="Clique em “Novo atendimento” para iniciar o histórico deste paciente." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {patientRecords.map((r) => <RecordCard key={r.id} record={r} />)}
        </div>
      )}

      {newRecordOpen && (
        <NewRecordModal
          patient={patient}
          appointments={appointments.filter((a) => a.pacienteId === patient.id && a.status !== "cancelado")}
          onCancel={() => setNewRecordOpen(false)}
          onSave={saveRecord}
        />
      )}
    </div>
  );
}

function RecordCard({ record }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={S.recordCard}>
      <button style={S.recordCardHead} onClick={() => setOpen(!open)}>
        <div style={S.recordDateBadge}>{fmtDate(record.data)}</div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={S.recordTitle}>{record.queixaPrincipal || "Atendimento clínico"}</div>
          <div style={S.recordSub}>
            {record.procedimentos.length} procedimento{record.procedimentos.length === 1 ? "" : "s"} registrado{record.procedimentos.length === 1 ? "" : "s"}
          </div>
        </div>
        <ChevronRight size={16} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
      </button>
      {open && (
        <div style={S.recordBody}>
          {record.anamnese && <RecordField label="Anamnese / queixa">{record.anamnese}</RecordField>}
          {record.procedimentos.length > 0 && (
            <RecordField label="Procedimentos realizados">
              <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                {record.procedimentos.map((p, i) => (
                  <li key={i} style={{ marginBottom: 3 }}>
                    Dente {p.dente} — {PROCEDURE_LABELS[p.procedimento]}{p.obs ? ` (${p.obs})` : ""}
                  </li>
                ))}
              </ul>
            </RecordField>
          )}
          {record.prescricao && <RecordField label="Prescrição">{record.prescricao}</RecordField>}
          {record.observacoes && <RecordField label="Observações">{record.observacoes}</RecordField>}
        </div>
      )}
    </div>
  );
}
function RecordField({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={S.recordFieldLabel}>{label}</div>
      <div style={S.recordFieldValue}>{children}</div>
    </div>
  );
}

function emptyRecord(pacienteId) {
  return {
    id: uid(),
    pacienteId,
    agendamentoId: "",
    data: todayISO(),
    queixaPrincipal: "",
    anamnese: "",
    procedimentos: [],
    prescricao: "",
    observacoes: "",
    criadoEm: new Date().toISOString(),
  };
}

function NewRecordModal({ patient, appointments, onCancel, onSave }) {
  const [form, setForm] = useState(emptyRecord(patient.id));
  const [procDente, setProcDente] = useState(UPPER_TEETH[0]);
  const [procTipo, setProcTipo] = useState("restauracao");
  const [procObs, setProcObs] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const addProc = () => {
    setForm({
      ...form,
      procedimentos: [...form.procedimentos, { dente: procDente, procedimento: procTipo, obs: procObs }],
    });
    setProcObs("");
  };
  const removeProc = (idx) => {
    setForm({ ...form, procedimentos: form.procedimentos.filter((_, i) => i !== idx) });
  };

  const valid = form.data && (form.queixaPrincipal.trim() || form.procedimentos.length > 0);

  return (
    <ModalShell title={`Novo atendimento — ${patient.nome}`} onCancel={onCancel} width={620}>
      <div style={S.formGrid2}>
        <Field label="Data do atendimento *">
          <input type="date" style={S.input} value={form.data} onChange={set("data")} />
        </Field>
        <Field label="Agendamento vinculado">
          <select style={S.input} value={form.agendamentoId} onChange={set("agendamentoId")}>
            <option value="">Nenhum / avulso</option>
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>{fmtDate(a.data)} {a.hora} — {a.tipo}</option>
            ))}
          </select>
        </Field>
        <Field label="Queixa principal" full>
          <input style={S.input} value={form.queixaPrincipal} onChange={set("queixaPrincipal")} placeholder="Ex: dor no dente 26 ao mastigar" />
        </Field>
        <Field label="Anamnese / exame clínico" full>
          <textarea style={{ ...S.input, minHeight: 70 }} value={form.anamnese} onChange={set("anamnese")} />
        </Field>
      </div>

      <div style={S.procBuilder}>
        <div style={S.procBuilderLabel}>Adicionar procedimento ao odontograma</div>
        <div style={S.procBuilderRow}>
          <select style={S.input} value={procDente} onChange={(e) => setProcDente(Number(e.target.value))}>
            <optgroup label="Superiores">
              {UPPER_TEETH.map((t) => <option key={t} value={t}>Dente {t}</option>)}
            </optgroup>
            <optgroup label="Inferiores">
              {LOWER_TEETH.map((t) => <option key={t} value={t}>Dente {t}</option>)}
            </optgroup>
          </select>
          <select style={S.input} value={procTipo} onChange={(e) => setProcTipo(e.target.value)}>
            {Object.entries(PROCEDURE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input style={S.input} placeholder="Obs. (opcional)" value={procObs} onChange={(e) => setProcObs(e.target.value)} />
          <button type="button" style={S.smallAddBtn} onClick={addProc}><Plus size={14} /></button>
        </div>
        {form.procedimentos.length > 0 && (
          <div style={S.procList}>
            {form.procedimentos.map((p, i) => (
              <div key={i} style={S.procListItem}>
                <span style={S.procToothTag}>{p.dente}</span>
                <span style={{ flex: 1 }}>{PROCEDURE_LABELS[p.procedimento]}{p.obs ? ` — ${p.obs}` : ""}</span>
                <button type="button" style={S.procRemoveBtn} onClick={() => removeProc(i)}><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={S.formGrid2}>
        <Field label="Prescrição" full>
          <textarea style={{ ...S.input, minHeight: 55 }} value={form.prescricao} onChange={set("prescricao")} placeholder="Medicações, orientações…" />
        </Field>
        <Field label="Observações" full>
          <textarea style={{ ...S.input, minHeight: 55 }} value={form.observacoes} onChange={set("observacoes")} />
        </Field>
      </div>

      <ModalFooter onCancel={onCancel} onSave={() => onSave(form)} disabled={!valid} saveLabel="Salvar atendimento" />
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Odontogram (signature visual element)                               */
/* ------------------------------------------------------------------ */

function Odontogram({ odontograma, onChange }) {
  const [activeTooth, setActiveTooth] = useState(null);

  return (
    <div style={S.odontoWrap}>
      <ToothArch teeth={UPPER_TEETH} flip={false} odontograma={odontograma} onSelect={setActiveTooth} />
      <div style={S.odontoMidline} />
      <ToothArch teeth={LOWER_TEETH} flip={true} odontograma={odontograma} onSelect={setActiveTooth} />

      <div style={S.legend}>
        {Object.entries(TOOTH_CONDITIONS).map(([k, v]) => (
          <div key={k} style={S.legendItem}>
            <span style={{
              ...S.legendSwatch,
              background: v.color,
              borderColor: v.border,
              borderStyle: v.dashed ? "dashed" : "solid",
            }} />
            {v.label}
          </div>
        ))}
      </div>

      {activeTooth && (
        <ToothPopover
          tooth={activeTooth}
          current={odontograma[activeTooth] || { condicao: "higido", obs: "" }}
          onClose={() => setActiveTooth(null)}
          onSave={(cond, obs) => { onChange(activeTooth, cond, obs); setActiveTooth(null); }}
        />
      )}
    </div>
  );
}

function ToothArch({ teeth, flip, odontograma, onSelect }) {
  const center = (teeth.length - 1) / 2;
  return (
    <div style={S.archRow}>
      {teeth.map((num, i) => {
        const offset = i - center;
        const rotate = offset * 3.4 * (flip ? -1 : 1);
        const lift = Math.pow(Math.abs(offset), 1.55) * 2.1 * (flip ? 1 : -1);
        const state = odontograma[num] || { condicao: "higido" };
        const cond = TOOTH_CONDITIONS[state.condicao] || TOOTH_CONDITIONS.higido;
        return (
          <button
            key={num}
            onClick={() => onSelect(num)}
            title={`Dente ${num} — ${cond.label}`}
            style={{
              ...S.tooth,
              background: cond.color,
              borderColor: cond.border,
              borderStyle: cond.dashed ? "dashed" : "solid",
              color: cond.text,
              transform: `translateY(${lift}px) rotate(${rotate}deg)`,
              textDecoration: cond.strike ? "line-through" : "none",
            }}
          >
            {num}
          </button>
        );
      })}
    </div>
  );
}

function ToothPopover({ tooth, current, onClose, onSave }) {
  const [cond, setCond] = useState(current.condicao);
  const [obs, setObs] = useState(current.obs || "");
  return (
    <div style={S.popoverBackdrop} onClick={onClose}>
      <div style={S.popover} onClick={(e) => e.stopPropagation()}>
        <div style={S.popoverHead}>
          <span style={S.popoverToothNum}>Dente {tooth}</span>
          <button style={S.iconBtn} onClick={onClose}><X size={14} /></button>
        </div>
        <div style={S.popoverGrid}>
          {Object.entries(TOOTH_CONDITIONS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setCond(k)}
              style={{
                ...S.popoverOption,
                borderColor: cond === k ? "#2C6E68" : "#E3E7E3",
                background: cond === k ? "#EDF4F1" : "#fff",
              }}
            >
              <span style={{ ...S.legendSwatch, background: v.color, borderColor: v.border, borderStyle: v.dashed ? "dashed" : "solid" }} />
              {v.label}
            </button>
          ))}
        </div>
        <input
          style={{ ...S.input, marginTop: 10 }}
          placeholder="Observação para este dente (opcional)"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
        />
        <button style={{ ...S.primaryBtn, width: "100%", justifyContent: "center", marginTop: 10 }} onClick={() => onSave(cond, obs)}>
          <Check size={15} /> Aplicar
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared small components                                             */
/* ------------------------------------------------------------------ */

function ViewHeader({ title, subtitle, action }) {
  return (
    <div style={S.viewHeader}>
      <div>
        <h1 style={S.viewTitle}>{title}</h1>
        {subtitle && <div style={S.viewSubtitle}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

function SectionLabel({ icon: Icon, text }) {
  return (
    <div style={S.sectionLabel}>
      <Icon size={15} color="#2C6E68" />
      {text}
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div style={S.emptyState}>
      <div style={S.emptyIconWrap}><Icon size={22} color="#2C6E68" /></div>
      <div style={S.emptyTitle}>{title}</div>
      <div style={S.emptyText}>{text}</div>
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ ...S.iconBtn, ...(danger ? S.iconBtnDanger : {}) }}
    >
      {children}
    </button>
  );
}

function Field({ label, children, full }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: full ? "1 / -1" : "auto" }}>
      <span style={S.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function ModalShell({ title, onCancel, width, children }) {
  return (
    <div style={S.modalBackdrop} onClick={onCancel}>
      <div style={{ ...S.modal, maxWidth: width || 520 }} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHead}>
          <span style={S.modalTitle}>{title}</span>
          <button style={S.iconBtn} onClick={onCancel}><X size={15} /></button>
        </div>
        <div style={S.modalBody}>{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, onSave, disabled, saveLabel }) {
  return (
    <div style={S.modalFoot}>
      <button style={S.secondaryBtn} onClick={onCancel}>Cancelar</button>
      <button style={{ ...S.primaryBtn, opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }} disabled={disabled} onClick={onSave}>
        <Save size={15} /> {saveLabel || "Salvar"}
      </button>
    </div>
  );
}

function ConfirmDialog({ text, onCancel, onConfirm }) {
  return (
    <div style={S.modalBackdrop} onClick={onCancel}>
      <div style={{ ...S.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalBody}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertTriangle size={20} color="#C2503D" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 14, color: "#16302E", lineHeight: 1.5 }}>{text}</p>
          </div>
        </div>
        <div style={S.modalFoot}>
          <button style={S.secondaryBtn} onClick={onCancel}>Cancelar</button>
          <button style={{ ...S.primaryBtn, background: "#C2503D" }} onClick={onConfirm}>Remover</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Global style / fonts                                                */
/* ------------------------------------------------------------------ */

function FontFaces() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
    `}</style>
  );
}

function GlobalStyle() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      button { font-family: inherit; cursor: pointer; }
      input, select, textarea { font-family: inherit; }
      input:focus, select:focus, textarea:focus, button:focus-visible {
        outline: 2px solid #2C6E68; outline-offset: 1px;
      }
      ::placeholder { color: #A3ACA5; }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/* Style object (tokens)                                               */
/* ------------------------------------------------------------------ */

const FONT_DISPLAY = "'Fraunces', serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

const INK = "#16302E";
const PAPER = "#EFF3F1";
const SURFACE = "#FFFFFF";
const PRIMARY = "#2C6E68";
const PRIMARY_DARK = "#1D4F4B";
const LINE = "#DCE3DE";
const MUTED = "#5B6F6C";

const S = {
  loadingWrap: {
    minHeight: 480, display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 10, background: PAPER, fontFamily: FONT_BODY,
  },
  app: {
    display: "flex", minHeight: 560, background: PAPER, color: INK,
    fontFamily: FONT_BODY, borderRadius: 12, overflow: "hidden", border: `1px solid ${LINE}`,
  },
  sidebar: {
    width: 208, background: INK, color: "#EFF3F1", padding: "20px 14px",
    display: "flex", flexDirection: "column", flexShrink: 0,
  },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  brandMark: {
    width: 34, height: 34, borderRadius: 9, background: PRIMARY,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  brandName: { fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 16, lineHeight: 1.15 },
  brandSub: { fontSize: 10.5, color: "#9FB3AE", marginTop: 1 },
  navBtn: {
    display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8,
    background: "transparent", border: "none", color: "#C7D4CF", fontSize: 13.5, fontWeight: 500,
    textAlign: "left",
  },
  navBtnActive: { background: "rgba(255,255,255,0.1)", color: "#fff" },
  sidebarFoot: { marginTop: "auto", fontSize: 10.5, color: "#7C948E", lineHeight: 1.5, paddingTop: 14 },
  main: { flex: 1, padding: "26px 30px", overflowY: "auto", minWidth: 0 },

  viewHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, gap: 12, flexWrap: "wrap" },
  viewTitle: { fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, margin: 0 },
  viewSubtitle: { fontSize: 13, color: MUTED, marginTop: 3 },

  primaryBtn: {
    display: "inline-flex", alignItems: "center", gap: 7, background: PRIMARY, color: "#fff",
    border: "none", borderRadius: 8, padding: "9px 15px", fontSize: 13.5, fontWeight: 600,
    whiteSpace: "nowrap",
  },
  secondaryBtn: {
    display: "inline-flex", alignItems: "center", gap: 7, background: SURFACE, color: INK,
    border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 15px", fontSize: 13.5, fontWeight: 600,
  },

  searchBar: {
    display: "flex", alignItems: "center", gap: 8, background: SURFACE, border: `1px solid ${LINE}`,
    borderRadius: 9, padding: "9px 12px", marginBottom: 18, maxWidth: 380,
  },
  searchInput: { border: "none", outline: "none", flex: 1, fontSize: 13.5, background: "transparent", color: INK },

  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 },
  patientCard: { background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16 },
  patientName: { fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 16.5 },
  patientMeta: { fontSize: 12, color: MUTED, marginTop: 2 },
  patientDetailRow: { display: "flex", flexDirection: "column", gap: 3, marginTop: 10, fontSize: 12.5, color: "#3E524E" },
  allergyPill: {
    display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, background: "#FBEDE9",
    color: "#A5402F", fontSize: 11.5, fontWeight: 600, padding: "4px 9px", borderRadius: 20,
  },
  chartLinkBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 4, width: "100%",
    marginTop: 14, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 8,
    padding: "8px 0", fontSize: 12.5, fontWeight: 600, color: PRIMARY_DARK,
  },

  listSelect: { display: "flex", flexDirection: "column", gap: 6, maxWidth: 460 },
  listSelectRow: {
    display: "flex", alignItems: "center", gap: 10, background: SURFACE, border: `1px solid ${LINE}`,
    borderRadius: 9, padding: "10px 13px", fontSize: 14, color: INK,
  },

  filterRow: { display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" },
  filterChip: {
    background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 20, padding: "6px 13px",
    fontSize: 12.5, fontWeight: 600, color: MUTED,
  },
  filterChipActive: { background: INK, color: "#fff", borderColor: INK },

  dateHeading: { fontFamily: FONT_MONO, fontSize: 11.5, letterSpacing: 0.5, color: MUTED, marginBottom: 8, textTransform: "uppercase" },
  apptRow: {
    display: "flex", alignItems: "center", gap: 12, background: SURFACE, border: `1px solid ${LINE}`,
    borderRadius: 10, padding: "10px 13px",
  },
  apptTime: { display: "flex", alignItems: "center", gap: 5, fontFamily: FONT_MONO, fontSize: 12.5, color: INK, width: 68, flexShrink: 0 },
  apptPatient: { fontSize: 13.5, fontWeight: 600 },
  apptType: { fontSize: 12, color: MUTED, marginTop: 1 },
  statusSelect: {
    fontSize: 11.5, fontWeight: 700, border: "1px solid", borderRadius: 7, padding: "5px 8px",
    background: "#fff", flexShrink: 0,
  },

  backBtn: {
    display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none",
    color: MUTED, fontSize: 12.5, fontWeight: 600, padding: "4px 0", marginBottom: 14,
  },
  patientHeader: {
    display: "flex", alignItems: "flex-start", gap: 14, background: SURFACE, border: `1px solid ${LINE}`,
    borderRadius: 14, padding: 18, marginBottom: 24, flexWrap: "wrap",
  },
  patientHeaderAvatar: {
    width: 46, height: 46, borderRadius: "50%", background: PRIMARY, color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY,
    fontSize: 19, fontWeight: 600, flexShrink: 0,
  },
  patientHeaderName: { fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600 },
  patientHeaderMeta: { display: "flex", gap: 12, fontSize: 12.5, color: MUTED, marginTop: 3, flexWrap: "wrap" },

  sectionLabel: {
    display: "flex", alignItems: "center", gap: 7, fontFamily: FONT_MONO, fontSize: 11.5,
    letterSpacing: 0.6, textTransform: "uppercase", color: PRIMARY_DARK, margin: "22px 0 12px",
    borderTop: `1px solid ${LINE}`, paddingTop: 20,
  },

  odontoWrap: { background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 16, padding: "28px 20px 20px" },
  archRow: { display: "flex", justifyContent: "center", gap: 5, padding: "8px 0" },
  odontoMidline: { height: 1, background: LINE, margin: "14px auto", width: "60%" },
  tooth: {
    width: 30, height: 38, borderRadius: 7, border: "2px solid", fontFamily: FONT_MONO,
    fontSize: 10.5, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "transform .12s",
  },
  legend: { display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 20, justifyContent: "center" },
  legendItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: MUTED },
  legendSwatch: { width: 12, height: 12, borderRadius: 3, border: "1.5px solid", flexShrink: 0 },

  popoverBackdrop: {
    position: "fixed", inset: 0, background: "rgba(22,48,46,0.35)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 50,
  },
  popover: { background: SURFACE, borderRadius: 14, padding: 16, width: 320, maxHeight: "80vh", overflowY: "auto" },
  popoverHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  popoverToothNum: { fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 16 },
  popoverGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 },
  popoverOption: {
    display: "flex", alignItems: "center", gap: 7, border: "1.5px solid", borderRadius: 8,
    padding: "7px 8px", fontSize: 11.5, fontWeight: 500, color: INK, textAlign: "left",
  },

  recordCard: { background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 11, overflow: "hidden" },
  recordCardHead: { display: "flex", alignItems: "center", gap: 12, width: "100%", background: "transparent", border: "none", padding: "12px 15px" },
  recordDateBadge: {
    fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 500, background: PAPER, color: PRIMARY_DARK,
    borderRadius: 7, padding: "5px 9px", flexShrink: 0,
  },
  recordTitle: { fontSize: 14, fontWeight: 600, color: INK },
  recordSub: { fontSize: 11.5, color: MUTED, marginTop: 1 },
  recordBody: { padding: "0 15px 15px 15px", borderTop: `1px solid ${LINE}`, marginTop: 2, paddingTop: 12 },
  recordFieldLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: MUTED },
  recordFieldValue: { fontSize: 13, color: "#233F3B", marginTop: 3, lineHeight: 1.5 },

  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    textAlign: "center", padding: "48px 20px", background: SURFACE, border: `1px dashed ${LINE}`, borderRadius: 14,
  },
  emptyIconWrap: {
    width: 44, height: 44, borderRadius: "50%", background: PAPER, display: "flex",
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: 700, color: INK },
  emptyText: { fontSize: 12.5, color: MUTED, marginTop: 4, maxWidth: 320 },

  iconBtn: {
    width: 28, height: 28, borderRadius: 7, border: `1px solid ${LINE}`, background: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, flexShrink: 0,
  },
  iconBtnDanger: { color: "#C2503D" },

  fieldLabel: { fontSize: 11.5, fontWeight: 600, color: "#3E524E" },
  input: {
    border: `1px solid ${LINE}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: INK,
    background: "#fff", width: "100%",
  },
  formGrid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },

  procBuilder: { background: PAPER, borderRadius: 11, padding: 13, marginTop: 4 },
  procBuilderLabel: { fontSize: 11.5, fontWeight: 700, color: PRIMARY_DARK, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 },
  procBuilderRow: { display: "grid", gridTemplateColumns: "110px 1fr 1fr auto", gap: 7 },
  smallAddBtn: { background: PRIMARY, color: "#fff", border: "none", borderRadius: 8, width: 36, display: "flex", alignItems: "center", justifyContent: "center" },
  procList: { display: "flex", flexDirection: "column", gap: 5, marginTop: 10 },
  procListItem: { display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 7, padding: "6px 9px", fontSize: 12.5 },
  procToothTag: { fontFamily: FONT_MONO, background: PAPER, borderRadius: 5, padding: "2px 6px", fontSize: 11, fontWeight: 600, color: PRIMARY_DARK },
  procRemoveBtn: { background: "transparent", border: "none", color: MUTED, display: "flex" },

  modalBackdrop: {
    position: "fixed", inset: 0, background: "rgba(22,48,46,0.4)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 40, padding: 16,
  },
  modal: { background: SURFACE, borderRadius: 16, width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${LINE}` },
  modalTitle: { fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 17 },
  modalBody: { padding: 20, overflowY: "auto" },
  modalFoot: { display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 20px", borderTop: `1px solid ${LINE}` },

  toast: {
    position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: INK,
    color: "#fff", padding: "10px 18px", borderRadius: 30, fontSize: 13, display: "flex",
    alignItems: "center", gap: 7, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", zIndex: 60,
  },
};
