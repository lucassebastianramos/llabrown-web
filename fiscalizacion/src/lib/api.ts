// Centralized API base and URL helper
export const API_BASE = (import.meta as any).env?.VITE_API_URL
  ? String((import.meta as any).env.VITE_API_URL).replace(/\/$/, "")
  : (import.meta as any).env?.PROD
    ? "/fiscalizacion-api"
    : "";

export const apiUrl = (path: string) => `${API_BASE}${path}`;
