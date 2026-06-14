import type { Collage, ExportedAsset, ExportedData, FoodRecord, Settings, StickerAsset } from "./types";

const DB_NAME = "siplog-db";
const DB_VERSION = 1;
const SETTINGS_KEY = "siplog-settings";
const STORAGE_TIMEOnT_MS = 8000;

export const defaultSettings: Settings = {
  language: "en",
  theme: "Dusty Rose",
  defaultRecordTypes: ["Drinks", "Meals", "Desserts", "Snacks"],
  stickerBorderStyle: 12,
  customTags: ["Milk tea", "Coffee", "Dessert", "Homemade"]
};

const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("assets")) db.createObjectStore("assets", { keyPath: "id" });
      if (!db.objectStoreNames.contains("records")) db.createObjectStore("records", { keyPath: "id" });
      if (!db.objectStoreNames.contains("collages")) db.createObjectStore("collages", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const store = async (name: string, mode: IDBTransactionMode) => {
  const db = await openDb();
  const tx = db.transaction(name, mode);
  return { db, tx, objectStore: tx.objectStore(name) };
};

export const getAll = async <T>(name: string) => {
  const { db, objectStore } = await store(name, "readonly");
  return new Promise<T[]>((resolve, reject) => {
    const request = objectStore.getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result as T[]);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

export const putItem = async (name: string, value: unknown) => {
  const { db, tx, objectStore } = await store(name, "readwrite");
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      db.close();
      if (error) reject(error);
      else resolve();
    };
    const timeout = window.setTimeout(() => {
      tx.abort();
      finish(new Error("Browser storage did not respond."));
    }, STORAGE_TIMEOnT_MS);
    let request: IDBRequest<IDBValidKey>;
    try {
      request = objectStore.put(value);
    } catch (error) {
      finish(error);
      return;
    }
    request.onerror = () => {
      finish(request.error);
    };
    tx.oncomplete = () => {
      finish();
    };
    tx.onerror = () => {
      finish(tx.error);
    };
    tx.onabort = () => {
      finish(tx.error || new Error("Browser storage cancelled the save."));
    };
  });
};

export const clearStore = async (name: string) => {
  const { db, tx, objectStore } = await store(name, "readwrite");
  objectStore.clear();
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
};

export const loadSettings = () => {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(raw) } as Settings;
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export const dataUrlToBlob = (dataUrl: string) => {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error("Invalid data URL.");
  const mimeType = match[1] || "application/octet-stream";
  if (!match[2]) return new Blob([decodeURIComponent(match[3])], { type: mimeType });
  const binary = atob(match[3]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
};

const isExportedData = (data: unknown): data is ExportedData => {
  if (!data || typeof data !== "object") return false;
  const value = data as ExportedData;
  return value.version === 1
    && Array.isArray(value.assets)
    && Array.isArray(value.records)
    && Array.isArray(value.collages)
    && !!value.settings
    && typeof value.settings === "object";
};

const restoreAsset = (asset: ExportedAsset): StickerAsset => {
  if (!asset.id || !asset.createdAt || !asset.originalDataUrl || !asset.cutoutDataUrl) {
    throw new Error("Invalid Munchi asset.");
  }
  return {
    id: asset.id,
    createdAt: asset.createdAt,
    originalBlob: dataUrlToBlob(asset.originalDataUrl),
    cutoutBlob: dataUrlToBlob(asset.cutoutDataUrl)
  };
};

export const exportData = async (settings: Settings): Promise<ExportedData> => {
  const assets = await getAll<StickerAsset>("assets");
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    assets: await Promise.all(
      assets.map(async ({ originalBlob, cutoutBlob, ...asset }) => ({
        ...asset,
        originalDataUrl: await blobToDataUrl(originalBlob),
        cutoutDataUrl: await blobToDataUrl(cutoutBlob)
      }))
    ),
    records: await getAll<FoodRecord>("records"),
    collages: await getAll<Collage>("collages"),
    settings
  };
};

export const importData = async (data: unknown) => {
  if (!isExportedData(data)) throw new Error("Unsupported Munchi export.");
  const assets = data.assets.map(restoreAsset);
  await clearStore("assets");
  await clearStore("records");
  await clearStore("collages");
  for (const asset of assets) await putItem("assets", asset);
  for (const record of data.records) await putItem("records", record);
  for (const collage of data.collages) await putItem("collages", collage);
  saveSettings(data.settings);
};
