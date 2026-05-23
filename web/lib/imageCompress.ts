// Resize photos client-side before upload — full-resolution iPhone shots
// are 2-4 MP and Claude vision charges per image token. Downsizing to
// 1024px on the longest edge cuts upload size and Anthropic cost ~3×
// without hurting recognition accuracy on food.

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.85;

export async function compressImage(file: File): Promise<File> {
  // Bail on non-decodable types (e.g. HEIC on browsers that can't render it).
  // The backend still accepts the original.
  try {
    const img = await loadImage(file);
    const { width, height } = scaleDown(img.width, img.height, MAX_DIMENSION);
    if (width === img.width && height === img.height && file.size < 800_000) {
      // Already small — skip the encode round-trip.
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

function scaleDown(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w > h ? max / w : max / h;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}
