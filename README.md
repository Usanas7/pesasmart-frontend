# PesaSmart — Frontend (Admin Panel)

The organiser **web admin panel** for **PesaSmart**, a USSD-based group governance and transparency platform for informal **Ikimina** (rotating savings) circles in urban Rwanda. Group **members** use the USSD interface from any phone; group **organisers** use this React app to manage groups, confirm contributions, and resolve disputes.


## Live Links

- **Web app:** https://pesasmart.vercel.app
- **API:** https://pesasmart-backend.onrender.com

## Tech Stack

- React (Vite) + React Router
- Hosted on Vercel; CI via GitHub Actions

## Running Locally

```
git clone https://github.com/Usanas7/pesasmart-frontend.git
cd pesasmart-frontend
npm install
```

Create a `.env` file (see `.env.example`):

```
VITE_API_URL=http://localhost:3000
```

Then:

```
npm run dev
```

App runs at http://localhost:5173.

## Pages

- **Sign In** and **Sign Up** — organiser authentication
- **Dashboard** — overview of the organiser's Ikimina groups

Navigation between pages is handled client-side with React Router.

## Deployment Plan

| Component | Host | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploys on push to `main`; `VITE_API_URL` points to the live backend |
| CI | GitHub Actions | Builds the app on every push |

## Architecture Note

This admin panel is the **organiser's** interface. The member-facing side of PesaSmart runs over **USSD** (via the backend repo above), so every group member can participate from any mobile phone without internet.