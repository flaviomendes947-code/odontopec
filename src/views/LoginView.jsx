import { useState } from "react";
import { Smile, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { S } from "../styles.js";
import { FontFaces, GlobalStyle } from "../components/Shared.jsx";

export default function LoginView() {
  const { signIn, usuarioError, signOut, session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const signInError = await signIn(email, password);
    setSubmitting(false);
    if (signInError) setError("E-mail ou senha inválidos.");
  };

  // Sessão válida no Supabase Auth, mas sem registro correspondente em `usuarios`.
  if (session && usuarioError) {
    return (
      <div style={S.loginPage}>
        <FontFaces />
        <GlobalStyle />
        <div style={S.loginCard}>
          <div style={S.loginBrand}>
            <div style={S.brandMark}><Smile size={18} color="#F6F3EC" /></div>
            <div>
              <div style={{ ...S.brandName, color: "#16302E" }}>OdontoRec</div>
            </div>
          </div>
          <div style={S.loginError}>{usuarioError}</div>
          <button style={{ ...S.secondaryBtn, marginTop: 14, width: "100%", justifyContent: "center" }} onClick={signOut}>
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.loginPage}>
      <FontFaces />
      <GlobalStyle />
      <div style={S.loginCard}>
        <div style={S.loginBrand}>
          <div style={S.brandMark}><Smile size={18} color="#F6F3EC" /></div>
          <div>
            <div style={{ ...S.brandName, color: "#16302E" }}>OdontoRec</div>
            <div style={{ fontSize: 11.5, color: "#5B6F6C" }}>Entrar no sistema</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={S.fieldLabel}>E-mail</span>
            <input
              type="email"
              style={S.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={S.fieldLabel}>Senha</span>
            <input
              type="password"
              style={S.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button
            type="submit"
            style={{ ...S.primaryBtn, justifyContent: "center", marginTop: 6, opacity: submitting ? 0.6 : 1 }}
            disabled={submitting}
          >
            {submitting ? <Loader2 size={15} className="spin" /> : null}
            Entrar
          </button>
          {error && <div style={S.loginError}>{error}</div>}
        </form>
        <div style={{ fontSize: 11, color: "#7C948E", marginTop: 16, lineHeight: 1.5 }}>
          Sem acesso? Peça para o administrador da clínica criar sua conta.
        </div>
      </div>
      <style>{`.spin{animation:spin 0.9s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
