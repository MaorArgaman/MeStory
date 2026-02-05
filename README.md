# MeStory

**AI-Powered Book Writing & Reading Platform**

Write • Design • Publish • Read • Earn

## Overview

MeStory is a comprehensive platform that serves as both a book writing studio and a digital reading marketplace. Users can write books with AI assistance, design professional layouts, publish to the marketplace, and earn revenue from their work.

## Tech Stack

### Frontend
- **React 18+** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Zustand** - State management

### Backend
- **Node.js** with Express.js
- **TypeScript** - Type safety
- **MongoDB** with Mongoose - Database
- **JWT** - Authentication
- **Google Gemini 2.5 Flash** - AI features
- **PayPal API** - Payments
- **Puppeteer** - PDF generation
- **docx** - Word document export

## Project Structure

```
MeStory/
├── client/                 # React frontend
│   ├── src/
│   │   ├── assets/        # Images, fonts, etc.
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── layouts/       # Layout components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── styles/        # Global styles
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── public/            # Static files
│   └── package.json
│
├── server/                # Node.js backend
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   └── server.ts      # Entry point
│   ├── uploads/           # File uploads
│   └── package.json
│
├── docker-compose.yml     # MongoDB container
├── package.json           # Root package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Docker (for MongoDB)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd MeStory
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Server (.env):
```bash
cd server
cp .env.example .env
# Edit .env with your configuration
```

Client (.env):
```bash
cd client
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB with Docker**
```bash
npm run docker:up
```

5. **Start development servers**
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:5001

### Available Scripts

#### Root Level
- `npm run dev` - Start both client and server
- `npm run dev:server` - Start only server
- `npm run dev:client` - Start only client
- `npm run build` - Build both client and server
- `npm run docker:up` - Start MongoDB
- `npm run docker:down` - Stop MongoDB
- `npm run docker:logs` - View MongoDB logs

#### Server
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

#### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Configuration

### Required API Keys

1. **Google Gemini AI**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **PayPal**: Get from [PayPal Developer](https://developer.paypal.com/)
3. **Google OAuth**: Get from [Google Cloud Console](https://console.cloud.google.com/)

### Environment Variables

See `.env.example` files in server and client directories for all required variables.

## Features

### Core Capabilities
- ✍️ AI-assisted book writing
- 🎨 Professional cover design
- 📖 Digital reading experience
- 💰 Revenue sharing (50/50)
- 📊 Quality scoring system
- 🔍 AI-powered recommendations
- 💬 Author-reader chat
- 📄 PDF/DOCX export
- 🖨️ Print-ready packages

### Subscription Tiers
- **Free**: $0 - 100 credits/month
- **Standard**: $25 - 500 credits/month
- **Premium**: $65 - Unlimited credits

## Database

MongoDB is used for data storage. The database connection is configured in `server/src/config/database.ts`.

### Collections
- Users
- Books
- Summaries
- Transactions
- Reviews
- Admin content

## API Endpoints

Base URL: `http://localhost:5001/api`

- `/auth` - Authentication
- `/books` - Book management
- `/ai` - AI features
- `/store` - Marketplace
- `/export` - Export functions

See [FULL_SPEC.md](./FULL_SPEC.md) for complete API documentation.

## License

All Rights Reserved © 2026

## Support

For issues and questions, please contact support or check the documentation.
