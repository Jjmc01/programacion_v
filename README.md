# StudentFlow Backend

Backend base de StudentFlow para la Fase 1 de preparación del entorno.

## Requisitos

- Node.js 20 o superior.
- MySQL o MariaDB para comprobar el endpoint de salud.

## Instalación

```powershell
npm install
Copy-Item .env.example .env
```

Edita `.env` con los datos de tu instalación local de MySQL y asegúrate de
tener creada la base de datos `studentflow`. Los scripts SQL entregados por el
profesor contienen el esquema y los datos iniciales.

## Ejecución

Modo desarrollo:

```powershell
npm run dev
```

Modo normal:

```powershell
npm start
```

El servidor usa el puerto `3000` por defecto.

## Endpoint de prueba

```text
GET http://localhost:3000/api/v1/health
```

Si MySQL está disponible y las variables de `.env` son correctas, la respuesta
esperada es:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected"
  }
}
```

Una ruta inexistente devuelve un error JSON uniforme con código `NOT_FOUND`.

## Estructura

```text
src/
├── app.js
├── server.js
├── config/
│   └── database.js
├── controllers/
│   └── health.controller.js
├── middlewares/
│   ├── error.middleware.js
│   └── request-context.middleware.js
├── repositories/
├── routes/
│   └── health.routes.js
├── services/
├── utils/
│   └── api-response.js
└── validators/
```

Las carpetas que todavía no tienen lógica de dominio quedan reservadas para
las siguientes fases del proyecto.
