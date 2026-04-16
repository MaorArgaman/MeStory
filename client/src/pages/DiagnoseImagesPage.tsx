/**
 * DiagnoseImagesPage — simple internal debug page that fetches the image
 * diagnostic endpoint for a book and displays the result as a readable table.
 *
 * Exists so the user doesn't have to paste JavaScript into the DevTools
 * Console (Chrome blocks pasting by default, which is confusing).
 *
 * Usage: navigate to /diagnose-images/:bookId — the current session token
 * is used automatically.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

interface ImageRecord {
  location: string;
  pageIndex?: number;
  url: string;
  kind: string;
  reachable?: { ok: boolean; status?: number; error?: string };
  bytesPreview?: number;
}

interface DiagnosticData {
  bookId: string;
  totalImages: number;
  byKind: Record<string, number>;
  images: ImageRecord[];
}

export default function DiagnoseImagesPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repersisting, setRepersisting] = useState(false);
  const [repersistResult, setRepersistResult] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) return;
    (async () => {
      try {
        const res = await api.get(`/books/${bookId}/image-diagnostic`);
        setData(res.data.data);
      } catch (e: any) {
        setError(e?.response?.data?.error || e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookId]);

  const handleRepersist = async () => {
    if (!bookId) return;
    setRepersisting(true);
    setRepersistResult(null);
    try {
      const res = await api.post(`/books/${bookId}/repersist-images`);
      const { migrated, skipped, failed, total, aiImagesMigrated } = res.data.data;
      const parts = [
        aiImagesMigrated ? `✅ ${aiImagesMigrated} AI images moved to page layout` : '',
        migrated ? `📦 ${migrated} images uploaded to permanent storage` : '',
        skipped ? `⏭ ${skipped} already permanent` : '',
        failed ? `⚠️ ${failed} failed (may have expired)` : '',
        `Total processed: ${total}`,
      ].filter(Boolean);
      setRepersistResult(parts.join('\n'));
      // Refresh the diagnostic
      const reload = await api.get(`/books/${bookId}/image-diagnostic`);
      setData(reload.data.data);
    } catch (e: any) {
      setRepersistResult(`Error: ${e?.response?.data?.error || e?.message}`);
    } finally {
      setRepersisting(false);
    }
  };

  const abbreviateUrl = (url: string): string => {
    if (!url) return '—';
    if (url.length <= 80) return url;
    return `${url.slice(0, 60)}…${url.slice(-20)}`;
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a', background: '#f9fafb', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 8 }}>🔍 Image Diagnostic</h1>
      <div style={{ color: '#6b7280', marginBottom: 24, fontSize: 13 }}>Book ID: {bookId}</div>

      {loading && <div style={{ padding: 20 }}>Loading…</div>}

      {error && (
        <div style={{ padding: 16, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, color: '#b91c1c' }}>
          Error: {error}
        </div>
      )}

      {data && (
        <>
          {/* Summary */}
          <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, marginTop: 0 }}>Summary</h2>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <Metric label="Total images" value={data.totalImages} />
              {Object.entries(data.byKind).map(([kind, count]) => (
                <Metric key={kind} label={kind} value={count as number} />
              ))}
            </div>
          </div>

          {/* Action button */}
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={handleRepersist}
              disabled={repersisting || data.totalImages === 0}
              style={{
                padding: '12px 24px',
                background: repersisting ? '#9ca3af' : '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: repersisting ? 'not-allowed' : 'pointer',
              }}
            >
              {repersisting ? 'Migrating images…' : '💾 Migrate all reachable images to permanent storage'}
            </button>
            {repersistResult && (
              <div style={{ marginTop: 12, padding: 12, background: '#ecfdf5', border: '1px solid #86efac', borderRadius: 8, color: '#166534', whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                {repersistResult}
              </div>
            )}
          </div>

          {/* Table of all images */}
          <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: 18, marginTop: 0 }}>All images ({data.images.length})</h2>
            {data.images.length === 0 ? (
              <div style={{ padding: 20, color: '#6b7280', textAlign: 'center' }}>
                No images found. This means either (a) the book has no images, or (b) the images were never
                saved to the database. Check the "Save" button works in the layout editor.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                      <th style={th}>#</th>
                      <th style={th}>Location</th>
                      <th style={th}>Page</th>
                      <th style={th}>Kind</th>
                      <th style={th}>Reachable</th>
                      <th style={th}>Size</th>
                      <th style={th}>URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.images.map((img, i) => {
                      const isData = img.kind === 'data-url';
                      const isReachable = isData || img.reachable?.ok;
                      const bytesHuman = img.bytesPreview
                        ? img.bytesPreview > 1024
                          ? `${(img.bytesPreview / 1024).toFixed(0)}KB`
                          : `${img.bytesPreview}B`
                        : '';
                      return (
                        <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                          <td style={td}>{i + 1}</td>
                          <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{img.location}</td>
                          <td style={td}>{img.pageIndex ?? '—'}</td>
                          <td style={{ ...td, ...kindStyle(img.kind) }}>{img.kind}</td>
                          <td style={td}>
                            {isData ? '—' : isReachable ? '✅' : `❌ ${img.reachable?.status || img.reachable?.error || ''}`}
                          </td>
                          <td style={td}>{bytesHuman}</td>
                          <td style={{ ...td, fontFamily: 'monospace', fontSize: 11, maxWidth: 320, wordBreak: 'break-all' }}>
                            {abbreviateUrl(img.url)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{ marginTop: 24, padding: 16, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, fontSize: 13, lineHeight: 1.6 }}>
            <strong>Legend:</strong>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li><strong>data-url</strong>: inline base64 — persistent but bloats the row</li>
              <li><strong>supabase-storage</strong>: stable, permanent ✅</li>
              <li><strong>dalle-temp</strong>: OpenAI DALL-E URL — <em>expires after ~1 hour!</em></li>
              <li><strong>pollinations</strong>: regenerates a different image every request</li>
              <li><strong>blob-url</strong>: browser-only URL that dies on reload</li>
              <li><strong>local-uploads</strong>: points at /uploads on the dev server</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

// Little presentational helpers
const th = { padding: '8px 12px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' as const, color: '#374151' };
const td = { padding: '8px 12px', verticalAlign: 'top' as const };

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#6b7280', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function kindStyle(kind: string): React.CSSProperties {
  if (kind.includes('supabase') || kind === 'data-url') return { color: '#166534' };
  if (kind.includes('temp') || kind.includes('blob') || kind.includes('expires')) return { color: '#b91c1c', fontWeight: 600 };
  return { color: '#6b7280' };
}
