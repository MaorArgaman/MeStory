# MeStory — Claude Cowork Brief

**Purpose**: This document is a self-contained brief you can paste into Claude.ai (web or mobile, Cowork or any chat) to get help with everything that **cannot** be done by editing the codebase: directory listings, knowledge-graph entries, content writing, outreach, and PR.

The technical SEO/GEO/AEO foundation is already in place — see the bottom of this brief for what was done. What's left is **authority and content work** that must happen outside the repo.

---

## How to use this brief

Paste **one section at a time** into Claude as a separate task. Each section is self-contained and produces a deliverable you can copy-paste into the target system (Crunchbase, LinkedIn, Wikidata, etc.) or send to a partner.

The reference content for everything below comes from:
- **Short**: https://mestory-ai.com/llms.txt
- **Full**: https://mestory-ai.com/llms-full.txt

Open both URLs in your browser and copy their contents into the conversation as the source of truth before asking for any deliverable. Or paste the canonical text Claude will need (see "Source material" below each section).

---

## Section 1 — Crunchbase profile (HIGH ROI, 30 minutes)

**Why it matters**: Crunchbase is one of the top sources AI engines (ChatGPT, Perplexity, Gemini) cite for company information. A complete profile creates a high-authority entity that LLMs will reference when users ask about MeStory.

**Deliverable**: A complete Crunchbase Organization profile, ready to paste field-by-field.

**Prompt to Claude**:

> I'm filling out a Crunchbase profile for MeStory. Generate the content for every Crunchbase field below, using the source material I'll paste afterward. Keep the tone factual and verifiable — no hype, no unverifiable claims.
>
> Fields to generate:
> 1. **Description (short, 140 chars)**
> 2. **Description (full, ~400-600 words)** — should cover: what MeStory is, who it's for, what makes it different from Wattpad/Reedsy/Storybird, the Hebrew-first focus, the memorial-book niche, founding year (2024), country (Israel), pricing model.
> 3. **Industries** (pick 3-5 from Crunchbase's taxonomy: Publishing, Artificial Intelligence, Software, Internet, EdTech, Israel Startups, Mobile Apps, etc.)
> 4. **Headquarters location** (city/country — Israel)
> 5. **Founded date** (2024)
> 6. **Operating status** (Active)
> 7. **Company type** (Privately Held)
> 8. **Number of employees** (placeholder: 1-10)
> 9. **Website** (https://mestory-ai.com)
> 10. **Social links** (Facebook, Instagram, LinkedIn — provided in source)
> 11. **Funding stage** (placeholder: Pre-Seed / Self-Funded — let me decide)
>
> Output in a clean format I can copy into each Crunchbase field.
>
> [PASTE CONTENT FROM https://mestory-ai.com/llms-full.txt HERE]

---

## Section 2 — Wikidata Q-entry (HIGH ROI, 1-2 hours)

**Why it matters**: Wikidata is the source of structured-data ground truth for Wikipedia, Google Knowledge Graph, and most LLMs. A Wikidata Q-entry creates the "official" entity that everything else can cite.

**Deliverable**: Step-by-step Wikidata edit instructions (which properties to add, with values).

**Prompt to Claude**:

> I want to create a Wikidata entity for MeStory. Walk me through the exact properties I should add and the values for each, in the order I should add them. For each property, give me:
> - The property ID (e.g., P31 for "instance of")
> - The exact value to enter
> - The format (item link, string, date, etc.)
> - A reference to cite (the URL on mestory-ai.com that supports the claim)
>
> Cover at minimum: instance of (business / software / website?), inception (2024), country (Israel), official website, alternate names (מי-סטורי, MeStory.ai), social media accounts, language of work (Hebrew, English), industry, and any other properties that strengthen the entity for LLM grounding.
>
> Also tell me: (a) does MeStory likely meet Wikidata's notability threshold? (b) what evidence should I cite to demonstrate notability? (c) what's the safest order to add properties to avoid getting flagged for "promotional" editing?
>
> [PASTE CONTENT FROM https://mestory-ai.com/llms-full.txt HERE]

---

## Section 3 — Wikipedia article (LATER, only if notable)

**Note**: Wikipedia has a strict notability threshold. Don't attempt this until MeStory has been covered in 2-3 independent reliable sources (news articles in Ynet, Globes, Calcalist, TechCrunch Israel, etc.).

**When the time comes, prompt to Claude**:

> I want to draft a Wikipedia article for MeStory in Hebrew and English. The notability evidence I have is: [list news articles, awards, etc.]. Write a neutral, encyclopedic draft following Wikipedia's WP:NPOV and WP:NCORP guidelines. No promotional language. Cite each non-obvious claim. Sections to include: Overview, History, Product, Reception (using press citations), See also, References, External links.
>
> [PASTE CONTENT FROM https://mestory-ai.com/llms-full.txt + LIST OF PRESS COVERAGE HERE]

---

## Section 4 — Product Hunt launch (HIGH ROI, ~3 hours prep)

**Why it matters**: Product Hunt drives a one-time wave of backlinks, AI-engine citations (Product Hunt is heavily indexed by LLMs), and brand searches.

**Deliverable**: A complete launch package — tagline, description, gallery captions, maker comment, and a launch-day checklist.

**Prompt to Claude**:

> I'm launching MeStory on Product Hunt. Generate:
> 1. **Tagline** (60 chars max, hooky, says the value prop in one phrase)
> 2. **Description** (260 chars max for the listing)
> 3. **First-comment from maker** (~150 words, warm, explains why we built this — focus on memorial books and Hebrew-first as the differentiator)
> 4. **Gallery captions** (5 captions for screenshots — what to highlight in each)
> 5. **Pre-launch list** (subscribers to notify, partners, communities) — give me a checklist of communities relevant to Israeli/Hebrew authors and AI tools
> 6. **Launch-day playbook** (timed actions: 12:01am PST post, social shares, replies to commenters)
> 7. **Two alternate taglines** (more emotional vs. more functional) so I can A/B in my head
>
> Tone: warm, family-oriented (this is about preserving memories), but not cheesy.
>
> [PASTE CONTENT FROM https://mestory-ai.com/llms-full.txt HERE]

---

## Section 5 — Comparison pages (CONTENT, generates organic traffic)

**Why it matters**: Searches like "MeStory vs Wattpad" and "best Hebrew book writing platform" are low-volume but high-intent. Comparison pages capture them and rank fast.

**Deliverable**: 3 comparison pages, ready to publish.

**Prompt to Claude**:

> Write three comparison articles for the MeStory blog/guides:
>
> 1. **MeStory vs Wattpad** (~1,500 words) — for English audience considering self-publishing
> 2. **MeStory vs Reedsy** (~1,500 words) — for English audience comparing AI vs editor-marketplace
> 3. **MeStory vs כתיבה עצמאית במחברת/Word** (~1,500 words, in Hebrew) — for Hebrew audience choosing between MeStory and traditional writing
>
> Each article must:
> - Open with a direct answer (40-60 words) — Featured Snippet bait
> - Include a comparison table (criteria × product matrix)
> - Be honest about MeStory's weaknesses (don't trash competitors — Google's Helpful Content punishes one-sided comparisons)
> - End with a "When to choose X / When to choose Y" decision section
> - Use H2/H3 hierarchy with question-format headings ("Which is better for memorial books?")
> - Include 5+ FAQ items at the bottom (FAQPage schema fodder)
>
> Tone: helpful, honest, decision-supporting — not selling.
>
> [PASTE CONTENT FROM https://mestory-ai.com/llms-full.txt HERE]

---

## Section 6 — Use-case landing pages (long-tail SEO)

**Why it matters**: Generic queries ("how to write a book") are too competitive. Specific intent queries ("how to write a memorial book in Hebrew", "how to write an autobiography for grandchildren") are winnable AND convert better.

**Deliverable**: 6 use-case landing pages.

**Prompt to Claude**:

> Write six use-case landing pages, each ~1,200 words, optimized for a specific long-tail intent:
>
> 1. **"How to write a memorial book for a parent"** (English) — target: middle-aged adult honoring a deceased parent
> 2. **"איך לכתוב ספר זיכרון לסבא או סבתא"** (Hebrew) — target: grandchild honoring grandparent
> 3. **"How to turn family interviews into a book"** (English) — target: someone who has recordings, doesn't know where to start
> 4. **"איך להפוך זיכרונות משפחתיים לספר"** (Hebrew) — target: same intent in Hebrew
> 5. **"How to write your autobiography after retirement"** (English) — target: 65+
> 6. **"ספר הנצחה לחיילים שנפלו"** (Hebrew) — target: bereaved families (sensitive — handle with care)
>
> Each page must:
> - Lead with an empathetic 60-word direct answer
> - Have a 5-7 step process (HowTo schema fodder)
> - Include 3-5 real example sentences/paragraphs the reader could use as starters
> - End with a soft CTA to MeStory's free signup
> - Include 5+ FAQs (FAQPage schema)
>
> Tone for memorial topics: respectful, gentle, never sales-y. For autobiography topics: confident, validating.
>
> [PASTE CONTENT FROM https://mestory-ai.com/llms-full.txt HERE]

---

## Section 7 — Glossary expansion

**Why it matters**: LLMs heavily favor glossaries for citation. A deep glossary becomes the reference for every "what does X mean" query in your niche.

**Deliverable**: 30-50 glossary entries, ready to paste into a glossary page (the page will use the `DefinedTermSetSchema` already in the codebase).

**Prompt to Claude**:

> Generate a glossary of 40 terms relevant to MeStory's niche, in both Hebrew and English. Categories:
>
> 1. **Book-creation terms**: manuscript, draft, chapter outline, beat sheet, three-act structure, drop cap, gutter margin, etc.
> 2. **Memorial/biography terms**: eulogy, hespeded (הספד), legacy, oral history, life review, etc.
> 3. **Self-publishing terms**: ISBN, royalties, marketplace, eBook, print-on-demand, fair use, copyright, ghostwriting, etc.
> 4. **AI-writing terms**: prompt, hallucination, content generation, transcription, summarization, etc.
>
> For each term: 1-2 sentence definition, 1 sentence on how it's used in MeStory specifically, both Hebrew and English versions.
>
> Output as JSON array of `{ name, description, hebrew_name, hebrew_description }` so I can directly feed it into the `DefinedTermSetSchema` component.
>
> [PASTE CONTENT FROM https://mestory-ai.com/llms-full.txt HERE]

---

## Section 8 — Press outreach (backlinks)

**Why it matters**: Backlinks from Israeli tech press (Ynet, Globes, Calcalist, Geektime, TheMarker) are the single biggest unlock for ranking in competitive Hebrew SERP queries. They also feed AI engines authoritative citations.

**Deliverable**: An outreach package — press release, journalist email template, target list.

**Prompt to Claude**:

> Generate a press outreach package for MeStory:
>
> 1. **Hebrew press release** (~600 words) — angle: "Israeli startup uses AI to help families preserve memories of loved ones." Lead with the human story (memorial books for fallen soldiers, Holocaust survivors), not the technology.
> 2. **English press release** (~600 words) — angle: "Hebrew-first AI book platform launches" for international tech press.
> 3. **Journalist pitch email template** (3-4 sentences) — short, hooky, tailored variants for: tech journalists, lifestyle journalists, journalists who cover Israeli startups.
> 4. **Target journalist list** — give me 15-20 specific reporters and outlets covering Israeli tech, AI, lifestyle/family, or self-publishing. For each: outlet name, reporter name (if you can guess), beat, why they'd care about MeStory.
> 5. **Press kit checklist** — what materials I need to have ready (logo, screenshots, founder bio, fact sheet, customer story).
>
> Tone for human-interest angle: warm, evocative. For tech angle: data-driven (Hebrew-first AI is rare; the addressable market in Israel; the memorial-book niche is underserved globally).
>
> [PASTE CONTENT FROM https://mestory-ai.com/llms-full.txt HERE]

---

## Section 9 — Social content calendar (3 months)

**Why it matters**: Consistent social posting builds branded searches over time. AI engines also crawl LinkedIn and Facebook posts as signals.

**Deliverable**: 90-day content calendar with post drafts.

**Prompt to Claude**:

> Build a 90-day social content calendar for MeStory across LinkedIn, Instagram, and Facebook (Hebrew + English mix).
>
> Cadence:
> - LinkedIn: 2 posts/week (English; thought leadership + Israeli startup angle)
> - Instagram: 4 posts/week (visual; Hebrew + English; reels + carousels)
> - Facebook: 3 posts/week (Hebrew-leaning; community; long-form OK)
>
> Content themes (rotate):
> 1. Customer stories (anonymized memorial book journeys)
> 2. AI writing tips (educational, no jargon)
> 3. Behind-the-scenes (product development)
> 4. Holiday/seasonal angles (Yom HaZikaron, Yom HaShoah, Sukkot for family time)
> 5. Founder thoughts (personal essays)
> 6. Free templates / tools (lead magnets)
>
> For each post: platform, week, theme, hook (first line), body, CTA, media direction (photo/video/carousel).
>
> Output as a table/calendar I can paste into Notion or Trello.
>
> [PASTE CONTENT FROM https://mestory-ai.com/llms-full.txt HERE]

---

## Section 10 — Reddit, Quora, Hacker News presence

**Why it matters**: AI engines (especially ChatGPT, Perplexity) heavily cite Reddit and Quora. A few well-crafted answers in relevant threads outperform months of social posting.

**Deliverable**: A 10-thread engagement plan.

**Prompt to Claude**:

> Find me 10 specific Reddit/Quora/Hacker News threads (or thread types) where MeStory could naturally contribute, plus a draft response for each.
>
> Subreddits to target: r/selfpublishing, r/writing, r/Israel, r/AskHistorians (memorial), r/genealogy, r/bookclub, r/HebrewBooks
> Quora topics: Book writing, Self-publishing, Israel, Memorial books, Family history
> HN: occasional Show HN-style posts when there's a real product update
>
> For each:
> - Link or thread description
> - The intent of the original poster
> - A draft response (300-500 words) that genuinely helps the OP, with MeStory mentioned only if it's the right fit (don't shill — the audiences detect and downvote that)
> - Signal strength: how often this query gets cited in AI responses
>
> Important: prioritize threads where MeStory genuinely fits. Skip ones where it would be off-topic.
>
> [PASTE CONTENT FROM https://mestory-ai.com/llms-full.txt HERE]

---

## Section 11 — Directories / listings to submit to

**Why it matters**: Each directory is a potential backlink AND a potential AI-citation source.

**Deliverable**: Prioritized list with submission notes for each.

**Prompt to Claude**:

> Give me a prioritized list of 25 directories where MeStory should be listed, with effort/impact estimate for each. Cover:
>
> 1. **Tech/SaaS directories**: Product Hunt, BetaList, AlternativeTo, G2, Capterra, GetApp, Slant, Saashub
> 2. **AI tool directories**: There's an AI for That, Futurepedia, AIToolsDirectory, AI-tools-directory.com
> 3. **Israeli startup directories**: StartupNation Central, Geektime, Calcalist startups, Globes startups
> 4. **Book/publishing directories**: Reedsy directory, IndieBook directory, BookBub
> 5. **Trust/review platforms**: Trustpilot, Trustradius, G2 Crowd
> 6. **Local Israeli directories**: Zap, B144 (B2B-relevant?)
> 7. **Knowledge graphs**: Wikidata (separate above), DBpedia, Crunchbase (separate above)
>
> For each: URL, free/paid, time to submit, what info they need, expected impact (backlink + AI citation), red flags (some are spammy — flag them).
>
> Output sorted by impact-per-hour-of-effort.

---

## Section 12 — YouTube channel kickoff

**Why it matters**: Google heavily favors video in SERPs. YouTube is the #2 search engine globally and AI engines (especially Gemini) integrate YouTube content.

**Deliverable**: 12-video launch plan + scripts for the first 3.

**Prompt to Claude**:

> Plan a MeStory YouTube channel launch:
>
> 1. **Channel positioning** — name, description, channel art direction
> 2. **First 12 videos** — title, hook, length, target keyword, script outline. Mix of:
>    - Tutorials ("how to write a memorial book in 7 days")
>    - Customer stories (anonymized)
>    - Founder thoughts
>    - Product demos (showing the AI in action)
>    - Hebrew-first videos for the Israeli audience
> 3. **Full scripts for the first 3 videos** (~800 words each) — opening hook, body, CTA, B-roll suggestions
> 4. **SEO metadata for each video** — title (front-loaded with keyword), description (first 150 chars critical), tags, end-screen elements, captions language strategy (Hebrew + English captions for every video)
>
> Output: video plan as a table, then 3 full scripts.
>
> [PASTE CONTENT FROM https://mestory-ai.com/llms-full.txt HERE]

---

## Section 13 — Email/newsletter setup

**Why it matters**: Newsletter subscribers come back, search for the brand by name, and convert at higher rates. Branded searches are a major Google ranking signal.

**Deliverable**: Welcome series (5 emails) + first 10 weekly newsletter drafts.

**Prompt to Claude**:

> Draft email content for MeStory:
>
> 1. **Welcome series — 5 emails** (sent over 2 weeks after signup). Goal: convert free signup to first finished chapter. Each email: subject line, preview text, body (~300 words), CTA, send timing.
> 2. **First 10 weekly newsletter drafts** — each ~400 words, mix of: writing tips, customer-story snippets, product updates, family-history prompts. Each: subject, preview, body, CTA.
> 3. **Template style guide** — voice, tone, length, do's/don'ts.
>
> Bilingual (Hebrew + English variants for each email).
>
> [PASTE CONTENT FROM https://mestory-ai.com/llms-full.txt HERE]

---

## Section 14 — Server-side OG/meta for shared book/profile links

**This one is technical, not content — but it requires deciding between two approaches before writing code.**

**Prompt to Claude (technical)**:

> I have a Vite SPA at mestory-ai.com (separate Vercel project) and an Express API at me-story-server-7wdx.vercel.app (separate Vercel project). Currently when someone shares a link to /book/:id or /profile/:id on Facebook/WhatsApp/Twitter, the social previewer fetches the SPA's static index.html and sees only generic OG tags — not the book's title, cover, or author.
>
> I need to fix this. Compare three approaches:
>
> 1. **Vercel Edge Middleware on the SPA** — middleware.ts at the project root that detects social-bot user-agents and rewrites OG tags before serving index.html
> 2. **Server-side endpoint + Vercel rewrite** — a /book-preview/:id endpoint on the API that returns full HTML with OG; a Vercel rewrite on the SPA that conditionally proxies bot requests to it
> 3. **Pre-rendering at build time** — a build step that crawls the SPA and generates static HTML files per public route
>
> For each: complexity, maintenance burden, latency impact on real users, how it handles the dynamic content (books published after build time), and risk of breaking the SPA. Recommend one and write the implementation. The codebase uses TypeScript, Express, and Vite.

---

## Reference: What was already done in the codebase (don't redo)

Skip these — they're shipping in the code:

✅ **Crawlability**: robots.txt allows all major AI crawlers (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended, Applebot-Extended, CCBot)
✅ **LLM context**: /llms.txt (short) and /llms-full.txt (deep, ~5,000 words)
✅ **AI policy**: /ai.txt and /.well-known/llm-policy.json
✅ **Sitemaps**: /sitemap.xml (static), /sitemap-index.xml, server-side dynamic sitemap with all books and authors
✅ **Schemas (JSON-LD) deployed**: Organization, WebSite, Brand, Service, SoftwareApplication, Book, Article, HowTo, Course, FAQ, BreadcrumbList, Person/Author, ProfilePage, AboutPage, CollectionPage, ItemList, DefinedTermSet, Speakable, Video, Review, Product
✅ **Entity graph**: All schemas linked via @id (Organization ↔ WebSite ↔ logo, etc.)
✅ **Discoverability files**: /humans.txt, /.well-known/security.txt, /opensearch.xml, /feed.xml (RSS)
✅ **HTML signals**: noscript fallback with full site description for JS-less crawlers, h-card microformat, hreflang for he/en/x-default, canonical URLs
✅ **HTTP headers**: HSTS preload, Content-Language, X-Content-Type-Options, Cache-Control per file type
✅ **Performance**: Web Vitals tracking → GA4 (LCP, CLS, INP, TTFB)
✅ **NotFoundPage**: noindex meta runtime injection
✅ **IndexNow**: server endpoint ready for Bing/Yandex/Naver/Seznam instant submission (set INDEXNOW_KEY env var to activate)

---

## What requires user action (before any of the above content goes live)

1. **Bing Webmaster Tools** — verify mestory-ai.com (replace `REPLACE_WITH_BING_WEBMASTER_CODE` in client/index.html)
2. **IndexNow** — generate hex key, set `INDEXNOW_KEY` env var, place key file in client/public/
3. **Submit /sitemap-index.xml** to Google Search Console (already verified) and Bing Webmaster
4. **Decide on Server-side OG approach** (see Section 14)

Then start working through Sections 1-13 in order of ROI:
- Sections 1, 2, 4, 11 (Crunchbase, Wikidata, Product Hunt, directories) — fastest wins
- Sections 5, 6, 7 (comparison pages, use-cases, glossary) — content moats, run in parallel
- Sections 8, 9, 10 (press, social, Reddit/Quora) — slow-burn authority
- Sections 12, 13 (YouTube, email) — long-term compounding
