export const TOOTH_CONDITIONS = {
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

export const PROCEDURE_TO_CONDITION = {
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

export const PROCEDURE_LABELS = {
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

export const UPPER_TEETH = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
export const LOWER_TEETH = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

export const APPT_STATUS = {
  agendado:  { label: "Agendado",   color: "#3D7FA6" },
  confirmado:{ label: "Confirmado", color: "#2C6E68" },
  concluido: { label: "Concluído",  color: "#5B8A5A" },
  cancelado: { label: "Cancelado",  color: "#9aa39d" },
};
