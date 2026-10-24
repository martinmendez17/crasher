import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DataProvider } from "./store.jsx";
import { App } from "./App.jsx";
import { registerServiceWorker } from "./pwa.js";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/pages.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DataProvider>
      <App />
    </DataProvider>
  </StrictMode>,
);

registerServiceWorker();
