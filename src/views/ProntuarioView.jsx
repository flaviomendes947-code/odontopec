import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, User, Search, X, Check, ChevronRight, Smile, AlertTriangle, ArrowLeft, Stethoscope,
  Pencil, Loader2, Download, ShieldAlert,
} from "lucide-react";
import { S } from "../styles.js";
import { fmtDate, todayISO, calcAge } from "../lib/utils.js";
import {
  TOOTH_CONDITIONS, PROCEDURE_TO_CONDITION, PROCEDURE_LABELS, UPPER_TEETH, LOWER_TEETH,
} from "../constants.js";
import {
  ViewHeader, SectionLabel, EmptyState, Field, ModalShell, ModalFooter, ConfirmDialog,
} from "../components/Shared.jsx";
import { supabase } from "../lib/supabaseClient.js";

export default function ProntuarioView({
  patients, appointments, activePatientId, setActivePatientId, notify, usuario,
}) {
  const [query, setQuery] = useState("");
  const [recordModal, setRecordModal] = useState(null); // { correcaoDe: entrada | null } | null
  const [loading, setLoading] = useState(false);
  const [entradas, setEntradas] = useState([]);
  const [eventos, setEventos] = useState([]);

  const patient = patients.find((p) => p.id === activePatientId);

  const loadProntuario = useCallback(async () => {
    if (!patient) return;
    setLoading(true);
    const [{ data: e, error: eErr }, { data: ev, error: evErr }] = await Promise.all([
      supabase
        .from("prontuario_entradas")
        .select("*, prontuario_procedimentos(*)")
        .eq("paciente_id", patient.id)
        .order("data", { ascending: false })
        .order("criado_em", { ascending: false }),
      supabase
        .from("odontograma_eventos")
        .select("*")
        .eq("paciente_id", patient.id)
        .order("criado_em", { ascending: true }),
    ]);
    if (eErr || evErr) notify(`Erro ao carregar prontuário: ${(eErr || evErr).message}`);
    setEntradas(e || []);
    setEventos(ev || []);
    setLoading(false);
  }, [patient, notify]);

  useEffect(() => {
    loadProntuario();
  }, [loadProntuario]);

  const odontograma = useMemo(() => {
    const state = {};
    eventos.forEach((ev) => {
      state[ev.dente] = { condicao: ev.condicao, obs: ev.observacao || "" };
    });
    return state;
  }, [eventos]);

  const entradasCorrigidas = useMemo(() => {
    const ids = new Set();
    entradas.forEach((e) => { if (e.entrada_original_id) ids.add(e.entrada_original_id); });
    return ids;
  }, [entradas]);

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

  const updateOdontograma = async (toothNumber, condition, obs) => {
    const { error } = await supabase.from("odontograma_eventos").insert({
      paciente_id: patient.id,
      dente: toothNumber,
      condicao: condition,
      observacao: obs || null,
      criado_por: usuario.id,
    });
    if (error) {
      notify(`Erro ao atualizar odontograma: ${error.message}`);
      return;
    }
    await loadProntuario();
  };

  const saveRecord = async (form, correcaoDeId) => {
    const { data: entrada, error: e1 } = await supabase
      .from("prontuario_entradas")
      .insert({
        paciente_id: patient.id,
        agendamento_id: form.agendamento_id || null,
        entrada_original_id: correcaoDeId || null,
        data: form.data,
        queixa_principal: form.queixa_principal || null,
        anamnese: form.anamnese || null,
        prescricao: form.prescricao || null,
        observacoes: form.observacoes || null,
        criado_por: usuario.id,
      })
      .select()
      .single();

    if (e1) {
      notify(`Erro ao salvar atendimento: ${e1.message}`);
      return;
    }

    if (form.procedimentos.length > 0) {
      const { error: e2 } = await supabase.from("prontuario_procedimentos").insert(
        form.procedimentos.map((p) => ({
          prontuario_entrada_id: entrada.id,
          dente: p.dente,
          procedimento: p.procedimento,
          observacao: p.observacao || null,
        }))
      );
      if (e2) notify(`Atendimento salvo, mas houve erro ao registrar procedimentos: ${e2.message}`);

      const odontoRows = form.procedimentos
        .filter((p) => PROCEDURE_TO_CONDITION[p.procedimento])
        .map((p) => ({
          paciente_id: patient.id,
          dente: p.dente,
          condicao: PROCEDURE_TO_CONDITION[p.procedimento],
          observacao: p.observacao || null,
          prontuario_entrada_id: entrada.id,
          criado_por: usuario.id,
        }));
      if (odontoRows.length > 0) {
        const { error: e3 } = await supabase.from("odontograma_eventos").insert(odontoRows);
        if (e3) notify(`Atendimento salvo, mas houve erro ao atualizar o odontograma: ${e3.message}`);
      }
    }

    setRecordModal(null);
    notify(correcaoDeId ? "Correção registrada no prontuário" : "Atendimento registrado no prontuário");
    await loadProntuario();
  };

  const handleExport = async () => {
    const [{ data: ag }, { data: cons }] = await Promise.all([
      supabase.from("agendamentos").select("*").eq("paciente_id", patient.id),
      supabase.from("consentimentos").select("*").eq("paciente_id", patient.id),
    ]);
    const payload = {
      paciente: patient,
      consentimentos: cons || [],
      agendamentos: ag || [],
      prontuario_entradas: entradas,
      odontograma_eventos: eventos,
      exportado_em: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dados-${patient.nome.replace(/\s+/g, "_")}-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    await supabase.from("audit_log").insert({
      usuario_id: usuario.id, acao: "exportacao_dados_lgpd", entidade: "paciente", entidade_id: patient.id,
    });
    notify("Dados exportados");
  };

  const [confirmDelecao, setConfirmDelecao] = useState(false);
  const handleDeletionRequest = async () => {
    const { error } = await supabase.from("audit_log").insert({
      usuario_id: usuario.id, acao: "solicitacao_exclusao_lgpd", entidade: "paciente", entidade_id: patient.id,
    });
    setConfirmDelecao(false);
    if (error) {
      notify(`Erro ao registrar solicitação: ${error.message}`);
      return;
    }
    notify("Solicitação de exclusão registrada — um administrador vai avaliar");
  };

  return (
    <div>
      <button style={S.backBtn} onClick={() => setActivePatientId(null)}>
        <ArrowLeft size={14} /> Todos os pacientes
      </button>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button style={S.secondaryBtn} onClick={handleExport}>
          <Download size={14} /> Exportar dados (LGPD)
        </button>
        <button
          style={{ ...S.secondaryBtn, color: "#C2503D", borderColor: "#C2503D" }}
          onClick={() => setConfirmDelecao(true)}
        >
          <ShieldAlert size={14} /> Solicitar exclusão de dados
        </button>
      </div>

      {confirmDelecao && (
        <ConfirmDialog
          text="Isso registra uma solicitação de exclusão de dados (LGPD) para avaliação do administrador. A exclusão não é feita automaticamente — dados clínicos precisam ser avaliados caso a caso antes de qualquer remoção, para não violar a obrigação de guarda do Conselho Federal de Odontologia."
          onCancel={() => setConfirmDelecao(false)}
          onConfirm={handleDeletionRequest}
        />
      )}

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
        {usuario.papel !== "recepcao" && (
          <button style={S.primaryBtn} onClick={() => setRecordModal({ correcaoDe: null })}>
            <Plus size={16} /> Novo atendimento
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 size={20} color="#2C6E68" />
        </div>
      ) : (
        <>
          <SectionLabel icon={Smile} text="Odontograma" />
          <Odontogram odontograma={odontograma} onChange={updateOdontograma} />

          <SectionLabel icon={Stethoscope} text="Histórico de atendimentos" />
          {entradas.length === 0 ? (
            <EmptyState icon={Stethoscope} title="Nenhum atendimento registrado" text="Clique em “Novo atendimento” para iniciar o histórico deste paciente." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {entradas.map((r) => (
                <RecordCard
                  key={r.id}
                  record={r}
                  corrigida={entradasCorrigidas.has(r.id)}
                  podeCorrigir={usuario.papel !== "recepcao"}
                  onCorrect={() => setRecordModal({ correcaoDe: r })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {recordModal && (
        <NewRecordModal
          patient={patient}
          appointments={appointments.filter((a) => a.paciente_id === patient.id && a.status !== "cancelado")}
          correcaoDe={recordModal.correcaoDe}
          onCancel={() => setRecordModal(null)}
          onSave={(form) => saveRecord(form, recordModal.correcaoDe?.id)}
        />
      )}
    </div>
  );
}

function RecordCard({ record, corrigida, podeCorrigir, onCorrect }) {
  const [open, setOpen] = useState(false);
  const procedimentos = record.prontuario_procedimentos || [];
  return (
    <div style={S.recordCard}>
      <button style={S.recordCardHead} onClick={() => setOpen(!open)}>
        <div style={S.recordDateBadge}>{fmtDate(record.data)}</div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={S.recordTitle}>{record.queixa_principal || "Atendimento clínico"}</div>
          <div style={S.recordSub}>
            {procedimentos.length} procedimento{procedimentos.length === 1 ? "" : "s"} registrado{procedimentos.length === 1 ? "" : "s"}
            {record.entrada_original_id && " · correção de entrada anterior"}
            {corrigida && " · corrigida por uma entrada mais recente"}
          </div>
        </div>
        <ChevronRight size={16} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
      </button>
      {open && (
        <div style={S.recordBody}>
          {record.anamnese && <RecordField label="Anamnese / queixa">{record.anamnese}</RecordField>}
          {procedimentos.length > 0 && (
            <RecordField label="Procedimentos realizados">
              <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                {procedimentos.map((p) => (
                  <li key={p.id} style={{ marginBottom: 3 }}>
                    Dente {p.dente} — {PROCEDURE_LABELS[p.procedimento]}{p.observacao ? ` (${p.observacao})` : ""}
                  </li>
                ))}
              </ul>
            </RecordField>
          )}
          {record.prescricao && <RecordField label="Prescrição">{record.prescricao}</RecordField>}
          {record.observacoes && <RecordField label="Observações">{record.observacoes}</RecordField>}
          {!corrigida && podeCorrigir && (
            <button style={{ ...S.secondaryBtn, marginTop: 4 }} onClick={onCorrect}>
              <Pencil size={13} /> Corrigir esta entrada
            </button>
          )}
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

function emptyRecordForm(correcaoDe) {
  if (correcaoDe) {
    return {
      agendamento_id: correcaoDe.agendamento_id || "",
      data: correcaoDe.data,
      queixa_principal: correcaoDe.queixa_principal || "",
      anamnese: correcaoDe.anamnese || "",
      procedimentos: (correcaoDe.prontuario_procedimentos || []).map((p) => ({
        dente: p.dente, procedimento: p.procedimento, observacao: p.observacao || "",
      })),
      prescricao: correcaoDe.prescricao || "",
      observacoes: correcaoDe.observacoes || "",
    };
  }
  return {
    agendamento_id: "",
    data: todayISO(),
    queixa_principal: "",
    anamnese: "",
    procedimentos: [],
    prescricao: "",
    observacoes: "",
  };
}

function NewRecordModal({ patient, appointments, correcaoDe, onCancel, onSave }) {
  const [form, setForm] = useState(emptyRecordForm(correcaoDe));
  const [procDente, setProcDente] = useState(UPPER_TEETH[0]);
  const [procTipo, setProcTipo] = useState("restauracao");
  const [procObs, setProcObs] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const addProc = () => {
    setForm({
      ...form,
      procedimentos: [...form.procedimentos, { dente: procDente, procedimento: procTipo, observacao: procObs }],
    });
    setProcObs("");
  };
  const removeProc = (idx) => {
    setForm({ ...form, procedimentos: form.procedimentos.filter((_, i) => i !== idx) });
  };

  const valid = form.data && (form.queixa_principal.trim() || form.procedimentos.length > 0);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <ModalShell
      title={correcaoDe ? `Corrigir atendimento de ${fmtDate(correcaoDe.data)} — ${patient.nome}` : `Novo atendimento — ${patient.nome}`}
      onCancel={onCancel}
      width={620}
    >
      {correcaoDe && (
        <p style={{ fontSize: 12.5, color: "#5B6F6C", background: "#EFF3F1", borderRadius: 8, padding: "9px 12px", margin: "0 0 14px" }}>
          Isso cria uma <strong>nova entrada</strong> no prontuário referenciando a original — a entrada anterior
          permanece no histórico, como exige o Conselho Federal de Odontologia. Os campos abaixo já vêm
          preenchidos com os dados da entrada original; ajuste o que precisa ser corrigido.
        </p>
      )}
      <div style={S.formGrid2}>
        <Field label="Data do atendimento *">
          <input type="date" style={S.input} value={form.data} onChange={set("data")} />
        </Field>
        <Field label="Agendamento vinculado">
          <select style={S.input} value={form.agendamento_id} onChange={set("agendamento_id")}>
            <option value="">Nenhum / avulso</option>
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>{fmtDate(a.data)} {a.hora?.slice(0, 5)} — {a.tipo}</option>
            ))}
          </select>
        </Field>
        <Field label="Queixa principal" full>
          <input style={S.input} value={form.queixa_principal} onChange={set("queixa_principal")} placeholder="Ex: dor no dente 26 ao mastigar" />
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
                <span style={{ flex: 1 }}>{PROCEDURE_LABELS[p.procedimento]}{p.observacao ? ` — ${p.observacao}` : ""}</span>
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

      <ModalFooter
        onCancel={onCancel}
        onSave={handleSave}
        disabled={!valid || saving}
        saveLabel={correcaoDe ? "Salvar correção" : "Salvar atendimento"}
      />
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
