# Sistema de Legajo Único — Frontend

Interfaz web construida con React, TypeScript y Vite para consultar legajos, enviar solicitudes de modificación, revisar su historial y administrar solicitudes.

La documentación funcional integral está en [`DOCUMENTACION.md`](./DOCUMENTACION.md).

## Despliegue en Railway

Crear un servicio Node desde este repositorio. Railway detecta el comando `npm run build` y arranca el frontend con `npm start`; el servidor estático incluido sirve `dist`, admite las rutas SPA y escucha en `PORT`.

En Variables del servicio, definir `VITE_API_URL` como `https://${{ backend.RAILWAY_PUBLIC_DOMAIN }}`, cambiando `backend` por el nombre asignado al servicio de API. El servidor entrega esta URL en tiempo de ejecución, así que se puede desplegar el frontend antes de generar el dominio público de la API y no hace falta reconstruirlo para cambiarla. No poner secretos en el frontend.

El servicio de API debe permitir el origen exacto del dominio público del frontend mediante `CORS_ORIGINS=https://${{ frontend.RAILWAY_PUBLIC_DOMAIN }}`, cambiando `frontend` por el nombre del servicio correspondiente.
