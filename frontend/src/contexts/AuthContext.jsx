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
        fotoUrl: payload.fotoUrl,
        cargos: payload.cargos || [],
        dataNascimento: payload.dataNascimento,
      });


    } else {
      setUser({ email: "Usuário", nome: "Usuário" });
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        localStorage.setItem("token", token);
        updateUserFromToken(token);
        
        // Fetch full profile to get fotoUrl and other details accurately
        try {
          const payload = parseJwtPayload(token);
          if (payload?.id) {
            const { data } = await usuarioApi.getById(payload.id);
            const usuario =
              data?.Usuario ||
              data?.usuario ||
              data?.data ||
              data;

            setUser(prev => ({
              ...prev,
              ...usuario,
              cargos: usuario?.cargos || prev?.cargos || []
            }));
          }
        } catch (e) {
          console.error("Erro ao carregar perfil completo:", e);
        }
      } else {
        localStorage.removeItem("token");
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, [token, updateUserFromToken]);

  const login = async (email, senha) => {
    const { data } = await authApi.login(email, senha);
    setToken(data.token);
    return data;
  };

  const logout = () => setToken(null);

  const value = { token, user, login, logout, loading, isAuthenticated: !!token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
