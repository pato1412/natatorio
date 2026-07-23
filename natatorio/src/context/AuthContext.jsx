import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, facebookProvider } from "../firebase";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // objeto de Firebase Auth
  const [profile, setProfile] = useState(null); // documento en Firestore: rol, edad, sexo, nombre
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false); // true si el usuario existe en Auth pero no tiene doc de perfil (típico tras login con Google/Facebook la primera vez)

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

  async function loginWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  }

  async function loginWithFacebook() {
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

  const value = {
    user,
    profile,
    loading,
    needsProfile,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    loginWithFacebook,
    saveProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
