import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeSampleEvents } from "./lib/mockData";

// Inicializar eventos de ejemplo solo la primera vez
initializeSampleEvents();

createRoot(document.getElementById("root")!).render(<App />);
