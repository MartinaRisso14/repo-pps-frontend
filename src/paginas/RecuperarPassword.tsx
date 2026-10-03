import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

export const RecuperarPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);
    setCargando(true);

    try {
      await authService.solicitarRecuperacion(email);
      setMensajeExito('Si el correo está registrado, te enviaremos un enlace de recuperación.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ocurrió un error al procesar la solicitud.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#121212',
      fontFamily: 'sans-serif'
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: '#1e1e1e',
          padding: '2.5rem',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          border: '1px solid #2e2e2e'
        }}
      >
        <h2 style={{ color: '#ffffff', textAlign: 'center', margin: 0 }}>
          Recuperar Contraseña
        </h2>
        
        <p style={{ color: '#aaa', fontSize: '0.9rem', textAlign: 'center', margin: 0 }}>
          Ingresá tu correo para recibir las instrucciones de restablecimiento.
        </p>

        {mensajeExito && (
          <div style={{
            backgroundColor: 'rgba(74, 222, 128, 0.15)',
            border: '1px solid #4ade80',
            color: '#4ade80',
            padding: '0.6rem',
            borderRadius: '6px',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {mensajeExito}
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 77, 79, 0.15)',
            border: '1px solid #ff4d4f',
            color: '#ff7875',
            padding: '0.6rem',
            borderRadius: '6px',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ color: '#bbb', fontSize: '0.9rem' }}>Correo electrónico:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="ejemplo@correo.com"
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #3a3a3a',
              backgroundColor: '#2a2a2a',
              color: '#ffffff',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={{
            marginTop: '0.5rem',
            padding: '0.8rem',
            backgroundColor: cargando ? '#1d4ed8' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: cargando ? 'not-allowed' : 'pointer'
          }}
        >
          {cargando ? 'Enviando...' : 'Enviar enlace'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
            style={{
              color: '#9ca3af',
              fontSize: '0.85rem',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            ← Volver al inicio de sesión
          </a>
        </div>
      </form>
    </div>
  );
};