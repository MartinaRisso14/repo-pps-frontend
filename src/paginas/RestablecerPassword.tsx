import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';

export const RestablecerPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // El token viaja en la URL: /restablecer-password?token=xxxx
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);

    if (!token) {
      setError('El enlace es inválido o no incluye el token de recuperación.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      await authService.resetPassword(token, password);
      setMensaje('¡Contraseña actualizada con éxito! Redirigiendo al login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'El enlace expiró o es inválido. Solicitá uno nuevo.'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '2rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Nueva Contraseña</h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          Ingresá tu nueva clave para restablecer el acceso a tu cuenta.
        </p>

        {mensaje && (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', marginBottom: '1rem' }}>
            {mensaje}
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nueva Contraseña</label>
            <input
              type={mostrarPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Confirmar Contraseña</label>
            <input
              type={mostrarPassword ? 'text' : 'password'}
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="verClave"
              checked={mostrarPassword}
              onChange={(e) => setMostrarPassword(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="verClave" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
              Mostrar contraseñas
            </label>
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {cargando ? 'Guardando...' : 'Restablecer Contraseña'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.9rem' }}>
            Volver al Login
          </Link>
        </div>
      </div>
    </div>
  );
};