import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';

const uuidv4 = () => crypto.randomUUID();
const now = () => new Date().toISOString();

// ================ IMAGE HELPERS ================
// Use picsum.photos - reliable, free, deterministic by seed
const coverImg = (seed: string) => `https://picsum.photos/seed/${seed}/800/1200`;
const inlineImg = (seed: string) => `https://picsum.photos/seed/${seed}/800/500`;
const avatarImg = (seed: string) => `https://picsum.photos/seed/${seed}-avatar/200/200`;

// ================ DESIGN PRESETS ================
interface DesignStyle {
  font: string; // primary font for chapter body
  titleFont: string; // font for title on cover
  accentColor: string; // for dropcaps, dividers, pull-quotes
  divider: 'stars' | 'flourish' | 'line' | 'dots' | 'wave';
  titleSize: number;
  titlePosition: { x: number; y: number };
  authorPosition: { x: number; y: number };
  pullQuoteIndex?: number; // if set, paragraph at this index is rendered as a pull quote
}

const DEFAULT_DESIGN: DesignStyle = {
  font: 'Heebo',
  titleFont: 'Heebo',
  accentColor: '#c9a874',
  divider: 'stars',
  titleSize: 42,
  titlePosition: { x: 50, y: 32 },
  authorPosition: { x: 50, y: 85 },
};

const DIVIDERS: Record<DesignStyle['divider'], string> = {
  stars: '✦ ✧ ✦',
  flourish: '❦ ❦ ❦',
  line: '— · — · —',
  dots: '• • •',
  wave: '〜 〜 〜',
};

// ================ CONTENT HELPERS ================
interface ChapterInput {
  title: string;
  paragraphs: string[];
  imageSeeds?: string[]; // one image inserted after paragraph at that index
}

function buildChapter(ch: ChapterInput, order: number, design: DesignStyle) {
  const imgSeeds = ch.imageSeeds || [];
  const accent = design.accentColor;
  const fontFamily = design.font;
  const dividerText = DIVIDERS[design.divider];
  const pullIdx = design.pullQuoteIndex;

  const dividerHtml = `<div style="text-align:center;margin:32px 0;color:${accent};font-size:18px;letter-spacing:8px;">${dividerText}</div>`;

  const parts: string[] = [
    `<div style="font-family:'${fontFamily}',serif;line-height:1.8;direction:rtl;">`,
    `<h2 class="chapter-title" style="font-family:'${design.titleFont}',serif;color:${accent};text-align:center;font-size:32px;font-weight:600;margin:24px 0 8px;letter-spacing:1px;">${ch.title}</h2>`,
    dividerHtml,
  ];

  ch.paragraphs.forEach((p, i) => {
    if (i === pullIdx) {
      // Pull quote styling
      parts.push(
        `<blockquote style="border-right:3px solid ${accent};padding:16px 24px 16px 16px;margin:24px 0;font-size:20px;font-style:italic;color:#3a3a3a;background:rgba(0,0,0,0.02);border-radius:4px;">${p}</blockquote>`
      );
    } else if (i === 0) {
      // Drop cap on first paragraph
      const first = p.charAt(0);
      const rest = p.slice(1);
      parts.push(
        `<p style="text-align:justify;margin:16px 0;text-indent:0;"><span style="float:right;font-size:54px;line-height:0.9;color:${accent};font-weight:700;padding:6px 0 0 8px;font-family:'${design.titleFont}',serif;">${first}</span>${rest}</p>`
      );
    } else {
      parts.push(`<p style="text-align:justify;margin:16px 0;text-indent:1.5em;">${p}</p>`);
    }

    if (imgSeeds[i]) {
      parts.push(
        `<figure style="margin:32px 0;text-align:center;">` +
          `<img src="${inlineImg(imgSeeds[i])}" alt="" style="max-width:100%;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.18);border:4px solid ${accent}22;"/>` +
        `</figure>`
      );
    }
  });

  parts.push(dividerHtml);
  parts.push('</div>');

  const wordCount = ch.paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
  return {
    _id: uuidv4(),
    title: ch.title,
    order,
    wordCount,
    content: parts.join('\n'),
  };
}

function buildCover(
  title: string,
  authorName: string,
  authorBio: string,
  authorAvatarSeed: string,
  colors: string[],
  coverSeed: string,
  design: DesignStyle,
  subtitle?: string
) {
  const front: any = {
    type: 'uploaded' as const,
    imageUrl: coverImg(coverSeed),
    gradientColors: colors,
    backgroundColor: colors[0],
    overlayColor: 'rgba(0,0,0,0.4)',
    title: {
      text: title,
      font: design.titleFont,
      size: design.titleSize,
      color: '#FFFFFF',
      position: design.titlePosition,
      shadow: '0 4px 12px rgba(0,0,0,0.6)',
      letterSpacing: 2,
    },
    authorName: {
      text: authorName,
      font: design.font,
      size: 18,
      color: '#F4E4BC',
      position: design.authorPosition,
      letterSpacing: 1,
    },
    decorativeBorder: {
      color: design.accentColor,
      width: 3,
      style: 'double',
    },
  };
  if (subtitle) {
    front.subtitle = {
      text: subtitle,
      font: design.font,
      size: 16,
      color: '#E8D8B5',
      position: { x: 50, y: 48 },
      style: 'italic',
    };
  }
  return {
    front,
    back: {
      backgroundColor: colors[colors.length - 1],
      synopsis: '',
      authorBio,
      authorPhoto: {
        url: avatarImg(authorAvatarSeed),
        position: { x: 25, y: 75 },
        size: 100,
      },
      accentColor: design.accentColor,
    },
    spine: {
      width: 22,
      backgroundColor: colors[0],
      title: { text: title, font: design.titleFont, size: 14, color: '#FFFFFF', letterSpacing: 1.5 },
      author: { text: authorName, font: design.font, size: 11, color: '#F4E4BC' },
      ornament: design.divider,
    },
  };
}

function buildStats(chapters: any[], charactersCount: number) {
  const wordCount = chapters.reduce((a, c) => a + c.wordCount, 0);
  const pageCount = Math.max(1, Math.ceil(wordCount / 250));
  return {
    wordCount,
    pageCount,
    chapterCount: chapters.length,
    characterCount: charactersCount,
    views: Math.floor(Math.random() * 400) + 80,
    purchases: 0,
    revenue: 0,
    averageRating: 4.6 + Math.random() * 0.4,
    totalReviews: 3,
    shares: Math.floor(Math.random() * 25),
    comments: Math.floor(Math.random() * 12),
  };
}

function buildQuality(score = 87) {
  return {
    overallScore: score,
    rating: 5,
    ratingLabel: 'Excellent' as const,
    categories: {
      writingQuality: { score, weight: 25 },
      plotStructure: { score: score - 2, weight: 20 },
      characterDevelopment: { score: score - 1, weight: 20 },
      dialogue: { score: score - 3, weight: 15 },
      setting: { score: score + 1, weight: 10 },
      originality: { score, weight: 10 },
    },
    evaluatedAt: now(),
    evaluatedBy: 'ai' as const,
  };
}

function buildReviews(items: Array<{ name: string; rating: number; comment: string }>) {
  return items.map((r) => ({
    _id: uuidv4(),
    user: uuidv4(),
    userName: r.name,
    rating: r.rating,
    comment: r.comment,
    createdAt: now(),
  }));
}

// ================ AUTHOR DEFINITIONS ================
interface AuthorDef {
  key: string;
  name: string;
  email: string;
  bio: string;
  avatarSeed: string;
}

const AUTHORS: AuthorDef[] = [
  { key: 'sarah_holocaust', name: 'שרה כהן', email: 'sarah.kohen@mestory-demo.com', bio: 'ניצולת שואה, ילידת ורשה 1935. עברה את אושוויץ-בירקנאו והגיעה לארץ ב-1948.', avatarSeed: 'sarah-grandma' },
  { key: 'danny_lebanon', name: 'דני לוי', email: 'danny.levi@mestory-demo.com', bio: 'לוחם גולני במילואים, לחם במלחמת לבנון השנייה בקרבות בנט ג׳בייל.', avatarSeed: 'danny-soldier' },
  { key: 'noa_nova', name: 'נועה ברקת', email: 'noa.barkat@mestory-demo.com', bio: 'שורדת מסיבת הנובה. הייתה בת 24 ב-7 באוקטובר 2023, ברחה ברחל בבוקר.', avatarSeed: 'noa-nova' },
  { key: 'yaakov_yomkippur', name: 'יעקב שפירא', email: 'yaakov.shapira@mestory-demo.com', bio: 'טנקיסט בחטיבה 7, לחם ברמת הגולן במלחמת יום כיפור 1973.', avatarSeed: 'yaakov-tank' },
  { key: 'menachem_palmach', name: 'מנחם רוזן', email: 'menachem.rozen@mestory-demo.com', bio: 'לוחם פלמ״ח, לחם במלחמת השחרור 1948 בקרבות על ירושלים.', avatarSeed: 'menachem-palmach' },
  { key: 'ilana_ethiopia', name: 'אילנה דמוז', email: 'ilana.damoz@mestory-demo.com', bio: 'עולה מאתיופיה, עלתה ארצה במבצע משה 1984 כילדה בת 9.', avatarSeed: 'ilana-ethiopia' },
  { key: 'marina_ussr', name: 'מרינה גולדברג', email: 'marina.goldberg@mestory-demo.com', bio: 'עולה ממוסקבה, הגיעה ארצה ב-1991 עם משפחתה.', avatarSeed: 'marina-russia' },
  { key: 'yossi_entebbe', name: 'יוסי רז', email: 'yossi.raz@mestory-demo.com', bio: 'לוחם סיירת מטכ״ל. השתתף במבצע אנטבה 1976.', avatarSeed: 'yossi-sayeret' },
  { key: 'rachel_terror', name: 'רחל כץ', email: 'rachel.katz@mestory-demo.com', bio: 'שורדת פיגוע התאבדות בקפה מומנט ירושלים 2002.', avatarSeed: 'rachel-survivor' },
  { key: 'michal_bereaved', name: 'מיכל פרידמן', email: 'michal.friedman@mestory-demo.com', bio: 'אם שכולה. בנה הבכור נפל ב-7 באוקטובר בקיבוץ בארי.', avatarSeed: 'michal-mother' },
  { key: 'ron_firefighter', name: 'רון שמעוני', email: 'ron.shimoni@mestory-demo.com', bio: 'כבאי-מציל, פעל בעוטף עזה בשבועות אחרי 7/10.', avatarSeed: 'ron-firefighter' },
  { key: 'tamar_doctor', name: 'ד״ר תמר הרוש', email: 'tamar.harosh@mestory-demo.com', bio: 'רופאה מנתחת בסורוקה, ניהלה חדר מיון בשעות הראשונות של 7/10.', avatarSeed: 'tamar-doctor' },
  { key: 'eyal_pilot', name: 'אייל ברמן', email: 'eyal.berman@mestory-demo.com', bio: 'טייס F-4 פנטום, לחם במלחמת יום כיפור בחזית סיני.', avatarSeed: 'eyal-pilot' },
  { key: 'liat_fighter', name: 'ליאת קרן', email: 'liat.keren@mestory-demo.com', bio: 'לוחמת ביחידה מעורבת בצנחנים. שירתה בגבול מצרים וסוריה.', avatarSeed: 'liat-fighter' },
  { key: 'gadi_madrich', name: 'גדי שחר', email: 'gadi.shachar@mestory-demo.com', bio: 'מדריך נוער בתנועת הצופים בכפר עוטף. הציל ילדים ב-7/10.', avatarSeed: 'gadi-madrich' },
  { key: 'ofer_beeri', name: 'עופר ברזילי', email: 'ofer.barzilai@mestory-demo.com', bio: 'חבר קיבוץ בארי דור שני. שרד את 7/10 בממ״ד עם משפחתו.', avatarSeed: 'ofer-kibbutz' },
  { key: 'yonatan_miluim', name: 'יונתן גולן', email: 'yonatan.golan@mestory-demo.com', bio: 'קצין מילואים, גויס ב-7/10, שירת בצפון ובעזה 200 יום.', avatarSeed: 'yonatan-reserve' },
  { key: 'avraham_katif', name: 'אברהם לוינסון', email: 'avraham.levinson@mestory-demo.com', bio: 'חקלאי מגוש קטיף שחוויה את ההתנתקות 2005.', avatarSeed: 'avraham-katif' },
  { key: 'rivka_maroc', name: 'רבקה אלמלח', email: 'rivka.almalich@mestory-demo.com', bio: 'עלתה ממרוקו ב-1957 כילדה. גדלה במעברת שער העלייה.', avatarSeed: 'rivka-maroc' },
  { key: 'samer_druze', name: 'סאמר חלבי', email: 'samer.halabi@mestory-demo.com', bio: 'חייל דרוזי מרמת הגולן, שירת בגבעתי 5 שנים.', avatarSeed: 'samer-druze' },
  { key: 'yosef_menashe', name: 'יוסף מנחם', email: 'yosef.menachem@mestory-demo.com', bio: 'עולה מבני מנשה הודו. עלה ב-2007 לנצרת עילית.', avatarSeed: 'yosef-menashe' },
  { key: 'moshe_poland', name: 'משה אייזנברג', email: 'moshe.eisenberg@mestory-demo.com', bio: 'יליד פולין 1930. סבא מספר לנכדיו את סיפורו.', avatarSeed: 'moshe-grandpa' },
  { key: 'hanna_attrition', name: 'חנה דוד', email: 'hanna.david@mestory-demo.com', bio: 'אלמנת מלחמת ההתשה. בעלה נפל במוצב התעלה 1969.', avatarSeed: 'hanna-widow' },
];

// ================ BOOK DEFINITIONS ================
interface BookDef {
  authorKey: string;
  title: string;
  subtitle?: string;
  genre: string;
  description: string;
  synopsis: string;
  tags: string[];
  ageRating: 'G' | 'PG' | 'PG-13' | 'R' | '18+';
  coverSeed: string;
  coverColors: string[];
  design?: Partial<DesignStyle>;
  chapters: ChapterInput[];
  characters: Array<{ name: string; age?: number; description: string; traits: string[]; backstory?: string }>;
  reviews: Array<{ name: string; rating: number; comment: string }>;
  qualityScore?: number;
}

const BOOKS: BookDef[] = [
  // ---------- BOOK 1: Holocaust ----------
  {
    authorKey: 'sarah_holocaust',
    title: 'העיניים שראו את הכל',
    genre: 'Memoir',
    description: 'סיפורה של ילדה יהודייה שנלקחה מוורשה לאושוויץ ושרדה לספר.',
    synopsis: 'הייתי בת שבע כשהגרמנים נכנסו לוורשה. בת תשע כשנסעתי ברכבת לאושוויץ. בת אחת עשרה כשיצאתי משם, בלי משפחה, בלי שם, רק עם מספר על היד. זה הסיפור שלי - איך שרדתי, ואיך למדתי לחיות שוב.',
    tags: ['שואה', 'זיכרון', 'ניצולים', 'היסטוריה', 'יהדות'],
    ageRating: 'PG-13',
    coverSeed: 'holocaust-memoir',
    coverColors: ['#1a1a1a', '#4a3c2e', '#8b7355'],
    chapters: [
      {
        title: 'פרק א׳ - הבית בוורשה',
        imageSeeds: ['warsaw-street', 'warsaw-family'],
        paragraphs: [
          'נולדתי בוורשה בשנת 1935, בת בכורה להוריי יעקב ורחל. היינו משפחה קטנה, חמה, שגרה בקומה שלישית מעל חנות הספרים של אבא ברחוב נלבקי. אני זוכרת את הריח של הדפים הישנים, את הצחוק של אמא, את הזמירות של שבת.',
          'הילדות שלי הייתה רגילה - בית ספר, חברות, חלומות להיות מורה. הורי דיברו איתי יידיש בבית, פולנית ברחוב. בערבי שבת היינו שרים יחד, ואבא היה מספר לי סיפורים על סבא וסבתא שגרו בכפר.',
          'בספטמבר 1939 הכל השתנה. שמעתי לראשונה את הצליל של פצצות, ראיתי את אבא חוזר הביתה חיוור. "הגרמנים פה," הוא אמר בקול שקט. באותו לילה אמא חיבקה אותי חזק ולחשה: "אהבה שלי, מה שיקרה - זכרי שאני אוהבת אותך. תמיד."',
          'תוך שבועות מעטים הוקם הגטו. העולם שלי הצטמצם לכמה רחובות, לחדר אחד שחלקנו עם שתי משפחות אחרות. אבל עדיין היינו יחד. עדיין הייתה תקווה.',
        ],
      },
      {
        title: 'פרק ב׳ - הרכבת',
        imageSeeds: ['train-tracks', 'barbed-wire'],
        paragraphs: [
          'היה זה באוגוסט 1942 כשהגיעו האסונות. אבא נשלח למחנה עבודה ולא חזר. אמא ואני נשארנו לבדנו, רעבות, פוחדות. כל יום הייתה עוד אקציה, עוד שכנים שנעלמו.',
          'ביום השילוח שלנו, אמא הלבישה אותי בשני שמלות, זו על גבי זו. "ככה יהיה לך חם," היא אמרה, למרות שהיה אוגוסט. בכיס של השמלה היא תפרה צילום משפחתי קטן. "אל תאבדי אותו," היא לחשה.',
          'הרכבת הייתה ארוכה ושחורה. הדחפו אותנו לקרונות בלי חלונות, בלי מים, בלי אוויר. שלושה ימים נסענו. זקנה אחת מתה לידי. אמא כיסתה לי את העיניים, אבל הריח - הריח נשאר איתי כל החיים.',
          'כשהדלתות נפתחו באושוויץ, האור סנוור אותי. שמעתי כלבים נובחים, צעקות בגרמנית, קולות של ילדים שבוכים. וראיתי את ארובת העשן. לא הבנתי עדיין, אבל משהו בתוכי ידע.',
        ],
      },
      {
        title: 'פרק ג׳ - לחיות אחרי',
        imageSeeds: ['dawn-light', 'israel-shore'],
        paragraphs: [
          'שחרור ינואר 1945. הרוסים פתחו את השערים. הייתי בת אחת עשרה, שוקלת 22 קילו, ללא הורים, ללא אחים. רק מספר על היד: A-7834. זה היה השם שלי לשנתיים וחצי.',
          'עברתי דרך בתי יתומים בפולין, בית מעבר בגרמניה, אניית מעפילים שנתפסה בקפריסין. רק ב-1948, אחרי הקמת המדינה, הגעתי סוף סוף לחיפה. על הרציף בכיתי בפעם הראשונה מאז הגטו.',
          'התיישבתי בקיבוץ בעמק. למדתי עברית, התחתנתי עם דוד, ניצול מליטא. גידלנו שלושה ילדים, ואז שבעה נכדים. כל אחד מהם שאלה לעצמה: בזכות מי אני חיה? בזכות מי הם חיים?',
          'אני כותבת את זה עכשיו, בגיל תשעים, כי הזמן אוזל. כי יש אנשים שאומרים שזה לא קרה. כי אני רוצה שהנכדים שלי, והנכדים של הנכדים, ידעו. לא רק את הכאב. גם את הגבורה. גם את האהבה שלא נגמרה, גם כשהעולם ניסה לכבות אותה.',
        ],
      },
    ],
    characters: [
      { name: 'שרה (אני)', age: 7, description: 'הילדה שהייתי בוורשה, שנקרעה מעולמה', traits: ['רגישה', 'סקרנית', 'חזקה יותר ממה שהאמינה'], backstory: 'בת בכורה, אהבה ספרים ושירה' },
      { name: 'אמא רחל', age: 32, description: 'אמי, שהציעה את חייה כדי שאחיה', traits: ['אמיצה', 'אוהבת', 'חכמה'] },
      { name: 'אבא יעקב', age: 36, description: 'חנווני ספרים, נעלם ב-1942', traits: ['רגוע', 'מאמין', 'נעלם'] },
    ],
    reviews: [
      { name: 'מורה להיסטוריה', rating: 5, comment: 'קריאת חובה. הספר הזה הוא עדות חיה שחייבת לעבור מדור לדור.' },
      { name: 'נכדה של ניצול', rating: 5, comment: 'בכיתי בכל פרק. תודה שרה ששיתפת אותנו בסיפור שלך.' },
      { name: 'קורא צעיר', rating: 5, comment: 'לא ידעתי כמעט כלום. עכשיו אני מבין.' },
    ],
    qualityScore: 94,
  },

  // ---------- BOOK 2: Second Lebanon War ----------
  {
    authorKey: 'danny_lebanon',
    title: 'בנט ג׳בייל - 33 ימים',
    genre: 'Military Memoir',
    description: 'זיכרונות של לוחם גולני מקרבות בנט ג׳בייל במלחמת לבנון השנייה.',
    synopsis: 'ביולי 2006 גדוד 51 של גולני נכנס לבנט ג׳בייל. מה שהיה אמור להיות מבצע של שעות הפך למלחמה של שבועות. שמונה חברים שלי לא חזרו. זה הסיפור שלהם, ושלי - איך התחלנו כצעירים ויצאנו אנשים אחרים.',
    tags: ['צבא', 'מלחמה', 'לבנון', 'גולני', 'זיכרון'],
    ageRating: 'PG-13',
    coverSeed: 'lebanon-war',
    coverColors: ['#2c3e2f', '#5d6f4a', '#8b9868'],
    chapters: [
      {
        title: 'פרק א׳ - הקריאה',
        imageSeeds: ['military-base', 'soldiers-briefing'],
        paragraphs: [
          'ביולי 2006 הייתי בן 21, סמל בגדוד 51. שבועיים לפני הפלישה הייתי בחופשה, בחוף בתל אביב עם נעמה. אכלנו גלידה, צחקנו, חלמנו על הטיול שנצא אליו אחרי השחרור. היא אמרה "אני מחכה לך". לא ידעתי שאני לא אחזור אותו אדם.',
          'הקריאה הגיעה בלילה. חיזבאללה חטף את אהוד גולדווסר ואלדד רגב. למחרת כבר היינו על גבול לבנון. הציוד היה כבד, החום הרג. הפקודה הייתה פשוטה - להיכנס לבנט ג׳בייל, לנקות את הכפר מחיזבאללה.',
          'הייתי אחראי על שמונה לוחמים. הצעיר ביותר, איציק, היה בן 19, ילד טוב מבאר שבע, עם אחות שעמדה להתחתן. הגדול, אורי, בן 22, מהגליל. כולם היו החברים שלי. כולם סמכו עלי.',
        ],
      },
      {
        title: 'פרק ב׳ - הקרב',
        imageSeeds: ['destroyed-building', 'smoke-city'],
        paragraphs: [
          'נכנסנו לכפר בלילה. השקט היה מוזר. מדי פעם יללה של כלב, וכלום. אחרי שעה התחילו הירי. טילי RPG מכל כיוון. הבתים היו מלכודת - בכל חלון יכול היה להיות לוחם.',
          'ביום השלישי איבדנו את איציק. הוא רץ לחלץ חבר פצוע, ומטוס הגיע מהחלון. הוא מת לפני שהגעתי אליו. לא הספקתי לדבר איתו. לא יכולתי להתקשר לאמא שלו. הסמ"פ לקח את הנשק שלו, ואני המשכתי.',
          'שמונה ימים לחמנו על הבתים. כל מטר היה בתשלום. בלילות ישנו ברוטציה - שעה כל אחד. אכלנו קרבי מנ"מ. שתיתי מים שהטעם שלהם היה פלסטיק. חשבתי על נעמה, ועל איציק, ועל איך עד לפני שבוע חיינו חיים אחרים לגמרי.',
        ],
      },
      {
        title: 'פרק ג׳ - שובה של הלב',
        imageSeeds: ['memorial-stones', 'family-reunion'],
        paragraphs: [
          'ב-14 באוגוסט 2006 הופסקה האש. יצאנו מבנט ג׳בייל מוכים, שחוקים, חסרים. מהגדוד שלי שמונה לוחמים לא חזרו. שלושים וארבעה נפצעו. את חלקם אני עוד פוגש היום, עשרים שנה אחרי.',
          'כשחזרתי הביתה, נעמה חיכתה לי בשדה התעופה. היא בכתה כשראתה אותי. "אתה אחר," היא אמרה. היא צדקה. לקח לי שנים להבין כמה הקרב נשאר איתי - בחלומות, בזיקוקים בלילה, בכל צליל חד.',
          'היום אני אבא לשלושה. הבכור שלי, איציק, נקרא על שם החבר שלי. כל שנה בטקס הזיכרון אני עומד מול ההורים שלו. אין לי מילים. אבל אני שם. זה מה שאני יכול לתת.',
          'כתבתי את הספר הזה כדי שאנשים ידעו. לא סיפור הירואי. סיפור אמיתי - עם הפחד, עם הטעויות, עם הכאב. שמונה חברים שלי ראויים ליותר מאנדרטה. הם ראויים שיזכרו אותם כאנשים.',
        ],
      },
    ],
    characters: [
      { name: 'דני (המספר)', age: 21, description: 'סמל בגולני, מפקד חוליה', traits: ['אחראי', 'שקט', 'נאמן'] },
      { name: 'איציק', age: 19, description: 'לוחם מבאר שבע, נפל בקרב', traits: ['צעיר', 'אמיץ', 'חברותי'] },
      { name: 'נעמה', age: 20, description: 'בת הזוג שחיכתה בבית', traits: ['סבלנית', 'חזקה', 'אוהבת'] },
    ],
    reviews: [
      { name: 'אמא של חייל', rating: 5, comment: 'כל הורה של חייל חייב לקרוא את זה. תודה דני על הכנות.' },
      { name: 'חייל במילואים', rating: 5, comment: 'גם אני הייתי שם. דני כתב בשביל כולנו.' },
      { name: 'קוראת', rating: 4, comment: 'כואב וחשוב. לא תמיד קל לקרוא אבל חובה.' },
    ],
    qualityScore: 89,
  },

  // ---------- BOOK 3: October 7 - Nova ----------
  {
    authorKey: 'noa_nova',
    title: 'הבוקר שלא נגמר',
    genre: 'Memoir',
    description: 'סיפורה של שורדת ממסיבת הנובה ב-7 באוקטובר.',
    synopsis: 'הגעתי לנובה עם שני חברים. יצאתי לבד. שמונה שעות רצתי, התחבאתי, ראיתי את האימה בעיניים. זה הסיפור שלי - איך קרה, איך שרדתי, ואיך אני לומדת לחיות אחרי.',
    tags: ['שבעה באוקטובר', 'נובה', 'טרור', 'שורדים', 'עדות'],
    ageRating: 'R',
    coverSeed: 'nova-dawn',
    coverColors: ['#2d1b3d', '#8b5a9e', '#e8a5c7'],
    chapters: [
      {
        title: 'פרק א׳ - לפני',
        imageSeeds: ['desert-sunset', 'party-lights'],
        paragraphs: [
          'שבת בבוקר, 7 באוקטובר 2023. הגעתי לנובה עם שיר ויונתן בשתיים בלילה. שתינו שמפניה. רקדנו. היה יפה - שמיים מלאי כוכבים, מוזיקה, שלווה. חלמנו על הטיול לדרום אמריקה שתכננו אחרי.',
          'בשש ועשר בבוקר זה התחיל. קודם אלפי רקטות בשמיים - חשבנו שזה חלק מהשואו. ואז המוזיקה נפסקה. הקריין צעק "כולם לרדת, לברוח!". ואז שמעתי את היריות הראשונות.',
        ],
      },
      {
        title: 'פרק ב׳ - הבריחה',
        imageSeeds: ['field-running', 'hiding-bush'],
        paragraphs: [
          'רצתי. פשוט רצתי לכיוון שהיה רחוק מהיריות. איבדתי את שיר ויונתן בדקה הראשונה. ראיתי חברים נופלים. ראיתי מחבלים על טויוטות עם רובים. התחבאתי בין שיחים, לא נשמתי.',
          'שעה שלמה שכבתי במרחק 50 מטר מהמחבלים. שמעתי אותם מדברים בערבית, יורים לאוויר, צוחקים. כל פעם שזז משהו בשיחים ליד, הם ירו. אחד מהם עבר כל כך קרוב שראיתי את הנעליים שלו.',
          'כשהתרחקו, רצתי שוב. הגעתי לכביש. עצרתי מכונית של זוג - הם עצרו בשבילי למרות שהיה מסוכן. הם לקחו אותי עד אופקים. לא ידעתי את השמות שלהם. אני עדיין מחפשת אותם היום, להודות.',
        ],
      },
      {
        title: 'פרק ג׳ - אחרי',
        imageSeeds: ['memorial-candles', 'therapy-room'],
        paragraphs: [
          'שיר לא חזרה. יונתן נפצע קשה אבל חי. אנחנו עדיין חברים הכי טובים - ויש בינינו משהו שאף אחד אחר לא יכול להבין.',
          'שנה אחרי, אני בטיפול פעמיים בשבוע. יש לילות שאני לא ישנה. יש רעשים שזורקים אותי חזרה - דלת שנטרקת, הזיקוקים של ליל העצמאות. חייתי בישראל כל החיים ואני לומדת עכשיו להתחבא מהזיקוקים של עצמי.',
          'אני כותבת את זה כי הגיע הזמן. כי יש אלפי סיפורים כמו שלי. כי שיר זכתה בסיפור שלה שנגמר, ואני זכתה בסיפור שלי שחייב להימשך - בשביל שתינו.',
        ],
      },
    ],
    characters: [
      { name: 'נועה (המספרת)', age: 24, description: 'מעצבת גרפית מתל אביב', traits: ['יצירתית', 'חזקה', 'רגישה'] },
      { name: 'שיר', age: 23, description: 'חברה הטובה, נפלה בנובה', traits: ['שמחה', 'נאמנה', 'מלאת חיים'] },
      { name: 'יונתן', age: 25, description: 'חבר, נפצע ושרד', traits: ['אמיץ', 'שקט', 'עמיד'] },
    ],
    reviews: [
      { name: 'תרפיסטית', rating: 5, comment: 'עדות חשובה. תעזור לשורדים ולמי שאוהב אותם.' },
      { name: 'דור ה-7/10', rating: 5, comment: 'נועה - אני גם הייתי שם. תודה על המילים שאני לא מצליחה לומר.' },
      { name: 'קורא', rating: 5, comment: 'כואב, אמיתי, הכרחי.' },
    ],
    qualityScore: 92,
  },

  // ---------- BOOK 4: Yom Kippur War ----------
  {
    authorKey: 'yaakov_yomkippur',
    title: 'שלושת הימים שעצרו את סוריה',
    genre: 'Military Memoir',
    description: 'זיכרונות של מפקד טנק בחטיבה 7 מקרבות עמק הבכא 1973.',
    synopsis: '6 באוקטובר 1973. הייתי בן 22, מפקד טנק. בשלושה ימים של קרב, חטיבה 7 עצרה 1,400 טנקים סוריים. אנחנו היינו 100. זה איך זה היה.',
    tags: ['יום כיפור', 'טנקים', 'גולן', '1973', 'צבא'],
    ageRating: 'PG-13',
    coverSeed: 'tank-golan',
    coverColors: ['#3d3d2a', '#6b6b4a', '#a89668'],
    chapters: [
      {
        title: 'פרק א׳ - היום שהכל השתבש',
        imageSeeds: ['tank-dust', 'golan-heights'],
        paragraphs: [
          'הייתי במוצב במוצב דן על הגולן, יום כיפור בבוקר. ישבנו, שני חיילים ואני, על הטנק. אמרנו שקדיש בתענית. ואז בשתיים בצהריים המוצב החל לרעוד - פגזים סוריים.',
          'תוך שעה היינו באוויר. עשרה טנקים שלנו נגד חמש מאות שלהם. זה לא היה קרב, זה היה טבח. אבל היינו חייבים להחזיק. כי מאחורינו, במרחק שעה, ישבו ילדים ונשים.',
        ],
      },
      {
        title: 'פרק ב׳ - עמק הבכא',
        imageSeeds: ['smoke-battle', 'night-flares'],
        paragraphs: [
          'שלושה ימים לא יצאנו מהטנק. אכלנו קרב. שתינו מים מהכוס. ישנתי דקות. המדריך שלי מת ביום השני. היינו חמישה טנקים מתוך תריסר. ואז ארבעה. ואז שלושה.',
          'הלילה היה הדבר הכי מוזר. הסורים שלחו טנקים בחשיכה מוחלטת. ראינו אותם רק דרך הזיכוקים. היינו יורים, מחכים לאש חוזרת כדי לדעת איפה הם. המבצע קראו לנו צוללים בחושך.',
          'ביום השלישי, כשהגיעה תגבורת, נותרנו בחיים 30 לוחמים מתוך 100. יצאנו מהטנק שחורים מפיח, חרשים מהרעש. הסמ"פ חיבק אותי. "יעקב," הוא אמר, "הצלת את המדינה." לא הבנתי אז. היום אני מבין.',
        ],
      },
      {
        title: 'פרק ג׳ - החיים אחרי',
        imageSeeds: ['memorial-plaque', 'grandchildren-playing'],
        paragraphs: [
          'חזרתי הביתה. התחתנתי, גידלתי ארבעה ילדים. עבדתי כמהנדס 40 שנה. אבל כל יום כיפור, כשהצופר בוכה, אני חוזר לעמק הבכא.',
          'השנה, בן בני נכנס לחטיבה 7. אותה חטיבה שלי. נתתי לו את התגים הישנים שלי. "סבא," הוא אמר, "אתה לא חושש?" עניתי: "אני גאה, יותר ממה שאתה יודע."',
          'כתבתי את זה בשביל הנכדים שלי, ובשביל אלו שלא חזרו. אחד אחד אני זוכר. יואל, אברהם, דוד, מנשה. שמות שלא שכחתי 50 שנה. ולא אשכח.',
        ],
      },
    ],
    characters: [
      { name: 'יעקב (המספר)', age: 22, description: 'מפקד טנק בחטיבה 7', traits: ['שקט', 'אחראי', 'נחוש'] },
      { name: 'יואל', age: 20, description: 'תותחן, חבר קרוב, נפל ביום השני', traits: ['מצחיק', 'אמיץ', 'צעיר'] },
    ],
    reviews: [
      { name: 'בן של ניצול', rating: 5, comment: 'אבא שלי היה שם. הספר הזה עוזר לי להבין.' },
      { name: 'היסטוריון', rating: 5, comment: 'תיעוד מדויק ומרגש של קרבות עמק הבכא.' },
      { name: 'חייל צעיר', rating: 5, comment: 'קראתי לפני הגיוס. עכשיו אני מבין למה אנחנו כאן.' },
    ],
    qualityScore: 91,
  },

  // ---------- BOOK 5: Palmach 1948 ----------
  {
    authorKey: 'menachem_palmach',
    title: 'הדרך לירושלים',
    genre: 'Memoir',
    description: 'חייל פלמ״ח מספר על הקרבות לפריצת הדרך לירושלים הנצורה 1948.',
    synopsis: 'בגיל 18 הצטרפתי לפלמ״ח. בגיל 19 לחמתי על הדרך לירושלים במסגרת מבצע נחשון. הייתי בקסטל, בשער הגיא, באזור לטרון. זה הסיפור של הדור שלי - הדור שהקים מדינה.',
    tags: ['מלחמת השחרור', 'פלמ״ח', '1948', 'ירושלים', 'היסטוריה'],
    ageRating: 'PG',
    coverSeed: 'palmach-1948',
    coverColors: ['#4a3526', '#8b6f47', '#c9a874'],
    chapters: [
      {
        title: 'פרק א׳ - ההתגייסות',
        imageSeeds: ['mandate-jerusalem', 'palmach-training'],
        paragraphs: [
          'נולדתי בתל אביב 1929. אבי היה ציוני מבסרביה, אמי מפולין. גדלתי עם השיר "אם תרצו אין זו אגדה". בגיל 16 הצטרפתי להגנה. בגיל 18, 1947, עברתי לפלמ״ח.',
          'התאמנו בגבעת ברנר. שלוש שנים באימונים - לילה ויום. זחלנו בוץ, ירינו ברובי "סטן", שרנו שירי חברה. האמנו שבונים פה משהו. הצעירים ביותר היינו בני 18, הותיקים בני 22.',
        ],
      },
      {
        title: 'פרק ב׳ - הקסטל',
        imageSeeds: ['jerusalem-hills', 'convoy-trucks'],
        paragraphs: [
          'באפריל 1948 נצטווינו לכבוש את הקסטל. הרי ירושלים, מוצב שולט על הדרך. עלינו בלילה, מאה חיילים, נשק ישן. הרגשתי את הלב דופק על הגבעה.',
          'הקסטל התחלף בין ידיים שבעה פעמים בשבוע. פעם שלנו, פעם שלהם. עבד אל-קאדר אל-חוסייני נפל שם. מהפלוגה שלי נפלו ארבעה - עמוס, שמעון, יעקב, אחד שלא זכור לי השם. הוא היה בן 17. שיקר על הגיל כדי להתגייס.',
          'אחרי הקסטל פתחנו את הדרך לירושלים. שיירות אוכל ותחמושת התחילו להגיע. ילדי ירושלים שאכלו לחם ומרק דוחן יכלו לראות בפעם הראשונה אחרי חודשים משאיות של דגים וחלב.',
        ],
      },
      {
        title: 'פרק ג׳ - המדינה',
        imageSeeds: ['ben-gurion-declaration', 'modern-israel'],
        paragraphs: [
          '14 במאי 1948. הייתי בירושלים, פצוע, מסרב לצאת מהחזית. שמענו ברדיו את הכרזת המדינה. חברי מהפלוגה ואני עמדנו דום. אחד בכה. אחד שר. אני רק חיבקתי את הרובה.',
          'המלחמה המשיכה עוד שנה. אחרי המלחמה חזרתי להנדסה. בניתי שכונות באשדוד, בירושלים, ברמת גן. בניתי את הבית של אחי. בניתי, ובניתי, ובניתי. זו הייתה הדרך שלי לכבד את החברים שלא חזרו.',
          'היום אני בן 96. ראיתי את המדינה גודלת, מתחזקת, מתמודדת. אני כותב את זה לנינים שלי. שידעו - כל אבן שאתם דורכים עליה כאן, היא על גבם של הורים וחברים.',
        ],
      },
    ],
    characters: [
      { name: 'מנחם (המספר)', age: 19, description: 'לוחם פלמ״ח', traits: ['נמרץ', 'אידיאליסט', 'נאמן'] },
      { name: 'עמוס', age: 18, description: 'חבר ילדות, נפל בקסטל', traits: ['צחקן', 'אמיץ', 'חבר אמת'] },
    ],
    reviews: [
      { name: 'מורה להיסטוריה', rating: 5, comment: 'סיפור מכונן. כל תלמיד חייב לקרוא.' },
      { name: 'נכד', rating: 5, comment: 'סבא שלי היה בפלמ״ח ולא דיבר. עכשיו אני יודע.' },
      { name: 'חייל', rating: 4, comment: 'היסטוריה חיה. מעורר השראה.' },
    ],
    qualityScore: 88,
  },

  // ---------- BOOK 6: Ethiopia Aliyah ----------
  {
    authorKey: 'ilana_ethiopia',
    title: 'ההליכה הארוכה לירושלים',
    genre: 'Memoir',
    description: 'ילדה בת 9 ממבצע משה 1984 - הסיפור של עלייה דרך סודן.',
    synopsis: 'הלכנו ברגל שלושה חודשים, מהכפר שלי באתיופיה, דרך המדבר, לסודן. אחי הקטן מת בדרך. אבי נעלם. כשהגעתי לישראל, לא ידעתי עברית, לא ידעתי מה זה פסק זמן. זה הסיפור שלי.',
    tags: ['עלייה', 'אתיופיה', 'מבצע משה', 'ילדות', 'משפחה'],
    ageRating: 'PG',
    coverSeed: 'ethiopia-journey',
    coverColors: ['#5a3319', '#b8702e', '#e8b87a'],
    chapters: [
      {
        title: 'פרק א׳ - הכפר',
        imageSeeds: ['ethiopian-village', 'african-child'],
        paragraphs: [
          'נולדתי בכפר אמברה בצפון אתיופיה, 1975. היינו משפחה של שבעה - אבא, אמא, ארבעה אחים ואני. גרנו בבית חימר, הלכנו 3 קילומטרים למים כל יום.',
          'היינו יהודים - אמי לימדה אותי תפילות בעברית שלא הבנתי. אבא תמיד אמר "שנה הבאה בירושלים". חשבתי שירושלים היא מילה קסומה, לא מקום אמיתי.',
        ],
      },
      {
        title: 'פרק ב׳ - המסע',
        imageSeeds: ['desert-walk', 'sudan-camp'],
        paragraphs: [
          '1983, אמא אמרה שהיום אנחנו הולכים. לקחנו רק מה שיכולנו לשאת. הלכנו בלילות, התחבאנו ביום. שלושה חודשים. במדבר. הרגליים שלי דיממו.',
          'אחי הקטן, דגנט, היה בן 3. ביום הארבעים של ההליכה הוא חלה. אמא נשאה אותו יומיים. בלילה השלישי הוא מת בזרועותיה. קברנו אותו באבנים, במדבר. אמא לא בכתה. היא לא יכלה לבכות.',
          'הגענו למחנה פליטים בסודן. שלושה חודשים חיכינו. היה רעב, היו מחלות. אבא חלה ולקחו אותו לבית חולים. לא ראינו אותו שוב. עד היום אני לא יודעת אם הוא מת או נשאר באתיופיה.',
        ],
      },
      {
        title: 'פרק ג׳ - הארץ',
        imageSeeds: ['plane-window', 'israeli-school'],
        paragraphs: [
          'נובמבר 1984. העלו אותנו על מטוס באמצע הלילה. הייתי בת 9. לא ראיתי מטוס בחיים. כשנחתנו בלוד, הייתה צועקת אישה שאמרה "ברוכים הבאים הביתה". לא הבנתי מילה.',
          'גרנו בקריית גת, בקראוון. בית ספר, עברית, אולפן. ילדים לעגו לי על העור, על העברית השבורה. היו ימים שישבתי בשירותים ובכיתי. אבל היה גם בוקר שראיתי ים בפעם הראשונה.',
          'היום אני עובדת סוציאלית. עוזרת לעולים חדשים מאתיופיה. מדברת אמהרית ועברית, מתרגמת בין הדורות. הבן שלי, תמיר, בן 12. הוא יודע שדגנט הדוד שלו קבור במדבר. הוא יודע שסבו נעלם. הוא יודע כי כתבתי את זה כאן.',
        ],
      },
    ],
    characters: [
      { name: 'אילנה', age: 9, description: 'הילדה שהייתי', traits: ['שקטה', 'חזקה', 'סקרנית'] },
      { name: 'דגנט', age: 3, description: 'אחי הקטן, לא שרד את המסע', traits: ['מתוק', 'מצחיק', 'שמח'] },
      { name: 'אמא', description: 'שנשאה אותי דרך המדבר', traits: ['חזקה', 'שותקת', 'אוהבת'] },
    ],
    reviews: [
      { name: 'עולה', rating: 5, comment: 'הסיפור שלי. תודה שאילנה כתבה מה שכולנו הרגשנו.' },
      { name: 'מורה', rating: 5, comment: 'פותח עיניים. סיפור שחייב להיות בכל כיתה.' },
      { name: 'קורא', rating: 5, comment: 'בכיתי. מדהים.' },
    ],
    qualityScore: 90,
  },

  // ---------- BOOK 7: USSR Aliyah ----------
  {
    authorKey: 'marina_ussr',
    title: 'מוסקבה-ירושלים',
    genre: 'Memoir',
    description: 'משפחה יהודית ממוסקבה בעלייה הגדולה של שנות ה-90.',
    synopsis: 'הייתי בת 15 כשאבא אמר "אנחנו עולים לישראל". עזבנו דירה במוסקבה, פסנתר שלמדתי עליו, חברים של כל החיים. הגענו לתל אביב ב-1991, לדירה של שני חדרים, שש נפשות. זה הסיפור של העלייה שלי.',
    tags: ['עלייה', 'ברית המועצות', 'שנות ה-90', 'משפחה', 'קליטה'],
    ageRating: 'PG',
    coverSeed: 'russia-israel',
    coverColors: ['#1a2842', '#3d5478', '#7892b5'],
    chapters: [
      {
        title: 'פרק א׳ - מוסקבה',
        imageSeeds: ['moscow-winter', 'soviet-apartment'],
        paragraphs: [
          'נולדתי במוסקבה 1976. אבא מהנדס, אמא מורה לפסנתר. היינו יהודים "על הנייר" - בדרכון כתוב, אבל בבית דיברנו רוסית, חגגנו סילבסטר.',
          'גדלתי בדירה מרשימה, עם פסנתר של יאמאהה. למדתי בבית ספר למחוננים. חיינו לא היו רעים. אבל היו קולות לחשים - "יהודים נוסעים לישראל", "יש פוגרומים באוזבקיסטן".',
        ],
      },
      {
        title: 'פרק ב׳ - ההחלטה',
        imageSeeds: ['suitcases-packed', 'airplane-cabin'],
        paragraphs: [
          '1990, גורבצ׳וב פתח את השערים. אבא חזר הביתה יום אחד עם מסמכים. "מרינה, אנחנו נוסעים". לא שאל, הודיע. בכיתי שלושה ימים. איך אעזוב את אנה, את בית הספר, את הפסנתר שלי?',
          'מכרנו הכל. את הפסנתר מכרנו בזול. לקחנו שלוש מזוודות לשישה אנשים - אני, אבא, אמא, סבתא, דודה ודוד. הטיסה הייתה צפופה, עם עוד מאה יהודים כמונו. כולם בכו וצחקו באותו זמן.',
          'נחתנו ב-1991, באמצע מלחמת המפרץ. בנתב"ג חילקו לנו מסכות גז. זו הייתה ברוכים הבאים שלנו לארץ.',
        ],
      },
      {
        title: 'פרק ג׳ - להיות ישראלית',
        imageSeeds: ['israeli-street', 'young-professional'],
        paragraphs: [
          'דירה קטנה בבת ים. שישה אנשים. אמא עבדה כעוזרת בית, היא שהייתה פרופסור למוסיקה. אבא שטף כלים במסעדה, הוא שהיה ראש מחלקה בקרן. בכינו בלילות, מחייכים ביום.',
          'אני למדתי עברית מ-22 לרגב, מחברים חדשים בבית הספר, מחייליות בנות 19 שהיו מפקדות בגרעין. בגיל 18 התגייסתי, הייתי קשרית בחיל האוויר. היה יום שמפקדת שאלה אותי מאיפה המבטא המצחיק. אמרתי "ממוסקבה". היא אמרה "מגניב". זה היה היום שהבנתי שאני ישראלית.',
          'היום אני בת 49. אמא מלמדת פסנתר בקונסרבטוריון באשדוד. אבא מהנדס שוב. אני עורכת דין. הילדים שלי לא מדברים רוסית טובה, אבל הם יודעים איפה אנחנו באים. זה מה שחשוב.',
        ],
      },
    ],
    characters: [
      { name: 'מרינה (המספרת)', age: 15, description: 'נערה שעזבה את מוסקבה', traits: ['חרוצה', 'רגישה', 'מתאימה'] },
      { name: 'אמא', description: 'פסנתרנית שהפכה עוזרת בית', traits: ['חזקה', 'אמנותית', 'מקריבה'] },
      { name: 'אבא', description: 'מהנדס שעזב הכל בשביל הילדה שלו', traits: ['נחוש', 'אוהב', 'פרגמטי'] },
    ],
    reviews: [
      { name: 'עולה מרוסיה', rating: 5, comment: 'מרינה כתבה בדיוק את מה שעברנו. תודה.' },
      { name: 'צבר', rating: 5, comment: 'פותח עיניים. לא ידעתי כמה היה קשה.' },
      { name: 'דור שני', rating: 4, comment: 'ההורים שלי קראו ובכו. אמרו - זה בדיוק היה.' },
    ],
    qualityScore: 87,
  },

  // ---------- BOOK 8: Entebbe ----------
  {
    authorKey: 'yossi_entebbe',
    title: 'לילה באוגנדה',
    genre: 'Military Memoir',
    description: 'זיכרונות של לוחם סיירת מטכ״ל ממבצע אנטבה.',
    synopsis: '4 ביולי 1976. טסתי 4,000 קילומטרים לחלץ 106 יהודים. הייתי בן 23, סמל בסיירת. היה לנו 90 דקות באדמה, וכדור נמצא תמיד בינך לבין מי שאתה אוהב. זה הלילה הזה.',
    tags: ['אנטבה', 'סיירת', 'חטיפה', '1976', 'צבא'],
    ageRating: 'PG-13',
    coverSeed: 'entebbe-plane',
    coverColors: ['#1a1a1a', '#4a3a1a', '#8b6f2a'],
    chapters: [
      {
        title: 'פרק א׳ - התכנית',
        imageSeeds: ['hercules-plane', 'briefing-table'],
        paragraphs: [
          '28 ביוני 1976 - אייר פראנס 139 נחטף. 106 יהודים באוגנדה. גויסתי ב-29. אימונים 6 ימים - דגם של הטרמינל מעץ, בדיוק באותם מידות.',
          'לא ידענו אם נחזור. יוני נתניהו, המפקד שלנו, אמר רק דבר אחד: "בני אדם חיים תלויים בנו". ב-3 ביולי בערב עלינו על ארבעה הרקולס.',
        ],
      },
      {
        title: 'פרק ב׳ - 90 דקות',
        imageSeeds: ['runway-lights', 'mercedes-car'],
        paragraphs: [
          'נחתנו באנטבה בדיוק ב-23:00. יצאנו במרצדס שחורה - התחפשנו ליועצי אידי אמין. הגענו לטרמינל בלי להיות מזוהים. ואז, בדיוק בעת הגעתנו, חייל אוגנדי פנה אלינו.',
          'יוני ירה בו. זה היה הירי הראשון. כל התכנית הפכה על פיה - הופעת ההפתעה נגמרה. נכנסנו לטרמינל, צעקנו "שבו! שבו!" בעברית. החטופים לא ידעו מה קורה - חשבו שזה משחק של המחבלים.',
          'תוך 90 שניות המחבלים נהרגו. יוני נפל. הוא היה הפצוע הראשון. אני ניסיתי להציל אותו, אבל כדור פגע לו בחזה. אני זוכר את עיניו. הוא לא פחד.',
        ],
      },
      {
        title: 'פרק ג׳ - השיבה הביתה',
        imageSeeds: ['dawn-flight', 'ben-gurion-arrival'],
        paragraphs: [
          'ב-3:00 בבוקר היינו באוויר, בדרך הביתה. 102 חטופים חיים, 3 נפטרו בחילוץ, יוני אחד. ישבנו דוממים. מישהו שר "התקווה" בלחש. אחרים בכו.',
          'נחתנו בנתב"ג בצהריים של 4 ביולי. כל המדינה פגשה אותנו. הייתה שם דגלים, פרחים, צחוקים. אמא של יוני לא הייתה שם. היא הייתה בבית, משם הגיעה המודעה.',
          'זו הייתה הפעם היחידה שנלחמתי במבצע מפורסם. אבל זה לא המבצע שבאמת מגדיר אותי. מה שמגדיר אותי זה מה שעשינו בקיטן - באימונים, בסיורים, בימים הרגועים. זה מה שאני אומר לצעירים היום: "הגבורה היא לא רגע אחד. היא הרצף".',
        ],
      },
    ],
    characters: [
      { name: 'יוסי (המספר)', age: 23, description: 'סמל בסיירת מטכ״ל', traits: ['שקט', 'מקצועי', 'נאמן'] },
      { name: 'יוני נתניהו', age: 30, description: 'המפקד, נפל באנטבה', traits: ['כריזמטי', 'מוביל', 'מעורר השראה'] },
    ],
    reviews: [
      { name: 'חייל בסיירת', rating: 5, comment: 'הדור שלי גדל על הסיפור. תודה יוסי שכתבת אותו.' },
      { name: 'היסטוריון', rating: 5, comment: 'פרטים ותובנות חדשות שלא ידעתי.' },
      { name: 'קורא', rating: 5, comment: 'מרתק כמו סרט, אבל אמיתי.' },
    ],
    qualityScore: 92,
  },

  // ---------- BOOK 10: Terror attack survivor ----------
  {
    authorKey: 'rachel_terror',
    title: 'הקפה שהפך לאש',
    genre: 'Memoir',
    description: 'שורדת פיגוע התאבדות בקפה מומנט ירושלים 2002.',
    synopsis: 'בת 22, סטודנטית, הייתי בקפה מומנט עם החברים. מחבל מתאבד נכנס ופוצץ את עצמו. 11 אנשים נהרגו. אני ניצלתי - אבל המחיר היה גדול. זה הסיפור שלי - איך חיים אחרי.',
    tags: ['פיגוע', 'טרור', 'ירושלים', 'שורד', '2002'],
    ageRating: 'R',
    coverSeed: 'jerusalem-cafe',
    coverColors: ['#4a1a1a', '#8b3a2e', '#c97a5a'],
    chapters: [
      {
        title: 'פרק א׳ - קפה רגיל',
        imageSeeds: ['jerusalem-cafe-2', 'friends-talking'],
        paragraphs: [
          '9 במרץ 2002. ליל שבת. קפה מומנט ברחוב עזה. הייתי עם דן ומיכל - חברים מהאוניברסיטה. הזמנתי שקשוקה. חצי הייתה על הצלחת.',
          'בסביבות 22:30 נכנס בחור. צעיר, שחום, עם תרמיל. הבטתי בו לרגע. חשבתי שהוא דומה לחבר של אחי. הוא לא הסתכל עלי. הוא הסתכל למטה.',
        ],
      },
      {
        title: 'פרק ב׳ - הרגע',
        imageSeeds: ['shattered-glass', 'ambulance-lights'],
        paragraphs: [
          'הפיצוץ היה הדבר הכי רועש ששמעתי. אור לבן. חום. ואז חושך. לא שמעתי. לא הרגשתי כלום. רק טעם של מתכת בפה.',
          'כשפקחתי עיניים, הייתי על הרצפה. מיכל לא זזה לידי. דם בכל מקום. דן צעק, אני חושבת - ראיתי את הפה שלו פתוח אבל לא שמעתי. מישהו חילץ אותי, הוציא אותי לרחוב.',
          'באמבולנס לא הרגשתי כאב. ראיתי שהרגל שלי מוזרה, עם ברזל בוקע. אמרו לי שנוטף שרפה מהגב. לא הרגשתי כלום. רק חשבתי על מיכל. ועל שקשוקה שלא סיימתי.',
        ],
      },
      {
        title: 'פרק ג׳ - ללמוד מחדש',
        imageSeeds: ['rehab-walking', 'new-morning'],
        paragraphs: [
          'מיכל מתה. דן נפצע קשה אבל שרד. אני איבדתי את האוזן השמאלית, קיבלתי רסיסים בגב, פיסת ברזל קטנה עדיין בבטן. היום, 22 שנה אחרי, עדיין.',
          'שש שנים של שיקום. למדתי ללכת שוב. למדתי לישון שוב. למדתי שיש רעשים שהופכים אותי לצעירה בת 22 בשנייה - הנפילה של ספר במסעדה, הפופ של בלון בחתונה.',
          'היום אני עובדת סוציאלית. מלווה קורבנות פיגועים חדשים. מאז 7/10 עבודה שלי פועמת. אני אומרת להם מה שאף אחד לא אמר לי: "זה לא יעבור. אבל תלמדו לחיות איתו. ויהיו רגעים שלמים של שמחה. אני מבטיחה".',
        ],
      },
    ],
    characters: [
      { name: 'רחל (המספרת)', age: 22, description: 'סטודנטית, שרדה פיגוע', traits: ['חזקה', 'רגישה', 'עוזרת'] },
      { name: 'מיכל', age: 23, description: 'חברה הטובה, נהרגה בפיגוע', traits: ['חכמה', 'שמחה', 'נעדרת'] },
      { name: 'דן', age: 24, description: 'חבר, נפצע ושרד', traits: ['עמיד', 'נחוש', 'חבר אמת'] },
    ],
    reviews: [
      { name: 'שורדת פיגוע', rating: 5, comment: 'רחל - המילים שלך נותנות לי כוח כל יום.' },
      { name: 'משפחת נפגע', rating: 5, comment: 'לא הבנו את זה עד שקראנו. מעולה ומרגש.' },
      { name: 'עובדת סוציאלית', rating: 5, comment: 'כלי עבודה חובה לכל מי שעוזר לנפגעי טרור.' },
    ],
    qualityScore: 91,
  },

  // ---------- BOOK 11: Bereaved Mother 7/10 ----------
  {
    authorKey: 'michal_bereaved',
    title: 'את הילד הזה אני מחזירה לעצמי',
    genre: 'Memoir',
    description: 'אם שכולה כותבת על הבן שלא חזר מבארי, ועל מה נשאר.',
    synopsis: 'בנין נפל בקיבוץ בארי ב-7 באוקטובר. הוא היה בן 23, סטודנט, חבר. הספר הזה הוא לא אזכרה. הוא הסיפור של מי שהוא היה - הצחוק, הבישולים שלו, השירים שכתב במחברת. אני מחזירה אותו לעצמי, מילה במילה.',
    tags: ['שכול', '7 באוקטובר', 'בארי', 'אם', 'זיכרון'],
    ageRating: 'PG-13',
    coverSeed: 'mother-memorial',
    coverColors: ['#2a2a3d', '#5a4a6d', '#a89bb5'],
    chapters: [
      {
        title: 'פרק א׳ - הבוקר שלא ענה',
        imageSeeds: ['phone-on-table', 'morning-coffee'],
        paragraphs: [
          'התקשרתי לבנין בשבע ושתי דקות בבוקר. הוא לא ענה. בנין תמיד עונה. גם כשהוא ישן, הוא עונה ואומר "אמא תני לי חמש דקות". התקשרתי שוב. ושוב. ושוב.',
          'בעשר וחצי הוא שלח הודעה - "אמא יש פיגוע גדול בקיבוץ. אני בממ״ד עם אלה. אל תדאגי, צה״ל בדרך". התשובה שלי הייתה "אני אוהבת אותך". ראיתי שהוא קרא. הוא לא הספיק לכתוב חזרה.',
          'בשתיים בלילה הם הגיעו אלי. שלושה אנשים במדים - שני קצינים ורופאה. ידעתי לפני שדפקו. אישה לא צריכה ידיעה רשמית כדי לדעת. הגוף שלה יודע לפני שהיא יודעת.',
        ],
      },
      {
        title: 'פרק ב׳ - מי שהוא היה',
        imageSeeds: ['young-man-smiling', 'kibbutz-kitchen'],
        paragraphs: [
          'בנין בישל. זה הדבר הראשון שאני רוצה שתדעו. בן 23, סטודנט להיסטוריה, וטוב יותר במטבח מכל בעל מסעדה שהכרתי. הוא המציא מתכון לשקשוקה עם פאשטידה. הוא קרא לזה "פש-קה". זה היה גס וטעים והרגיש כמו אהבה.',
          'הוא כתב שירים. במחברת ירוקה שמצאתי בחדר שלו אחרי. שיר אחד היה על הים, על איך הגלים תמיד חוזרות. שיר אחר היה על אלה - הבת זוג שלו, שגם נפלה. השיר נקרא "תני לי שלוש שנים נוספות". הוא לא קיבל אותן.',
          'הוא היה ילד שמח. זה לא תפאורה. אנשים כותבים על מתים שהיו "קרני שמש" - אבל בנין באמת היה. הוא היה נכנס לחדר ועושה שינוי במצב הרוח של כולם. אני מסתכלת על תמונות עכשיו ואני שומעת את הצחוק שלו, פיזית. שומעת.',
        ],
      },
      {
        title: 'פרק ג׳ - להמשיך, איכשהו',
        imageSeeds: ['empty-room', 'cooking-pot'],
        paragraphs: [
          'בששי בערב אני מבשלת פש-קה. כל ששי. לא לכבודו - בשבילי. כי כשאני עומדת מול המחבת, ומפזרת את הביצים על הפאשטידה, הוא נמצא איתי במטבח. אני שומעת אותו אומר "אמא לא! יותר שמן!". אני צוחקת. אני בוכה. אני בוחשת.',
          'יש לי שני ילדים אחרים. הם דורשים ממני לחיות. הם דורשים ממני לחייך. אני עושה. אבל בלילות, כשהבית שקט, אני נכנסת לחדר של בנין. הוא נשאר בדיוק כמו שהיה - הספרים, החולצה השחורה על הכיסא, ריח שדועך לאט מדי שנה.',
          'כתבתי את הספר הזה כי אני לא רוצה שהוא יהפוך לשם בטקס. הוא היה בן אדם. הוא בישל. הוא כתב. הוא צחק. ואם תקראו את זה - את הסיפור הזה, את המילים האלה - הוא חי עוד דקה. ועוד דקה. ועוד דקה. עד שאחזור אליו.',
        ],
      },
    ],
    characters: [
      { name: 'מיכל (האם)', age: 52, description: 'אם לבנין ולשני ילדים נוספים', traits: ['חזקה', 'שבורה', 'אוהבת'] },
      { name: 'בנין', age: 23, description: 'בנה הבכור, נפל בבארי 7/10', traits: ['שמח', 'יצירתי', 'מבשל'] },
      { name: 'אלה', age: 22, description: 'בת זוגו של בנין, נפלה איתו', traits: ['רגישה', 'אמנותית', 'נעדרת'] },
    ],
    reviews: [
      { name: 'אם שכולה אחרת', rating: 5, comment: 'מיכל. אנחנו עומדות יחד. תודה על המילים.' },
      { name: 'חבר של בנין', rating: 5, comment: 'הוא היה בדיוק כמו שכתבת. תודה שהחזרת לי אותו לרגע.' },
      { name: 'קוראת', rating: 5, comment: 'בכיתי כל הספר. ויותר חשוב - צחקתי. בנין היה בן אדם נפלא.' },
    ],
    qualityScore: 95,
  },

  // ---------- BOOK 12: Firefighter 7/10 ----------
  {
    authorKey: 'ron_firefighter',
    title: 'מה שראיתי בעוטף',
    genre: 'Memoir',
    description: 'כבאי שהגיע לעוטף יומיים אחרי 7/10 ופעל שלושה שבועות.',
    synopsis: 'אני כבאי 17 שנה. ראיתי שריפות ענק, תאונות, גופות. שום דבר לא הכין אותי לעוטף. שלושה שבועות איספנו, חילצנו, זיהינו. זה הסיפור על מה שראיתי - ועל איך אנשים, כשהעולם מתפרק, מצליחים לעמוד.',
    tags: ['7 באוקטובר', 'כיבוי אש', 'חילוץ', 'עוטף', 'גבורה'],
    ageRating: 'R',
    coverSeed: 'firefighter-debris',
    coverColors: ['#3a1a1a', '#7a3a2a', '#d97a3a'],
    chapters: [
      {
        title: 'פרק א׳ - הקריאה',
        imageSeeds: ['fire-truck-night', 'burned-house'],
        paragraphs: [
          'יום ראשון, 8 באוקטובר 2023, ארבע בבוקר. הזעיקו אותי מהטלפון. "רון, אנחנו צריכים אותך. הקפיצי הכל לאוטו". הקצין שלי דיבר בלחש - דיבר מאיתנו, אבל בעיקר מעצמו.',
          'נסעתי דרומה עם עוד שלושה כבאים. ידענו על 7 באוקטובר רק את מה שראינו בטלוויזיה. רעיון. לא כמו שזה באמת. ברדיו שמעתי איך כתב פרץ בבכי באמצע משפט. לא ידעתי שזה אפשרי, כתב שבוכה.',
          'הגענו לכפר עזה בשמונה בבוקר. ירד גשם קל. הרחוב היה ריק. ושקט. שקט שלא שמעתי מעולם. כאילו אפילו הציפורים פחדו לחזור.',
        ],
      },
      {
        title: 'פרק ב׳ - הבית הראשון',
        imageSeeds: ['burnt-doorway', 'family-photo'],
        paragraphs: [
          'הבית הראשון שנכנסתי אליו היה של משפחת רוזנטל. אני יודע את השם כי ראיתי אותו על ארגז דואר. בתוך - שני ההורים, שני ילדים. הילד הקטן עוד החזיק בובה. אני לא אכתוב יותר על זה. אני לא יכול.',
          'בעבודה של 17 שנה, ראיתי דברים. בילדים, אני לא מסתכל על הפנים. זה הכלל שלי, לשמור על הראש. אבל בעוטף, חייבים. כי צריך לזהות. וצריך לכבד. אז הסתכלתי. אני אזכור את הפנים האלו עד שאני מת.',
          'בלילה הראשון לא ישנתי. הקפיים שלי רעדו. החבר שלי, שגם היה שם, מצא אותי בחוץ של הקראוון מעשן. הוא לא דיבר. הוא ישב. שתינו עישנו. וזה היה מספיק.',
        ],
      },
      {
        title: 'פרק ג׳ - שלושה שבועות',
        imageSeeds: ['volunteers-line', 'sunrise-field'],
        paragraphs: [
          'שלושה שבועות עבדנו. בית אחרי בית. ממ״ד אחרי ממ״ד. מצאנו אנשים שהיו בחיים - כן, גם אחרי שלושה ימים. אישה אחת הייתה בארון 60 שעות, חיה. כשפתחתי את הדלת, היא לא צרחה. היא רק שאלה "איפה הילד שלי?". הילד שלה היה במקרר. הוא חי. עוד חי, איכשהו.',
          'הכי חזק מה שזכור לי זה האנשים שהגיעו לעזור. מתנדבים מכל הארץ. גברים בני 70 שעמדו במשטחים בחום של 35 מעלות והגישו אוכל. נשים שכיבסו מדים שלנו. נער שהביא לנו טמפו כל בוקר, ולא לקח אגורה. שמו היה איתי. כשניסיתי לתת לו 50 שקל הוא אמר "סבא שלי היה בגדוד 51. זה הכי קטן".',
          'חזרתי הביתה אחרי שלושה שבועות, ואשתי לא הכירה אותי. ירדתי 8 קילו. עיניי היו בפנים. לקח לי שלושה חודשים לישון לילה שלם. עדיין יש דברים שאני לא מסוגל לעשות - לפתוח דלת של ארון בלי להסתכל פנימה תחילה. אבל אני חי. ואני עובד. ואני מספר את זה כי שכחה היא חטא.',
        ],
      },
    ],
    characters: [
      { name: 'רון (המספר)', age: 38, description: 'כבאי-מציל ותיק, אבא לשניים', traits: ['קשוח', 'אנושי', 'נאמן'] },
      { name: 'איתי', age: 17, description: 'נער מהדרום שהביא טמפו לכבאים', traits: ['רגיש', 'נדיב', 'גאה'] },
    ],
    reviews: [
      { name: 'מתנדבת בעוטף', rating: 5, comment: 'הייתי שם איתכם. תודה רון על המילים שאני לא יכולתי לומר.' },
      { name: 'משפחת נפגעים', rating: 5, comment: 'תודה לך ולחברים שלך. אתם מלאכים.' },
      { name: 'קורא', rating: 5, comment: 'אסור לשכוח. הספר הזה דואג לזה.' },
    ],
    qualityScore: 93,
  },

  // ---------- BOOK 13: Doctor at Soroka 7/10 ----------
  {
    authorKey: 'tamar_doctor',
    title: 'חמ״ל אדום',
    genre: 'Memoir',
    description: 'רופאה בסורוקה מספרת על השעות הראשונות של 7 באוקטובר.',
    synopsis: 'הייתי כוננית בחדר ניתוח כשהפצועים הראשונים הגיעו. תוך שעה היו 200. תוך יום היו 700. שמונה רופאים. שבעה שבועות לא ישנתי בבית. זה הסיפור שלי - איך רפואה הופכת למלחמה.',
    tags: ['רפואה', '7 באוקטובר', 'סורוקה', 'הצלת חיים', 'גבורה'],
    ageRating: 'R',
    coverSeed: 'hospital-emergency',
    coverColors: ['#1a3a4a', '#3a6a7a', '#7aaab5'],
    chapters: [
      {
        title: 'פרק א׳ - השעה הראשונה',
        imageSeeds: ['ambulance-bay', 'surgery-prep'],
        paragraphs: [
          '7:48 בבוקר. אזעקה. הייתי בקפטריה של סורוקה, לפני משמרת. ירדתי לחדר ניתוח. עוד אזעקה. ועוד. כל שתי דקות. במנהלה אמרו "מאות פצועים בדרך". חשבתי שזה מספר כללי. זה היה תת-הערכה.',
          'בתשע ועשרים הגיע האמבולנס הראשון. בחור צעיר, פצע ירי בבטן, חצי הכרה. שאלתי את הפרמדיק "פיגוע?". הוא הסתכל עליי ואמר "מלחמה". זו הייתה הפעם הראשונה ששמעתי את המילה. לא הבנתי עד הסוף.',
          'תוך שעה היו 80 פצועים בדלפק הקבלה. צעקות. אמהות. דם. הזמינו אותי לחדר ניתוח. שני מנותחים בו זמנית - על אחד שולחן ניתוח, על השני מיטה רגילה. עבדתי על הראשון, עיניי על השני. כך עבדנו 18 שעות.',
        ],
      },
      {
        title: 'פרק ב׳ - הבחירות',
        imageSeeds: ['triage-tags', 'surgeon-tired'],
        paragraphs: [
          'הדבר הקשה ביותר ברפואת מלחמה הוא לא הניתוח. הוא הטריאז׳. אתה עומד מול 50 פצועים ויש לך 6 רופאים. אתה מסמן: זה ראשון, זה שני, זה - לא. אתה מחליט מי חי. בגיל 39 אני לא הייתי אמור לעשות בחירות כאלה.',
          'הייתה ילדה בת 11. פצע ראש קשה. ידעתי שאם נטפל בה, נאבד שלושה אחרים. עברתי. הסתכלתי על האמא שלה. היא ידעה. היא לא בכתה. היא רק אמרה "תודה". אני לא ישנתי שלושה לילות אחרי. אני עוד לא ישנה לפעמים בגלל זה.',
          'בערב, אחרי 14 שעות, הסתכלתי בכף ידי. רעדה. לא יכולתי לאחוז סקלפל. רופא בכיר אחר תפס אותי, הוציא אותי לחדר אחורי, נתן לי כוס מים. "תמר," הוא אמר, "תיכנסי 20 דקות. עכשיו". זה היה הוראה רפואית. לקחתי 20 דקות. חזרתי וניתחתי עוד שמונה.',
        ],
      },
      {
        title: 'פרק ג׳ - אחרי',
        imageSeeds: ['empty-corridor', 'family-survivor'],
        paragraphs: [
          'בסוף השבוע הראשון של המלחמה, היו לנו 700 פצועים. הצלנו רוב גדול. אבל יש פנים שאני זוכרת - חיילים בני 19, אישה בהריון מקיבוץ, סבא שניסה להגן על נכדיו.',
          'יש לי גם זיכרון אחד שאני שומרת. בחור צעיר, פצוע קשה. ניתחתי אותו שבע שעות. הוא חי. שבועות אחרי הוא הגיע למחלקה לבקר אותי. הוא הביא פרחים. אמר "ד״ר תמר, את חייבת להגיע לחתונה שלי בשנה הבאה". אני מבטיחה לכם - אני אהיה שם.',
          'אני כותבת את זה כי המקצוע שלנו לא מסתיים בחדר ניתוח. הוא ממשיך בלילות, בחלומות, בשפם הצליל של אמבולנס. אני גאה במה שעשינו. אני גם שבורה. שני הדברים יכולים להתקיים יחד. זה לדעת זה - להיות אנושי.',
        ],
      },
    ],
    characters: [
      { name: 'תמר (המספרת)', age: 39, description: 'מנתחת בכירה בסורוקה', traits: ['מקצועית', 'אנושית', 'מנהיגה'] },
      { name: 'הילדה בת ה-11', age: 11, description: 'פצועה שלא יכלו להציל', traits: ['צעירה', 'תמימה', 'נעדרת'] },
      { name: 'האם של הילדה', description: 'אם שאמרה "תודה" כשידעה', traits: ['חזקה', 'מודעת', 'אצילית'] },
    ],
    reviews: [
      { name: 'רופא צעיר', rating: 5, comment: 'ספר חובה לכל סטודנט לרפואה. תמר - את גיבורה.' },
      { name: 'ניצולה מ-7/10', rating: 5, comment: 'את הצלת את החיים שלי. תודה לעולמים.' },
      { name: 'קוראת', rating: 5, comment: 'מרגש מעבר למילים. ראייה אמיתית מהחזית הרפואית.' },
    ],
    qualityScore: 92,
  },

  // ---------- BOOK 14: Pilot Yom Kippur ----------
  {
    authorKey: 'eyal_pilot',
    title: 'אש מהשמיים',
    genre: 'Military Memoir',
    description: 'טייס פנטום במלחמת יום כיפור מספר על קרבות סיני 1973.',
    synopsis: 'הייתי בן 26, טייס פנטום, נשוי כמעט שנה. ב-7 באוקטובר 1973 המראתי לסורטי הראשון של חיי. תוך 18 ימים איבדתי שבעה חברים. החזיר אותם הזיכרון, החזיר אותם הספר הזה.',
    tags: ['חיל אוויר', 'יום כיפור', 'פנטום', 'סיני', '1973'],
    ageRating: 'PG-13',
    coverSeed: 'phantom-jet',
    coverColors: ['#1a2a3a', '#3a5a7a', '#7a9aba'],
    chapters: [
      {
        title: 'פרק א׳ - יום כיפור בחצור',
        imageSeeds: ['airbase-runway', 'pilot-cockpit'],
        paragraphs: [
          'בסיס חצור, יום כיפור 1973. הייתי בכוננות. ישבתי בחדר אוכל ואכלתי שניצל. עברה אישה דתית מהמטבח, לא הסתכלה עליי. לא הבנתי למה. אחרי שעה הבנתי - אנחנו אוכלים בכיפור.',
          'בערך בחצי יום הזעיקו אותי לפיקוד. סורייאנים פלשו לגולן. מצרים חצו את התעלה. אמרו לי "אייל, תמריא תוך עשר דקות". זרקתי את הקיט, רצתי למטוס. בקסדה לא היה זמן לחשוב על אשתי שהייתה בבית, בהריון.',
        ],
      },
      {
        title: 'פרק ב׳ - לב המלחמה',
        imageSeeds: ['jet-formation', 'sinai-desert'],
        paragraphs: [
          'הסורטי הראשון: תקיפה של גשרים מצריים על התעלה. נכנסנו ארבעה - יצאנו שלושה. אבי, חבר שלי מקורס הטיס, התרסק. ראיתי את האש מטה. לא היה זמן לעצור. המשכנו.',
          'במהלך המלחמה הטסתי 73 גיחות. שיא של הטייסת. גם רוב מי שהטיס איתי בקורס לא חזר. ביום העשירי, חזרתי לבסיס וראיתי את הסטודיו שלנו - חמש תמונות הוסרו. שלוש נוספו לקיר ה"חברים שלא חזרו". זה הופך אותך לאדם אחר.',
          'הכי קשה היה הלילה. הייתי שוכב במיטה ושומע את הסילון של הפנטום באוויר, גם כשלא הייתי באוויר. החלום היה תמיד אותו דבר - אבי קורא לי בקשר ואני לא יכול לענות.',
        ],
      },
      {
        title: 'פרק ג׳ - הילד והאיש',
        imageSeeds: ['baby-cradle', 'father-pilot'],
        paragraphs: [
          'נולד לי בן באמצע המלחמה. שמו אבי, על שם החבר שאיבדתי. אשתי לבד בלידה. כשהגעתי הביתה אחרי המלחמה, ראיתי את הבן שלי בפעם הראשונה. הוא היה בן שבועיים. נשרף לי שריפת לב.',
          'שנים אחר כך, אבי הקטן הפך לטייס. אני התנגדתי. רציתי שהוא ילמד הנדסה, יהיה רחוק. הוא אמר לי "אבא, אני קורא על אבי שעל שמו אני נקרא. הוא לא היה גיבור כי הוא טס - הוא היה גיבור כי הוא עשה משהו שהאמין בו". לא יכולתי לטעון.',
          'היום אני בן 78. הוצאתי כנפיים מזמן. אבי הוציא כנפיים. הנכד שלי טייס בחיל. שלושה דורות. אני כותב את הספר הזה כי אני רוצה שהדור הבא ידע - לא הטיסה הופכת אותך לטייס. הצורך לעשות מה שצריך לעשות. זה הכל.',
        ],
      },
    ],
    characters: [
      { name: 'אייל (המספר)', age: 26, description: 'טייס פנטום במלחמת יום כיפור', traits: ['מקצועי', 'נחוש', 'רגיש'] },
      { name: 'אבי', age: 25, description: 'חבר שנפל ב-7 באוקטובר 1973', traits: ['מצחיק', 'אמיץ', 'נאמן'] },
      { name: 'אבי הבן', description: 'בן שנקרא על שם החבר', traits: ['ירש את החלום', 'עצמאי', 'גאה'] },
    ],
    reviews: [
      { name: 'אישה של טייס', rating: 5, comment: 'אייל - בעלי טס איתך. תודה שכתבת מה שהוא לא יכול.' },
      { name: 'חניך טיס', rating: 5, comment: 'הספר הזה יושב לי על השולחן. קורא קטע כל לילה.' },
      { name: 'היסטוריון', rating: 4, comment: 'תיעוד מצוין של האוויר במלחמת יום כיפור.' },
    ],
    qualityScore: 89,
  },

  // ---------- BOOK 15: Female Combat Soldier ----------
  {
    authorKey: 'liat_fighter',
    title: 'הסיירת והשמלה',
    genre: 'Memoir',
    description: 'לוחמת ביחידה מעורבת מספרת על השירות, הקרבות, והמשוואה הבלתי אפשרית.',
    synopsis: 'הייתי בקרקל. הייתי בקצא"א. נלחמתי בגבול מצרים, סוריה, ועכשיו עזה. אני לוחמת. אני אישה. אני אמא לתאומים. הספר הזה הוא על שלושת הדברים האלה - איך הם חיים יחד, ואיך הם נלחמים זה בזה.',
    tags: ['לוחמת', 'יחידות מעורבות', 'אישה', 'אמהות', 'צבא'],
    ageRating: 'PG-13',
    coverSeed: 'female-soldier',
    coverColors: ['#3a4a3a', '#6a7a6a', '#aabaaa'],
    chapters: [
      {
        title: 'פרק א׳ - להיכנס',
        imageSeeds: ['boot-camp', 'rifle-training'],
        paragraphs: [
          'הצטרפתי לקרקל ב-2007. הייתי בת 18.5 ובת רק 1.55 גובה. החובש בטירונות אמר לי "את לא תחזיק שבוע". כעבור 14 חודשים יצאתי לבסיסי כצנחנית מוסמכת, מצוינת בקליעה, מ"כ של חוליה.',
          'בקורס הראשון, היינו 6 בנות מתוך 30 חיילים. שלוש פרשו תוך חודש. שתיים נשארו עד הסוף. כל יום היה הוכחה. לא רק שאני יכולה - שאני יותר. כי החברים שלי בכיתה לא היו צריכים להוכיח את עצמם. הם פשוט היו שם.',
          'יום אחד מפקד הפלוגה אמר לי "ליאת, את לוחמת. תפסיקי להוכיח, תתחילי לחיות". הוא צדק. מאותו רגע התחלתי להיות החיילת שאני, ולא הקריקטורה של "הבחורה החזקה".',
        ],
      },
      {
        title: 'פרק ב׳ - הקרב',
        imageSeeds: ['gaza-border', 'tactical-formation'],
        paragraphs: [
          'בעופרת יצוקה הייתי כבר קצינה זוטרה, בקצא"א, מפקדת חוליה. הוסיפו אותנו לכוחות בעוטף. הייתה לילה אחד שירדנו לכפר עקביא, חלק ממבצע. נכנסנו לבית. בלילה. בלי אורות.',
          'במטבח, מאחורי דלת, היה ילד פלסטיני בן 7. בידיו - לא נשק. כריך. הוא אכל באמצע הלילה. הסתכל עלי. אני הסתכלתי עליו. הוא לא בכה. הוא הכניס את הכריך לפה ולעס באיטיות.',
          'יצאתי מהבית בלי לעשות כלום. דיווחתי שהבית ריק. הקצין שלי ידע שאני משקרת. הוא לא אמר כלום. כי לפעמים, אומץ הוא לא לירות. אומץ הוא להגיד לעצמך - אני יכול להחליט מה אני עושה. ואני בוחר ברחמים.',
        ],
      },
      {
        title: 'פרק ג׳ - השמלה',
        imageSeeds: ['twin-babies', 'mother-soldier'],
        paragraphs: [
          'השתחררתי בגיל 25. למדתי משפטים. עבדתי בפרקליטות הצבאית. בגיל 28 התחתנתי, בגיל 30 ילדתי תאומים - בנים. בחתונה לבשתי שמלה לראשונה אחרי שמונה שנים. הרגשתי מוזר, לא בגוף שלי.',
          'אבל הגוף שלי, אחרי הכל, הוא של חיילת. הוא של אמא. הוא של אישה שמכינה כריכים בחמש בבוקר ויודעת איך מפרקים M-16 בעיניים עצומות. אני שני הדברים. אני לא חייבת לבחור.',
          'הבנים שלי שואלים שאלות. "אמא, אתה הרגת אנשים?" אני עונה את האמת. "אמא, את פוחדת?" אני עונה את האמת. אני רוצה שהם יבינו - אישה לוחמת היא לא קריקטורה, היא לא דמות מסרט. היא בן אדם. עם פחדים, עם כוח, עם אהבה. כמו כולנו.',
        ],
      },
    ],
    characters: [
      { name: 'ליאת (המספרת)', age: 29, description: 'לוחמת לשעבר, אמא לתאומים', traits: ['חזקה', 'אנושית', 'נחושה'] },
      { name: 'הילד הפלסטיני', age: 7, description: 'ילד שאכל כריך באמצע הלילה', traits: ['תמים', 'רעב', 'שורד'] },
    ],
    reviews: [
      { name: 'לוחמת בקרקל', rating: 5, comment: 'ליאת - את כתבת את הסיפור של כולנו.' },
      { name: 'אם של חיילת', rating: 5, comment: 'בתי בקרקל. הספר הזה עזר לי להבין.' },
      { name: 'קוראת', rating: 5, comment: 'מסקרן ומורכב. מציג צד שלא רואים.' },
    ],
    qualityScore: 90,
  },

  // ---------- BOOK 16: Youth Counselor 7/10 ----------
  {
    authorKey: 'gadi_madrich',
    title: '14 הילדים בארון',
    genre: 'Memoir',
    description: 'מדריך נוער מספר איך הציל 14 ילדים בקיבוץ עוטף ב-7 באוקטובר.',
    synopsis: 'הייתי מדריך הצופים בכפר עזה. ב-7 באוקטובר הייתי על משמרת לילה במועדון. בבוקר היו לי 14 ילדים, בני 8-12, ואלפי מחבלים בחוץ. שמונה שעות בארון. זה הסיפור.',
    tags: ['7 באוקטובר', 'הצלה', 'ילדים', 'גבורה', 'מדריך'],
    ageRating: 'PG-13',
    coverSeed: 'closet-hiding',
    coverColors: ['#2a2a2a', '#5a4a3a', '#8b7a5a'],
    chapters: [
      {
        title: 'פרק א׳ - הסוף שבת בחיינו',
        imageSeeds: ['scout-cabin', 'kids-sleeping'],
        paragraphs: [
          'שמונה הילדים בני 10 ישנו על מזרונים בחדר הגדול. שתי הבנות בנות 12 ישנו ביחד. שלושה ילדים בני 8 שאמהותיהם השאירו אותם בארון - הם פחדו לישון לבד בבית. הייתי בן 21, גשר השנה לפני האוניברסיטה.',
          '6:30 בבוקר, אזעקה. סטנדרט. הערתי את הילדים, כולם לחדר ביטחון של המועדון. ספרתי - 14. ישבנו, חיכינו לזיכרון "בסדר" של הקיבוץ. לא הגיע. שמעתי יריות. הרבה. קרובות.',
          'באפליקציה ראיתי הודעה מהקיבוץ: "מחבלים בקיבוץ. כולם בממ״ד. אל תפתחו". פתחתי את הארון הגדול של הציוד, פיניתי הכל החוצה, אמרתי לילדים "ילדים, יש משחק חדש. כולם לארון, בשקט מוחלט, אסור להוציא צליל". הם נכנסו.',
        ],
      },
      {
        title: 'פרק ב׳ - שמונה שעות',
        imageSeeds: ['dark-closet', 'whispering-children'],
        paragraphs: [
          'שמונה שעות. אני, 14 ילדים, ארון של 2 על 1.5 מטר. ישבנו על הברכיים, צמודים. בלי אור. בלי אוויר. בלי מים. הקטן, אורי בן 8, התחיל לבכות. לחשתי לו "אורי, תחזיק את היד שלי. אני אספר לך סיפור".',
          'סיפרתי סיפור. אחר כך עוד אחד. אחר כך שירים בלחישה. כל פעם ששמענו צעדים בחוץ, השתתקנו. אחת הבנות הקטנות עשתה פיפי - לא אמרה כלום, פשוט עשתה. אני ניגבתי בשרוול שלי. היא הסתכלה עליי בעיניים שלא נשכח. אמרתי לה "זה בסדר".',
          'בשתיים בצהריים שמעתי מחבל בחדר. הוא דיבר בערבית. אני יודע ערבית מבית הספר. הוא אמר לחברו "תבדוק שם". והחבר ענה "ריק". הם לא בדקו את הארון. אני לא יודע למה. אני יודע שזה הציל לנו את החיים.',
        ],
      },
      {
        title: 'פרק ג׳ - האור',
        imageSeeds: ['rescue-soldiers', 'family-reunion'],
        paragraphs: [
          'בארבע אחר הצהריים שמעתי קולות בעברית. "יש פה מישהו?". פתחתי את הארון לאט. שני חיילי צה״ל הרימו עלי נשק. אז הם ראו 14 ילדים מאחוריי. אחד מהם התחיל לבכות. הם הוציאו אותנו דרך החלון.',
          'כל 14 הילדים חזרו להוריהם. שבעה מההורים לא היו בחיים. שבעה ילדים יצאו מהארון בחיים, רק כדי לגלות שהם יתומים. אני נכחתי בכל ההודעות. החזקתי ילדים. שמרתי על מבטם. זה היה הקושי הגדול - לא הארון. אחרי הארון.',
          'היום, שנה וחצי אחרי, אני עדיין בקשר עם כל 14. חלקם קוראים לי "גדי-גיבור". אני אומר להם: "אני לא גיבור. אני מדריך שעשה את העבודה שלו". הם לא מסכימים. אולי הם צודקים. אני לא יודע. אני יודע שאני אוהב אותם, ושאני מחויב להם לכל החיים. וזה מספיק לי.',
        ],
      },
    ],
    characters: [
      { name: 'גדי (המספר)', age: 21, description: 'מדריך הצופים, גשר שנה', traits: ['רגוע', 'יצירתי', 'אבא צעיר'] },
      { name: 'אורי', age: 8, description: 'הילד הקטן ביותר בארון', traits: ['מפוחד', 'אמיץ', 'תמים'] },
    ],
    reviews: [
      { name: 'הורה לילד שניצל', rating: 5, comment: 'גדי הציל את החיים של הבן שלי. אין מילים.' },
      { name: 'מדריך נוער', rating: 5, comment: 'הופך אותי לרצות להיות מדריך טוב יותר.' },
      { name: 'קוראת', rating: 5, comment: 'בכיתי שעות אחרי הקריאה. גבורה אמיתית.' },
    ],
    qualityScore: 94,
  },

  // ---------- BOOK 17: Beeri Survivor ----------
  {
    authorKey: 'ofer_beeri',
    title: 'הממ״ד שלא נשכח',
    genre: 'Memoir',
    description: 'חבר קיבוץ בארי מספר על 26 שעות במרחב מוגן ב-7/10.',
    synopsis: 'אני ואשתי, שלושת הילדים, 26 שעות בממ״ד של 4 מטר רבוע. שמענו הכל - את השכנים שצורחים, את המחבלים שצוחקים, את היריות. שרדנו. רוב חברינו לא. זה הסיפור שלא רציתי לכתוב.',
    tags: ['בארי', '7 באוקטובר', 'ממ״ד', 'קיבוץ', 'שורד'],
    ageRating: 'R',
    coverSeed: 'safe-room-door',
    coverColors: ['#3a3a3a', '#5a5a5a', '#8a8a8a'],
    chapters: [
      {
        title: 'פרק א׳ - שבת רגילה',
        imageSeeds: ['kibbutz-house', 'breakfast-table'],
        paragraphs: [
          'שבת בבוקר. רויטל ואני בכינוס משפחתי - שלושת הילדים, יואב בן 12, נועה בת 9, איתי בן 6. תכננתי שקשוקה. הייתי במטבח כששמעתי את האזעקה הראשונה. ואז שניה. ואז שלישית.',
          'לא הייתה הפסקה בין הצפירות. ידעתי משהו לא בסדר. הזעקתי את כולם לממ״ד. בארבע דקות. רויטל לקחה את איתי, אני סחבתי שני בקבוקי מים, נועה ויואב נכנסו לבדם. סגרתי את הדלת.',
        ],
      },
      {
        title: 'פרק ב׳ - 26 שעות',
        imageSeeds: ['shaft-light', 'family-huddled'],
        paragraphs: [
          'בעשר בבוקר שמעתי דפיקות חזקות. ערבית. צעקות. הם ניסו לפתוח את הדלת של הממ״ד. החזקתי את הידית בידיים שלי 12 שעות רצופות. רויטל החזיקה איתי. החליפו ידיים, החליפו עמדה. הילדים ישבו על הרצפה ולא הוציאו צליל.',
          'הם ניסו פעם, פעמיים, שלוש. הם ירו בדלת. כדור עבר ופגע בקיר 20 ס"מ מעל הראש של נועה. היא לא צרחה. בת 9. היא רק הסתכלה עליי. אמרתי לה בלחש "אבא פה. הכל יהיה בסדר". זה היה השקר הכי גדול שאמרתי בחיי. הוא גם היה הצורך הכי גדול.',
          'לרגעים שמענו את השכנה שלנו, מירי, צורחת מהבית הסמוך. שמענו אותה צורחת "תפסיקו! תפסיקו!". ואז שקט. רויטל סגרה את האוזניים של איתי. אני הסתכלתי על התקרה. ספרתי את האריחים. שכחתי כמה הם.',
        ],
      },
      {
        title: 'פרק ג׳ - לחיות',
        imageSeeds: ['rescue-team', 'temporary-housing'],
        paragraphs: [
          'הצבא הגיע ב-12 בצהריים, יום שני. 26 שעות אחרי שנכנסנו לממ״ד. כשפתחו לנו את הדלת, רויטל לא יכלה ללכת. נשאתי אותה. הילדים יצאו אחרינו, לבד. איתי הסתכל בשמש ושאל "אבא, זה היה משחק?". לא ידעתי איך לענות.',
          'מ-1,200 חברי בארי, 100 נרצחו. עוד 30 נחטפו. אני הכרתי כל אחד. אני יודע את השמות, את השכונות, את הסיפורים. הקיבוץ שלי לא קיים יותר במובן שהיה. אנחנו מפוזרים בארץ - חלקנו בנתיבות, חלקנו בקריית גת, חלקנו לא חזרו ולא יחזרו.',
          'אני כותב את הספר הזה כי אני מפחד לשכוח. כי כל יום, פרט אחד דועך. שם של ילד שלא היה בכיתה של נועה. צבע הדלת של בית של מירי. הפנים של אישה שעברה לידי בקפה. אני שומר עליהם פה, על דפים. כי האחריות שלי, של הניצולים, היא הזיכרון. רק זה.',
        ],
      },
    ],
    characters: [
      { name: 'עופר (המספר)', age: 45, description: 'חבר קיבוץ בארי, אבא לשלושה', traits: ['חזק', 'נחוש', 'שבור'] },
      { name: 'רויטל', age: 43, description: 'אשתו', traits: ['חזקה', 'אם', 'יציבה'] },
      { name: 'נועה', age: 9, description: 'בתם, ראתה כדור עובר 20 ס״מ מעל ראשה', traits: ['שקטה', 'חכמה', 'נושאת זיכרון'] },
    ],
    reviews: [
      { name: 'חבר קיבוץ', rating: 5, comment: 'עופר - אנחנו זוכרים יחד. תודה שכתבת.' },
      { name: 'תושבת עוטף', rating: 5, comment: 'הספר הזה צריך להיות בכל בית בישראל.' },
      { name: 'קוראת', rating: 5, comment: 'אין מילים. רק תודה ששרדתם, ושכתבתם.' },
    ],
    qualityScore: 93,
  },

  // ---------- BOOK 18: Reservist 7/10 ----------
  {
    authorKey: 'yonatan_miluim',
    title: '200 ימים במילואים',
    genre: 'Military Memoir',
    description: 'קצין מילואים מספר על שירות 200 יום אחרי 7 באוקטובר.',
    synopsis: 'הייתי בעבודה ביום שבת. בלילה הייתי בצפון. אחרי 200 ימים חזרתי הביתה לבת שלי שגדלה בלי. זה הסיפור שלי - ושל הדור שלי, שגויס מהחיים האזרחיים והפך ללוחמים בלי הכנה.',
    tags: ['מילואים', '7 באוקטובר', 'מלחמת חרבות ברזל', 'משפחה'],
    ageRating: 'PG-13',
    coverSeed: 'reservist-gear',
    coverColors: ['#3a4a3a', '#6a7a5a', '#a8b59a'],
    chapters: [
      {
        title: 'פרק א׳ - "כן, אני כבר בא"',
        imageSeeds: ['family-saturday', 'army-uniform-bag'],
        paragraphs: [
          'שבת, 11:00. הייתי במשחקייה עם אמלי בת ה-2.5. גרסה השלוש שלה הייתה "אבא תדחוף!". דחפתי כבר עשרים דקות. הטלפון ויברט. ראיתי "מ"פ" על המסך. ידעתי לפני שעניתי.',
          '"יונתן, אנחנו בקרב. כמה זמן עד שאתה כאן?". ענתי "שעתיים". הוא אמר "תזוז". סגרתי. אמלי הסתכלה עליי. אמרתי לה "תינוקת, אבא חייב ללכת. תזכרי שאני אוהב אותך מאוד מאוד מאוד". היא הסתכלה ושאלה "תחזור?". זאת הייתה השאלה שהיא תשאל אותי 200 פעם בטלפון בחודשים הבאים.',
        ],
      },
      {
        title: 'פרק ב׳ - בחזית',
        imageSeeds: ['gaza-tunnel', 'soldier-night'],
        paragraphs: [
          'נכנסנו לעזה ב-27 לאוקטובר. הייתי קצין סגן בפלוגה של מילואים. תחת פיקודי 30 חיילים - שניים אדריכלים, אחד מורה תיכון, חמישה בעלי סטרטאפים, אחד נהג מונית, אחד רב. כולם מעל גיל 30. כולם הותרו מחיים שונים מאוד מהמציאות הזאת.',
          'הקרב הראשון היה בלילה, בבית מגורים. נכנסנו דרך החלון, חיפשנו מנהרות. הסטרטאפיסט שלי, יואב, מצא פתח של מנהרה מתחת למקרר. הוא צחק. אמר "אבא שלי תמיד אמר שיש משהו טוב במקרר". הוא היה גיבור. הוא נפצע באותו הקרב, אבל חזר.',
          'הסתובבנו בחורבות יומם ולילה. ראינו דברים שלא ברצוני לכתוב. גם דברים שכן ברצוני - חייל מילואים בן 38, אבא לארבעה, שהציל כפר שלם של פלסטינים. שמירה על מתנדבי או"ם פצועים. ילדים פלסטינים שנתנו לנו מים בחילוץ. אנושיות, גם בכאוס.',
        ],
      },
      {
        title: 'פרק ג׳ - חזרה הביתה',
        imageSeeds: ['homecoming-hug', 'toddler-running'],
        paragraphs: [
          'אפריל 2024. השתחררתי מהמילואים אחרי 200 ימים. הגעתי הביתה ב-3 בלילה. אמלי ישנה. הסתכלתי עליה במיטה - היא גדלה מטר בזמן שלא הייתי. היא לבשה פיג׳מה שלא ראיתי. זרים בעצם.',
          'בבוקר היא קמה, ראתה אותי, התקרבה אליי בזהירות. נגעה בלחי שלי. אמרה "אבא". זה הכל. ואז התרחקה, חזרה לאמא. שלושה ימים לקח לה לחבק אותי שוב. עוד שבועיים עד שהיא ישנה איתי בלילה. עוד חודש עד שהיא קראה לי "אבא" בלי הסתייגות.',
          'אני כותב את זה לא לעצמי. כותב לאמלי כשהיא תהיה בת 18. כדי שתבין למה לפעמים אבא שלך לא ישן. למה הוא רוצה לדעת איפה את כל רגע. למה כשמטוס עובר נמוך הוא קופץ. כי הוא היה במקום, בזמן שאת היית בלעדיו, ועוד היום הוא חוזר משם, לאט לאט, יום אחר יום.',
        ],
      },
    ],
    characters: [
      { name: 'יונתן (המספר)', age: 35, description: 'קצין מילואים, אבא לאמלי', traits: ['אחראי', 'אוהב', 'נושא משא'] },
      { name: 'אמלי', age: 2.5, description: 'בתו, שגדלה בלי אבא 200 יום', traits: ['חכמה', 'רגישה', 'יצירתית'] },
      { name: 'יואב', age: 32, description: 'חייל מילואים, סטרטאפיסט שמצא מנהרה', traits: ['חכם', 'מצחיק', 'אמיץ'] },
    ],
    reviews: [
      { name: 'מילואימניק', rating: 5, comment: 'יונתן - גם אני הייתי שם. תודה.' },
      { name: 'אישה של מילואימניק', rating: 5, comment: 'בעלי קרא ובכה. סוף סוף הוא יכול לדבר.' },
      { name: 'קוראת', rating: 5, comment: 'מציג את הצד הבלתי נראה של המלחמה - המשפחות.' },
    ],
    qualityScore: 91,
  },

  // ---------- BOOK 19: Gush Katif ----------
  {
    authorKey: 'avraham_katif',
    title: 'בית בחול',
    subtitle: 'גוש קטיף, לפני ואחרי',
    genre: 'Memoir',
    description: 'חקלאי מגוש קטיף מספר על הבית, החממות, וההתנתקות.',
    synopsis: 'גידלתי עגבניות מהזן הטוב ביותר בארץ. בניתי בית בחולות גוש קטיף עם הידיים שלי. ב-2005 הם באו ופירקו לי את הבית. עברו 20 שנה. אני עדיין חולם על החממה. זה הסיפור.',
    tags: ['גוש קטיף', 'התנתקות', '2005', 'חקלאות', 'התיישבות'],
    ageRating: 'PG',
    coverSeed: 'greenhouse-sand',
    coverColors: ['#d4a574', '#a87545', '#5a3a1a'],
    design: {
      titleFont: 'Frank Ruhl Libre',
      font: 'Heebo',
      accentColor: '#d4a574',
      divider: 'flourish',
      titleSize: 48,
      titlePosition: { x: 50, y: 28 },
      pullQuoteIndex: 1,
    },
    chapters: [
      {
        title: 'פרק א׳ - חולות שהפכו לגן',
        imageSeeds: ['gaza-greenhouse', 'tomato-harvest'],
        paragraphs: [
          'הגעתי לגוש קטיף ב-1979, בן 22, נשוי טריה לתמר. הייתי חבר בחבורת חברים שהאמינה שאפשר לגדל ירקות במקום שאלוהים שכח. בנינו חממה ראשונה בידיים. השמש שרפה אותנו, החול נכנס לכל מקום. אבל אחרי שלוש שנים גידלנו את העגבניות הטובות ביותר במזרח התיכון.',
          'גוש קטיף לא היה רק מקום. גוש קטיף היה אמונה - שהמדבר יפרח, שאפשר לעשות מה שלא נעשה, שיש מקום שבו עברית, פלסטינים ועברה הולכים יחד. גידלנו את הילדים שלנו עם פלסטינים שעבדו אצלנו 25 שנה. הם הכירו את הבן שלי מהיום שנולד.',
          'ב-2003 התחילו השמועות. שמעתי את ראש הממשלה אומר "מה שלא ראיתי משם, לא קיים משם". ידעתי שמתכננים משהו. לא רציתי להאמין.',
        ],
      },
      {
        title: 'פרק ב׳ - הימים האחרונים',
        imageSeeds: ['protest-orange', 'soldiers-evict'],
        paragraphs: [
          'אוגוסט 2005. שלושה חודשים לפני, ידענו. ילדי השכנים חבשו חולצות כתומות. תפילות ברחובות. ספר תורה הוחזר לישיבה. אסיפות בלילות, החלטות שלא ניקח אקדח, שלא נילחם בחיילים. רק נבכה.',
          'ביום הפינוי הגיע סמ"מ צעיר. בן 22. גיל הבן שלי, יוסי. הוא נכנס לבית. עיניו דמעו. אמר "אדוני, אני מצטער. אני מוכרח". אמרתי לו "תעשה את עבודתך". לקחתי שני בגדים, את ספר התורה של אבא, תמונה של תמר. עזבתי בית של 26 שנה ב-15 דקות.',
          'בכביש לאשקלון התעופף הרכב שלי. הסתכלתי בראיה אחורית. ראיתי את גוש קטיף נעלם. ראיתי את החממות שלי. בכיתי. תמר בכתה. יוסי, שהיה בן 26, אמר "אבא, אנחנו ניבנה במקום אחר". זה היה השקר היפה הראשון של החיים החדשים שלנו.',
        ],
      },
      {
        title: 'פרק ג׳ - שורשים בלי אדמה',
        imageSeeds: ['caravan-housing', 'second-greenhouse'],
        paragraphs: [
          'גרנו בקראוון בניצן שש שנים. הילדים שלי גדלו עם תחושה שהבית יכול להעלם בכל יום. תמר חלתה - הרופאים אמרו דיכאון. אני אמרתי "געגוע". זה אותו דבר.',
          'ב-2011 קיבלנו בית בארגז של בארי. בניתי חממה חדשה. גידלתי עגבניות. הטעם לא היה אותו טעם. החול לא היה אותו חול. אבל זה היה משהו. ב-7 באוקטובר 2023 פרקו אותנו שוב, הפעם כי המקום שלנו היה יעד למחבלים. עכשיו אני בקריית מלאכי, בן 67, ובלי בית קבוע.',
          'תמר נפטרה אשתקד. יוסי גר בירושלים, חולם להחזיר את משפחת אבותיו לחקלאות. הנכדים שלי שואלים "סבא, איפה הגינה שלך?". אני עונה "בלב, נכדה. הגינה שלי בלב". הם לא מבינים עדיין. יום אחד הם יבינו. עד אז אני אכתוב להם, אספר להם, אזכיר להם - שלסבא היה פעם בית בחול, ובו צמחו דברים יפים.',
        ],
      },
    ],
    characters: [
      { name: 'אברהם (המספר)', age: 67, description: 'חקלאי מגוש קטיף', traits: ['חרוץ', 'מאמין', 'נושא געגוע'] },
      { name: 'תמר', description: 'אשתו לאורך 45 שנה, נפטרה אשתקד', traits: ['חזקה', 'אם', 'נעדרת'] },
      { name: 'יוסי', age: 46, description: 'בנם, חולם להמשיך את החקלאות', traits: ['ירש', 'נחוש', 'עצוב'] },
    ],
    reviews: [
      { name: 'מפונה מגוש קטיף', rating: 5, comment: 'אברהם - הסיפור שלי. תודה שכתבת מה שאני לא יכול.' },
      { name: 'קוראת', rating: 5, comment: 'הסתכלתי על ההתנתקות אחרת אחרי הספר הזה.' },
      { name: 'נכד', rating: 5, comment: 'סבא, אני קוראת. אני זוכרת.' },
    ],
    qualityScore: 90,
  },

  // ---------- BOOK 20: Morocco Aliyah 1957 ----------
  {
    authorKey: 'rivka_maroc',
    title: 'מהאטלס למעברה',
    subtitle: 'ילדה ממרוקו בשנות החמישים',
    genre: 'Memoir',
    description: 'ילדה בת 7 שעלתה מהרי האטלס במרוקו ל"שער העלייה" 1957.',
    synopsis: 'בכפר שלי בהרי האטלס לא היה חשמל. היו רק כוכבים בלילה. בגיל 7 העבירו אותנו לאוניית ספינה, ואז למעברה במרסיי, ואז לחיפה. גרנו באוהל שלוש שנים. למדתי עברית מילד שלי גרבים. זה הסיפור של דור שלם.',
    tags: ['עלייה', 'מרוקו', 'מעברה', 'שנות החמישים', 'מזרחיים'],
    ageRating: 'PG',
    coverSeed: 'morocco-village',
    coverColors: ['#6b3a1a', '#d97a2a', '#f4c574'],
    design: {
      titleFont: 'Frank Ruhl Libre',
      accentColor: '#f4c574',
      divider: 'wave',
      titleSize: 38,
      titlePosition: { x: 50, y: 35 },
      pullQuoteIndex: 2,
    },
    chapters: [
      {
        title: 'פרק א׳ - הכפר',
        imageSeeds: ['atlas-mountains', 'berber-village'],
        paragraphs: [
          'נולדתי בכפר טאהאלא, גבוה בהרי האטלס במרוקו, 1950. אבא היה צורף כסף. אמא ארגה שטיחים. היינו 14 ילדים - שני אחים בכורים נפטרו בקטנות. אני הייתי בת 5.',
          'הכפר היה קסם. בלילות סבא היה מספר סיפורים על אליהו הנביא שמטייל בהרים. הברברים השכנים היו מביאים לנו תה במנטה. דיברנו ערבית-מרוקאית בבית, צרפתית בבית הספר, עברית רק במקדש. ידעתי שאני יהודייה כי בשבת לא הדלקתי אש.',
          'ב-1956 קמה ישראל. שמעתי את אבא וחבריו לוחשים. "בן גוריון". "אסיפה". "אנחנו עולים". לא הבנתי. חשבתי שהולכים לעיר אחרת.',
        ],
      },
      {
        title: 'פרק ב׳ - הספינה',
        imageSeeds: ['marseille-port', 'immigrant-ship'],
        paragraphs: [
          '1957, נסענו ארבעה ימים בעגלת חמורים מהכפר למרקש. אז ברכבת לקזבלנקה. אז באנייה למרסיי. הייתי בת 7. ראיתי ים בפעם הראשונה. בכיתי. חשבתי שאלוהים עושה את כל המים האלה כדי להפריד אותנו מהבית.',
          'במחנה במרסיי חיינו שלושה חודשים. שמונים אנשים בחדרון אחד. אנשים חולים. אנשים מתים. אחותי הקטנה, ויוו, חלתה. ביום שעלינו על האנייה לחיפה, היא נפטרה. קברנו אותה במרסיי. אני עדיין חולמת על הקבר הזה.',
          'באנייה היה רעב. אכלנו פעם ביום. אבא היה מחלק את האוכל שלו ביננו. הוא הגיע לחיפה במשקל 48 קילו. כשירדנו, הוא נפל. נשאו אותו על אלונקה. זאת הייתה ההכרזה שלי לארץ הקודש - אבא שלי על אלונקה.',
        ],
      },
      {
        title: 'פרק ג׳ - לחיות במעברה',
        imageSeeds: ['transit-camp', 'children-school'],
        paragraphs: [
          'מעברת שער העלייה, חיפה. אוהל קנבס לעשרה אנשים. שתי שמיכות. דלי לפיפי. אנחנו, מהרי האטלס, גרנו ליד משפחה מתוניס, משפחה מתימן, משפחה מעיראק. אף אחד לא הבין שפה של השני, אבל כולנו הבנו רעב.',
          'הלכתי לבית ספר במעברה. המורה הייתה צברית מקיבוץ. היא לא הבינה את האקסנט שלי, אני לא הבנתי שלה. ילד אחד, יוסי, שלי גרבים, הוא היה ממרוקו גם, אבל מבית "טוב". הוא לימד אותי עברית. בשבילו היה רק 11. בשבילי - הציל אותי.',
          'גרנו במעברה שלוש שנים. אז בית בקריית טבעון. אבא נפטר בגיל 51 - שחיקה, אומרים הרופאים, אבל אני יודעת. אמא חיה עד 99. ראתה את הנכדים, הנינים. תמיד אמרה "באנו לכאן בכאב, אבל הילדים שלנו - הם הסיפור היפה". היום אני בת 75. עו"ד, סבתא, אישה חופשייה. וזה הסיפור היפה.',
        ],
      },
    ],
    characters: [
      { name: 'רבקה (המספרת)', age: 7, description: 'הילדה שעזבה את הרי האטלס', traits: ['סקרנית', 'חזקה', 'מסתכלת'] },
      { name: 'ויוו', age: 4, description: 'אחות קטנה שנפטרה במרסיי', traits: ['מתוקה', 'חולה', 'נעדרת'] },
      { name: 'יוסי הילד', age: 11, description: 'שלי גרבים, לימד אותה עברית', traits: ['חכם', 'נדיב', 'חבר'] },
    ],
    reviews: [
      { name: 'בן עליית מרוקו', rating: 5, comment: 'אמא שלי הייתה במעברה. רבקה כתבה בשמה.' },
      { name: 'מורה להיסטוריה', rating: 5, comment: 'חסר בלימודים. הספר הזה ימלא חלל גדול.' },
      { name: 'נכדה', rating: 5, comment: 'סבתא שלי בכתה כשקראה. תודה רבקה.' },
    ],
    qualityScore: 89,
  },

  // ---------- BOOK 21: Druze Soldier ----------
  {
    authorKey: 'samer_druze',
    title: 'דם אחד',
    subtitle: 'חייל דרוזי על האחווה',
    genre: 'Memoir',
    description: 'חייל דרוזי בגבעתי מספר על השירות, הזהות, והאחווה.',
    synopsis: 'אני סאמר. דרוזי מהכפר חורפיש. שירתי בגבעתי 5 שנים, נלחמתי בעזה ב-2014, ב-2023. הגעתי לקרבות עם פלוגה של 30 חיילים יהודים. כשנפצעתי, חבר יהודי גרר אותי 200 מטר תחת אש. זה הסיפור על האחים שלי.',
    tags: ['דרוזים', 'גבעתי', 'אחווה', 'מיעוטים', 'צה״ל'],
    ageRating: 'PG-13',
    coverSeed: 'druze-village',
    coverColors: ['#1a3a4a', '#4a6a7a', '#a8c5d5'],
    design: {
      titleFont: 'Heebo',
      accentColor: '#a8c5d5',
      divider: 'stars',
      titleSize: 44,
      titlePosition: { x: 50, y: 30 },
      pullQuoteIndex: 1,
    },
    chapters: [
      {
        title: 'פרק א׳ - שני דגלים',
        imageSeeds: ['druze-village-2', 'army-recruitment'],
        paragraphs: [
          'נולדתי בחורפיש, כפר דרוזי בגליל, 1995. סבא שלי לחם בצה״ל ב-1956. אבא שלי לחם בלבנון 1982. אני? לחמתי בעזה 2014, וגם 2023. שלושה דורות. אותו דם.',
          'בכפר שלי שני דגלים מתנופפים על המסגד - ישראל, ודגל הדרוזים. אנחנו שייכים לכאן. לא תמיד הבנתי את זה כילד. בגיל 12, יום הזיכרון, ראיתי בכיכר את שמות הדרוזים שנפלו. 423 שמות. אז הבנתי.',
          'בגיל 18 התגייסתי לגבעתי. הגעתי לבסיס, מפקד פלוגה אמר "סאמר, מה אתה רוצה?". אמרתי "להיות בלוחמים". הוא חייך. "אז תהיה". וזה היה. בלי שאלות. בלי מבטים.',
        ],
      },
      {
        title: 'פרק ב׳ - הקרב בעזה',
        imageSeeds: ['gaza-rubble', 'soldier-injured'],
        paragraphs: [
          'נובמבר 2023. נכנסנו לבית חאנון. הייתה לילה. נכנסנו לבית. בקומה השנייה תופפו - מחבלים. הם פתחו אש. אני נפצעתי בירך, נפלתי. דניאל - חבר מהפלוגה שלי, יהודי מבני ברק - גרר אותי במורד המדרגות.',
          'דניאל היה נשוי טריה. נולדה לו ילדה לפני שלושה חודשים. הוא יכול היה לתת לי שם. לעצור, לבדוק, לחכות לפינוי. במקום זה גרר 200 מטר תחת אש. כשהגענו למחסה, הוא נפל לידי. אמר "אחי, אתה לא הולך לשום מקום". זאת הייתה הסמיכות הפיזית הכי גדולה שהרגשתי בחיים.',
          'דניאל לא נפצע באותו לילה. אבל שבועיים אחר כך הוא נפל בקרב אחר. הלכתי לקבר שלו אחרי שיצאתי מהשיקום. אמרתי "תודה, אחי". בערבית. הוא היה אומר את זה גם כשהוא לא הבין. אני לימדתי אותו.',
        ],
      },
      {
        title: 'פרק ג׳ - שייכות',
        imageSeeds: ['druze-jewish-friends', 'flag-mountain'],
        paragraphs: [
          'עברתי שיקום. רגל ימין שלי לא חוזרת לגמרי. אני הולך עם קל-עזר עכשיו, בגיל 28. אבל אני חי. דניאל לא. ההורים שלו באו לכפר שלי לבית האבל. אמא שלו חיבקה את אמא שלי. שתי אמהות שכולות. שונות בכל. דומות בעיקר.',
          'יש מי שאומרים שאני בוגד. דרוזי, אומרים, צריך להיות בעם שלו. אני אומר: אני בעם שלי. דרוזים בישראל הם חלק מסיפור גדול יותר. סבא, אבא, ואני - אנחנו מוכיחים שאחווה היא לא רק סיסמה. היא ממש. אני נושא אותה ברגל הקרועה שלי.',
          'הילדים של דניאל - אני דוד שלהם עכשיו. אני נוסע לבני ברק כל חודש. אנחנו אוכלים יחד. אני מספר להם על אבא שלהם. אסתר, הבכורה, היא בת שלוש כעת. היא אמרה לי שבוע שעבר "דוד סאמר, אתה אוהב את אבא שלי?". אמרתי "כן, יקירה. כל יום". זאת התשובה היחידה.',
        ],
      },
    ],
    characters: [
      { name: 'סאמר (המספר)', age: 28, description: 'חייל דרוזי בגבעתי, נפצע בעזה', traits: ['גאה', 'נאמן', 'אנושי'] },
      { name: 'דניאל', age: 23, description: 'חבר מהפלוגה, יהודי, נפל בקרב', traits: ['אמיץ', 'אבא', 'נעדר'] },
      { name: 'אסתר', age: 3, description: 'בתו של דניאל', traits: ['קטנה', 'מתוקה', 'יתומה'] },
    ],
    reviews: [
      { name: 'דרוזי מחורפיש', rating: 5, comment: 'סאמר כתב את הסיפור של כולנו. גאווה דרוזית.' },
      { name: 'יהודי מבני ברק', rating: 5, comment: 'מציג אחווה אמיתית. ספר חובה.' },
      { name: 'קוראת', rating: 5, comment: 'הסתכלתי על דרוזים אחרת אחרי הספר.' },
    ],
    qualityScore: 92,
  },

  // ---------- BOOK 22: Bnei Menashe ----------
  {
    authorKey: 'yosef_menashe',
    title: 'הדרך מהינדיסטן',
    subtitle: 'בני מנשה - יהודים מהינדו',
    genre: 'Memoir',
    description: 'יוסף ממנשה, מהשבט שאיבד בני ישראל בהודו, מספר על העלייה.',
    synopsis: 'הסבים שלי לימדו אותי בהודית-מנשה את הסיפור: אנחנו צאצאי מנשה, שבט אבוד מבני ישראל. עברו 2,700 שנה. ב-2007 עליתי לישראל. בגיל 24 התחלתי הכל מחדש - שפה, דת, זהות. זה הסיפור שלי.',
    tags: ['בני מנשה', 'הודו', 'עלייה', 'שבטים אבודים', 'זהות'],
    ageRating: 'G',
    coverSeed: 'india-mountain',
    coverColors: ['#3a4a1a', '#7a9a4a', '#c5d97a'],
    design: {
      titleFont: 'Frank Ruhl Libre',
      accentColor: '#c5d97a',
      divider: 'flourish',
      titleSize: 40,
      titlePosition: { x: 50, y: 32 },
      pullQuoteIndex: 0,
    },
    chapters: [
      {
        title: 'פרק א׳ - השבט שזכר',
        imageSeeds: ['mizoram-village', 'family-praying'],
        paragraphs: [
          'נולדתי באייזאל, ביבשת מיזורם בצפון מזרח הודו, 1983. אנחנו השבט "המארה" - על פי המסורת שלנו, אנחנו צאצאי מנשה, אחד מעשרת השבטים האבודים של בני ישראל. סבא לימד אותי שירים בעברית עתיקה שאף אחד לא הבין את המילים, אבל ידענו - אלו השירים שאבותינו שרו.',
          'גדלנו בהינדו. בנצרות. הכפרים סביב היו בודהיסטים. אבל אנחנו, המארה, התפללנו לאל אחד. אכלנו כשר על פי מסורת שעברה במשך אלפיים וחמש מאות שנים. הילדים בכפר לעגו לי - "ילד הסבא של מצרים".',
          'בגיל 16 פגשתי רב מישראל. הוא בא להעריך אם אנחנו באמת יהודים. הוא בכה כשראה את החנוכייה שלנו - מעץ, חתוכה ביד, עם תשעה נרות. אמר "אתם אחים שלנו". זאת הייתה הפעם הראשונה ששמעתי מישהו אומר את זה לי.',
        ],
      },
      {
        title: 'פרק ב׳ - העלייה',
        imageSeeds: ['plane-india', 'tel-aviv-arrival'],
        paragraphs: [
          '2007. הסכמת ישראל לקבל אותנו - 7,000 בני מנשה לאורך השנים. עברתי גיור. למדתי עברית במהלך שנה. עזבתי את אמא שלי - היא לא הייתה מספיק חזקה לטיסה. היא נפטרה אחרי שנה, בלי שראיתי אותה שוב.',
          'נחתי בנתב״ג בלילה. אישה במדים בנמל אמרה "ברוך הבא, אחי". בכיתי. אנשים סביבי הסתכלו בי - אסייתי, עם ספר תפילה ביד, מבכה ומברך בעברית. בילדותי האנשים בכפר חשבו אותי לשונה. כאן בארץ הקודש, כן ולא.',
          'גרתי באולפן בנצרת עילית. שמונה חודשים. למדתי שאני יהודי, וגם שאני "יהודי הודי" - שני זהויות שלא הצלחתי להפריד. השכנים לא ידעו מה לעשות איתי. הם הביאו לי חלה בשבת, אבל גם שאלו "אתה באמת יהודי?". אני עניתי "יותר טוב מכמה ממכם". לא הם הצחיקו. אני הצחקתי - ולא הצליחו לקבל את זה.',
        ],
      },
      {
        title: 'פרק ג׳ - בית, סוף סוף',
        imageSeeds: ['young-family-israel', 'sabbath-table'],
        paragraphs: [
          'התחתנתי ב-2010 עם רחל - גם היא ממיזורם, עלתה שנה לפני. נולדו לנו שלושה ילדים: דניאל, מירי, וגדעון. הם דוברי עברית-ילידים. הם לא מבינים את הסבל שעברו ההורים שלהם. וזה בסדר. זאת המתנה שלנו אליהם.',
          'אני עובד עכשיו ברפת קיבוצית, ליד קצרין. עוזר ב-מילואים בצופן הצוללת. הילדים שלי לומדים בבית ספר ממלכתי-דתי. דניאל בן 14 התחיל בר מצוות. כתב את הדרשה שלו על "השבת האבדה" - על השבט שלנו, וגם על משפחות שאבדו בנים בקרבות. אני לא יכולתי לעצור את הדמעות.',
          'ב-7 באוקטובר נפצעתי - הייתי מילואים בעוטף. לא נעדרתי, אבל ראיתי דברים שלא יכולים להישכח. עכשיו אני בשיקום נפשי. רב הקהילה שלי שאל אותי "יוסף, אתה מצטער שעלית?". עניתי "להפך, רב. עליתי כדי לחיות פה. ולחיות פה זה גם להילחם פה. ולחיות עם הצלקות. אני בית. סוף סוף". זאת התשובה.',
        ],
      },
    ],
    characters: [
      { name: 'יוסף (המספר)', age: 41, description: 'עולה מהודו, מבני מנשה', traits: ['מאמין', 'נחוש', 'אוהב'] },
      { name: 'רחל', age: 38, description: 'אשתו, גם מבני מנשה', traits: ['חכמה', 'אם', 'יציבה'] },
      { name: 'דניאל', age: 14, description: 'בנם הבכור, ילד צבר', traits: ['חרוץ', 'נושא מסורת', 'שמח'] },
    ],
    reviews: [
      { name: 'בן מנשה', rating: 5, comment: 'יוסף דיבר בשמי. תודה אחי.' },
      { name: 'רב', rating: 5, comment: 'סיפור מרגש על שיבת ציון אמיתית בעידן שלנו.' },
      { name: 'קוראת', rating: 5, comment: 'לא ידעתי על בני מנשה. הספר הזה פותח עיניים.' },
    ],
    qualityScore: 88,
  },

  // ---------- BOOK 23: Grandfather's Poland Story ----------
  {
    authorKey: 'moshe_poland',
    title: 'מה שסבא לא סיפר',
    subtitle: 'פולין, 1939',
    genre: 'Memoir',
    description: 'סבא בן 95 מספר לנכדיו את הסיפור שהסתיר 70 שנה.',
    synopsis: '70 שנה לא דיברתי על מה שהיה. ילדיי גדלו בלי לדעת מאיפה הסיוטים שלי. עכשיו, בגיל 95, אני מספר. כי הנכדים שואלים. כי לפני שאני הולך, מישהו צריך לדעת.',
    tags: ['שואה', 'פולין', 'סבא', 'זיכרון', 'דורות'],
    ageRating: 'PG-13',
    coverSeed: 'old-photograph',
    coverColors: ['#3a3a3a', '#6a5a4a', '#a89678'],
    design: {
      titleFont: 'Frank Ruhl Libre',
      accentColor: '#a89678',
      divider: 'line',
      titleSize: 36,
      titlePosition: { x: 50, y: 38 },
      pullQuoteIndex: 2,
    },
    chapters: [
      {
        title: 'פרק א׳ - הילד של לבוב',
        imageSeeds: ['lvov-prewar', 'jewish-school'],
        paragraphs: [
          'נולדתי בלבוב, פולין, 1930. אבא היה רופא, אמא ספרנית. גרנו בדירה גדולה ברחוב פילסודסקי. הייתי הצעיר משלושה אחים - אהרון בן 15, חיים בן 12, אני בן 9. אהרון רצה להיות אדריכל. חיים רצה להיות שחקן כדורגל. אני רציתי להיות כמוהם.',
          'בספטמבר 1939 הגרמנים נכנסו לפולין. בית הספר היהודי שלי נסגר. אבא הפסיק לעבוד בבית החולים - אמרו "יהודים לא". כמה ימים אחר כך באו הסובייטים. ואז, ב-1941, הגרמנים שוב. כל פעם זה היה גרוע יותר.',
          'הקימו גטו. אנחנו, חמש משפחות, גרנו בדירה שלנו. אבא היה רופא בגטו - היחיד. הוא הציל אנשים בלי תרופות, בלי ציוד. בלילות הוא ישב על המיטה שלי וסיפר לי סיפורים. תמיד עם סוף טוב. אני ידעתי שאלו שקרים. אבל אהבתי לשמוע.',
        ],
      },
      {
        title: 'פרק ב׳ - מה שלא סיפרתי',
        imageSeeds: ['snowy-forest', 'hidden-cellar'],
        paragraphs: [
          'באוגוסט 1942 התחיל "האקציה". באו הגרמנים ולקחו את כל היהודים מהגטו. אבא, אמא, אהרון, חיים - לקחו אותם. אני התחבאתי במרתף הבית - אבא דחף אותי לשם בבוקר ואמר "תישאר. אל תזוז. אני אחזור".',
          'הוא לא חזר. שלושה ימים שכבתי במרתף. אכלתי תפוחי אדמה רקובים. שתיתי מים מצינור. שמעתי צעדים מעליי - חיילים, פולנים שהשתלטו על הבית. בלילה הרביעי יצאתי. הלכתי בשלג, לכפר של אישה שעבדה אצלנו פעם. היא הסתירה אותי שנתיים בשק על העלייה, מתחת לקש.',
          'את זה לא סיפרתי שבעים שנה. לא לאשתי. לא לילדיי. לא לאף אחד. כי איך אומרים - מה שעשיתי במרתף, כשהגיעו צעדים, כשפחדתי שיגלו אותי. עשיתי הכי שקט שיכולתי. דחקתי את עצמי לפינה. וכששמעתי דפיקות בדלת המרתף - נשמתי דרך השרוול שלי, כדי שלא ישמעו. כך הייתי במשך 60 שעות. עד שהשתתקו.',
        ],
      },
      {
        title: 'פרק ג׳ - הנכדים',
        imageSeeds: ['grandfather-grandchild', 'family-table'],
        paragraphs: [
          '2024. אני בן 95. גרתי בארץ מ-1948. בניתי משפחה. נולדה לי בת, אחר כך בן. גידלתי אותם בלי לספר. הם שאלו, אני שתקתי. אמא שלהם - גם ניצולה - שתקה גם. שתינו ידענו ולא דיברנו. כך עברו 70 שנה.',
          'לפני שנה הנכד שלי, אריאל, בן 16, כתב פרויקט גמר על הסבים שלו. הוא ישב מולי עם מצלמה ושאל. אמרתי "שום דבר". הוא אמר "סבא, בבקשה". משהו בעיניים שלו - אני לא יודע. פתחתי. סיפרתי. שלוש שעות. בכיתי בפעם הראשונה מאז 1942.',
          'אחרי זה, סיפרתי לבת שלי. לבן שלי. לאשתי - היא נפטרה לפני 8 שנים, אז בקבר. הם לא ידעו. הם בכו. אבל גם הוקל להם. הסיוטים שלי, הפחדים שלי, המראות שלהם משונה - הכל קיבל הסבר. אריאל פרסם את הסיפור באתר. עכשיו אני כותב ספר. כי הזמן אוזל. כי השתיקה הייתה הטעות שלי. כי דבר אחד למדתי בגיל 95: השתיקה לא מציל. הסיפור - כן.',
        ],
      },
    ],
    characters: [
      { name: 'משה (המספר)', age: 95, description: 'ניצול שואה שלא דיבר 70 שנה', traits: ['שותק עד עכשיו', 'מאמין', 'נושא משא'] },
      { name: 'אהרון', age: 15, description: 'אחיו הבכור, נספה', traits: ['חולם', 'אדריכל', 'נעדר'] },
      { name: 'אריאל', age: 16, description: 'הנכד שפתח את הספר', traits: ['סקרן', 'רגיש', 'רצינו'] },
    ],
    reviews: [
      { name: 'נכדה של ניצול', rating: 5, comment: 'סבא שלי גם שתק. הספר הזה עזר לי להבין.' },
      { name: 'מורה', rating: 5, comment: 'דרך חזקה לדבר על שואה - דרך הדורות.' },
      { name: 'קוראת', rating: 5, comment: 'בכיתי. אבל גם הרגשתי שזה הכרחי.' },
    ],
    qualityScore: 93,
  },

  // ---------- BOOK 24: Attrition War Widow ----------
  {
    authorKey: 'hanna_attrition',
    title: 'המכתבים שלא הגיעו',
    subtitle: 'אלמנת מלחמת ההתשה',
    genre: 'Memoir',
    description: 'אלמנה ממלחמת ההתשה כותבת מכתבים לבעלה 55 שנה אחרי.',
    synopsis: 'התחתנתי עם אבי בגיל 19. נפלנו לאהבה במחנה גדנ"ע. שנה אחרי החתונה הוא נפל במוצב על תעלת סואץ. אני בת 24. אני כותבת לו מכתבים מאז. הספר הזה הוא חמישה מכתבים מתוכם.',
    tags: ['התשה', 'אלמנה', 'תעלת סואץ', 'אהבה', 'זיכרון'],
    ageRating: 'PG',
    coverSeed: 'old-letters',
    coverColors: ['#5a3a4a', '#8b6585', '#d5b8c8'],
    design: {
      titleFont: 'Frank Ruhl Libre',
      accentColor: '#d5b8c8',
      divider: 'flourish',
      titleSize: 38,
      titlePosition: { x: 50, y: 32 },
      pullQuoteIndex: 1,
    },
    chapters: [
      {
        title: 'פרק א׳ - מכתב 1: ספטמבר 1969',
        imageSeeds: ['army-letter', 'young-couple'],
        paragraphs: [
          'אבי יקר, היום בא הצבא לדלת. שלושה בחורים במדים. אחד מהם בן הגיל שלך. הוא לא יכול היה להסתכל בעיניים שלי. ידעתי לפני שדיבר.',
          'אהרון נפל ב-3 בספטמבר 1969 במוצב טליה על התעלה. פגז של תותח רב-קני סורי. הוא היה בן 24. נשואים שמונה חודשים ושלושה ימים. לא ראיתי את הגוף שלו - אמרו "טוב יותר שלא". הסכמתי. עד היום אני לא יודעת מה הם עשו עם זה.',
          'אני יושבת על המיטה שלנו וכותבת לך. כי אני לא יכולה לדבר. אמא שלי בחדר השני, מבכה. אבא שלי לא מצליח להגיע - הוא נסע לעבודה במחצבה הבוקר, לא יכלו ליצור איתו קשר. אני 24, אבי. אני אלמנה. ואני לא מבינה את המילה הזאת עדיין.',
        ],
      },
      {
        title: 'פרק ב׳ - מכתב 7: דצמבר 1973',
        imageSeeds: ['kibbutz-children', 'memorial-day'],
        paragraphs: [
          'אבי, היום היום הזיכרון. עברו ארבע שנים. כולם נחים מהמלחמה החדשה - יום כיפור. נפלו עוד 2,656 חיילים. עוד 2,656 משפחות כמו שלי. אני יושבת בבית הקברות בקיבוץ, ליד הקבר שלך, ואני לא בודדה. סביבי עוד 30 אלמנות.',
          'התחלתי ללמוד. אוניברסיטה. בייעוץ. רוצה לעזור לאלמנות אחרות. אמא שלך באה לבקר אותי השבוע. היא אמרה "חנה, אתה צריכה להמשיך הלאה. תתחתני". אמרתי "מה זה הלאה?". היא לא ידעה לענות.',
          'אני מבטיחה לך משהו, אבי. לא אשכח. אבל אני אחיה. כי זה מה שעשית בשבילי - נתת לי שמונה חודשים של אהבה ענקית, ואני אבזבז אותה אם לא אחיה אחר כך. אני נושאת אותך בכיס שלי, כל יום, אבל אני הולכת. גם אם זה לאט.',
        ],
      },
      {
        title: 'פרק ג׳ - מכתב 47: אוקטובר 2024',
        imageSeeds: ['old-woman-writing', 'sunset-window'],
        paragraphs: [
          'אבי יקר, אני בת 79 עכשיו. אתה - תמיד 24. זה דבר מוזר עם אהבה צעירה - היא לא מזדקנת. בעיניי, אתה עוד בחור עם שיער מתולתל ועיניים שצוחקות. אני - יש לי קמטים, רגליים שכואבות, לב שעייף.',
          'התחתנתי שוב, אם אתה זוכר - מנשה, אישה טובה, לא נשארנו ילדים יחד. הוא נפטר לפני 12 שנה. אני שוב לבד. אבל לא לבד עם זיכרון - אני לבד עם שני זיכרונות. שני אנשים שאהבתי. שתי אהבות מאוד שונות. שתיהן אמיתיות.',
          'יש לי חלום, אבי. שכשאני אסתלק - בקרוב, אני מרגישה - אתה תהיה הראשון שאני אראה. אתה תחבק אותי. אני אהיה צעירה שוב. ונדבר על כל מה שלא הספקנו. כל המכתבים האלה שכתבתי - יש להם תשובה אחת. ואת אגלה אותה ביום ההוא. עד אז, אני כותבת. אני זוכרת. אני אוהבת אותך. שלך, חנה.',
        ],
      },
    ],
    characters: [
      { name: 'חנה (המספרת)', age: 79, description: 'אלמנה ממלחמת ההתשה', traits: ['חזקה', 'נושאת זיכרון', 'אוהבת'] },
      { name: 'אבי', age: 24, description: 'בעלה הראשון, נפל ב-1969', traits: ['צעיר לעד', 'אוהב', 'נעדר'] },
      { name: 'מנשה', description: 'בעלה השני, נפטר לפני 12 שנה', traits: ['טוב', 'נאמן', 'נעדר'] },
    ],
    reviews: [
      { name: 'אלמנת חייל', rating: 5, comment: 'חנה - הסיפור שלי. תודה שכתבת.' },
      { name: 'בן של חייל שנפל', rating: 5, comment: 'אמא שלי קוראת ובוכה. ואז מחייכת. זה הכל.' },
      { name: 'קוראת צעירה', rating: 5, comment: 'אהבה אמיתית, גם אחרי 55 שנה. מרגש מעבר למילים.' },
    ],
    qualityScore: 94,
  },
];

// ================ DB OPERATIONS ================
async function getOrCreateAuthor(def: AuthorDef): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', def.email)
    .maybeSingle();

  if (existing?.id) {
    console.log(`  ✓ Using existing author ${def.name} (${existing.id})`);
    return existing.id;
  }

  const userId = uuidv4();
  const { error } = await supabaseAdmin.from('users').insert({
    id: userId,
    name: def.name,
    email: def.email,
    password: '$2a$10$dummyhashnotusedforlogin',
    role: 'FREE',
    credits: 100,
    profile: {
      bio: def.bio,
      avatar: avatarImg(def.avatarSeed),
      language: 'he',
      authorProfile: {
        publishedBooks: 1,
        totalSales: 0,
        rating: 4.8,
        followers: [],
      },
    },
    subscription: {
      tier: 'free',
      price: 0,
      credits: 100,
      startDate: null,
      endDate: null,
      isActive: true,
    },
    email_verification: { isVerified: true, verifiedAt: now() },
  });

  if (error) {
    console.error(`  ✗ Failed to create author ${def.name}:`, error.message);
    throw error;
  }
  console.log(`  ✓ Created author ${def.name} (${userId})`);
  return userId;
}

async function createBook(
  book: BookDef,
  authorId: string,
  authorName: string,
  authorBio: string,
  authorAvatarSeed: string
): Promise<string> {
  const design: DesignStyle = { ...DEFAULT_DESIGN, ...(book.design || {}) };
  const chapters = book.chapters.map((c, i) => buildChapter(c, i + 1, design));
  const stats = buildStats(chapters, book.characters.length);
  const quality = buildQuality(book.qualityScore || 87);
  const cover = buildCover(
    book.title,
    authorName,
    authorBio,
    authorAvatarSeed,
    book.coverColors,
    book.coverSeed,
    design,
    book.subtitle
  );
  cover.back.synopsis = book.synopsis.slice(0, 400);

  const bookId = uuidv4();
  const ts = now();

  // Delete existing book with same title + author (re-run safety)
  await supabaseAdmin
    .from('books')
    .delete()
    .eq('title', book.title)
    .eq('author_id', authorId);

  const { error } = await supabaseAdmin.from('books').insert({
    id: bookId,
    title: book.title,
    author_id: authorId,
    genre: book.genre,
    writing_goal: 'novella',
    target_audience: 'adult',
    description: book.description,
    synopsis: book.synopsis,
    chapters,
    characters: book.characters.map((c) => ({ _id: uuidv4(), ...c })),
    cover_design: cover,
    publishing_status: {
      status: 'published',
      publishedAt: ts,
      price: 0,
      priceILS: 0,
      isFree: true,
      isPublic: true,
    },
    statistics: stats,
    quality_score: quality,
    reviews: buildReviews(book.reviews),
    tags: book.tags,
    language: 'he',
    age_rating: book.ageRating,
    likes: Math.floor(Math.random() * 80) + 10,
    liked_by: [],
    created_at: ts,
    updated_at: ts,
  });

  if (error) {
    console.error(`  ✗ Failed to create book "${book.title}":`, error.message);
    throw error;
  }
  console.log(`  ✓ Created book "${book.title}" (${bookId})`);
  return bookId;
}

async function seed() {
  console.log('═══════════════════════════════════════════════');
  console.log(`🌱 Seeding ${BOOKS.length} books by ${AUTHORS.length} authors`);
  console.log('═══════════════════════════════════════════════\n');

  // Step 1: create all authors, map authorKey -> {id, name, bio, avatarSeed}
  console.log('📚 Step 1: Creating authors...');
  const authorMap = new Map<string, { id: string; name: string; bio: string; avatarSeed: string }>();
  for (const author of AUTHORS) {
    const id = await getOrCreateAuthor(author);
    authorMap.set(author.key, { id, name: author.name, bio: author.bio, avatarSeed: author.avatarSeed });
  }

  // Step 2: create books
  console.log('\n📖 Step 2: Creating books...');
  let created = 0;
  let failed = 0;
  for (const book of BOOKS) {
    const author = authorMap.get(book.authorKey);
    if (!author) {
      console.error(`  ✗ No author found for key ${book.authorKey}`);
      failed++;
      continue;
    }
    try {
      await createBook(book, author.id, author.name, author.bio, author.avatarSeed);
      created++;
    } catch (err) {
      failed++;
    }
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log(`✅ Done: ${created} books created, ${failed} failed`);
  console.log('═══════════════════════════════════════════════');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('FATAL:', err);
    process.exit(1);
  });
