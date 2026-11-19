# BreathSafe TV
1. `npm install`
2. `cp .env.example .env` -> set Firebase RTDB URL + path (same DB as website/sensors)
3. Match field names and thresholds in `src/config.js`
4. `npm run dev` -> open the Network URL in the TV browser (or `npm run build && npm run preview`)
Keys: T/Enter = dark/light, F = fullscreen. Set VITE_DEMO=true to test with fake data.
