import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, setPersistence, browserSessionPersistence, signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { getCustomer, logoutCustomer } from "../services/customerService";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEYS = [
  "otpVerified",
  "loginOTP",
  "loginEmail",
  "loginPassword",
  "pendingCustomer",
  "redirectAfterLogin",
  "guestCartDraft",
];

const clearAuthState = () => {
  AUTH_STORAGE_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPersistence(auth, browserSessionPersistence).catch(() => {
      // ignore persistence setup failures and continue with default Firebase behavior
    });

    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const data = await getCustomer(fbUser.uid);
        setCustomer(data || null);
      } else {
        setCustomer(null);
        clearAuthState();
      }
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    clearAuthState();
    setCustomer(null);

    await signOut(auth);
    await logoutCustomer();
  };

  return (
    <AuthContext.Provider value={{ customer, setCustomer, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);