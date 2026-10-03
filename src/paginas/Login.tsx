import React, { useState } from 'react';
import { authService } from '../services/auth.service';
import { Link, useNavigate } from 'react-router-dom';
import logoConcordia from '../assets/logo2.png';

export const Login: React.FC = () => {
  const [usuNombre, setUsuNombre] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authService.login(usuNombre, password);
      console.log('LO QUE DEVUELVE EL LOGIN:', res);

      const token = res?.access_token;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('usuNombre', usuNombre);

        // Accedemos directo a res.usuario.idRol
        const data = res as any;
        const idRol = data?.usuario?.idRol;

        if (idRol !== undefined && idRol !== null) {
          localStorage.setItem('idRol', String(idRol));
        }

        // Si es 1 (Admin/Autorizador), va a la pantalla de admin
        if (Number(idRol) === 1) {
          navigate('/admin/solicitudes');
        } else {
          navigate('/perfil');
        }
      } else {
        navigate('/perfil');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

    const handleLimpiar = () => {
      setUsuNombre('');
      setPassword('');
      setError(null);
    };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
    {/* CABECERA INSTITUCIONAL */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            {/* Ícono con contenedor circular blanco sutil para que no se trasluzca */}
            <div >
              <img
                 src={logoConcordia}
                 alt="Municipalidad de Concordia"
                 style={{
                 height: '52px',
                 width: 'auto',
                 maxWidth: '260px',
                 objectFit: 'contain',
                 mixBlendMode: 'screen',
                 }}
              />

            </div>

           
          </div>

          <h3 style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em' }}>
            INGRESO AL SISTEMA DE LEGAJO
          </h3>
        </div>
        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* CAMPO USUARIO */}
          <div>
            <div style={inputGroupStyle}>
              <div style={iconBoxStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Nombre de usuario o DNI"
                value={usuNombre}
                onChange={(e) => setUsuNombre(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          {/* CAMPO CONTRASEÑA */}
          <div>
            <div style={inputGroupStyle}>
              <div style={iconBoxStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                style={togglePasswordButtonStyle}
                title={mostrarPassword ? 'Ocultar' : 'Mostrar'}
              >
                {mostrarPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginTop: '-4px' }}>
            <Link to="/recuperar-password" style={linkStyle}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* BOTONERA INFERIOR */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={handleLimpiar}
              disabled={loading}
              style={btnLimpiarStyle}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Limpiar
            </button>

            <button
              type="submit"
              disabled={loading}
              style={btnContinuarStyle}
            >
              {loading ? 'Ingresando...' : (
                <>
                  Entrar
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

// ESTILOS TIPO MUNICIPALIDAD DE CONCORDIA (DARK + GREEN + ACCENTS)
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#121212',
  backgroundImage: 'radial-gradient(#1f1f1f 1px, transparent 1px)',
  backgroundSize: '20px 20px',
  fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif',
  padding: '1rem',
  boxSizing: 'border-box',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '440px',
  backgroundColor: '#181818',
  border: '1px solid #282828',
  borderRadius: '10px',
  padding: '36px 32px',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6)',
  boxSizing: 'border-box',
};

const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#1c1c1c',
  border: '1px solid #2e2e2e',
  borderRadius: '6px',
  overflow: 'hidden',
  transition: 'border-color 0.2s',
};

const iconBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '42px',
  height: '42px',
  backgroundColor: '#232323',
  borderRight: '1px solid #2e2e2e',
  flexShrink: 0,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  padding: '10px 14px',
  color: '#f0f0f0',
  fontSize: '13.5px',
};

const togglePasswordButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '0 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const linkStyle: React.CSSProperties = {
  color: '#9e9e9e',
  fontSize: '12px',
  textDecoration: 'none',
};

const btnLimpiarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  backgroundColor: '#4fb822',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  padding: '11px',
  fontSize: '13px',
  fontWeight: 'bold',
  cursor: 'pointer',
  letterSpacing: '0.02em',
};

const btnContinuarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  backgroundColor: '#383d42',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  padding: '11px',
  fontSize: '13px',
  fontWeight: 'bold',
  cursor: 'pointer',
  letterSpacing: '0.02em',
};

const errorStyle: React.CSSProperties = {
  color: '#ef4444',
  fontSize: '12.5px',
  textAlign: 'center',
  marginBottom: '14px',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  padding: '8px',
  borderRadius: '5px',
};