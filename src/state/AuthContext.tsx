import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  type AuthSession,
  clearAuthSession,
  loadAuthSession,
  setAuthSession,
  subscribeAuthSession,
} from './authToken';
import { login as loginRequest } from '@/api/accountClient';

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  login: (slug: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuthSession().then((loaded) => {
      setSession(loaded);
      setLoading(false);
    });
    // Reacts to clearAuthSession() firing from anywhere, e.g. a 401 deep in an API call --
    // not just from this provider's own logout().
    return subscribeAuthSession(setSession);
  }, []);

  const login = async (slug: string, email: string, password: string) => {
    const result = await loginRequest(slug, email, password);
    await setAuthSession({ token: result.token, companyId: result.companyId, email: result.email });
  };

  const logout = async () => {
    await clearAuthSession();
  };

  return (
    <AuthContext.Provider value={{ session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
