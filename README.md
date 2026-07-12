# DACT — Decentralized Autonomous Container Tracking

DACT is a web dashboard for monitoring container movement, port activity, mesh-network nodes, incidents, gateway events, and analytics. It is built with React, TanStack Start, Vite, Tailwind CSS, and Supabase.

## Features

- Live port and container-tracking views
- Mesh-network and node monitoring
- Gateway queue, incident, replay, and analytics dashboards
- AI and application settings screens

## Run locally

### Prerequisites

- Node.js 20 or newer
- npm

### Setup

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173` in a browser.

## Environment variables

Create a `.env` file with the Supabase values required by the app:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

## Useful commands

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run preview  # Preview the production build
npm run lint     # Run ESLint
```

## License

No license has been specified for this project.
"# dact_final" 
