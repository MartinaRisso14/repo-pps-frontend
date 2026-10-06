# Sistema de Legajo Único — Frontend

Interfaz web construida con React, TypeScript y Vite para consultar legajos, enviar solicitudes de modificación, revisar su historial y administrar solicitudes.

La documentación funcional integral está en [`DOCUMENTACION.md`](./DOCUMENTACION.md).

## Despliegue

Publicar como aplicación estática Vite. Comando de build: `npm ci && npm run build`; directorio de salida: `dist`. Definir `VITE_API_URL` con la URL HTTPS pública del backend antes de compilar. Cargar `VITE_API_URL` como variable de entorno del proveedor; no incluir secretos en el frontend. Configurar el fallback de rutas SPA para que las rutas de React Router se sirvan desde `index.html`.
