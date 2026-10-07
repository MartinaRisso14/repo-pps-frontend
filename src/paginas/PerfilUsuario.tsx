import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import { authService } from '../services/auth.service';
import { EncabezadoInstitucional } from '../componentes/EncabezadoInstitucional';

interface Familiar {
  idFamiliar?: number;
  numFamiliar?: number;
  apellido: string;
  nombres: string;
  tipoDocumento?: string;
  nroDocumento?: string;
  sexo?: string;
  fechaNacimiento?: string;
  parentesco: string;
  discapacitado: boolean;
  archivoCud?: File | null;
  nombreArchivoCud?: string;
}

interface FuncionDisponible {
  idfuncion: number;
  funcion: string;
}

export const PerfilUsuario: React.FC = () => {
  const navigate = useNavigate();
  const esAdmin = Number(localStorage.getItem('idRol')) === 1;  const [cargando, setCargando] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [funcionesDisponibles, setFuncionesDisponibles] = useState<FuncionDisponible[]>([]);
  

  
  const handleLogout = () => {
  authService.logout();
  navigate('/login');
  };

  // Datos del empleado 
// 1. Datos fijos del empleado
const [empleadoFijo, setEmpleadoFijo] = useState({
  legajo: '',
  apellido: '',
  nombres: '',
  tipoDocumento: 'DNI',
  nrodocumento: '',
  cuil: '',
  fechaNacimiento: '',
  nacionalidad: '',
  situacionRevista: '',
});

// 2. Estado del formulario (lo que el usuario edita)
const [datosForm, setDatosForm] = useState({
  calle: '',
  callenro: '',
  barrio: '',
  ciudad: '',
  provincia: '',
  tel1: '',
  tel2: '',
  email: '',
  estadoCivil: '',
  reparticion: '',
  funcion: '',
  foto: '',
  tieneCud: false,
  cudFechaEmision: '',
  cudFechaVencimiento: '',
  cudArchivo: '',
  cudNombreArchivo: '',
});

// 3. Copia de respaldo para el botón "Cancelar"
const [datosOriginales, setDatosOriginales] = useState({
  calle: '',
  callenro: '',
  barrio: '',
  ciudad: '',
  provincia: '',
  tel1: '',
  tel2: '',
  email: '',
  estadoCivil: '',
  reparticion: '',
  funcion: '',
  foto: '',
  tieneCud: false,
  cudFechaEmision: '',
  cudFechaVencimiento: '',
  cudArchivo: '',
  cudNombreArchivo: '',
});

  const [familiaresOriginales, setFamiliaresOriginales] = useState<Familiar[]>([]);

  const [familiares, setFamiliares] = useState<Familiar[]>(familiaresOriginales);

  const camposFamiliaresComparables: (keyof Familiar)[] = [
    'apellido',
    'nombres',
    'tipoDocumento',
    'nroDocumento',
    'sexo',
    'fechaNacimiento',
    'parentesco',
    'discapacitado',
    'archivoCud',
  ];

   const [nuevoFamiliar, setNuevoFamiliar] = useState<Familiar>({
  apellido: '',
  nombres: '',
  tipoDocumento: 'DNI',
  nroDocumento: '',
  sexo: 'MASCULINO',
  fechaNacimiento: '',
  parentesco: 'HIJO/A',
  discapacitado: false,
  archivoCud: null,
  nombreArchivoCud: '',
});

  const [mostrarModalFamiliar, setMostrarModalFamiliar] = useState(false);
  const usuNombre = localStorage.getItem('usuNombre') || '';
  const [indiceEditandoFamiliar, setIndiceEditandoFamiliar] = useState<number | null>(null);

  

  // Al hacer clic en "EDITAR" en la tabla
const handleEditarFamiliar = (idx: number) => {
  const fam = familiares[idx];
  setIndiceEditandoFamiliar(idx);

  const rawFecha = fam.fechaNacimiento;
  const fechaFormateada = rawFecha
    ? (typeof rawFecha === 'string' ? rawFecha : new Date(rawFecha).toISOString()).substring(0, 10)
    : '';

 // Cargamos en nuevoFamiliar para que el modal lo lea
  setNuevoFamiliar({
    parentesco: fam.parentesco || 'HIJO/A',
    apellido: fam.apellido || '',
    nombres: fam.nombres || '',
    tipoDocumento: fam.tipoDocumento || 'DNI',
    nroDocumento: fam.nroDocumento || '',
    sexo: fam.sexo || 'MASCULINO',
    fechaNacimiento: fechaFormateada,
    discapacitado: Boolean(fam.discapacitado),
    archivoCud: fam.archivoCud || null,
    nombreArchivoCud: fam.nombreArchivoCud || '',
  });

  setMostrarModalFamiliar(true);
};

const handleNuevoFamiliar = () => {
  setIndiceEditandoFamiliar(null);
  setNuevoFamiliar({
    parentesco: 'HIJO/A',
    apellido: '',
    nombres: '',
discapacitado: false,  });
  setMostrarModalFamiliar(true);
};

const handleGuardarFamiliar = () => {
  // 1. Validar que no se guarden campos vacíos
  if (!nuevoFamiliar.apellido?.trim() || !nuevoFamiliar.nombres?.trim()) {
    alert('Por favor complete Apellido y Nombres');
    return;
  }

  const familiarAGuardar = {
    ...nuevoFamiliar,
    apellido: nuevoFamiliar.apellido.trim().toUpperCase(),
    nombres: nuevoFamiliar.nombres.trim().toUpperCase(),
    discapacitado: Boolean(nuevoFamiliar.discapacitado),
  };

  if (indiceEditandoFamiliar !== null) {
    setFamiliares((prev) => {
      const actualizados = [...prev];
      actualizados[indiceEditandoFamiliar] = {
        ...prev[indiceEditandoFamiliar],
        ...familiarAGuardar,
        idFamiliar: prev[indiceEditandoFamiliar].idFamiliar,
        numFamiliar: prev[indiceEditandoFamiliar].numFamiliar,
      };
      return actualizados;
    });
  } else {
    // Modo nuevo: inserta al final de la lista
    setFamiliares((prev) => [...prev, familiarAGuardar]);
  }

  setMostrarModalFamiliar(false);
  setIndiceEditandoFamiliar(null);

  setNuevoFamiliar({
    parentesco: 'HIJO/A',
    apellido: '',
    nombres: '',
    tipoDocumento: 'DNI',
    nroDocumento: '',
    sexo: 'MASCULINO',
    fechaNacimiento: '',
    discapacitado: false,
    archivoCud: null,
    nombreArchivoCud: '',
  });
};
  useEffect(() => {
    let activo = true;
    const urlsTemporales: string[] = [];

    const cargarArchivo = async (idArchivo?: number | string) => {
      if (!idArchivo) return '';
      try {
        const response = await api.get(`/archivos/${idArchivo}`, { responseType: 'blob' });
        const url = URL.createObjectURL(response.data);
        urlsTemporales.push(url);
        return url;
      } catch (error) {
        console.error(`No se pudo recuperar el archivo ${idArchivo}:`, error);
        if (activo) {
          setMensaje({
            tipo: 'error',
            texto: 'NO SE PUDO RECUPERAR UNO DE LOS ARCHIVOS DEL LEGAJO. LOS DEMÁS DATOS SIGUEN DISPONIBLES.',
          });
        }
        return '';
      }
    };

    const cargarLegajo = async () => {
      try {
        if (usuNombre) {
        const [res, funcionesRes] = await Promise.all([
          api.get(`/usuarios/${usuNombre}`),
          api.get('/usuarios/catalogos/funciones'),
        ]);
        if (!activo) return;
        setFuncionesDisponibles(funcionesRes.data);

        if (res.data?.empleado) {
          const emp = res.data.empleado;
          const [foto, cudArchivo] = await Promise.all([
            cargarArchivo(emp.idArchivoFoto),
            cargarArchivo(emp.cud?.idArchivoCud),
          ]);
          if (!activo) return;
          const rawFecha = emp.fechaNacimiento || emp.f_nacimiento;
          const fechaFormateada = rawFecha
            ? (typeof rawFecha === 'string' ? rawFecha : new Date(rawFecha).toISOString()).substring(0, 10)
            : '';

          console.log('EMPLEADO REAL BD:', JSON.stringify(res.data.empleado, null, 2));
          

          // 1. Datos inmutables / fijos
          setEmpleadoFijo({
            legajo: emp.legajo || '',
            apellido: (emp.apellido || '').toUpperCase(),
            nombres: (emp.nombres || '').toUpperCase(),
            tipoDocumento: emp.tipoDocumento || 'DNI',
            nrodocumento: emp.nroDocumento || emp.nrodocumento || '',
            cuil: emp.cuil || '',
            fechaNacimiento: fechaFormateada,
            nacionalidad: (emp.nacionalidad || 'ARGENTINA').toUpperCase(),
            situacionRevista: (emp.estado || 'ACTIVO').toUpperCase(),
          });

          // 2. Datos editables de Dirección, Contacto, CUD, etc.
          const datosCargados = {
            calle: emp.calle || emp.direccion?.calle || '',
            callenro: emp.callenro || emp.calleNro || emp.direccion?.callenro || '',
            barrio: emp.barrio || emp.direccion?.barrio || '',
            ciudad: emp.ciudad || emp.direccion?.ciudad || '',
            provincia: emp.provincia || emp.direccion?.provincia || '',
            tel1: emp.tel1 || emp.direccion?.tel1 || '',
            tel2: emp.tel2 || emp.direccion?.tel2 || '',
            email: emp.emailContacto || emp.direccion?.email || '',
            estadoCivil: emp.estadoCivil || emp.estadocivil || '',
            reparticion: emp.reparticion || '',
            funcion: emp.funcion || '',
            foto,
            tieneCud: Boolean(emp.cud || emp.idCud),
            cudFechaEmision: emp.cud?.fechaEmision || emp.fechaEmisionCud || '',
            cudFechaVencimiento: emp.cud?.fechaVencimiento || emp.fechaVencimientoCud || '',
            cudArchivo,
            cudNombreArchivo: emp.cud?.nombreArchivoCud || '',
          };

          if (Array.isArray(emp.familiares)) {
             const familiaresMapeados = emp.familiares.map((fam: any) => ({
             idFamiliar: fam.idFamiliar || fam.id_familiar,
             numFamiliar: fam.numFamiliar || fam.numfamiliar,
             apellido: (fam.apellido || '').toUpperCase(),
             nombres: (fam.nombres || '').toUpperCase(),
             tipoDocumento: fam.tipoDocumento || 'DNI',
             nroDocumento: fam.nroDocumento || '',
             sexo: fam.sexo || 'MASCULINO',
             fechaNacimiento: fam.fechaNacimiento
               ? String(fam.fechaNacimiento).substring(0, 10)
               : '',
             parentesco: fam.parentesco || 'HIJO/A',
             discapacitado: Boolean(fam.discapacitado),
           }));
             setFamiliares(familiaresMapeados);
             setFamiliaresOriginales(familiaresMapeados);

       }

          setDatosForm(datosCargados);
          setDatosOriginales(datosCargados);

        }
      }
    } catch (err) {
      console.warn('Cargando datos de referencia.', err);
      if (activo) {
        setMensaje({
          tipo: 'error',
          texto: 'NO SE PUDIERON RECUPERAR LOS DATOS DEL LEGAJO. VUELVA A INICIAR SESIÓN O INTENTE MÁS TARDE.',
        });
      }
    } finally {
      if (activo) setCargando(false);
    }
  };

  cargarLegajo();
  return () => {
    activo = false;
    urlsTemporales.forEach((url) => URL.revokeObjectURL(url));
  };
}, [usuNombre]);

  const handleCancelar = () => {
    setDatosForm(datosOriginales);
    setFamiliares(familiaresOriginales);
    setNuevoFamiliar({ apellido: '', nombres: '', parentesco: 'HIJO/A', discapacitado: false });
    setModoEdicion(false);
    setMensaje(null);
  };

  

  const handleEliminarFamiliar = (index: number) => {
    setFamiliares(familiares.filter((_, i) => i !== index));
  };

  // 1. Convierte el archivo a Base64
  const convertirArchivoABase64 = (archivo: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(archivo);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubirCUD = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const extension = archivo.name.split('.').pop()?.toLowerCase();
    const extensionesValidas = ['pdf', 'jpg', 'jpeg', 'png'];

    if (!extension || !extensionesValidas.includes(extension)) {
      alert('El CUD debe ser un archivo PDF o imagen (JPG, PNG).');
      e.target.value = '';
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      alert('El archivo no debe superar los 5 MB.');
      e.target.value = '';
      return;
    }

    try {
      const base64 = await convertirArchivoABase64(archivo);
      setDatosForm((prev) => ({
        ...prev,
        cudArchivo: base64,
        cudNombreArchivo: archivo.name,
      }));
    } catch (err) {
      console.error('Error al leer el archivo del CUD:', err);
      alert('Ocurrió un error al procesar el archivo.');
    }
  };
  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;


    const extension = archivo.name.split('.').pop()?.toLowerCase();
    const extensionesValidas = ['jpg', 'jpeg', 'png'];

    if (!extension || !extensionesValidas.includes(extension)) {
      alert('La foto debe estar en formato JPG, JPEG o PNG.');
      e.target.value = '';
      return;
    }

    if (archivo.size > 3 * 1024 * 1024) {
      alert('La foto no debe superar los 3 MB.');
      e.target.value = '';
      return;
    }

    try {
      const base64 = await convertirArchivoABase64(archivo);
      setDatosForm((prev) => ({
        ...prev,
        foto: base64,
      }));
    } catch (err) {
      console.error('Error al procesar la foto:', err);
      alert('Ocurrió un error al cargar la imagen.');
    }
  };

 const handleEnviarSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    const camposSolicitud: (keyof typeof datosForm)[] = [
      'calle',
      'callenro',
      'barrio',
      'ciudad',
      'provincia',
      'tel1',
      'tel2',
      'email',
      'estadoCivil',
      'reparticion',
      'funcion',
      'foto',
    ];
    const datosModificados: Record<string, unknown> = {};

    for (const campo of camposSolicitud) {
      if (datosForm[campo] !== datosOriginales[campo]) {
        datosModificados[campo] = datosForm[campo];
      }
    }

    const camposCud: (keyof typeof datosForm)[] = [
      'tieneCud',
      'cudFechaEmision',
      'cudFechaVencimiento',
      'cudArchivo',
      'cudNombreArchivo',
    ];
    const cambioCud = camposCud.some((campo) => datosForm[campo] !== datosOriginales[campo]);

    const familiaresModificados: Record<string, unknown>[] = [];
    const familiaresAnteriores: Record<string, unknown>[] = [];
    for (const familiar of familiares) {
      if (!familiar.idFamiliar) {
        familiaresModificados.push({
          parentesco: familiar.parentesco,
          apeNom: `${familiar.apellido} ${familiar.nombres}`.trim(),
          apellido: familiar.apellido,
          nombres: familiar.nombres,
          tipoDocumento: familiar.tipoDocumento || 'DNI',
          nroDocumento: familiar.nroDocumento || '',
          sexo: familiar.sexo || 'MASCULINO',
          fechaNacimiento: familiar.fechaNacimiento || '',
          discapacitado: Boolean(familiar.discapacitado),
          ...(familiar.archivoCud && {
            archivoCud: familiar.archivoCud,
            nombreArchivoCud: familiar.nombreArchivoCud || familiar.archivoCud.name,
          }),
          esNuevo: true,
        });
        continue;
      }

      const original = familiaresOriginales.find(
        (familiarOriginal) => familiarOriginal.idFamiliar === familiar.idFamiliar,
      );
      if (!original) continue;

      const cambios = Object.fromEntries(
        camposFamiliaresComparables
          .filter((campo) => familiar[campo] !== original[campo])
          .map((campo) => [campo, familiar[campo]]),
      );

      if (Object.keys(cambios).length > 0) {
        familiaresModificados.push({ idFamiliar: familiar.idFamiliar, ...cambios });
        familiaresAnteriores.push({
          idFamiliar: familiar.idFamiliar,
          ...Object.fromEntries(
            Object.keys(cambios).map((campo) => [campo, original[campo as keyof Familiar]]),
          ),
        });
      }
    }

    const familiaresPresentes = new Set(
      familiares.map((familiar) => familiar.idFamiliar).filter((id): id is number => Boolean(id)),
    );
    for (const familiar of familiaresOriginales) {
      if (!familiar.idFamiliar || familiaresPresentes.has(familiar.idFamiliar)) continue;
      familiaresModificados.push({ idFamiliar: familiar.idFamiliar, eliminado: true });
      familiaresAnteriores.push({
        idFamiliar: familiar.idFamiliar,
        ...Object.fromEntries(
          camposFamiliaresComparables.map((campo) => [campo, familiar[campo]]),
        ),
      });
    }

    if (Object.keys(datosModificados).length === 0 && !cambioCud && familiaresModificados.length === 0) {
      setMensaje({ tipo: 'error', texto: 'NO HAY CAMBIOS PARA ENVIAR.' });
      setGuardando(false);
      return;
    }

    const payload = {
      ...datosModificados,
      valoresAnteriores: {
        ...Object.fromEntries(
          Object.keys(datosModificados).map((campo) => [
            campo,
            campo === 'foto'
              ? (datosOriginales.foto ? 'Foto registrada' : 'Sin foto')
              : datosOriginales[campo as keyof typeof datosOriginales],
          ]),
        ),
        ...(cambioCud && {
          cud: {
            tieneCud: datosOriginales.tieneCud,
            fechaEmision: datosOriginales.cudFechaEmision,
            fechaVencimiento: datosOriginales.cudFechaVencimiento,
            nombreArchivo: datosOriginales.cudNombreArchivo,
            archivoPresente: Boolean(datosOriginales.cudArchivo),
          },
        }),
        ...(familiaresAnteriores.length > 0 && {
          familiares: familiaresAnteriores,
        }),
      },
      ...(cambioCud && {
        cud: datosForm.tieneCud
          ? {
              fechaEmision: datosForm.cudFechaEmision,
              fechaVencimiento: datosForm.cudFechaVencimiento,
              ...(datosForm.cudArchivo.startsWith('data:') && {
                archivo: datosForm.cudArchivo,
              }),
              nombreArchivo: datosForm.cudNombreArchivo,
            }
          : null,
      }),
      ...(familiaresModificados.length > 0 && {
        familiares: await Promise.all(familiaresModificados.map(async (familiar) => {
          if (!(familiar.archivoCud instanceof File)) return familiar;

          return {
            ...familiar,
            archivoCud: await convertirArchivoABase64(familiar.archivoCud),
            nombreArchivoCud: familiar.nombreArchivoCud || familiar.archivoCud.name,
          };
        })),
      }),
    };

    try {
      await api.post('/solicitudes', payload);
      setMensaje({ tipo: 'exito', texto: 'SOLICITUD ENVIADA CORRECTAMENTE. EN ESTADO PENDIENTE DE REVISION.' });
      setDatosOriginales(datosForm);
      setFamiliaresOriginales(familiares);
      setModoEdicion(false);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'ERROR AL ENVIAR LA SOLICITUD' });
    } finally {
      setGuardando(false);
    }
    
  };

  if (cargando) {
    return (
      <div style={{ backgroundColor: '#121212', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontFamily: 'Segoe UI, sans-serif' }}>
        RECUPERANDO LEGAJO...
      </div>
    );
  }

  return (
    <div className="perfil-usuario-page" style={pageContainerStyle}>
      <div className="perfil-usuario-card" style={cardStyle}>
        <EncabezadoInstitucional
          className="institutional-header--spaced"
          acciones={
            <>
              {esAdmin && (
                <button
                  type="button"
                  className="institutional-header-action"
                  onClick={() => navigate('/admin/solicitudes')}
                >
                  ← Solicitudes
                </button>
              )}
              <button
                type="button"
                className="institutional-header-action"
                onClick={() => navigate('/solicitudes')}
              >
                Mis Solicitudes
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


        {/* ENCABEZADO INSTITUCIONAL */}
        <div style={headerStyle}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            </div>
            <h1 style={{ margin: '8px 0 2px 0', fontSize: '1.25rem', color: '#ffffff', letterSpacing: '0.04em' }}>
              FICHA  DEL  EMPLEADO
            </h1>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              LEGAJO: <strong style={{ color: '#ffffff' }}>{empleadoFijo.legajo}</strong> | USUARIO: <strong style={{ color: '#ffffff' }}>{usuNombre.toUpperCase()}</strong>
            </div>
          </div>

        {/* BOTONERA CABECERA */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
           

            {!modoEdicion ? (
              <button
                type="button"
                onClick={() => setModoEdicion(true)}
                style={btnVerdeStyle}
              >
                MODIFICAR DATOS
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelar}
                style={btnGrisStyle}
              >
                CANCELAR EDICION
              </button>
            )}
          </div>
        </div>

        {mensaje && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: mensaje.tipo === 'exito' ? 'rgba(79, 184, 34, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            borderLeft: `4px solid ${mensaje.tipo === 'exito' ? '#4fb822' : '#ef4444'}`,
            color: mensaje.tipo === 'exito' ? '#86efac' : '#fca5a5',
            fontSize: '12px',
            fontWeight: 'bold',
            letterSpacing: '0.04em'
          }}>
            {mensaje.texto}
          </div>
        )}

        {/* SECCIÓN 1: DATOS FIJOS */}
          <div style={{ marginBottom: '32px' }}>
            <div style={sectionDividerStyle}>
              <span style={sectionTitleStyle}>1. DATOS FILIATORIOS Y DE IDENTIFICACION</span>
              <span style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.05em' }}>REGISTRO INMUTABLE</span>
            </div>

            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>N° DE LEGAJO</label>
                <input
                  type="text"
                  value={empleadoFijo.legajo}
                  disabled
                  style={inputDisabledStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>APELLIDO</label>
                <input
                  type="text"
                  value={empleadoFijo.apellido}
                  disabled
                  style={inputDisabledStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>NOMBRES</label>
                <input
                  type="text"
                  value={empleadoFijo.nombres}
                  disabled
                  style={inputDisabledStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>DOCUMENTO DE IDENTIDAD</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={empleadoFijo.tipoDocumento || 'DNI'}
                    disabled
                    style={{ ...inputDisabledStyle, width: '70px', textAlign: 'center' }}
                  />
                  <input
                    type="text"
                    value={empleadoFijo.nrodocumento}
                    disabled
                    style={{ ...inputDisabledStyle, flex: 1 }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>NUMERO DE C.U.I.L.</label>
                <input
                  type="text"
                  value={empleadoFijo.cuil}
                  disabled
                  style={inputDisabledStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>FECHA DE NACIMIENTO</label>
                <input
                  type="text"
                  value={empleadoFijo.fechaNacimiento}
                  disabled
                  style={inputDisabledStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>NACIONALIDAD</label>
                <input
                  type="text"
                  value={empleadoFijo.nacionalidad}
                  disabled
                  style={inputDisabledStyle}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DATOS SUJETOS A SOLICITUD DE CAMBIO */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ ...sectionDividerStyle, borderBottomColor: '#4fb822' }}>
              <span style={{ ...sectionTitleStyle, color: '#4fb822' }}>2. DATOS PERSONALES Y LABORALES</span>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{modoEdicion ? 'EDICION HABILITADA' : 'MODO CONSULTA'}</span>
            </div>
<div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '24px',
  marginBottom: '24px',
  padding: '16px 20px',
  backgroundColor: '#161616',
  border: '1px solid #27272a',
  borderRadius: '8px'
}}>
  {/* Previsualizador circular */}
  <div style={{
    width: '84px',
    height: '84px',
    borderRadius: '50%',
    backgroundColor: '#1f1f23',
    border: '2px solid #2e5a1c',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  }}>
    {datosForm.foto ? (
      <img
        src={datosForm.foto}
        alt="Foto del Empleado"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ) : (
      <span style={{ fontSize: '11px', color: '#71717a', textAlign: 'center', padding: '4px' }}>
        SIN FOTO
      </span>
    )}
  </div>

  <div style={{ flex: 1 }}>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#e4e4e7', marginBottom: '4px' }}>
      FOTO DEL EMPLEADO (ROSTRO)
    </label>
    <p style={{ fontSize: '11px', color: '#71717a', margin: '0 0 10px 0' }}>
      Foto frontal, tipo carnet con fondo claro (JPG o PNG, máx 3 MB).
    </p>

    {modoEdicion ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="file"
          accept="image/png, image/jpeg, image/jpg"
          onChange={handleSubirFoto}
          style={{ fontSize: '12px', color: '#a1a1aa' }}
        />
        {datosForm.foto && (
          <button
            type="button"
            onClick={() => setDatosForm((prev) => ({ ...prev, foto: '' }))}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              fontSize: '11px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Quitar foto
          </button>
        )}
      </div>
    ) : (
      <span style={{ fontSize: '12px', color: datosForm.foto ? '#52b72a' : '#71717a' }}>
        {datosForm.foto ? '✓ Foto cargada' : 'No se registró foto de perfil.'}
      </span>
    )}
  </div>
</div>
            {/* CAJA SUBSECCIÓN: DOMICILIO */}
            <div style={{
              marginTop: '16px',
              marginBottom: '24px',
              padding: '16px',
              border: '1px solid #27272a',
              borderRadius: '8px',
              position: 'relative',
              background: '#121212'
            }}>
              <span style={{
                position: 'absolute',
                top: '-10px',
                left: '12px',
                background: '#18181b',
                padding: '0 8px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#4fb822',
                letterSpacing: '0.05em'
              }}>
                DOMICILIO
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: '14px', marginTop: '4px' }}>
                <div>
                  <label style={labelStyle}>CALLE</label>
                  <input
                    type="text"
                    value={datosForm.calle}
                    disabled={!modoEdicion}
                    onChange={(e) => setDatosForm({ ...datosForm, calle: e.target.value.toUpperCase() })}
                    style={modoEdicion ? inputEditableStyle : inputReadOnlyStyle}
                    placeholder="URQUIZA"
                  />
                </div>

                <div>
                  <label style={labelStyle}>NÚMERO</label>
                  <input
                    type="text"
                    value={datosForm.callenro}
                    disabled={!modoEdicion}
                    onChange={(e) => setDatosForm({ ...datosForm, callenro: e.target.value })}
                    style={modoEdicion ? inputEditableStyle : inputReadOnlyStyle}
                    placeholder="450"
                  />
                </div>

                <div>
                  <label style={labelStyle}>BARRIO</label>
                  <input
                    type="text"
                    value={datosForm.barrio}
                    disabled={!modoEdicion}
                    onChange={(e) => setDatosForm({ ...datosForm, barrio: e.target.value.toUpperCase() })}
                    style={modoEdicion ? inputEditableStyle : inputReadOnlyStyle}
                    placeholder="CENTRO"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
                <div>
                  <label style={labelStyle}>CIUDAD / LOCALIDAD</label>
                  <input
                    type="text"
                    value={datosForm.ciudad}
                    disabled={!modoEdicion}
                    onChange={(e) => setDatosForm({ ...datosForm, ciudad: e.target.value.toUpperCase() })}
                    style={modoEdicion ? inputEditableStyle : inputReadOnlyStyle}
                    placeholder="CONCORDIA"
                  />
                </div>

                <div>
                  <label style={labelStyle}>PROVINCIA</label>
                  <input
                    type="text"
                    value={datosForm.provincia}
                    disabled={!modoEdicion}
                    onChange={(e) => setDatosForm({ ...datosForm, provincia: e.target.value.toUpperCase() })}
                    style={modoEdicion ? inputEditableStyle : inputReadOnlyStyle}
                    placeholder=" ENTRE RÍOS"
                  />
                </div>
              </div>
            </div>

        

              {/* SUBSECCIÓN: CERTIFICADO ÚNICO DE DISCAPACIDAD (CUD) */}
            <div style={{
              marginTop: '28px',              
              marginBottom: '28px',             
              padding: '16px',
              border: '1px solid #27272a',
              borderRadius: '8px',
              position: 'relative',
              background: '#121212'
            }}>
              <span style={{
                position: 'absolute',
                top: '-10px',
                left: '12px',
                background: '#18181b',
                padding: '0 8px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#4fb822',
                letterSpacing: '0.05em'
              }}>
                CERTIFICADO ÚNICO DE DISCAPACIDAD
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '16px', alignItems: 'center' }}>
                <div>
                  <label style={labelStyle}>¿POSEE CERTIFICADO ÚNICO DE DISCAPACIDAD?</label>
                  {modoEdicion ? (
                    <select
                      value={datosForm.tieneCud ? 'SI' : 'NO'}
                      onChange={(e) => {
                        const posee = e.target.value === 'SI';
                        setDatosForm({
                          ...datosForm,
                          tieneCud: posee,
                          cudFechaEmision: posee ? datosForm.cudFechaEmision : '',
                          cudFechaVencimiento: posee ? datosForm.cudFechaVencimiento : '',
                          cudArchivo: posee ? datosForm.cudArchivo : '',
                          cudNombreArchivo: posee ? datosForm.cudNombreArchivo : '',
                        });
                      }}
                      style={{
                        ...inputEditableStyle,
                        cursor: 'pointer',
                        backgroundColor: '#18181b',
                        color: '#ffffff',
                      }}
                    >
                      <option value="NO">NO</option>
                      <option value="SI">SI</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={datosForm.tieneCud ? 'SI' : 'NO'}
                      disabled
                      style={inputReadOnlyStyle}
                    />
                  )}
                </div>

                {!datosForm.tieneCud && (
                  <p style={{ fontSize: '12px', color: '#71717a', margin: 0, paddingTop: '16px' }}>
                    No posee registro de CUD declarado actualmente.
                  </p>
                )}
              </div>

              {datosForm.tieneCud && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1.5fr',
                  gap: '14px',
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: '1px dashed #27272a'
                }}>
                  <div>
                    <label style={labelStyle}>FECHA DE EMISIÓN</label>
                    <input
                      type="date"
                      value={datosForm.cudFechaEmision}
                      disabled={!modoEdicion}
                      onChange={(e) => setDatosForm({ ...datosForm, cudFechaEmision: e.target.value })}
                      style={modoEdicion ? inputEditableStyle : inputReadOnlyStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>FECHA DE VENCIMIENTO</label>
                    <input
                      type="date"
                      value={datosForm.cudFechaVencimiento}
                      disabled={!modoEdicion}
                      onChange={(e) => setDatosForm({ ...datosForm, cudFechaVencimiento: e.target.value })}
                      style={modoEdicion ? inputEditableStyle : inputReadOnlyStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>FOTO / CONSTANCIA DEL CUD (PDF O IMAGEN)</label>
                    {modoEdicion ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <input
                          type="file"
                          accept=".pdf, image/png, image/jpeg, image/jpg"
                          onChange={handleSubirCUD}
                          style={{ fontSize: '11px', color: '#a1a1aa' }}
                        />
                        {datosForm.cudNombreArchivo && (
                          <span style={{ fontSize: '11px', color: '#4fb822' }}>
                            ✓ {datosForm.cudNombreArchivo}
                          </span>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={datosForm.cudNombreArchivo || (datosForm.cudArchivo ? 'DOCUMENTO ADJUNTO' : 'SIN ARCHIVO')}
                        disabled
                        style={inputReadOnlyStyle}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              marginBottom: '20px',
              padding: '16px',
              border: '1px solid #27272a',
              borderRadius: '8px',
              position: 'relative',
              background: '#121212'
            }}>
              <span style={{
                position: 'absolute',
                top: '-10px',
                left: '12px',
                background: '#18181b',
                padding: '0 8px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#4fb822',
                letterSpacing: '0.05em'
              }}>
                INFORMACIÓN DE CONTACTO
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '14px', marginTop: '4px' }}>
                <div>
                  <label style={labelStyle}>CORREO ELECTRÓNICO</label>
                  <input
                    type="email"
                    value={datosForm.email}
                    disabled={!modoEdicion}
                    onChange={(e) => setDatosForm({ ...datosForm, email: e.target.value })}
                    style={modoEdicion ? inputEditableStyle : inputReadOnlyStyle}
                    placeholder="ejemplo@correo.com"
                  />
                </div>

                <div>
                  <label style={labelStyle}>TELÉFONO PRINCIPAL</label>
                  <input
                    type="text"
                    value={datosForm.tel1}
                    disabled={!modoEdicion}
                    onChange={(e) => setDatosForm({ ...datosForm, tel1: e.target.value })}
                    style={modoEdicion ? inputEditableStyle : inputReadOnlyStyle}
                    placeholder="3454112233"
                  />
                </div>

                <div>
                  <label style={labelStyle}>TELÉFONO ALTERNATIVO</label>
                  <input
                    type="text"
                    value={datosForm.tel2}
                    disabled={!modoEdicion}
                    onChange={(e) => setDatosForm({ ...datosForm, tel2: e.target.value })}
                    style={modoEdicion ? inputEditableStyle : inputReadOnlyStyle}
                    placeholder="3454998877"
                  />
                </div>
              </div>
            </div>

            <div style={{
              marginBottom: '20px',
              padding: '16px',
              border: '1px solid #27272a',
              borderRadius: '8px',
              position: 'relative',
              background: '#121212'
            }}>
              <span style={{
                position: 'absolute',
                top: '-10px',
                left: '12px',
                background: '#18181b',
                padding: '0 8px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#4fb822',
                letterSpacing: '0.05em'
              }}>
                DATOS LABORALES
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginTop: '4px' }}>
                <div>
                  <label style={labelStyle}>REPARTICIÓN ASIGNADA</label>
                  <input
                    type="text"
                    value={datosForm.reparticion}
                    disabled={!modoEdicion}
                    onChange={(e) => setDatosForm({ ...datosForm, reparticion: e.target.value.toUpperCase() })}
                    style={modoEdicion ? inputEditableStyle : inputReadOnlyStyle}
                    maxLength={150}
                    placeholder="Escribí la repartición propuesta"
                  />
                </div>

                <div>
                  <label style={labelStyle}>FUNCIÓN / CARGO ASIGNADO</label>
                  {modoEdicion ? (
                    <select
                      value={datosForm.funcion}
                      onChange={(e) => setDatosForm({ ...datosForm, funcion: e.target.value })}
                      style={{
                        ...inputEditableStyle,
                        cursor: 'pointer',
                        backgroundColor: '#18181b',
                        color: '#ffffff',
                      }}
                    >
                      <option value="">-- SELECCIONE UNA FUNCIÓN --</option>
                      {funcionesDisponibles.map((func) => (
                        <option key={func.idfuncion} value={func.funcion}>
                          {func.funcion}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={datosForm.funcion || 'NO ESPECIFICADA'}
                      disabled
                      style={inputReadOnlyStyle}
                    />
                  )}
                </div>

                <div>
                  <label style={labelStyle}>ESTADO CIVIL</label>
                  <input
                    type="text"
                    value={datosForm.estadoCivil}
                    disabled={!modoEdicion}
                    onChange={(e) => setDatosForm({ ...datosForm, estadoCivil: e.target.value.toUpperCase() })}
                    style={modoEdicion ? inputEditableStyle : inputReadOnlyStyle}
                    placeholder="Ej: SOLTERO/A"
                  />
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* SECCIÓN 3: FAMILIARES */}
          <div style={{ marginBottom: '24px' }}>
            <div style={sectionDividerStyle}>
              <span style={sectionTitleStyle}>3. VINCULOS DE PARENTESCO Y CARGAS DE FAMILIA</span>
            </div>

            <div style={{ border: '1px solid #282828', borderRadius: '6px', overflow: 'hidden', marginTop: '14px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#1c1c1c' }}>
                <thead>
                  <tr style={{ backgroundColor: '#161616', borderBottom: '1px solid #282828' }}>
                    <th style={tableHeadStyle}>PARENTESCO</th>
                    <th style={tableHeadStyle}>APELLIDO</th>
                    <th style={tableHeadStyle}>NOMBRES</th>
                    <th style={tableHeadStyle}>DISCAPACIDAD</th>
                    {modoEdicion && <th style={{ ...tableHeadStyle, textAlign: 'right' }}>ACCION</th>}
                  </tr>
                </thead>
                <tbody>
                  {familiares.map((f, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #252525' }}>
                      <td style={tableCellStyle}>{f.parentesco}</td>
                      <td style={tableCellStyle}>{f.apellido}</td>
                      <td style={tableCellStyle}>{f.nombres}</td>
                      <td style={tableCellStyle}>{f.discapacitado ? 'SI' : 'NO'}</td>
                      {modoEdicion && (
                        <td style={{ textAlign: 'right' }}>
  <div style={{ display: 'inline-flex', gap: '14px', alignItems: 'center' }}>
    <button
      type="button"
      onClick={() => handleEditarFamiliar(idx)}
      style={{
        background: 'none',
        border: 'none',
        color: '#38bdf8', // Color celeste
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '12px',
        padding: 0,
        textTransform: 'uppercase'
      }}
    >
      EDITAR
    </button>

    <button
      type="button"
      onClick={() => handleEliminarFamiliar(idx)}
      style={{
        background: 'none',
        border: 'none',
        color: '#ef4444', // Color rojo
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '12px',
        padding: 0,
        textTransform: 'uppercase'
      }}
    >
      QUITAR
    </button>
  </div>
</td>
                      )}
                    </tr>
                  ))}
                  {familiares.length === 0 && (
                    <tr>
                      <td colSpan={modoEdicion ? 5 : 4} style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
                        NO POSEE FAMILIARES REGISTRADOS
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

         {modoEdicion && (
        <div style={{ marginTop: '12px' }}>
        <button
        type="button"
        onClick={handleNuevoFamiliar}         
      style={{
        ...btnGrisStyle,
         padding: '10px 16px',
         fontSize: '11px',
         letterSpacing: '0.04em',
        cursor: 'pointer',
      }}
    >
      AGREGAR VINCULO
    </button>
  </div>
)}
      {mostrarModalFamiliar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#fff',
            color: '#333',
            padding: '24px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '520px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px', color: '#111' }}>
              AGREGAR FAMILIAR A CARGO
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>APELLIDO:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '7px', boxSizing: 'border-box' }}
                  value={nuevoFamiliar.apellido}
                  onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, apellido: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>NOMBRES:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '7px', boxSizing: 'border-box' }}
                  value={nuevoFamiliar.nombres}
                  onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, nombres: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>TIPO DOC:</label>
                <select
                  style={{ width: '100%', padding: '7px', boxSizing: 'border-box' }}
                  value={nuevoFamiliar.tipoDocumento}
                  onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, tipoDocumento: e.target.value })}
                >
                  <option value="DNI">DNI</option>
                  <option value="LC">LC</option>
                  <option value="LE">LE</option>
                  <option value="PASAPORTE">PASAPORTE</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>NRO. DOCUMENTO:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '7px', boxSizing: 'border-box' }}
                  value={nuevoFamiliar.nroDocumento}
                  onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, nroDocumento: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>SEXO:</label>
                <select
                  style={{ width: '100%', padding: '7px', boxSizing: 'border-box' }}
                  value={nuevoFamiliar.sexo}
                  onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, sexo: e.target.value })}
                >
                  <option value="MASCULINO">MASCULINO</option>
                  <option value="FEMENINO">FEMENINO</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>FECHA NACIMIENTO:</label>
                <input
                  type="date"
                  style={{ width: '100%', padding: '7px', boxSizing: 'border-box' }}
                  value={nuevoFamiliar.fechaNacimiento}
                  onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, fechaNacimiento: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>PARENTESCO:</label>
                <select
                  style={{ width: '100%', padding: '7px', boxSizing: 'border-box' }}
                  value={nuevoFamiliar.parentesco}
                  onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, parentesco: e.target.value })}
                >
                  <option value="HIJO/A">HIJO/A</option>
                  <option value="CONYUGE">CONYUGE</option>
                  <option value="PADRE">PADRE</option>
                  <option value="MADRE">MADRE</option>
                  <option value="HERMANO/A">HERMANO/A</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>

<div style={{ gridColumn: 'span 2', marginTop: '6px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <input
      type="checkbox"
      id="modalDiscapacitado"
      checked={nuevoFamiliar.discapacitado}
      onChange={(e) => {
        const isChecked = e.target.checked;
        setNuevoFamiliar({
          ...nuevoFamiliar,
          discapacitado: isChecked,
          archivoCud: isChecked ? nuevoFamiliar.archivoCud : null,
          nombreArchivoCud: isChecked ? nuevoFamiliar.nombreArchivoCud : '',
        });
      }}
    />
    <label htmlFor="modalDiscapacitado" style={{ fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
      ¿POSEE CERTIFICADO ÚNICO DE DISCAPACIDAD?
    </label>
  </div>

  {nuevoFamiliar.discapacitado && (
    <div style={{
      marginTop: '10px',
      padding: '12px',
      backgroundColor: '#2a2a2a',
      borderRadius: '6px',
      border: '1px dashed #666',
    }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#f3f4f6', marginBottom: '6px' }}>
        ADJUNTAR CERTIFICADO ÚNICO DE DISCAPACIDAD (CUD):
      </label>
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          if (!file) return;

          const extension = file.name.split('.').pop()?.toLowerCase();
          const extensionesValidas = ['pdf', 'jpg', 'jpeg', 'png'];
          if (!extension || !extensionesValidas.includes(extension)) {
            alert('El CUD debe ser un archivo PDF o imagen (JPG, PNG).');
            e.target.value = '';
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            alert('El archivo no debe superar los 5 MB.');
            e.target.value = '';
            return;
          }

          setNuevoFamiliar((prev) => ({
            ...prev,
            archivoCud: file,
            nombreArchivoCud: file.name,
          }));
        }}
             style={{
              width: '100%',
              fontSize: '12px',
              color: '#ccc',
              boxSizing: 'border-box',
                }}
                   />
                {nuevoFamiliar.nombreArchivoCud && (
                <span style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#10b981' }}>
                ✓ Archivo seleccionado: {nuevoFamiliar.nombreArchivoCud}
               </span>
                )}
            </div>
          )}
     </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setMostrarModalFamiliar(false)}
                style={{
                  padding: '8px 14px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleGuardarFamiliar}
                style={{
                  padding: '8px 14px',
                  background: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                GUARDAR VÍNCULO
              </button>
            </div>
          </div>
        </div>
      )}
                
  
</div>

          {modoEdicion && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #282828', paddingTop: '20px' }}>
              <button
                type="button"
                onClick={handleCancelar}
                style={btnGrisStyle}
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleEnviarSolicitud} // <--- ACÁ SE CONECTA LA FUNCIÓN
                disabled={guardando}
                style={btnVerdeStyle}
              >
                {guardando ? 'TRANSMITIENDO...' : 'REGISTRAR SOLICITUD'}
              </button>
            </div>
          )}
      </div>
  );
};

// ESTILOS 
const pageContainerStyle: React.CSSProperties = {
  backgroundColor: '#0d0d0d',
  minHeight: '100vh',
  width: '100%',
  padding: 0,
  justifyContent: 'center',        
  boxSizing: 'border-box',
  fontFamily: 'Segoe UI, sans-serif',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#141414',
  border: '1px solid #27272a',
  borderRadius: '10px',
  width: '100%',
  maxWidth: '1150px',
  padding: '32px 36px',             
  boxSizing: 'border-box',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '24px 28px',
  backgroundColor: '#141414',
  borderBottom: '1px solid #282828',
};



const sectionDividerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  borderBottom: '1px solid #2e2e2e',
  paddingBottom: '8px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#e5e7eb',
  letterSpacing: '0.06em',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '16px',
  marginTop: '16px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: '#9ca3af',
  marginBottom: '6px',
  letterSpacing: '0.05em',
};

const inputDisabledStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  backgroundColor: '#121212',
  border: '1px solid #242424',
  borderRadius: '5px',
  color: '#6b7280',
  fontSize: '13px',
  letterSpacing: '0.02em',
  boxSizing: 'border-box',
  cursor: 'not-allowed',
};

const inputReadOnlyStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  backgroundColor: '#1c1c1c',
  border: '1px solid #2e2e2e',
  borderRadius: '5px',
  color: '#e5e7eb',
  fontSize: '13px',
  boxSizing: 'border-box',
};

const inputEditableStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  backgroundColor: '#1f2421',
  border: '1px solid #4fb822',
  borderRadius: '5px',
  color: '#ffffff',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

const tableHeadStyle: React.CSSProperties = {
  padding: '11px 14px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#9ca3af',
  letterSpacing: '0.06em',
};

const tableCellStyle: React.CSSProperties = {
  padding: '11px 14px',
  fontSize: '13px',
  color: '#e5e7eb',
};


const btnVerdeStyle: React.CSSProperties = {
  backgroundColor: '#4fb822',
  color: '#ffffff',
  border: 'none',
  borderRadius: '5px',
  padding: '10px 20px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '0.04em',
};

const btnGrisStyle: React.CSSProperties = {
  backgroundColor: '#383d42',
  color: '#ffffff',
  border: 'none',
  borderRadius: '5px',
  padding: '10px 18px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '0.04em',
};
