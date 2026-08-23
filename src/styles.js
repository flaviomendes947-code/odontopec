export const FONT_DISPLAY = "'Fraunces', serif";
export const FONT_BODY = "'Inter', sans-serif";
export const FONT_MONO = "'IBM Plex Mono', monospace";

export const INK = "#16302E";
export const PAPER = "#EFF3F1";
export const SURFACE = "#FFFFFF";
export const PRIMARY = "#2C6E68";
export const PRIMARY_DARK = "#1D4F4B";
export const LINE = "#DCE3DE";
export const MUTED = "#5B6F6C";

export const S = {
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
  sidebarUser: { fontSize: 12, color: "#C7D4CF", fontWeight: 600 },
  sidebarUserRole: { fontSize: 10.5, color: "#7C948E", marginTop: 1, textTransform: "capitalize" },
  logoutBtn: {
    marginTop: 8, background: "transparent", border: `1px solid rgba(255,255,255,0.18)`, color: "#C7D4CF",
    borderRadius: 7, padding: "6px 10px", fontSize: 11.5, fontWeight: 600, textAlign: "left",
  },
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
  noticeBanner: {
    display: "flex", alignItems: "center", gap: 8, background: "#FBF3E4", color: "#8A6516",
    border: "1px solid #EBD9AE", borderRadius: 10, padding: "9px 13px", fontSize: 12.5,
    marginBottom: 14,
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

  loginPage: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: PAPER, fontFamily: FONT_BODY,
  },
  loginCard: {
    background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 16, padding: 32,
    width: "100%", maxWidth: 360, boxShadow: "0 12px 36px rgba(22,48,46,0.08)",
  },
  loginBrand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 22 },
  loginError: {
    background: "#FBEDE9", color: "#A5402F", fontSize: 12.5, borderRadius: 8,
    padding: "9px 12px", marginTop: 12, lineHeight: 1.4,
  },
};
