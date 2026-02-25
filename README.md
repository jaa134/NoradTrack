# NoradTrack

View objects in orbit on an interactive map or globe.

---

## Features

- Search by NORAD ID or name and select multiple objects.
- Live position updates using OMM data.
- Map and 3D globe views with click-to-focus details.
- Configurable skins for map and globe views
- Quick zoom controls and fit-to-screen support.
- State managment and persistence with Pinia
- Flyover predictions of space objects
- Configurable geojson overlay for countries

---

## 📱 Platform Support

The website is built to support multiple targets:

- **Desktop**
- **Mobile**

---

## Data sources

- Object metadata and OMMs from Celestrak.
- Map tiles from NASA GIBS (Blue Marble shaded relief).

---

## Tech

- Vue 3 + Vite + TypeScript
- OpenLayers (map) and globe.gl/three.js (globe)
- satellite.js for OMM propagation
- Pinia for state

---

## Code Quality & Tooling

- **ESLint** for JavaScript/TypeScript and Vue rules
- **Stylelint** for CSS
- **Prettier** for formatting
- **Commitlint** to enforce conventional commits
- **Husky + lint-staged** to run checks before commits

---

## Setup

Requires Node `>=22.12.0 <23`.

```bash
npm install
npm run dev
```

---

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - build for production
- `npm run preview` - preview the production build
- `npm run lint` - run eslint + stylelint
- `npm run format` - run prettier
