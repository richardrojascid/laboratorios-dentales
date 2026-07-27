# ArcadaLab — Laboratorio de prótesis dentales

App web responsive para que el laboratorio (dueño) reciba solicitudes de prótesis dentales desde doctores enrolados, gestione estados/montos/pagos y vea estadísticas.

## Roles

- **Dueño / laboratorio**: enrola doctores, ve todas las solicitudes, asigna montos, cambia estados de trabajo y pago, sube comprobantes, mantiene campos del formulario, ve estadísticas y cambia logo/nombre.
- **Doctor**: inicia sesión, crea solicitudes de pacientes y consulta el estado de sus trabajos.

## Requisitos

- Node.js 20+
- npm

## Configuración

1. Instala y prepara la base de datos (crea `.env` automáticamente si falta):

```bash
npm install
npm run db:setup
```

2. Arranca en desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Si ves el error `Environment variable not found: DATABASE_URL`, ejecuta:

```powershell
npm run db:setup
npm run dev
```

### Credenciales iniciales

**Dueño / laboratorio**
- Email: `admin@arcadalab.cl`
- Contraseña: `Admin123!`

**Doctor demo**
- Email: `dra.fernanda@gmail.com`
- Contraseña: `Doctor123!`

## Recuperación de contraseña (Gmail)

Configura en `.env`:

```
GMAIL_USER=tu-correo@gmail.com
GMAIL_APP_PASSWORD=tu-app-password-de-google
```

Si no están configurados, en desarrollo el enlace de recuperación se muestra en pantalla.

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción |
| `npm run db:setup` | Crea SQLite + seed |
| `npm run lint` | ESLint |

## Marca

Incluye logo provisional **ArcadaLab** (diente + maletín de laboratorio). Puedes reemplazarlo en **Marca** dentro del panel del dueño.
