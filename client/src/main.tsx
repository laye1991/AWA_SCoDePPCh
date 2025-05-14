import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initPWA } from "./lib/pwaUtils";

// Initialiser les fonctionnalités PWA
initPWA();

createRoot(document.getElementById("root")!).render(<App />);
