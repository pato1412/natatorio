# Carril de Tiempos — App de cronometraje de natación

App con registro/login (Google, Facebook o formulario propio), perfiles de
Profesor y Atleta, cronómetro por estilo/distancia, rankings, mejores marcas
e historial. Usa Firebase Authentication y Firestore, y **React-Bootstrap**
para la interfaz (pensada mobile-first).

## Secciones de la app

Menú de navegación (arriba, colapsable en mobile):

- **Inicio** (`/`) — Top 10 de cada estilo, entre TODOS los participantes.
  Es la página de inicio para ambos roles.
- **Marcas** (`/marcas`) — Top 10 de cada estilo:
  - Atleta: sus propias 10 mejores marcas por estilo.
  - Profesor: elige un atleta y ve sus 10 mejores marcas por estilo.
- **Registrar tiempos** (`/registrar`, solo profesor) — formulario +
  cronómetro, con una barra de acción fija abajo (Iniciar/Detener/Guardar)
  para cronometrar rápido sin perder de vista la pantalla. Desde "Últimos
  registros" se puede eliminar un tiempo cargado por error (🗑). Si el
  tiempo guardado supera la mejor marca previa del atleta en ese
  estilo/distancia, se marca como récord (🏆), se muestra un aviso
  destacado al profesor, y se genera una notificación in-app para el
  atleta.
- **Mi historial** (`/historial`, solo atleta) — mejor marca por estilo y el
  historial completo de tiempos.
- **Administrar estilos** (`/estilos`, solo profesor) — alta/baja de los
  estilos de nado disponibles en el formulario (ver más abajo).

Los atletas ven una campana 🔔 en el menú con las notificaciones de récord
personal. Es una notificación **dentro de la app** (no un push del sistema
operativo); para eso haría falta sumar Firebase Cloud Messaging.

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
- `estilos`: `active` + `order` (lista de estilos activos, ordenada)
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
  createdAt: timestamp
}
```

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

## Nota sobre Instagram

Firebase Authentication no incluye un proveedor nativo de Instagram (solo
Google, Facebook, Apple, correo/contraseña, teléfono, etc.). Implementar
"Iniciar sesión con Instagram" de verdad requiere un backend propio que
haga el intercambio de tokens con la API de Meta — no es algo que se pueda
resolver solo desde el frontend. Si más adelante lo necesitas, se puede
armar como una función de Cloud Functions que maneje ese flujo por
separado.
