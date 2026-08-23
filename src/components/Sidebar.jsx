import { User, Calendar as CalendarIcon, FileText, Smile, LogOut } from "lucide-react";
import { S } from "../styles.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Sidebar({ tab, setTab }) {
  const { usuario, signOut } = useAuth();
  const items = [
    { id: "pacientes", label: "Pacientes", icon: User },
    { id: "agenda", label: "Agenda", icon: CalendarIcon },
    ...(usuario?.papel !== "recepcao" ? [{ id: "prontuario", label: "Prontuário", icon: FileText }] : []),
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
        {usuario && (
          <>
            <div style={S.sidebarUser}>{usuario.nome}</div>
            <div style={S.sidebarUserRole}>{usuario.papel}</div>
          </>
        )}
        <button style={S.logoutBtn} onClick={signOut}>
          <LogOut size={12} style={{ marginRight: 5, verticalAlign: "-2px" }} />
          Sair
        </button>
      </div>
    </aside>
  );
}
