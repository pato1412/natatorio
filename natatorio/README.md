# Aqua Metrics — Medí tu rendimiento

App de cronometraje de natación con registro/login (Google, Facebook o
formulario propio), perfiles de Profesor y Atleta, cronómetro por
estilo/distancia, rankings, mejores marcas e historial. Usa Firebase
Authentication y Firestore, y **React-Bootstrap** para la interfaz
(pensada mobile-first).

## Secciones de la app

Menú de navegación (Offcanvas lateral izquierdo, con botón ☰ arriba):

- **Inicio** (`/`) — Top 10 de cada estilo, entre TODOS los participantes.
  Es la página de inicio para ambos roles. Se puede filtrar por contexto:
  general (todo mezclado), solo prácticas, o un torneo puntual.
- **Marcas** (`/marcas`) — Top 10 de cada estilo, con el mismo filtro de
  contexto (general/práctica/torneo):
  - Atleta: sus propias 10 mejores marcas por estilo.
  - Profesor: elige un atleta y ve sus 10 mejores marcas por estilo.
- **Torneos** (`/torneos`) — el profesor crea torneos (nombre, fecha,
  descripción opcional) y puede marcarlos como finalizados; el atleta ve
  los torneos activos y se inscribe o se da de baja. Cada torneo tiene su
  hoja de resultados descargable/compartible. Ver más abajo.
- **Postas** (`/postas`) — competencias por equipos (relevos). El profesor
  crea la posta, arma los equipos y usa un cronómetro dedicado para tomar
  los tiempos tramo por tramo. El atleta se inscribe y el profesor lo
  asigna a un equipo. Cada posta tiene su propia hoja de resultados. Ver
  más abajo.
- **Registrar tiempos** (`/registrar`, solo profesor) — formulario +
  cronómetro, con una barra de acción fija abajo (Iniciar/Detener/Guardar)
  para cronometrar rápido sin perder de vista la pantalla. Antes de elegir
  el participante, el profesor elige el **contexto**: "Práctica" o uno de
  los torneos activos — si elige un torneo, el selector de participante se
  filtra solo a los atletas inscriptos en ese torneo. Desde "Últimos
  registros" se puede eliminar un tiempo cargado por error (🗑). Si el
  tiempo guardado supera la mejor marca previa del atleta en ese
  estilo/distancia (sin importar el contexto), se marca como récord (🏆),
  se muestra un aviso destacado al profesor, y se genera una notificación
  in-app para el atleta.
- **Mi historial** (`/historial`, solo atleta) — mejor marca por estilo y el
  historial completo de tiempos, incluyendo de qué torneo (o "Práctica")
  es cada uno.
- **Configuración** (`/configuracion`, solo profesor) — dos pestañas para
  administrar sin tocar código: **Estilos** y **Distancias**, disponibles en
  el formulario de registro de tiempos.

Los atletas ven una campana 🔔 en el menú con las notificaciones de récord
personal. Es una notificación **dentro de la app** (no un push del sistema
operativo); para eso haría falta sumar Firebase Cloud Messaging.

### Torneos

Un torneo es simplemente una etiqueta con la que se agrupan tiempos:
permite diferenciar "esto se nadó en tal torneo" de "esto fue una práctica
normal". El flujo es:

1. El profesor crea el torneo desde `/torneos` (nombre, fecha, descripción
   opcional). Queda "Activo" por defecto.
2. Los atletas entran a `/torneos` y tocan "Inscribirme" en los que les
   interesen. Pueden darse de baja mientras el torneo siga activo.
3. Al registrar tiempos, el profesor elige ese torneo como contexto, y el
   selector de participante muestra solo a los inscriptos.
4. El profesor puede marcar el torneo como "Finalizado" cuando termina —
   deja de aparecer como opción para cargar tiempos nuevos, pero los
   tiempos ya cargados y las estadísticas siguen intactos.

Los tiempos guardan tanto el `torneoId` (o `null` si fue una práctica)
como una copia del nombre del torneo al momento de guardarlo, así que si
más adelante se edita o elimina el torneo, el historial no se rompe.

### Hoja de resultados

Desde cada torneo (link "Ver hoja de resultados" en su tarjeta, visible
para profesor y atleta) se accede a `/torneos/:id/resultados`: todos los
tiempos de ese torneo agrupados por estilo y distancia, ordenados de más
rápido a más lento. Ahí hay tres acciones:

- **Descargar PDF** — genera el PDF en el momento, en el propio navegador
  (con `jsPDF` + `jspdf-autotable`), sin backend ni servicio externo.
- **Compartir** — usa la Web Share API del navegador (el mismo selector
  nativo que usa cualquier app del celular) para mandar el PDF directo por
  WhatsApp, mail, etc. Si el navegador no la soporta (típicamente en
  escritorio), descarga el PDF directamente como alternativa.
- **Imprimir** — usa la función nativa de impresión del navegador; hay una
  hoja de estilos aparte (`@media print` en `custom.css`) que oculta el
  menú y los botones, y fuerza fondo blanco/texto negro para que no gaste
  tinta imprimiendo el tema oscuro de la app.

### Postas

Una posta es una competencia por equipos: cada equipo nada la distancia
total en tramos, turnándose entre sus integrantes. Tiene dos parámetros:

- **Distancia por tramo** — cuánto nada cada integrante por turno (ej. 50 m).
- **Largo total**, que puede ser de dos tipos:
  - **Por distancia** (ej. 500 m): gana el equipo que complete esa
    distancia en **menos tiempo**.
  - **Por tiempo** (ej. 20 min): gana el equipo que recorra **más
    distancia** dentro de ese tiempo.

Flujo completo:

1. El profesor crea la posta desde `/postas` (nombre, fecha, distancia por
   tramo, tipo y valor del largo total, descripción opcional).
2. Los atletas se inscriben tocando "Inscribirme" en la posta (igual que en
   un torneo).
3. El profesor entra a "Gestionar equipos" y arma los equipos: crea cada
   equipo (nombre) y le agrega integrantes de la lista de inscriptos
   (mínimo 2). El orden en que aparecen ahí es solo para organizarse — el
   orden real en que nadan **se decide en el momento**, no queda fijo de
   antemano.
4. El atleta ve en su tarjeta de la posta a qué equipo quedó asignado.
5. El profesor usa "Cronómetro" para tomar los tiempos: elige el equipo,
   y por cada tramo elige **quién nada ese tramo** (cualquier integrante,
   se puede repetir), toca "Iniciar tramo", y cuando ese nadador completa
   la distancia toca "Marcar llegada" — ese tramo queda guardado y vuelve
   a preguntar quién sigue. Así hasta que:
   - **Postas por distancia**: se corta sola al completar la cantidad de
     tramos necesaria para llegar al total.
   - **Postas por tiempo**: el profesor corta manualmente con "Finalizar
     posta" cuando se cumple el tiempo objetivo (se muestra un contador en
     vivo comparando contra el objetivo, a modo de referencia).
6. Al finalizar, el resultado del equipo (tiempo total o distancia total,
   según el tipo) queda guardado, y desde "Ver resultados" se accede a la
   hoja de resultados de la posta: clasificación general de los equipos
   (con podio 🥇🥈🥉) y el detalle tramo por tramo de cada uno — con las
   mismas opciones de **Descargar PDF**, **Compartir** e **Imprimir** que
   los torneos.

Un equipo puede correr la posta más de una vez (por ejemplo, para
practicar y volver a intentarlo); el ranking usa siempre su mejor
resultado.

## 1. Crear el proyecto en Firebase

1. Ve a https://console.firebase.google.com y crea un proyecto nuevo.
2. En **Compilación > Authentication > Sign-in method**, habilita:
   - **Correo electrónico/contraseña**
   - **Google**
   - **Facebook** (necesitas un App ID y App Secret de https://developers.facebook.com;
     Firebase te da la URL de redirección que debes pegar en la configuración
     de tu app de Facebook).
3. En **Compilación > Firestore Database**, crea la base de datos (modo producción).
4. En **Configuración del proyecto > Tus apps**, crea una app web y copia
   las credenciales (`apiKey`, `authDomain`, etc.).

## 2. Configurar el proyecto local

```bash
npm install
cp .env.example .env
```

Pega las credenciales de Firebase en `.env`.

## 3. Reglas de Firestore e índices

El proyecto incluye `firestore.rules` y `firestore.indexes.json` listos
para desplegar con Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # selecciona tu proyecto
firebase deploy --only firestore:rules,firestore:indexes
```

Si preferís no usar la CLI, podés copiar el contenido de `firestore.rules`
directamente en **Firestore > Reglas** desde la consola. Los índices
también se pueden crear a mano desde **Firestore > Índices**, o dejar que
Firestore te los proponga: la primera vez que corras una consulta que los
necesite, va a tirar un error en la consola del navegador con un link
directo para crear ese índice con un clic.

Los índices compuestos que usa la app son:

- `times`: `recordedBy` + `date` (historial reciente del profesor)
- `times`: `athleteId` + `date` (historial del atleta)
- `times`: `estilo` + `distancia` + `timeMs` (ranking global)
- `times`: `athleteId` + `estilo` + `distancia` + `timeMs` (marcas por atleta)
- `times`: `torneoId` + `estilo` + `distancia` + `timeMs` (ranking filtrado por torneo/práctica)
- `times`: `torneoId` + `athleteId` + `estilo` + `distancia` + `timeMs` (marcas filtradas por torneo/práctica)
- `torneos`: `activo` + `fecha` (lista de torneos activos, ordenados)
- `estilos`: `active` + `order` (lista de estilos activos, ordenada)
- `distancias`: `active` + `value` (lista de distancias activas, ordenadas numéricamente)
- `notifications`: `userId` + `createdAtIso` (campana de notificaciones del atleta)

## 4. Ejecutar en desarrollo

```bash
npm run dev
```

## 5. Dominios autorizados para login social

En **Authentication > Settings > Authorized domains**, agrega el dominio
donde vayas a desplegar la app (por ejemplo `localhost` ya viene por
defecto, y deberás agregar tu dominio de producción cuando despliegues).

## Estructura de datos en Firestore

**Colección `users`** (id del documento = uid de Firebase Auth):
```
{
  fullName: string,
  age: number,
  sex: "femenino" | "masculino" | "otro",
  role: "profesor" | "atleta",
  email: string,
  createdAt: timestamp
}
```

**Colección `estilos`** (administrable desde la app, por un profesor):
```
{
  label: string,     // ej. "Libre"
  order: number,     // define el orden en que aparecen
  active: boolean    // los inactivos no aparecen como opción al registrar tiempos
}
```

**Colección `distancias`** (administrable desde la app, por un profesor):
```
{
  value: number,      // metros, ej. 50
  active: boolean     // las inactivas no aparecen como opción al registrar tiempos
}
```
Se ordenan siempre de menor a mayor por `value`, así que no hace falta un
campo de orden manual como en `estilos`.

**Colección `times`**:
```
{
  athleteId: string,     // uid del atleta
  athleteName: string,   // copia del nombre al momento de guardar
  estilo: string,        // id del documento en "estilos"
  estiloLabel: string,   // copia del nombre del estilo al momento de guardar
  distancia: number,     // 50, 100, 200, 400
  timeMs: number,
  date: string (ISO),
  recordedBy: string,    // uid del profesor
  isRecord: boolean,     // true si fue un nuevo récord personal al guardarlo
  torneoId: string | null,     // id del documento en "torneos", o null si fue una práctica
  torneoNombre: string | null, // copia del nombre del torneo al momento de guardar (o null)
  createdAt: timestamp
}
```

**Colección `torneos`** (creada y administrada por un profesor):
```
{
  nombre: string,
  fecha: string (ISO date, ej. "2026-08-15"),
  descripcion: string,   // opcional
  activo: boolean,       // los finalizados no aparecen como opción al registrar tiempos nuevos
  createdAt: timestamp
}
```

**Subcolección `torneos/{torneoId}/inscripciones/{athleteId}`**:
```
{
  athleteName: string,
  inscribedAt: string (ISO)
}
```
El id del documento es el uid del atleta, así que inscribirse/darse de
baja es simplemente crear o borrar ese documento puntual.

**Colección `postas`** (creada y administrada por un profesor):
```
{
  nombre: string,
  fecha: string (ISO date),
  distanciaTramo: number,    // metros que nada cada integrante por turno
  tipoLargo: "distancia" | "tiempo",
  valorLargo: number,        // metros totales (si "distancia") o minutos (si "tiempo")
  descripcion: string,       // opcional
  activo: boolean,
  createdAt: timestamp
}
```

**Subcolección `postas/{postaId}/inscripciones/{athleteId}`**: igual que
en torneos — el atleta expresa interés en participar. El id del
documento es el uid del atleta.

**Subcolección `postas/{postaId}/equipos/{equipoId}`** (creada y
administrada por un profesor):
```
{
  nombre: string,
  integrantes: [
    { athleteId: string, athleteName: string, orden: number }
  ],
  createdAt: timestamp
}
```
`integrantes` es un array simple (no una subcolección) porque lo edita
por completo el profesor desde "Gestionar equipos"; `orden` es solo para
mostrar la lista organizada, no define el orden real en que nadan.

**Subcolección `postas/{postaId}/resultados/{resultadoId}`** (un
documento por cada vez que un equipo corre la posta):
```
{
  equipoId: string,
  equipoNombre: string,       // copia del nombre al momento de guardar
  tramos: [
    { orden: number, athleteId: string, athleteName: string, tiempoMs: number, acumuladoMs: number }
  ],
  totalTimeMs: number,        // tiempo total (suma de los tramos)
  totalDistancia: number,     // tramos.length × distanciaTramo
  distanciaTramo: number,     // copia de la posta al momento de guardar
  tipoLargo: string,          // copia de la posta al momento de guardar
  valorLargo: number,         // copia de la posta al momento de guardar
  recordedBy: string,         // uid del profesor
  date: string (ISO),
  createdAt: timestamp
}
```
El ranking de la hoja de resultados usa `totalTimeMs` (menor gana) para
postas por distancia, o `totalDistancia` (mayor gana) para postas por
tiempo — ver `tipoLargo`.

**Colección `notifications`**:
```
{
  userId: string,         // uid del atleta que recibe la notificación
  type: "record",
  message: string,
  estilo: string,
  estiloLabel: string,
  distancia: number,
  timeMs: number,
  read: boolean,
  createdAtIso: string (ISO)
}
```

Solo un profesor puede crear notificaciones (ver `firestore.rules`); cada
atleta solo puede leer y marcar como leídas las suyas.

`athleteName` y `estiloLabel` quedan "congelados" en cada registro para que
el historial y los rankings sigan siendo correctos aunque después se
renombre, desactive o elimine un estilo, o cambie el nombre de un atleta.

## PWA — instalar en el celular

La app está configurada como Progressive Web App con `vite-plugin-pwa`:
genera el `manifest.webmanifest`, el service worker, y ya incluye los
íconos en `public/icons/` (192, 512, versiones "maskable" para Android, y
`apple-touch-icon` para iOS), generados a partir del logo de Aqua Metrics.

También están en `public/`:
- `logo-mark.png` — solo la marca (gota + nadador + velocímetro), con
  fondo transparente. Es la que se usa en el menú y en las pantallas de
  login/registro, porque funciona sobre cualquier fondo.
- `logo-full.png` — el logo completo con el texto "AQUA METRICS" y el
  tagline, recortado del arte original. **No se usa en la interfaz actual**
  porque el texto está en azul marino oscuro y no se lee sobre el fondo
  oscuro de la app; queda disponible como asset por si hace falta en algún
  contexto con fondo claro (por ejemplo, un PDF exportado o un email).

El archivo original en alta resolución (tal cual se subió, sin recortar)
queda guardado en `design-assets/logo-original.png` — no se sirve en la
app ni se cachea con el service worker, es solo para volver a generar
íconos si hace falta más adelante.

### Probarla localmente

El service worker **no se activa en modo desarrollo** (`npm run dev`).
Para probar la instalación necesitás una build de producción:

```bash
npm run build
npm run preview
```

Y abrir la URL que te muestre `preview` desde el celular (en la misma red)
o desde Chrome DevTools en modo responsive.

### Requisito: HTTPS

Los navegadores solo permiten instalar una PWA servida por **HTTPS**
(`localhost` es la única excepción). Cuando despliegues a producción
(Vercel, Netlify, Firebase Hosting, etc.), el certificado HTTPS viene
incluido por defecto en todas esas plataformas.

### Cómo se instala

- **Android / Chrome**: aparece un banner o el botón "Instalar app" en el
  menú (⋮). Se agrega un ícono a la pantalla de inicio y abre en modo
  standalone (sin la barra del navegador).
- **iPhone / Safari**: no hay banner automático. Hay que abrir el sitio en
  Safari → botón compartir (□↑) → **"Agregar a pantalla de inicio"**. Por
  eso el `index.html` incluye las etiquetas `apple-touch-icon` y
  `apple-mobile-web-app-*`, que son las que Safari usa en este flujo manual.

### Actualizaciones

`registerType: "autoUpdate"` hace que, cuando publiques una nueva versión,
el service worker se actualice solo en segundo plano y se aplique la
próxima vez que se abra la app — sin que el profesor o el atleta tengan
que reinstalar nada.

### Una limitación a tener en cuenta

El service worker cachea el "app shell" (HTML/JS/CSS/íconos) para que la
app cargue rápido y sea instalable, **no** los datos de Firestore. Si el
celular está sin conexión, la app va a abrir (gracias al caché), pero el
cronómetro, los rankings y el registro de tiempos van a necesitar
conexión para leer o guardar en Firestore. Si más adelante querés que
funcione realmente sin conexión (por ejemplo, cronometrar en una pileta
sin señal y sincronizar después), se puede sumar la persistencia offline
de Firestore — es un cambio aparte, avisame si te interesa.

### Login social: popup en navegador, redirect solo instalada

El login con Google/Facebook usa `signInWithPopup` cuando la app corre en
una pestaña normal del navegador, y `signInWithRedirect` únicamente cuando
corre instalada (modo standalone).

¿Por qué no redirect siempre? `signInWithRedirect` depende de que el
navegador comparta almacenamiento entre tu dominio y el dominio de
autenticación de Firebase (`*.firebaseapp.com`) durante la ida y vuelta a
Google/Facebook. Varios navegadores modernos (Chrome, Safari) bloquean ese
almacenamiento entre sitios por privacidad, lo que hace que el login
falle **en silencio** (sin ningún error visible) en una pestaña normal: la
persona da los permisos en Google, vuelve al sitio, y queda como si nunca
hubiera iniciado sesión. El popup no tiene ese problema porque se
comunica directo con la pestaña que lo abrió, sin depender de ese
almacenamiento compartido — por eso es el método por defecto.

Si en algún momento el login por redirect (modo instalado) da el mismo
problema, la solución definitiva de Firebase es configurar un `authDomain`
propio, en el mismo dominio que tu app (vía Firebase Hosting), en vez del
`*.firebaseapp.com` por defecto — así todo el flujo queda en el mismo
sitio y deja de depender de almacenamiento entre dominios. Más info:
https://firebase.google.com/docs/auth/web/redirect-best-practices

## Nota sobre Instagram

Firebase Authentication no incluye un proveedor nativo de Instagram (solo
Google, Facebook, Apple, correo/contraseña, teléfono, etc.). Implementar
"Iniciar sesión con Instagram" de verdad requiere un backend propio que
haga el intercambio de tokens con la API de Meta — no es algo que se pueda
resolver solo desde el frontend. Si más adelante lo necesitas, se puede
armar como una función de Cloud Functions que maneje ese flujo por
separado.
