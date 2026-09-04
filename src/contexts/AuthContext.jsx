import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, setPersistence, browserSessionPersistence, signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { getCustomer, logoutCustomer } from "../services/customerService";

const AuthContext = createContext(null);

const clearCustomerState = () => {
  localStorage.clear();
  sessionStorage.clear();
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
        clearCustomerState();
      }
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    sessionStorage.removeItem("otpVerified");
    sessionStorage.removeItem("loginOTP");
    sessionStorage.removeItem("loginEmail");
    sessionStorage.removeItem("loginPassword");
    sessionStorage.removeItem("pendingCustomer");
    sessionStorage.removeItem("redirectAfterLogin");
    localStorage.removeItem("guestCartDraft");

    setCustomer(null);
    clearCustomerState();
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