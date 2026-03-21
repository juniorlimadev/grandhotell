/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authApi, usuarioApi } from "../services/api";

import { parseJwtPayload } from "../utils/jwt-utils";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateUserFromToken = useCallback((t) => {
    if (!t) {
      setUser(null);
      return;
    }
    const payload = parseJwtPayload(t);
    if (payload) {
      setUser({
        id: payload.id,
        email: payload.sub || payload.email || "Usuário",
        nome: payload.nome || payload.sub || "Usuário",
        cargos: payload.cargos || [],
        dataNascimento: payload.dataNascimento,
      });


    } else {
      setUser({ email: "Usuário", nome: "Usuário" });
    }
  }, []);

  const normalizeUsuario = (data) => {
    // Backend costuma retornar algo como { Usuario: ... } ou { usuario: ... } (ou ainda "data")
    return data?.Usuario || data?.usuario || data?.data || data;
  };

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem("token");
    if (!t) return;

    const payload = parseJwtPayload(t);
    if (!payload?.id) return;

    try {
      const { data } = await usuarioApi.getById(payload.id);
      const usuario = normalizeUsuario(data);
      setUser((prev) => ({
        ...(prev || {}),
        ...(usuario || {}),
        cargos: usuario?.cargos || prev?.cargos || [],
      }));
    } catch (e) {
      // Se falhar, não quebra a UI: mantém o que já tinha do token.
      console.error("Erro ao atualizar perfil (refreshUser):", e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      if (token) {
        localStorage.setItem("token", token);
        updateUserFromToken(token);

        // Libera a UI imediatamente; o refresh do perfil (foto, etc.) roda em background.
        if (!cancelled) setLoading(false);

        refreshUser();
      } else {
        localStorage.removeItem("token");
        setUser(null);
        if (!cancelled) setLoading(false);
      }
    };

    initAuth();
    return () => {
      cancelled = true;
    };
  }, [token, updateUserFromToken, refreshUser]);

  const login = async (email, senha) => {
    const { data } = await authApi.login(email, senha);
    setToken(data.token);
    return data;
  };

  const loginGoogle = async (googleToken) => {
    const { data } = await authApi.loginGoogle(googleToken);
    setToken(data.token);
    return data;
  };

  const logout = () => setToken(null);

  const value = { token, user, login, loginGoogle, logout, refreshUser, loading, isAuthenticated: !!token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
