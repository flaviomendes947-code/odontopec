import { X, Save, AlertTriangle } from "lucide-react";
import { S } from "../styles.js";

export function FontFaces() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
    `}</style>
  );
}

export function GlobalStyle() {
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

export function ViewHeader({ title, subtitle, action }) {
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

export function SectionLabel({ icon: Icon, text }) {
  return (
    <div style={S.sectionLabel}>
      <Icon size={15} color="#2C6E68" />
      {text}
    </div>
  );
}

export function NoticeBanner({ icon: Icon = AlertTriangle, children }) {
  return (
    <div style={S.noticeBanner}>
      <Icon size={14} />
      <span>{children}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text }) {
  return (
    <div style={S.emptyState}>
      <div style={S.emptyIconWrap}><Icon size={22} color="#2C6E68" /></div>
      <div style={S.emptyTitle}>{title}</div>
      <div style={S.emptyText}>{text}</div>
    </div>
  );
}

export function IconBtn({ children, onClick, title, danger }) {
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

export function Field({ label, children, full }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: full ? "1 / -1" : "auto" }}>
      <span style={S.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

export function ModalShell({ title, onCancel, width, children }) {
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

export function ModalFooter({ onCancel, onSave, disabled, saveLabel }) {
  return (
    <div style={S.modalFoot}>
      <button style={S.secondaryBtn} onClick={onCancel}>Cancelar</button>
      <button style={{ ...S.primaryBtn, opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }} disabled={disabled} onClick={onSave}>
        <Save size={15} /> {saveLabel || "Salvar"}
      </button>
    </div>
  );
}

export function ConfirmDialog({ text, onCancel, onConfirm }) {
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
