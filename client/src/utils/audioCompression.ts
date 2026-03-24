/**
 * Audio Compression Utility
 * Compresses audio files to reduce size for upload
 */

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB limit for Vercel

/**
 * Compress audio blob by re-encoding at lower bitrate
 */
export async function compressAudio(
  audioBlob: Blob,
  targetSizeKB: number = 3500 // Target ~3.5MB to be safe
): Promise<Blob> {
  // If already small enough, return as-is
  if (audioBlob.size <= targetSizeKB * 1024) {
    console.log('Audio already small enough, skipping compression');
    return audioBlob;
  }

  console.log(`Compressing audio from ${(audioBlob.size / 1024).toFixed(0)}KB to ~${targetSizeKB}KB`);

  try {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Decode the audio
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Calculate compression ratio needed
    const currentSizeKB = audioBlob.size / 1024;
    const compressionRatio = targetSizeKB / currentSizeKB;

    // Downsample parameters
    const originalSampleRate = audioBuffer.sampleRate;
    const targetSampleRate = Math.max(8000, Math.min(16000, Math.floor(originalSampleRate * compressionRatio)));

    // Create offline context for resampling
    const duration = audioBuffer.duration;
    const offlineContext = new OfflineAudioContext(
      1, // Mono
      Math.ceil(duration * targetSampleRate),
      targetSampleRate
    );

    // Create buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);

    // Render resampled audio
    const resampledBuffer = await offlineContext.startRendering();

    // Convert to WAV (Whisper accepts WAV)
    const wavBlob = audioBufferToWav(resampledBuffer);

    console.log(`Compressed audio from ${(audioBlob.size / 1024).toFixed(0)}KB to ${(wavBlob.size / 1024).toFixed(0)}KB`);

    // Close audio context
    await audioContext.close();

    return wavBlob;
  } catch (error) {
    console.error('Audio compression failed, returning original:', error);
    return audioBlob;
  }
}

/**
 * Convert AudioBuffer to WAV Blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  // Interleave channels
  const length = buffer.length * numChannels * (bitDepth / 8);
  const wavBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(wavBuffer);

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Write audio data
  const channelData = buffer.getChannelData(0);
  let offset = 44;

  for (let i = 0; i < channelData.length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

/**
 * Write string to DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Check if audio needs compression
 */
export function needsCompression(blob: Blob): boolean {
  return blob.size > MAX_FILE_SIZE;
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default {
  compressAudio,
  needsCompression,
  formatFileSize,
};
