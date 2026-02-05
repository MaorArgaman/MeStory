# MeStory Server - Source Code

This directory contains all backend source code for the MeStory platform.

## Directory Structure

```
src/
├── config/          # Configuration files
│   └── database.ts  # MongoDB connection setup
│
├── controllers/     # Route controllers (business logic)
│   ├── authController.ts    # Authentication logic
│   └── bookController.ts    # Book CRUD operations
│
├── middleware/      # Express middleware
│   ├── auth.ts             # JWT authentication & authorization
│   ├── validate.ts         # Validation middleware
│   ├── validators.ts       # Validation rules
│   ├── rateLimiter.ts      # Rate limiting
│   └── index.ts            # Middleware exports
│
├── models/          # Mongoose models
│   ├── User.ts      # User model
│   ├── Book.ts      # Book model
│   ├── Summary.ts   # Summary model
│   ├── index.ts     # Model exports
│   └── README.md    # Model documentation
│
├── routes/          # API routes
│   ├── authRoutes.ts       # /api/auth routes
│   ├── bookRoutes.ts       # /api/books routes
│   └── index.ts            # Route exports
│
├── types/           # TypeScript type definitions
│   └── index.ts     # Shared types
│
├── utils/           # Utility functions
│   ├── asyncHandler.ts     # Async error handler
│   ├── jwt.ts              # JWT utilities
│   └── errors.ts           # Custom error classes
│
└── server.ts        # Main entry point
```

## Key Files

### Entry Point
- **server.ts**: Express app initialization, middleware setup, route mounting, server startup

### Configuration
- **config/database.ts**: MongoDB connection with Mongoose

### Authentication & Authorization
- **controllers/authController.ts**: Register, login, getMe, updateProfile
- **middleware/auth.ts**: JWT verification, role-based authorization, credit checking
- **utils/jwt.ts**: Token generation and verification

### Book Management
- **controllers/bookController.ts**: Create, read, update, delete, publish books
- **routes/bookRoutes.ts**: Book API endpoints

### Security
- **middleware/rateLimiter.ts**: Rate limiting (100 req/min general, 5/15min auth)
- **middleware/validators.ts**: Input validation rules
- Password hashing with bcrypt (12 rounds)
- JWT tokens with 60-day expiry

### Database Models
- **models/User.ts**: User accounts, subscriptions, credits, profiles
- **models/Book.ts**: Books, chapters, characters, quality scores, publishing
- **models/Summary.ts**: AI-generated summaries from interviews/files/audio

## Environment Variables

Required in `.env`:

```env
# Server
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/mestory

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=60d

# Google Gemini AI
GEMINI_API_KEY=your-api-key

# Client
CLIENT_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Create account
- `POST /login` - Authenticate
- `GET /me` - Get current user
- `PUT /profile` - Update profile

### Books (`/api/books`)
- `GET /` - List user books
- `POST /` - Create book
- `GET /:id` - Get book by ID
- `PUT /:id` - Update book
- `DELETE /:id` - Delete book
- `POST /:id/publish` - Publish book

See [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for complete API reference.

## Security Features (Section 17)

### Authentication (17.1)
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT tokens (60-day expiry)
- ✅ Secure cookies support
- 🔲 HTTPS only (production)

### API Security (17.2)
- ✅ Rate limiting (100 req/min)
- ✅ CORS whitelist
- ✅ Helmet security headers
- ✅ Input validation
- ✅ XSS protection

## Development

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Run Tests

```bash
npm test
```

## Code Organization

### Controllers
Controllers handle business logic and should:
- Validate request data
- Interact with models
- Return appropriate responses
- Handle errors gracefully

### Middleware
Middleware should:
- Be single-purpose
- Be reusable
- Call `next()` to continue
- Handle errors properly

### Routes
Routes should:
- Define endpoints
- Apply middleware
- Call controllers
- Be RESTful

### Models
Models should:
- Define schema
- Include validation
- Have appropriate indexes
- Export interfaces and models

## Error Handling

All controllers use try-catch blocks and return standardized error responses:

```typescript
{
  "success": false,
  "error": "Error message",
  "details": [] // Optional
}
```

## TypeScript

All code is strictly typed:
- Interfaces for all data structures
- Type guards where needed
- No `any` types (except controlled cases)
- Exported types for reuse

## Best Practices

1. **Always validate input** - Use express-validator
2. **Check authentication** - Use `authenticate` middleware
3. **Verify ownership** - Ensure users can only access their own data
4. **Handle errors** - Use try-catch blocks
5. **Use transactions** - For multi-document operations
6. **Check credits** - Before AI operations
7. **Rate limit** - Apply appropriate limits
8. **Type everything** - Strong TypeScript typing
9. **Document changes** - Update API docs

## Testing

### Manual Testing with cURL

```bash
# Register
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Test1234"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# Get user (replace TOKEN)
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Testing with Postman/Thunder Client

Import the API endpoints from [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)

## Common Issues

### MongoDB Connection Failed
- Ensure MongoDB is running: `npm run docker:up`
- Check `MONGODB_URI` in `.env`

### JWT Secret Missing
- Set `JWT_SECRET` in `.env`

### Rate Limit Exceeded
- Wait for the rate limit window to reset
- Adjust limits in `.env` for development

### Validation Errors
- Check request body matches validation rules
- See error details in response

## Next Steps

1. ✅ Authentication & Book APIs implemented
2. 🔲 AI endpoints (chat, enhance, score, cover generation)
3. 🔲 Store/Marketplace endpoints
4. 🔲 Export endpoints (PDF, DOCX)
5. 🔲 Payment integration (PayPal)
6. 🔲 Google OAuth
7. 🔲 Admin panel endpoints
8. 🔲 Notification system

## Related Documentation

- [API Documentation](../API_DOCUMENTATION.md)
- [Database Models](./models/README.md)
- [Full Specification](../../FULL_SPEC.md)
- [Setup Guide](../../SETUP.md)
