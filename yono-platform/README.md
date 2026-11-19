# GameHub — React + Node starter

Separate public website and admin dashboard, with a shared Express API and MongoDB.

## Requirements
- Node.js 20+
- MongoDB running locally or a MongoDB Atlas connection string

## 1) Backend and first admin account

Open PowerShell in the project folder:
```bash
cd backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Edit `backend/.env` and set:
- `MONGODB_URI` to your local MongoDB or MongoDB Atlas connection string.
- `JWT_SECRET` to a unique, random secret.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` for your admin login. Use a password with at least 12 characters.

Then start the API in one terminal:
```bash
npm install
npm run dev
```

In another terminal, create (or reset) the admin account:
```bash
cd backend
npm run create-admin
```

## 2) Public website
```bash
cd website
npm install
npm run dev
```
Open http://localhost:5173

## 3) Admin dashboard (separate app)
```bash
cd admin
npm install
npm run dev
```
Open http://localhost:5174 and sign in using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend/.env`.

To add a game, select **Add new game**, enter its name and listing details, optionally upload a thumbnail/APK or provide an HTTPS download/referral link, then choose **Published** to show it on the public website. Draft listings stay hidden. You can edit or delete games from the dashboard.

## Notes
- Uploaded APKs are stored in `backend/assets/uploads`; thumbnails in `backend/assets/thumbnails`.
- The admin can add, edit, publish/unpublish and delete listings.
- An uploaded APK downloads directly; a saved official referral URL opens separately. Clicks are counted, but a click is not proof of an install or sign-up.
- Login/sign-up attribution must be provided by the game operator's approved referral system or SDK. This site cannot confirm an install or login on its own.
- Only upload APKs you own or are explicitly authorised to distribute. Verify publisher, signature, checksum, permissions and malware scan before publishing.
- Do not list real-money gambling or betting apps where prohibited. Check applicable Indian central/state laws, platform policies and age restrictions before publishing. This starter intentionally does not implement deposits, wallets, betting, payouts or claims of guaranteed earnings.

## Production checklist
- Set a long random JWT_SECRET and strong admin password.
- Serve behind HTTPS; set `FRONTEND_ORIGINS` to the comma-separated website and admin origins.
- Put uploads on persistent storage and configure backups.
- Add rate limiting, audit logs, malware scanning and file-size limits suitable for your hosting.
- Add privacy policy, terms, contact details and appropriate age/location notices.
