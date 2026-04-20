import { api } from '../services/api';

type Phase = 'queued' | 'running' | 'downloading';

interface AsyncExportOptions {
  bookId: string;
  bookTitle: string;
  /** Called on every poll tick with current progress (0-100) and phase. */
  onProgress?: (progress: number, message: string, phase: Phase) => void;
  /** Poll interval in ms. Default 2000. */
  pollIntervalMs?: number;
  /** Give up after this many ms. Default 5 minutes. */
  timeoutMs?: number;
}

/**
 * Triggers an async PDF export: enqueues the job, polls until done, downloads the result.
 *
 * Usage:
 *   await exportBookAsPdfAsync({
 *     bookId,
 *     bookTitle,
 *     onProgress: (pct, msg) => setStatus(`${pct}% — ${msg}`),
 *   });
 *
 * Throws on failure — caller is responsible for showing a toast.
 */
export async function exportBookAsPdfAsync(opts: AsyncExportOptions): Promise<{ warnings?: string[] }> {
  const { bookId, bookTitle, onProgress, pollIntervalMs = 2000, timeoutMs = 5 * 60 * 1000 } = opts;

  // 1. Enqueue the job
  onProgress?.(0, 'Starting export...', 'queued');
  const enqueueRes = await api.post(`/books/${bookId}/export-async`);
  const jobId: string = enqueueRes.data?.data?.jobId;
  if (!jobId) throw new Error('Server did not return a job id');

  // 2. Poll until done (or timeout)
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));

    const statusRes = await api.get(`/jobs/${jobId}`);
    const job = statusRes.data?.data;
    if (!job) throw new Error('Job not found');

    onProgress?.(job.progress ?? 0, job.progressMessage || 'Working...', 'running');

    if (job.status === 'completed') {
      // 3. Download the finished PDF from the signed URL
      const downloadUrl: string | undefined = job.result?.downloadUrl;
      if (!downloadUrl) throw new Error('Job completed without a download URL');

      onProgress?.(100, 'Downloading...', 'downloading');

      const safeName = bookTitle.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '_');
      // Fetch the PDF bytes from Supabase Storage and save to disk
      const fileRes = await fetch(downloadUrl);
      if (!fileRes.ok) throw new Error(`Download failed: ${fileRes.status}`);
      const blob = await fileRes.blob();

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.setAttribute('download', `${safeName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
      return { warnings: job.result?.warnings };
    }

    if (job.status === 'failed' || job.status === 'cancelled') {
      throw new Error(job.error || 'Export failed');
    }
  }

  throw new Error('Export timed out — please try again');
}
