# Guía de Deploy a Railway

Esta guía te ayudará a desplegar tu aplicación OBS WebSocket Controller en Railway.

## 📋 Pre-requisitos

1. Cuenta en [Railway.app](https://railway.app/)
2. Repositorio Git (GitHub, GitLab, o Bitbucket)
3. CLI de Railway instalado (opcional)

## 🚀 Método 1: Deploy desde GitHub (Recomendado)

### Paso 1: Preparar el Repositorio

1. **Inicializar Git** (si no lo has hecho):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **Subir a GitHub**:
```bash
git remote add origin https://github.com/tu-usuario/obs-websocket-controller.git
git branch -M main
git push -u origin main
```

### Paso 2: Crear Proyecto en Railway

1. Ve a [Railway.app](https://railway.app/) e inicia sesión
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Autoriza Railway a acceder a tu GitHub
5. Selecciona el repositorio `obs-websocket-controller`

### Paso 3: Configurar Variables de Entorno

En el dashboard de Railway, ve a la pestaña **"Variables"** y agrega:

```env
NODE_ENV=production
SESSION_SECRET=tu-secret-super-seguro-cambiar-esto
PORT=8000
```

**IMPORTANTE**: Genera un SESSION_SECRET seguro usando:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Paso 4: Configurar Build y Deploy

Railway debería detectar automáticamente tu proyecto Node.js. Si no:

1. Ve a **Settings → Deploy**
2. **Build Command**:
   ```bash
   npm run build
   ```
3. **Start Command**:
   ```bash
   npm start
   ```
4. **Root Directory**: deja en blanco o `/`

### Paso 5: Deploy

Railway desplegará automáticamente. Puedes ver los logs en tiempo real en la pestaña **"Deployments"**.

## 🚀 Método 2: Deploy con Railway CLI

### Instalación

```bash
npm install -g @railway/cli
```

### Login

```bash
railway login
```

### Deploy

```bash
# En el directorio raíz del proyecto
railway init
railway up
```

## 📦 Estructura de Build

Railway ejecutará los siguientes comandos:

1. **Install**: `npm install` (instala dependencias del root)
2. **Build**: `npm run build`
   - Construye el frontend: `cd frontend && npm install && npm run build`
   - Construye el backend: `cd backend && npm install && npm run build`
3. **Start**: `npm start`
   - Ejecuta: `cd backend && npm start` (que corre `node dist/index.js`)

## 🗄️ Base de Datos

Tu aplicación soporta **automáticamente** SQLite y PostgreSQL. La base de datos se selecciona según las variables de entorno:

- **Sin `DATABASE_URL`** → Usa SQLite (desarrollo local)
- **Con `DATABASE_URL`** → Usa PostgreSQL (producción)

### Opción 1: SQLite (Desarrollo local)

Por defecto, SQLite se usa en desarrollo. El archivo `data/users.db` se crea automáticamente.

**⚠️ IMPORTANTE en Railway**: Los archivos en Railway son efímeros. Si usas SQLite en producción y el contenedor se reinicia, **perderás todos los datos**.

### Opción 2: PostgreSQL (✅ Recomendado para producción)

Para datos persistentes en Railway:

#### Paso 1: Agregar PostgreSQL en Railway

1. En tu proyecto Railway, click en **"New"**
2. Selecciona **"Database" → "Add PostgreSQL"**
3. Railway creará la base de datos y agregará automáticamente la variable `DATABASE_URL`

#### Paso 2: Ejecutar Migraciones

Una vez que tu app se despliegue con PostgreSQL, ejecuta las migraciones para crear las tablas:

**Opción A: Desde Railway CLI**
```bash
railway run npm run migrate --prefix backend
```

**Opción B: Desde Railway Shell**
1. Ve a tu proyecto → Click en el servicio backend → **Shell**
2. Ejecuta:
```bash
cd backend && npm run migrate
```

#### Paso 3: Verificar la conexión

Revisa los logs de tu aplicación. Deberías ver:
```
✅ Usando PostgreSQL (DATABASE_URL detectada)
✅ Tablas de base de datos inicializadas
```

**Eso es todo!** Tu aplicación ahora usa PostgreSQL automáticamente. No necesitas cambiar código.

## 🎯 Crear Usuario Administrador

Una vez desplegado, necesitas crear un usuario:

### Opción 1: Desde Railway CLI

```bash
railway run npm run user:add --prefix backend
```

### Opción 2: Conectándote al contenedor

1. Ve a Railway → tu proyecto → Settings → Enable "Railway Shell"
2. Abre la shell y ejecuta:
```bash
cd backend
npm run user:add
```

## 🌐 Acceder a tu aplicación

1. Railway te dará una URL como: `https://obs-websocket-controller-production.up.railway.app`
2. Accede al login: `https://tu-app.railway.app/`
3. Para OBS Browser Source: `https://tu-app.railway.app/obs`

## 🔧 Configurar OBS

En OBS Studio:

1. **Agregar Browser Source**
2. **URL**: `https://tu-app.railway.app/obs`
3. **Width**: 1920
4. **Height**: 1080
5. ✅ Marca "Shutdown source when not visible"
6. ✅ Marca "Refresh browser when scene becomes active"

## 📝 Variables de Entorno Disponibles

| Variable | Descripción | Default | Requerido |
|----------|-------------|---------|-----------|
| `NODE_ENV` | Entorno de ejecución | `development` | ✅ Sí (usar `production`) |
| `PORT` | Puerto del servidor | `8000` | ❌ No (Railway asigna automáticamente) |
| `SESSION_SECRET` | Secret para sesiones | - | ✅ Sí |

## 🐛 Troubleshooting

### El build falla

1. Verifica que `package.json` en root tenga los scripts correctos
2. Revisa los logs en Railway → Deployments → Build Logs

### WebSocket no conecta

1. Verifica que uses `wss://` (WebSocket Secure) en producción
2. Railway soporta WebSockets nativamente, no necesitas configuración extra

### "Cannot find module"

1. Asegúrate de que todas las dependencias estén en `dependencies` (no en `devDependencies` si se necesitan en producción)
2. Verifica que el build se completó correctamente

### Los archivos subidos desaparecen

Railway usa almacenamiento efímero. Opciones:
1. Usar un servicio de almacenamiento externo (AWS S3, Cloudinary)
2. Usar Railway Volumes (almacenamiento persistente)

## 📊 Monitoreo

Railway proporciona:
- **Metrics**: CPU, RAM, Network usage
- **Logs**: Logs en tiempo real de tu aplicación
- **Deployments**: Historial de deployments

## 🔄 Actualizaciones

Railway se auto-deploya cuando haces push a la rama configurada (usualmente `main`):

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway detectará el cambio y desplegará automáticamente.

## 💰 Costos

Railway ofrece:
- **Plan Free**: $5 de créditos mensuales (suficiente para proyectos pequeños)
- **Plan Hobby**: $5/mes por servicio
- **Plan Pro**: Pay-as-you-go

## 🔗 Recursos

- [Railway Docs](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://railway.app/status)

---

## ✅ Checklist de Deploy

- [ ] Repositorio en GitHub/GitLab
- [ ] Variables de entorno configuradas en Railway
- [ ] Build exitoso
- [ ] Usuario administrador creado
- [ ] Aplicación accesible desde la URL
- [ ] OBS Browser Source configurado
- [ ] WebSocket conectando correctamente

---

**¿Necesitas ayuda?** Revisa los logs en Railway o abre un issue en el repositorio.
