export type Rating = "Amazing" | "Good" | "Okay" | "Bad";
export type Source = "camera" | "upload";
export type Language = "en" | "zh";

export type StickerStyle = {
  border: number;
  shadow: boolean;
  rotation: number;
  scale: number;
};

export type StickerAsset = {
  id: string;
  originalBlob: Blob;
  cutoutBlob: Blob;
  createdAt: string;
};

export type FoodRecord = {
  id: string;
  originalImageId: string;
  stickerImageId: string;
  name: string;
  category: string;
  customTags: string[];
  timestamp: string;
  rating: Rating;
  mood?: string;
  note?: string;
  source: Source;
  stickerStyle: StickerStyle;
};

export type CollageItem = {
  id: string;
  stickerImageId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
};

export type CollageDecorItem = {
  id: string;
  label: string;
  tone: string;
  category?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
};

export type CollageBackground = {
  type: "solid" | "gradient" | "grid" | "dots" | "paper" | "dark";
  label: string;
  color: string;
  accent?: string;
};

export type CollageTextItem = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  backgroundStyle: "none" | "soft" | "label" | "stamp";
  style: "title" | "label" | "note" | "stamp";
  rotation: number;
  zIndex: number;
};

export type CollageExportPreset = {
  id: "1:1" | "4:5" | "9:16" | "16:9";
  label: string;
  width: number;
  height: number;
};

export type Collage = {
  id: string;
  title: string;
  aspectRatio: string;
  background: string | CollageBackground;
  items: CollageItem[];
  decorItems?: CollageDecorItem[];
  textItems?: CollageTextItem[];
  exportPreset?: CollageExportPreset;
  text: string;
  captionX?: number;
  captionY?: number;
  showDate: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Settings = {
  language: Language;
  theme: string;
  defaultRecordTypes: string[];
  stickerBorderStyle: number;
  customTags: string[];
};

export type ExportedAsset = Omit<StickerAsset, "originalBlob" | "cutoutBlob"> & {
  originalDataUrl: string;
  cutoutDataUrl: string;
};

export type ExportedData = {
  version: 1;
  exportedAt: string;
  assets: ExportedAsset[];
  records: FoodRecord[];
  collages: Collage[];
  settings: Settings;
};
