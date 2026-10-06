# Documentación integral — Sistema de Legajo Único

**Actualizada:** 6 de octubre de 2026
**Alcance:** aplicación web, API y persistencia identificadas en los repositorios `frontend` y `PPS-Repo-backend`.

Este documento describe el funcionamiento observado en el código. Cuando una pantalla presupone una función que el backend no implementa, se indica expresamente como limitación; no debe tomarse como una garantía operativa.

## 1. Resumen del sistema

El sistema permite consultar información de un agente municipal y solicitar cambios en su legajo. Una persona administradora revisa las solicitudes de otros usuarios y puede aprobarlas o rechazarlas. Las personas usuarias consultan el estado de sus trámites y pueden generar un comprobante PDF desde el navegador.

La solución está dividida en dos aplicaciones:

| Parte | Tecnología | Ubicación |
|---|---|---|
| Interfaz web | React, TypeScript, React Router y Vite | `frontend/` |
| API | NestJS, TypeORM y PostgreSQL | `PPS-Repo-backend/` |

La interfaz se comunica con una API REST y el backend persiste la información en PostgreSQL.

## 2. Arquitectura y organización

### Frontend

- [`src/main.tsx`](./src/main.tsx) monta la aplicación React e importa los estilos globales.
- [`src/App.tsx`](./src/App.tsx) declara las rutas y el selector de tema.
- [`src/componentes/EncabezadoInstitucional.tsx`](./src/componentes/EncabezadoInstitucional.tsx) contiene el logo, nombre institucional y espacio opcional para acciones de navegación.
- [`src/api/axiosClient.ts`](./src/api/axiosClient.ts) configura Axios y agrega el token de sesión a las solicitudes.
- [`src/services/auth.service.ts`](./src/services/auth.service.ts) concentra las llamadas de autenticación.
- `src/paginas/` contiene las pantallas funcionales.
- [`src/index.css`](./src/index.css) contiene estilos globales, temas y encabezado; [`SolicitudesAdmin.css`](./src/paginas/SolicitudesAdmin.css) complementa la bandeja administrativa.

No se utiliza un store global de estado: las pantallas administran sus datos con hooks de React. La sesión y la preferencia de tema se guardan en `localStorage`.

### Backend

- [`src/main.ts`](../PPS-Repo-backend/src/main.ts) configura CORS, validación global y el puerto.
- [`src/app.module.ts`](../PPS-Repo-backend/src/app.module.ts) registra PostgreSQL/TypeORM y los módulos de la aplicación.
- `src/auth/` autentica contra `public.usuarios` y emite JWT para la API de legajos.
- `src/usuarios/` consulta información del usuario/legajo; no crea usuarios ni modifica contraseñas.
- `src/solicitudes/` crea, lista, aprueba y rechaza solicitudes.
- Los DTO definen y validan las entradas de la API; las entidades TypeORM representan parte del modelo.
- La columna `empleados.tipodocumento` se incorpora con la migración SQL del backend. Los registros existentes quedan con `DNI` por defecto; el perfil muestra el tipo devuelto por la API junto al número del documento.

El backend también conserva la ruta `GET /` de ejemplo de NestJS, que responde `Hello World`.

## 3. Rutas y pantallas web

Las rutas se declaran en [`src/App.tsx`](./src/App.tsx). Una ruta desconocida redirige a `/login`.

| Ruta | Pantalla | Función |
|---|---|---|
| `/login` | Ingreso | Autentica al usuario y dirige a la bandeja si su rol es 1; para otros roles, al perfil. |
| `/perfil` | Legajo | Consulta datos y permite preparar y enviar una solicitud de modificación. |
| `/solicitudes` | Historial personal | Muestra trámites propios, su estado, detalle y opciones de comprobante PDF. |
| `/admin/solicitudes` | Bandeja administrativa | Busca, filtra y resuelve solicitudes de otros usuarios. |

El frontend no implementa guards de ruta: escribir una URL manualmente no es, por sí solo, una comprobación de autorización. La autorización efectiva debe estar en el backend.

## 4. Acceso, identidad y roles

1. El usuario envía su nombre de usuario y contraseña a `POST /auth/login`.
2. El backend consulta la cuenta activa en `public.usuarios`, compara el hash con bcrypt y devuelve un token JWT junto con información del usuario.
3. El frontend conserva el token como `access_token`, y también guarda datos auxiliares como `usuNombre` e `idRol`.
4. Axios agrega el token en la cabecera de autorización como bearer token.
5. Ante una respuesta HTTP 401, el interceptor borra los datos locales de sesión; no se observó una redirección automática al login desde ese interceptor.

El JWT expone `usuCodigo`, `idRol` y `email` para la estrategia de autenticación. La bandeja y las acciones administrativas requieren el rol `1`. No se encontró un catálogo o enum de roles en el código inspeccionado, por lo que ese valor es una convención fija del sistema.

Las cuentas, roles y contraseñas pertenecen al sistema de usuarios existente. Para que el login use esas cuentas, el backend debe conectarse a la misma base de datos y el sistema externo debe mantener un hash compatible con bcrypt. La aplicación de legajos solo lee el hash para autenticar; no registra usuarios ni cambia o recupera contraseñas. La verificación en el entorno compartido debe confirmar también que `idRol: 1` corresponde a Administrador.

La preferencia de tema no forma parte de la sesión: se guarda por navegador bajo la clave `theme`.

## 5. Flujo de modificación del legajo

### Preparar y enviar un cambio

1. Desde `/perfil`, se consultan los datos del usuario y del legajo.
2. Los campos considerados inmutables se muestran solo para consulta. Los datos editables y la lista de familiares se pueden modificar en el formulario.
3. El frontend conserva los valores originales. Al enviar, calcula las diferencias y manda los campos que efectivamente cambiaron; para familiares manda los agregados, modificados o quitados.
4. Si no hay diferencias, informa que no hay cambios y no crea una solicitud.
5. `POST /solicitudes` registra los datos recibidos con estado `PENDIENTE`. El backend rechaza la creación si el usuario ya tiene una solicitud pendiente.

Las solicitudes anteriores que guardaron el formulario completo pueden contener más datos que los modificados en ese momento. Para esos registros, las vistas priorizan los familiares marcados `esNuevo` cuando existen. Las solicitudes nuevas guardan en `valoresAnteriores` los valores visibles al abrir el formulario, incluidos los campos cambiados y los datos previos de familiares editados o quitados. La bandeja compara cada valor anterior con el valor solicitado. En solicitudes históricas sin esa información, muestra que el valor anterior no quedó guardado en vez de inferirlo del legajo actual.

### Revisar en administración

La bandeja permite buscar por número de solicitud, legajo o agente, filtrar por estado y abrir el detalle. Se muestran el cambio solicitado, los familiares nuevos detectados y los adjuntos reconocidos por la interfaz.

- El listado administrativo excluye las solicitudes del administrador autenticado, pero incluye las de otros administradores.
- El administrador puede seguir viendo sus propias solicitudes en `/solicitudes`, su historial personal.
- Aprobar o rechazar solo es válido mientras la solicitud siga pendiente.
- Rechazar requiere un motivo. El resultado registra quién revisó y la fecha de revisión.
- Aprobar aplica los cambios dentro de una transacción y actualiza el estado a `APROBADA`. Los familiares existentes se reconocen por `idFamiliar`; los nuevos se identifican mediante `esNuevo: true` y los quitados mediante `eliminado: true`.

La actualización de familiares usa las tablas preexistentes del esquema de PostgreSQL. Para nuevos familiares, el servicio calcula el siguiente `numfamiliar` disponible para el legajo. Quitar un familiar existente en el formulario solicita una baja lógica: al aprobar, su registro se conserva con `estado = 'BA'` y deja de aparecer en el perfil, que consulta únicamente familiares `AC`.

Los cambios de domicilio y teléfono actualizan únicamente los campos enviados en `public.direcciones` cuyo `estado = 'AC'`; si no hay una dirección activa, se crea una nueva sin reactivar registros históricos dados de baja. El correo solicitado se guarda tanto en `public.direcciones.email` —fuente usada para mostrarlo en el perfil— como en `public.usuarios.email` —fuente usada por la cuenta—. Al vaciar esos campos o el estado civil, su valor se guarda como `NULL`. La consulta del perfil filtra direcciones por `estado = 'AC'`.

La función se carga desde `GET /usuarios/catalogos/funciones`; la lista aprobada del formulario se inserta idempotentemente en `public.funciones` mediante `database/migrations/20261006_seed_functions.sql`. Al aprobar una solicitud, el backend valida el nombre contra ese catálogo y actualiza `empleados.idfuncion`. La consulta del perfil devuelve el ID y el nombre asignado.

La repartición se puede proponer como texto libre de hasta 150 caracteres. El nombre solo se agrega o reactiva en `public.reparticiones` cuando administración aprueba la solicitud; al rechazarla, no se crea el registro. Se reutiliza una repartición activa que coincida ignorando mayúsculas y espacios exteriores, y hay una restricción única para prevenir duplicados concurrentes. La migración `database/migrations/20261006_prepare_repartitions_for_approval.sql` configura el ID automático requerido por la tabla.

### Historial, fechas y PDF

El historial personal muestra cantidades por estado, fechas, detalle y motivo de rechazo cuando existe. El PDF se genera en el navegador con jsPDF; no es un documento generado ni almacenado por el backend.

- `fechaCreacion`: momento de envío.
- `fechaRevision`: momento de aprobación o rechazo; puede no existir para solicitudes pendientes.
- Cuando un timestamp llega sin zona horaria, la interfaz lo interpreta como UTC y lo presenta en `America/Argentina/Buenos_Aires`.
- El detalle y el PDF incluyen los familiares de la solicitud con la información disponible, y no deben volcar cadenas binarias de archivos/fotos.

## 6. Archivos adjuntos: flujo implementado y límites

Los archivos seleccionados para una solicitud se convierten a Data URL/Base64 y se envían en el cuerpo JSON de `POST /solicitudes`. El backend valida el tipo y la firma del contenido antes de persistirlos en `solicitudes_modificacion.datos_solicitados` (JSONB). Los límites son 3 MB para la foto y 5 MB por certificado CUD; el total de adjuntos de una solicitud no puede superar 15 MB. El cuerpo JSON admite hasta 24 MB para contemplar la expansión de Base64.

La bandeja administrativa obtiene los archivos junto con la solicitud y permite abrir por separado la foto del agente, el CUD del agente y los CUD adjuntos a familiares. La respuesta de la API solo expone estos datos a usuarios autenticados; la bandeja requiere además el rol administrador. El historial propio puede recuperar los archivos de sus solicitudes.

La estructura y las relaciones fueron corroboradas con las capturas de PostgreSQL: `archivos.idarchivo` y `emp_cud.idcud` usan secuencias (`nextval`) y se generan automáticamente; hay claves foráneas desde `empleados.idarchivofoto` y `emp_cud.idarchivo` hacia `archivos.idarchivo`, y desde `emp_cud.legajo` hacia `empleados.legajo`.

Al aprobar la solicitud, el backend inserta la foto en `public.archivos` usando las columnas reales (`contenido`, `tipoarchivo`, `nombrearchivo`, `fechacarga`, `fechamod`, `usuariomod`) y asocia el `idarchivo` devuelto a `public.empleados.idarchivofoto`. El CUD del agente también se guarda en `public.archivos` y su identificador se vincula a `public.emp_cud.idarchivo`, junto con el legajo y las fechas de emisión/vencimiento. Estas escrituras forman parte de la misma transacción que aprueba la solicitud.

`GET /archivos/:id` entrega el binario de forma autenticada y solo si el archivo está asociado a un legajo del usuario solicitante; el rol administrador puede consultar los archivos asociados a cualquier legajo. El perfil usa esta ruta para mostrar la foto y el CUD actuales, enviando el token de sesión.

**Estados de archivo:** en el esquema PostgreSQL local consultado, tanto `archivos` como `emp_cud` tienen la columna `estado`, con `AC` para activo y `BA` para baja. El perfil y la descarga solo exponen archivos activos y CUD activos. Quitar el CUD da de baja lógica el registro en `emp_cud` y también el archivo si ya no tiene otra relación activa; el binario no se borra físicamente. `familiares` no tiene una columna ni una tabla de relación con `archivos`: sus CUD pueden adjuntarse y verse desde la solicitud, pero no asociarse permanentemente sin ampliar el esquema.

Los adjuntos se validan antes de guardar: PDF/JPG/PNG, firma del contenido, 3 MB para foto, 5 MB por CUD y 15 MB en total por solicitud. No se implementó carga multipart; se reciben como Base64 en JSON y se guardan en la columna binaria `archivos.contenido` al aprobarse el trámite.

### Interfaz y servidor: qué significa una diferencia

La **interfaz** es la página y los controles que usa una persona. El **servidor** es la API que valida las peticiones, aplica permisos y persiste los datos. La interfaz puede mostrar un campo o botón aunque el servidor todavía no tenga implementada la operación completa detrás de él.

| Lo que puede verse en la interfaz | Lo que hace o confirma el servidor | Consecuencia |
|---|---|---|
| Seleccionar un archivo al solicitar un cambio | La API lo valida y conserva en `datos_solicitados`; al aprobarlo, lo copia a `archivos` y actualiza la relación correspondiente de `empleados` o `emp_cud` | El adjunto queda relacionado con el legajo tras la aprobación; los CUD de familiares quedan solo en la solicitud por falta de relación en el esquema compartido. |
| Entrar escribiendo directamente `/admin/solicitudes` | La ruta React no bloquea por rol; la API sí exige rol 1 para la bandeja y resolver solicitudes | La seguridad no depende de ocultar una pantalla; la API debe rechazar las operaciones no autorizadas. |
| Abrir una ficha de usuario | `GET /usuarios/:usuNombre` requiere JWT y solo permite consultar el propio legajo o el de otra persona con rol administrador; la respuesta no incluye `password_hash` | Las consultas de legajo quedan autenticadas y el hash no se expone al cliente. |
| Ver un estado o detalle en el navegador | La API es la fuente de verdad del estado y la fecha de revisión | Lo que no se haya persistido o devuelto por la API no debe presentarse como un cambio aplicado. |

Estos ejemplos describen áreas pendientes de revisión; no significan que todos los datos mostrados en pantalla estén desincronizados.

## 7. API HTTP

Todas las rutas siguientes se sirven desde el backend NestJS. Las rutas administrativas de solicitudes requieren bearer JWT y rol 1. Las demás condiciones de acceso se indican cuando fueron verificadas.

### Aplicación y autenticación

| Método y ruta | Acceso observado | Descripción |
|---|---|---|
| `GET /` | Público | Ruta de ejemplo de NestJS. |
| `POST /auth/login` | Público | Cuerpo: `{ usuNombre, password }`. Devuelve `access_token` y `usuario` (`usuCodigo`, `usuNombre`, `apeNom`, `idRol`, `email`, `debeCambiarPassword`). |

### Usuarios y legajo

| Método y ruta | Acceso observado | Descripción |
|---|---|---|
| `GET /usuarios/:usuNombre` | JWT; el usuario puede consultar su ficha y el rol 1 puede consultar otras | Devuelve información ampliada del usuario/legajo, sin `password_hash`. |
| `GET /usuarios/catalogos/funciones` | JWT | Devuelve `idfuncion` y nombre de cada función disponible para el formulario. |
| `GET /archivos/:id` | JWT; dueño del legajo asociado o rol 1 | Devuelve el binario de una foto o CUD que esté asociado a un legajo activo. |

### Solicitudes

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `POST /solicitudes` | JWT | Crea una solicitud para el usuario autenticado. Las propiedades del DTO son opcionales; envía únicamente los cambios pertinentes. |
| `GET /solicitudes/mis-solicitudes` | JWT | Historial propio, ordenado por creación. |
| `GET /solicitudes` | JWT y rol 1 | Bandeja administrativa; excluye al administrador que consulta. |
| `PATCH /solicitudes/:id/aprobar` | JWT y rol 1 | Sin cuerpo; aplica y aprueba una solicitud pendiente. |
| `PATCH /solicitudes/:id/rechazar` | JWT y rol 1 | Cuerpo: `{ motivoRechazo }`; el motivo es obligatorio. |

### Validación de entradas

[`src/main.ts`](../PPS-Repo-backend/src/main.ts) instala un `ValidationPipe` global con `whitelist: true` y `forbidNonWhitelisted: true`: se validan DTOs y se rechazan propiedades no declaradas. La lista de campos aceptados para solicitudes y familiares está en [`crear-solicitud.dto.ts`](../PPS-Repo-backend/src/solicitudes/dto/crear-solicitud.dto.ts); el login y el rechazo de solicitudes también tienen DTOs.

El DTO de creación acepta campos opcionales de contacto/domicilio/trabajo (`calle`, `callenro`, `barrio`, `ciudad`, `provincia`, `tel1`, `tel2`, `email`, `estadoCivil`, `reparticion`, `funcion`), `foto`, `cud`, `datosSolicitados` y `familiares`. El correo vacío está permitido para que el proceso de aprobación pueda limpiar el email de la cuenta y del perfil; un correo no vacío sigue validándose con formato de email. Cada familiar puede incluir `idFamiliar`, `esNuevo`, `eliminado`, `parentesco`, `apeNom`, `apellido`, `nombres`, `tipoDocumento`, `nroDocumento`, `sexo`, `dni`, `fechaNacimiento`, `discapacitado`, `archivoCud` y `nombreArchivoCud`; son propiedades opcionales y las propiedades desconocidas se rechazan.

Los registros del historial contienen `id`, `usuCodigo`, `datosSolicitados`, `estado`, `fechaCreacion`, `fechaRevision`, `revisadoPor` y `motivoRechazo`. La fila de la bandeja administrativa también incluye `agente` y `legajo`. La respuesta del perfil incluye un objeto `empleado` con datos de legajo/domicilio y familiares; consultar [`usuarios.service.ts`](../PPS-Repo-backend/src/usuarios/usuarios.service.ts) para el mapeo completo y tener presente la observación de seguridad anterior.

Este resumen ayuda a integrar el frontend actual, pero no sustituye un contrato OpenAPI, que no se identificó en el proyecto.

## 8. Persistencia y datos

La aplicación usa PostgreSQL con TypeORM. `synchronize` está deshabilitado: el backend presupone que el esquema requerido ya existe y no crea/actualiza tablas automáticamente al iniciar. Las migraciones versionadas de `database/migrations/` agregan el tipo de documento, cargan funciones y preparan la secuencia e índice de reparticiones. `database/bootstrap/demo-schema.sql` crea únicamente la estructura vacía derivada del esquema local para una base de demostración; no contiene datos de personas.

El código consulta o actualiza las siguientes tablas del esquema `public`:

- `usuarios`
- `usuarioslegajos`
- `empleados`
- `direcciones`
- `familiares`
- `archivos`
- `emp_cud`
- `funciones`
- `reparticiones`
- `solicitudes_modificacion`

La entidad `SolicitudModificacion` guarda `datosSolicitados` como `jsonb`, además de estado y datos de envío/revisión. El servicio usa SQL directo en algunas consultas y operaciones; por eso depende de los nombres de tablas y columnas del esquema existente. El bootstrap de demostración no debe usarse para crear o reemplazar el esquema institucional.

El DER actualizado está en [`database/DIAGRAMA_ENTIDAD_RELACION.md`](../PPS-Repo-backend/database/DIAGRAMA_ENTIDAD_RELACION.md). El diagrama original de la práctica se conserva como referencia; el actualizado es un complemento basado en el esquema local de la aplicación.

### Diferencias respecto del DER recibido

El siguiente cuadro resume las extensiones y decisiones que conviene tener en cuenta al comparar el DER de la implementación con el diagrama original de la práctica:

| Elemento | Implementación |
|---|---|
| `solicitudes_modificacion` | Tabla agregada para conservar las propuestas, su estado, las fechas y el motivo de rechazo. Se relaciona con `usuarios` por `usucodigo` (solicitante) y por `revisado_por` (revisor opcional). Los cambios se aplican a las tablas del legajo únicamente al aprobar. |
| `empleados.tipodocumento` | Campo agregado para persistir el tipo de documento del agente. Los registros existentes del esquema local reciben `DNI` como valor predeterminado. |
| `familiares.tipodocumento`, `nrodocumento`, `sexo` y `f_nacimiento` | Campos presentes en el esquema local para registrar esos datos de cada familiar; no aparecen en el DER recibido. `tipodocumento` tiene `DNI` como valor predeterminado. |
| `usuarios.password_hash` y `usuarios.debe_cambiar_password` | Columnas presentes en el esquema local usado por la implementación, pero no mostradas en el DER recibido. El login local comprueba el hash. Falta confirmar si este mecanismo coincide con la administración de usuarios del sistema institucional. |
| Adjuntos de familiares | No existe una relación permanente entre `familiares` y `archivos` en el esquema recibido ni en el implementado. Un CUD familiar adjunto queda dentro de los datos JSONB de la solicitud y su historial. |
| Estados y control de cambios | Las tablas conservan columnas como `estado`, `fechamod` y `usuariomod` según el esquema local. No todas esas columnas tienen claves foráneas de auditoría declaradas en PostgreSQL. |
| Reparticiones | Hay un índice único sobre `LOWER(TRIM(nombre))` para evitar duplicados por mayúsculas o espacios. Es una regla de unicidad, no una tabla o relación adicional. |

Las relaciones del DER actualizado reflejan las claves foráneas declaradas en el esquema local de demostración. Algunas claves foráneas admiten `NULL`. Este esquema es una referencia de la implementación, no reemplaza ni certifica el esquema institucional.

La numeración de familiares usa `MAX(numfamiliar) + 1` por legajo. Dos aprobaciones concurrentes sobre el mismo legajo podrían competir por el mismo siguiente valor si la base no lo protege con una restricción o bloqueo adecuado; conviene resolver esa condición antes de operaciones concurrentes.

## 9. Tema y encabezado institucional

- `EncabezadoInstitucional` centraliza logo, texto institucional y acciones para mantener la misma cabecera en las pantallas.
- El selector global cambia entre claro y oscuro, aplica `data-theme` en `<html>` y persiste la preferencia bajo `theme`.
- Si no hay una preferencia guardada como `light`, el tema inicial es oscuro.
- La hoja global contiene estilos responsive y overrides claros para componentes con estilos inline; la bandeja administrativa tiene estilos propios.
- El historial no usa patrón de puntos en el fondo. Las tarjetas cambian de tema mediante CSS al cambiar la preferencia, sin depender de pasar el cursor.

## 10. Consideraciones y límites conocidos

Estos puntos son observaciones de implementación, no funcionalidades adicionales:

1. **Datos laborales:** la función usa el catálogo `public.funciones`. La repartición se propone libremente y se agrega/reutiliza en `public.reparticiones` solo cuando la persona administradora aprueba la solicitud.
2. **Baja de familiares:** implementada como baja lógica (`estado = 'BA'`), conservando el registro y el historial. No elimina los adjuntos/CUD que pudieran haberse guardado fuera de la relación familiar.
3. **Base de datos:** el esquema se administra fuera de TypeORM (`synchronize` permanece desactivado). Las migraciones versionadas deben aplicarse al actualizar el esquema.
4. **Archivos:** el reemplazo de una foto puede dejar un binario anterior sin relación; definir una política de limpieza. El esquema compartido tampoco permite asociar permanentemente un CUD a un familiar.
5. **Concurrencia:** proteger la asignación `numfamiliar` para altas simultáneas.
6. **Autenticación:** se valida la contraseña contra el hash guardado en `public.usuarios`; falta confirmar que esta tabla y su formato de hash coincidan con los del sistema de usuarios existente.
7. **Contrato API:** publicar OpenAPI/Swagger y documentar cuerpos y respuestas completos si habrá consumidores distintos de este frontend.

## 11. Referencias de código

- Frontend: [`src/App.tsx`](./src/App.tsx), [`src/api/axiosClient.ts`](./src/api/axiosClient.ts), [`src/services/auth.service.ts`](./src/services/auth.service.ts), [`src/paginas/PerfilUsuario.tsx`](./src/paginas/PerfilUsuario.tsx), [`src/paginas/SolicitudesUsuario.tsx`](./src/paginas/SolicitudesUsuario.tsx), [`src/paginas/SolicitudesAdmin.tsx`](./src/paginas/SolicitudesAdmin.tsx).
- Backend: [`README.md`](../PPS-Repo-backend/README.md), [`src/main.ts`](../PPS-Repo-backend/src/main.ts), [`src/auth/`](../PPS-Repo-backend/src/auth/), [`src/usuarios/`](../PPS-Repo-backend/src/usuarios/), [`src/solicitudes/`](../PPS-Repo-backend/src/solicitudes/).
