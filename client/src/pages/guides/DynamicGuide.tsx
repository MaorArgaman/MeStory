import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { useSEO } from '../../hooks/useSEO';
import { GlassCard } from '../../components/ui';
import { Breadcrumb, ArticleSchema, FAQSchema } from '../../components/seo';
import { useLanguage } from '../../contexts/LanguageContext';

interface ArticleBody {
  intro: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  faq: Array<{ q: string; a: string }>;
  conclusion: string;
}

interface Article {
  slug: string;
  lang: 'he' | 'en';
  title: string;
  description: string;
  keywords: string[];
  body: ArticleBody;
  published_at: string | null;
  updated_at: string;
}

/**
 * Renders a David-authored article stored in the DB, served at /guides/:slug.
 * Hardcoded guide slugs (write-book, etc.) have their own routes that match
 * first; this catches everything else and 404s gracefully if unknown.
 */
export default function DynamicGuide() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const [article, setArticle] = useState<Article | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api
      .get(`/articles/${slug}`, { suppressErrorToast: true } as any)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success && res.data.data) {
          setArticle(res.data.data);
          setStatus('ready');
        } else {
          setStatus('notfound');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('notfound');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const isHebrew = (article?.lang || language) === 'he';
  const ArrowIcon = isHebrew ? ArrowLeft : ArrowRight;
  const canonical = `https://mestory-ai.com/guides/${slug}`;

  useSEO({
    title: article?.title || (isHebrew ? 'מדריך' : 'Guide'),
    description: article?.description || '',
    canonicalUrl: canonical,
    keywords: article?.keywords || [],
    ogType: 'article',
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-memorial-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'notfound' || !article) {
    return (
      <div className="min-h-screen py-24 px-4 text-center" dir={isHebrew ? 'rtl' : 'ltr'}>
        <h1 className="text-3xl font-display font-bold text-white mb-4">
          {isHebrew ? 'המדריך לא נמצא' : 'Guide not found'}
        </h1>
        <Link to="/guides" className="text-memorial-gold hover:underline">
          {isHebrew ? 'חזרה לכל המדריכים' : 'Back to all guides'}
        </Link>
      </div>
    );
  }

  const body = article.body;

  return (
    <div className="min-h-screen py-20 px-4 sm:px-8" dir={isHebrew ? 'rtl' : 'ltr'}>
      {/* Structured data for Google + AI search */}
      <ArticleSchema
        headline={article.title}
        description={article.description}
        datePublished={article.published_at || article.updated_at}
        dateModified={article.updated_at}
        url={canonical}
      />
      {body.faq?.length > 0 && (
        <FAQSchema items={body.faq.map((f) => ({ question: f.q, answer: f.a }))} />
      )}

      <article className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Breadcrumb
            items={[
              { name: isHebrew ? 'מדריכים' : 'Guides', url: '/guides' },
              { name: article.title, url: `/guides/${slug}` },
            ]}
          />
        </div>

        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-4 text-memorial-gold">
            <FileText className="w-7 h-7" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold gradient-gold mb-4">
            {article.title}
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed">{body.intro}</p>
        </motion.header>

        <div className="space-y-10">
          {body.sections?.map((section, i) => (
            <motion.section
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <h2 className="text-2xl font-display font-bold text-white mb-4">{section.heading}</h2>
              <div className="space-y-4">
                {section.paragraphs.map((p, j) => (
                  <p key={j} className="text-gray-300 leading-relaxed text-lg">
                    {p}
                  </p>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {body.conclusion && (
          <div className="mt-12 mb-8">
            <p className="text-gray-300 leading-relaxed text-lg">{body.conclusion}</p>
          </div>
        )}

        {body.faq?.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              {isHebrew ? 'שאלות נפוצות' : 'Frequently Asked Questions'}
            </h2>
            <div className="space-y-4">
              {body.faq.map((f, i) => (
                <GlassCard key={i} className="p-6">
                  <h3 className="text-lg font-semibold text-memorial-gold mb-2">{f.q}</h3>
                  <p className="text-gray-300 leading-relaxed">{f.a}</p>
                </GlassCard>
              ))}
            </div>
          </section>
        )}

        <div className="mt-14">
          <Link
            to="/guides"
            className="inline-flex items-center gap-2 text-memorial-gold font-medium hover:gap-3 transition-all"
          >
            <span>{isHebrew ? 'עוד מדריכים' : 'More guides'}</span>
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>
      </article>
    </div>
  );
}
