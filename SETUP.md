# MeStory - Setup Guide

## Initial Setup Steps

### 1. Install Dependencies

```bash
# Install root dependencies and all workspace packages
npm install
```

This will install dependencies for:
- Root workspace
- Server (Node.js backend)
- Client (React frontend)

### 2. Configure Environment Variables

#### Server Configuration

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your configuration:

**Required Variables:**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (generate a random string)
- `GEMINI_API_KEY` - Google Gemini AI API key
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` - For PayPal integration

#### Client Configuration

```bash
cd client
cp .env.example .env
```

Edit `client/.env` with your configuration:

**Required Variables:**
- `VITE_API_URL` - Backend API URL (default: http://localhost:5001/api)
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `VITE_PAYPAL_CLIENT_ID` - PayPal client ID

### 3. Start MongoDB

Using Docker (recommended):

```bash
npm run docker:up
```

This will:
- Start MongoDB 7.0 container
- Expose on port 27017
- Create persistent volumes for data

**Alternative:** If you have MongoDB installed locally, ensure it's running on port 27017.

### 4. Start Development Servers

#### Option A: Start Both (Recommended)

```bash
npm run dev
```

This starts:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5001

#### Option B: Start Individually

```bash
# Terminal 1 - Start server
npm run dev:server

# Terminal 2 - Start client
npm run dev:client
```

## Verification

### Check Backend
Visit: http://localhost:5001/health

Should return:
```json
{
  "status": "ok",
  "message": "MeStory API is running"
}
```

### Check Frontend
Visit: http://localhost:5173

Should display the MeStory welcome page.

## Next Steps

1. **Create Database Models**: Implement User, Book, Summary models in `server/src/models/`
2. **Build Authentication**: Implement auth routes and JWT middleware
3. **Set up AI Service**: Configure Gemini AI integration
4. **Build UI Components**: Create reusable components in `client/src/components/`
5. **Implement Features**: Follow the roadmap in FULL_SPEC.md

## Common Commands

```bash
# Development
npm run dev              # Start both client and server
npm run dev:server       # Start only server
npm run dev:client       # Start only client

# Building
npm run build            # Build both for production
npm run build:server     # Build server only
npm run build:client     # Build client only

# Production
npm start                # Start production server

# Docker
npm run docker:up        # Start MongoDB
npm run docker:down      # Stop MongoDB
npm run docker:logs      # View MongoDB logs
```

## Project Structure Overview

```
MeStory/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── assets/            # Images, fonts
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # React Context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── layouts/           # Layout components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   │   └── api.ts         # Axios instance
│   │   ├── styles/            # Global CSS
│   │   │   └── index.css      # Tailwind imports
│   │   ├── types/             # TypeScript types
│   │   │   └── index.ts       # Common types
│   │   ├── utils/             # Utility functions
│   │   │   └── cn.ts          # Class name merger
│   │   ├── App.tsx            # Main component
│   │   ├── main.tsx           # Entry point
│   │   └── vite-env.d.ts      # Vite types
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── server/                     # Node.js Backend
│   ├── src/
│   │   ├── config/            # Configuration
│   │   │   └── database.ts    # MongoDB connection
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # Mongoose models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── types/             # TypeScript types
│   │   │   └── index.ts       # Common types
│   │   ├── utils/             # Utility functions
│   │   │   └── asyncHandler.ts
│   │   └── server.ts          # Entry point
│   ├── uploads/               # File uploads
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── docker-compose.yml         # MongoDB container
├── package.json               # Root package.json
├── README.md                  # Project overview
├── SETUP.md                   # This file
└── FULL_SPEC.md              # Complete specification
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure Docker is running
- Check if MongoDB container is up: `docker ps`
- Verify connection string in server/.env

### Port Already in Use
- Server (5001): Check if another process is using port 5001
- Client (5173): Check if another process is using port 5173
- MongoDB (27017): Check if MongoDB is already running locally

### Module Not Found Errors
- Run `npm install` in root directory
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`

## Getting API Keys

### Google Gemini AI
1. Visit: https://makersuite.google.com/app/apikey
2. Create new API key
3. Add to `server/.env` as `GEMINI_API_KEY`

### Google OAuth
1. Visit: https://console.cloud.google.com/
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5001/api/auth/google/callback`
6. Add client ID and secret to `server/.env`

### PayPal
1. Visit: https://developer.paypal.com/
2. Create new app
3. Get Client ID and Secret
4. Add to `server/.env`
5. Use `sandbox` mode for development

## Support

For issues, refer to:
- [README.md](./README.md) - General overview
- [FULL_SPEC.md](./FULL_SPEC.md) - Complete technical specification
