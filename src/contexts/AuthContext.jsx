import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { getCustomer, logoutCustomer } from "../services/customerService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const data = await getCustomer(fbUser.uid);
        setCustomer(data || null);
      } else {
        setCustomer(null);
      }
      setLoading(false);
    });
  }, []);

  const logout = async () => { await logoutCustomer(); setCustomer(null); };

  return (
    <AuthContext.Provider value={{ customer, setCustomer, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);