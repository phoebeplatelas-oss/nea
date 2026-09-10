# Cycle Tracker — click-through prototype

A visual-only prototype: every page is real React, but there's no backend and
no calculations — buttons, toggles and calendar colors are just fixed data
you can edit in `src/data.js`.

## Run it

```
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173).

## Structure

```
src/
  theme.js          colors + font import
  data.js           all the placeholder content (edit this to change text/values)
  components/       small reusable pieces (buttons, toggles, chips, charts…)
  pages/            one file per screen
  App.jsx           just holds "which page is active" and renders it
  main.jsx          Vite/React entry point
```
