# AJ Courier Logistics — Web app (frontend)

Vite + React 19 + react-router SPA. Talks to the API (`../backend`, deployed to
Render) via `VITE_API_URL`, authenticating with a Bearer token kept in
`localStorage`.

## Local development

```bash
npm install
cp .env.example .env           # set VITE_API_URL=http://localhost:4000 and the VITE_* keys
npm run dev                     # http://localhost:5173
```

The backend must be running (`cd ../backend && npm run dev`).

## Build & deploy — Linux shared hosting (FTP / cPanel)

```bash
# set the production values first (baked in at build time):
#   VITE_API_URL=https://<app>.onrender.com
#   VITE_GOOGLE_MAPS_API_KEY=...
#   VITE_PAYSTACK_PUBLIC_KEY=...
#   VITE_PAYSTACK_CURRENCY=NGN
npm ci
npm run build                  # → dist/
```

Upload the **contents of `dist/`** (including `.htaccess`) to `public_html/`.
`.htaccess` handles SPA history-API routing. Rebuild + re-upload whenever a
`VITE_*` value changes.

- Deploying to a subfolder instead of the domain root: set Vite `base: '/path/'`
  in `vite.config.ts` and change `RewriteBase` in `public/.htaccess` to match.
- Google Cloud → the browser Maps key → **Websites** restriction → add
  `https://<domain>/*` (keep `http://localhost:5173/*` for dev).

## Routes

`/` `/contact` `/privacy` `/terms` · `/login` `/signup` `/forgot-password`
`/reset-password` · `/book` `/book/payment/callback` `/book/mock-pay` ·
`/dashboard` `/dashboard/bookings` `/dashboard/bookings/:reference` ·
`/admin/login` `/admin` `/admin/bookings` `/admin/bookings/:reference`
`/admin/vehicles` · `/offline` · `*` (404)
