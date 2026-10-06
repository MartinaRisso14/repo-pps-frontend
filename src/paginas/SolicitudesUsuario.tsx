import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import { authService } from '../services/auth.service';
import { EncabezadoInstitucional } from '../componentes/EncabezadoInstitucional';

// La estructura real devuelta por la base de datos
interface Solicitud {
  id: number;
  usuCodigo: number;
  datosSolicitados: Record<string, any>;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
  fechaCreacion: string;
  fechaRevision?: string | null;
  revisadoPor?: string | null;
  motivoRechazo?: string | null;
  familiaresAfectados?: string[];
}

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return '';

  const fechaConZona = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(fecha)
    ? fecha
    : `${fecha.replace(' ', 'T')}Z`;

  return new Date(fechaConZona).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
};

const obtenerFilasDatosSolicitud = (datos: Record<string, any>) => {
  const filas: [string, string][] = [];
  const familiaresDestacados = Array.isArray(datos.familiares)
    ? datos.familiares.filter((familiar: any) => familiar?.esNuevo || familiar?.eliminado)
    : [];
  const mostrarSoloCambiosFamiliares = familiaresDestacados.length > 0;

  for (const [campo, valor] of Object.entries(datos)) {
    if (campo === 'familiares' && Array.isArray(valor)) {
      const familiaresAMostrar = mostrarSoloCambiosFamiliares
        ? familiaresDestacados
        : valor;
      familiaresAMostrar.forEach((familiar: any, indice: number) => {
        if (!familiar || typeof familiar !== 'object') return;

        const nombre = [familiar.apellido, familiar.nombres].filter(Boolean).join(' ')
          || familiar.apeNom
          || '';
        if (familiar.eliminado) {
          filas.push([`FAMILIAR DADO DE BAJA · ${nombre || indice + 1}`, 'Baja lógica solicitada']);
          return;
        }
        const detalles = [
          familiar.parentesco && `Vínculo: ${familiar.parentesco}`,
          nombre && `Nombre: ${nombre}`,
          (familiar.tipoDocumento || familiar.nroDocumento || familiar.dni)
            && `Documento: ${[familiar.tipoDocumento, familiar.nroDocumento || familiar.dni].filter(Boolean).join(' ')}`,
          familiar.sexo && `Sexo: ${familiar.sexo}`,
          (familiar.fechaNacimiento || familiar.f_nacimiento)
            && `Fecha de nacimiento: ${familiar.fechaNacimiento || familiar.f_nacimiento}`,
          familiar.discapacitado !== undefined
            && `Discapacidad: ${familiar.discapacitado ? 'Sí' : 'No'}`,
        ].filter(Boolean);

        if (detalles.length > 0) {
          filas.push([`FAMILIAR ${indice + 1}`, detalles.join('\n')]);
        }
      });
      continue;
    }

    if (mostrarSoloCambiosFamiliares) continue;

    if (campo === 'foto' || valor === null || valor === undefined || valor === '') {
      continue;
    }

    if (campo === 'cud' && typeof valor === 'object' && !Array.isArray(valor)) {
      const detalles = [
        valor.fechaEmision && `Fecha de emisión: ${valor.fechaEmision}`,
        valor.fechaVencimiento && `Fecha de vencimiento: ${valor.fechaVencimiento}`,
        valor.nombreArchivo && `Archivo: ${valor.nombreArchivo}`,
      ].filter(Boolean);

      if (detalles.length > 0) {
        filas.push(['CUD', detalles.join('\n')]);
      }
      continue;
    }

    if (typeof valor === 'object') {
      filas.push([campo.replace(/([A-Z])/g, ' $1').toUpperCase(), JSON.stringify(valor)]);
      continue;
    }

    filas.push([campo.replace(/([A-Z])/g, ' $1').toUpperCase(), String(valor)]);
  }

  return filas;
};

export const SolicitudesUsuario: React.FC = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Solicitud | null>(null);
  const [cargando, setCargando] = useState(true);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const usuNombre = localStorage.getItem('usuNombre') || 'USUARIO';

  useEffect(() => {
    const obtenerSolicitudes = async () => {
      try {
        const res = await api.get('/solicitudes/mis-solicitudes');
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
  }, []);

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

    const tieneFechaRevision = Boolean(solicitudSeleccionada.fechaRevision);
    const altoCabecera = tieneFechaRevision ? 42 : 34;
    const finCabecera = 32 + altoCabecera;

    // Caja de datos cabecera
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 32, 182, altoCabecera, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('N° SOLICITUD:', 18, 40);
    doc.text('FECHA DE SOLICITUD:', 18, 48);
    doc.text('AGENTE / USUARIO:', 18, 56);
    if (tieneFechaRevision) {
      doc.text('FECHA DE REVISIÓN:', 18, 63);
    }

    doc.setFont('helvetica', 'normal');
    doc.text(`#${solicitudSeleccionada.id}`, 52, 40);
    doc.text(formatearFecha(solicitudSeleccionada.fechaCreacion), 58, 48);
    doc.text(usuNombre.toUpperCase(), 58, 56);
    if (tieneFechaRevision) {
      doc.text(formatearFecha(solicitudSeleccionada.fechaRevision), 58, 63);
    }

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

    let startYTable = finCabecera + 8;
    if (solicitudSeleccionada.motivoRechazo) {
      const yEtiquetaMotivo = finCabecera + 7;
      const yTextoMotivo = yEtiquetaMotivo + 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('MOTIVO / OBSERVACIONES:', 14, yEtiquetaMotivo);

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(51, 65, 85);
      const lineasMotivo = doc.splitTextToSize(solicitudSeleccionada.motivoRechazo, 182);
      doc.text(lineasMotivo, 14, yTextoMotivo);
      startYTable = yTextoMotivo + lineasMotivo.length * 4.5 + 5;
    }

    const datosObj = solicitudSeleccionada.datosSolicitados || {};
    const filasTabla = obtenerFilasDatosSolicitud(datosObj);

    autoTable(doc, {
      startY: startYTable,
      head: [['CAMPO / CONCEPTO', 'VALOR SOLICITADO']],
      body: filasTabla.length > 0 ? filasTabla : [['DATOS SOLICITADOS', 'No hay datos para mostrar.']],
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

  const handleCancelarSolicitud = async (sol: Solicitud) => {
    const confirmar = window.confirm(
      `¿Cancelar la solicitud #${sol.id}? Podrás iniciar un nuevo trámite cuando quieras.`,
    );
    if (!confirmar) return;

    try {
      const res = await api.delete(`/solicitudes/${sol.id}/cancelar`);
      if (res.data && res.data.estado === 'CANCELADA') {
        setSolicitudes((prev) =>
          prev.map((s) =>
            s.id === sol.id
              ? { ...s, estado: 'CANCELADA' as Solicitud['estado'], fechaRevision: res.data.fechaRevision }
              : s,
          ),
        );
        setSolicitudSeleccionada(null);
      }
    } catch (err) {
      const mensaje = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(mensaje || 'No se pudo cancelar la solicitud.');
    }
  };

  const getBadgeEstado = (estado: Solicitud['estado']) => {
    switch (estado) {
      case 'PENDIENTE':
        return { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '#ca8a04' };
      case 'APROBADA':
        return { bg: 'rgba(79, 184, 34, 0.15)', color: '#4fb822', border: '#4fb822' };
      case 'RECHAZADA':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '#ef4444' };
      case 'CANCELADA':
        return { bg: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', border: '#6b7280' };
      default:
        return { bg: '#333', color: '#fff', border: '#555' };
    }
  };

  const resumenSolicitudes = [
    { etiqueta: 'Total', cantidad: solicitudes.length, color: '#e5e7eb' },
    { etiqueta: 'Pendientes', cantidad: solicitudes.filter((sol) => sol.estado === 'PENDIENTE').length, color: '#facc15' },
    { etiqueta: 'Aprobadas', cantidad: solicitudes.filter((sol) => sol.estado === 'APROBADA').length, color: '#4fb822' },
    { etiqueta: 'Rechazadas', cantidad: solicitudes.filter((sol) => sol.estado === 'RECHAZADA').length, color: '#f87171' },
    { etiqueta: 'Canceladas', cantidad: solicitudes.filter((sol) => sol.estado === 'CANCELADA').length, color: '#9ca3af' },
  ];

  if (cargando) {
    return (
      <div style={{ backgroundColor: '#121212', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
        RECUPERANDO SOLICITUDES...
      </div>
    );
  }

  return (
    <div className="solicitudes-user-page" style={pageContainerStyle}>
      <EncabezadoInstitucional
        className="institutional-header--spaced"
        acciones={
          <>
            <button
              type="button"
              className="institutional-header-action"
              onClick={() => navigate('/perfil')}
            >
              ← VOLVER AL LEGAJO
            </button>
            <button
              type="button"
              className="institutional-header-action institutional-header-action--logout"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </>
        }
      />

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

        <section
          aria-label="Resumen de solicitudes"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
            gap: '10px',
          }}
        >
          {resumenSolicitudes.map((item) => (
            <div
              key={item.etiqueta}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 16px',
                backgroundColor: '#181818',
                border: '1px solid #282828',
                borderLeft: `3px solid ${item.color}`,
                borderRadius: '7px',
              }}
            >
              <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600 }}>{item.etiqueta}</span>
              <strong style={{ color: item.color, fontSize: '20px', lineHeight: 1 }}>{item.cantidad}</strong>
            </div>
          ))}
        </section>

        {/* LISTADO DE TARJETAS */}
        <div style={listContainerStyle}>
          {solicitudes.length === 0 ? (
            <div
              style={{
                display: 'flex',
                minHeight: '220px',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '28px',
                backgroundColor: '#181818',
                border: '1px solid #282828',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <span style={{ color: '#4fb822', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em' }}>
                HISTORIAL VACÍO
              </span>
              <h3 style={{ margin: 0, color: '#f3f4f6', fontSize: '17px' }}>
                Todavía no tenés solicitudes
              </h3>
              <p style={{ maxWidth: '390px', margin: 0, color: '#9ca3af', fontSize: '13px', lineHeight: 1.5 }}>
                Cuando envíes una solicitud de modificación del legajo, vas a poder consultar acá su estado y resolución.
              </p>
              <button
                type="button"
                onClick={() => navigate('/perfil')}
                style={{ ...btnVerdeStyle, marginTop: '4px' }}
              >
                IR A MI LEGAJO
              </button>
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
                  SOLICITADA EL {formatearFecha(solicitudSeleccionada.fechaCreacion)}
                </div>
                {solicitudSeleccionada.fechaRevision && (
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {solicitudSeleccionada.estado === 'RECHAZADA'
                      ? 'RECHAZADA'
                      : solicitudSeleccionada.estado === 'CANCELADA'
                        ? 'CANCELADA'
                        : 'REVISADA'} EL{' '}
                    {formatearFecha(solicitudSeleccionada.fechaRevision)}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button type="button" onClick={handleVisualizarPDF} style={btnVerdeStyle}>
                  VER REPORTE EN PDF
                </button>
                {solicitudSeleccionada.estado === 'PENDIENTE' && (
                  <button
                    type="button"
                    onClick={() => handleCancelarSolicitud(solicitudSeleccionada)}
                    style={btnCancelarStyle}
                  >
                    CANCELAR SOLICITUD
                  </button>
                )}
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
                    {obtenerFilasDatosSolicitud(solicitudSeleccionada.datosSolicitados || {}).length > 0 ? (
                      obtenerFilasDatosSolicitud(solicitudSeleccionada.datosSolicitados || {}).map(([campo, valor], i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #242424' }}>
                          <td style={{ ...tdStyle, fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {campo}
                          </td>
                          <td style={{ ...tdStyle, color: '#ffffff', fontWeight: 'bold', whiteSpace: 'pre-line' }}>
                            {valor}
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
  return (
    <div
      className="solicitudes-user-card"
      onClick={onSeleccionar}
      style={cardItemStyle}
    >
      <div>
        <strong className="solicitudes-user-card-title">
          SOLICITUD #{sol.id}
        </strong>
        <div className="solicitudes-user-card-dates">
          Solicitud: {formatearFecha(sol.fechaCreacion)}
          {sol.fechaRevision && (
            <div style={{ marginTop: '3px' }}>
              {sol.estado === 'RECHAZADA' ? 'Rechazada' : 'Revisada'}: {formatearFecha(sol.fechaRevision)}
            </div>
          )}
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
        <span className="solicitudes-user-card-link">
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
  padding: '0 0 2rem',
  fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif',
  boxSizing: 'border-box',
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

const btnCancelarStyle: React.CSSProperties = {
  backgroundColor: 'rgba(220, 38, 38, 0.12)',
  color: '#f87171',
  border: '1px solid #dc2626',
  borderRadius: '5px',
  padding: '8px 16px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '0.04em',
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
