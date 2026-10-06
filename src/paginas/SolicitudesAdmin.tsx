import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import { authService } from '../services/auth.service';
import { EncabezadoInstitucional } from '../componentes/EncabezadoInstitucional';
import './SolicitudesAdmin.css';

interface SolicitudAdmin {
  id: number;
  nroSolicitud: string;
  legajo: string;
  agente: string;
  apellidoEmpleado?: string;
  nombresEmpleado?: string;
  campo: string;
  valorAnterior: string;
  valorSolicitado: string;
  fecha: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
  observaciones?: string;
  datosSolicitados: Record<string, any>;
  cambios: { campo: string; anterior: string; solicitado: string }[];
}

const etiquetasCampos: Record<string, string> = {
  calle: 'CALLE',
  callenro: 'NÚMERO',
  barrio: 'BARRIO',
  ciudad: 'CIUDAD',
  provincia: 'PROVINCIA',
  tel1: 'TELÉFONO PRINCIPAL',
  tel2: 'TELÉFONO ALTERNATIVO',
  email: 'EMAIL',
  estadoCivil: 'ESTADO CIVIL',
  reparticion: 'REPARTICIÓN',
  funcion: 'FUNCIÓN',
  certificadoDiscapacidad: 'CERTIFICADO DE DISCAPACIDAD',
  nacionalidad: 'NACIONALIDAD',
  apeNom: 'NOMBRE',
};

const coloresEstado: Record<string, { fondo: string; texto: string }> = {
  PENDIENTE: { fondo: '#78350f', texto: '#fde047' },
  APROBADA: { fondo: '#14532d', texto: '#86efac' },
  RECHAZADA: { fondo: '#7f1d1d', texto: '#fca5a5' },
  CANCELADA: { fondo: '#1f2937', texto: '#9ca3af' },
};

const mostrarValor = (valor: unknown): string => {
  if (valor === null || valor === undefined || valor === '') return 'Sin datos';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (typeof valor === 'string' && valor.startsWith('data:')) return 'Archivo adjunto';
  if (typeof valor === 'object') return JSON.stringify(valor);
  return String(valor);
};

const describirCud = (cud: unknown): string => {
  if (!cud) return 'No posee CUD';
  if (typeof cud !== 'object') return mostrarValor(cud);

  const datos = cud as Record<string, unknown>;
  const detalles = [
    datos.fechaEmision && `Emisión: ${mostrarValor(datos.fechaEmision)}`,
    datos.fechaVencimiento && `Vencimiento: ${mostrarValor(datos.fechaVencimiento)}`,
    datos.nombreArchivo && `Archivo: ${mostrarValor(datos.nombreArchivo)}`,
    datos.archivoPresente && !datos.nombreArchivo && 'Archivo adjunto',
  ].filter(Boolean);
  return detalles.length > 0 ? detalles.join(' · ') : 'CUD declarado sin archivo';
};

const obtenerCambiosSolicitud = (datos: Record<string, any>) => {
  const valoresAnteriores = datos.valoresAnteriores || {};
  const cambios: { campo: string; anterior: string; solicitado: string }[] = [];
  const clavesInternas = new Set(['familiares', 'cud', 'valoresAnteriores', 'foto']);

  for (const [campo, valor] of Object.entries(datos)) {
    if (clavesInternas.has(campo) || valor === null || valor === undefined || valor === '') continue;
    cambios.push({
      campo: etiquetasCampos[campo] || campo.replace(/([A-Z])/g, ' $1').toUpperCase(),
      anterior: Object.prototype.hasOwnProperty.call(valoresAnteriores, campo)
        ? mostrarValor(valoresAnteriores[campo])
        : 'No guardado en esta solicitud',
      solicitado: mostrarValor(valor),
    });
  }

  if (typeof datos.foto === 'string' && datos.foto) {
    cambios.push({
      campo: 'FOTO',
      anterior: valoresAnteriores.foto || 'No guardado en esta solicitud',
      solicitado: datos.nombreArchivoFoto || 'Nueva foto adjunta',
    });
  }

  if (Object.prototype.hasOwnProperty.call(datos, 'cud')) {
    cambios.push({
      campo: 'CERTIFICADO CUD',
      anterior: valoresAnteriores.cud
        ? describirCud(valoresAnteriores.cud)
        : 'No guardado en esta solicitud',
      solicitado: describirCud(datos.cud),
    });
  }

  if (Array.isArray(datos.familiares)) {
    const familiaresAnteriores: Record<string, any>[] = Array.isArray(valoresAnteriores.familiares)
      ? valoresAnteriores.familiares
      : [];
    for (const familiar of datos.familiares) {
      if (!familiar || typeof familiar !== 'object') continue;
      const nombre = [familiar.apellido, familiar.nombres].filter(Boolean).join(' ')
        || familiar.apeNom
        || 'Familiar';
      if (familiar.esNuevo) {
        cambios.push({
          campo: `FAMILIAR AGREGADO · ${nombre}`,
          anterior: 'No existía',
          solicitado: [
            familiar.parentesco && `Vínculo: ${familiar.parentesco}`,
            (familiar.tipoDocumento || familiar.nroDocumento)
              && `Documento: ${[familiar.tipoDocumento, familiar.nroDocumento].filter(Boolean).join(' ')}`,
            familiar.sexo && `Sexo: ${familiar.sexo}`,
            familiar.fechaNacimiento && `Fecha de nacimiento: ${familiar.fechaNacimiento}`,
            familiar.discapacitado !== undefined
              && `CUD: ${familiar.discapacitado ? 'Sí' : 'No'}`,
            familiar.nombreArchivoCud && `Archivo CUD: ${familiar.nombreArchivoCud}`,
          ].filter(Boolean).join(' · ') || 'Alta de familiar',
        });
        continue;
      }

      const anterior = familiaresAnteriores.find(
        (item) => Number(item.idFamiliar) === Number(familiar.idFamiliar),
      );
      if (familiar.eliminado) {
        const datosAnteriores = anterior
          ? [
              anterior.parentesco && `Vínculo: ${anterior.parentesco}`,
              [anterior.apellido, anterior.nombres].filter(Boolean).join(' ') || anterior.apeNom,
              (anterior.tipoDocumento || anterior.nroDocumento)
                && `Documento: ${[anterior.tipoDocumento, anterior.nroDocumento].filter(Boolean).join(' ')}`,
            ].filter(Boolean).join(' · ')
          : 'Datos anteriores no guardados';
        cambios.push({
          campo: `FAMILIAR DADO DE BAJA · ${nombre}`,
          anterior: datosAnteriores,
          solicitado: 'Baja lógica',
        });
        continue;
      }

      for (const [campo, valor] of Object.entries(familiar)) {
        if (['idFamiliar', 'esNuevo', 'eliminado', 'archivoCud', 'nombreArchivoCud'].includes(campo)) continue;
        cambios.push({
          campo: `${etiquetasCampos[campo] || campo.toUpperCase()} · ${nombre}`,
          anterior: anterior && Object.prototype.hasOwnProperty.call(anterior, campo)
            ? mostrarValor(anterior[campo])
            : 'No guardado en esta solicitud',
          solicitado: mostrarValor(valor),
        });
      }
    }
  }

  return cambios;
};

interface ArchivoSolicitud {
  nombre: string;
  url: string;
  tipo: 'imagen' | 'documento';
}

const obtenerArchivoSolicitud = (
  contenido: unknown,
  nombre: unknown,
  tipo: ArchivoSolicitud['tipo'],
): ArchivoSolicitud | null => {
  if (typeof contenido !== 'string' || !contenido.trim()) return null;

  const url = contenido.trim();
  const mimePermitidos = tipo === 'imagen'
    ? /^data:image\/(?:png|jpeg|jpg);base64,/i
    : /^data:(?:application\/pdf|image\/(?:png|jpeg|jpg));base64,/i;
  const esDataUrlPermitida = mimePermitidos.test(url);
  const esUrlWeb = /^https?:\/\//i.test(url);
  const esRutaLocal = /^\/(?!\/)/.test(url);

  if (!esDataUrlPermitida && !esUrlWeb && !esRutaLocal) return null;

  return {
    nombre: typeof nombre === 'string' && nombre.trim()
      ? nombre.trim()
      : tipo === 'imagen' ? 'Foto adjunta' : 'Certificado CUD',
    url,
    tipo,
  };
};

// Chrome bloquea abrir URLs data:... en una pestaña nueva, así que se convierten a blob:
const AdjuntoSolicitud: React.FC<{
  archivo: ArchivoSolicitud;
  etiqueta: string;
  previsualizar?: boolean;
}> = ({ archivo, etiqueta, previsualizar = true }) => {
  const esDataUrl = archivo.url.startsWith('data:');
  const [url, setUrl] = useState<string | null>(esDataUrl ? null : archivo.url);

  useEffect(() => {
    if (!esDataUrl) return;
    let objetoUrl: string | null = null;
    let cancelado = false;

    fetch(archivo.url)
      .then((respuesta) => respuesta.blob())
      .then((blob) => {
        if (cancelado) return;
        objetoUrl = URL.createObjectURL(blob);
        setUrl(objetoUrl);
      })
      .catch(() => undefined);

    return () => {
      cancelado = true;
      if (objetoUrl) URL.revokeObjectURL(objetoUrl);
    };
  }, [archivo.url, esDataUrl]);

  const urlVista = archivo.tipo === 'imagen' && esDataUrl ? archivo.url : url;

  return (
    <div className="solicitudes-admin-adjunto">
      {previsualizar && urlVista && archivo.tipo === 'imagen' && (
        <img className="solicitudes-admin-adjunto-vista" src={urlVista} alt={archivo.nombre} />
      )}
      {previsualizar && url && archivo.tipo === 'documento' && (
        <iframe
          className="solicitudes-admin-adjunto-vista solicitudes-admin-adjunto-pdf"
          src={url}
          title={archivo.nombre}
        />
      )}
      <a href={url ?? archivo.url} target="_blank" rel="noreferrer">
        {etiqueta} · {archivo.nombre}
      </a>
    </div>
  );
};

const formatearFechaSolicitud = (fecha?: string | Date | null) => {
  if (!fecha) return '';

  const fechaTexto = fecha instanceof Date ? fecha.toISOString() : fecha;
  const fechaConZona = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(fechaTexto)
    ? fechaTexto
    : `${fechaTexto.replace(' ', 'T')}Z`;

  return new Date(fechaConZona).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
};

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
  const [filtroEstado, setFiltroEstado] = useState<string>('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudAdmin | null>(null);
  const [motivoResolucion, setMotivoResolucion] = useState('');

  // 2. Traer solicitudes reales y mapear los campos para la vista
  const cargarSolicitudes = async () => {
    try {
      const res = await api.get('/solicitudes');

      const lista = Array.isArray(res.data) ? res.data : [];

      // Mapeamos los datos de PostgreSQL al formato que espera tu JSX
      const adaptadas: SolicitudAdmin[] = lista.map((s: any) => {
        const ds = s.datosSolicitados || {};
        const cambios = obtenerCambiosSolicitud(ds);
        const familiaresNuevos = Array.isArray(ds.familiares)
          ? ds.familiares.filter((familiar: any) => familiar?.esNuevo)
          : [];

        // Detectar qué dato se solicitó actualizar
        let campoDetectado = 'DATOS PERSONALES';
        let valorNuevo = '-';

        if (familiaresNuevos.length > 0) {
          campoDetectado = familiaresNuevos.length === 1 ? 'FAMILIAR NUEVO' : 'FAMILIARES NUEVOS';
          valorNuevo = familiaresNuevos
            .map((familiar: any) => `${familiar.apellido || ''} ${familiar.nombres || ''}`.trim())
            .filter(Boolean)
            .join(', ');
        } else if (ds.email) {
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
          apellidoEmpleado: s.apellidoEmpleado || '',
          nombresEmpleado: s.nombresEmpleado || '',
          campo: cambios.length > 1 ? `${cambios.length} CAMBIOS` : cambios[0]?.campo || campoDetectado,
          valorAnterior: cambios[0]?.anterior || 'No guardado en esta solicitud',
          valorSolicitado: cambios[0]?.solicitado || valorNuevo,
          fecha: formatearFechaSolicitud(s.fechaCreacion),
          estado: s.estado,
          observaciones: s.motivoRechazo || s.observacion || '',
          datosSolicitados: ds,
          cambios,
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
    }
  };
useEffect(() => {
    cargarSolicitudes();
  }, []);

  const handleLogout = () => {
    authService.logout();
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
      const endpoint = nuevoEstado === 'APROBADA'
        ? `/solicitudes/${solicitudSeleccionada.id}/aprobar`
        : `/solicitudes/${solicitudSeleccionada.id}/rechazar`;

      await api.patch(
        endpoint,
        nuevoEstado === 'RECHAZADA' ? { motivoRechazo: motivoResolucion } : {},
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
    const legajo = String(s.legajo || s.datosSolicitados?.legajo || '').toLowerCase();
    const agente = String(s.agente || s.apenom || '').toLowerCase();
    const apellido = String(s.apellidoEmpleado || '').toLowerCase();
    const nombres = String(s.nombresEmpleado || '').toLowerCase();
    const term = busqueda.toLowerCase();

    return matchEstado && (
      nro.includes(term)
      || legajo.includes(term)
      || agente.includes(term)
      || apellido.includes(term)
      || nombres.includes(term)
    );
  });

  const datosSolicitudSeleccionada = solicitudSeleccionada?.datosSolicitados || {};
  const cudSolicitud = datosSolicitudSeleccionada.cud;
  const archivoCud = obtenerArchivoSolicitud(
    typeof cudSolicitud === 'string'
      ? cudSolicitud
      : cudSolicitud?.archivo || cudSolicitud?.archivoCudUrl || datosSolicitudSeleccionada.archivoCudUrl || datosSolicitudSeleccionada.documentoUrl,
    cudSolicitud?.nombreArchivo || cudSolicitud?.nombre || datosSolicitudSeleccionada.nombreArchivoCud,
    'documento',
  );
  const fotoSolicitud = obtenerArchivoSolicitud(
    datosSolicitudSeleccionada.foto,
    datosSolicitudSeleccionada.nombreArchivoFoto,
    'imagen',
  );
  const archivosCudFamiliares = Array.isArray(datosSolicitudSeleccionada.familiares)
    ? datosSolicitudSeleccionada.familiares
      .map((familiar: Record<string, unknown>, indice: number) => ({
        familiar: familiar.apellido || familiar.nombres
          ? [familiar.apellido, familiar.nombres].filter(Boolean).join(' ')
          : `familiar ${indice + 1}`,
        archivo: obtenerArchivoSolicitud(
          familiar.archivoCud,
          familiar.nombreArchivoCud,
          'documento',
        ),
      }))
      .filter((item: { familiar: string; archivo: ArchivoSolicitud | null }) => item.archivo)
    : [];

  return (
    <div className="solicitudes-admin-page">


      <EncabezadoInstitucional
        className="solicitudes-admin-header"
        acciones={
          <>
            <button
              type="button"
              className="institutional-header-action"
              onClick={() => navigate('/perfil')}
            >
              Mis datos / Solicitar cambio
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

      {/* 2. CUERPO PRINCIPAL */}
      <main className="solicitudes-admin-main">
        
        {/* FILTROS Y BÚSQUEDA */}
        <div className="solicitudes-admin-toolbar">
          <input
            className="solicitudes-admin-search"
            type="text"
            placeholder="Buscar por legajo, apellido o N° solicitud..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <div className="solicitudes-admin-filters">
            {['TODAS', 'PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA'].map((estado) => (
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
        <div className="solicitudes-admin-workspace">
          
          {/* BANDEJA IZQUIERDA */}
          <aside className="solicitudes-admin-inbox">
            <div className="solicitudes-admin-section-heading">
              <div>
                <h2>Solicitudes</h2>
                <span>Revisá los cambios antes de resolverlos</span>
              </div>
              <span className="solicitudes-admin-count">{solicitudesFiltradas.length}</span>
            </div>
            <div className="solicitudes-admin-list">
            {solicitudesFiltradas.length === 0 ? (
              <div className="solicitudes-admin-empty">
                No hay solicitudes que coincidan con estos filtros.
              </div>
            ) : solicitudesFiltradas.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setSolicitudSeleccionada(s)}
                className={`solicitudes-admin-card${solicitudSeleccionada?.id === s.id ? ' is-selected' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '13px', color: '#f3f4f6' }}>{s.nroSolicitud}</strong>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: coloresEstado[s.estado]?.fondo ?? '#1f2937',
                    color: coloresEstado[s.estado]?.texto ?? '#9ca3af',
                  }}>
                    {s.estado}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{s.agente}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Legajo: {s.legajo} | {s.campo}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>{s.fecha}</div>
              </button>
            ))}
            </div>
          </aside>

          {/* AUDITORÍA Y RESOLUCIÓN DERECHA */}
          {solicitudSeleccionada ? (
            <section className="solicitudes-admin-detail">
              <div className="solicitudes-admin-detail-header">
                <div>
                  <span className="solicitudes-admin-eyebrow">EXPEDIENTE DIGITAL</span>
                  <h2>{solicitudSeleccionada.nroSolicitud}</h2>
                  <p>
                  Agente: <strong style={{ color: '#fff' }}>{solicitudSeleccionada.agente}</strong> (Legajo: {solicitudSeleccionada.legajo})
                  </p>
                </div>
                <span className={`solicitudes-admin-status status-${solicitudSeleccionada.estado.toLowerCase()}`}>
                  {solicitudSeleccionada.estado}
                </span>
              </div>

              {/* TABLA COMPARATIVA */}
              <div className="solicitudes-admin-change">
                <div className="solicitudes-admin-changes-table-wrap">
                  <table className="solicitudes-admin-changes-table">
                    <thead>
                      <tr>
                        <th>CAMPO</th>
                        <th>VALOR ANTERIOR</th>
                        <th>VALOR MODIFICADO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solicitudSeleccionada.cambios.length > 0
                        ? solicitudSeleccionada.cambios.map((cambio, indice) => (
                          <tr key={`${cambio.campo}-${indice}`}>
                            <th scope="row">{cambio.campo}</th>
                            <td>{cambio.anterior}</td>
                            <td className="is-requested">{cambio.solicitado}</td>
                          </tr>
                        ))
                        : (
                          <tr>
                            <th scope="row">{solicitudSeleccionada.campo}</th>
                            <td>No guardado en esta solicitud</td>
                            <td className="is-requested">{solicitudSeleccionada.valorSolicitado}</td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DOCUMENTO ADJUNTO */}
              <div className="solicitudes-admin-documents">
                <div>
                  <span className="solicitudes-admin-block-title">ARCHIVOS DE LA SOLICITUD</span>
                  {archivoCud || fotoSolicitud || archivosCudFamiliares.length > 0 ? (
                    <div className="solicitudes-admin-adjuntos">
                      {archivoCud && (
                        <AdjuntoSolicitud archivo={archivoCud} etiqueta="Ver certificado CUD" />
                      )}
                      {fotoSolicitud && (
                        <AdjuntoSolicitud archivo={fotoSolicitud} etiqueta="Ver foto adjunta" />
                      )}
                      {archivosCudFamiliares.map((item: { familiar: string; archivo: ArchivoSolicitud | null }, indice: number) => item.archivo && (
                        <AdjuntoSolicitud
                          key={`${item.familiar}-${indice}`}
                          archivo={item.archivo}
                          etiqueta={`Ver CUD de ${item.familiar}`}
                          previsualizar={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="solicitudes-admin-no-files">Esta solicitud no posee archivos adjuntos.</p>
                  )}
                </div>
              </div>

              {/* CAMPO DE DICTAMEN / MOTIVO */}
              {solicitudSeleccionada.estado === 'PENDIENTE' ? (
                <div className="solicitudes-admin-resolution">
                  <label className="solicitudes-admin-block-title">OBSERVACIONES DE RRHH</label>
                  <textarea
                    className="solicitudes-admin-textarea"
                    rows={3}
                    placeholder="Escriba aquí los fundamentos (obligatorio en caso de rechazo)..."
                    value={motivoResolucion}
                    onChange={(e) => setMotivoResolucion(e.target.value)}
                  />
                  <div className="solicitudes-admin-actions">
                    <button
                      className="solicitudes-admin-reject"
                      onClick={() => handleResolver('RECHAZADA')}
                    >
                      Rechazar Solicitud
                    </button>
                    <button
                      className="solicitudes-admin-approve"
                      onClick={() => handleResolver('APROBADA')}
                    >
                      Aprobar y Actualizar Legajo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="solicitudes-admin-final-resolution">
                  <span className="solicitudes-admin-block-title">RESOLUCIÓN FINAL</span>
                  <div>
                    {solicitudSeleccionada.observaciones || 'Trámite procesado sin observaciones asentadas.'}
                  </div>
                </div>
              )}
            </section>
          ) : (
            <div className="solicitudes-admin-no-selection">
              <span className="solicitudes-admin-eyebrow">BANDEJA DE REVISIÓN</span>
              <h2>Seleccioná una solicitud</h2>
              <p>Los datos del trámite y las acciones disponibles aparecerán acá.</p>
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