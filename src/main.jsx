/*
 * main.jsx — Vite entry. Mounts the React tree and imports global styles.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
    throw new Error("#root element missing from index.html");
}

createRoot(rootEl).render(
    <StrictMode>
        <App />
    </StrictMode>
);
