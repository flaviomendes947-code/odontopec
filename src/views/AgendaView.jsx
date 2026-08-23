import { useState, useMemo } from "react";
import { Plus, Calendar as CalendarIcon, FileText, Pencil, Trash2, Clock } from "lucide-react";
import { S } from "../styles.js";
import { fmtDate, todayISO } from "../lib/utils.js";
import { APPT_STATUS } from "../constants.js";
import { ViewHeader, EmptyState, IconBtn, Field, ModalShell, ModalFooter } from "../components/Shared.jsx";

function emptyAppointment(clinicaId, criadoPor, pacienteId = "", dentistaId = "") {
  return {
    id: null,
    clinica_id: clinicaId,
    paciente_id: pacienteId,
    dentista_id: dentistaId,
    data: todayISO(),
    hora: "09:00",
    tipo: "Consulta de rotina",
    status: "agendado",
    observacoes: "",
    criado_por: criadoPor,
  };
}

export default function AgendaView({ patients, appointments, dentistas, onOpenChart, notify, usuario, saveAppointment, setAppointmentStatus, deleteAppointment }) {
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [saving, setSaving] = useState(false);
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

  const handleSave = async (appt) => {
    setSaving(true);
    const { error } = await saveAppointment(appt);
    setSaving(false);
    if (error) {
      notify(
        error.code === "23505"
          ? "Esse dentista já tem um agendamento nesse horário."
          : `Erro ao salvar: ${error.message}`
      );
      return;
    }
    setEditing(null);
    notify(appt.id ? "Agendamento atualizado" : "Agendamento criado");
  };

  const handleStatus = async (id, status) => {
    const { error } = await setAppointmentStatus(id, status);
    if (error) notify(`Erro ao atualizar status: ${error.message}`);
  };

  const handleRemove = async (id) => {
    const { error } = await deleteAppointment(id);
    if (error) {
      notify(`Erro ao remover: ${error.message}`);
      return;
    }
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
            disabled={patients.length === 0 || dentistas.length === 0}
            title={
              patients.length === 0
                ? "Cadastre um paciente primeiro"
                : dentistas.length === 0
                ? "Nenhum dentista cadastrado ainda"
                : ""
            }
            onClick={() => setEditing(emptyAppointment(usuario.clinica_id, usuario.id))}
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
                  <div style={S.apptTime}><Clock size={13} /> {a.hora?.slice(0, 5)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.apptPatient}>{patientName(a.paciente_id)}</div>
                    <div style={S.apptType}>{a.tipo}</div>
                  </div>
                  <select
                    value={a.status}
                    onChange={(e) => handleStatus(a.id, e.target.value)}
                    style={{ ...S.statusSelect, color: APPT_STATUS[a.status].color, borderColor: APPT_STATUS[a.status].color }}
                  >
                    {Object.entries(APPT_STATUS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  {usuario.papel !== "recepcao" && (
                    <IconBtn title="Ver prontuário" onClick={() => onOpenChart(a.paciente_id)}><FileText size={14} /></IconBtn>
                  )}
                  <IconBtn title="Editar" onClick={() => setEditing(a)}><Pencil size={14} /></IconBtn>
                  <IconBtn title="Remover" danger onClick={() => handleRemove(a.id)}><Trash2 size={14} /></IconBtn>
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
          dentistas={dentistas}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}

function AppointmentModal({ appt, patients, dentistas, onCancel, onSave, saving }) {
  const [form, setForm] = useState(appt);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const valid = !!form.paciente_id && !!form.dentista_id && !!form.data && !!form.hora;

  return (
    <ModalShell title={appt.id ? "Editar agendamento" : "Novo agendamento"} onCancel={onCancel} width={480}>
      <div style={S.formGrid2}>
        <Field label="Paciente *" full>
          <select style={S.input} value={form.paciente_id} onChange={set("paciente_id")}>
            <option value="">Selecione…</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </Field>
        <Field label="Dentista *" full>
          <select style={S.input} value={form.dentista_id} onChange={set("dentista_id")}>
            <option value="">Selecione…</option>
            {dentistas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </Field>
        <Field label="Data *">
          <input type="date" style={S.input} value={form.data} onChange={set("data")} />
        </Field>
        <Field label="Hora *">
          <input type="time" style={S.input} value={form.hora?.slice(0, 5)} onChange={set("hora")} />
        </Field>
        <Field label="Tipo de consulta" full>
          <input style={S.input} value={form.tipo || ""} onChange={set("tipo")} placeholder="Ex: Avaliação, Restauração, Retorno…" />
        </Field>
        <Field label="Status">
          <select style={S.input} value={form.status} onChange={set("status")}>
            {Object.entries(APPT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="Observações" full>
          <textarea style={{ ...S.input, minHeight: 60 }} value={form.observacoes || ""} onChange={set("observacoes")} />
        </Field>
      </div>
      <ModalFooter onCancel={onCancel} onSave={() => onSave(form)} disabled={!valid || saving} />
    </ModalShell>
  );
}
