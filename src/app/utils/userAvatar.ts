const KEY = 'cassia_user_avatars_v1';

const readAll = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeAll = (all: Record<string, string>): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // storage may be unavailable or full; ignore
  }
};

export const getUserAvatar = (userId: string): string | undefined => readAll()[userId];

export const setUserAvatar = (userId: string, dataUrl: string): void => {
  const all = readAll();
  all[userId] = dataUrl;
  writeAll(all);
};

export const clearUserAvatar = (userId: string): void => {
  const all = readAll();
  delete all[userId];
  writeAll(all);
};

// Center-crop to a square and scale down to `size`px. Avatars render small
// everywhere, so these are kept much smaller than chat backgrounds.
export const encodeAvatar = (file: File, size = 256): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(url);
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
