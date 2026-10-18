# GrowCode

GrowCode is a developer community platform with a web product and a mobile client.

## Repository layout

- `GroCodeWebsite/` — canonical Next.js web application, API routes, Prisma schema, authentication, feed, mentorship, collaboration, chat, notifications and administration.
- `GroCodeApp/` — Expo/React Native mobile client consuming the web API.
- `CHECKLIST.md` — web product implementation checklist.
- `CHECKLIST_APP.md` — mobile implementation checklist.

The old Next.js project files that previously lived at the repository root are not part of the active architecture. New web work belongs in `GroCodeWebsite/`; mobile work belongs in `GroCodeApp/`.

## Local development

### Web

```powershell
Set-Location .\GroCodeWebsite
npm install
npm run dev
```

### Mobile

```powershell
Set-Location .\GroCodeApp
npm install
npm start
```

## Validation

```powershell
Set-Location .\GroCodeWebsite
npm run lint
npm run typecheck
npm run build

Set-Location ..\GroCodeApp
npm run lint
npm run typecheck
```

The web app requires the environment variables documented by its deployment configuration. The mobile app uses `EXPO_PUBLIC_API_URL` to locate the web API.

GitHub Actions runs these checks automatically for pull requests and pushes to `main`.
