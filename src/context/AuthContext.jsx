import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usuarioError, setUsuarioError] = useState(null);

  const loadUsuario = useCallback(async (userId) => {
    if (!userId) {
      setUsuario(null);
      return;
    }
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, clinica_id, nome, papel, cro")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      setUsuarioError(error.message);
      setUsuario(null);
    } else if (!data) {
      setUsuarioError(
        "Este login existe, mas não há um registro em 'usuarios' vinculado a ele. Peça para o admin cadastrar você."
      );
      setUsuario(null);
    } else {
      setUsuarioError(null);
      setUsuario(data);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      await loadUsuario(session?.user?.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      await loadUsuario(session?.user?.id);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadUsuario]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ session, usuario, usuarioError, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de um AuthProvider");
  return ctx;
}
