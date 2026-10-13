# Push instructions — which directory goes to which repo

This local folder (`Yuvora Website`) holds BOTH projects. They deploy to
TWO separate GitHub repos. Never mix them up:

| Local directory | Push to (remote + branch)                | What it is              |
| --------------- | ---------------------------------------- | ----------------------- |
| THIS repo root (`src/`, `public/`, `index.html`, `package.json`, `.github/`) — frontend ONLY | `https://github.com/Yuvora-Club/Yuvora-official-websitet_v2` (`origin`, branch `main`) | Vite site → GitHub Pages → `https://yuvora.org` |
| `Backend/` (the nested repo inside this folder, ignored by the root repo) | `https://github.com/Yuvora-Club/Yuvora_Backend` (its own `origin`, branch `main`) | Express API → Render → `https://yuvora-backend.onrender.com` |

## Routine push (both projects)

Run from the repo ROOT (`Yuvora Website`):

```powershell
# 1. Frontend (+ root files) -> Yuvora-official-websitet_v2
git status --short
git add -A
git commit -m "Describe the frontend change"
git push origin main
```

Run from INSIDE the `Backend` folder:

```powershell
# 2. Backend only -> Yuvora_Backend
Set-Location Backend
git status --short
git add -A
git commit -m "Describe the backend change"
git push origin main
Set-Location ..
```

## Why two pushes?

- The root repo's `origin` remote points at the **frontend** repo.
- `Backend/` is its own nested git repo whose `origin` points at the
  **backend** repo. Commits made in one are invisible to the other, so a
  backend fix (e.g. `Backend/src/index.js`) must be committed + pushed
  from inside `Backend/`, and a frontend fix from the root.
- Check with `git remote -v` if unsure: root should show
  `Yuvora-official-websitet_v2`, `Backend/` should show `Yuvora_Backend`.

## Safety rules

- NEVER commit `.env` files (both `.gitignore` files already exclude them).
  Only `.env.example` is committed.
- NEVER `git push` from the root expecting the backend to update on
  Render — Render watches `Yuvora_Backend`, so push from `Backend/`.
- NEVER `git add` `node_modules/` or `dist/` (both ignored). If
  `git status` shows them as untracked (`??`), the `.gitignore` is broken
  — fix that before committing.
- The frontend repo root IS the Vite app (`src/`, `public/`,
  `package.json` at top level). Do NOT reintroduce a `Frontend/`
  subfolder — the Pages workflow builds from the root.
- `Backend/` on disk is ignored by the root repo (`Backend/` line in
  root `.gitignore`). It is pushed only from inside `Backend/`.

## Env vars (not in git — set on the hosts)

- Render (`yuvora-backend` → Environment):
  `FRONTEND_URL=https://yuvora.org,https://www.yuvora.org,http://localhost:5173`
- GitHub repo variables (`Yuvora-official-websitet_v2` → Settings →
  Secrets and variables → Actions → Variables):
  `VITE_API_URL=https://yuvora-backend.onrender.com`
