import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Play,
  Power,
  RefreshCw,
  CheckCircle2,
  FileText,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { GlassCard, GlowingButton } from '../../components/ui';

interface Competitor {
  name: string;
  domain?: string;
  note?: string;
}

interface Overview {
  config: {
    enabled: boolean;
    competitors: Competitor[];
    email_recipient: string;
    queries_per_run: number;
    articles_per_run: number;
    last_run_date: string | null;
  };
  lastRun: any;
  totals: {
    trackedQueries: number;
    coveredQueries: number;
    publishedArticles: number;
    draftArticles: number;
    totalRuns: number;
  };
  trend: Array<{ date: string; presenceRate: number | null; trackedQueries: number | null; coveredQueries: number | null }>;
}

const statusBadge = (status: string): string => {
  switch (status) {
    case 'success': return 'bg-green-500/20 text-green-300';
    case 'partial': return 'bg-yellow-500/20 text-yellow-300';
    case 'error': return 'bg-red-500/20 text-red-300';
    case 'running': return 'bg-blue-500/20 text-blue-300';
    default: return 'bg-gray-500/20 text-gray-300';
  }
};

const statusLabel = (status: string): string => {
  switch (status) {
    case 'success': return 'הושלם';
    case 'partial': return 'חלקי';
    case 'error': return 'נכשל';
    case 'running': return 'רץ…';
    default: return status;
  }
};

const actionLabel = (type: string): string => {
  switch (type) {
    case 'rank_check': return 'בדיקת דירוג';
    case 'article_published': return 'מאמר פורסם';
    case 'article_drafted': return 'מאמר (טיוטה)';
    case 'keyword_added': return 'מילות מפתח';
    case 'competitor_discovered': return 'מתחרים';
    case 'media_observation': return 'תצפית מדיה';
    case 'skipped': return 'דולג';
    default: return type;
  }
};

export default function DavidPanel() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<{ run: any; actions: any[] } | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [newComp, setNewComp] = useState({ name: '', domain: '' });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [ov, rs, arts] = await Promise.all([
        api.get('/admin/david/overview'),
        api.get('/admin/david/runs'),
        api.get('/admin/david/articles'),
      ]);
      setOverview(ov.data.data);
      const runList = rs.data.data || [];
      setRuns(runList);
      setArticles(arts.data.data || []);
      // Auto-open the most recent run so the activity is visible immediately,
      // without the admin having to hunt for it.
      if (runList.length && !selectedRun) {
        openRun(runList[0].id);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'נכשלה טעינת נתוני דוד');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // While a run is in progress, refresh periodically so its actions stream in.
  useEffect(() => {
    const hasRunning = runs.some((r) => r.status === 'running');
    if (!hasRunning && !running) return;
    const t = setInterval(() => {
      loadAll();
      if (selectedRun) openRun(selectedRun.run.id);
    }, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runs, running, selectedRun]);

  const runNow = async () => {
    setRunning(true);
    toast.loading('דוד רץ עכשיו… זה עשוי לקחת דקה או שתיים', { id: 'david-run' });
    try {
      const res = await api.post('/admin/david/run-now');
      toast.success(`דוד סיים: ${res.data.data?.summary || 'הושלם'}`, { id: 'david-run' });
      await loadAll();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'הריצה נכשלה', { id: 'david-run' });
    } finally {
      setRunning(false);
    }
  };

  const saveConfig = async (patch: Record<string, unknown>) => {
    try {
      const res = await api.put('/admin/david/config', patch);
      setOverview((prev) => (prev ? { ...prev, config: res.data.data } : prev));
      toast.success('ההגדרות נשמרו');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'שמירת ההגדרות נכשלה');
    }
  };

  const toggleEnabled = () => {
    if (!overview) return;
    saveConfig({ enabled: !overview.config.enabled });
  };

  const addCompetitor = () => {
    if (!overview || !newComp.name.trim()) return;
    const competitors = [...overview.config.competitors, { name: newComp.name.trim(), domain: newComp.domain.trim() || undefined }];
    setNewComp({ name: '', domain: '' });
    saveConfig({ competitors });
  };

  const removeCompetitor = (idx: number) => {
    if (!overview) return;
    const target = overview.config.competitors[idx];
    if (!window.confirm(`להסיר את "${target?.name}" מרשימת המתחרים?`)) return;
    const competitors = overview.config.competitors.filter((_, i) => i !== idx);
    saveConfig({ competitors });
  };

  const openRun = async (id: string) => {
    try {
      const res = await api.get(`/admin/david/runs/${id}`);
      setSelectedRun(res.data.data);
    } catch {
      toast.error('טעינת הריצה נכשלה');
    }
  };

  const setArticleStatus = async (id: string, status: string) => {
    try {
      await api.put(`/admin/david/articles/${id}/status`, { status });
      toast.success('סטטוס המאמר עודכן');
      const arts = await api.get('/admin/david/articles');
      setArticles(arts.data.data || []);
    } catch {
      toast.error('עדכון המאמר נכשל');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-memorial-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!overview) return null;

  const { config, lastRun, totals, trend } = overview;
  const chartData = trend
    .filter((t) => t.presenceRate !== null)
    .map((t) => ({ date: t.date?.slice(5), presence: Math.round((t.presenceRate || 0) * 100), covered: t.coveredQueries || 0 }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} dir="rtl" className="space-y-6">
      {/* Header / status */}
      <GlassCard glow="gold" className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-memorial-gold to-yellow-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-deep-space" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-white">דוד</h2>
              <p className="text-sm text-gray-400">סוכן SEO · GEO · AEO יומי אוטונומי</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.enabled ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
              {config.enabled ? 'פעיל' : 'מושבת'}
            </span>
            <button
              onClick={toggleEnabled}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <Power className="w-4 h-4" />
              {config.enabled ? 'השבת' : 'הפעל'}
            </button>
            <GlowingButton onClick={runNow} disabled={running} variant="gold">
              {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? 'רץ…' : 'הרץ עכשיו'}
            </GlowingButton>
          </div>
        </div>
        {lastRun && (
          <p className="mt-4 text-sm text-gray-400">
            ריצה אחרונה: <span className="text-white">{lastRun.run_date}</span> · {lastRun.summary || lastRun.status}
          </p>
        )}
      </GlassCard>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'שאלות במעקב', value: totals.trackedQueries, icon: Search },
          { label: 'שאלות שכוסו', value: totals.coveredQueries, icon: CheckCircle2 },
          { label: 'מאמרים פורסמו', value: totals.publishedArticles, icon: FileText },
          { label: 'טיוטות', value: totals.draftArticles, icon: FileText },
          { label: 'סה״כ ריצות', value: totals.totalRuns, icon: TrendingUp },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <GlassCard key={s.label} className="p-4">
              <Icon className="w-5 h-5 text-memorial-gold mb-2" />
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </GlassCard>
          );
        })}
      </div>

      {/* Trend chart */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-display font-bold text-white mb-4">מגמת נוכחות מצטברת (% מהשאלות בהן אנחנו מופיעים)</h3>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="presence" name="% נוכחות" stroke="#FFD700" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="covered" name="שאלות שכוסו" stroke="#7C9BFC" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-sm">הגרף יתמלא לאחר כמה ימי ריצה. כרגע יש מעט מדי נקודות.</p>
        )}
      </GlassCard>

      {/* Competitors */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-display font-bold text-white mb-4">מתחרים במעקב</h3>
        {config.competitors.length === 0 && (
          <p className="text-gray-400 text-sm mb-3">לא הוגדרו מתחרים. דוד מזהה מועמדים אוטומטית, אך מומלץ להוסיף ידנית.</p>
        )}
        <div className="flex flex-wrap gap-2 mb-4">
          {config.competitors.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm">
              {c.name}
              {c.domain && <span className="text-gray-400 text-xs">{c.domain}</span>}
              <button
                onClick={() => removeCompetitor(i)}
                aria-label={`הסר מתחרה ${c.name}`}
                className="text-red-300 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={newComp.name}
            onChange={(e) => setNewComp({ ...newComp, name: e.target.value })}
            placeholder="שם מתחרה"
            aria-label="שם מתחרה"
            className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
          />
          <input
            value={newComp.domain}
            onChange={(e) => setNewComp({ ...newComp, domain: e.target.value })}
            placeholder="דומיין (אופציונלי)"
            aria-label="דומיין מתחרה (אופציונלי)"
            className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
          />
          <button onClick={addCompetitor} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-memorial-gold/20 text-memorial-gold hover:bg-memorial-gold/30">
            <Plus className="w-4 h-4" /> הוסף
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-5 max-w-md">
          <label className="text-sm text-gray-300">
            שאלות לבדיקה בכל ריצה
            <input
              type="number"
              min={1}
              max={20}
              defaultValue={config.queries_per_run}
              onBlur={(e) => saveConfig({ queries_per_run: Number(e.target.value) })}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
            />
          </label>
          <label className="text-sm text-gray-300">
            מאמרים בכל ריצה
            <input
              type="number"
              min={0}
              max={3}
              defaultValue={config.articles_per_run}
              onBlur={(e) => saveConfig({ articles_per_run: Number(e.target.value) })}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
            />
          </label>
        </div>
      </GlassCard>

      {/* Daily log */}
      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-bold text-white">יומן ריצות</h3>
            <button
              onClick={loadAll}
              aria-label="רענן יומן ריצות"
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" /> רענן
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {runs.map((r) => (
              <button
                key={r.id}
                onClick={() => openRun(r.id)}
                className={`w-full text-right p-3 rounded-lg border transition-all ${selectedRun?.run?.id === r.id ? 'border-memorial-gold/50 bg-memorial-gold/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white font-medium">{r.run_date}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-gray-300">
                      {r.trigger === 'manual' ? 'ידני' : 'אוטומטי'}
                    </span>
                    {typeof r.actions_count === 'number' && r.actions_count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-gray-300">
                        {r.actions_count} פעולות
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(r.status)}`}>
                      {statusLabel(r.status)}
                    </span>
                  </div>
                </div>
                <p className={`text-xs mt-1 truncate ${r.status === 'error' ? 'text-red-300' : 'text-gray-400'}`}>
                  {r.status === 'error' ? r.error || 'ריצה נכשלה' : r.summary || '—'}
                </p>
              </button>
            ))}
            {runs.length === 0 && <p className="text-gray-400 text-sm">עדיין אין ריצות. לחץ "הרץ עכשיו".</p>}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-display font-bold text-white mb-4">
            {selectedRun ? `פעולות בריצה ${selectedRun.run.run_date}` : 'בחר ריצה לצפייה בפעולות'}
          </h3>
          {selectedRun?.run?.status === 'error' && (
            <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-300">⚠ הריצה נכשלה</p>
              {selectedRun.run.error && <p className="text-xs text-red-300/80 mt-1">{selectedRun.run.error}</p>}
            </div>
          )}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedRun?.actions.map((a) => (
              <div key={a.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-memorial-gold/20 text-memorial-gold">{actionLabel(a.type)}</span>
                  <span className="text-white text-sm">{a.title}</span>
                </div>
              </div>
            ))}
            {selectedRun && selectedRun.actions.length === 0 && (
              <p className="text-gray-400 text-sm">
                {selectedRun.run?.status === 'running'
                  ? 'הריצה בעיצומה — פעולות יופיעו כאן בזמן אמת.'
                  : 'אין פעולות מתועדות לריצה זו.'}
              </p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Articles */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-display font-bold text-white mb-4">מאמרים שדוד כתב</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {articles.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'published' ? 'bg-green-500/20 text-green-300' : a.status === 'draft' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-500/20 text-gray-300'}`}>
                    {a.status === 'published' ? 'פורסם' : a.status === 'draft' ? 'טיוטה' : 'הוסר'}
                  </span>
                  <span className="text-white text-sm truncate">{a.title}</span>
                </div>
                {a.review_notes && <p className="text-xs text-red-300 mt-1">⚠ {a.review_notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {a.status === 'published' && (
                  <a
                    href={`/guides/${a.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`פתח את המאמר "${a.title}" בלשונית חדשה`}
                    className="text-memorial-gold hover:text-yellow-400"
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                )}
                {a.status === 'published' ? (
                  <button
                    onClick={() => {
                      if (window.confirm(`להסיר מהאתר את המאמר "${a.title}"? הוא לא יוצג יותר לקוראים.`)) {
                        setArticleStatus(a.id, 'unpublished');
                      }
                    }}
                    className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30"
                  >
                    הסר
                  </button>
                ) : (
                  <button onClick={() => setArticleStatus(a.id, 'published')} className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30">
                    פרסם
                  </button>
                )}
              </div>
            </div>
          ))}
          {articles.length === 0 && <p className="text-gray-400 text-sm">עדיין לא נכתבו מאמרים.</p>}
        </div>
      </GlassCard>
    </motion.div>
  );
}
