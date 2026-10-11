import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { http, HttpError, getToken, setToken } from "@/lib/http";
import type { SessionUser } from "@/types";
import type { LoginInput, SignupInput } from "@/lib/validation/auth";

type AuthResponse = { token: string; user: SessionUser };

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (input: LoginInput) => Promise<SessionUser>;
  signup: (input: SignupInput) => Promise<SessionUser>;
  /** For the admin login form — applies a token obtained out-of-band. */
  applyAuth: (res: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user } = await http.get<{ user: SessionUser | null }>("/api/auth/me");
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // A 401 anywhere clears the session.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("ajc:unauthorized", onUnauthorized);
    return () => window.removeEventListener("ajc:unauthorized", onUnauthorized);
  }, []);

  const applyAuth = useCallback((res: AuthResponse) => {
    setToken(res.token);
    setUser(res.user);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const res = await http.post<AuthResponse>("/api/auth/login", input);
      applyAuth(res);
      return res.user;
    },
    [applyAuth],
  );

  const signup = useCallback(
    async (input: SignupInput) => {
      const res = await http.post<AuthResponse>("/api/auth/signup", input);
      applyAuth(res);
      return res.user;
    },
    [applyAuth],
  );

  const logout = useCallback(() => {
    http.post("/api/auth/logout").catch((err) => {
      if (!(err instanceof HttpError)) console.warn(err);
    });
    setToken(null);
    setUser(null);
    navigate("/");
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, refresh, login, signup, applyAuth, logout }),
    [user, loading, refresh, login, signup, applyAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
