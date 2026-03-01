import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export const useOptionalAuth = () => useContext(AuthContext);

export const useAuth = () => {
  const context = useOptionalAuth();

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
