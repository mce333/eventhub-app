import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Nota: Limpiar datos de eventos comentado para permitir persistencia de gastos
// Se deshabilitó para que los gastos registrados persistan entre sesiones
/*
const hasCleanedStorage = sessionStorage.getItem('storage_cleaned');
if (!hasCleanedStorage) {
  localStorage.removeItem('demo_events');
  sessionStorage.setItem('storage_cleaned', 'true');
  console.log('✅ Datos de eventos limpiados');
}
*/

createRoot(document.getElementById("root")!).render(<App />);
