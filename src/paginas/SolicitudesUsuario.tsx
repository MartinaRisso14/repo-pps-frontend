import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import logoConcordia from '../assets/logo2.png';

// La estructura real devuelta por la base de datos
interface Solicitud {
  id: number;
  usuCodigo: number;
  datosSolicitados: Record<string, any>;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  fechaCreacion: string;
  fechaRevision?: string | null;
  revisadoPor?: string | null;
  motivoRechazo?: string | null;
  familiaresAfectados?: string[];
}

export const SolicitudesUsuario: React.FC = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Solicitud | null>(null);
  const [cargando, setCargando] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuNombre');
    localStorage.removeItem('idRol');
    navigate('/login');
  };

  const token = localStorage.getItem('token') || '';
  const usuNombre = localStorage.getItem('usuNombre') || 'USUARIO';

  useEffect(() => {
    const obtenerSolicitudes = async () => {
      try {
        const res = await axios.get('http://localhost:3000/solicitudes/mis-solicitudes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data && Array.isArray(res.data)) {
          setSolicitudes(res.data);
        }
      } catch (err) {
        console.error('Error al traer solicitudes:', err);
      } finally {
        setCargando(false);
      }
    };

    obtenerSolicitudes();
  }, [token]);

  const handleVisualizarPDF = () => {
    if (!solicitudSeleccionada) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Franja verde institucional superior
    doc.setFillColor(79, 184, 34);
    doc.rect(0, 0, 210, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('MUNICIPALIDAD DE CONCORDIA', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Dirección de Recursos Humanos | Sistema de Legajo Único', 14, 25);

    // Caja de datos cabecera
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 32, 182, 26, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('N° SOLICITUD:', 18, 40);
    doc.text('FECHA REGISTRO:', 18, 48);
    doc.text('AGENTE / USUARIO:', 18, 54);

    doc.setFont('helvetica', 'normal');
    doc.text(`#${solicitudSeleccionada.id}`, 52, 40);
    doc.text(new Date(solicitudSeleccionada.fechaCreacion).toLocaleString(), 52, 48);
    doc.text(usuNombre.toUpperCase(), 52, 54);

    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO:', 125, 40);

    if (solicitudSeleccionada.estado === 'APROBADA') {
      doc.setTextColor(79, 184, 34);
    } else if (solicitudSeleccionada.estado === 'RECHAZADA') {
      doc.setTextColor(220, 38, 38);
    } else {
      doc.setTextColor(202, 138, 4);
    }
    doc.text(solicitudSeleccionada.estado, 145, 40);

    let startYTable = 66;
    if (solicitudSeleccionada.motivoRechazo) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('MOTIVO / OBSERVACIONES:', 14, 64);

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(51, 65, 85);
      doc.text(solicitudSeleccionada.motivoRechazo, 14, 69);
      startYTable = 76;
    }

    // Convertir objeto datosSolicitados a filas
    const datosObj = solicitudSeleccionada.datosSolicitados || {};
    const filasTabla = Object.entries(datosObj).map(([campo, valor]) => [
      campo.toUpperCase(),
      String(valor),
    ]);

    autoTable(doc, {
      startY: startYTable,
      head: [['CAMPO / CONCEPTO', 'VALOR SOLICITADO']],
      body: filasTabla,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { fontStyle: 'bold', textColor: [22, 101, 52], cellWidth: 112 },
      },
      margin: { left: 14, right: 14 },
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Documento oficial emitido - Página ${i} de ${totalPages}`, 14, 290);
    }

    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, '_blank');
  };

  const getBadgeEstado = (estado: Solicitud['estado']) => {
    switch (estado) {
      case 'PENDIENTE':
        return { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '#ca8a04' };
      case 'APROBADA':
        return { bg: 'rgba(79, 184, 34, 0.15)', color: '#4fb822', border: '#4fb822' };
      case 'RECHAZADA':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '#ef4444' };
      default:
        return { bg: '#333', color: '#fff', border: '#555' };
    }
  };

  if (cargando) {
    return (
      <div style={{ backgroundColor: '#121212', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
        RECUPERANDO SOLICITUDES...
      </div>
    );
  }

  return (
    <div style={pageContainerStyle}>
      {/* NAVBAR */}
      <header style={headerNavStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src={logoConcordia}
            alt="Municipalidad de Concordia"
            style={{
              height: '40px',
              width: 'auto',
              objectFit: 'contain',
              mixBlendMode: 'screen',
            }}
          />
          <div style={{ borderLeft: '1px solid #333333', paddingLeft: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f3f4f6', letterSpacing: '0.04em' }}>
              SISTEMA DE LEGAJO ÚNICO
            </div>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button type="button" onClick={() => navigate('/perfil')} style={btnVolverStyle}>
            ← VOLVER AL LEGAJO
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#262626',
              color: '#f87171',
              border: '1px solid #3f3f46',
              borderRadius: '6px',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div style={mainWrapperStyle}>
        <div style={{
          textAlign: 'center',
          padding: '12px 0 6px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={pillVerdeStyle}>CONSULTA DE TRÁMITES</span>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff', letterSpacing: '0.05em', fontWeight: 700 }}>
            HISTORIAL DE SOLICITUDES
          </h2>
          <span style={{ fontSize: '11px', color: '#9ca3af', letterSpacing: '0.04em' }}>
            EMPLEADO : {usuNombre.toUpperCase()}
          </span>
        </div>

        {/* LISTADO DE TARJETAS */}
        <div style={listContainerStyle}>
          {solicitudes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#777', backgroundColor: '#181818', borderRadius: '8px' }}>
              No tenés solicitudes registradas actualmente.
            </div>
          ) : (
            solicitudes.map((sol) => (
              <ItemSolicitudCard
                key={sol.id}
                sol={sol}
                badge={getBadgeEstado(sol.estado)}
                onSeleccionar={() => setSolicitudSeleccionada(sol)}
              />
            ))
          )}
        </div>
      </div>

      {/* MODAL EMERGENTE */}
      {solicitudSeleccionada && (
        <div style={modalOverlayStyle} onClick={() => setSolicitudSeleccionada(null)}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            {/* Header del modal */}
            <div style={detailHeaderStyle}>
              <div>
                <div style={{ fontSize: '11px', color: '#9ca3af', letterSpacing: '0.05em' }}>COMPROBANTE DE TRÁMITE</div>
                <h2 style={{ margin: '4px 0 2px 0', fontSize: '1.25rem', color: '#ffffff' }}>
                  SOLICITUD: #{solicitudSeleccionada.id}
                </h2>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  REGISTRADA EL {new Date(solicitudSeleccionada.fechaCreacion).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button type="button" onClick={handleVisualizarPDF} style={btnVerdeStyle}>
                  VER REPORTE EN PDF
                </button>
                <button type="button" onClick={() => setSolicitudSeleccionada(null)} style={btnCloseModalStyle}>
                  ✕
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '22px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af' }}>
                  ESTADO ACTUAL:
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: getBadgeEstado(solicitudSeleccionada.estado).bg,
                  color: getBadgeEstado(solicitudSeleccionada.estado).color,
                  border: `1px solid ${getBadgeEstado(solicitudSeleccionada.estado).border}`,
                }}>
                  {solicitudSeleccionada.estado}
                </span>
              </div>

              {solicitudSeleccionada.motivoRechazo && (
                <div style={alertObsStyle}>
                  <strong>MOTIVO DE RECHAZO:</strong> {solicitudSeleccionada.motivoRechazo}
                </div>
              )}

              <div style={{ marginBottom: '28px' }}>
                <div style={sectionDividerStyle}>
                  <span style={sectionTitleStyle}>MODIFICACIONES DECLARADAS</span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', backgroundColor: '#141414', border: '1px solid #282828' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2e2e2e' }}>
                      <th style={thStyle}>CAMPO / CONCEPTO</th>
                      <th style={{ ...thStyle, color: '#4fb822' }}>VALOR SOLICITADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudSeleccionada.datosSolicitados && Object.keys(solicitudSeleccionada.datosSolicitados).length > 0 ? (
                      Object.entries(solicitudSeleccionada.datosSolicitados).map(([campo, valor], i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #242424' }}>
                          <td style={{ ...tdStyle, fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {campo.replace(/([A-Z])/g, ' $1')}
                          </td>
                          <td style={{ ...tdStyle, color: '#ffffff', fontWeight: 'bold' }}>
                            {String(valor)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} style={{ ...tdStyle, textAlign: 'center', color: '#888' }}>
                          No hay campos modificados registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tarjeta con hover aislado
const ItemSolicitudCard: React.FC<{
  sol: Solicitud;
  badge: { bg: string; color: string; border: string };
  onSeleccionar: () => void;
}> = ({ sol, badge, onSeleccionar }) => {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onSeleccionar}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...cardItemStyle,
        backgroundColor: hover ? '#162214' : '#181818',
        borderColor: hover ? '#2e5a1c' : '#282828',
      }}
    >
      <div>
        <strong
          style={{
            fontSize: '15px',
            color: hover ? '#52b72a' : '#ffffff',
            display: 'block',
            marginBottom: '4px',
            transition: 'color 0.2s ease',
          }}
        >
          SOLICITUD #{sol.id}
        </strong>
        <div style={{ fontSize: '12px', color: '#888888' }}>
          Fecha: {new Date(sol.fechaCreacion).toLocaleString()}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 'bold',
          padding: '4px 10px',
          borderRadius: '4px',
          backgroundColor: badge.bg,
          color: badge.color,
          border: `1px solid ${badge.border}`,
        }}>
          {sol.estado}
        </span>
        <span
          style={{
            color: hover ? '#52b72a' : '#9ca3af',
            fontSize: '13px',
            fontWeight: 'bold',
            transition: 'color 0.2s ease',
          }}
        >
          Ver detalle →
        </span>
      </div>
    </div>
  );
};

// ESTILOS
const pageContainerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#121212',
  backgroundImage: 'radial-gradient(#1f1f1f 1px, transparent 1px)',
  backgroundSize: '20px 20px',
  padding: '2rem 1rem',
  fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif',
  boxSizing: 'border-box',
};

const headerNavStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#1a1a1a',
  borderBottom: '1px solid #2a2a2a',
  padding: '12px 24px',
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '28px',
};

const mainWrapperStyle: React.CSSProperties = {
  maxWidth: '900px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
};

const listContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const cardItemStyle: React.CSSProperties = {
  borderWidth: '1px',
  borderStyle: 'solid',
  borderRadius: '8px',
  padding: '16px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  userSelect: 'none',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '16px',
  boxSizing: 'border-box',
};

const modalCardStyle: React.CSSProperties = {
  backgroundColor: '#181818',
  border: '1px solid #282828',
  borderRadius: '8px',
  width: '100%',
  maxWidth: '850px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
};

const detailHeaderStyle: React.CSSProperties = {
  padding: '20px 24px',
  backgroundColor: '#141414',
  borderBottom: '1px solid #282828',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const pillVerdeStyle: React.CSSProperties = {
  fontSize: '10px',
  backgroundColor: 'rgba(79, 184, 34, 0.18)',
  color: '#4fb822',
  fontWeight: 'bold',
  padding: '2px 8px',
  borderRadius: '4px',
};

const btnVerdeStyle: React.CSSProperties = {
  backgroundColor: '#4fb822',
  color: '#ffffff',
  border: 'none',
  borderRadius: '5px',
  padding: '8px 16px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '0.04em',
};

const btnCloseModalStyle: React.CSSProperties = {
  backgroundColor: '#262626',
  color: '#ffffff',
  border: '1px solid #383838',
  borderRadius: '4px',
  padding: '6px 12px',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const sectionDividerStyle: React.CSSProperties = {
  borderBottom: '1px solid #2e2e2e',
  paddingBottom: '6px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '11.5px',
  fontWeight: 700,
  color: '#9ca3af',
};

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '11px',
  color: '#9ca3af',
  textAlign: 'left',
};

const tdStyle: React.CSSProperties = {
  padding: '11px 12px',
  fontSize: '12.5px',
  color: '#e5e7eb',
};

const alertObsStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  borderLeft: '4px solid #ef4444',
  padding: '10px 14px',
  fontSize: '12px',
  color: '#f87171',
  marginBottom: '20px',
};

const btnVolverStyle: React.CSSProperties = {
  backgroundColor: '#262626',
  color: '#9ca3af',
  border: '1px solid #383838',
  borderRadius: '4px',
  padding: '6px 12px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  letterSpacing: '0.03em',
};