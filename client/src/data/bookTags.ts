/**
 * Comprehensive Book Tags System
 * Used for flexible book tagging, discovery, and recommendations
 */

export interface BookTag {
  id: string;
  name: {
    en: string;
    he: string;
  };
  category: TagCategory;
  icon?: string;
}

export type TagCategory =
  | 'life_events'      // אירועי חיים
  | 'emotions'         // רגשות
  | 'relationships'    // יחסים
  | 'places'           // מקומות
  | 'time_periods'     // תקופות
  | 'themes'           // נושאים
  | 'challenges'       // אתגרים
  | 'achievements'     // הישגים
  | 'identity'         // זהות
  | 'israeli'          // ישראלי
  | 'genre'            // ז'אנר
  | 'audience'         // קהל יעד
  | 'mood'             // אווירה
  | 'writing_style';   // סגנון כתיבה

export const TAG_CATEGORIES: Record<TagCategory, { en: string; he: string; icon: string }> = {
  life_events: { en: 'Life Events', he: 'אירועי חיים', icon: '📅' },
  emotions: { en: 'Emotions', he: 'רגשות', icon: '💭' },
  relationships: { en: 'Relationships', he: 'יחסים', icon: '💕' },
  places: { en: 'Places', he: 'מקומות', icon: '🌍' },
  time_periods: { en: 'Time Periods', he: 'תקופות', icon: '⏳' },
  themes: { en: 'Themes', he: 'נושאים', icon: '📚' },
  challenges: { en: 'Challenges', he: 'אתגרים', icon: '💪' },
  achievements: { en: 'Achievements', he: 'הישגים', icon: '🏆' },
  identity: { en: 'Identity', he: 'זהות', icon: '🪞' },
  israeli: { en: 'Israeli', he: 'ישראלי', icon: '🇮🇱' },
  genre: { en: 'Genre', he: "ז'אנר", icon: '📖' },
  audience: { en: 'Audience', he: 'קהל יעד', icon: '👥' },
  mood: { en: 'Mood', he: 'אווירה', icon: '🎭' },
  writing_style: { en: 'Writing Style', he: 'סגנון כתיבה', icon: '✍️' },
};

export const BOOK_TAGS: BookTag[] = [
  // ===== LIFE EVENTS - אירועי חיים =====
  { id: 'birth', name: { en: 'Birth', he: 'לידה' }, category: 'life_events', icon: '👶' },
  { id: 'childhood', name: { en: 'Childhood', he: 'ילדות' }, category: 'life_events', icon: '🧒' },
  { id: 'coming_of_age', name: { en: 'Coming of Age', he: 'בגרות' }, category: 'life_events', icon: '🎓' },
  { id: 'first_love', name: { en: 'First Love', he: 'אהבה ראשונה' }, category: 'life_events', icon: '💘' },
  { id: 'wedding', name: { en: 'Wedding', he: 'חתונה' }, category: 'life_events', icon: '💒' },
  { id: 'parenthood', name: { en: 'Parenthood', he: 'הורות' }, category: 'life_events', icon: '👨‍👩‍👧' },
  { id: 'divorce', name: { en: 'Divorce', he: 'גירושין' }, category: 'life_events', icon: '💔' },
  { id: 'retirement', name: { en: 'Retirement', he: 'פרישה' }, category: 'life_events', icon: '🏖️' },
  { id: 'death', name: { en: 'Death & Loss', he: 'מוות ואובדן' }, category: 'life_events', icon: '🕯️' },
  { id: 'rebirth', name: { en: 'New Beginning', he: 'התחלה חדשה' }, category: 'life_events', icon: '🌅' },
  { id: 'graduation', name: { en: 'Graduation', he: 'סיום לימודים' }, category: 'life_events', icon: '🎓' },
  { id: 'career_change', name: { en: 'Career Change', he: 'שינוי קריירה' }, category: 'life_events', icon: '🔄' },
  { id: 'moving', name: { en: 'Moving/Relocation', he: 'מעבר דירה' }, category: 'life_events', icon: '🏠' },
  { id: 'travel', name: { en: 'Travel', he: 'טיול' }, category: 'life_events', icon: '✈️' },
  { id: 'accident', name: { en: 'Accident', he: 'תאונה' }, category: 'life_events', icon: '🚑' },
  { id: 'diagnosis', name: { en: 'Diagnosis', he: 'אבחנה רפואית' }, category: 'life_events', icon: '🏥' },
  { id: 'recovery', name: { en: 'Recovery', he: 'החלמה' }, category: 'life_events', icon: '💚' },
  { id: 'bar_mitzvah', name: { en: 'Bar/Bat Mitzvah', he: 'בר/בת מצווה' }, category: 'life_events', icon: '✡️' },
  { id: 'military_service', name: { en: 'Military Service', he: 'שירות צבאי' }, category: 'life_events', icon: '🎖️' },
  { id: 'immigration', name: { en: 'Immigration', he: 'עלייה/היגרציה' }, category: 'life_events', icon: '🛫' },

  // ===== EMOTIONS - רגשות =====
  { id: 'love', name: { en: 'Love', he: 'אהבה' }, category: 'emotions', icon: '❤️' },
  { id: 'grief', name: { en: 'Grief', he: 'אבל' }, category: 'emotions', icon: '😢' },
  { id: 'joy', name: { en: 'Joy', he: 'שמחה' }, category: 'emotions', icon: '😊' },
  { id: 'fear', name: { en: 'Fear', he: 'פחד' }, category: 'emotions', icon: '😨' },
  { id: 'anger', name: { en: 'Anger', he: 'כעס' }, category: 'emotions', icon: '😠' },
  { id: 'hope', name: { en: 'Hope', he: 'תקווה' }, category: 'emotions', icon: '🌈' },
  { id: 'loneliness', name: { en: 'Loneliness', he: 'בדידות' }, category: 'emotions', icon: '🌙' },
  { id: 'nostalgia', name: { en: 'Nostalgia', he: 'נוסטלגיה' }, category: 'emotions', icon: '📷' },
  { id: 'gratitude', name: { en: 'Gratitude', he: 'הכרת תודה' }, category: 'emotions', icon: '🙏' },
  { id: 'pride', name: { en: 'Pride', he: 'גאווה' }, category: 'emotions', icon: '🦁' },
  { id: 'shame', name: { en: 'Shame', he: 'בושה' }, category: 'emotions', icon: '😔' },
  { id: 'guilt', name: { en: 'Guilt', he: 'אשמה' }, category: 'emotions', icon: '💭' },
  { id: 'anxiety', name: { en: 'Anxiety', he: 'חרדה' }, category: 'emotions', icon: '😰' },
  { id: 'peace', name: { en: 'Peace', he: 'שלווה' }, category: 'emotions', icon: '☮️' },
  { id: 'passion', name: { en: 'Passion', he: 'תשוקה' }, category: 'emotions', icon: '🔥' },
  { id: 'confusion', name: { en: 'Confusion', he: 'בלבול' }, category: 'emotions', icon: '😵' },
  { id: 'determination', name: { en: 'Determination', he: 'נחישות' }, category: 'emotions', icon: '💪' },
  { id: 'empathy', name: { en: 'Empathy', he: 'אמפתיה' }, category: 'emotions', icon: '🤝' },

  // ===== RELATIONSHIPS - יחסים =====
  { id: 'family', name: { en: 'Family', he: 'משפחה' }, category: 'relationships', icon: '👨‍👩‍👧‍👦' },
  { id: 'parents', name: { en: 'Parents', he: 'הורים' }, category: 'relationships', icon: '👫' },
  { id: 'siblings', name: { en: 'Siblings', he: 'אחים' }, category: 'relationships', icon: '👧👦' },
  { id: 'grandparents', name: { en: 'Grandparents', he: 'סבים וסבתות' }, category: 'relationships', icon: '👴👵' },
  { id: 'children', name: { en: 'Children', he: 'ילדים' }, category: 'relationships', icon: '👶' },
  { id: 'spouse', name: { en: 'Spouse/Partner', he: 'בן/בת זוג' }, category: 'relationships', icon: '💑' },
  { id: 'friends', name: { en: 'Friends', he: 'חברים' }, category: 'relationships', icon: '👯' },
  { id: 'mentor', name: { en: 'Mentor', he: 'מנטור' }, category: 'relationships', icon: '🧙' },
  { id: 'colleagues', name: { en: 'Colleagues', he: 'עמיתים' }, category: 'relationships', icon: '👔' },
  { id: 'community', name: { en: 'Community', he: 'קהילה' }, category: 'relationships', icon: '🏘️' },
  { id: 'enemies', name: { en: 'Enemies/Rivals', he: 'יריבים' }, category: 'relationships', icon: '⚔️' },
  { id: 'strangers', name: { en: 'Strangers', he: 'זרים' }, category: 'relationships', icon: '👤' },
  { id: 'pets', name: { en: 'Pets', he: 'חיות מחמד' }, category: 'relationships', icon: '🐕' },
  { id: 'teachers', name: { en: 'Teachers', he: 'מורים' }, category: 'relationships', icon: '👨‍🏫' },
  { id: 'ancestors', name: { en: 'Ancestors', he: 'אבות' }, category: 'relationships', icon: '🌳' },

  // ===== PLACES - מקומות =====
  { id: 'israel', name: { en: 'Israel', he: 'ישראל' }, category: 'places', icon: '🇮🇱' },
  { id: 'jerusalem', name: { en: 'Jerusalem', he: 'ירושלים' }, category: 'places', icon: '🕌' },
  { id: 'tel_aviv', name: { en: 'Tel Aviv', he: 'תל אביב' }, category: 'places', icon: '🏙️' },
  { id: 'kibbutz', name: { en: 'Kibbutz', he: 'קיבוץ' }, category: 'places', icon: '🌾' },
  { id: 'moshav', name: { en: 'Moshav', he: 'מושב' }, category: 'places', icon: '🏡' },
  { id: 'city', name: { en: 'City', he: 'עיר' }, category: 'places', icon: '🌆' },
  { id: 'village', name: { en: 'Village', he: 'כפר' }, category: 'places', icon: '🏘️' },
  { id: 'abroad', name: { en: 'Abroad', he: 'חו"ל' }, category: 'places', icon: '🌍' },
  { id: 'europe', name: { en: 'Europe', he: 'אירופה' }, category: 'places', icon: '🇪🇺' },
  { id: 'usa', name: { en: 'USA', he: 'ארה"ב' }, category: 'places', icon: '🇺🇸' },
  { id: 'middle_east', name: { en: 'Middle East', he: 'המזרח התיכון' }, category: 'places', icon: '🏜️' },
  { id: 'poland', name: { en: 'Poland', he: 'פולין' }, category: 'places', icon: '🇵🇱' },
  { id: 'morocco', name: { en: 'Morocco', he: 'מרוקו' }, category: 'places', icon: '🇲🇦' },
  { id: 'iraq', name: { en: 'Iraq', he: 'עיראק' }, category: 'places', icon: '🇮🇶' },
  { id: 'russia', name: { en: 'Russia', he: 'רוסיה' }, category: 'places', icon: '🇷🇺' },
  { id: 'ethiopia', name: { en: 'Ethiopia', he: 'אתיופיה' }, category: 'places', icon: '🇪🇹' },
  { id: 'argentina', name: { en: 'Argentina', he: 'ארגנטינה' }, category: 'places', icon: '🇦🇷' },
  { id: 'home', name: { en: 'Home', he: 'בית' }, category: 'places', icon: '🏠' },
  { id: 'hospital', name: { en: 'Hospital', he: 'בית חולים' }, category: 'places', icon: '🏥' },
  { id: 'school', name: { en: 'School', he: 'בית ספר' }, category: 'places', icon: '🏫' },
  { id: 'army_base', name: { en: 'Army Base', he: 'בסיס צבאי' }, category: 'places', icon: '🎖️' },
  { id: 'nature', name: { en: 'Nature', he: 'טבע' }, category: 'places', icon: '🌲' },
  { id: 'desert', name: { en: 'Desert', he: 'מדבר' }, category: 'places', icon: '🏜️' },
  { id: 'sea', name: { en: 'Sea', he: 'ים' }, category: 'places', icon: '🌊' },

  // ===== TIME PERIODS - תקופות =====
  { id: 'holocaust', name: { en: 'Holocaust', he: 'שואה' }, category: 'time_periods', icon: '🕯️' },
  { id: 'pre_state', name: { en: 'Pre-State Israel', he: 'טרום מדינה' }, category: 'time_periods', icon: '📜' },
  { id: 'independence', name: { en: 'Independence Era', he: 'תקופת העצמאות' }, category: 'time_periods', icon: '🇮🇱' },
  { id: 'fifties', name: { en: '1950s', he: 'שנות ה-50' }, category: 'time_periods', icon: '📻' },
  { id: 'sixties', name: { en: '1960s', he: 'שנות ה-60' }, category: 'time_periods', icon: '🎸' },
  { id: 'seventies', name: { en: '1970s', he: 'שנות ה-70' }, category: 'time_periods', icon: '🕺' },
  { id: 'eighties', name: { en: '1980s', he: 'שנות ה-80' }, category: 'time_periods', icon: '📼' },
  { id: 'nineties', name: { en: '1990s', he: 'שנות ה-90' }, category: 'time_periods', icon: '💿' },
  { id: 'y2k', name: { en: '2000s', he: 'שנות ה-2000' }, category: 'time_periods', icon: '💻' },
  { id: 'modern', name: { en: 'Modern Era', he: 'העידן המודרני' }, category: 'time_periods', icon: '📱' },
  { id: 'covid', name: { en: 'COVID Era', he: 'תקופת הקורונה' }, category: 'time_periods', icon: '😷' },
  { id: 'october_7', name: { en: 'October 7th', he: '7 באוקטובר' }, category: 'time_periods', icon: '🕯️' },

  // ===== THEMES - נושאים =====
  { id: 'heritage', name: { en: 'Heritage', he: 'מורשת' }, category: 'themes', icon: '📜' },
  { id: 'tradition', name: { en: 'Tradition', he: 'מסורת' }, category: 'themes', icon: '🕎' },
  { id: 'faith', name: { en: 'Faith', he: 'אמונה' }, category: 'themes', icon: '✡️' },
  { id: 'spirituality', name: { en: 'Spirituality', he: 'רוחניות' }, category: 'themes', icon: '🧘' },
  { id: 'identity', name: { en: 'Identity', he: 'זהות' }, category: 'themes', icon: '🪞' },
  { id: 'belonging', name: { en: 'Belonging', he: 'שייכות' }, category: 'themes', icon: '🏡' },
  { id: 'freedom', name: { en: 'Freedom', he: 'חופש' }, category: 'themes', icon: '🕊️' },
  { id: 'justice', name: { en: 'Justice', he: 'צדק' }, category: 'themes', icon: '⚖️' },
  { id: 'survival', name: { en: 'Survival', he: 'הישרדות' }, category: 'themes', icon: '🔥' },
  { id: 'resilience', name: { en: 'Resilience', he: 'חוסן' }, category: 'themes', icon: '💎' },
  { id: 'transformation', name: { en: 'Transformation', he: 'טרנספורמציה' }, category: 'themes', icon: '🦋' },
  { id: 'redemption', name: { en: 'Redemption', he: 'גאולה' }, category: 'themes', icon: '✨' },
  { id: 'forgiveness', name: { en: 'Forgiveness', he: 'סליחה' }, category: 'themes', icon: '🤝' },
  { id: 'sacrifice', name: { en: 'Sacrifice', he: 'הקרבה' }, category: 'themes', icon: '💔' },
  { id: 'heroism', name: { en: 'Heroism', he: 'גבורה' }, category: 'themes', icon: '🦸' },
  { id: 'memory', name: { en: 'Memory', he: 'זיכרון' }, category: 'themes', icon: '🧠' },
  { id: 'legacy', name: { en: 'Legacy', he: 'מורשת' }, category: 'themes', icon: '📖' },
  { id: 'dreams', name: { en: 'Dreams', he: 'חלומות' }, category: 'themes', icon: '💭' },
  { id: 'success', name: { en: 'Success', he: 'הצלחה' }, category: 'themes', icon: '🏆' },
  { id: 'failure', name: { en: 'Failure', he: 'כישלון' }, category: 'themes', icon: '📉' },
  { id: 'money', name: { en: 'Money', he: 'כסף' }, category: 'themes', icon: '💰' },
  { id: 'art', name: { en: 'Art', he: 'אמנות' }, category: 'themes', icon: '🎨' },
  { id: 'music', name: { en: 'Music', he: 'מוזיקה' }, category: 'themes', icon: '🎵' },
  { id: 'food', name: { en: 'Food', he: 'אוכל' }, category: 'themes', icon: '🍽️' },
  { id: 'sports', name: { en: 'Sports', he: 'ספורט' }, category: 'themes', icon: '⚽' },
  { id: 'technology', name: { en: 'Technology', he: 'טכנולוגיה' }, category: 'themes', icon: '💻' },
  { id: 'education', name: { en: 'Education', he: 'חינוך' }, category: 'themes', icon: '📚' },
  { id: 'politics', name: { en: 'Politics', he: 'פוליטיקה' }, category: 'themes', icon: '🏛️' },
  { id: 'environment', name: { en: 'Environment', he: 'סביבה' }, category: 'themes', icon: '🌍' },

  // ===== CHALLENGES - אתגרים =====
  { id: 'illness', name: { en: 'Illness', he: 'מחלה' }, category: 'challenges', icon: '🏥' },
  { id: 'cancer', name: { en: 'Cancer', he: 'סרטן' }, category: 'challenges', icon: '🎗️' },
  { id: 'mental_health', name: { en: 'Mental Health', he: 'בריאות הנפש' }, category: 'challenges', icon: '🧠' },
  { id: 'depression', name: { en: 'Depression', he: 'דיכאון' }, category: 'challenges', icon: '🌧️' },
  { id: 'addiction', name: { en: 'Addiction', he: 'התמכרות' }, category: 'challenges', icon: '⛓️' },
  { id: 'trauma', name: { en: 'Trauma', he: 'טראומה' }, category: 'challenges', icon: '💔' },
  { id: 'ptsd', name: { en: 'PTSD', he: 'פוסט טראומה' }, category: 'challenges', icon: '🌪️' },
  { id: 'disability', name: { en: 'Disability', he: 'מוגבלות' }, category: 'challenges', icon: '♿' },
  { id: 'poverty', name: { en: 'Poverty', he: 'עוני' }, category: 'challenges', icon: '💸' },
  { id: 'discrimination', name: { en: 'Discrimination', he: 'אפליה' }, category: 'challenges', icon: '🚫' },
  { id: 'abuse', name: { en: 'Abuse', he: 'התעללות' }, category: 'challenges', icon: '⚠️' },
  { id: 'bullying', name: { en: 'Bullying', he: 'בריונות' }, category: 'challenges', icon: '😔' },
  { id: 'war', name: { en: 'War', he: 'מלחמה' }, category: 'challenges', icon: '⚔️' },
  { id: 'terror', name: { en: 'Terror', he: 'טרור' }, category: 'challenges', icon: '💥' },
  { id: 'captivity', name: { en: 'Captivity', he: 'שבי' }, category: 'challenges', icon: '⛓️' },
  { id: 'loss', name: { en: 'Loss', he: 'אובדן' }, category: 'challenges', icon: '🥀' },
  { id: 'infertility', name: { en: 'Infertility', he: 'עקרות' }, category: 'challenges', icon: '🍼' },
  { id: 'eating_disorder', name: { en: 'Eating Disorder', he: 'הפרעת אכילה' }, category: 'challenges', icon: '🍽️' },
  { id: 'learning_disability', name: { en: 'Learning Disability', he: 'לקות למידה' }, category: 'challenges', icon: '📖' },
  { id: 'unemployment', name: { en: 'Unemployment', he: 'אבטלה' }, category: 'challenges', icon: '💼' },
  { id: 'homelessness', name: { en: 'Homelessness', he: 'חוסר בית' }, category: 'challenges', icon: '🏚️' },
  { id: 'refugee', name: { en: 'Refugee', he: 'פליט' }, category: 'challenges', icon: '🧳' },

  // ===== ACHIEVEMENTS - הישגים =====
  { id: 'entrepreneurship', name: { en: 'Entrepreneurship', he: 'יזמות' }, category: 'achievements', icon: '🚀' },
  { id: 'invention', name: { en: 'Invention', he: 'המצאה' }, category: 'achievements', icon: '💡' },
  { id: 'sports_achievement', name: { en: 'Sports Achievement', he: 'הישג ספורטיבי' }, category: 'achievements', icon: '🥇' },
  { id: 'academic', name: { en: 'Academic', he: 'הישג אקדמי' }, category: 'achievements', icon: '🎓' },
  { id: 'artistic', name: { en: 'Artistic', he: 'הישג אמנותי' }, category: 'achievements', icon: '🎨' },
  { id: 'leadership', name: { en: 'Leadership', he: 'מנהיגות' }, category: 'achievements', icon: '👑' },
  { id: 'volunteering', name: { en: 'Volunteering', he: 'התנדבות' }, category: 'achievements', icon: '🤲' },
  { id: 'building_family', name: { en: 'Building Family', he: 'הקמת משפחה' }, category: 'achievements', icon: '👨‍👩‍👧‍👦' },
  { id: 'aliyah', name: { en: 'Aliyah', he: 'עלייה לארץ' }, category: 'achievements', icon: '🇮🇱' },
  { id: 'career_success', name: { en: 'Career Success', he: 'הצלחה מקצועית' }, category: 'achievements', icon: '📈' },
  { id: 'overcoming', name: { en: 'Overcoming', he: 'התגברות' }, category: 'achievements', icon: '🏔️' },
  { id: 'healing', name: { en: 'Healing', he: 'ריפוי' }, category: 'achievements', icon: '💚' },

  // ===== IDENTITY - זהות =====
  { id: 'jewish', name: { en: 'Jewish', he: 'יהודי' }, category: 'identity', icon: '✡️' },
  { id: 'israeli', name: { en: 'Israeli', he: 'ישראלי' }, category: 'identity', icon: '🇮🇱' },
  { id: 'religious', name: { en: 'Religious', he: 'דתי' }, category: 'identity', icon: '🕍' },
  { id: 'secular', name: { en: 'Secular', he: 'חילוני' }, category: 'identity', icon: '🌐' },
  { id: 'traditional', name: { en: 'Traditional', he: 'מסורתי' }, category: 'identity', icon: '🕯️' },
  { id: 'orthodox', name: { en: 'Orthodox', he: 'חרדי' }, category: 'identity', icon: '🎩' },
  { id: 'ashkenazi', name: { en: 'Ashkenazi', he: 'אשכנזי' }, category: 'identity', icon: '🌍' },
  { id: 'sephardi', name: { en: 'Sephardi', he: 'ספרדי' }, category: 'identity', icon: '🌍' },
  { id: 'mizrahi', name: { en: 'Mizrahi', he: 'מזרחי' }, category: 'identity', icon: '🌍' },
  { id: 'ethiopian', name: { en: 'Ethiopian', he: 'אתיופי' }, category: 'identity', icon: '🇪🇹' },
  { id: 'russian', name: { en: 'Russian', he: 'רוסי' }, category: 'identity', icon: '🇷🇺' },
  { id: 'arab', name: { en: 'Arab', he: 'ערבי' }, category: 'identity', icon: '🌙' },
  { id: 'druze', name: { en: 'Druze', he: 'דרוזי' }, category: 'identity', icon: '⭐' },
  { id: 'lgbtq', name: { en: 'LGBTQ+', he: 'להט"ב+' }, category: 'identity', icon: '🏳️‍🌈' },
  { id: 'woman', name: { en: 'Woman', he: 'אישה' }, category: 'identity', icon: '👩' },
  { id: 'man', name: { en: 'Man', he: 'גבר' }, category: 'identity', icon: '👨' },
  { id: 'immigrant', name: { en: 'Immigrant', he: 'עולה' }, category: 'identity', icon: '🛬' },
  { id: 'sabra', name: { en: 'Sabra', he: 'צבר' }, category: 'identity', icon: '🌵' },
  { id: 'holocaust_survivor', name: { en: 'Holocaust Survivor', he: 'ניצול שואה' }, category: 'identity', icon: '🕯️' },
  { id: 'second_generation', name: { en: 'Second Generation', he: 'דור שני' }, category: 'identity', icon: '👨‍👧' },
  { id: 'third_generation', name: { en: 'Third Generation', he: 'דור שלישי' }, category: 'identity', icon: '👶' },
  { id: 'veteran', name: { en: 'Veteran', he: 'ותיק' }, category: 'identity', icon: '🎖️' },
  { id: 'bereaved_family', name: { en: 'Bereaved Family', he: 'משפחה שכולה' }, category: 'identity', icon: '🖤' },
  { id: 'hostage_family', name: { en: 'Hostage Family', he: 'משפחת חטוף' }, category: 'identity', icon: '💛' },

  // ===== ISRAELI SPECIFIC - ישראלי ספציפי =====
  { id: 'idf', name: { en: 'IDF', he: 'צה"ל' }, category: 'israeli', icon: '🎖️' },
  { id: 'combat', name: { en: 'Combat', he: 'קרבי' }, category: 'israeli', icon: '⚔️' },
  { id: 'reserves', name: { en: 'Reserves', he: 'מילואים' }, category: 'israeli', icon: '🪖' },
  { id: 'settlement', name: { en: 'Settlement', he: 'התיישבות' }, category: 'israeli', icon: '🏘️' },
  { id: 'gaza_envelope', name: { en: 'Gaza Envelope', he: 'עוטף עזה' }, category: 'israeli', icon: '🏠' },
  { id: 'northern_border', name: { en: 'Northern Border', he: 'גבול הצפון' }, category: 'israeli', icon: '🏔️' },
  { id: 'evacuation', name: { en: 'Evacuation', he: 'פינוי' }, category: 'israeli', icon: '🚚' },
  { id: 'absorption', name: { en: 'Absorption', he: 'קליטה' }, category: 'israeli', icon: '🤝' },
  { id: 'pioneering', name: { en: 'Pioneering', he: 'חלוציות' }, category: 'israeli', icon: '🌱' },
  { id: 'zionism', name: { en: 'Zionism', he: 'ציונות' }, category: 'israeli', icon: '🇮🇱' },
  { id: 'independence_war', name: { en: 'Independence War', he: 'מלחמת העצמאות' }, category: 'israeli', icon: '🏛️' },
  { id: 'six_day_war', name: { en: 'Six Day War', he: 'מלחמת ששת הימים' }, category: 'israeli', icon: '⭐' },
  { id: 'yom_kippur_war', name: { en: 'Yom Kippur War', he: 'מלחמת יום כיפור' }, category: 'israeli', icon: '🕯️' },
  { id: 'lebanon_war', name: { en: 'Lebanon War', he: 'מלחמת לבנון' }, category: 'israeli', icon: '🏔️' },
  { id: 'intifada', name: { en: 'Intifada', he: 'אינתיפאדה' }, category: 'israeli', icon: '⚠️' },
  { id: 'iron_swords', name: { en: 'Iron Swords War', he: 'מלחמת חרבות ברזל' }, category: 'israeli', icon: '⚔️' },
  { id: 'nova', name: { en: 'Nova Festival', he: 'פסטיבל נובה' }, category: 'israeli', icon: '🎵' },
  { id: 'rescue', name: { en: 'Rescue', he: 'חילוץ' }, category: 'israeli', icon: '🚁' },
  { id: 'memorial', name: { en: 'Memorial', he: 'הנצחה' }, category: 'israeli', icon: '🕯️' },
  { id: 'solidarity', name: { en: 'Solidarity', he: 'סולידריות' }, category: 'israeli', icon: '🤝' },

  // ===== GENRE - ז'אנר =====
  { id: 'autobiography', name: { en: 'Autobiography', he: 'אוטוביוגרפיה' }, category: 'genre', icon: '📝' },
  { id: 'memoir', name: { en: 'Memoir', he: 'זיכרונות' }, category: 'genre', icon: '📖' },
  { id: 'biography', name: { en: 'Biography', he: 'ביוגרפיה' }, category: 'genre', icon: '👤' },
  { id: 'family_saga', name: { en: 'Family Saga', he: 'סאגה משפחתית' }, category: 'genre', icon: '👨‍👩‍👧‍👦' },
  { id: 'testimony', name: { en: 'Testimony', he: 'עדות' }, category: 'genre', icon: '🎤' },
  { id: 'documentary', name: { en: 'Documentary', he: 'תיעודי' }, category: 'genre', icon: '🎬' },
  { id: 'letters', name: { en: 'Letters', he: 'מכתבים' }, category: 'genre', icon: '✉️' },
  { id: 'diary', name: { en: 'Diary', he: 'יומן' }, category: 'genre', icon: '📓' },
  { id: 'poetry', name: { en: 'Poetry', he: 'שירה' }, category: 'genre', icon: '🎭' },
  { id: 'fiction_based', name: { en: 'Fiction Based on Reality', he: 'בדיון מבוסס מציאות' }, category: 'genre', icon: '📚' },

  // ===== AUDIENCE - קהל יעד =====
  { id: 'for_family', name: { en: 'For Family', he: 'למשפחה' }, category: 'audience', icon: '👨‍👩‍👧‍👦' },
  { id: 'for_children', name: { en: 'For Children', he: 'לילדים' }, category: 'audience', icon: '👶' },
  { id: 'for_teens', name: { en: 'For Teens', he: 'לנוער' }, category: 'audience', icon: '👦' },
  { id: 'for_adults', name: { en: 'For Adults', he: 'למבוגרים' }, category: 'audience', icon: '👨' },
  { id: 'for_seniors', name: { en: 'For Seniors', he: 'לגיל השלישי' }, category: 'audience', icon: '👴' },
  { id: 'for_educators', name: { en: 'For Educators', he: 'למחנכים' }, category: 'audience', icon: '👨‍🏫' },
  { id: 'for_researchers', name: { en: 'For Researchers', he: 'לחוקרים' }, category: 'audience', icon: '🔬' },

  // ===== MOOD - אווירה =====
  { id: 'inspiring', name: { en: 'Inspiring', he: 'מעורר השראה' }, category: 'mood', icon: '✨' },
  { id: 'emotional', name: { en: 'Emotional', he: 'מרגש' }, category: 'mood', icon: '😢' },
  { id: 'uplifting', name: { en: 'Uplifting', he: 'מרומם' }, category: 'mood', icon: '🌈' },
  { id: 'dark', name: { en: 'Dark', he: 'אפל' }, category: 'mood', icon: '🌑' },
  { id: 'humorous', name: { en: 'Humorous', he: 'הומוריסטי' }, category: 'mood', icon: '😄' },
  { id: 'thoughtful', name: { en: 'Thoughtful', he: 'מעמיק' }, category: 'mood', icon: '🤔' },
  { id: 'romantic', name: { en: 'Romantic', he: 'רומנטי' }, category: 'mood', icon: '💕' },
  { id: 'adventurous', name: { en: 'Adventurous', he: 'הרפתקני' }, category: 'mood', icon: '🗺️' },
  { id: 'suspenseful', name: { en: 'Suspenseful', he: 'מותח' }, category: 'mood', icon: '😱' },
  { id: 'heartwarming', name: { en: 'Heartwarming', he: 'מחמם לב' }, category: 'mood', icon: '💖' },
  { id: 'bittersweet', name: { en: 'Bittersweet', he: 'מתוק-מר' }, category: 'mood', icon: '🍫' },
  { id: 'nostalgic', name: { en: 'Nostalgic', he: 'נוסטלגי' }, category: 'mood', icon: '📷' },

  // ===== WRITING STYLE - סגנון כתיבה =====
  { id: 'first_person', name: { en: 'First Person', he: 'גוף ראשון' }, category: 'writing_style', icon: '👤' },
  { id: 'third_person', name: { en: 'Third Person', he: 'גוף שלישי' }, category: 'writing_style', icon: '👥' },
  { id: 'conversational', name: { en: 'Conversational', he: 'שיחתי' }, category: 'writing_style', icon: '💬' },
  { id: 'literary', name: { en: 'Literary', he: 'ספרותי' }, category: 'writing_style', icon: '📜' },
  { id: 'simple', name: { en: 'Simple', he: 'פשוט' }, category: 'writing_style', icon: '📄' },
  { id: 'detailed', name: { en: 'Detailed', he: 'מפורט' }, category: 'writing_style', icon: '🔍' },
  { id: 'short_form', name: { en: 'Short Form', he: 'קצר' }, category: 'writing_style', icon: '📝' },
  { id: 'long_form', name: { en: 'Long Form', he: 'ארוך' }, category: 'writing_style', icon: '📚' },
  { id: 'illustrated', name: { en: 'Illustrated', he: 'מאויר' }, category: 'writing_style', icon: '🖼️' },
  { id: 'photo_based', name: { en: 'Photo Based', he: 'מבוסס תמונות' }, category: 'writing_style', icon: '📸' },
];

// Helper functions
export const getTagById = (id: string): BookTag | undefined => {
  return BOOK_TAGS.find(tag => tag.id === id);
};

export const getTagsByCategory = (category: TagCategory): BookTag[] => {
  return BOOK_TAGS.filter(tag => tag.category === category);
};

export const searchTags = (query: string, language: 'en' | 'he' = 'he'): BookTag[] => {
  const lowerQuery = query.toLowerCase();
  return BOOK_TAGS.filter(tag =>
    tag.name[language].toLowerCase().includes(lowerQuery) ||
    tag.id.includes(lowerQuery)
  );
};

export const getPopularTags = (): BookTag[] => {
  // Return commonly used tags
  const popularIds = [
    'family', 'love', 'childhood', 'holocaust', 'military_service',
    'immigration', 'health', 'overcoming', 'faith', 'memory',
    'october_7', 'resilience', 'hope', 'grief', 'inspiring'
  ];
  return BOOK_TAGS.filter(tag => popularIds.includes(tag.id));
};

export const getIsraeliTags = (): BookTag[] => {
  return BOOK_TAGS.filter(tag => tag.category === 'israeli');
};

export default BOOK_TAGS;
