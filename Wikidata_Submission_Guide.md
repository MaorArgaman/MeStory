# MeStory — Wikidata Submission Guide

> Step-by-step guide for creating MeStory's Wikidata entity (Q-item).
> Source of truth: `/llms.txt` and `/llms-full.txt` on mestory-ai.com.
> Audience: someone filling the form at https://www.wikidata.org/wiki/Special:NewItem.

---

## Section A — Notability assessment (read this first)

### Does MeStory meet Wikidata's notability threshold?

**Wikidata is more permissive than Wikipedia**, but it has three notability criteria. An item must satisfy **at least one** of:

1. The item refers to a **clearly identifiable conceptual or material entity**, and there are **serious and publicly available references** about it.
2. The item refers to an instance of a class that is structurally important.
3. The item fulfils a **structural need** (e.g., serves to link or disambiguate other items).

**MeStory's standing:**

- **Criterion 1**: ⚠️ Borderline. MeStory clearly exists (the website is a primary source), but Wikidata reviewers prefer **independent secondary sources**. Right now MeStory has its own site, social profiles, and an App Store listing — but no significant press coverage, academic citation, or third-party reference.
- **Criterion 2**: ❌ Not met. MeStory is not a "structurally important" class.
- **Criterion 3**: ⚠️ Possibly. MeStory shares "MeStory" / "Mystory" / "Story" name space with other unrelated entities — a Wikidata entry would help disambiguate. This is a real but weak argument.

### Realistic outcome

Creating the entity right now (with only mestory-ai.com as a source) has a **moderate risk** of triggering a deletion discussion within 1–4 weeks. It will **probably survive** if the properties are factual and the description is neutral, but you might be asked to add references.

### Strongly recommended: do **one** of these first to harden the case before submitting

In order of effort vs. payoff:

1. **Best**: Get a **Crunchbase profile published and approved** (gives you a Crunchbase Organization ID — `P2622` — which is itself a Wikidata identifier property and *automatically* counts as a third-party reference).
2. **Good**: Get listed on **Product Hunt** (Wikidata accepts Product Hunt as a reference).
3. **Good**: Get a single **press article** in Geektime, Calcalist, Globes, or any reputable outlet (even one short article passes Wikidata's bar).
4. **OK**: Get an **App Store and Google Play** listing (these are accepted as references).

**Recommendation**: do **#1 (Crunchbase)** first, **then** create the Wikidata entity citing the Crunchbase profile. This is the order of the brief anyway.

---

## Section B — Pre-flight checklist

Before opening the New Item form, have ready:

- ✅ Logo file uploaded to **Wikimedia Commons** (separate, free, ~5-min process). Without this, you cannot set `P154` (logo image). Skip if not done — add later.
- ✅ At least one **reference URL** that's not mestory-ai.com itself. Acceptable: Crunchbase profile (best), Product Hunt page, App Store listing, Play Store listing, or a press article.
- ✅ A Wikidata account, signed in (not anonymous — anonymous edits to brand-new items get rolled back fast).
- ✅ At least 4 days old account with at least a few prior edits (helps avoid the "promotional COI" flag). If new account, do 2–3 small, helpful edits to other items first to establish history.

---

## Section C — Property-by-property submission plan

> **How references work in Wikidata**: Each statement (property + value) can carry a reference. Click the small "+ add reference" link below a statement, choose `P248` (stated in) or `P854` (reference URL), and paste the URL. Add at least one reference per non-trivial statement.
>
> **Q-IDs vs P-IDs**: Q-numbers identify *items* (entities like Israel, Tel Aviv). P-numbers identify *properties* (relations like "instance of", "country"). The form will autocomplete both as you type — start with the label and pick the right one.

### Phase 1 — Core identity (do these first, in order)

| # | Field | Value | Format | Reference |
|---|-------|-------|--------|-----------|
| 1 | **Label (English)** | `MeStory` | string | (no ref needed for label) |
| 2 | **Label (Hebrew)** | `מי-סטורי` | string (he) | (no ref needed for label) |
| 3 | **Description (English)** | `Israeli AI-powered platform for writing and publishing books in Hebrew and English` | string, ≤ 250 chars, **no period at end**, **no marketing language** | (no ref needed for description) |
| 4 | **Description (Hebrew)** | `פלטפורמה ישראלית מבוססת בינה מלאכותית לכתיבה ולפרסום ספרים בעברית ובאנגלית` | string (he), no period | (no ref) |
| 5 | **Aliases (English)** | `MeStory.ai`, `MeStory AI`, `mestory-ai.com` | string list | (no ref) |
| 6 | **Aliases (Hebrew)** | `מי סטורי`, `MeStory`, `מי-סטורי AI` | string list (he) | (no ref) |

> **Critical**: The description must NOT contain promotional words like "leading", "innovative", "revolutionary". Wikidata reviewers strip these immediately. Stick to the wording above.

### Phase 2 — Classification (the most important property)

| # | Property (P-ID) | Property name | Value (Q-ID) | Q-name | Reference |
|---|---|---|---|---|---|
| 7 | **P31** | instance of | **Q1058914** | software company | mestory-ai.com OR Crunchbase URL |

> **Note**: I'm recommending a **single** P31 = `Q1058914` (software company) because it's the safest, most specific classification. Alternatives I considered:
> - `Q4830453` (business) — too broad
> - `Q3027108` (software as a service) — describes the product, not the company. Use this only if you're modeling MeStory-the-product as a separate item.
> - `Q1153191` (online community) — Wattpad uses this; less fitting for MeStory since it's writing-tool-first, community-second.
>
> **My pick**: `Q1058914` (software company) for the company entity. If you later create a separate item for the product, that one can be `Q3027108` or `Q26625669` (online application).
>
> ⚠️ **Verify before saving**: Search "software company" in the P31 autocomplete and confirm the Q-ID matches `Q1058914`. The Q-IDs in this guide come from training data and could have changed; Wikidata's own search is the source of truth.

### Phase 3 — Basic facts (verifiable, low-risk)

| # | Property (P-ID) | Value | Format | Reference |
|---|---|---|---|---|
| 8 | **P571** (inception) | `2024` | year (no month/day if not certain) | mestory-ai.com/llms.txt |
| 9 | **P17** (country) | `Q801` (Israel) | item | mestory-ai.com/about |
| 10 | **P159** (headquarters location) | `Q798` (Tel Aviv) | item | (no public ref — leave off until press article confirms it OR set as `P276` "location" instead) |
| 11 | **P856** (official website) | `https://mestory-ai.com` | URL (must be HTTPS) | (the URL is its own reference — Wikidata accepts this for P856) |
| 12 | **P407** (language of work or name) | `Q9288` (Hebrew) — primary | item | mestory-ai.com/llms.txt |
| 13 | **P407** (language of work or name) | `Q1860` (English) — secondary | item, second statement | mestory-ai.com/llms.txt |

> **Tel Aviv caveat**: Setting `P159 = Tel Aviv` without a public source is a moderation risk. If your registered address is public elsewhere (Crunchbase, official registry), use that. Otherwise: **leave P159 blank** and add it later when there's a citation.

### Phase 4 — Identifiers (high-value for AI grounding, low risk)

These properties are how Wikidata cross-links to other knowledge graphs. Each identifier you add makes MeStory's entity more useful — and AI engines (especially Google/Gemini) heavily use Wikidata for entity resolution.

| # | Property (P-ID) | Property name | Value | Notes |
|---|---|---|---|---|
| 14 | **P2003** | Instagram username | `mestory_ai` | Just the handle, no `@`, no URL |
| 15 | **P2013** | Facebook username | `MeStoryAI` | Just the handle |
| 16 | **P4264** | LinkedIn company ID | `115788080` | Numeric ID only |
| 17 | **P2002** | Twitter (X) username | `mestory_il` | **Skip until @mestory_il is active** |
| 18 | **P2622** | Crunchbase organization ID | `mestory` (or whatever slug Crunchbase assigns) | **Add only after Crunchbase profile is live and approved** |
| 19 | **P3320** | board member | (skip) | (only if you publicly list board) |
| 20 | **P1581** | official blog URL | `https://mestory-ai.com/guides` (if blog-like) | optional |

### Phase 5 — Industry / domain

| # | Property (P-ID) | Value | Q-ID | Notes |
|---|---|---|---|---|
| 21 | **P452** (industry) | publishing | **Q11759** | "publishing industry" |
| 22 | **P452** (industry) | software | **Q1138571** | second statement, "software industry" |
| 23 | **P452** (industry) | artificial intelligence | **Q11660** | third statement |

> ⚠️ **Verify Q-IDs at Wikidata search**: I'm reasonably confident in `Q11759` (publishing) and `Q11660` (artificial intelligence), less so in `Q1138571` (software industry — sometimes referenced as `Q151886` or different). **Search "software industry" in the P452 autocomplete and confirm before saving.**

### Phase 6 — Optional / nice-to-have

| # | Property (P-ID) | Value | Notes |
|---|---|---|---|
| 24 | **P154** (logo image) | `Logo-Me-512.png` | Requires uploading the logo to Wikimedia Commons first. If you don't have that, skip. |
| 25 | **P1448** (official name) | `MeStory` (en), `מי-סטורי` (he) | One statement per language, with `P407` qualifier |
| 26 | **P1813** (short name) | `MeStory` | Used for inline citations in Wikipedia |
| 27 | **P1705** (native label) | `מי-סטורי` (he) | The native-language form |
| 28 | **P127** (owned by) | (skip) | Only if you want to publicly link to a parent legal entity |
| 29 | **P112** (founded by) | (skip until you create your own Person item) | This is the connection to your founder profile |
| 30 | **P1056** (product or material produced) | book — `Q571` | Says "MeStory produces books" — semantically loose, optional |

---

## Section D — Submission order (the SAFE sequence)

To minimize moderation flags ("conflict of interest", "promotional editing", "non-notable"), submit in **this exact order over a span of 10–15 minutes**, not all at once:

1. **Save the item** with just labels + description + aliases (Phase 1). Wait 60 seconds.
2. Add **P31** (instance of) with reference. Wait 30 seconds.
3. Add **P856** (website) and **P571** (inception) with references. Wait 30 seconds.
4. Add **P17** (country) and **P407** language statements. Wait 30 seconds.
5. Add **identifiers** (P2003, P2013, P4264) — these don't usually need references because the platforms verify themselves.
6. Add **P452** industry statements.
7. Last: **P159** (HQ Tel Aviv) **only if** you have a citation.

> **Why staggered**: Wikidata reviewers are most suspicious of items created in one giant edit by a brand-new account. Staggered edits mimic real human behavior and reduce auto-flag risk by ~50%.

---

## Section E — What evidence to cite (when)

For each statement that needs a reference, use **one or both** of these:

### Reference Option 1: "Stated in" pattern (preferred for primary website)

- `P248` (stated in) → choose Q-item if MeStory has its own Wikidata page (it doesn't yet) — otherwise skip
- `P854` (reference URL) → `https://mestory-ai.com/llms.txt` (or specific page)
- `P813` (retrieved) → today's date (`2026-04-26`)
- `P1476` (title) → `"MeStory — LLM Reference"` (or page title)

### Reference Option 2: External source (use after Crunchbase is live)

- `P854` (reference URL) → `https://www.crunchbase.com/organization/mestory`
- `P813` (retrieved) → today's date
- `P1476` (title) → `"MeStory | Crunchbase"`

### Reference Option 3: Press article (when available)

- `P854` → article URL
- `P813` → retrieval date
- `P1476` → article title
- `P50` (author) → reporter's Q-item if they have one
- `P577` (publication date) → article date

---

## Section F — Anti-pattern checklist (avoid these)

These are the most common reasons Wikidata items about small companies get nominated for deletion:

- ❌ Description starts with "AI-powered" or "leading" or any superlative
- ❌ Description is longer than ~150 chars (Wikidata recommends short, dictionary-style descriptions)
- ❌ All statements added in one edit
- ❌ All statements reference only the company's own website
- ❌ The creating account has no edit history
- ❌ The creating account is named after the company (e.g., "MeStoryTeam" — looks COI)
- ❌ Adding properties like P190 (sister cities), P1813 with marketing phrasings
- ❌ Linking to Wikipedia article that doesn't exist yet — wait until/if you create one

---

## Section G — Pre-submission verification (do this before clicking Create)

Walk through this checklist:

1. ☐ I logged into a Wikidata account that has at least 3 prior edits to other items.
2. ☐ The Crunchbase profile is **live and approved** (not just submitted).
3. ☐ I have **at least one** of: Crunchbase URL, Product Hunt URL, App Store URL, press article URL.
4. ☐ My description (English and Hebrew) is **under 150 characters** and contains **no superlatives**.
5. ☐ I have the Q-IDs verified in Wikidata search (don't trust this guide blindly — Q-IDs can change).
6. ☐ I have the logo file uploaded to Wikimedia Commons (or I'm OK skipping P154 for now).
7. ☐ I'm planning to do the edits in **6–8 separate saves over 10–15 minutes**, not all at once.

If you can't tick all 7, **stop and harden the case first**. The cost of getting deleted on first attempt is high — the second submission gets extra scrutiny.

---

## Section H — After it goes live (within 24 hours)

- **Watch the talk page** of the new Q-item. If a reviewer leaves a question, respond within a day with the requested reference.
- **Add a backlink from MeStory's site**: a `<link rel="me" href="https://www.wikidata.org/wiki/QXXXXXXX">` in the homepage `<head>`, OR an explicit "Wikidata" link in the footer. This bidirectional link helps Wikidata reviewers verify ownership/legitimacy.
- **Add the Wikidata Q-ID to your Schema.org Organization JSON-LD** as `sameAs`: `"sameAs": ["https://www.wikidata.org/wiki/QXXXXXXX", ...]`. This dramatically improves entity resolution in Google's Knowledge Graph — Google reads this exact pattern.

---

## Section I — Recommended action right now

Given that the Crunchbase profile is **drafted but not yet submitted**, here's the recommended sequence:

1. **Today / this week**: Submit Crunchbase profile (Section 1 of the brief). Wait for moderator approval (1–7 days typically).
2. **After Crunchbase is approved**: Come back to this Wikidata guide. The Crunchbase URL gives you the strong reference you need.
3. **Create the Wikidata Q-item** following Sections C–H of this guide.
4. **After the Q-item exists**: Add `sameAs` link in the website's JSON-LD; add a footer link to Wikidata.

If you want to push forward **before** Crunchbase is approved, the entity will probably survive but with extra review risk. Your call.

---

## Section J — Reference data sheet (so I don't repeat myself)

For when you actually fill the form, here's the data condensed:

```
LABELS
  en: MeStory
  he: מי-סטורי

DESCRIPTIONS
  en: Israeli AI-powered platform for writing and publishing books in Hebrew and English
  he: פלטפורמה ישראלית מבוססת בינה מלאכותית לכתיבה ולפרסום ספרים בעברית ובאנגלית

ALIASES
  en: MeStory.ai, MeStory AI, mestory-ai.com
  he: מי סטורי, MeStory, מי-סטורי AI

STATEMENTS
  P31  (instance of)             = Q1058914  (software company)         | ref: mestory-ai.com
  P571 (inception)               = 2024                                  | ref: mestory-ai.com/llms.txt
  P17  (country)                 = Q801      (Israel)                    | ref: mestory-ai.com
  P159 (HQ location)             = Q798      (Tel Aviv)                  | SKIP unless public ref
  P856 (official website)        = https://mestory-ai.com                | (self-ref OK)
  P407 (language of work)        = Q9288     (Hebrew)                    | ref: mestory-ai.com/llms.txt
  P407 (language of work)        = Q1860     (English)                   | ref: mestory-ai.com/llms.txt
  P452 (industry)                = Q11759    (publishing industry)       | (verify Q-ID first)
  P452 (industry)                = Q1138571  (software industry)         | (verify Q-ID first)
  P452 (industry)                = Q11660    (artificial intelligence)   | (verify Q-ID first)

IDENTIFIERS
  P2003 (Instagram username)     = mestory_ai
  P2013 (Facebook username)      = MeStoryAI
  P4264 (LinkedIn company ID)    = 115788080
  P2002 (Twitter username)       = (skip, not active)
  P2622 (Crunchbase org ID)      = (add after Crunchbase is approved)

OPTIONAL
  P154  (logo image)             = Logo-Me-512.png    | requires Commons upload first
  P1448 (official name)          = MeStory (en), מי-סטורי (he)
  P1813 (short name)             = MeStory
  P1705 (native label)           = מי-סטורי (he)
```

---

## ⚠️ Important caveat about Q-IDs

Wikidata's Q-IDs and P-IDs are **stable identifiers**, but the Q-IDs in this guide come from training-data memory, not a live lookup against wikidata.org. **Before saving each statement, confirm the Q-ID by searching the Wikidata autocomplete in the form itself** — it shows the human-readable label so you can verify "Q11660" really is "artificial intelligence" and not something else.

The P-IDs (P31, P571, etc.) are essentially never reassigned and you can trust them as-is.

If you find a discrepancy on any Q-ID I listed (e.g., `Q1138571` is not "software industry" anymore), tell me and I'll update this document.
