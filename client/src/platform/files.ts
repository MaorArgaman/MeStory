import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isNative, isIOS } from './index';

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function saveAndShareBlob(
  blob: Blob,
  filename: string,
  mime = blob.type || 'application/octet-stream',
): Promise<void> {
  if (!isNative) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return;
  }

  const base64 = await blobToBase64(blob);
  const target = isIOS ? Directory.Documents : Directory.External;

  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: target,
    recursive: true,
  });

  try {
    await Share.share({
      title: filename,
      url: uri,
      dialogTitle: filename,
    });
  } catch (err) {
    console.warn('[files] share dialog canceled', err);
  }

  void mime;
}

export async function writeTextFile(
  path: string,
  data: string,
): Promise<string | null> {
  if (!isNative) return null;
  const { uri } = await Filesystem.writeFile({
    path,
    data,
    directory: Directory.Data,
    encoding: Encoding.UTF8,
    recursive: true,
  });
  return uri;
}

export async function readTextFile(path: string): Promise<string | null> {
  if (!isNative) return null;
  try {
    const { data } = await Filesystem.readFile({
      path,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return typeof data === 'string' ? data : null;
  } catch {
    return null;
  }
}
