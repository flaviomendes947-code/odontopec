import { useState, useEffect, useCallback } from "react";
import { Check, Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { supabase } from "./lib/supabaseClient.js";
import { S } from "./styles.js";
import { FontFaces, GlobalStyle } from "./components/Shared.jsx";
import Sidebar from "./components/Sidebar.jsx";
import LoginView from "./views/LoginView.jsx";
import PatientsView from "./views/PatientsView.jsx";
import AgendaView from "./views/AgendaView.jsx";
import ProntuarioView from "./views/ProntuarioView.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

function Gate() {
  const { session, usuario, usuarioError, loading } = useAuth();

  if (loading) {
    return (
      <div style={S.loadingWrap}>
        <FontFaces />
        <Loader2 size={22} color="#2C6E68" />
        <span style={{ fontFamily: "Inter, sans-serif", color: "#5B6F6C", fontSize: 14 }}>
          Carregando sistema…
        </span>
      </div>
    );
  }

  if (!session || (session && usuarioError) || !usuario) {
    return <LoginView />;
  }

  return <AppShell usuario={usuario} />;
}

function AppShell({ usuario }) {
  const [loadingData, setLoadingData] = useState(true);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dentistas, setDentistas] = useState([]);
  const [tab, setTab] = useState("pacientes");
  const [activePatientId, setActivePatientId] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const loadAll = useCallback(async () => {
    const [{ data: p, error: pErr }, { data: a, error: aErr }, { data: d, error: dErr }] = await Promise.all([
      supabase.from("pacientes").select("*").order("nome"),
      supabase.from("agendamentos").select("*").order("data").order("hora"),
      supabase.from("usuarios").select("id, nome").eq("papel", "dentista").order("nome"),
    ]);
    if (pErr || aErr || dErr) {
      notify(`Erro ao carregar dados: ${(pErr || aErr || dErr).message}`);
    }
    setPatients(p || []);
    setAppointments(a || []);
    setDentistas(d || []);
    setLoadingData(false);
  }, [notify]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const savePatient = async (p) => {
    if (p.id) {
      const { id, criado_por, criado_em, atualizado_em, ...updates } = p;
      const { error } = await supabase.from("pacientes").update(updates).eq("id", id);
      if (!error) await loadAll();
      return { error };
    }
    const { id, ...insertData } = p;
    const { error } = await supabase.from("pacientes").insert(insertData);
    if (!error) await loadAll();
    return { error };
  };

  const deletePatient = async (id) => {
    const { error } = await supabase.from("pacientes").delete().eq("id", id);
    if (!error) await loadAll();
    return { error };
  };

  const saveAppointment = async (appt) => {
    const payload = { ...appt, hora: appt.hora?.length === 5 ? `${appt.hora}:00` : appt.hora };
    if (appt.id) {
      const { id, criado_por, criado_em, ...updates } = payload;
      const { error } = await supabase.from("agendamentos").update(updates).eq("id", id);
      if (!error) await loadAll();
      return { error };
    }
    const { id, ...insertData } = payload;
    const { error } = await supabase.from("agendamentos").insert(insertData);
    if (!error) await loadAll();
    return { error };
  };

  const setAppointmentStatus = async (id, status) => {
    const { error } = await supabase.from("agendamentos").update({ status }).eq("id", id);
    if (!error) await loadAll();
    return { error };
  };

  const deleteAppointment = async (id) => {
    const { error } = await supabase.from("agendamentos").delete().eq("id", id);
    if (!error) await loadAll();
    return { error };
  };

  const openPatientChart = (id) => {
    setActivePatientId(id);
    setTab("prontuario");
  };

  if (loadingData) {
    return (
      <div style={S.loadingWrap}>
        <FontFaces />
        <Loader2 size={22} color="#2C6E68" />
        <span style={{ fontFamily: "Inter, sans-serif", color: "#5B6F6C", fontSize: 14 }}>
          Carregando dados da clínica…
        </span>
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
            onOpenChart={openPatientChart}
            notify={notify}
            usuario={usuario}
            savePatient={savePatient}
            deletePatient={deletePatient}
          />
        )}
        {tab === "agenda" && (
          <AgendaView
            patients={patients}
            appointments={appointments}
            dentistas={dentistas}
            onOpenChart={openPatientChart}
            notify={notify}
            usuario={usuario}
            saveAppointment={saveAppointment}
            setAppointmentStatus={setAppointmentStatus}
            deleteAppointment={deleteAppointment}
          />
        )}
        {tab === "prontuario" && (
          <ProntuarioView
            patients={patients}
            appointments={appointments}
            activePatientId={activePatientId}
            setActivePatientId={setActivePatientId}
            notify={notify}
            usuario={usuario}
          />
        )}
      </main>
      {toast && <div style={S.toast}><Check size={15} /> {toast}</div>}
    </div>
  );
}
