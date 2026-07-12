# Civic Voice

Civic reporting platform — Next.js frontend and Django backend.

## Structure

```
civic_voice/
├── frontend/   # Next.js (citizen + official UI)
└── backend/    # Django REST API + Channels
```

## Backend setup

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill in DB + Cloudinary + Django secrets
python manage.py migrate
python manage.py runserver
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend defaults to `http://localhost:8000/api`.

## Vercel (frontend)

In the Vercel project: **Settings → General → Root Directory** → set to `frontend` → Save → Redeploy.

The Next.js app lives in `frontend/`; building from the repo root will fail.

## Render (backend)

Repo includes `render.yaml` for a Blueprint deploy:

1. Render → **Blueprints** → New → `prajwal851851/civic` → branch `main` → path `render.yaml`
2. Apply (`civicvoice-api` + Postgres)
3. Set env vars: Cloudinary keys + `CORS_ALLOWED_ORIGINS` (your Vercel URL)
4. Set frontend `NEXT_PUBLIC_API_URL` to `https://<your-api>.onrender.com/api`