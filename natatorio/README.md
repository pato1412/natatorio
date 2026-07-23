# Carril de Tiempos — App de cronometraje de natación

App con registro/login (Google, Facebook o formulario propio), perfiles de
Profesor y Atleta, cronómetro por estilo/distancia, y panel de mejores
tiempos + historial para cada atleta. Usa Firebase Authentication y
Firestore como base de datos, y **React-Bootstrap** para la interfaz.

## Sobre el diseño responsivo

Toda la interfaz usa componentes de [React-Bootstrap](https://react-bootstrap.github.io/)
(`Container`, `Row`/`Col`, `Card`, `Form`, `Navbar`, `Table`), que ya traen
el sistema de grillas y los *breakpoints* de Bootstrap 5 (`xs`, `sm`, `md`,
`lg`, `xl`). Esto asegura que:

- Los formularios de login/registro se centran y se angostan en pantallas
  chicas (celular) y se ven en columnas más anchas en escritorio.
- Las tarjetas de "mejores tiempos" se acomodan solas: 1 columna en celular,
  2 en tablet, hasta 4 en escritorio (`xs=12 sm=6 md=4 lg=3`).
- La tabla de historial usa `table-responsive`, así que en pantallas
  angostas se puede desplazar horizontalmente en vez de romperse.
- El `Navbar` colapsa correctamente en móvil.

La identidad visual (colores, tipografías, el cronómetro estilo panel
táctil) se agregó encima de Bootstrap mediante `src/custom.css`, sin tocar
el comportamiento responsivo que Bootstrap ya resuelve.

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

## 3. Reglas de Firestore

En **Firestore > Reglas**, usa algo como esto para empezar (ajusta según tus
necesidades de seguridad antes de producción):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }

    match /times/{timeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.recordedBy == request.auth.uid;
      allow update, delete: if request.auth != null
        && resource.data.recordedBy == request.auth.uid;
    }
  }
}
```

Esto permite que cualquier usuario autenticado (profesor o atleta) lea la
lista de atletas y los tiempos, pero solo el profesor que registró un tiempo
puede editarlo o borrarlo. Ajusta esto si quieres reglas más estrictas
(por ejemplo, restringir la lectura de `users` solo a profesores).

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

**Colección `times`**:
```
{
  athleteId: string,   // uid del atleta
  estilo: "libre" | "espalda" | "pecho" | "mariposa" | "combinado",
  distancia: number,   // 50, 100, 200, 400
  timeMs: number,
  date: string (ISO),
  recordedBy: string,  // uid del profesor
  createdAt: timestamp
}
```

## Nota sobre Instagram

Firebase Authentication no incluye un proveedor nativo de Instagram (solo
Google, Facebook, Apple, correo/contraseña, teléfono, etc.). Implementar
"Iniciar sesión con Instagram" de verdad requiere un backend propio que
haga el intercambio de tokens con la API de Meta — no es algo que se pueda
resolver solo desde el frontend. Si más adelante lo necesitas, se puede
armar como una función de Cloud Functions que maneje ese flujo por
separado.
