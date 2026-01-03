/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthResponse } from '../types';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: FormData) => Promise<string | null>; // Retorna error si falla
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sesión al cargar la página
  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then((data: AuthResponse) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (formData: FormData): Promise<string | null> => {
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const data: AuthResponse = await res.json();

      if (res.ok && data.user) {
        setUser(data.user);
        return null; // Sin error
      }
      return data.error || 'Error al iniciar sesión';
    } catch {
      return 'Error de conexión';
    }
  };

  const logout = async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};