import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon } from 'lucide-react'; // Iconos bonitos

export const Login = () => {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const err = await login(formData);
    
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="card">
      <h1 className="text-center" style={{ marginBottom: '2rem', color: 'var(--primary-cyan)' }}>
        OBS Controller
      </h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', color: 'var(--text-secondary)' }}>
            <UserIcon size={16} /> Usuario
          </label>
          <input type="text" name="username" placeholder="Tu usuario" required autoFocus />
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', color: 'var(--text-secondary)' }}>
            <Lock size={16} /> Contraseña
          </label>
          <input type="password" name="password" placeholder="••••••••" required />
        </div>

        <button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Iniciar Sesión'}
        </button>
      </form>

      {error && (
        <p style={{ color: 'var(--error)', textAlign: 'center', marginTop: '1rem' }}>
          {error}
        </p>
      )}
    </div>
  );
};