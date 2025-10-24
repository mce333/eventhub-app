import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Limpiar datos de demo al iniciar (solo una vez por sesión)
const hasCleanedStorage = sessionStorage.getItem('storage_cleaned');
if (!hasCleanedStorage) {
  localStorage.removeItem('demo_events');
  localStorage.removeItem('demo_users');
  sessionStorage.setItem('storage_cleaned', 'true');
  console.log('✅ Datos de demo limpiados');
}

createRoot(document.getElementById("root")!).render(<App />);
