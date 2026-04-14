/**
 * Featured Snippets Components
 * Optimized for Google Featured Snippets & AI Search Engines
 * These components use semantic HTML structures that Google prefers for snippets
 */

import { useLanguage } from '../../contexts/LanguageContext';

// Definition List Component - Optimized for "What is X?" queries
interface Definition {
  term: string;
  definition: string;
}

interface DefinitionListProps {
  title?: string;
  definitions: Definition[];
  className?: string;
}

export function DefinitionList({ title, definitions, className = '' }: DefinitionListProps) {
  return (
    <div className={`featured-snippet-definitions ${className}`}>
      {title && <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>}
      <dl className="space-y-4">
        {definitions.map((item, index) => (
          <div key={index} className="border-b border-white/10 pb-3 last:border-0">
            <dt className="font-medium text-memorial-gold mb-1">{item.term}</dt>
            <dd className="text-gray-300 text-sm leading-relaxed">{item.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// Comparison Table Component - Optimized for "X vs Y" and pricing queries
interface ComparisonRow {
  feature: string;
  free: string | boolean;
  pro: string | boolean;
  premium: string | boolean;
}

interface PricingComparisonTableProps {
  className?: string;
}

export function PricingComparisonTable({ className = '' }: PricingComparisonTableProps) {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  const plans = isHebrew
    ? { free: 'חינמי', pro: 'מקצועי', premium: 'פרימיום' }
    : { free: 'Free', pro: 'Pro', premium: 'Premium' };

  const features: ComparisonRow[] = isHebrew
    ? [
        { feature: 'מספר ספרים', free: '1', pro: '10', premium: 'ללא הגבלה' },
        { feature: 'עזרת AI לכתיבה', free: 'בסיסי', pro: 'מתקדם', premium: 'מלא' },
        { feature: 'קרדיטים AI לחודש', free: '1,000', pro: '10,000', premium: '100,000' },
        { feature: 'עיצוב כריכות AI', free: false, pro: true, premium: true },
        { feature: 'ייצוא PDF', free: true, pro: true, premium: true },
        { feature: 'פרסום בשוק', free: true, pro: true, premium: true },
        { feature: 'אחוז מהמכירות', free: '50%', pro: '60%', premium: '70%' },
        { feature: 'תמיכה', free: 'קהילה', pro: 'אימייל', premium: 'עדיפות' },
      ]
    : [
        { feature: 'Number of Books', free: '1', pro: '10', premium: 'Unlimited' },
        { feature: 'AI Writing Assistance', free: 'Basic', pro: 'Advanced', premium: 'Full' },
        { feature: 'AI Credits / Month', free: '1,000', pro: '10,000', premium: '100,000' },
        { feature: 'AI Cover Design', free: false, pro: true, premium: true },
        { feature: 'PDF Export', free: true, pro: true, premium: true },
        { feature: 'Marketplace Publishing', free: true, pro: true, premium: true },
        { feature: 'Revenue Share', free: '50%', pro: '60%', premium: '70%' },
        { feature: 'Support', free: 'Community', pro: 'Email', premium: 'Priority' },
      ];

  const renderCell = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <span className="text-green-400">✓</span>
      ) : (
        <span className="text-gray-500">✗</span>
      );
    }
    return value;
  };

  return (
    <div className={`featured-snippet-table overflow-x-auto ${className}`}>
      <table className="w-full border-collapse" dir={isHebrew ? 'rtl' : 'ltr'}>
        <caption className="sr-only">
          {isHebrew ? 'השוואת מסלולים של MeStory' : 'MeStory Plans Comparison'}
        </caption>
        <thead>
          <tr className="border-b border-white/20">
            <th className="p-3 text-start text-gray-400 font-medium">
              {isHebrew ? 'תכונה' : 'Feature'}
            </th>
            <th className="p-3 text-center text-white font-semibold">{plans.free}</th>
            <th className="p-3 text-center text-memorial-gold font-semibold">{plans.pro}</th>
            <th className="p-3 text-center text-cosmic-purple font-semibold">{plans.premium}</th>
          </tr>
        </thead>
        <tbody>
          {features.map((row, index) => (
            <tr key={index} className="border-b border-white/10 hover:bg-white/5">
              <td className="p-3 text-gray-300">{row.feature}</td>
              <td className="p-3 text-center text-gray-400">{renderCell(row.free)}</td>
              <td className="p-3 text-center text-gray-300">{renderCell(row.pro)}</td>
              <td className="p-3 text-center text-gray-300">{renderCell(row.premium)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Numbered Steps List - Optimized for "How to" queries
interface Step {
  title: string;
  description: string;
}

interface StepsListProps {
  title?: string;
  steps: Step[];
  className?: string;
}

export function StepsList({ title, steps, className = '' }: StepsListProps) {
  return (
    <div className={`featured-snippet-steps ${className}`}>
      {title && <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>}
      <ol className="space-y-4 list-decimal list-inside">
        {steps.map((step, index) => (
          <li key={index} className="text-gray-300">
            <span className="font-medium text-white">{step.title}</span>
            <p className="text-sm text-gray-400 mt-1 ms-6">{step.description}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Key Facts Box - Optimized for quick answers
interface KeyFact {
  label: string;
  value: string;
}

interface KeyFactsBoxProps {
  title?: string;
  facts: KeyFact[];
  className?: string;
}

export function KeyFactsBox({ title, facts, className = '' }: KeyFactsBoxProps) {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  return (
    <div className={`featured-snippet-facts bg-white/5 rounded-xl p-4 ${className}`} dir={isHebrew ? 'rtl' : 'ltr'}>
      {title && <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>}
      <dl className="grid grid-cols-2 gap-3">
        {facts.map((fact, index) => (
          <div key={index} className="flex flex-col">
            <dt className="text-xs text-gray-500 uppercase">{fact.label}</dt>
            <dd className="text-lg font-semibold text-memorial-gold">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// Default MeStory definitions for reuse
export const MESTORY_DEFINITIONS = {
  he: [
    {
      term: 'מה זה MeStory?',
      definition: 'MeStory היא פלטפורמה ישראלית לכתיבת ספרים עם בינה מלאכותית. הפלטפורמה מאפשרת לכל אחד לכתוב, לעצב ולפרסם ספרים בקלות, עם עזרת AI מתקדמת.',
    },
    {
      term: 'כתיבה עם בינה מלאכותית',
      definition: 'טכנולוגיה המשתמשת ב-AI כדי לעזור בכתיבת טקסטים - מהצעת רעיונות, דרך כתיבת טיוטות ועד עריכה ושיפור התוכן.',
    },
    {
      term: 'פרסום עצמי (Self-Publishing)',
      definition: 'תהליך שבו הסופר מפרסם את הספר שלו ישירות לקוראים, ללא מוציא לאור מסורתי. בMeStory, תוכלו לפרסם ולמכור ישירות בשוק שלנו.',
    },
    {
      term: 'ספר דיגיטלי (eBook)',
      definition: 'ספר בפורמט אלקטרוני שניתן לקרוא במחשב, טאבלט או טלפון. MeStory מאפשרת ייצוא לפורמטים PDF ו-EPUB.',
    },
  ],
  en: [
    {
      term: 'What is MeStory?',
      definition: 'MeStory is an Israeli platform for writing books with artificial intelligence. The platform enables anyone to write, design, and publish books easily, with advanced AI assistance.',
    },
    {
      term: 'AI Writing',
      definition: 'Technology that uses AI to help with text writing - from suggesting ideas, through writing drafts, to editing and improving content.',
    },
    {
      term: 'Self-Publishing',
      definition: 'A process where the author publishes their book directly to readers, without a traditional publisher. On MeStory, you can publish and sell directly in our marketplace.',
    },
    {
      term: 'eBook',
      definition: 'A book in electronic format that can be read on a computer, tablet, or phone. MeStory allows export to PDF and EPUB formats.',
    },
  ],
};

// Default MeStory key facts
export const MESTORY_KEY_FACTS = {
  he: [
    { label: 'שנת הקמה', value: '2024' },
    { label: 'מיקום', value: 'ישראל' },
    { label: 'שפות', value: 'עברית, אנגלית' },
    { label: 'מחיר התחלתי', value: 'חינם' },
  ],
  en: [
    { label: 'Founded', value: '2024' },
    { label: 'Location', value: 'Israel' },
    { label: 'Languages', value: 'Hebrew, English' },
    { label: 'Starting Price', value: 'Free' },
  ],
};
