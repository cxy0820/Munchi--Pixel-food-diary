import type { Collage, ExportedData, FoodRecord, Settings, StickerAsset } from "./types";

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

export const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.blob();
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

export const importData = async (data: ExportedData) => {
  if (data.version !== 1) throw new Error("Unsupported Munchi export.");
  await clearStore("assets");
  await clearStore("records");
  await clearStore("collages");
  for (const asset of data.assets) {
    await putItem("assets", {
      id: asset.id,
      createdAt: asset.createdAt,
      originalBlob: await dataUrlToBlob(asset.originalDataUrl),
      cutoutBlob: await dataUrlToBlob(asset.cutoutDataUrl)
    } satisfies StickerAsset);
  }
  for (const record of data.records) await putItem("records", record);
  for (const collage of data.collages) await putItem("collages", collage);
  saveSettings(data.settings);
};
