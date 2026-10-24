// Router mínimo basado en el hash de la URL (#/ruta).
// Funciona en GitHub Pages sin configuración del servidor.

import { useEffect, useState } from "react";

export function currentPath() {
  const h = window.location.hash.replace(/^#/, "");
  return h || "/entrenar";
}

export function navigate(path, { replace = false } = {}) {
  const url = "#" + path;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
  window.scrollTo(0, 0);
}

export function usePath() {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const on = () => setPath(currentPath());
    window.addEventListener("hashchange", on);
    window.addEventListener("popstate", on);
    return () => {
      window.removeEventListener("hashchange", on);
      window.removeEventListener("popstate", on);
    };
  }, []);
  return path;
}

/** match("/rutinas/:id", "/rutinas/abc") -> { id: "abc" } | null */
export function match(pattern, path) {
  const p = pattern.split("/").filter(Boolean);
  const a = path.split("?")[0].split("/").filter(Boolean);
  if (p.length !== a.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(":")) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

export function Link({ to, children, ...rest }) {
  return (
    <a
      href={"#" + to}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
