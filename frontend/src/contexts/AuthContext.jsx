import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authApi } from "../services/api";

export function parseJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

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
      });
    } else {
      setUser({ email: "Usuário", nome: "Usuário" });
    }
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      updateUserFromToken(token);
    } else {
      localStorage.removeItem("token");
      setUser(null);
    }
    setLoading(false);
  }, [token, updateUserFromToken]);

  const login = async (email, senha) => {
    const { data } = await authApi.login(email, senha);
    setToken(data.token);
    return data;
  };

  const logout = () => setToken(null);

  const value = { token, user, login, logout, isAuthenticated: !!token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
