// Shared AuthContext object (own file so fast refresh stays quiet).
import { createContext } from "react";

export const AuthContext = createContext(null);
