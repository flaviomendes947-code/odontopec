import { useState } from "react";
import {
  Plus, User, Search, X, Check, ChevronRight, Smile, AlertTriangle, ArrowLeft, Stethoscope,
} from "lucide-react";
import { S } from "../styles.js";
import { fmtDate, todayISO, calcAge, uid } from "../lib/utils.js";
import {
  TOOTH_CONDITIONS, PROCEDURE_TO_CONDITION, PROCEDURE_LABELS, UPPER_TEETH, LOWER_TEETH,
} from "../constants.js";
import {
  ViewHeader, SectionLabel, EmptyState, Field, ModalShell, ModalFooter, NoticeBanner,
} from "../components/Shared.jsx";

export default function ProntuarioView({
  patients, records, setRecords, odontogramas, setOdontogramas,
  appointments, activePatientId, setActivePatientId, notify,
}) {
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
          <EmptyState icon={Stethoscope} title="Nenhum paciente cadastrado" text="Cadastre um paciente na aba Pacientes para abrir um prontuário." />
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

  const odontograma = odontogramas[patient.id] || {};
  const patientRecords = records
    .filter((r) => r.pacienteId === patient.id)
    .sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm));

  const updateOdontograma = (toothNumber, condition, obs) => {
    setOdontogramas({
      ...odontogramas,
      [patient.id]: { ...odontograma, [toothNumber]: { condicao: condition, obs: obs || "" } },
    });
  };

  const saveRecord = (record) => {
    setRecords([...records, record]);
    let next = { ...odontograma };
    record.procedimentos.forEach((proc) => {
      const cond = PROCEDURE_TO_CONDITION[proc.procedimento];
      if (cond) next[proc.dente] = { condicao: cond, obs: proc.obs || "" };
    });
    setOdontogramas({ ...odontogramas, [patient.id]: next });
    setNewRecordOpen(false);
    notify("Atendimento registrado (ainda não persistido — chega na Fase 2)");
  };

  return (
    <div>
      <button style={S.backBtn} onClick={() => setActivePatientId(null)}>
        <ArrowLeft size={14} /> Todos os pacientes
      </button>

      <NoticeBanner>
        Prontuário e odontograma ainda não são salvos no banco — essa persistência
        (com histórico append-only, exigido pelo CFO) entra na Fase 2. Por enquanto,
        os dados somem ao recarregar a página.
      </NoticeBanner>

      <div style={S.patientHeader}>
        <div style={S.patientHeaderAvatar}>{(patient.nome || "?").trim().charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div style={S.patientHeaderName}>{patient.nome}</div>
          <div style={S.patientHeaderMeta}>
            {patient.data_nascimento && <span>{calcAge(patient.data_nascimento)} anos</span>}
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
      <Odontogram odontograma={odontograma} onChange={updateOdontograma} />

      <SectionLabel icon={Stethoscope} text="Histórico de atendimentos" />
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
          appointments={appointments.filter((a) => a.paciente_id === patient.id && a.status !== "cancelado")}
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
              <option key={a.id} value={a.id}>{fmtDate(a.data)} {a.hora?.slice(0, 5)} — {a.tipo}</option>
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
