import { createContext, useContext, useEffect, useState, useMemo } from "react";

const AuthContext = createContext(null);

// Exportar el contexto como named export
export { AuthContext };

// Exportar AuthProvider como named export
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // objeto usuario o null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Reemplazar con Appwrite account.get() en F-04
    const cached = localStorage.getItem("demo_user");
    if (cached) setUser(JSON.parse(cached));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // TODO Appwrite: account.createEmailPasswordSession(email, password)
    const demo = { id: "uid_1", email, role: "partner" };
    localStorage.setItem("demo_user", JSON.stringify(demo));
    setUser(demo);
  };

  const logout = async () => {
    // TODO Appwrite: account.deleteSession("current")
    localStorage.removeItem("demo_user");
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
