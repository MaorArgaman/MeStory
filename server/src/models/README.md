# MeStory Database Models

This directory contains all Mongoose models and TypeScript interfaces for the MeStory platform, strictly following the specifications in **Section 13** of FULL_SPEC.md.

## Models Overview

### 1. User Model ([User.ts](User.ts))

**Reference**: Section 13.1 of FULL_SPEC.md

The User model represents platform users with different subscription tiers.

#### Key Features:
- **Roles**: `free`, `standard`, `premium`, `admin`
- **Credit System**: Tracks AI usage credits
- **Subscription Management**: Tier, pricing, dates, auto-renewal
- **Profile**: Bio, avatar, author stats, reading history, writing stats
- **Earnings**: Total earned, pending payouts
- **PayPal Integration**: For author payouts
- **Notification Preferences**: Per-category control with quiet hours

#### Subscription Tiers:
| Tier     | Price (USD) | Credits/Month | Features                        |
|----------|-------------|---------------|---------------------------------|
| Free     | $0          | 100           | Basic writing, limited AI       |
| Standard | $25         | 500           | Full AI, publishing, exports    |
| Premium  | $65         | Unlimited     | Everything + priority, analytics|

#### Methods:
- `deductCredits(amount)`: Deduct credits (premium users have unlimited)
- `addCredits(amount)`: Add credits to user account

#### Virtuals:
- `isPremium`: Check if user is premium/admin
- `hasCredits`: Check if user has available credits

---

### 2. Book Model ([Book.ts](Book.ts))

**Reference**: Section 13.2 of FULL_SPEC.md

The Book model represents books created on the platform.

#### Key Features:

##### Chapters (`IChapter[]`)
- Title, content, order, word count
- Auto-tracked timestamps

##### Characters (`ICharacter[]`)
- Name, age, description, traits
- Goals, motivations, backstory
- Relationships with other characters
- Character arc tracking

##### Quality Score (`IQualityScore`) - **Section 5.5**
The quality scoring system evaluates books across 6 categories:

| Category              | Weight | Evaluates                     |
|-----------------------|--------|-------------------------------|
| Writing Quality       | 25%    | Grammar, vocabulary, readability |
| Plot Structure        | 20%    | Story arc, pacing, tension    |
| Character Development | 20%    | Depth, consistency, growth    |
| Dialogue              | 15%    | Natural flow, distinct voices |
| Setting               | 10%    | World-building, sensory details |
| Originality           | 10%    | Unique elements, creativity   |

**Score Ranges**:
- 90-100: Masterpiece (⭐⭐⭐⭐⭐)
- 80-89: Excellent (⭐⭐⭐⭐)
- 70-79: Good (⭐⭐⭐)
- 60-69: Fair (⭐⭐)
- <60: Needs Work (⭐)

##### Cover Design (`ICoverDesign`) - **Section 6.1**
- **Front Cover**: AI-generated, uploaded, gradient, or solid
  - Title typography (font, size, color, position)
  - Subtitle and author name
- **Back Cover**: Synopsis, author bio, barcode area
- **Spine**: Auto-calculated width based on page count

##### Page Layout (`IPageLayout`) - **Section 6.2**
- Body font, size (10-16pt), line height (1.2-2.0)
- Page size: A4, A5, Letter, Custom
- Margins (adjustable)
- Table of contents options
- Headers, footers, page numbers

##### Publishing Status (`IPublishingStatus`) - **Section 9.1**
- Status: `draft`, `published`, `unpublished`
- Pricing: $0-$25 (Free or paid)
- Marketing strategy (AI-generated)
- Target audience, categories, tags

##### Statistics (`IStatistics`)
- Word count, page count, chapter count
- Views, purchases, revenue
- Average rating, total reviews
- Completion rate, reading time

##### Plot Structure (`IPlotStructure`)
- Three-Act Structure (Setup, Confrontation, Resolution)
- Plot points (inciting incident, midpoint, climax)
- Subplots with status tracking
- Timeline of events

#### Important Business Rules:

1. **Page Count Divisibility** (Section 16.4):
   - Page count MUST be divisible by 4 for proper binding
   - System auto-adds blank pages in pre-save middleware

2. **Price Limits**:
   - Minimum: $0 (Free)
   - Maximum: $25 USD (₪99 ILS)

3. **Revenue Split** (Section 9.2):
   - Author: 50%
   - Platform: 50%
   - Payout threshold: $10

#### Pre-save Middleware:
- Automatically updates statistics (chapter count, word count, page count)
- Ensures page count is divisible by 4
- Calculates estimated reading time (~250 words/minute)

#### Virtuals:
- `isPublished`: Check if book is published and public
- `formattedPrice`: Returns "Free" or "$X.XX"

---

### 3. Summary Model ([Summary.ts](Summary.ts))

**Reference**: Section 13.3 of FULL_SPEC.md

The Summary model stores AI-generated strategic summaries from various sources.

#### Source Types (Section 4.1):
1. **Interview** - AI-guided conversation
2. **File** - Uploaded document (PDF, DOCX, TXT)
3. **Audio** - Audio recording (MP3, WAV, M4A)
4. **Direct** - Manual creation

#### Key Features:

##### Content Storage
- Original content (interview transcript, file text, or audio transcript)
- AI-generated summary
- Characters with role classification
- Plot structure with theme, premise, setting
- Chapter outlines with estimated word counts

##### Character Definitions (`ISummaryCharacter[]`)
- Name and role (protagonist, antagonist, supporting, minor)
- Description, traits, backstory
- Goals and character arc

##### Plot Structure (`ISummaryPlotStructure`)
- Premise, theme, genre, setting
- Three-Act Structure breakdown
- Plot points and conflict definition
- Tone and target audience

##### Chapter Outlines (`ISummaryChapter[]`)
- Chapter number, title, summary
- Key events and characters involved
- Estimated word count
- Notes for author

##### Metadata
Different metadata types based on source:

**Interview Metadata**:
- Total questions, questions answered
- Session duration
- Conversation ID
- AI model used

**File Metadata**:
- Original filename, file type, size
- Upload date
- Extracted text
- Page count

**Audio Metadata**:
- Original filename, format, duration
- File size, upload date
- Transcription model
- Transcription duration

#### Workflow Status:
- `pending`: Just created
- `processing`: AI is analyzing
- `completed`: Summary ready
- `converted`: Converted to book
- `failed`: Error occurred

#### Features:
- Tracks AI credits used
- Links to created book when converted
- Validates metadata based on source type

#### Virtuals:
- `isReadyForConversion`: Check if summary can be converted to book
- `totalEstimatedWordCount`: Sum of all chapter word estimates

---

## Database Indexes

### User Model
- `email` (unique)
- `role`
- `subscription.tier`
- `createdAt`

### Book Model
- `author`
- `genre`
- `publishingStatus.status`
- `publishingStatus.price`
- `qualityScore.overallScore`
- `statistics.views`
- `statistics.purchases`
- `tags`
- Compound: `genre + qualityScore.overallScore`
- Compound: `publishingStatus.status + publishingStatus.isPublic`

### Summary Model
- `userId`
- `bookId`
- `sourceType`
- `status`
- `convertedToBook`
- `createdAt`
- Compound: `userId + status`
- Compound: `userId + convertedToBook`

---

## Usage Examples

### Import Models

```typescript
import { User, Book, Summary } from './models';
// OR
import { User, UserRole, IUser } from './models/User';
import { Book, IBook, IQualityScore } from './models/Book';
import { Summary, SourceType, ISummary } from './models/Summary';
```

### Create a User

```typescript
const user = new User({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashedPassword123',
  role: UserRole.FREE,
  credits: 100,
});

await user.save();
```

### Create a Book

```typescript
const book = new Book({
  title: 'My First Novel',
  author: userId,
  genre: 'Fiction',
  description: 'An amazing story...',
  chapters: [
    {
      title: 'Chapter 1',
      content: 'Once upon a time...',
      order: 1,
      wordCount: 1500,
    },
  ],
  characters: [
    {
      name: 'Jane Smith',
      description: 'The protagonist',
      traits: ['brave', 'intelligent'],
    },
  ],
});

await book.save();
// Statistics will be auto-calculated
```

### Deduct Credits

```typescript
const success = await user.deductCredits(5);
if (!success) {
  throw new Error('Insufficient credits');
}
```

### Query Published Books

```typescript
const publishedBooks = await Book.find({
  'publishingStatus.status': 'published',
  'publishingStatus.isPublic': true,
})
  .populate('author', 'name avatar')
  .sort({ 'statistics.views': -1 })
  .limit(10);
```

---

## TypeScript Types

All models export both:
1. **Interface** - For TypeScript typing (e.g., `IUser`, `IBook`, `ISummary`)
2. **Model** - For Mongoose operations (e.g., `User`, `Book`, `Summary`)

Use interfaces when typing function parameters and return values:

```typescript
async function getUserBooks(userId: string): Promise<IBook[]> {
  return Book.find({ author: userId });
}
```

---

## Schema Validation

All models include comprehensive validation:

- **Required fields** with custom error messages
- **Min/max** constraints for numbers
- **Enums** for restricted values
- **Email validation** with regex
- **String length** limits
- **Custom pre-save** hooks for business logic

---

## Timestamps

All models have `timestamps: true` enabled, providing:
- `createdAt`: Automatically set on creation
- `updatedAt`: Automatically updated on modification

---

## Best Practices

1. **Always use interfaces** for type safety
2. **Populate references** when querying related data
3. **Use indexes** for frequently queried fields
4. **Validate data** before saving
5. **Handle errors** from async operations
6. **Use transactions** for multi-document operations
7. **Check credits** before AI operations
8. **Update statistics** after book modifications

---

## Related Documentation

- [FULL_SPEC.md](../../../../FULL_SPEC.md) - Complete platform specification
- [Database Configuration](../config/database.ts) - MongoDB connection setup
- [API Documentation](../../../../README.md#api-endpoints) - API endpoints reference
