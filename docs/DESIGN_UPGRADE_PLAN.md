# MeStory — תוכנית שדרוג עיצובי מסך-אחר-מסך

> **המטרה:** כל מסך במערכת צריך לגרום למשתמש להרגיש "המערכת הזו נבנתה בשבילי" — עם תמונות של אנשים כמוהו, שפה חמה, ואווירה של מוציא לאור יוקרתי.

---

## 1. 🏠 דף נחיתה (LandingPage)

### מצב נוכחי
- Hero עם תמונה אחת קבועה
- כרטיסי features גנריים
- Testimonials בסיסיים
- CTA רגיל

### שדרוגים עיצוביים

#### Hero Section
- **רקע וידאו לופ** (15 שניות) — ידיים מדפדפות באלבום תמונות ישן, אור חם
- **כותרת מונפשת** — `text-reveal` animation, אותיות מופיעות אחת-אחת כמו מכונת כתיבה
- **תמונה ראשית** שמתחלפת כל 5 שניות (carousel עדין, fade):
  - חיילים צעירים יוצרים ספר הנצחה ליחידה
  - סבתא עם נכדים ותמונות ישנות
  - זוג צעיר עם ספר סיפור האהבה שלהם
  - משפחה שכולה עם ספר הנצחה בהר הרצל
- **CTA גדול** עם `fab-glow` animation — "בואו נתחיל לספר"
- **מונה חי** — "4,832 סיפורים כבר נכתבו" (מתעדכן בזמן אמת)

```
Prompt (Hero Image 1):
A cinematic photograph of an elderly Israeli grandmother (75 years) 
with silver hair and reading glasses, sitting at a wooden dining 
table bathed in warm golden afternoon light. She is smiling while 
looking at a beautiful hardcover book she just received — her own 
life story. Old black-and-white family photographs are spread on 
the table. Her granddaughter (10 years) stands behind her, hugging 
her and looking at the book over her shoulder. The mood is deeply 
warm, emotional, and nostalgic. Israeli home interior with Middle 
Eastern touches. Shot on Sony A7R V, 50mm f/1.4, shallow depth of 
field, golden hour light streaming through lace curtains, 
photorealistic, 8K resolution.
```

```
Prompt (Hero Image 2):
An emotional close-up portrait of a young Israeli man (28 years) 
with short dark hair and stubble, wearing a simple white t-shirt. 
He is sitting alone on a bench in a beautiful memorial garden, 
holding an open hardcover memorial book. The book shows photographs 
of his fallen friend in IDF uniform. His expression shows pride 
mixed with grief. Dappled sunlight filters through olive trees 
behind him. A single memorial candle burns on the bench beside him. 
Photojournalistic style, shallow depth of field, desaturated warm 
tones, raw emotion, shot on Leica Q3, 28mm, 8K.
```

```
Prompt (Hero Image 3):
A heartwarming photograph of an elderly Israeli couple (both 80+) 
sitting together on a park bench in a Mediterranean garden. The man 
(wearing a cap) reads aloud from a leather-bound book to his wife, 
who listens with closed eyes and a peaceful smile. The book is their 
love story, written together over 60 years of marriage. Bougainvillea 
flowers frame the scene. Warm golden hour light, cinematic depth, 
shot on Hasselblad X2D, 90mm, film-like color grading, tender 
emotion, 8K.
```

#### Features Section
- **3 כרטיסים גדולים** במקום רשימה:
  - "ספר לי" — תמונת אדם מדבר + waveform animation
  - "נעצב ביחד" — ספר 3D מסתובב + particles
  - "ספר אמיתי" — אנימציית ספר שנפתח ומתגלות עמודים
- כל כרטיס עם `card-3d-hover` + background image ב-parallax
- אייקונים מונפשים (לא סטטיים) — עט שכותב, ספר שנפתח, מיקרופון שפועם

#### Social Proof Section
- **"הם כבר סיפרו"** — גלריית תמונות עגולות של משתמשים (8-12)
- **חשוב: 50% צעירים, 50% מבוגרים** — לא רק סבא וסבתא!
- כל תמונה עם שם + סוג ספר + ציטוט קצר
- `stagger-children` entrance animation
- רקע: טקסטורת נייר עתיק עדינה

```
Prompt (Social Proof Grid — 8 portraits, 50/50 young/old):
Eight individual portrait photographs of diverse Israeli people, 
each holding their completed MeStory book. IMPORTANT: Equal 
representation — 4 young people and 4 older people.

SOLDIERS & MILITARY (50%):
1. Young female IDF combat soldier (21) with ponytail and olive 
   uniform, proudly holding a memorial book for her fallen commander.
   Strong, determined expression with soft eyes. Outdoor military 
   base background blurred.
2. Group of 3 young soldiers (20-22, mixed gender) in olive uniforms, 
   arms around each other, holding a unit memorial book together. 
   Brotherhood, camaraderie, emotion. Military base background.
3. Young bereaved brother (25) in civilian clothes, sitting at a 
   memorial site holding a memorial book about his fallen brother. 
   Dog tags visible around his neck. Powerful, dignified grief.
4. Retired IDF colonel (65, civilian clothes) with kind eyes and 
   silver hair, holding a memoir of 30 years of military service. 
   Israeli flag pin on his lapel.

FAMILIES & CIVILIANS (50%):
5. Young Israeli couple (late 20s) sitting in a Tel Aviv cafe 
   holding a love story book they wrote together. Modern, authentic.
6. Ethiopian-Israeli young woman (24) in university graduation gown, 
   holding a family immigration story book. Radiant pride.
7. Elderly Yemenite-Israeli grandmother (80s) in traditional dress 
   and gold jewelry, holding a family history book.
8. Young religious father (30) with knitted kippah, holding a 
   children's book he wrote for his son. Baby in carrier on chest.

All portraits: studio-quality lighting, warm color grade, genuine 
smiles of pride, books prominently displayed. Apple-style clean 
aesthetic, consistent lighting, 8K resolution each.
```

#### Military / IDF Dedicated Section
- **"לזכרם"** — section ייעודי בדף הנחיתה לספרי הנצחה צבאיים
- רקע כהה עם טקסטורה של דגל ישראל עדין מאוד
- תמונות: חיילים, יחידות, ספרי הנצחה
- CTA: "הנציחו את הגיבורים שלנו"

```
Prompt (Military Hero Section):
A powerful, cinematic photograph of a young Israeli soldier's hands 
(early 20s, olive uniform sleeves visible) carefully placing a 
photograph into an open memorial book. The photograph shows a group 
of smiling soldiers in uniform. The book is on a simple wooden table 
with IDF dog tags, a folded beret, and a small memorial candle 
(yahrzeit) nearby. The lighting is dramatic — a single warm light 
from the side creating deep shadows. The mood is reverent, dignified, 
and deeply emotional. Close-up hands shot, cinematic depth of field, 
desaturated warm tones, photojournalistic style, 8K resolution.
```

```
Prompt (Military — Unit Book):
A group photograph of 5 young Israeli soldiers (mixed gender, ages 
19-22) in olive green IDF uniforms, sitting together on sandbags at 
a military outpost at golden hour. They are all looking at an open 
memorial book in the center, some pointing at photographs of their 
fallen friends. One soldier is writing a message in the book. Their 
expressions show a mix of pride, love, and sadness. The setting sun 
creates a warm backlight. Documentary photography style, authentic, 
raw emotion, National Geographic quality, 8K.
```

```
Prompt (Military — Bereaved Family):
A deeply moving photograph of a young Israeli woman (early 30s) 
sitting on a bench in Mount Herzl military cemetery in Jerusalem. 
She holds a beautifully bound memorial book open on her lap, showing 
photographs and text about her fallen husband. She touches a page 
gently with one hand. A small Israeli flag is planted next to the 
gravestone behind her. Autumn light filters through cypress trees. 
The mood is dignified grief mixed with love and pride. Cinematic, 
photojournalistic, shallow depth of field, 8K resolution.
```

#### "How It Works" Section
- **3 צעדים** בתצוגה אופקית עם קו מחבר ביניהם (timeline style)
- כל צעד עם אנימציית כניסה כשגוללים אליו (`warm-enter` on scroll)
- **צעד 1:** "ספרו" — אנימציית waveform + תמונת אדם מדבר
- **צעד 2:** "עצבו" — אנימציית כריכה שמתגלה + color swatches
- **צעד 3:** "שתפו" — אנימציית ספר שעף ממסך ותמונות משפחה מסביב

---

## 2. 🔐 התחברות / הרשמה (Login/Register)

### שדרוגים עיצוביים
- **Split layout** — חצי מסך: טופס. חצי מסך: תמונת hero שמתחלפת
- **רקע הטופס** — gradient עדין deep-space → cosmic-purple
- **רקע התמונה** — תמונות של אנשים שכבר כתבו ספרים (carousel)
- **ציטוט מסתובב** מתחת לתמונה: "אף פעם לא חשבתי שאני יכולה לכתוב ספר — רחל, בת 78"
- **כפתור Google** גדול ובולט (רוב קהל היעד יעדיף Google על email)
- **אנימציה:** טופס slides in מימין, תמונה fades in משמאל

```
Prompt (Login page background):
A soft, dreamy photograph of an open vintage leather journal on a 
dark wooden desk, with a fountain pen resting on blank cream pages. 
A warm desk lamp creates a pool of golden light. In the blurred 
background, framed family photographs and old books on shelves are 
barely visible. The mood is intimate and inviting — like sitting 
down to write in the quiet evening. Shallow depth of field, warm 
amber tones, analog film aesthetic, product photography style, 
8K resolution, slightly desaturated for use as a background image.
```

---

## 3. 📊 Dashboard

### מצב נוכחי
- Hero header עם תמונה
- כרטיסי יצירת ספר (4 כרטיסים)
- רשימת ספרים
- המלצות

### שדרוגים עיצוביים

#### Greeting Section
- **ברכה אישית מונפשת** — "שלום רחל, טוב שחזרת 👋" עם `text-reveal`
- **"הטיפ של היום"** — משפט השראה שמתחלף + שאלה שמעוררת זיכרון
  - "איזה ריח מזכיר לך את ילדותך?"
  - "מה הדבר הראשון שאתה זוכר?"
  - "ספר לנו על הבית שגדלת בו"
- **מד התקדמות** של הספר הפעיל — `ink-flow-bar` animation — "הגעת ל-40%!"

#### Create Book Cards
- **תמונות רקע ספציפיות** לכל כרטיס (לא generic):
  - "התחלה מאפס" → תמונת מחברת ריקה פתוחה עם עט
  - "ספר לי" → תמונת מיקרופון vintage על שולחן
  - "הקלטה קולית" → תמונת אדם מדבר בנינוחות בסלון
  - "ייבוא טקסט" → תמונת מסמכים ישנים מסודרים
- **`stagger-children`** — כרטיסים נכנסים אחד-אחד
- **`card-3d-hover`** — perspective + glow ב-hover
- **Badge מונפש** — "הכי פופולרי" על כרטיס הראיון עם `sparkle-burst`

```
Prompt (Card: "ספר לי את הסיפור"):
A warm, inviting still-life photograph of a vintage brass microphone 
on a small wooden side table, next to a comfortable armchair with a 
knitted throw blanket. A cup of Turkish coffee steams gently beside 
the microphone. The background shows a blurred, warm living room 
with family photos on the wall. The mood says: "sit down, relax, 
and tell me your story." Shallow depth of field, warm golden 
lighting, cozy atmosphere, product photography meets lifestyle, 
8K resolution.
```

```
Prompt (Card: "התחלה מאפס"):
A beautiful overhead photograph of an open, blank cream-colored 
Moleskine notebook on a dark walnut desk. A gold fountain pen 
rests diagonally across the blank page. Scattered around the 
notebook: dried pressed flowers, a small vintage compass, and a 
faded black-and-white photograph. Soft natural light from above. 
The composition suggests the beginning of a journey. Styled 
flat-lay photography, minimal and elegant, warm tones, 8K.
```

```
Prompt (Card: "הקלטה קולית"):
An intimate photograph from behind/side of an elderly Israeli man 
(70s) sitting in a comfortable armchair, speaking naturally into a 
modern smartphone propped up on the coffee table. He gestures with 
his hands as he tells a story. The room is warm and lived-in, with 
afternoon light. A voice waveform visualization is subtly overlaid 
on the image. Documentary style, warm tones, candid, authentic, 8K.
```

#### My Books Section
- **כרטיסי ספר** עם:
  - תמונת כריכה בזווית 3D (perspective tilt)
  - Progress bar — `ink-flow-bar`
  - "42% הושלם — עוד 3 פרקים והסיפור שלך מוכן!"
  - Hover: shadow + slight scale up
- **Empty state** (אין ספרים):
  - תמונה גדולה של ספר ריק פתוח עם אור זהוב
  - "הסיפור שלך מחכה להיכתב" בפונט Cinzel
  - כפתור CTA עם `fab-glow`

```
Prompt (Empty state — no books yet):
A magical, dreamy photograph of a single open book with completely 
blank white pages, floating in a dark, cosmic space. Golden light 
particles and tiny stars stream upward from the blank pages, as if 
stories are waiting to emerge. The book appears to glow from within. 
The surrounding space is deep navy/purple (matching the app's 
deep-space theme). Digital art blended with photography, warm gold 
and deep blue color palette, ethereal, hopeful, mystical yet warm. 
Suitable as a background image with text overlay. 8K resolution.
```

---

## 4. ✍️ עורך הספר (BookWritingPage)

### שדרוגים עיצוביים
- **רקע העורך** — טקסטורת נייר עדינה מאוד (לא לבן חלק)
- **Cursor** — custom cursor בצורת נוצת כתיבה כשב-editor
- **"AI כותב..."** — כשהAI מייצר טקסט, `quill-write` animation + נצנוצי זהב
- **Sidebar פרקים** — כל פרק עם אייקון סטטוס:
  - ⚪ ריק
  - 🟡 בתהליך
  - ✅ הושלם
  - עם `ink-flow-bar` progress per chapter
- **Floating AI button** — `fab-glow` + tooltip "צריך עזרה?"
- **Draft notes** — נראים כמו פתקיות Post-it צהובות עם צל

```
Prompt (Editor background texture):
A seamless, tileable texture of aged cream parchment paper with 
very subtle fiber patterns and minimal foxing (age spots). The 
texture should be extremely subtle — suitable as a background for 
text editing. Color: warm ivory (#fefdfb) with barely visible 
grain. Must tile seamlessly. Resolution: 1024x1024 px, subtle 
enough to not distract from content but adding warmth and 
authenticity to the writing experience.
```

---

## 5. 📖 עימוד הספר (BookLayoutPage — Flipbook Editor)

### שדרוגים עיצוביים
- **רקע** — כבר deep-space gradient (שודרג) ✅
- **Top bar** — כבר memorial-gold chrome ✅
- **הוספה:** טקסטורת עץ עדינה מאחורי הספר (כמו שולחן ספרייה)
- **Page shadows** — צללים עמוקים יותר כדי שהספר "צף" מהרקע
- **"עיצוב אוטומטי" button** — `sparkle-burst` animation + gradient icon
- **Cover preview** — reflection effect (השתקפות) מתחת לכריכה
- **Transition בין עמודים** — particles קטנים שעפים כשדפדפים

```
Prompt (Background behind flipbook):
A dark, elegant photograph of the surface of a library reading desk. 
The wood is dark mahogany with rich grain patterns, polished to a 
soft sheen. A subtle warm light source from the upper right creates 
a gentle gradient across the surface. The wood texture should be 
visible but not distracting. Very dark overall (to match the 
deep-space UI theme). Must work as a background behind a white 
book. Product photography style, top-down angle, 8K resolution, 
seamless edges for tiling.
```

---

## 6. 🎨 סטודיו עיצוב (DesignStudioPage)

### שדרוגים עיצוביים
- **3D Book Preview** — כבר קיים ✅ — להוסיף:
  - **Reflection** — השתקפות הספר על "משטח" מבריק מתחת
  - **Spotlight** — אור ממוקד על הספר, שאר הרקע חשוך
  - **rotation on drag** — המשתמש יכול לסובב את הספר עם העכבר
- **Color picker** — swatches גדולים עם שמות ("שנהב חם", "כחול ממלכתי")
- **Font preview** — כל פונט מוצג עם טקסט לדוגמה בגודל אמיתי
- **"Before & After"** — השוואה בין כריכה ברירת מחדל לכריכה מעוצבת
- **Template gallery** — כרטיסים עם תצוגת mockup 3D לכל תבנית

```
Prompt (Design Studio atmosphere):
A dramatic product photograph of a hardcover book standing upright 
on a dark reflective surface (black glass or polished marble). The 
book has a rich burgundy leather cover with gold embossed Hebrew 
title. A single spotlight from above creates a dramatic pool of 
light around the book, with the rest fading to darkness. The 
reflection of the book is visible on the glossy surface below. 
Studio lighting, premium product photography, Apple product launch 
aesthetic, 8K resolution, dramatic contrast.
```

---

## 7. 📚 חנות / Marketplace

### שדרוגים עיצוביים
- **Hero banner** — "גלה סיפורים של אנשים כמוך" + carousel של כריכות
- **כרטיסי ספרים** — mockup 3D של כריכה (לא flat image)
  - Shadow + perspective tilt
  - Hover: ספר "קופץ" קדימה + appears rating stars
  - Badge: "חדש" / "נקרא 1000+ פעמים" / "ממולץ"
- **Filters** — pills עם icons:
  - 📖 סיפורי חיים
  - 🕯️ הנצחה
  - 👨‍👩‍👧‍👦 משפחה
  - 🎁 מתנות
  - ✈️ מסעות
- **"Featured Story"** — ספר אחד מוצג גדול עם background image + ציטוט

---

## 8. 👤 פרופיל משתמש / הגדרות

### שדרוגים עיצוביים
- **Header** — תמונת כריכה (cover image) + אווטר עגול גדול
- **סטטיסטיקות** — cards מונפשים:
  - "3 ספרים" — עם אייקון ספר מונפש
  - "12,450 מילים" — counter animation
  - "47 קוראים" — עם אנימציית hearts
- **"המסע שלך"** — timeline ויזואלי של milestones:
  - "🎉 הצטרפת" → "✍️ ספר ראשון" → "📖 500 מילים" → "🎨 כריכה ראשונה" → ...
  - כל milestone עם `sparkle-burst` כשמושלם

---

## 9. ❓ FAQ / About / Guides

### שדרוגים עיצוביים
- **FAQ** — accordion עם `warm-enter` animation לכל תשובה
- **About** — parallax scroll עם תמונות צוות + סיפור החברה
- **Guides** — כרטיסים ויזואליים עם תמונות, לא טקסט בלבד
  - כל מדריך: תמונת hero + שלבים מונפשים + CTA

---

## 10. 🔔 התראות / הודעות

### שדרוגים עיצוביים
- **התראות** — כרטיסים עם אייקון מונפש לפי סוג:
  - 💌 הודעה חדשה — envelope שנפתח
  - 📚 ספר חדש — ספר שקופץ
  - ⭐ דירוג — כוכב שמתנוצץ
  - 💰 מכירה — מטבע שנופל
- **Badge** — counter עם `sparkle-burst` כשמתעדכן

---

## 11. 🌐 אלמנטים גלובליים

### Navbar
- **לוגו** — glow animation עדין (`fab-glow`)
- **Avatar** — ring animation בצבע memorial-gold כש-online
- **Notification bell** — shake animation כשיש חדש
- **Menu transition** — slide + blur on mobile

### Loading States
- **Skeleton** — `skeleton-handwriting` (שורות כתב יד שזורחות) ✅
- **Spinner** — ספר קטן שמסתובב (לא circle רגיל)
- **Progress** — `ink-flow-bar` זהוב ✅

### Empty States
- כל empty state עם **תמונה ייחודית** + משפט חם:
  - אין ספרים → "הסיפור שלך מחכה להיכתב"
  - אין הודעות → "שקט כאן... בינתיים"
  - אין מכירות → "הקוראים שלך עוד לא הגיעו — הם בדרך!"

### Footer
- **טקסטורת נייר** עדינה כרקע
- **לוגו** בפונט Cinzel + tagline
- **Social links** — עם hover glow
- **"נבנה עם ❤️ בישראל"**

### Toast Messages
- **הצלחה** — confetti particles קטנים + sound (subtle "ding")
- **שגיאה** — shake animation + warm message
- **Info** — slide in מלמטה עם `warm-enter`

---

## 12. פרומפטים נוספים ליצירת תמונות

### Loading / Splash Screen
```
Prompt:
A minimal, elegant animation-ready illustration of an open golden 
book seen from above. From the blank pages, thousands of tiny golden 
Hebrew letters float upward in a spiral pattern, gradually forming 
into a complete paragraph of text before dissolving back into 
particles. The background is deep navy (#0a0a1f). Style: clean 
vector-meets-3D, gold (#DAA520) on dark, suitable for a loading 
animation. Magical but sophisticated. 4K resolution, transparent 
background where possible.
```

### Onboarding wizard backgrounds
```
Prompt (Step 1 — "מה הסיפור שלך?"):
A soft watercolor illustration showing an abstract tree whose 
branches are made of open books, each book showing different life 
moments: a wedding, a child's first steps, a soldier's farewell, 
an elderly couple dancing. The tree trunk is formed by intertwining 
Hebrew letters. Roots grow deep into the ground representing 
heritage. Color palette: warm golds, soft greens, deep blues. 
Painterly, sophisticated, emotional. Suitable as a background 
with text overlay. 4K resolution.
```

```
Prompt (Step 2 — "בחרו תבנית"):
An elegant flat-lay photograph showing 6 different beautifully 
designed book covers arranged on a dark velvet surface. Each cover 
represents a different template: memoir (leather), memorial (navy 
with gold star), family (warm wood texture), gift (burgundy with 
ribbon), travel (colorful map), and children's (pastel 
watercolor). Small decorative elements between the books: dried 
flowers, a pocket watch, a compass, a heart locket. Premium 
product photography, styled like a luxury brand catalog, warm 
spotlight, 8K.
```

```
Prompt (Step 3 — "התחילו לכתוב"):
A warm, encouraging photograph of light streaming through an open 
doorway into a dark room. The light illuminates a path of scattered 
golden letters on the floor leading toward a glowing open book on 
a distant desk. The image is metaphorical — stepping through the 
door is starting to write. The mood is inviting, not intimidating. 
Warm golden light, dramatic but welcoming, shallow depth of field, 
cinematic composition, fantasy-meets-reality, 8K resolution.
```

### Error pages
```
Prompt (404 page):
A charming, whimsical illustration of a small golden book character 
(anthropomorphized book with tiny legs and arms) holding a magnifying 
glass, looking confused while standing at a crossroads in a magical 
library. The library shelves stretch to infinity in all directions. 
A warm lantern provides the only light. Speech bubble above the 
book character reads "?" The style is warm, friendly, not 
frustrating. Children's book illustration quality, warm palette, 
digital painting, 4K.
```

---

## 13. Color Tokens לפי אווירה

| אווירה | רקע | טקסט | accent | שימוש |
|--------|------|-------|---------|--------|
| **ממלכתי** | #0a0a1f | #fefdfb | #DAA520 | ברירת מחדל, הנצחה |
| **חמים** | #faf6ef | #2d2118 | #c75b39 | סיפורי חיים, משפחה |
| **חגיגי** | #1a0a20 | #fff5e6 | #e6c35c | מתנות, יום הולדת |
| **נוסטלגי** | #f5efe0 | #3d3225 | #8b7355 | סבא מספר, וינטג' |
| **מודרני** | #fafafa | #1a1a1a | #2563eb | יומן מסע, צעירים |

---

## 14. Typography Scale (מדרגות טיפוגרפיה)

```css
/* Display — Hero headlines */
.text-display { font: 700 48px/1.1 'Cinzel', serif; letter-spacing: -0.02em; }

/* Title — Page titles */
.text-title { font: 700 32px/1.2 'Cinzel', serif; letter-spacing: -0.01em; }

/* Heading — Section headings */
.text-heading { font: 600 24px/1.3 'Playfair Display', serif; }

/* Subheading — Card titles */
.text-subheading { font: 600 18px/1.4 'Inter', sans-serif; }

/* Body — Regular text */
.text-body { font: 400 16px/1.6 'Inter', sans-serif; }

/* Caption — Small labels */
.text-caption { font: 400 13px/1.4 'Inter', sans-serif; letter-spacing: 0.02em; }

/* Book text — Inside book pages */
.text-book { font: 400 14px/1.7 'David Libre', serif; }

/* Book title — Inside book chapter titles */
.text-book-title { font: 700 22px/1.2 'Cinzel', serif; }

/* Handwriting — Personal touches */
.text-handwriting { font: 400 18px/1.5 'Caveat', cursive; }
```

---

## 15. סדר עדיפויות למימוש עיצובי

### Sprint 1 — גולד (שבוע 1)
1. ✅ טיפוגרפיה מקצועית בספר (drop caps, headers, ornaments)
2. ✅ אנימציות micro (stagger, breathe, sparkle, ink-flow)
3. ✅ UX copy חם בעברית
4. 🔲 Loading skeleton כתב-יד (להחליף spinners)
5. 🔲 Empty states עם תמונות ומשפטים חמים

### Sprint 2 — תמונות (שבוע 2)
6. 🔲 יצירת 12 תמונות AI (מהפרומפטים) ושילוב בדפים
7. 🔲 Hero section עם carousel תמונות + text-reveal
8. 🔲 Dashboard cards עם תמונות רקע ספציפיות
9. 🔲 Social proof grid (6 פורטרטים)

### Sprint 3 — פוליש (שבוע 3)
10. 🔲 Login/Register split layout + background image
11. 🔲 Marketplace cards עם 3D book covers
12. 🔲 Navbar glow + notification animations
13. 🔲 Footer עם טקסטורת נייר
14. 🔲 Toast messages עם confetti/sounds
15. 🔲 404 page עם איור חמוד

---

---

## 16. 📸 ניהול תמונות בעמודי הספר — שדרוג חווית התמונות

### מצב נוכחי
- אפשר להוסיף תמונה לעמוד (Add Image)
- אפשר לגרור/לשנות גודל
- אין layout מוכן לתמונות, אין grid, אין אלבום

### שדרוגים נדרשים

#### A. סידורי תמונות מוכנים (Photo Layouts per Page)
כשמוסיפים תמונות לעמוד, המשתמש בוחר **layout מוכן** במקום לגרור ידנית:

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│              │  │  ┌───┐ ┌───┐ │  │    ┌─────┐   │
│   ┌──────┐   │  │  │   │ │   │ │  │    │     │   │
│   │ Full │   │  │  │ 1 │ │ 2 │ │  │    │  1  │   │
│   │ Page │   │  │  │   │ │   │ │  │    │     │   │
│   │Image │   │  │  └───┘ └───┘ │  │    └─────┘   │
│   └──────┘   │  │   טקסט כאן   │  │  ┌──┐  ┌──┐  │
│              │  │              │  │  │2 │  │3 │  │
│  "עמוד מלא"  │  │  "2 למעלה"   │  │  └──┘  └──┘  │
└──────────────┘  └──────────────┘  │  "1 + 2 קטנות"│
                                    └──────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ┌──┐ טקסט   │  │  ┌───┐┌───┐  │  │┌────────────┐│
│ │  │ כאן    │  │  │   ││   │  │  ││            ││
│ │1 │ ליד    │  │  │ 1 ││ 2 │  │  ││  Panorama  ││
│ │  │ התמונה │  │  │   ││   │  │  ││            ││
│ └──┘        │  │  └───┘└───┘  │  │└────────────┘│
│             │  │  ┌───┐┌───┐  │  │   טקסט כאן   │
│  "תמונה     │  │  │ 3 ││ 4 │  │  │              │
│   + טקסט"   │  │  └───┘└───┘  │  │  "פנורמה"    │
└──────────────┘  │  "גריד 2x2" │  └──────────────┘
                  └──────────────┘
```

**6 layouts מוכנים:**
1. **עמוד מלא** — תמונה אחת על כל העמוד (bleed)
2. **2 למעלה** — שתי תמונות בשורה עליונה, טקסט מתחת
3. **1 גדולה + 2 קטנות** — תמונה ראשית + שתי משניות
4. **תמונה + טקסט** — תמונה בצד, טקסט עוטף (float)
5. **גריד 2×2** — ארבע תמונות שוות בגריד
6. **פנורמה** — תמונה רחבה שתופסת רוחב מלא, טקסט מתחת

**איך זה עובד:**
- לחיצה על "Add Image" → popup עם בחירת layout
- בחירת layout → placeholders מופיעים בעמוד
- גרירת תמונות ל-placeholders (או upload ישירות)
- אפשר לערוך: crop, zoom, rotate, frame style
- כל layout שומר על margins ותואם את שאר הספר

#### B. מסגרות תמונה (Image Frames)
כל תמונה יכולה לקבל מסגרת:

| סגנון | תיאור | שימוש |
|--------|--------|--------|
| **ללא** | תמונה ללא מסגרת | מודרני, clean |
| **צל עדין** | drop-shadow רך | ברירת מחדל |
| **מסגרת דקה** | border 1px + padding | אלגנטי |
| **פולרואיד** | מסגרת לבנה עבה למטה (caption area) | נוסטלגי |
| **וינטג'** | מסגרת מוזהבת עם פינות דקורטיביות | חגיגי |
| **עגולה** | תמונה חתוכה לעיגול | פורטרטים |
| **מעוגלת** | border-radius: 12px | מודרני חם |

#### C. כיתובים לתמונות (Captions)
- כל תמונה יכולה לקבל **כיתוב** מתחת (caption)
- סגנון: italic, גודל קטן, צבע אפור — כמו בספרים אמיתיים
- AI מציע כיתוב אוטומטי מהטקסט שמסביב

---

## 17. 📷 "אלבום תמונות" — Photo Album Mode

### הרעיון
מצב חדש ביצירת ספר: **אלבום תמונות עם סיפור**. במקום להתחיל מטקסט ולהוסיף תמונות, מתחילים מתמונות ומוסיפים טקסט.

### זרימת המשתמש

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  צעד 1: "העלו תמונות"                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │         גררו תמונות לכאן                         │   │
│  │         או לחצו לבחירה מהמחשב                     │   │
│  │                                                  │   │
│  │    📁  ☁️ Google Photos  📱 WhatsApp             │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  צעד 2: "סדרו"                                          │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐       │
│  │01│ │02│ │03│ │04│ │05│ │06│ │07│ │08│ │09│  ...   │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘       │
│  ↕ גררו לשינוי סדר │ 🗑️ מחיקה │ ✂️ חיתוך │ 🔄 סיבוב  │
│                                                         │
│  צעד 3: "בחרו layout"                                   │
│  [1 per page] [2 per page] [4 per page] [Mix]           │
│                                                         │
│  צעד 4: "הוסיפו סיפור"                                  │
│  AI מציע: "ספרו לנו: מה קרה ביום הזה?"                  │
│  על כל תמונה/עמוד: שדה טקסט לכיתוב/סיפור               │
│                                                         │
│  צעד 5: "עיצוב"                                         │
│  [בחירת תבנית אלבום] → AI מעצב אוטומטית                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Templates ייעודיים לאלבום

| תבנית | תיאור | layout |
|--------|--------|---------|
| **"אלבום קלאסי"** | רקע שמנת, מסגרות פולרואיד, כיתובים בכתב יד | 1-2 תמונות/עמוד |
| **"מודרני"** | רקע לבן, תמונות bleed, טקסט מינימלי | 1 תמונה גדולה/עמוד |
| **"סקראפבוק"** | רקע טקסטורה, תמונות בזוויות שונות, stickers, washi tape | 3-4 תמונות/עמוד |
| **"קולאז'"** | תמונות חופפות, ללא מסגרת, אפקט שכבות | 4-6 תמונות/עמוד |
| **"יומן תמונות"** | תאריך + מקום + תמונה + טקסט בכל עמוד | 1 תמונה + טקסט |

### כלי עריכת תמונות בסיסי (In-App)
לא Photoshop — רק מה שקהל היעד צריך:

- **חיתוך** — crop עם יחסי מידה מוכנים (4:3, 1:1, 16:9, free)
- **סיבוב** — 90° + fine rotation
- **פילטרים** — 6 פילטרים מוכנים:
  - Original (ללא שינוי)
  - Warm (חם — מגביר כתום/צהוב)
  - Vintage (וינטג' — sepia + grain)
  - B&W (שחור-לבן)
  - Bright (בהיר — מגביר exposure)
  - Dramatic (דרמטי — high contrast)
- **שיפור AI** — כפתור אחד "שפר תמונה" שמתקן אוטומטית (exposure, sharpness, color)
- **שחזור תמונות ישנות** — AI upscale + colorize לתמונות שחור-לבן

### פרומפטים לעיצוב מצב אלבום

```
Prompt (Album upload screen):
A warm, inviting photograph of a woman's hands (30s, wearing a 
simple gold ring) arranging old family photographs on a wooden 
table. Some photos are black-and-white, some are faded color from 
the 70s-80s. She is sorting them into neat groups/piles. A modern 
tablet showing the MeStory interface is visible in the corner. 
Soft overhead lighting, warm tones, close-up hands shot, editorial 
style, conveys the feeling of organizing precious memories. 
8K resolution, shallow depth of field.
```

```
Prompt (Album template: Classic):
A product photograph of an open photo album on a cozy reading 
chair. The album shows two pages: left page has a vintage 
Polaroid-style photograph of a family dinner (1980s Israeli 
style), with a handwritten caption below in Hebrew. Right page 
has two smaller photographs arranged diagonally with decorative 
corner mounts. The album has cream-colored pages with subtle 
texture. Warm reading lamp light, nostalgic, premium product 
photography, 8K.
```

```
Prompt (Album template: Scrapbook):
A creative flat-lay photograph of an open scrapbook page. The page 
features 3-4 photographs arranged at playful angles, held down by 
colorful washi tape strips. Between the photos: small hand-drawn 
hearts, stars, and Hebrew text in different colored pens. Stickers, 
dried flowers, and ticket stubs are scattered among the photos. 
The overall feeling is warm, personal, and lovingly crafted. 
Bright, even lighting, shot from directly above, craft/DIY 
aesthetic, 8K resolution.
```

### איך מצב אלבום מופיע ב-Dashboard

כרטיס חדש (5th card) בגריד יצירת ספר:

```
┌─────────────────────────┐
│      📸                  │
│   [תמונת אלבום פתוח]    │
│                         │
│   אלבום תמונות          │
│   העלו תמונות, סדרו     │
│   והמערכת תעצב ספר יפה  │
│                         │
│   🖼️ התחלה מתמונות      │
└─────────────────────────┘
```

```
Prompt (Dashboard card: Album):
A beautiful overhead photograph of an open photo album with empty 
cream-colored pages and scattered photographs waiting to be placed. 
A few photos are already arranged on the left page with corner 
mounts. Golden stickers and a small jar of glue are visible. The 
mood is creative anticipation — ready to arrange memories. Warm 
afternoon light, styled product photography, inviting and 
accessible, 8K resolution.
```

---

---

## 18. 📚 תבניות ספר — מגוון רחב ורלוונטי לקהל היעד

### עיקרון: אפס תבניות "לסופרים" — הכל לאנשים עם סיפור

כל התבניות הישנות (fiction, fantasy, sci-fi, romance, thriller וכו') **נמחקות**. רק תבניות שרלוונטיות לקהל היעד: אנשים רגילים שרוצים לספר את הסיפור שלהם.

### 15 התבניות החדשות

| # | שם | id | קטגוריה | צבעים | למי |
|---|-----|-----|---------|--------|-----|
| 1 | **סיפור חיי** | my-life-story | autobiography | cream/brown | כל אחד שרוצה לתעד חיים |
| 2 | **לזכרו/ה** | in-memory | memorial | navy/gold | משפחות שכולות |
| 3 | **סבא/סבתא מספרים** | grandparents-tell | family-history | sepia/cream | דור מבוגר |
| 4 | **ספר מתנה** | gift-book | gift | burgundy/gold | מתנה אישית |
| 5 | **יומן מסע** | travel-journal-personal | travel | teal/orange | מטיילים |
| 6 | **ספר מתכונים משפחתי** | family-recipes | family | warm cream/rustic brown | כל משפחה |
| 7 | **סיפור אהבה** | love-story | gift | blush pink/deep rose | זוגות |
| 8 | **הגיבור שלנו** | military-memorial | memorial | olive/gold | משפחות חיילים |
| 9 | **מסע בזמן** | time-journey | autobiography | retro sepia | דור מבוגר |
| 10 | **ילד/ה שלי** | my-child | family | pastel lavender/sage | הורים צעירים |
| 11 | **שורשים** | family-roots | family-history | earth brown | משפחות |
| 12 | **יומן קהילתי** | community-journal | community | warm olive | קיבוצים, מושבים, שכונות |
| 13 | **פרק חדש** | new-chapter | autobiography | sunrise amber/coral | מעבר חיים (פרישה, גירושין, מעבר) |
| 14 | **זיכרונות מהצבא** | army-memories | memorial | olive/khaki | חיילים משוחררים |
| 15 | **הנכדים מספרים** | grandchildren-tell | family | sunshine yellow/orange | נכדים לסבא/סבתא |

### מה נמחק
כל תבנית "גנרית לסופרים":
- Classic Novel, Modern Fiction, Sci-Fi, Fantasy, Romance, Thriller, Mystery
- Poetry Collection, Children's Book (generic), Academic, Business
- כל דבר שלא קשור ישירות לסיפור אישי/משפחתי/הנצחה

### קטגוריות חדשות
| קטגוריה | תיאור בעברית | אייקון |
|---------|-------------|--------|
| autobiography | סיפור חיים | 📖 |
| memorial | הנצחה | 🕯️ |
| family-history | היסטוריה משפחתית | 🌳 |
| family | משפחה | 👨‍👩‍👧‍👦 |
| gift | מתנה | 🎁 |
| travel | מסע | ✈️ |
| community | קהילה | 🏘️ |

---

*תוכנית עיצוב — MeStory — 16 באפריל 2026*
*עדכון: נוסף ניהול תמונות + אלבום תמונות + 15 תבניות ממוקדות קהל יעד*