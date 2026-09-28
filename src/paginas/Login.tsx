import React, { useState } from 'react';
import { authService } from '../services/auth.service';

export const Login: React.FC = () => {
  const [usuNombre, setUsuNombre] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authService.login(usuNombre, password);
      alert(`¡Bienvenido/a, ${res.usuario.apeNom}!`);
      // Más adelante acá redirigimos al dashboard según el rol
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '320px', padding: '24px', border: '1px solid #ccc', borderRadius: '8px', gap: '12px' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 12px 0' }}>Iniciar Sesión</h2>

        {error && <div style={{ color: 'red', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <div>
          <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>Usuario:</label>
          <input
            type="text"
            value={usuNombre}
            onChange={(e) => setUsuNombre(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

       <div>
         <label style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>Contraseña:</label>
         <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
         <input
           type={mostrarPassword ? 'text' : 'password'}
           value={password}
           onChange={(e) => setPassword(e.target.value)}
           required
           placeholder="Ingresá tu contraseña"
           style={{  width: '100%', padding: '8px 36px 8px 8px', boxSizing: 'border-box'}}
         />
           <button
             type="button"
             onClick={() => setMostrarPassword(!mostrarPassword)}
             style={{ position: 'absolute',right: '8px', background: 'transparent', border: 'none',cursor: 'pointer',color: '#888',display: 'flex',alignItems: 'center',padding: 0}}
             >
             {mostrarPassword ? (
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
             <line x1="1" y1="1" x2="23" y2="23"></line>
             </svg>
            ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
          </svg>
      )}
       </button>
     </div>
  </div>

      <div style={{ textAlign: 'right', marginTop: '6px' }}>
        <a
          href="#"
         onClick={(e) => {
         e.preventDefault();
         alert('Funcionalidad de recuperación en desarrollo');
      }}
         style={{
         color: '#3b82f6',
         fontSize: '13px',
         textDecoration: 'none',
         cursor: 'pointer'
      }}
    >
     ¿Olvidaste tu contraseña?
    </a>
  </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '10px', marginTop: '8px', cursor: loading ? 'not-allowed' : 'pointer', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
        >
          {loading ? 'Ingresando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};