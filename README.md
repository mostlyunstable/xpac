# XPAC — IVR Campaign Management Dashboard

A production-grade SaaS dashboard for managing AI-powered IVR (Interactive Voice Response) campaigns. Upload contact lists, configure AI voices, schedule campaigns, and track order progress — all from a single interface.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Campaign Wizard** — 5-step flow: Upload → Map Columns → Configure AI → Schedule → Launch
- **AI Assistant** — Natural language chat powered by NVIDIA NIM (Llama 3.1) for campaign insights
- **Order Management** — Real-time status tracking, timeline view, status transitions
- **Analytics Dashboard** — Visual charts, campaign metrics, cost estimation
- **Reports** — Exportable CSV reports with status distribution
- **Settings** — Profile management, API key generation, dark mode
- **Responsive Design** — Works on desktop, tablet, and mobile with bottom navigation
- **CSV Parser** — RFC 4180 compliant parser with auto-column detection
- **Google Sheets Import** — Paste a sheet URL to import contacts directly

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Tailwind CSS 4 |
| Backend | Express 5, Multer 2, Axios |
| AI | NVIDIA NIM API (Llama 3.1 8B Instruct) |
| Build | Vite 8, Oxlint |
| Styling | Material Symbols, Inter font, MD3-inspired tokens |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- NVIDIA NIM API key ([get one here](https://build.nvidia.com/))

### Installation

```bash
git clone https://github.com/your-username/xpac-dashboard.git
cd xpac-dashboard
npm install
```

### Configuration

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=3001
NVIDIA_API_KEY=nvapi-your-key-here
CORS_ORIGIN=http://localhost:5173
```

### Running

```bash
# Start both frontend and backend
npm start

# Or start separately
npm run dev        # Frontend on :5173
npm run server     # Backend on :3001
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
xpac-dashboard/
├── public/                  # Static assets
├── server/                  # Express backend
│   ├── index.js             # Server entry point
│   └── routes/
│       ├── ai.js            # NVIDIA NIM proxy
│       ├── campaign.js      # Campaign CRUD
│       ├── order.js         # Order CRUD
│       ├── settings.js      # User settings
│       └── upload.js        # File upload (Multer)
├── src/
│   ├── components/
│   │   ├── ai/              # AI chat components
│   │   └── FloatingAI.jsx   # Floating AI assistant
│   ├── contexts/            # React contexts (AI, Wizard, Notifications)
│   ├── hooks/               # Custom hooks (useFileUpload, useDebounce)
│   ├── layouts/             # AppLayout with sidebar + mobile nav
│   ├── pages/               # All page components
│   ├── services/            # API client (Axios)
│   ├── utils/               # Formatting, CSV parser, validation
│   ├── constants/           # App constants (steps, voices, statuses)
│   ├── App.jsx              # Router configuration
│   ├── main.jsx             # Entry point with providers
│   └── index.css            # Tailwind v4 theme + animations
├── .env.example             # Environment template
├── .gitignore
├── .oxlintrc.json           # Linter config
├── index.html               # HTML entry
├── package.json
└── vite.config.js           # Vite + API proxy
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload CSV file |
| GET/POST | `/api/campaigns` | List / create campaigns |
| GET/POST | `/api/orders` | List / create orders |
| PATCH | `/api/orders/:id` | Update order status |
| DELETE | `/api/orders/:id` | Delete order |
| POST | `/api/ai/chat` | Chat with AI assistant |
| GET/PUT | `/api/settings` | Get / update settings |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run server` | Start Express backend |
| `npm start` | Start both frontend + backend |
| `npm run build` | Production build |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview production build |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Backend server port |
| `NVIDIA_API_KEY` | Yes | — | NVIDIA NIM API key for AI chat |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

Report vulnerabilities via [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE) for details.
