# Volley Sketch

Client-side volleyball sketch board built with React and Vite. It supports full-court and half-court views, draggable player markers, freehand drawing with pen and eraser tools, and persistent state through `localStorage`.

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open the local URL shown by Vite.

## Build for production

```bash
npm run build
```

To preview the production bundle locally:

```bash
npm run preview
```

## Deploy to GitHub Pages

This project is configured for GitHub Pages project-site deployment.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Make sure GitHub Pages is set to deploy from the `gh-pages` branch in your repository settings.

3. Build and publish:

   ```bash
   npm run deploy
   ```

### About the Vite `base` setting

- Vite needs a `base` path so assets load correctly on GitHub Pages.
- This project reads the base path from `VITE_BASE_PATH`.
- `.env.production` currently sets:

  ```bash
  VITE_BASE_PATH=/
  ```

- For a custom domain such as `volleysketch.volei.pt`, keep `VITE_BASE_PATH=/`.
- If you are deploying to the default GitHub Pages project URL instead of a custom domain, update `.env.production` to match the repository path. For example, if the repo is named `my-volley-board`, set:

  ```bash
  VITE_BASE_PATH=/my-volley-board/
  ```

## Local storage persistence

The app stores everything in browser `localStorage` under the key `volley-sketch-state-v1`.

Saved data includes:

- selected court mode
- placed marker instances and positions for full court and half court
- drawing strokes for full court and half court
- active drawing tool, color, and line thickness

The drawing layer is saved as normalized stroke data instead of a fixed-size image, so sketches redraw cleanly when the court resizes.

## Project structure

```text
.
├── .env.production
├── index.html
├── package.json
├── vite.config.js
└── src
    ├── App.jsx
    ├── constants.js
    ├── index.css
    ├── main.jsx
    ├── components
    │   ├── CourtBoard.jsx
    │   ├── CourtSvg.jsx
    │   ├── MarkerSidebar.jsx
    │   ├── PlayerMarker.jsx
    │   └── Toolbar.jsx
    └── utils
        ├── geometry.js
        └── storage.js
```

## Notes

- The app is fully client-side and requires no backend.
- Marker coordinates and drawing points are percentage-based, so they stay aligned as the court scales across desktop and mobile layouts.
- Full-court and half-court modes each keep their own saved layout and sketch data.
