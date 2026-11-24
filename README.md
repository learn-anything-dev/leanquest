# LeanQuest 🦁

A free, offline home-workout and nutrition coach for weight loss. Bodyweight training at home first, optional equipment, diet- and country-aware
food for your country, calorie + water tracking, and an honest "am I on track?" engine.
Everything runs in the browser; your data stays on your device (export/import a JSON backup in Settings).

## Run it
```
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests for the calculation core
npm run build    # static site in dist/ (installable PWA, works offline)
```

## How the numbers work
- Calories: Mifflin-St Jeor estimate x activity factor; after ~2 weeks of logging the app measures your real burn from intake + weight trend.
- Pace: realistic plan caps the deficit (<= 0.75% body weight/week, <= 25-30% of maintenance, <= 750 kcal). A goal plan can go to the floor, never below
  (1,200 kcal female / 1,500 male / 1,350 unspecified). Under-18, pregnant or eating-disorder history => maintenance only.
- Projection is dynamic (maintenance is recomputed as weight falls), not the static 7,700 kcal/kg rule.
- Weight status compares a smoothed trend with the plan: ahead / on track / slightly behind / behind.
- Protein 1.6 g/kg of adjusted body weight (min 1.2). Water 30 ml/kg (+15% hot climate).
- Nutrient values are estimates (USDA FoodData Central, FNRI PhilFCT); prices are rough and editable in the app.

## Add things
- **A country**: copy `src/data/regions/ph.ts`, change foods/prices/currency, register it in `src/data/regions/index.ts`.
- **An exercise**: add it to its pattern ladder in `src/data/exercises.ts` (easiest -> hardest); set `equip` to `home` or `gym` for gear-based moves.
- **A badge/quest**: `src/core/gamify.ts`.

## Deploy
Push to `main`; `.github/workflows/deploy.yml` builds and publishes to GitHub Pages
(Settings -> Pages -> Source: GitHub Actions).

Not medical advice.
