// useAuth hook (kept separate so auth.jsx exports only the provider for
// fast refresh). Reads the AuthContext, falling back to the session store.

import { useContext } from "react";
import { AuthContext } from "./authContext.js";
import { getSessionUser } from "../services/authService.js";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) return { user: getSessionUser() };
  return ctx;
}
