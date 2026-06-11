import { ChangeEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  defaultSettings,
  exportData,
  getAll,
  importData,
  loadSettings,
  putItem,
  saveSettings
} from "./storage";
import type { Collage, CollageBackground, CollageDecorItem, CollageExportPreset, CollageItem, CollageTextItem, ExportedData, FoodRecord, Rating, Settings, Source, StickerAsset, StickerStyle } from "./types";

const categories = ["Milk tea", "Coffee", "Drink", "Meal", "Dessert", "Snack", "Fruit", "Homemade", "Restaurant", "Other"];
const ratingOptions: { value: Exclude<Rating, "Bad">; label: string; image: string }[] = [
  { value: "Amazing", label: "Amazing", image: "/ratings/rating-amazing.png" },
  { value: "Good", label: "Good", image: "/ratings/rating-good.png" },
  { value: "Okay", label: "Okay", image: "/ratings/rating-okay.png" }
];
const editorTabs = ["Layout", "Background", "Stickers", "Text", "Export"] as const;
const exportPresets: CollageExportPreset[] = [
  { id: "1:1", label: "Instagram Post", width: 1080, height: 1080 },
  { id: "4:5", label: "Portrait Post", width: 1080, height: 1350 },
  { id: "9:16", label: "Story", width: 1080, height: 1920 },
  { id: "16:9", label: "Wide", width: 1920, height: 1080 }
];
const layoutTemplates = ["Scatter", "Grid", "Journal", "Cover"] as const;
const munchiPalette = [
  { label: "Dusty Rose", color: "#b96f82" },
  { label: "Cream", color: "#fff7df" },
  { label: "Peach", color: "#ffd8ca" },
  { label: "Matcha", color: "#dce8c9" },
  { label: "Butter", color: "#ffe89c" },
  { label: "Lavender", color: "#d8d0ee" },
  { label: "Coral", color: "#ee8d8f" },
  { label: "Dark Cozy", color: "#2b2026" }
];
const backgroundOptions: CollageBackground[] = [
  { type: "paper", label: "Cream paper", color: "#fff7df", accent: "#eadbc8" },
  { type: "gradient", label: "Soft gradient", color: "#fff7df", accent: "#f1d6dd" },
  { type: "grid", label: "Paper grid", color: "#fff8ee", accent: "#d9bdc5" },
  { type: "dots", label: "Tiny dots", color: "#fff7df", accent: "#d8d0ee" },
  { type: "solid", label: "Solid color", color: "#f1d6dd" },
  { type: "dark", label: "Dark cozy", color: "#2b2026", accent: "#b96f82" }
];
const posterDecor = [
  { src: "/poster-decor/bow.svg", alt: "Bow", className: "daily-decor-bow" },
  { src: "/poster-decor/flower.svg", alt: "Flower", className: "daily-decor-flower" },
  { src: "/poster-decor/cake.svg", alt: "Cake", className: "daily-decor-cake" },
  { src: "/poster-decor/glowing-star.svg", alt: "Star", className: "daily-decor-star" }
];
const dailyPosterQuotes = ["tiny bites, big mood", "save this day", "yum archive"];
const decorStickers = [
  { category: "Labels", label: "YUM", tone: "rose" },
  { category: "Labels", label: "SWEET", tone: "butter" },
  { category: "Labels", label: "TREAT", tone: "peach" },
  { category: "Stars", label: "*", tone: "butter" },
  { category: "Stars", label: "WOW", tone: "coral" },
  { category: "Hearts", label: "LOVE", tone: "lavender" },
  { category: "Hearts", label: "<3", tone: "rose" },
  { category: "Tape", label: "TAPE", tone: "matcha" },
  { category: "Sparkles", label: "SPARK", tone: "lavender" },
  { category: "Date stamps", label: "TODAY", tone: "coral" }
];
const textPresets = [
  { label: "Big Title", style: "title", text: "Today's bites", fontSize: 32, color: "#241923", backgroundStyle: "none", rotation: -2 },
  { label: "Soft Label", style: "label", text: "soft & sweet", fontSize: 18, color: "#4c3440", backgroundStyle: "label", rotation: -3 },
  { label: "Tiny Note", style: "note", text: "a little food memory", fontSize: 14, color: "#76616b", backgroundStyle: "soft", rotation: 0 },
  { label: "Date Stamp", style: "stamp", text: new Date().toLocaleDateString("en", { month: "short", day: "numeric" }), fontSize: 16, color: "#4c3440", backgroundStyle: "stamp", rotation: -4 }
] as const;

type Draft = {
  source: Source;
  file?: File;
  originalBlob?: Blob;
  cutoutBlob?: Blob;
  pixelBlob?: Blob;
  stickerBlob?: Blob;
  prepError?: string;
  analysis?: FoodAnalysis;
  style: StickerStyle;
};

type FoodAnalysis = {
  name: string;
  category: string;
  confidence: "low" | "medium" | "high";
  note: string;
};

const initialDraft: Draft = {
  source: "upload",
  style: { border: 12, shadow: true, rotation: -4, scale: 1 }
};

const uid = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};
const ratingOptionFor = (rating: Rating) => ratingOptions.find((item) => item.value === rating) || ratingOptions[2];
const todayKey = () => new Date().toISOString().slice(0, 10);
const dateKey = (value: string) => value.slice(0, 10);
const isToday = (value: string) => dateKey(value) === todayKey();
const formatDay = (value: string) => new Date(value).toLocaleDateString("en", { month: "short", day: "numeric", weekday: "short" });
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const defaultExportPreset = exportPresets[0];

const normalizeBackground = (background?: string | CollageBackground): CollageBackground => {
  if (background && typeof background !== "string") return { ...backgroundOptions[0], ...background };
  const legacy = background || backgroundOptions[0].label;
  const legacyMap: Record<string, CollageBackground> = {
    "Cream paper": backgroundOptions[0],
    "Warm beige": { type: "solid", label: "Warm beige", color: "#f4e6d1" },
    "Pastel grid": backgroundOptions[2],
    "Soft peach": { type: "solid", label: "Soft peach", color: "#ffd8ca" },
    Matcha: { type: "solid", label: "Matcha", color: "#dce8c9" },
    "Dark cozy": backgroundOptions[5]
  };
  return legacyMap[legacy] || backgroundOptions.find((item) => item.label === legacy) || backgroundOptions[0];
};

const collageBackgroundStyle = (background: CollageBackground): React.CSSProperties => {
  if (background.type === "dark") {
    return { background: `linear-gradient(145deg, ${background.color}, #171014)` };
  }
  if (background.type === "gradient") {
    return { background: `linear-gradient(145deg, ${background.color}, ${background.accent || "#f1d6dd"})` };
  }
  if (background.type === "grid") {
    const accent = background.accent || "#d9bdc5";
    return {
      background: `linear-gradient(90deg, ${accent}66 1px, transparent 1px), linear-gradient(${accent}66 1px, transparent 1px), ${background.color}`,
      backgroundSize: "24px 24px"
    };
  }
  if (background.type === "dots") {
    return { background: `radial-gradient(circle, ${background.accent || "#d8d0ee"} 1.5px, transparent 2px), ${background.color}`, backgroundSize: "18px 18px" };
  }
  if (background.type === "paper") {
    return { background: `linear-gradient(90deg, ${background.accent || "#eadbc8"}55 1px, transparent 1px), linear-gradient(${background.accent || "#eadbc8"}55 1px, transparent 1px), ${background.color}`, backgroundSize: "32px 32px" };
  }
  return { background: background.color };
};

const normalizeTextItems = (collage: Collage): CollageTextItem[] => {
  if (collage.textItems?.length) return collage.textItems;
  if (!collage.text) return [];
  return [{
    id: "legacy-caption",
    text: collage.text,
    x: collage.captionX ?? 24,
    y: collage.captionY ?? 240,
    fontSize: 18,
    color: "#4c3440",
    backgroundStyle: "label",
    style: "label",
    rotation: -2,
    zIndex: 900
  }];
};

const presetForRatio = (ratio: string) => exportPresets.find((item) => item.id === ratio) || defaultExportPreset;

const paintCanvasBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, background: CollageBackground) => {
  ctx.fillStyle = background.color;
  ctx.fillRect(0, 0, width, height);
  if (background.type === "gradient" || background.type === "dark") {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, background.color);
    gradient.addColorStop(1, background.accent || (background.type === "dark" ? "#171014" : "#f1d6dd"));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  if (background.type === "grid" || background.type === "paper") {
    ctx.strokeStyle = `${background.accent || "#eadbc8"}88`;
    ctx.lineWidth = Math.max(1, width / 1080);
    const step = background.type === "grid" ? width / 45 : width / 34;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
  if (background.type === "dots") {
    ctx.fillStyle = background.accent || "#d8d0ee";
    const step = width / 54;
    for (let x = step; x < width; x += step) {
      for (let y = step; y < height; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, Math.max(2, width / 360), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
};

const decorToneColor = (tone: string) => ({
  rose: "#f6d4dd",
  lavender: "#d8d0ee",
  butter: "#ffe89c",
  matcha: "#dce8c9",
  coral: "#ffd6cc",
  peach: "#ffd8ca"
}[tone] || "#f6d4dd");

const useAssetUrls = (assets: StickerAsset[]) => {
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const asset of assets) next[asset.id] = URL.createObjectURL(asset.cutoutBlob);
    setUrls(next);
    return () => Object.values(next).forEach(URL.revokeObjectURL);
  }, [assets]);
  return urls;
};

const Toast = ({ message }: { message: string }) => <div className={`toast ${message ? "show" : ""}`}>{message}</div>;

const StickerImage = ({
  src,
  label,
  style,
  className = ""
}: {
  src?: string;
  label: string;
  style?: StickerStyle;
  className?: string;
}) => (
  <div
    className={`sticker-photo ${src ? "has-image" : ""} ${style?.shadow === false ? "no-shadow" : ""} ${className}`}
    style={{
      "--sticker-rotation": `${style?.rotation ?? -4}deg`,
      "--sticker-scale": String(style?.scale ?? 1),
      "--sticker-border": `${style?.border ?? 12}px`
    } as React.CSSProperties}
  >
    {src ? <img src={src} alt={label} draggable={false} /> : <span>{label.slice(0, 2)}</span>}
  </div>
);

const loadImage = (blob: Blob) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(blob);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not prepare the sticker image."));
    };
    image.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, type = "image/png", quality?: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create the sticker image.")), type, quality);
  });

const loadImageUrl = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the poster image."));
    image.src = src;
  });

const roundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const drawPosterSticker = async (
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  size: number,
  rotation: number,
  border = 0
) => {
  const image = await loadImageUrl(src);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.shadowColor = "rgba(55, 34, 42, .18)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 12;
  if (border) {
    roundedRect(ctx, -size / 2, -size / 2, size, size, 28);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }
  const drawSize = size - border * 2;
  ctx.drawImage(image, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
  ctx.restore();
};

const drawPosterLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, rotation: number) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.font = `700 34px "Munchi Pixel", "Munchi Round", sans-serif`;
  const width = ctx.measureText(text).width + 48;
  const height = 58;
  ctx.shadowColor = "rgba(55, 34, 42, .18)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 8;
  roundedRect(ctx, 0, -height, width, height, 14);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#281722";
  ctx.fillText(text, 24, -18);
  ctx.restore();
};

const shrinkImageBlob = async (source: Blob) => {
  const image = await loadImage(source);
  const maxSide = 1200;
  const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  if (ratio === 1 && source.size <= 1_500_000) return source;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const ctx = canvas.getContext("2d");
  if (!ctx) return source;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvasToBlob(canvas, "image/jpeg", 0.82);
};

const makeStickerBlob = async (source: Blob, border: number) => {
  const image = await loadImage(source);
  const maxSide = 1100;
  const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;
  ctx.drawImage(image, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const mask = new Uint8Array(width * height);
  for (let index = 0; index < mask.length; index += 1) {
    if (data[index * 4 + 3] >= 72) mask[index] = 1;
  }

  const visited = new Uint8Array(mask.length);
  const keep = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);
  const minPixels = Math.max(24, Math.floor(mask.length * 0.00025));
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    let head = 0;
    let tail = 0;
    queue[tail] = start;
    tail += 1;
    visited[start] = 1;
    while (head < tail) {
      const current = queue[head];
      head += 1;
      const x = current % width;
      const left = current - 1;
      const right = current + 1;
      const up = current - width;
      const down = current + width;
      if (x > 0 && !visited[left] && mask[left]) {
        visited[left] = 1;
        queue[tail] = left;
        tail += 1;
      }
      if (x < width - 1 && !visited[right] && mask[right]) {
        visited[right] = 1;
        queue[tail] = right;
        tail += 1;
      }
      if (up >= 0 && !visited[up] && mask[up]) {
        visited[up] = 1;
        queue[tail] = up;
        tail += 1;
      }
      if (down < mask.length && !visited[down] && mask[down]) {
        visited[down] = 1;
        queue[tail] = down;
        tail += 1;
      }
    }
    if (tail >= minPixels) {
      for (let item = 0; item < tail; item += 1) keep[queue[item]] = 1;
    }
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let index = 0; index < keep.length; index += 1) {
    if (!keep[index]) {
      data[index * 4 + 3] = 0;
      continue;
    }
    const x = index % width;
    const y = Math.floor(index / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    data[index * 4 + 3] = Math.max(data[index * 4 + 3], 190);
  }
  if (maxX < minX || maxY < minY) return source;
  ctx.putImageData(imageData, 0, 0);

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const objectCanvas = document.createElement("canvas");
  objectCanvas.width = cropWidth;
  objectCanvas.height = cropHeight;
  const objectCtx = objectCanvas.getContext("2d");
  if (!objectCtx) return source;
  objectCtx.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  const silhouette = document.createElement("canvas");
  silhouette.width = cropWidth;
  silhouette.height = cropHeight;
  const silhouetteCtx = silhouette.getContext("2d");
  if (!silhouetteCtx) return source;
  const silhouetteData = silhouetteCtx.createImageData(cropWidth, cropHeight);
  for (let y = 0; y < cropHeight; y += 1) {
    for (let x = 0; x < cropWidth; x += 1) {
      const sourceIndex = (y + minY) * width + x + minX;
      if (!keep[sourceIndex]) continue;
      const targetIndex = (y * cropWidth + x) * 4;
      silhouetteData.data[targetIndex] = 255;
      silhouetteData.data[targetIndex + 1] = 255;
      silhouetteData.data[targetIndex + 2] = 255;
      silhouetteData.data[targetIndex + 3] = 255;
    }
  }
  silhouetteCtx.putImageData(silhouetteData, 0, 0);

  const padding = Math.max(2, Math.round(border));
  const output = document.createElement("canvas");
  output.width = cropWidth + padding * 2;
  output.height = cropHeight + padding * 2;
  const outputCtx = output.getContext("2d");
  if (!outputCtx) return source;
  for (let y = -padding; y <= padding; y += 1) {
    for (let x = -padding; x <= padding; x += 1) {
      if (x * x + y * y <= padding * padding) outputCtx.drawImage(silhouette, padding + x, padding + y);
    }
  }
  outputCtx.drawImage(objectCanvas, padding, padding);
  return canvasToBlob(output);
};

const EmptyState = ({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) => (
  <section className="empty-state">
    <h2>{title}</h2>
    <p>{body}</p>
    {action}
  </section>
);

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="app-shell">
    <aside className="sidebar">
      <Link className="brand" to="/">
        <span className="brand-mark">M</span>
        <span>Munchi</span>
      </Link>
      <nav className="desktop-nav" aria-label="Primary">
        <NavLink to="/app/today">Today</NavLink>
        <NavLink to="/app/calendar">Calendar</NavLink>
        <NavLink to="/app/add">Add</NavLink>
        <NavLink to="/app/collage">Collage</NavLink>
        <NavLink to="/app/collection">Collection</NavLink>
        <NavLink to="/app/settings">Settings</NavLink>
      </nav>
    </aside>
    <main className="content-frame">{children}</main>
    <nav className="bottom-nav" aria-label="Primary">
      <NavLink to="/app/today">Today</NavLink>
      <NavLink to="/app/calendar">Calendar</NavLink>
      <NavLink className="add-tab" to="/app/add">+</NavLink>
      <NavLink to="/app/collage">Collage</NavLink>
      <NavLink to="/app/collection">Dex</NavLink>
    </nav>
  </div>
);

const removeBackground = async (file: File) => {
  const tokenResponse = await fetch("/api/csrf-token");
  if (!tokenResponse.ok) throw new Error("Could not prepare a sticker request.");
  const { token } = (await tokenResponse.json()) as { token: string };
  const form = new FormData();
  form.append("image_file", file);
  const response = await fetch("/api/remove-background", {
    method: "POST",
    headers: { "x-csrf-token": token },
    body: form
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Background removal failed." }));
    throw new Error(payload.error || "Background removal failed.");
  }
  return response.blob();
};

const analyzeFood = async (file: File) => {
  const tokenResponse = await fetch("/api/csrf-token");
  if (!tokenResponse.ok) throw new Error("Could not prepare food recognition.");
  const { token } = (await tokenResponse.json()) as { token: string };
  const form = new FormData();
  form.append("image_file", file);
  const response = await fetch("/api/analyze-food", {
    method: "POST",
    headers: { "x-csrf-token": token },
    body: form
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Food recognition failed." }));
    throw new Error(payload.error || "Food recognition failed.");
  }
  return response.json() as Promise<FoodAnalysis>;
};

const createPixelSticker = async (blob: Blob) => {
  const tokenResponse = await fetch("/api/csrf-token");
  if (!tokenResponse.ok) throw new Error("Could not prepare pixel sticker generation.");
  const { token } = (await tokenResponse.json()) as { token: string };
  const form = new FormData();
  form.append("image_file", blob, "cutout.png");
  const response = await fetch("/api/pixel-sticker", {
    method: "POST",
    headers: { "x-csrf-token": token },
    body: form
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Pixel sticker generation failed." }));
    throw new Error(payload.error || "Pixel sticker generation failed.");
  }
  return response.blob();
};

const Header = ({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) => (
  <header className="screen-header">
    <div>
      <p>{eyebrow}</p>
      <h1>{title}</h1>
    </div>
    {action}
  </header>
);

function Landing() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="kicker">Pixel food diary</p>
          <h1>Munchi turns everyday bites into pixel diary treasures.</h1>
          <p>
            Photograph drinks, desserts, snacks, and meals. Munchi removes the background,
            turns each bite into a warm 16-bit pixel sticker, and saves it into your
            journal, calendar, collage studio, and Pixel Dex.
          </p>
          <div className="landing-actions">
            <Link className="primary-btn" to="/app/today">Open the app</Link>
            <Link className="secondary-btn" to="/app/add">Create pixel art</Link>
          </div>
        </div>
        <div className="phone-showcase" aria-label="Munchi mobile app preview">
          <div className="phone-notch" />
          <div className="screen mini-screen">
            <Header eyebrow="June 10 / Munchi" title="Today" />
            <section className="paper-panel sticker-board demo-board">
              <div className="section-heading">
                <div>
                  <p className="kicker">Today's Pixel Bites</p>
                  <h2>Collect tiny food moments</h2>
                </div>
                <span className="count-pill">3</span>
              </div>
              <div className="demo-stickers">
                <img className="demo-sticker demo-latte" src="/landing-demo-stickers/latte.png" alt="Iced latte pixel sticker" />
                <img className="demo-sticker demo-pizza" src="/landing-demo-stickers/pizza.png" alt="Margherita pizza pixel sticker" />
                <img className="demo-sticker demo-tiramisu" src="/landing-demo-stickers/tiramisu.png" alt="Tiramisu jar pixel sticker" />
              </div>
            </section>
            <section className="ai-flow-card">
              <span>Photo</span>
              <strong>Remove background</strong>
              <strong>Make pixel art</strong>
              <span>Save to Dex</span>
            </section>
          </div>
        </div>
      </section>
      <section className="landing-strip">
        <article><span>01</span><h2>Pixel Stickers</h2><p>Turn food photos into warm 16-bit item icons.</p></article>
        <article><span>02</span><h2>Calendar Records</h2><p>Save each bite by date and revisit your food memories.</p></article>
        <article><span>03</span><h2>Pixel Dex</h2><p>Collect every drink, snack, dessert, and meal in one cozy index.</p></article>
      </section>
    </main>
  );
}

function DailyPoster({ records, urls }: { records: FoodRecord[]; urls: Record<string, string> }) {
  const posterRecords = records.filter((record) => urls[record.stickerImageId]).slice(0, 3);
  const [hero, second, third] = posterRecords;
  const dateLabel = new Date().toLocaleDateString("en", { month: "short", day: "numeric" });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const exportPoster = async () => {
    if (!hero) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    await document.fonts.ready;

    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const warmGlow = ctx.createRadialGradient(360, 520, 80, 360, 520, 460);
    warmGlow.addColorStop(0, "rgba(255, 227, 145, .42)");
    warmGlow.addColorStop(1, "rgba(255, 227, 145, 0)");
    ctx.fillStyle = warmGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const mintGlow = ctx.createRadialGradient(850, 880, 80, 850, 880, 430);
    mintGlow.addColorStop(0, "rgba(220, 235, 210, .72)");
    mintGlow.addColorStop(1, "rgba(220, 235, 210, 0)");
    ctx.fillStyle = mintGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(202, 163, 178, .16)";
    ctx.lineWidth = 2;
    for (let x = 0; x <= canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = "#281722";
    ctx.font = `700 30px "Munchi Pixel", "Munchi Round", sans-serif`;
    ctx.fillText("TODAY'S TASTE NOTE", 64, 82);
    ctx.font = `700 82px "Munchi Pixel", "Munchi Round", sans-serif`;
    ctx.fillText("Little bites,", 64, 160);
    ctx.fillText("big mood.", 64, 236);

    ctx.save();
    ctx.translate(930, 110);
    ctx.fillStyle = "#281722";
    ctx.beginPath();
    ctx.arc(0, 0, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fffdf8";
    ctx.font = `700 34px "Munchi Pixel", "Munchi Round", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(dateLabel.toUpperCase(), 0, -4);
    ctx.fillText("MUNCHI", 0, 34);
    ctx.restore();

    await drawPosterSticker(ctx, "/poster-decor/bow.svg", 130, 330, 110, 9, 12);
    await drawPosterSticker(ctx, "/poster-decor/flower.svg", 800, 370, 110, -9, 12);
    await drawPosterSticker(ctx, "/poster-decor/cake.svg", 160, 930, 112, -4, 12);
    await drawPosterSticker(ctx, "/poster-decor/glowing-star.svg", 840, 930, 108, 8, 12);
    await drawPosterSticker(ctx, urls[hero.stickerImageId], 540, 665, 470, 5);
    if (second) await drawPosterSticker(ctx, urls[second.stickerImageId], 195, 535, 210, -10);
    if (third) await drawPosterSticker(ctx, urls[third.stickerImageId], 870, 650, 210, 11);
    drawPosterLabel(ctx, dailyPosterQuotes[0], 122, 780, "#efcbd8", 7);
    drawPosterLabel(ctx, dailyPosterQuotes[1], 750, 860, "#dcd3f0", -6);
    drawPosterLabel(ctx, dailyPosterQuotes[2], 390, 1012, "#ffe391", 3);

    ctx.save();
    ctx.translate(804, 1124);
    ctx.rotate((2 * Math.PI) / 180);
    roundedRect(ctx, 0, 0, 210, 56, 14);
    ctx.fillStyle = "rgba(255, 255, 255, .9)";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    roundedRect(ctx, 12, 9, 38, 38, 8);
    ctx.fillStyle = "#b76b82";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 25px "Munchi Pixel", "Munchi Round", sans-serif`;
    ctx.fillText("M", 22, 37);
    ctx.fillStyle = "#281722";
    ctx.font = `700 26px "Munchi Pixel", "Munchi Round", sans-serif`;
    ctx.fillText("Munchi", 62, 37);
    ctx.restore();

    ctx.strokeStyle = "rgba(40, 23, 34, .84)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(64, 1178);
    ctx.lineTo(1016, 1178);
    ctx.stroke();
    const stats = [
      [`${posterRecords.length} stickers`, "today's bites"],
      ["1 quote", "daily mood"],
      ["Share", "poster ready"]
    ];
    ctx.textAlign = "left";
    stats.forEach((item, index) => {
      const x = 64 + index * 328;
      ctx.fillStyle = "#281722";
      ctx.font = `700 31px "Munchi Pixel", "Munchi Round", sans-serif`;
      ctx.fillText(item[0], x, 1244);
      ctx.fillStyle = "#745d68";
      ctx.font = `700 24px "Munchi Round", sans-serif`;
      ctx.fillText(item[1], x, 1295);
    });

    const link = document.createElement("a");
    link.download = `munchi-daily-poster-${todayKey()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (!hero) return null;

  return (
    <div className={`daily-poster-card-wrap ${open ? "is-open" : ""}`}>
      <button className="card action-card daily-poster-entry" onClick={() => setOpen(true)}>
        <span className="meta">DAILY POSTER</span>
        <h2>Open today's poster</h2>
        <p>View today's sticker summary as a shareable poster.</p>
      </button>
      {open && (
        <div className="daily-poster-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div className="daily-poster-modal" role="dialog" aria-modal="true" aria-label="Daily poster preview" onClick={(event) => event.stopPropagation()}>
            <div className="daily-poster-modal-actions">
              <button className="secondary-btn daily-poster-download" onClick={exportPoster}>Download poster</button>
              <button className="icon-btn daily-poster-close" onClick={() => setOpen(false)} aria-label="Close poster">x</button>
            </div>
            <div className="daily-poster-preview">
              <div className="daily-poster-top">
                <div>
                  <p className="pixel">TODAY'S TASTE NOTE</p>
                  <h3>Little bites, big mood.</h3>
                </div>
                <div className="daily-poster-date pixel">{dateLabel}<br />Munchi</div>
              </div>
              <StickerImage className="daily-poster-hero" src={urls[hero.stickerImageId]} label={hero.name} style={{ ...hero.stickerStyle, rotation: 5, scale: 1, shadow: false }} />
              {second && <StickerImage className="daily-poster-small daily-poster-side-one" src={urls[second.stickerImageId]} label={second.name} style={{ ...second.stickerStyle, rotation: -10, scale: 1, shadow: false }} />}
              {third && <StickerImage className="daily-poster-small daily-poster-side-two" src={urls[third.stickerImageId]} label={third.name} style={{ ...third.stickerStyle, rotation: 11, scale: 1, shadow: false }} />}
              {posterDecor.map((decor) => <img key={decor.src} className={`daily-poster-decor ${decor.className}`} src={decor.src} alt={decor.alt} />)}
              <span className="daily-poster-quote quote-one pixel">{dailyPosterQuotes[0]}</span>
              <span className="daily-poster-quote quote-two pixel">{dailyPosterQuotes[1]}</span>
              <span className="daily-poster-quote quote-three pixel">{dailyPosterQuotes[2]}</span>
              <div className="daily-poster-brand">
                <span className="brand-mark">M</span>
                <strong>Munchi</strong>
              </div>
              <div className="daily-poster-bottom">
                <div><strong>{posterRecords.length} stickers</strong><span>today's bites</span></div>
                <div><strong>1 quote</strong><span>daily mood</span></div>
                <div><strong>Share</strong><span>poster ready</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Today({ records, urls }: { records: FoodRecord[]; urls: Record<string, string>; collages: Collage[] }) {
  const todaysRecords = records.filter((record) => isToday(record.timestamp));
  const featuredTodayRecord = todaysRecords[0];
  const sideTodayRecords = todaysRecords.slice(1, 6);
  return (
    <div className="screen today-screen">
      <Header eyebrow={`${new Date().toLocaleDateString("en", { month: "long", day: "numeric", weekday: "long" })} / Munchi`} title="Today" />
      {todaysRecords.length ? (
        <>
          <section className="paper-panel sticker-board pixel-journal-board">
            <div className="section-heading">
              <div>
                <p className="kicker">Today's Pixel Bites</p>
                <h2>Collect your tiny food moments</h2>
              </div>
              <span className="count-pill">{todaysRecords.length}</span>
            </div>
            {featuredTodayRecord ? (
              <div className="today-feature">
                <div className="today-main-sticker">
                  <StickerImage className="today-hero-sticker" src={urls[featuredTodayRecord.stickerImageId]} label={featuredTodayRecord.name} style={{ ...featuredTodayRecord.stickerStyle, rotation: -3, scale: 1, shadow: false }} />
                  <div>
                    <strong>{featuredTodayRecord.name}</strong>
                    <span>{featuredTodayRecord.category}</span>
                  </div>
                </div>
                {sideTodayRecords.length > 0 && (
                  <div className="today-sticker-queue" aria-label="More of today's pixel bites">
                    {sideTodayRecords.map((record) => (
                      <div className="today-queue-item" key={record.id}>
                        <StickerImage className="today-mini-sticker" src={urls[record.stickerImageId]} label={record.name} style={{ ...record.stickerStyle, rotation: 0, scale: 1, shadow: false }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="today-feature-empty">No pixel bites saved today.</div>
            )}
          </section>
          <section className="two-col today-actions-row">
            <DailyPoster records={todaysRecords} urls={urls} />
            <Link className="card action-card" to="/app/collage">
              <span className="meta">PIXEL BOARD</span>
              <h2>Create today's collage</h2>
              <p>Arrange your pixel bites into a shareable scrapbook page.</p>
            </Link>
          </section>
        </>
      ) : (
        <EmptyState
          title="No pixel bites yet today"
          body="Add a drink, dessert, snack, or meal to start today's pixel diary."
          action={<Link className="primary-btn" to="/app/add">Add a pixel bite</Link>}
        />
      )}
    </div>
  );
}

function AddCapture({ draft, setDraft, toast }: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>>; toast: (message: string) => void }) {
  const navigate = useNavigate();
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!draft.originalBlob) return;
    const url = URL.createObjectURL(draft.originalBlob);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [draft.originalBlob]);

  const pickFile = async (event: ChangeEvent<HTMLInputElement>, source: Source) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setDraft({ ...initialDraft, source, file, originalBlob: file });
    navigate("/app/add/preview");
    try {
      const [cutoutResult, analysisResult] = await Promise.allSettled([removeBackground(file), analyzeFood(file)]);
      if (cutoutResult.status === "rejected") {
        const message = cutoutResult.reason instanceof Error ? cutoutResult.reason.message : "Background removal failed.";
        setDraft((current) => current.file === file ? { ...current, prepError: message } : current);
        return;
      }
      const cutoutBlob = cutoutResult.value;
      const analysis = analysisResult.status === "fulfilled" ? analysisResult.value : undefined;
      setDraft((current) => current.file === file ? { ...current, cutoutBlob, analysis, prepError: undefined } : current);
      if (analysisResult.status === "rejected") toast("Cutout ready. Food naming needs setup.");
      else toast("Cutout ready for pixel art.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Background removal failed.";
      setDraft((current) => current.file === file ? { ...current, prepError: message } : current);
    }
  };

  return (
    <div className="screen">
      <Header eyebrow="Step 1 / Capture and cut out" title="Add a pixel bite" />
      <section className="upload-panel pixel-camera">
        <span className="pixel-corner top-left">CAPTURE</span>
        <span className="pixel-corner bottom-right">PX-01</span>
        <span className="scan-line" />
        {preview ? <img src={preview} alt="Selected food preview" /> : <div className="camera-placeholder">Snap your drink, dessert, or meal</div>}
      </section>
      <section className="capture-actions">
        <label className="secondary-btn">
          Upload from album
          <input type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif" onChange={(event) => pickFile(event, "upload")} />
        </label>
        <label className="primary-btn">
          Take photo
          <input type="file" accept="image/*" capture="environment" onChange={(event) => pickFile(event, "camera")} />
        </label>
      </section>
    </div>
  );
}

function StickerPreview({ draft, setDraft }: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>> }) {
  const navigate = useNavigate();
  const [originalUrl, setOriginalUrl] = useState("");
  const [stickerUrl, setStickerUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!draft.originalBlob) return;
    const original = URL.createObjectURL(draft.originalBlob);
    setOriginalUrl(original);
    return () => {
      URL.revokeObjectURL(original);
    };
  }, [draft.originalBlob]);

  const generatePixelSticker = async () => {
    if (!draft.cutoutBlob || creating) return;
    setCreating(true);
    setError("");
    try {
      const pixelBlob = await createPixelSticker(draft.cutoutBlob);
      const stickerBlob = await makeStickerBlob(pixelBlob, draft.style.border);
      setDraft((current) => current.cutoutBlob === draft.cutoutBlob ? { ...current, pixelBlob, stickerBlob } : current);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pixel sticker generation failed.");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (!draft.cutoutBlob || draft.pixelBlob || draft.stickerBlob) return;
    generatePixelSticker();
  }, [draft.cutoutBlob, draft.pixelBlob, draft.stickerBlob]);

  useEffect(() => {
    const source = draft.stickerBlob || draft.pixelBlob;
    if (!source) {
      setStickerUrl("");
      return;
    }
    const url = URL.createObjectURL(source);
    setStickerUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [draft.pixelBlob, draft.stickerBlob]);

  if (!draft.originalBlob) return <Navigate to="/app/add" replace />;

  return (
    <div className="screen">
      <Header eyebrow="Step 2 / Pixel Forge" title="Create pixel art" action={error && draft.cutoutBlob ? <button className="icon-btn" onClick={generatePixelSticker}>Retry</button> : undefined} />
      <section className="pixel-forge-layout">
        <aside className="forge-side">
          <div className="photo-tile forge-source"><span>Original</span>{originalUrl && <img src={originalUrl} alt="Original upload" />}</div>
          <div className={`pixel-forge ${!draft.prepError && !error && (!draft.cutoutBlob || creating) ? "is-active" : ""} ${draft.stickerBlob ? "is-complete" : ""} ${draft.prepError || error ? "is-error" : ""}`}>
            <span className="forge-title">Pixel Forge</span>
            <ol className="forge-steps" aria-label="Pixel sticker progress">
              <li className={draft.cutoutBlob ? "is-complete" : draft.prepError ? "" : "is-active"}>Prepare cutout</li>
              <li className={creating ? "is-active" : draft.stickerBlob ? "is-complete" : ""}>Pixel magic in progress</li>
              <li className={draft.stickerBlob ? "is-complete" : ""}>White border applied</li>
            </ol>
          </div>
        </aside>
        <div className={`photo-tile paper pixel-preview forge-result ${!draft.prepError && !error && (!draft.cutoutBlob || creating) ? "is-active" : ""} ${draft.stickerBlob ? "is-complete" : ""} ${draft.prepError || error ? "is-error" : ""}`}>
          <span>Pixel sticker</span>
          {stickerUrl ? (
            <StickerImage src={stickerUrl} label="Generated pixel sticker" style={draft.style} />
          ) : (
            <div className="forge-empty-state">
              <div className="forge-pixels" aria-hidden="true">
                {Array.from({ length: 16 }).map((_, index) => <i key={index} />)}
              </div>
              <strong>{draft.prepError ? "Cutout needs attention" : !draft.cutoutBlob ? "Preparing your food cutout..." : creating ? "Creating your pixel sticker..." : "Pixel art will appear here"}</strong>
              <p>{draft.prepError ? "Try another photo so Munchi can isolate the food cleanly." : !draft.cutoutBlob ? "Munchi is removing the background before pixel art starts." : "Keep this page open while Munchi builds the 16-bit version."}</p>
            </div>
          )}
        </div>
      </section>
      {(draft.prepError || error) && (
        <section className="error-box pixel-error">
          <h2>{draft.prepError ? "Pixel cutout needs attention" : "Pixel magic failed"}</h2>
          <p>{draft.prepError || error}</p>
          {draft.prepError ? <Link className="secondary-btn" to="/app/add">Try another photo</Link> : <button className="secondary-btn" onClick={generatePixelSticker}>Retry pixel sticker</button>}
        </section>
      )}
      <button className="primary-btn full forge-continue" disabled={!draft.stickerBlob || creating || !draft.cutoutBlob} onClick={() => navigate("/app/add/details")}>Looks cute, continue</button>
    </div>
  );
}

function RecordDetails({
  draft,
  settings,
  onSave
}: {
  draft: Draft;
  settings: Settings;
  onSave: (asset: StickerAsset, record: FoodRecord) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [name, setName] = useState(draft.analysis?.name || "Milk tea");
  const [category, setCategory] = useState(draft.analysis?.category || settings.customTags[0] || "Drink");
  const [rating, setRating] = useState<Rating>("Good");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!draft.stickerBlob) return;
    const url = URL.createObjectURL(draft.stickerBlob);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [draft.stickerBlob]);

  if (!draft.originalBlob || !draft.stickerBlob) return <Navigate to="/app/add/preview" replace />;

  const tags = Array.from(new Set([...categories, ...settings.customTags].filter(Boolean)));

  const save = async () => {
    if (saving) return;
    if (!draft.stickerBlob) {
      setSaveError("Create a pixel sticker before saving.");
      return;
    }
    setSaveError("");
    setSaving(true);
    try {
      const id = uid();
      const stickerBlob = draft.stickerBlob;
      const asset: StickerAsset = {
        id,
        originalBlob: await shrinkImageBlob(draft.originalBlob!),
        cutoutBlob: stickerBlob,
        createdAt: new Date().toISOString()
      };
      const record: FoodRecord = {
        id: uid(),
        originalImageId: id,
        stickerImageId: id,
        name: name.trim().slice(0, 80) || "Untitled bite",
        category,
        customTags: [],
        timestamp: new Date().toISOString(),
        rating,
        source: draft.source,
        stickerStyle: draft.style
      };
      await onSave(asset, record);
      navigate("/app/add/saved");
    } catch (error) {
      const detail = error instanceof Error && error.message ? ` ${error.message}` : "";
      setSaveError(`The browser could not save this pixel sticker.${detail} Open it in Chrome or Safari, and avoid private browsing.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="screen record-screen">
      <Header eyebrow="Step 3 / Record Details" title="Record this pixel bite" />
      <section className="card form-card record-form">
        <div className="record-preview"><StickerImage src={preview} label={name} style={draft.style} /></div>
        {draft.analysis && <p className="status">AI recognized this as {draft.analysis.name} with {draft.analysis.confidence} confidence.</p>}
        <label>Name<input value={name} maxLength={80} onChange={(event) => setName(event.target.value)} /></label>
        <div>
          <p className="field-label">Category</p>
          <div className="chip-row">{tags.map((tag) => <button key={tag} className={`chip ${category === tag ? "is-active" : ""}`} onClick={() => setCategory(tag)}>{tag}</button>)}</div>
        </div>
        <div>
          <p className="field-label">Rating</p>
          <div className="rating-row rating-sticker-row">
            {ratingOptions.map((item) => (
              <button key={item.value} className={`rating rating-sticker ${rating === item.value ? "is-active" : ""}`} onClick={() => setRating(item.value)}>
                <img src={item.image} alt="" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
      {saveError && <section className="error-box"><p>{saveError}</p></section>}
      <button className="primary-btn full" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save to today"}</button>
    </div>
  );
}

function Saved() {
  return (
    <div className="screen">
      <Header eyebrow="Step 4 / Saved" title="Added to today's pixel page" />
      <section className="paper-panel saved-drop pixel-page-drop">
        <div className="journal-page-target">
          <span className="date-tape">TODAY</span>
          <div className="sticker-photo mini-pop acquired-sticker"><span>PX</span></div>
        </div>
        <h2>Added to today's pixel page</h2>
      </section>
      <div className="stack-actions">
        <Link className="primary-btn" to="/app/today">View Today</Link>
        <Link className="secondary-btn" to="/app/collection">Open Pixel Dex</Link>
      </div>
    </div>
  );
}

function CalendarView({ records, urls }: { records: FoodRecord[]; urls: Record<string, string> }) {
  const [filter, setFilter] = useState("All");
  const month = new Date();
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const firstOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const filters = ["All", ...Array.from(new Set(records.map((record) => record.category)))];
  const visibleRecords = filter === "All" ? records : records.filter((record) => record.category === filter);

  return (
    <div className="screen">
      <Header eyebrow={month.toLocaleDateString("en", { month: "long", year: "numeric" })} title="Calendar" />
      <div className="chip-row">{filters.map((item) => <button key={item} className={`chip ${filter === item ? "is-active" : ""}`} onClick={() => setFilter(item)}>{item}</button>)}</div>
      <section className="paper-panel calendar-panel">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span className="weekday" key={day}>{day}</span>)}
        {Array.from({ length: firstOffset }).map((_, index) => <span key={`blank-${index}`} />)}
        {Array.from({ length: days }).map((_, index) => {
          const day = index + 1;
          const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayRecords = visibleRecords.filter((record) => dateKey(record.timestamp) === key);
          return (
            <Link className={`day-cell ${key === todayKey() ? "is-today" : ""}`} key={key} to={`/app/calendar/${key}`}>
              <strong>{day}</strong>
              <div>{dayRecords.slice(0, 3).map((record) => <img key={record.id} src={urls[record.stickerImageId]} alt="" />)}</div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function DayDetail({ records, urls }: { records: FoodRecord[]; urls: Record<string, string> }) {
  const { date = todayKey() } = useParams();
  const dayRecords = records.filter((record) => dateKey(record.timestamp) === date);
  return (
    <div className="screen">
      <Header eyebrow={formatDay(`${date}T12:00:00`)} title="Day Detail" action={<Link className="secondary-btn" to="/app/collage">Make pixel board</Link>} />
      {dayRecords.length ? (
        <section className="record-list">
          {dayRecords.map((record) => {
            const recordRating = ratingOptionFor(record.rating);
            return (
              <article className="record-row" key={record.id}>
                <StickerImage src={urls[record.stickerImageId]} label={record.name} style={{ ...record.stickerStyle, rotation: 0, scale: 1, shadow: false }} />
                <div>
                  <h2>{record.name}</h2>
                  <p className="record-meta">
                    <span>{record.category}</span>
                    <span>{new Date(record.timestamp).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span>
                    <img className="record-rating-icon" src={recordRating.image} alt={recordRating.label} />
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState title="No records on this day" body="Pick another day or add a pixel bite to create a memory." action={<Link className="primary-btn" to="/app/add">Add a pixel bite</Link>} />
      )}
    </div>
  );
}

function CollageView({
  records,
  urls,
  collages,
  saveCollage
}: {
  records: FoodRecord[];
  urls: Record<string, string>;
  collages: Collage[];
  saveCollage: (collage: Collage) => Promise<void>;
}) {
  const [items, setItems] = useState<CollageItem[]>([]);
  const [decorItems, setDecorItems] = useState<CollageDecorItem[]>([]);
  const [textItems, setTextItems] = useState<CollageTextItem[]>([]);
  const [selected, setSelected] = useState("");
  const [background, setBackground] = useState<CollageBackground>(backgroundOptions[0]);
  const [exportPreset, setExportPreset] = useState<CollageExportPreset>(defaultExportPreset);
  const [template, setTemplate] = useState<(typeof layoutTemplates)[number]>("Scatter");
  const [activeTool, setActiveTool] = useState<(typeof editorTabs)[number]>("Layout");
  const [activeCollageId, setActiveCollageId] = useState("");
  const [showDate, setShowDate] = useState(true);
  const [transparentExport, setTransparentExport] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const zIndexOf = (item: { zIndex?: number }) => typeof item.zIndex === "number" && Number.isFinite(item.zIndex) ? Math.max(1, item.zIndex) : 1;
  const allZIndexes = () => [...items.map(zIndexOf), ...decorItems.map(zIndexOf), ...textItems.map(zIndexOf)];
  const maxZ = () => Math.max(1, ...allZIndexes());

  const addRecord = (record: FoodRecord) => {
    const item: CollageItem = {
      id: uid(),
      stickerImageId: record.stickerImageId,
      x: 28 + (items.length * 34) % 190,
      y: 38 + (items.length * 52) % 220,
      scale: 1,
      rotation: [-8, 5, -3, 9][items.length % 4],
      zIndex: maxZ() + 1
    };
    setItems([...items, item]);
    setSelected(item.id);
  };

  const addDecor = (decor: { category: string; label: string; tone: string }) => {
    const item: CollageDecorItem = {
      id: uid(),
      category: decor.category,
      label: decor.label,
      tone: decor.tone,
      x: 36 + (decorItems.length * 42) % 210,
      y: 86 + (decorItems.length * 38) % 240,
      scale: 1,
      rotation: [-7, 4, -3, 8][decorItems.length % 4],
      zIndex: maxZ() + 1
    };
    setDecorItems([...decorItems, item]);
    setSelected(item.id);
  };

  const addText = (preset: (typeof textPresets)[number]) => {
    const item: CollageTextItem = {
      id: uid(),
      text: preset.text,
      x: 34 + (textItems.length * 22) % 150,
      y: 74 + (textItems.length * 54) % 230,
      fontSize: preset.fontSize,
      color: preset.color,
      backgroundStyle: preset.backgroundStyle,
      style: preset.style,
      rotation: preset.rotation,
      zIndex: maxZ() + 1
    };
    setTextItems([...textItems, item]);
    setSelected(item.id);
  };

  const updateSelected = (patch: Partial<CollageItem>) => setItems(items.map((item) => item.id === selected ? { ...item, ...patch } : item));
  const updateSelectedDecor = (patch: Partial<CollageDecorItem>) => setDecorItems(decorItems.map((item) => item.id === selected ? { ...item, ...patch } : item));
  const updateSelectedText = (patch: Partial<CollageTextItem>) => setTextItems(textItems.map((item) => item.id === selected ? { ...item, ...patch } : item));

  const beginDrag = <T extends HTMLElement>(event: PointerEvent<T>, onMove: (dx: number, dy: number) => void) => {
    const target = event.currentTarget;
    event.preventDefault();
    target.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startY = event.clientY;
    let ended = false;
    const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
      onMove(moveEvent.clientX - startX, moveEvent.clientY - startY);
    };
    const endDrag = () => {
      if (ended) return;
      ended = true;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      window.removeEventListener("blur", endDrag);
      if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    window.addEventListener("blur", endDrag);
  };

  const drag = (event: PointerEvent<HTMLDivElement>, id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    setSelected(id);
    beginDrag(event, (dx, dy) => {
      setItems((current) => current.map((entry) => entry.id === id ? { ...entry, x: Math.max(0, item.x + dx), y: Math.max(0, item.y + dy) } : entry));
    });
  };

  const dragDecor = (event: PointerEvent<HTMLDivElement>, id: string) => {
    const item = decorItems.find((entry) => entry.id === id);
    if (!item) return;
    setSelected(id);
    beginDrag(event, (dx, dy) => {
      setDecorItems((current) => current.map((entry) => entry.id === id ? { ...entry, x: Math.max(0, item.x + dx), y: Math.max(0, item.y + dy) } : entry));
    });
  };

  const dragText = (event: PointerEvent<HTMLSpanElement>, id: string) => {
    const item = textItems.find((entry) => entry.id === id);
    if (!item) return;
    setSelected(id);
    beginDrag(event, (dx, dy) => {
      setTextItems((current) => current.map((entry) => entry.id === id ? { ...entry, x: Math.max(0, item.x + dx), y: Math.max(0, item.y + dy) } : entry));
    });
  };

  const transformItem = (event: PointerEvent<HTMLButtonElement>, id: string, kind: "sticker" | "decor" | "text", mode: "scale" | "rotate") => {
    event.preventDefault();
    event.stopPropagation();
    const host = event.currentTarget.closest(".collage-item, .decor-sticker, .collage-text-item") as HTMLElement | null;
    if (!host) return;
    setSelected(id);
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = host.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startItem = kind === "sticker" ? items.find((item) => item.id === id) : kind === "decor" ? decorItems.find((item) => item.id === id) : textItems.find((item) => item.id === id);
    if (!startItem) return;
    const startDistance = Math.max(12, Math.hypot(event.clientX - centerX, event.clientY - centerY));
    const startAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    const apply = (patch: Partial<CollageItem & CollageDecorItem & CollageTextItem>) => {
      if (kind === "sticker") setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
      else if (kind === "decor") setDecorItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
      else setTextItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
    };
    const onMove = (moveEvent: globalThis.PointerEvent) => {
      if (mode === "scale") {
        const distance = Math.max(12, Math.hypot(moveEvent.clientX - centerX, moveEvent.clientY - centerY));
        if (kind === "text") apply({ fontSize: clamp((startItem as CollageTextItem).fontSize * (distance / startDistance), 11, 54) });
        else apply({ scale: clamp((startItem as CollageItem | CollageDecorItem).scale * (distance / startDistance), 0.45, 2.4) });
        return;
      }
      const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      apply({ rotation: Math.round(startItem.rotation + ((angle - startAngle) * 180) / Math.PI) });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const bringForward = () => {
    const next = maxZ() + 1;
    if (selectedItem) updateSelected({ zIndex: next });
    if (selectedDecor) updateSelectedDecor({ zIndex: next });
    if (selectedText) updateSelectedText({ zIndex: next });
  };

  const sendBackward = () => {
    if (!selected) return;
    setItems(items.map((item) => item.id === selected ? { ...item, zIndex: 1 } : { ...item, zIndex: zIndexOf(item) + 1 }));
    setDecorItems(decorItems.map((item) => item.id === selected ? { ...item, zIndex: 1 } : { ...item, zIndex: zIndexOf(item) + 1 }));
    setTextItems(textItems.map((item) => item.id === selected ? { ...item, zIndex: 1 } : { ...item, zIndex: zIndexOf(item) + 1 }));
  };

  const deleteSelected = () => {
    setItems(items.filter((item) => item.id !== selected));
    setDecorItems(decorItems.filter((item) => item.id !== selected));
    setTextItems(textItems.filter((item) => item.id !== selected));
    setSelected("");
  };

  const duplicateSelected = () => {
    const nextId = uid();
    const nextZ = maxZ() + 1;
    if (selectedItem) setItems([...items, { ...selectedItem, id: nextId, x: selectedItem.x + 18, y: selectedItem.y + 18, zIndex: nextZ }]);
    if (selectedDecor) setDecorItems([...decorItems, { ...selectedDecor, id: nextId, x: selectedDecor.x + 18, y: selectedDecor.y + 18, zIndex: nextZ }]);
    if (selectedText) setTextItems([...textItems, { ...selectedText, id: nextId, x: selectedText.x + 18, y: selectedText.y + 18, zIndex: nextZ }]);
    setSelected(nextId);
  };

  const exportPng = async () => {
    const host = canvasRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = exportPreset.width;
    canvas.height = exportPreset.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = host?.getBoundingClientRect();
    const scaleX = canvas.width / (rect?.width || 360);
    const scaleY = canvas.height / (rect?.height || 360);
    const scale = Math.min(scaleX, scaleY);
    await document.fonts.ready;
    if (!transparentExport) paintCanvasBackground(ctx, canvas.width, canvas.height, background);
    const layers = [
      ...items.map((item) => ({ kind: "sticker" as const, item, zIndex: zIndexOf(item) })),
      ...decorItems.map((item) => ({ kind: "decor" as const, item, zIndex: zIndexOf(item) })),
      ...textItems.map((item) => ({ kind: "text" as const, item, zIndex: zIndexOf(item) }))
    ].sort((a, b) => a.zIndex - b.zIndex);
    for (const layer of layers) {
      if (layer.kind === "sticker") {
        const item = layer.item;
        if (!urls[item.stickerImageId]) continue;
        const image = new Image();
        image.src = urls[item.stickerImageId];
        await image.decode().catch(() => undefined);
        const stickerEl = host?.querySelector(`[data-collage-id="${item.id}"] .sticker-photo`) as HTMLElement | null;
        const baseWidth = stickerEl?.offsetWidth || 128;
        const baseHeight = stickerEl?.offsetHeight || 128;
        const imageRatio = image.naturalWidth / image.naturalHeight || 1;
        const boxRatio = baseWidth / baseHeight || 1;
        const fittedWidth = imageRatio > boxRatio ? baseWidth : baseHeight * imageRatio;
        const fittedHeight = imageRatio > boxRatio ? baseWidth / imageRatio : baseHeight;
        const drawWidth = fittedWidth * item.scale * scaleX;
        const drawHeight = fittedHeight * item.scale * scaleY;
        ctx.save();
        ctx.translate((item.x + baseWidth / 2) * scaleX, (item.y + baseHeight / 2) * scaleY);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.shadowColor = "rgba(67, 45, 55, .18)";
        ctx.shadowBlur = 12 * scale;
        ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();
        continue;
      }
      if (layer.kind === "decor") {
        const item = layer.item;
        const fontSize = 18 * scale * item.scale;
        ctx.font = `700 ${fontSize}px "Munchi Pixel", "Munchi Round", sans-serif`;
        const paddingX = 14 * scale * item.scale;
        const paddingY = 8 * scale * item.scale;
        const textWidth = ctx.measureText(item.label).width;
        ctx.save();
        ctx.translate(item.x * scaleX, item.y * scaleY);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.fillStyle = decorToneColor(item.tone);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 5 * scale;
        ctx.lineJoin = "round";
        const width = textWidth + paddingX * 2;
        const height = fontSize + paddingY * 2;
        ctx.strokeRect(0, -height * .72, width, height);
        ctx.fillRect(0, -height * .72, width, height);
        ctx.fillStyle = "#4c2e39";
        ctx.fillText(item.label, paddingX, 0);
        ctx.restore();
        continue;
      }
      const item = layer.item;
      const fontSize = item.fontSize * scale;
      ctx.save();
      ctx.translate(item.x * scaleX, item.y * scaleY);
      ctx.rotate((item.rotation * Math.PI) / 180);
      ctx.font = `700 ${fontSize}px "Munchi Pixel", "Munchi Round", sans-serif`;
      const text = item.text.slice(0, 90);
      const width = ctx.measureText(text).width;
      if (item.backgroundStyle !== "none") {
        const padX = 10 * scale;
        const padY = 6 * scale;
        ctx.fillStyle = item.backgroundStyle === "stamp" ? "rgba(255, 255, 255, .74)" : item.backgroundStyle === "label" ? "rgba(255, 255, 255, .92)" : "rgba(246, 212, 221, .82)";
        ctx.strokeStyle = item.backgroundStyle === "stamp" ? "#b96f82" : "rgba(234, 219, 200, .9)";
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        ctx.fillRect(-padX, -fontSize - padY, width + padX * 2, fontSize + padY * 2);
        ctx.strokeRect(-padX, -fontSize - padY, width + padX * 2, fontSize + padY * 2);
      }
      ctx.fillStyle = item.color;
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
    if (showDate) {
      ctx.fillStyle = background.type === "dark" ? "#fff7df" : "#4c2e39";
      ctx.font = `700 ${18 * scale}px "Munchi Pixel", "Munchi Round", sans-serif`;
      ctx.fillText(new Date().toLocaleDateString("en", { month: "short", day: "numeric" }), 18 * scaleX, 34 * scaleY);
    }
    const link = document.createElement("a");
    link.download = `munchi-${exportPreset.id.replace(":", "x")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const selectedItem = items.find((item) => item.id === selected);
  const selectedDecor = decorItems.find((item) => item.id === selected);
  const selectedText = textItems.find((item) => item.id === selected);
  const loadCollage = (collage: Collage) => {
    const restoredTextItems = normalizeTextItems(collage).map((item) => ({ ...item, id: item.id === "legacy-caption" ? uid() : item.id }));
    setItems(collage.items);
    setDecorItems(collage.decorItems || []);
    setTextItems(restoredTextItems);
    setBackground(normalizeBackground(collage.background));
    setExportPreset(collage.exportPreset || presetForRatio(collage.aspectRatio));
    setShowDate(collage.showDate);
    setActiveCollageId(collage.id);
    setSelected(collage.items[0]?.id || collage.decorItems?.[0]?.id || restoredTextItems[0]?.id || "");
    setActiveTool("Layout");
  };

  const saveCurrentCollage = async () => {
    const now = new Date().toISOString();
    const id = activeCollageId || uid();
    const title = `Munchi ${exportPreset.id} collage`;
    await saveCollage({
      id,
      title,
      aspectRatio: exportPreset.id,
      background,
      items,
      decorItems,
      textItems,
      exportPreset,
      text: textItems[0]?.text || "",
      captionX: textItems[0]?.x,
      captionY: textItems[0]?.y,
      showDate,
      createdAt: collages.find((collage) => collage.id === id)?.createdAt || now,
      updatedAt: now
    });
    setActiveCollageId(id);
  };

  const applyTemplate = (nextTemplate: (typeof layoutTemplates)[number]) => {
    setTemplate(nextTemplate);
    if (nextTemplate === "Grid") {
      setItems(items.map((item, index) => ({ ...item, x: 34 + (index % 2) * 150, y: 58 + Math.floor(index / 2) * 136, rotation: 0, scale: .92 })));
    }
    if (nextTemplate === "Scatter") {
      setItems(items.map((item, index) => ({ ...item, x: 24 + (index * 47) % 240, y: 46 + (index * 73) % 290, rotation: [-10, 7, -4, 9][index % 4], scale: 1 })));
    }
    if (nextTemplate === "Journal") {
      setTextItems(textItems.length ? textItems : [{
        id: uid(),
        text: "tiny food notes",
        x: 28,
        y: 330,
        fontSize: 17,
        color: "#4c3440",
        backgroundStyle: "soft",
        style: "note",
        rotation: -2,
        zIndex: maxZ() + 1
      }]);
    }
  };

  return (
    <div className="screen collage-screen">
      <Header eyebrow={`${exportPreset.width} x ${exportPreset.height} pixel board export`} title="Collage Studio" />
      <section className="collage-editor-shell">
        <div className="collage-stage">
          <section ref={canvasRef} className="collage-canvas" data-ratio={exportPreset.id} style={collageBackgroundStyle(background)}>
            {showDate && <span className="date-tape">{new Date().toLocaleDateString("en", { month: "short", day: "numeric" })}</span>}
            {items.map((item) => (
              <div
                className={`collage-item ${selected === item.id ? "selected" : ""}`}
                data-collage-id={item.id}
                key={item.id}
                onPointerDown={(event) => drag(event, item.id)}
                style={{ left: item.x, top: item.y, zIndex: zIndexOf(item), transform: `rotate(${item.rotation}deg) scale(${item.scale})` }}
              >
                <StickerImage src={urls[item.stickerImageId]} label="Collage sticker" />
                {selected === item.id && (
                  <span className="item-handles">
                    <button className="transform-handle rotate" title="Drag to rotate" onPointerDown={(event) => transformItem(event, item.id, "sticker", "rotate")}>R</button>
                    <button className="transform-handle scale" title="Drag to resize" onPointerDown={(event) => transformItem(event, item.id, "sticker", "scale")}>+</button>
                  </span>
                )}
              </div>
            ))}
            {decorItems.map((item) => (
              <div
                className={`decor-sticker ${item.tone} ${selected === item.id ? "selected" : ""}`}
                key={item.id}
                onPointerDown={(event) => dragDecor(event, item.id)}
                style={{ left: item.x, top: item.y, zIndex: zIndexOf(item), transform: `rotate(${item.rotation}deg) scale(${item.scale})` }}
              >
                {item.label}
                {selected === item.id && (
                  <span className="item-handles">
                    <button className="transform-handle rotate" title="Drag to rotate" onPointerDown={(event) => transformItem(event, item.id, "decor", "rotate")}>R</button>
                    <button className="transform-handle scale" title="Drag to resize" onPointerDown={(event) => transformItem(event, item.id, "decor", "scale")}>+</button>
                  </span>
                )}
              </div>
            ))}
            {textItems.map((item) => (
              <span
                className={`collage-text-item ${item.style} ${item.backgroundStyle} ${selected === item.id ? "selected" : ""}`}
                key={item.id}
                onPointerDown={(event) => dragText(event, item.id)}
                style={{ left: item.x, top: item.y, zIndex: zIndexOf(item), color: item.color, fontSize: item.fontSize, transform: `rotate(${item.rotation}deg)` }}
              >
                {item.text}
                {selected === item.id && (
                  <span className="item-handles">
                    <button className="transform-handle rotate" title="Drag to rotate" onPointerDown={(event) => transformItem(event, item.id, "text", "rotate")}>R</button>
                    <button className="transform-handle scale" title="Drag to resize" onPointerDown={(event) => transformItem(event, item.id, "text", "scale")}>+</button>
                  </span>
                )}
              </span>
            ))}
          </section>
          {(selectedItem || selectedDecor || selectedText) && (
            <div className="selected-actions">
              <button className="chip" onClick={bringForward}>Top</button>
              <button className="chip" onClick={sendBackward}>Back</button>
              <button className="chip" onClick={duplicateSelected}>Copy</button>
              <button className="chip danger" onClick={deleteSelected}>Delete</button>
            </div>
          )}
        </div>
        <section className="editor-panel">
          <nav className="editor-tabs" aria-label="Collage tools">
            {editorTabs.map((tab) => <button key={tab} className={activeTool === tab ? "is-active" : ""} onClick={() => setActiveTool(tab)}>{tab}</button>)}
          </nav>

          {activeTool === "Layout" && (
            <div className="tool-panel">
              <p className="field-label">Export size</p>
              <div className="preset-grid">{exportPresets.map((preset) => (
                <button key={preset.id} className={`preset-card ${exportPreset.id === preset.id ? "is-active" : ""}`} onClick={() => setExportPreset(preset)}>
                  <strong>{preset.id}</strong>
                  <span>{preset.label}</span>
                </button>
              ))}</div>
              <p className="field-label">Layout</p>
              <div className="chip-row">{layoutTemplates.map((item) => <button key={item} className={`chip ${template === item ? "is-active" : ""}`} onClick={() => applyTemplate(item)}>{item}</button>)}</div>
              <label className="inline-check"><input type="checkbox" checked={showDate} onChange={(event) => setShowDate(event.target.checked)} /> Add date stamp</label>
            </div>
          )}

          {activeTool === "Background" && (
            <div className="tool-panel">
              <p className="field-label">Background style</p>
              <div className="background-grid">{backgroundOptions.map((item) => (
                <button key={item.label} className={background.label === item.label && background.type === item.type ? "is-active" : ""} onClick={() => setBackground(item)}>
                  <span style={collageBackgroundStyle(item)} />
                  {item.label}
                </button>
              ))}</div>
              <p className="field-label">Munchi colors</p>
              <div className="swatch-row">{munchiPalette.map((item) => (
                <button key={item.label} className={background.color === item.color ? "is-active" : ""} onClick={() => setBackground({ ...background, color: item.color, label: background.type === "solid" ? item.label : background.label })} title={item.label} style={{ background: item.color }} />
              ))}</div>
            </div>
          )}

          {activeTool === "Stickers" && (
            <div className="tool-panel">
              <p className="field-label">Pixel stickers</p>
              <section className="sticker-tray">
                {records.length ? records.map((record) => <button key={record.id} title={record.name} aria-label={`Add ${record.name}`} onClick={() => addRecord(record)}><StickerImage src={urls[record.stickerImageId]} label={record.name} style={{ ...record.stickerStyle, rotation: 0, scale: 1, shadow: false }} /></button>) : <p>Add a pixel bite first, then your stickers will appear here.</p>}
              </section>
              <p className="field-label">Decor stickers</p>
              <div className="decor-tray merged-decor-tray">{decorStickers.map((item) => <button key={`${item.category}-${item.label}`} className={`decor-sticker ${item.tone}`} onClick={() => addDecor(item)}>{item.label}</button>)}</div>
            </div>
          )}

          {activeTool === "Text" && (
            <div className="tool-panel">
              <p className="field-label">Text styles</p>
              <div className="text-preset-grid">{textPresets.map((preset) => <button key={preset.label} className={`collage-text-item ${preset.style} ${preset.backgroundStyle}`} onClick={() => addText(preset)}>{preset.label}</button>)}</div>
              {selectedText ? (
                <>
                  <label>Selected text<textarea value={selectedText.text} maxLength={90} onChange={(event) => updateSelectedText({ text: event.target.value })} /></label>
                  <div className="two-col">
                    <label>Size<input type="number" min="11" max="54" value={selectedText.fontSize} onChange={(event) => updateSelectedText({ fontSize: Number(event.target.value) })} /></label>
                    <label>Color<input type="color" value={selectedText.color} onChange={(event) => updateSelectedText({ color: event.target.value })} /></label>
                  </div>
                  <div className="chip-row">
                    {(["none", "soft", "label", "stamp"] as const).map((item) => <button key={item} className={`chip ${selectedText.backgroundStyle === item ? "is-active" : ""}`} onClick={() => updateSelectedText({ backgroundStyle: item })}>{item}</button>)}
                  </div>
                </>
              ) : (
                <p className="status">Add a text style, then tap the text on the canvas to edit it.</p>
              )}
            </div>
          )}

          {activeTool === "Export" && (
            <div className="tool-panel">
              <div className="export-summary">
                <strong>{exportPreset.width} x {exportPreset.height}</strong>
                <span>{transparentExport ? "Transparent PNG" : `PNG for ${exportPreset.label}`}</span>
              </div>
              <label className="inline-check"><input type="checkbox" checked={transparentExport} onChange={(event) => setTransparentExport(event.target.checked)} /> Transparent background</label>
              <div className="two-col">
                <button className="secondary-btn" onClick={exportPng}>Export PNG</button>
                <button className="primary-btn" onClick={saveCurrentCollage}>Save collage</button>
              </div>
              <section className="collage-history">
                <div className="section-heading">
                  <div>
                    <p className="kicker">Saved Collages</p>
                    <h2>Your pixel boards</h2>
                  </div>
                  <span className="count-pill">{collages.length}</span>
                </div>
                {collages.length ? (
                  <div className="collage-list">
                    {collages.map((collage) => {
                      const preset = collage.exportPreset || presetForRatio(collage.aspectRatio);
                      return (
                        <button key={collage.id} onClick={() => loadCollage(collage)}>
                          <strong>{collage.title}</strong>
                          <span>{preset.id} / {collage.items.length + (collage.decorItems?.length || 0) + normalizeTextItems(collage).length} items / {new Date(collage.updatedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="status">Saved collage layouts will appear here after you tap Save collage.</p>
                )}
              </section>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

function Collection({ records, urls }: { records: FoodRecord[]; urls: Record<string, string> }) {
  const [filter, setFilter] = useState("All");
  const todaysRecords = records.filter((record) => isToday(record.timestamp));
  const categories = Array.from(new Set(records.map((record) => record.category))).filter(Boolean);
  const visibleRecords = filter === "All" ? records : records.filter((record) => record.category === filter);
  const mostCollected = categories
    .map((category) => ({ category, count: records.filter((record) => record.category === category).length }))
    .sort((a, b) => b.count - a.count)[0];
  const days = Array.from(new Set(records.map((record) => dateKey(record.timestamp)))).sort((a, b) => b.localeCompare(a));
  let streak = 0;
  const cursor = new Date();
  while (days.includes(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return (
    <div className="screen">
      <Header eyebrow="Your cozy item index" title="Collection" />
      <section className="paper-panel pixel-dex-hero pixel-dex-book">
        <div className="section-heading">
          <div>
            <p className="kicker">Pixel Dex</p>
            <h2>{records.length ? `${records.length} tiny food treasures` : "Start your Pixel Dex"}</h2>
          </div>
          <span className="count-pill">{todaysRecords.length} today</span>
        </div>
        {records.length ? (
          <div className="pixel-dex-grid">
            {visibleRecords.map((record) => (
              <article className="pixel-dex-item" key={record.id}>
                <span className="item-slot-badge">ITEM</span>
                <StickerImage className="dex-sticker" src={urls[record.stickerImageId]} label={record.name} style={{ ...record.stickerStyle, rotation: 0, scale: 1, shadow: false }} />
                <strong>{record.name}</strong>
                <span>{record.category}</span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No pixel bites yet" body="Add your first food photo and Munchi will turn it into a tiny pixel sticker." action={<Link className="primary-btn" to="/app/add">Create first pixel bite</Link>} />
        )}
      </section>
      <div className="chip-row">{["All", ...categories].map((item) => <button key={item} className={`chip ${filter === item ? "is-active" : ""}`} onClick={() => setFilter(item)}>{item}</button>)}</div>
      <section className="two-col pixel-stat-grid">
        <div className="card stat-card"><span className="meta">TODAY'S FINDS</span><h2>{todaysRecords.length}</h2><p>New pixel bites today</p></div>
        <div className="card stat-card"><span className="meta">TOP SHELF</span><h2>{mostCollected?.category || "None yet"}</h2><p>{mostCollected?.count || 0} collected</p></div>
        <div className="card stat-card"><span className="meta">STREAK</span><h2>{streak}</h2><p>Days with a pixel bite</p></div>
        <div className="card stat-card"><span className="meta">TOTAL ITEMS</span><h2>{records.length}</h2><p>Saved in your Pixel Dex</p></div>
      </section>
    </div>
  );
}

function SettingsView({
  settings,
  setSettings,
  reload,
  toast
}: {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  reload: () => Promise<void>;
  toast: (message: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  const downloadExport = async () => {
    const data = await exportData(settings);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.download = `munchi-export-${todayKey()}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    toast("Munchi export downloaded.");
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as ExportedData;
      await importData(data);
      await reload();
      toast("Munchi data imported.");
    } catch {
      toast("Import failed. Choose a valid Munchi export.");
    }
  };

  return (
    <div className="screen">
      <Header eyebrow="Munchi preferences" title="Settings" />
      <section className="card settings-list">
        <label>Theme<input value={settings.theme} maxLength={40} onChange={(event) => update({ theme: event.target.value })} /></label>
        <label>Sticker border style<input type="range" min="6" max="24" value={settings.stickerBorderStyle} onChange={(event) => update({ stickerBorderStyle: Number(event.target.value) })} /></label>
        <label>Custom tags<input value={settings.customTags.join(", ")} onChange={(event) => update({ customTags: event.target.value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20) })} /></label>
        <label>Default recording preference<input value={settings.defaultRecordTypes.join(", ")} onChange={(event) => update({ defaultRecordTypes: event.target.value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20) })} /></label>
      </section>
      <section className="card stack-actions">
        <button className="secondary-btn" onClick={downloadExport}>Export data</button>
        <button className="secondary-btn" onClick={() => fileRef.current?.click()}>Import data</button>
        <input ref={fileRef} hidden type="file" accept="application/json" onChange={importFile} />
      </section>
      <section className="journal-preview">
        <h2>About Munchi</h2>
        <p>Munchi is a pixel food diary for tiny food treasures, calendar memories, and cozy collage boards.</p>
      </section>
    </div>
  );
}

export default function App() {
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [assets, setAssets] = useState<StickerAsset[]>([]);
  const [collages, setCollages] = useState<Collage[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [toast, setToast] = useState("");
  const urls = useAssetUrls(assets);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  const reload = async () => {
    const [loadedRecords, loadedAssets, loadedCollages] = await Promise.all([
      getAll<FoodRecord>("records"),
      getAll<StickerAsset>("assets"),
      getAll<Collage>("collages")
    ]);
    setRecords(loadedRecords.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    setAssets(loadedAssets);
    setCollages(loadedCollages);
    setSettings(loadSettings());
  };

  useEffect(() => {
    reload();
  }, []);

  const saveRecord = async (asset: StickerAsset, record: FoodRecord) => {
    await putItem("assets", asset);
    await putItem("records", record);
    setDraft(initialDraft);
    setAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
    setRecords((current) => [record, ...current.filter((item) => item.id !== record.id)].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    showToast("Saved to today's journal.");
  };

  const saveCollage = async (collage: Collage) => {
    await putItem("collages", collage);
    setCollages((current) => [collage, ...current.filter((item) => item.id !== collage.id)]);
    showToast("Collage saved.");
  };

  const routeBundle = useMemo(() => ({ records, assets, urls, settings, collages }), [records, assets, urls, settings, collages]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Shell><Navigate to="/app/today" replace /></Shell>} />
        <Route path="/app/today" element={<Shell><Today records={routeBundle.records} urls={routeBundle.urls} collages={routeBundle.collages} /></Shell>} />
        <Route path="/app/add" element={<Shell><AddCapture draft={draft} setDraft={setDraft} toast={showToast} /></Shell>} />
        <Route path="/app/add/preview" element={<Shell><StickerPreview draft={draft} setDraft={setDraft} /></Shell>} />
        <Route path="/app/add/details" element={<Shell><RecordDetails draft={draft} settings={settings} onSave={saveRecord} /></Shell>} />
        <Route path="/app/add/saved" element={<Shell><Saved /></Shell>} />
        <Route path="/app/calendar" element={<Shell><CalendarView records={records} urls={urls} /></Shell>} />
        <Route path="/app/calendar/:date" element={<Shell><DayDetail records={records} urls={urls} /></Shell>} />
        <Route path="/app/collage" element={<Shell><CollageView records={records} urls={urls} collages={collages} saveCollage={saveCollage} /></Shell>} />
        <Route path="/app/collection" element={<Shell><Collection records={records} urls={urls} /></Shell>} />
        <Route path="/app/stay-fit" element={<Navigate to="/app/collection" replace />} />
        <Route path="/app/settings" element={<Shell><SettingsView settings={settings} setSettings={setSettings} reload={reload} toast={showToast} /></Shell>} />
        <Route path="/today" element={<Navigate to="/app/today" replace />} />
        <Route path="/add/*" element={<Navigate to="/app/add" replace />} />
        <Route path="/calendar" element={<Navigate to="/app/calendar" replace />} />
        <Route path="/collage" element={<Navigate to="/app/collage" replace />} />
        <Route path="/collection" element={<Navigate to="/app/collection" replace />} />
        <Route path="/stay-fit" element={<Navigate to="/app/collection" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
      </Routes>
      <Toast message={toast} />
    </>
  );
}
