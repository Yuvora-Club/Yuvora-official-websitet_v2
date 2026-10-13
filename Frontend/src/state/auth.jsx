// Auth state for the Yuvora event system. Wraps `authService` (mock) so
// components re-render on sign-in / sign-out. Swap the service, not this.

import { useSyncExternalStore } from "react";
import { authSnapshot, getSessionUser, subscribeAuth } from "../services/authService.js";
import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  const version = useSyncExternalStore(subscribeAuth, authSnapshot, authSnapshot);
  void version;
  const user = getSessionUser();
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}
