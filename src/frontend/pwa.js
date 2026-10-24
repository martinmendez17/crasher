// Instalación como app (PWA): registro del service worker y botón "Instalar".

import { useEffect, useState } from "react";

export function registerServiceWorker() {
  // Solo en la versión publicada: en `npm run dev` interferiría con la recarga automática.
  if (!import.meta.env?.PROD || !("serviceWorker" in navigator)) return;
  const register = () => navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register);
}

let deferredPrompt = null;
const listeners = new Set();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    listeners.forEach((fn) => fn());
  });
}

export function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function isIOS() {
  const ua = navigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Estado de instalación: "installed" | "prompt" (Android/escritorio) | "ios" | "manual" */
export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  const status = isStandalone() ? "installed" : deferredPrompt ? "prompt" : isIOS() ? "ios" : "manual";

  const install = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    force((n) => n + 1);
    return outcome === "accepted";
  };

  return { status, install };
}
