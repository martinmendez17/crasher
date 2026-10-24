# Crasher

Aplicación web para registrar entrenamientos de fuerza: eliges un modelo de rutina (Push / Pull / Legs, Upper / Lower, Heavy Duty, etc.), lo adaptas a tu gusto y en cada sesión ves lo que hiciste la vez anterior y la meta para superarlo.

👉 **App en vivo:** https://martinmendez17.github.io/crasher/

## Qué hace

- **Modelos de entrenamiento editables:** Push / Pull / Legs, Upper / Lower, Heavy Duty (Mike Mentzer), Full Body, Arnold Split, Weider (un músculo por día) y la rutina original Push / Pull / Arm / Leg. Al elegir uno se crea una copia en *Mis rutinas* y puedes cambiar ejercicios, series, repeticiones y días.
- **Elegir el día según sus músculos:** cada día tiene marcados sus músculos (pecho, espalda, glúteos…), y al agregar ejercicios el catálogo muestra primero los que corresponden.
- **Catálogo de 147 ejercicios:** 104 de la *Enciclopedia de Ejercicios* de Manuel Escalera, cada uno con su video de técnica, más 43 básicos que la enciclopedia no incluye (pecho, dominadas, sentadilla con barra, core…). También puedes crear los tuyos.
- **Sobrecarga progresiva:** la app sugiere la meta de cada serie con *doble progresión*: si llegaste al tope del rango de repeticiones, sube el peso; si no, suma una repetición.
- **Temporizador de descanso**, que arranca al marcar una serie como hecha.
- **Progreso:** gráfico por ejercicio (peso máximo, 1RM estimado o volumen) con línea de tendencia.
- **Volumen efectivo y sobrefatiga:** compara las series semanales de cada músculo con las referencias MV, MEV, MAV y MRV (Renaissance Periodization). Lo hace en tres lugares:
  - en Progreso, con lo que hiciste en los últimos 7 días;
  - en el editor de rutinas, con lo que planificaste;
  - en Entrenar, avisándote si un músculo ya pasó su máximo recuperable esta semana.

  La *Guía de volumen* muestra la tabla completa, con frecuencia, repeticiones y RIR recomendados.
- **Historial**, exportación a **JSON** y **CSV**, e importación de respaldos.
- **Modo claro y oscuro**, con contraste AA en ambos.

Los datos se guardan en el navegador (`localStorage`). Si usabas la versión anterior (un solo `index.html`), tus rutinas e historial se migran solos la primera vez que abres esta versión.

## Cómo correrla en tu computador

Necesitas [Node.js](https://nodejs.org) 18 o superior.

```bash
npm install      # instala React y Vite (solo la primera vez)
npm run dev      # abre la app en http://localhost:5173 y recarga al guardar cambios
npm run build    # genera la versión final en la carpeta dist/
npm run preview  # sirve dist/ para probar la versión final
```

## Publicar en GitHub Pages

El repositorio incluye `.github/workflows/deploy.yml`, que compila y publica la app cada vez que haces `push` a `main`.

1. En GitHub, entra a **Settings → Pages**.
2. En **Source**, elige **GitHub Actions**.
3. Haz `push` a `main`. En la pestaña **Actions** verás la publicación; al terminar, la app queda en la URL de arriba.

## Estructura del proyecto

El código está separado en **backend** (datos y reglas) y **frontend** (interfaz). El frontend nunca toca `localStorage`: todo pasa por la API del backend.

```
index.html                 Página base que carga la app
vite.config.js             Configuración de Vite
public/                    Archivos estáticos (ícono)
src/
├── backend/               ← "Backend": datos y lógica, sin interfaz
│   ├── api.js             API asíncrona: ejercicios, rutinas, sesiones, ajustes, respaldo
│   ├── migration.js       Conversión de datos de la versión anterior
│   ├── storage/
│   │   └── localStore.js  Adaptador de almacenamiento (hoy: localStorage)
│   ├── domain/
│   │   ├── progression.js Metas sugeridas, 1RM estimado, comparación de series
│   │   ├── stats.js       Regresión lineal, series por músculo, resúmenes
│   │   ├── volume.js      Zonas de volumen (MV/MEV/MAV/MRV) y avisos de sobrefatiga
│   │   └── utils.js       Fechas, ids, normalización de nombres
│   └── data/
│       ├── exercises.json Catálogo de ejercicios (con links de video)
│       ├── templates.js   Modelos de entrenamiento
│       ├── volumeLandmarks.js  Tabla de referencia de volumen por músculo
│       └── catalogs.js    Músculos, equipos y patrones de movimiento
└── frontend/              ← "Frontend": interfaz en React
    ├── main.jsx           Punto de entrada
    ├── App.jsx            Layout, navegación y rutas
    ├── router.jsx         Router por hash (#/ruta), compatible con GitHub Pages
    ├── store.jsx          Estado global: carga datos desde la API
    ├── icons.jsx          Íconos SVG
    ├── format.js          Formatos de fechas y números
    ├── components/        Piezas reutilizables (buscador de ejercicios, gráfico, hoja inferior…)
    ├── pages/             Una pantalla por archivo: Entrenar, Rutinas, Ejercicios, Progreso, Historial, Ajustes
    └── styles/            tokens.css (colores y tipografía), base, componentes y pantallas
```

### Agregar un servidor más adelante

Todas las funciones de `src/backend/api.js` devuelven Promesas, igual que una llamada HTTP. Para guardar los datos en un servidor (por ejemplo Node + Express + base de datos, o Supabase), basta con reimplementar ese archivo usando `fetch()`. El frontend no necesita cambios.

### Agregar ejercicios o modelos

- **Ejercicio fijo:** agrega un objeto a `src/backend/data/exercises.json` con `id`, `name`, `muscle` (ver `catalogs.js`), `pattern`, `equipment`, `home` y `video` (link o `null`).
- **Modelo de entrenamiento:** agrega un objeto a `TEMPLATES` en `src/backend/data/templates.js`. Cada ejercicio se escribe como `e("id-del-ejercicio", series, "rango-de-reps")`.

## Tecnologías

- [React 19](https://react.dev) para la interfaz y [Vite](https://vite.dev) para desarrollo y compilación.
- Sin otras dependencias: los íconos, el router y los gráficos están hechos a mano.
- Tipografías Barlow y Barlow Condensed (Google Fonts).

## Créditos

Videos de técnica: *Enciclopedia de Ejercicios*, Manuel Escalera.
