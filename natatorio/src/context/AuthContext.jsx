import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, facebookProvider } from "../firebase";

// signInWithRedirect necesita que el navegador comparta almacenamiento entre
// tu dominio y el dominio de autenticación de Firebase (*.firebaseapp.com)
// durante la ida y vuelta a Google/Facebook. Varios navegadores modernos
// bloquean eso por privacidad, lo que hace que el redirect falle en
// silencio (sin error) en una pestaña normal. El popup no tiene ese
// problema porque se comunica directo con la pestaña que lo abrió.
// Por eso usamos popup en el navegador normal, y redirect solo cuando la
// app corre instalada (modo standalone), que es el único caso donde el
// popup puede fallar.
function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true
  );
}

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // objeto de Firebase Auth
  const [profile, setProfile] = useState(null); // documento en Firestore: rol, edad, sexo, nombre
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false); // true si el usuario existe en Auth pero no tiene doc de perfil (típico tras login con Google/Facebook la primera vez)
  const [redirectError, setRedirectError] = useState("");
  const [redirectPending, setRedirectPending] = useState(true); // true mientras se resuelve la vuelta del redirect de Google/Facebook

  // Al volver de signInWithRedirect (Google/Facebook), Firebase completa el
  // login leyendo el resultado guardado en el propio navegador. Hay que
  // consumirlo una vez al cargar la app; onAuthStateChanged de abajo se
  // encarga de reflejar el usuario ya autenticado.
  useEffect(() => {
    getRedirectResult(auth)
      .catch((err) => {
        setRedirectError(err.code || "auth/unknown-error");
      })
      .finally(() => {
        setRedirectPending(false);
      });
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          setProfile(snap.data());
          setNeedsProfile(false);
        } else {
          setProfile(null);
          setNeedsProfile(true);
        }
      } else {
        setProfile(null);
        setNeedsProfile(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Registro con email y contraseña, incluyendo datos de perfil desde el inicio
  async function registerWithEmail({ email, password, fullName, age, sex, role }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: fullName });
    await saveProfile(cred.user.uid, { fullName, age, sex, role, email });
    return cred.user;
  }

  async function loginWithEmail({ email, password }) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  // Popup en navegador normal (más confiable, ver nota arriba); redirect
  // solo en modo standalone/instalada. Con popup, esta función devuelve el
  // usuario ya logueado (podés navegar apenas resuelve). Con redirect, la
  // página se recarga sola al volver, así que no devuelve nada útil acá:
  // el resultado se procesa con getRedirectResult + onAuthStateChanged.
  async function loginWithGoogle() {
    if (isStandalonePwa()) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  }

  async function loginWithFacebook() {
    if (isStandalonePwa()) {
      await signInWithRedirect(auth, facebookProvider);
      return null;
    }
    const cred = await signInWithPopup(auth, facebookProvider);
    return cred.user;
  }

  // Se llama después de un primer login social para completar edad/sexo/rol
  async function saveProfile(uid, { fullName, age, sex, role, email }) {
    const data = {
      fullName,
      age: Number(age),
      sex,
      role, // "profesor" | "atleta"
      email,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", uid), data);
    setProfile(data);
    setNeedsProfile(false);
  }

  async function logout() {
    await signOut(auth);
  }

  function clearRedirectError() {
    setRedirectError("");
  }

  const value = {
    user,
    profile,
    loading,
    needsProfile,
    redirectError,
    redirectPending,
    clearRedirectError,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    loginWithFacebook,
    saveProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
