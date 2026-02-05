
MeStory
AI-Powered Book Writing & Reading Platform
Write • Design • Publish • Read • Earn
Complete Technical Specification Document
Version 9.0 | January 2026
Powered by Google Gemini 2.5 Flash AI
 
1. Executive Overview
1.1 What is MeStory?
MeStory is a comprehensive AI-powered platform that serves as both a book writing studio and a digital reading marketplace. Every user can be both an author and a reader, creating a dynamic ecosystem where creative content flows freely. The platform enables users to write books with AI assistance, design professional layouts, publish to the marketplace, and earn revenue from their work.
1.2 Platform Vision
MeStory democratizes book publishing by providing professional-grade tools to everyone. Writers can transform their ideas into polished, print-ready books, while readers discover unique content from emerging authors. The revenue-sharing model (50/50 split) incentivizes quality content creation.
1.3 Core Capabilities
Capability	Description	AI Integration
Writing Studio	Full book writing with chapters, characters, plot	Gemini 2.5 Flash assistance
AI Interview	Guided conversation to extract book ideas	Deep analysis & structure
Design Studio	Professional layout, cover design, typography	AI-generated covers
Quality Scoring	Literary quality assessment with feedback	AI scoring system
Digital Library	Read purchased and free books	Recommendations
Bookstore	Browse, filter, purchase books	Personalized suggestions
Author Chat	Direct reader-author communication	N/A
Publishing	One-click publish with AI marketing strategy	Pricing recommendations
Export System	PDF/DOCX with print-house instructions	Auto-formatting
Revenue Sharing	50% author / 50% platform	N/A
1.4 Target Audience
•	Aspiring Authors: Aspiring Authors
•	People with stories who need tools
•	Professional Writers: Professional Writers
•	Authors seeking efficient publishing
•	Avid Readers: Avid Readers
•	Book lovers looking for unique content
•	Businesses: Businesses
•	Organizations creating branded content
 
2. System Architecture
2.1 Technology Stack
Layer	Technology	Purpose
Frontend	React 18+ with TypeScript	Modern UI with hooks
State	React Context API	Global state management
Styling	Tailwind CSS + Framer Motion	Utility CSS + animations
Backend	Node.js + Express.js	RESTful API server
Database	MongoDB + Mongoose	Document storage
AI Engine	Google Gemini 2.5 Flash	All AI features
Payments	PayPal REST API	Payment processing
PDF	Puppeteer	PDF generation
DOCX	docx library	Word documents
 
3. User Roles & Pricing
3.1 Subscription Tiers
Plan	Price (USD)	Price (ILS)	Credits/Month	Features
Free	$0	₪0	100	Basic writing, limited AI
Standard	$25	₪99	500	Full AI, publishing, exports
Premium	$65	₪250	Unlimited	Everything + priority AI, analytics
3.2 User Profile Features
•	Personal Information, avatar, bio
•	Author Profile with published books, ratings, followers
•	Reading History with progress tracking
•	Writing Statistics and quality scores
•	Earnings Dashboard with sales and payouts
•	Notification Preferences
•	Connected Accounts (Google, PayPal)
 
4. Workflows & User Journeys
4.1 Book Creation Paths
Path 1: AI Interview → Summary → Book
1.	User starts AI interview session
2.	Gemini asks guided questions about story
3.	Questions cover: premise, characters, plot, themes
4.	AI generates Strategic Summary document
5.	Summary includes chapter outline, character profiles
6.	User proceeds to Book Writing Page
Path 2: File Upload → Analysis → Book
7.	User uploads document (PDF, Word, TXT)
8.	System extracts and analyzes content
9.	AI generates Strategic Summary
10.	User can edit and proceed to writing
Path 3: Audio Upload → Transcription → Book
11.	User uploads audio (MP3, WAV, M4A)
12.	Gemini transcribes to text
13.	Analysis and Summary generation
14.	Proceed to writing
Path 4: Direct Writing
15.	Create new empty book
16.	Enter basic details
17.	Write with AI assistance
 
5. Book Writing Page - Complete Features
The Book Writing Page is the core writing environment providing professional tools for authors.
5.1 Editor Features
•	WYSIWYG Editing: WYSIWYG Editing
•	What-you-see-is-what-you-get
•	Text Formatting: Text Formatting
•	Bold, italic, underline, strikethrough
•	Paragraph Styles: Paragraph Styles
•	Headings, blockquotes, lists
•	Auto-Save: Auto-Save
•	Every 30 seconds
5.2 AI Writing Assistant
Writer's Block Solutions
Feature	Description	How It Works
Continue Writing	AI continues from where you stopped	Analyzes context, maintains voice
Suggest Next Paragraph	Get 3 options for continuation	Based on plot direction
Scene Ideas	Generate scene suggestions	Considers chapter purpose
Bridge Scenes	Connect plot points smoothly	Maintains consistency
Text Enhancement
Feature	Description	Credits
Rephrase Sentence	Rewrite in better form	1
Expand Paragraph	Add more detail	2
Improve Dialogue	Make conversations natural	2
Add Sensory Details	Sight, sound, smell, touch	2
Strengthen Verbs	Replace weak verbs	1
5.3 Character Management
•	Character Profiles: Character Profiles
•	Name, age, description, traits, backstory
•	Goals & Motivations: Goals & Motivations
•	What drives each character
•	Relationships: Relationships
•	Connections between characters
•	Character Arc Timeline: Character Arc Timeline
•	Visual development tracking
•	Consistency Check: Consistency Check
•	AI ensures consistent behavior
5.4 Plot Management
•	Three-Act Structure: Three-Act Structure
•	Setup, Confrontation, Resolution
•	Plot Points Editor: Plot Points Editor
•	Inciting incident, midpoint, climax
•	Subplot Tracker: Subplot Tracker
•	Manage multiple storylines
•	Timeline View: Timeline View
•	Chronological event view
5.5 Quality Scoring System
AI evaluates literary quality with detailed feedback. Score visible to readers.
Category	Weight	Evaluated
Writing Quality	25%	Grammar, vocabulary, readability
Plot Structure	20%	Story arc, pacing, tension
Character Development	20%	Depth, consistency, growth
Dialogue	15%	Natural flow, distinct voices
Setting	10%	World-building, sensory details
Originality	10%	Unique elements, creativity
Score	Rating	Badge
90-100	Masterpiece	⭐⭐⭐⭐⭐
80-89	Excellent	⭐⭐⭐⭐
70-79	Good	⭐⭐⭐
60-69	Fair	⭐⭐
<60	Needs Work	⭐
•	Detailed Feedback Report: Detailed Feedback Report
•	Specific areas with examples
•	One-Click Fixes: One-Click Fixes
•	Apply AI suggestions instantly
•	Re-Score Option: Re-Score Option
•	Get new score after improvements
 
6. Book Visualization & Design Studio
Transform manuscripts into professionally designed, print-ready books.
6.1 Cover Design
Front Cover
•	AI Cover Generation: AI Cover Generation
•	Describe vision, Gemini creates image
•	Upload Custom Image: Upload Custom Image
•	Use own artwork or photos
•	Gradient/Solid Backgrounds: Gradient/Solid Backgrounds
•	Color options
•	Title Typography: Title Typography
•	Font, size, color, position
Back Cover
•	Matching Design: Matching Design
•	AI ensures front/back cohesion
•	Synopsis Area: Synopsis Area
•	Book description
•	Author Bio: Author Bio
•	About the author + photo
•	Barcode Area: Barcode Area
•	ISBN placement
Spine Design
•	Auto-calculated width based on page count
•	Title and author properly oriented
6.2 Page Layout
Setting	Options	Default
Body Font	15+ professional fonts	Georgia
Font Size	10pt - 16pt	12pt
Line Height	1.2 - 2.0	1.6
Page Size	A4, A5, Letter, Custom	A5
Margins	Adjustable all sides	Standard book
6.3 Image Management
•	Upload from device (JPG, PNG, WebP)
•	AI image generation with Gemini
•	Drag to exact position
•	Resize maintaining aspect ratio
•	Text wrap around images
•	Caption support
6.4 Print Requirements
IMPORTANT: Page count must be divisible by 4 for proper binding. System auto-adds blank pages.
•	Bleed Area: Bleed Area
•	3mm for edge images
•	Safe Zone: Safe Zone
•	Content away from trim
•	Color Profile: Color Profile
•	CMYK for print
6.5 Table of Contents
•	Auto-generated from chapter titles
•	Include/exclude option
•	Multiple style options
•	Linked page numbers
 
7. Book Reader & Library
7.1 Reader Features
•	Clean distraction-free reading
•	Page/Scroll mode options
•	Day/Night/Sepia themes
•	Font customization
•	Table of Contents navigation
•	Progress tracking
•	Bookmarks and highlights
•	Search within book
7.2 Book Information
•	Summary/synopsis access
•	Author bio with profile link
•	Quality score display
•	Word/page count
•	Publication date
7.3 Social Features
•	Rate & review (5-star)
•	Chat with author
•	Share quotes
•	Follow author
 
8. Bookstore & Marketplace
8.1 Browse & Discovery
•	Featured Books: Featured Books
•	Curated selection
•	New Releases: New Releases
•	Recently published
•	Bestsellers: Bestsellers
•	Most purchased
•	Top Rated: Top Rated
•	Highest quality scores
•	Free Books: Free Books
•	No cost options
•	AI Recommended: AI Recommended
•	Personalized for user
8.2 Filter Options
Filter	Options
Price	Free, Under $5, $5-$10, $10-$25, Custom
Genre	Fiction, Non-fiction, Romance, Thriller, etc.
Quality Score	90+, 80+, 70+, Any
Length	Short, Medium, Long
Rating	4+ stars, 3+ stars, any
8.3 Book Detail Page
•	Cover display
•	Title, author with profile link
•	Price or 'Free' badge
•	Quality score with badge
•	Full synopsis
•	Free sample chapter
•	User reviews
•	Similar books suggestions
 
9. Publishing & Monetization
9.1 Publishing Process
18.	Complete all chapters
19.	Design cover and layout
20.	Get AI quality score
21.	Set pricing (free or up to $25/₪99)
22.	Get AI marketing strategy
23.	Connect PayPal for payouts
24.	Publish to marketplace
25.	Track sales in dashboard
9.2 Revenue Model
Item	Author	Platform
Book Sales	50%	50%
Min Price	Free	N/A
Max Price	$25 (₪99)	N/A
Payout Threshold	$10	N/A
Payout Frequency	Monthly	N/A
9.3 AI Publishing Strategy
•	Optimal pricing recommendation
•	Target audience identification
•	Description optimization
•	Category suggestions
•	Launch timing
 
10. Credit System
10.1 Credit Usage
Action	Credits
AI Chat Message	1
Text Enhancement	1-2
Continue Writing	2
Chapter Analysis	2
Full Book Analysis	5
Quality Score	3
AI Cover Generation	5
Audio Transcription	3/min
PDF Export (styled)	2
Publishing Strategy	3
 
11. Admin Panel & CMS
Full control over platform content without code changes.
11.1 Dashboard
•	Platform statistics
•	Real-time activity
•	Growth charts
•	Revenue reports
•	System health
11.2 Content Management
Type	Description
Announcements	Platform-wide notices
Blog Articles	News, tips, tutorials
Tutorials/Guides	How-to content
Video Embeds	YouTube tutorials
Partnerships	Collaboration announcements
Updates/Changelog	Feature updates
FAQ	Questions and answers
11.3 User Management
•	User list with search/filter
•	Role management
•	Credit adjustment
•	Suspend/ban accounts
11.4 Financial
•	Revenue dashboard
•	Subscription income
•	Book sales revenue
•	Author payouts
•	Transaction history
 
12. Notifications System
Category	Notifications
Writing	Auto-save, goal achieved, streak reminder
Publishing	Book published, featured
Sales	Purchase, payout processed
Social	New review, follower, author message
System	Subscription renewal, credits low
•	Per-category control
•	Email digest option
•	Quiet hours setting
 
13. Database Models
13.1 User Model
Field	Type	Description
name	String	Full name
email	String	Email (unique)
password	String	Hashed password
role	Enum	free/standard/premium/admin
credits	Number	AI credits
subscription	Object	Plan details
profile	Object	Bio, avatar
paypal	Object	Payout info
13.2 Book Model
Field	Type	Description
title	String	Book title
author	ObjectId	User reference
genre	String	Book genre
chapters	Array	All chapters
characters	Array	Character profiles
qualityScore	Object	Score and feedback
coverDesign	Object	Design settings
publishingStatus	Object	Price, published
statistics	Object	Words, sales
13.3 Summary Model
Field	Type	Description
sourceType	Enum	interview/file/audio
content	String	Original content
summary	String	AI summary
characters	Array	Character defs
plotStructure	Object	Story structure
chapters	Array	Suggested outline
 
14. API Endpoints
14.1 Auth (/api/auth)
Method	Endpoint	Description
POST	/register	Create account
POST	/login	Authenticate
GET	/me	Get current user
POST	/google	Google OAuth
14.2 Books (/api/books)
Method	Endpoint	Description
GET	/	List user books
POST	/	Create book
GET	/:id	Get book
PUT	/:id	Update book
POST	/:id/publish	Publish book
14.3 AI (/api/ai)
Method	Endpoint	Description
POST	/chat	Send to AI
POST	/enhance-text	Improve text
POST	/quality-score	Get score
POST	/generate-cover	Create cover
POST	/transcribe	Audio to text
14.4 Store (/api/store)
Method	Endpoint	Description
GET	/books	Browse marketplace
GET	/featured	Featured books
GET	/search	Search books
14.5 Export (/api/export)
Method	Endpoint	Description
POST	/:id/pdf	Export PDF
POST	/:id/docx	Export DOCX
POST	/:id/print-package	Print package
 
15. External Integrations
15.1 Google Gemini 2.5 Flash
All AI features powered by Gemini 2.5 Flash for fast, high-quality responses.
Feature	Usage	Tokens
Interview	Multi-turn conversation	500-1000/msg
Writing	Context-aware generation	1000-2000
Analysis	Deep evaluation	2000-4000
Scoring	Comprehensive review	3000-5000
15.2 PayPal
•	OAuth 2.0 authorization
•	Payments API for purchases
•	Payouts API for authors
•	Webhooks for notifications
 
16. Export & Print Preparation
16.1 PDF Export
•	Front and back cover
•	Table of contents
•	All chapters with styling
•	Headers, footers, page numbers
•	Embedded fonts
16.2 Print Package (ZIP)
26.	Interior PDF with proper margins
27.	Cover PDF (front, spine, back spread)
28.	Print Instructions document
29.	Technical specifications file
16.3 Print Instructions Include
•	Page size and trim size
•	Bleed requirements (3mm)
•	Paper stock recommendations
•	Binding type
•	Cover finish (matte/gloss)
•	Spine width calculation
16.4 Page Count
IMPORTANT: Must be divisible by 4. System auto-adds blank pages for binding.
 
17. Security
17.1 Authentication
•	Password hashing (bcrypt, 12 rounds)
•	JWT tokens (60-day expiry)
•	HTTPS only
•	Secure cookies
17.2 API Security
•	Rate limiting (100 req/min)
•	CORS whitelist
•	Helmet security headers
•	Input validation
•	XSS protection
 
18. Technical Requirements
18.1 System Requirements
Component	Minimum	Recommended
Node.js	18.x	20.x LTS
MongoDB	6.0	7.0+
RAM	4GB	8GB+
Storage	20GB	50GB+ SSD
18.2 Environment Variables
PORT=5001 MONGODB_URI=mongodb://localhost:27017/mestory JWT_SECRET=your-secret-key GEMINI_API_KEY=your-gemini-key GOOGLE_CLIENT_ID=your-google-id PAYPAL_CLIENT_ID=your-paypal-id PAYPAL_MODE=sandbox
18.3 Installation
git clone https://github.com/your-repo/mestory.git cd mestory cd server && npm install cd ../client && npm install cp .env.example .env # Edit .env with your values npm run dev
 

--- End of Document ---
MeStory Platform Specification v9.0
© 2026 - All Rights Reserved
