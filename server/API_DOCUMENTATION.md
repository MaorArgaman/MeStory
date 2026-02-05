# MeStory API Documentation

Complete API documentation for the MeStory platform backend, following **Section 14** of FULL_SPEC.md.

## Base URL

```
http://localhost:5001/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Token Expiry**: 60 days (as per Section 17.1)

## Security Features (Section 17.2)

- **Rate Limiting**: 100 requests per minute for general API
- **Auth Rate Limiting**: 5 login attempts per 15 minutes
- **Password Hashing**: bcrypt with 12 rounds
- **CORS**: Whitelist-based
- **Helmet**: Security headers enabled
- **Input Validation**: All inputs validated using express-validator

---

## Authentication Endpoints

### POST /api/auth/register

Create a new user account.

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Validation**:
- `name`: 2-100 characters
- `email`: Valid email format
- `password`: Minimum 8 characters, must contain uppercase, lowercase, and number

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "free",
      "credits": 100,
      "subscription": {
        "tier": "free",
        "price": 0,
        "credits": 100,
        "startDate": "2026-01-26T00:00:00.000Z",
        "endDate": "2027-01-26T00:00:00.000Z",
        "isActive": true
      }
    },
    "token": "jwt_token_here"
  }
}
```

**Errors**:
- `400`: User already exists
- `400`: Validation failed

---

### POST /api/auth/login

Authenticate user and receive JWT token.

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "free",
      "credits": 100,
      "subscription": {...},
      "profile": {...}
    },
    "token": "jwt_token_here"
  }
}
```

**Errors**:
- `401`: Invalid email or password

---

### GET /api/auth/me

Get current authenticated user data.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "free",
      "credits": 100,
      "subscription": {...},
      "profile": {...},
      "paypal": {...},
      "createdAt": "2026-01-26T00:00:00.000Z",
      "updatedAt": "2026-01-26T00:00:00.000Z"
    }
  }
}
```

**Errors**:
- `401`: Authentication required
- `404`: User not found

---

### PUT /api/auth/profile

Update user profile information.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Jane Doe",
  "bio": "Author and writer",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "free",
      "credits": 100,
      "profile": {
        "bio": "Author and writer",
        "avatar": "https://example.com/avatar.jpg"
      }
    }
  }
}
```

---

## Book Endpoints

All book endpoints require authentication.

### GET /api/books

Get all books for the authenticated user.

**Authentication**: Required

**Query Parameters**:
- `status` (optional): Filter by status (`draft`, `published`, `unpublished`)
- `genre` (optional): Filter by genre
- `sortBy` (optional): Sort field (default: `createdAt`)
- `order` (optional): Sort order (`asc`, `desc`, default: `desc`)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "books": [
      {
        "id": "book_id",
        "title": "My First Novel",
        "genre": "Fiction",
        "description": "An amazing story...",
        "publishingStatus": {
          "status": "draft",
          "price": 0,
          "isFree": true,
          "isPublic": false
        },
        "statistics": {
          "wordCount": 5000,
          "pageCount": 20,
          "chapterCount": 3,
          "views": 0,
          "purchases": 0,
          "revenue": 0
        },
        "qualityScore": {...},
        "coverDesign": {...},
        "createdAt": "2026-01-26T00:00:00.000Z",
        "updatedAt": "2026-01-26T00:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

### POST /api/books

Create a new book.

**Authentication**: Required

**Request Body**:
```json
{
  "title": "My First Novel",
  "genre": "Fiction",
  "description": "An amazing story about...",
  "language": "en"
}
```

**Validation**:
- `title`: Required, 1-200 characters
- `genre`: Required
- `description`: Optional, max 2000 characters
- `language`: Optional, 2-5 characters

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Book created successfully",
  "data": {
    "book": {
      "id": "book_id",
      "title": "My First Novel",
      "genre": "Fiction",
      "description": "An amazing story about...",
      "language": "en",
      "publishingStatus": {
        "status": "draft",
        "price": 0,
        "isFree": true,
        "isPublic": false
      },
      "statistics": {...},
      "createdAt": "2026-01-26T00:00:00.000Z"
    }
  }
}
```

---

### GET /api/books/:id

Get a single book by ID.

**Authentication**: Required

**URL Parameters**:
- `id`: MongoDB ObjectId of the book

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "book": {
      "id": "book_id",
      "title": "My First Novel",
      "genre": "Fiction",
      "description": "...",
      "synopsis": "...",
      "language": "en",
      "chapters": [
        {
          "title": "Chapter 1",
          "content": "Once upon a time...",
          "order": 1,
          "wordCount": 1500
        }
      ],
      "characters": [...],
      "plotStructure": {...},
      "qualityScore": {...},
      "coverDesign": {...},
      "pageLayout": {...},
      "publishingStatus": {...},
      "statistics": {...},
      "tags": [],
      "ageRating": "PG",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Errors**:
- `400`: Invalid book ID
- `404`: Book not found
- `403`: Not authorized to access this book

---

### PUT /api/books/:id

Update a book.

**Authentication**: Required

**URL Parameters**:
- `id`: MongoDB ObjectId of the book

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "genre": "Mystery",
  "description": "Updated description",
  "synopsis": "Full synopsis...",
  "chapters": [
    {
      "title": "Chapter 1",
      "content": "Updated content...",
      "order": 1,
      "wordCount": 2000
    }
  ],
  "characters": [
    {
      "name": "John Smith",
      "description": "The protagonist",
      "traits": ["brave", "intelligent"]
    }
  ],
  "plotStructure": {...},
  "tags": ["mystery", "thriller"],
  "ageRating": "PG-13"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Book updated successfully",
  "data": {
    "book": {
      "id": "book_id",
      "title": "Updated Title",
      "genre": "Mystery",
      "description": "Updated description",
      "chapters": [...],
      "characters": [...],
      "statistics": {
        "wordCount": 2000,
        "pageCount": 8,
        "chapterCount": 1
      },
      "updatedAt": "2026-01-26T01:00:00.000Z"
    }
  }
}
```

**Note**: Statistics are automatically recalculated on save.

**Errors**:
- `400`: Invalid book ID
- `404`: Book not found
- `403`: Not authorized to update this book

---

### DELETE /api/books/:id

Delete a book (only if unpublished).

**Authentication**: Required

**URL Parameters**:
- `id`: MongoDB ObjectId of the book

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Book deleted successfully"
}
```

**Errors**:
- `400`: Cannot delete a published book
- `404`: Book not found
- `403`: Not authorized to delete this book

---

### POST /api/books/:id/publish

Publish a book to the marketplace.

**Authentication**: Required

**URL Parameters**:
- `id`: MongoDB ObjectId of the book

**Request Body**:
```json
{
  "price": 9.99,
  "isFree": false
}
```

**Validation**:
- Price must be between $0 and $25 (Section 9.2)
- Book must have at least one chapter
- If `isFree` is true, price is set to 0

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Book published successfully",
  "data": {
    "book": {
      "id": "book_id",
      "title": "My First Novel",
      "publishingStatus": {
        "status": "published",
        "isPublic": true,
        "publishedAt": "2026-01-26T02:00:00.000Z",
        "isFree": false,
        "price": 9.99
      }
    }
  }
}
```

**Errors**:
- `400`: Book has no chapters
- `400`: Price out of range ($0-$25)
- `404`: Book not found
- `403`: Not authorized to publish this book

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message here",
  "details": [] // Optional validation details
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request / Validation Error
- `401`: Unauthorized / Authentication Required
- `403`: Forbidden / Insufficient Permissions
- `404`: Not Found
- `429`: Too Many Requests (Rate Limit)
- `500`: Internal Server Error

---

## Rate Limiting

Rate limiting headers are included in all responses:

```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1706227200
```

### Rate Limits by Endpoint Type

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| General API | 100 requests | 1 minute |
| Authentication | 5 requests | 15 minutes |
| AI Operations | 10 requests | 1 minute |

---

## User Roles & Credits

### Subscription Tiers

| Tier | Credits/Month | Price |
|------|--------------|-------|
| Free | 100 | $0 |
| Standard | 500 | $25 |
| Premium | Unlimited | $65 |

### Credit Usage (Section 10.1)

| Action | Credits |
|--------|---------|
| AI Chat Message | 1 |
| Text Enhancement | 1-2 |
| Continue Writing | 2 |
| Chapter Analysis | 2 |
| Full Book Analysis | 5 |
| Quality Score | 3 |
| AI Cover Generation | 5 |
| Audio Transcription | 3/min |
| PDF Export (styled) | 2 |
| Publishing Strategy | 3 |

---

## Testing with cURL

### Register a User

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Login

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Get Current User (with token)

```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create a Book

```bash
curl -X POST http://localhost:5001/api/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My First Novel",
    "genre": "Fiction",
    "description": "An amazing story"
  }'
```

### Get All Books

```bash
curl -X GET http://localhost:5001/api/books \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update a Book

```bash
curl -X PUT http://localhost:5001/api/books/BOOK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Updated Title",
    "chapters": [
      {
        "title": "Chapter 1",
        "content": "Once upon a time...",
        "order": 1,
        "wordCount": 1500
      }
    ]
  }'
```

---

## Future Endpoints (To Be Implemented)

### AI Endpoints (/api/ai)
- `POST /chat` - AI chat conversation
- `POST /enhance-text` - Text improvement
- `POST /quality-score` - Get quality score
- `POST /generate-cover` - Generate book cover
- `POST /transcribe` - Audio transcription

### Store Endpoints (/api/store)
- `GET /books` - Browse marketplace
- `GET /featured` - Featured books
- `GET /search` - Search books

### Export Endpoints (/api/export)
- `POST /:id/pdf` - Export to PDF
- `POST /:id/docx` - Export to DOCX
- `POST /:id/print-package` - Print package

---

## Related Documentation

- [FULL_SPEC.md](../FULL_SPEC.md) - Complete platform specification
- [Database Models](./src/models/README.md) - Database schema documentation
- [Setup Guide](../SETUP.md) - Installation and setup instructions
