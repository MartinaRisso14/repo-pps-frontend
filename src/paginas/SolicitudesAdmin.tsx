import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoConcordia from '../assets/logo2.png';
import axios from 'axios';

interface SolicitudAdmin {
  id: number;
  nroSolicitud: string;
  legajo: string;
  agente: string;
  campo: string;
  valorAnterior: string;
  valorSolicitado: string;
  fecha: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  documentoUrl?: string;
  observaciones?: string;
}

export const SolicitudesAdmin: React.FC = () => {
  const navigate = useNavigate();

  const [modalFeedback, setModalFeedback] = useState<{
  abierto: boolean;
  tipo: 'exito' | 'error' | 'advertencia';
  titulo: string;
  mensaje: string;
    }>({
      abierto: false,
      tipo: 'exito',
      titulo: '',
      mensaje: '',
    });

// Función helper para abrirlo fácilmente
const mostrarNotificacion = (tipo: 'exito' | 'error' | 'advertencia', titulo: string, mensaje: string) => {
  setModalFeedback({ abierto: true, tipo, titulo, mensaje });
};

const cerrarModal = () => {
  setModalFeedback((prev) => ({ ...prev, abierto: false }));
};

  // Estados reales (inician vacíos)
  const [solicitudes, setSolicitudes] = useState<SolicitudAdmin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudAdmin | null>(null);
  const [motivoResolucion, setMotivoResolucion] = useState('');

  // 1. Obtener usuario logueado para no mostrar sus propias solicitudes
  const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');
  const miUsuCodigo = usuarioActual?.usucodigo || usuarioActual?.id;

  // 2. Traer solicitudes reales y mapear los campos para la vista
  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/solicitudes', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const lista = Array.isArray(res.data) ? res.data : [];

      // Mapeamos los datos de PostgreSQL al formato que espera tu JSX
      const adaptadas: SolicitudAdmin[] = lista
        .filter((s: any) => (s.usuCodigo ?? s.usucodigo) !== miUsuCodigo)
        .map((s: any) => {
          const ds = s.datosSolicitados || {};
          
          // Detectar qué dato se solicitó actualizar
          let campoDetectado = 'DATOS PERSONALES';
          let valorNuevo = '-';

          if (ds.email) {
            campoDetectado = 'EMAIL';
            valorNuevo = ds.email;
          } else if (ds.estadoCivil) {
            campoDetectado = 'ESTADO CIVIL';
            valorNuevo = ds.estadoCivil;
          } else if (ds.calle || ds.callenro) {
            campoDetectado = 'DOMICILIO';
            valorNuevo = `${ds.calle || ''} ${ds.callenro || ''}`.trim();
          }

          return {
            id: s.id,
            usuCodigo: s.usuCodigo ?? s.usucodigo,
            nroSolicitud: `SOL-2026-${String(s.id).padStart(5, '0')}`,
            legajo: String(s.legajo ?? ds.legajo ?? 'S/L'),
            agente: s.agente || ds.apenom || `Usuario #${s.usuCodigo ?? s.usucodigo}`,
            campo: campoDetectado,
            valorAnterior: '(Ver en legajo)',
            valorSolicitado: valorNuevo,
            fecha: s.fechaCreacion ? s.fechaCreacion.substring(0, 16).replace('T', ' ') : '',
            estado: s.estado,
            documentoUrl: ds.archivoCudUrl || ds.documentoUrl || null,
            observaciones: s.motivoRechazo || s.observacion || '',
            datosSolicitados: ds,
          };
        });

      setSolicitudes(adaptadas);
      if (adaptadas.length > 0) {
        setSolicitudSeleccionada(adaptadas[0]);
      } else {
        setSolicitudSeleccionada(null);
      }
    } catch (err) {
      console.error('Error cargando solicitudes:', err);
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
    cargarSolicitudes();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  // 3. Aprobar / Rechazar impactando en la base de datos
  const handleResolver = async (nuevoEstado: 'APROBADA' | 'RECHAZADA') => {
    if (!solicitudSeleccionada) return;

    if (nuevoEstado === 'RECHAZADA' && !motivoResolucion.trim()) {
      mostrarNotificacion(
        'advertencia',
        'Atención requerida',
        'Debe ingresar un motivo para rechazar la solicitud.'
      );
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const endpoint = nuevoEstado === 'APROBADA'
        ? `http://localhost:3000/solicitudes/${solicitudSeleccionada.id}/aprobar`
        : `http://localhost:3000/solicitudes/${solicitudSeleccionada.id}/rechazar`;

      await axios.patch(
        endpoint,
        nuevoEstado === 'RECHAZADA' ? { motivoRechazo: motivoResolucion } : {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      mostrarNotificacion(
        'exito',
        'Operación exitosa',
        `La solicitud #${solicitudSeleccionada.id} fue ${nuevoEstado.toLowerCase()} correctamente.`
      );
      setMotivoResolucion('');
      
      // Recargar lista fresca desde PostgreSQL
      await cargarSolicitudes();
    } catch (error: any) {
      console.error('Error al resolver trámite:', error);
      mostrarNotificacion(
        'error',
        'Error del servidor',
        error.response?.data?.message || 'No se pudo procesar la solicitud.'
      );
    }
  };

  // 4. Búsqueda y filtros sobre datos reales
  const solicitudesFiltradas = solicitudes.filter((s: any) => {
    const matchEstado = filtroEstado === 'TODAS' || s.estado === filtroEstado;
    const nro = String(s.nroSolicitud || `#${s.id}`).toLowerCase();
    const legajo = String(s.legajo || s.datosSolicitados?.legajo || '');
    const agente = String(s.agente || s.apenom || '').toLowerCase();
    const term = busqueda.toLowerCase();

    return matchEstado && (nro.includes(term) || legajo.includes(term) || agente.includes(term));
  });

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#121212',
      color: '#ffffff',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>


      {/* NAVBAR SUPERIOR INSTITUCIONAL */}
<header style={{
  width: '100%',
  backgroundColor: '#1a1a1a',
  borderBottom: '1px solid #2a2a2a',
  padding: '12px 24px',
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}}>
  {/* LOGO */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <img src={logoConcordia} alt="Concordia" style={{ height: '38px', mixBlendMode: 'screen' }} />
    <div style={{ borderLeft: '1px solid #333333', paddingLeft: '14px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f3f4f6' }}>
        SISTEMA DE LEGAJO ÚNICO
      </div>
    </div>
  </div>

  {/* NAVEGACIÓN (Rol autorizador y datos personales) */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    
    {/* VISTA PERSONAL DEL ADMIN */}
    <button
      onClick={() => navigate('/perfil')}
      style={{
        backgroundColor: '#262626',
        color: '#93c5fd', 
        border: '1px solid #1e3a8a',
        borderRadius: '6px',
        padding: '7px 12px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
     Mis datos / Solicitar cambio
    </button>


  
    {/* SALIR */}
    <button
      onClick={handleLogout}
      style={{
        backgroundColor: '#262626',
        color: '#f87171',
        border: '1px solid #3f3f46',
        borderRadius: '6px',
        padding: '7px 12px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      Cerrar sesión
    </button>
  </div>
</header>

      {/* 2. CUERPO PRINCIPAL */}
      <main style={{ maxWidth: '1250px', width: '100%', margin: '20px auto', padding: '0 20px', boxSizing: 'border-box' }}>
        
        {/* FILTROS Y BÚSQUEDA */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          gap: '16px',
        }}>
          <input
            type="text"
            placeholder="Buscar por legajo, apellido o N° solicitud..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              backgroundColor: '#121212',
              border: '1px solid #3f3f46',
              borderRadius: '6px',
              color: '#fff',
              padding: '8px 14px',
              fontSize: '13px',
              width: '320px',
            }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            {['TODAS', 'PENDIENTE', 'APROBADA', 'RECHAZADA'].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                style={{
                  backgroundColor: filtroEstado === estado ? '#22c55e' : '#262626',
                  color: filtroEstado === estado ? '#000' : '#d1d5db',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {estado}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENEDOR 2 COLUMNAS */}
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '20px' }}>
          
          {/* BANDEJA IZQUIERDA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {solicitudesFiltradas.map((s) => (
              <div
                key={s.id}
                onClick={() => setSolicitudSeleccionada(s)}
                style={{
                  backgroundColor: solicitudSeleccionada?.id === s.id ? '#1e293b' : '#18181b',
                  border: `1px solid ${solicitudSeleccionada?.id === s.id ? '#22c55e' : '#27272a'}`,
                  borderRadius: '8px',
                  padding: '14px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '13px', color: '#f3f4f6' }}>{s.nroSolicitud}</strong>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: s.estado === 'PENDIENTE' ? '#78350f' : s.estado === 'APROBADA' ? '#14532d' : '#7f1d1d',
                    color: s.estado === 'PENDIENTE' ? '#fde047' : s.estado === 'APROBADA' ? '#86efac' : '#fca5a5',
                  }}>
                    {s.estado}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{s.agente}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Legajo: {s.legajo} | {s.campo}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>{s.fecha}</div>
              </div>
            ))}
          </div>

          {/* AUDITORÍA Y RESOLUCIÓN DERECHA */}
          {solicitudSeleccionada ? (
            <div style={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 700 }}>EXPEDIENTE DIGITAL</span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.3rem' }}>{solicitudSeleccionada.nroSolicitud}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                  Agente: <strong style={{ color: '#fff' }}>{solicitudSeleccionada.agente}</strong> (Legajo: {solicitudSeleccionada.legajo})
                </p>
              </div>

              {/* TABLA COMPARATIVA */}
              <div style={{ backgroundColor: '#121212', borderRadius: '6px', padding: '14px', border: '1px solid #27272a' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>CAMBIO SOLICITADO: {solicitudSeleccionada.campo}</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#ef4444' }}>VALOR ANTERIOR (EN BASE)</label>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>{solicitudSeleccionada.valorAnterior}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#22c55e' }}>NUEVO VALOR DECLARADO</label>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px', color: '#4ade80' }}>{solicitudSeleccionada.valorSolicitado}</div>
                  </div>
                </div>
              </div>

              {/* DOCUMENTO ADJUNTO */}
              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>DOCUMENTACIÓN RESPALDATORIA</span>
                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={() => alert('Abriendo documento...')}
                    style={{
                      backgroundColor: '#262626',
                      border: '1px solid #3f3f46',
                      color: '#60a5fa',
                      borderRadius: '6px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    📄 Ver Certificado / Acta Adjunta (PDF)
                  </button>
                </div>
              </div>

              {/* CAMPO DE DICTAMEN / MOTIVO */}
              {solicitudSeleccionada.estado === 'PENDIENTE' ? (
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>OBSERVACIONES DE RRHH</label>
                  <textarea
                    rows={3}
                    placeholder="Escriba aquí los fundamentos (obligatorio en caso de rechazo)..."
                    value={motivoResolucion}
                    onChange={(e) => setMotivoResolucion(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#121212',
                      border: '1px solid #3f3f46',
                      borderRadius: '6px',
                      color: '#fff',
                      padding: '10px',
                      marginTop: '6px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                    <button
                      onClick={() => handleResolver('RECHAZADA')}
                      style={{
                        backgroundColor: '#7f1d1d',
                        color: '#fecaca',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '10px 18px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Rechazar Solicitud
                    </button>
                    <button
                      onClick={() => handleResolver('APROBADA')}
                      style={{
                        backgroundColor: '#22c55e',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '10px 18px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Aprobar y Actualizar Legajo
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px', backgroundColor: '#121212', borderRadius: '6px', border: '1px solid #27272a' }}>
                  <span style={{ fontSize: '11px', color: '#71717a' }}>RESOLUCIÓN FINAL</span>
                  <div style={{ fontSize: '13px', marginTop: '4px', color: '#e2e8f0' }}>
                    {solicitudSeleccionada.observaciones || 'Trámite procesado sin observaciones asentadas.'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a' }}>
              Seleccione una solicitud para auditar
            </div>
          )}
        </div>
      </main>
      {modalFeedback.abierto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: '#1e1e1e',
            border: `1px solid ${
              modalFeedback.tipo === 'exito'
                ? '#22c55e'
                : modalFeedback.tipo === 'error'
                ? '#ef4444'
                : '#f59e0b'
            }`,
            borderRadius: '12px',
            padding: '24px 28px',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
          }}>
            {/* Ícono según tipo */}
            <div style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                modalFeedback.tipo === 'exito'
                  ? 'rgba(34, 197, 94, 0.15)'
                  : modalFeedback.tipo === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(245, 158, 11, 0.15)',
              color:
                modalFeedback.tipo === 'exito'
                  ? '#22c55e'
                  : modalFeedback.tipo === 'error'
                  ? '#ef4444'
                  : '#f59e0b',
              fontSize: '22px',
              fontWeight: 'bold',
            }}>
              {modalFeedback.tipo === 'exito' ? '✓' : modalFeedback.tipo === 'error' ? '✕' : '!'}
            </div>

            <h3 style={{ margin: '0 0 8px', color: '#ffffff', fontSize: '18px', fontWeight: 600 }}>
              {modalFeedback.titulo}
            </h3>
            <p style={{ margin: '0 0 24px', color: '#9ca3af', fontSize: '14px', lineHeight: 1.5 }}>
              {modalFeedback.mensaje}
            </p>

            <button
              onClick={cerrarModal}
              style={{
                backgroundColor:
                  modalFeedback.tipo === 'exito'
                    ? '#16a34a'
                    : modalFeedback.tipo === 'error'
                    ? '#dc2626'
                    : '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                width: '100%',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};