import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Limpiar SOLO datos de eventos al iniciar (pero mantener sesión)
const hasCleanedStorage = sessionStorage.getItem('storage_cleaned');
if (!hasCleanedStorage) {
  localStorage.removeItem('demo_events');
  // NO eliminar demo_users, access_token ni demo_user para mantener sesión
  sessionStorage.setItem('storage_cleaned', 'true');
  console.log('✅ Datos de eventos limpiados');
}

createRoot(document.getElementById("root")!).render(<App />);
