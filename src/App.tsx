import { ChangeEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  defaultSettings,
  exportData,
  getAll,
  importData,
  loadSettings,
  putItem,
  saveSettings
} from "./storage";
import type { Collage, CollageBackground, CollageDecorItem, CollageExportPreset, CollageItem, CollageTextItem, FoodRecord, Language, Rating, Settings, Source, StickerAsset, StickerStyle } from "./types";

const categories = ["Milk tea", "Coffee", "Drink", "Meal", "Dessert", "Snack", "Fruit", "Homemade", "Restaurant", "Other"];
const copy = {
  en: {
    languageName: "English",
    languageShort: "EN",
    switchLanguage: "Language",
    nav: {
      primary: "Primary",
      today: "Today",
      calendar: "Calendar",
      add: "Add",
      collage: "Collage",
      collection: "Collection",
      dex: "Dex",
      settings: "Settings",
      stickerReady: "Generated sticker ready",
      addBite: "Add a pixel bite"
    },
    landing: {
      kicker: "Pixel food diary",
      title: "Munchi turns everyday bites into pixel diary treasures.",
      body: "Photograph drinks, desserts, snacks, and meals. Munchi removes the background, turns each bite into a warm 16-bit pixel sticker, and saves it into your journal, calendar, collage studio, and Pixel Dex.",
      open: "Open the app",
      create: "Create pixel art",
      previewLabel: "Munchi mobile app preview",
      previewDate: "June 10 / Munchi",
      today: "Today",
      previewKicker: "Today's Pixel Bites",
      previewTitle: "Collect tiny food moments",
      flow: ["Photo", "Remove background", "Make pixel art", "Save to Dex"],
      features: [
        ["01", "Pixel Stickers", "Turn food photos into warm 16-bit item icons."],
        ["02", "Calendar Records", "Save each bite by date and revisit your food memories."],
        ["03", "Pixel Dex", "Collect every drink, snack, dessert, and meal in one cozy index."]
      ]
    },
    settings: {
      eyebrow: "Munchi preferences",
      title: "Settings",
      language: "Language",
      languageHint: "Switch the app copy between English and Chinese.",
      theme: "Theme",
      stickerBorder: "Sticker border style",
      customTags: "Custom tags",
      defaultRecords: "Default recording preference",
      export: "Export data",
      import: "Import data",
      aboutTitle: "About Munchi",
      aboutBody: "Munchi is a pixel food diary for tiny food treasures, calendar memories, and cozy collage boards.",
      exported: "Munchi export downloaded.",
      imported: "Munchi data imported.",
      importFailed: "Import failed. Choose a valid Munchi export."
    },
    today: {
      title: "Today",
      kicker: "Today's Pixel Bites",
      heading: "Collect your tiny food moments",
      emptyInline: "No pixel bites saved today.",
      emptyTitle: "No pixel bites yet today",
      emptyBody: "Add a drink, dessert, snack, or meal to start today's pixel diary.",
      emptyAction: "Add a pixel bite",
      boardMeta: "PIXEL BOARD",
      boardTitle: "Create today's collage",
      boardBody: "Arrange your pixel bites into a shareable scrapbook page."
    },
    calendar: {
      title: "Calendar",
      all: "All",
      weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      detail: "Day Detail",
      makeBoard: "Make pixel board",
      emptyTitle: "No records on this day",
      emptyBody: "Pick another day or add a pixel bite to create a memory.",
      emptyAction: "Add a pixel bite"
    },
    add: {
      step1: "Step 1 / Capture and cut out",
      addTitle: "Add a pixel bite",
      capture: "CAPTURE",
      placeholder: "Snap your drink, dessert, or meal",
      upload: "Upload from album",
      camera: "Take photo",
      cutoutFoodSetup: "Cutout ready. Food naming needs setup.",
      cutoutReady: "Cutout ready for pixel art.",
      step2: "Step 2 / Pixel Forge",
      createTitle: "Create pixel art",
      retry: "Retry",
      original: "Original",
      forgeTitle: "Pixel Forge",
      progressLabel: "Pixel sticker progress",
      steps: ["Prepare cutout", "Pixel magic in progress", "White border applied"],
      sticker: "Pixel sticker",
      generated: "Generated pixel sticker",
      cutoutAttention: "Cutout needs attention",
      preparing: "Preparing your food cutout...",
      creating: "Creating your pixel sticker...",
      willAppear: "Pixel art will appear here",
      cutoutHelp: "Try another photo so Munchi can isolate the food cleanly.",
      preparingHelp: "Munchi is removing the background before pixel art starts.",
      creatingHelp: "You can visit other pages while Munchi builds the 16-bit version.",
      pixelCutoutTitle: "Pixel cutout needs attention",
      pixelFailed: "Pixel magic failed",
      tryAnother: "Try another photo",
      retrySticker: "Retry pixel sticker",
      continue: "Looks cute, continue",
      step3: "Step 3 / Record Details",
      recordTitle: "Record this pixel bite",
      recognized: (name: string, confidence: string) => `AI recognized this as ${name} with ${confidence} confidence.`,
      name: "Name",
      category: "Category",
      rating: "Rating",
      saveFirst: "Create a pixel sticker before saving.",
      untitled: "Untitled bite",
      saveError: (detail: string) => `The browser could not save this pixel sticker.${detail} Open it in Chrome or Safari, and avoid private browsing.`,
      saving: "Saving...",
      saveToday: "Save to today",
      step4: "Step 4 / Saved",
      savedTitle: "Added to today's pixel page",
      viewToday: "View Today",
      openDex: "Open Pixel Dex",
      readyToast: "Pixel sticker ready.",
      savedToast: "Saved to today's journal."
    },
    collection: {
      eyebrow: "Your cozy item index",
      title: "Collection",
      kicker: "Pixel Dex",
      start: "Start your Pixel Dex",
      treasure: (count: number) => `${count} tiny food treasures`,
      today: (count: number) => `${count} today`,
      emptyTitle: "No pixel bites yet",
      emptyBody: "Add your first food photo and Munchi will turn it into a tiny pixel sticker.",
      emptyAction: "Create first pixel bite",
      all: "All",
      item: "ITEM",
      stats: [
        ["TODAY'S FINDS", "New pixel bites today"],
        ["TOP SHELF", "collected"],
        ["STREAK", "Days with a pixel bite"],
        ["TOTAL ITEMS", "Saved in your Pixel Dex"]
      ],
      none: "None yet"
    },
    collage: {
      title: "Collage Studio",
      exportEyebrow: (width: number, height: number) => `${width} x ${height} pixel board export`,
      tabLabel: (value: string) => value,
      presetLabel: (_id: string, label: string) => label,
      templateLabel: (value: string) => value,
      backgroundLabel: (value: string) => value,
      colorLabel: (value: string) => value,
      textPresetLabel: (value: string) => value,
      textPresetText: (_label: string, text: string) => text,
      textBackgroundLabel: (value: string) => value,
      exportSize: "Export size",
      layout: "Layout",
      addDate: "Add date stamp",
      backgroundStyle: "Background style",
      munchiColors: "Munchi colors",
      pixelStickers: "Pixel stickers",
      addFirst: "Add a pixel bite first, then your stickers will appear here.",
      addSticker: (name: string) => `Add ${name}`,
      decorStickers: "Decor stickers",
      textStyles: "Text styles",
      selectedText: "Selected text",
      size: "Size",
      color: "Color",
      addTextHelp: "Add a text style, then tap the text on the canvas to edit it.",
      transparentPng: "Transparent PNG",
      pngFor: (label: string) => `PNG for ${label}`,
      transparentBackground: "Transparent background",
      exportPng: "Export PNG",
      saveCollage: "Save collage",
      savedCollages: "Saved Collages",
      yourBoards: "Your pixel boards",
      savedEmpty: "Saved collage layouts will appear here after you tap Save collage.",
      top: "Top",
      back: "Back",
      copy: "Copy",
      delete: "Delete",
      rotate: "Drag to rotate",
      resize: "Drag to resize",
      canvasSticker: "Collage sticker",
      tools: "Collage tools",
      journalText: "tiny food notes",
      collageTitle: (id: string) => `Munchi ${id} collage`,
      itemCount: (count: number) => `${count} items`,
      savedToast: "Collage saved."
    }
  },
  zh: {
    languageName: "中文",
    languageShort: "中",
    switchLanguage: "语言",
    nav: {
      primary: "主导航",
      today: "今天",
      calendar: "日历",
      add: "记录",
      collage: "拼贴",
      collection: "图鉴",
      dex: "图鉴",
      settings: "设置",
      stickerReady: "像素贴纸做好啦",
      addBite: "添加一口小食光"
    },
    landing: {
      kicker: "像素美食日记",
      title: "Munchi 把每天吃到的小开心，变成像素日记宝藏。",
      body: "拍下奶茶、甜点、零食和正餐。Munchi 会帮你抠出背景，变成暖乎乎的 16-bit 像素贴纸，再收进日记、日历、拼贴板和小食图鉴里。",
      open: "打开 Munchi",
      create: "生成像素贴纸",
      previewLabel: "Munchi 手机预览",
      previewDate: "6月10日 / Munchi",
      today: "今天",
      previewKicker: "今日小食光",
      previewTitle: "收集今天的好吃瞬间",
      flow: ["拍照", "自动抠图", "像素化", "收进图鉴"],
      features: [
        ["01", "像素贴纸", "把食物照片变成暖暖的 16-bit 小图标。"],
        ["02", "日历记录", "按日期收好每一口，过几天再翻也很有味道。"],
        ["03", "小食图鉴", "奶茶、甜点、零食、正餐，都乖乖住进一个可爱索引里。"]
      ]
    },
    settings: {
      eyebrow: "Munchi 小偏好",
      title: "设置",
      language: "语言",
      languageHint: "在英文和中文之间切换界面文案。",
      theme: "主题名",
      stickerBorder: "贴纸白边粗细",
      customTags: "自定义标签",
      defaultRecords: "默认记录偏好",
      export: "导出数据",
      import: "导入数据",
      aboutTitle: "关于 Munchi",
      aboutBody: "Munchi 是一本像素美食日记，帮你收好小小的吃饭快乐、日历回忆和拼贴灵感。",
      exported: "Munchi 数据已经下载好啦。",
      imported: "Munchi 数据导入完成。",
      importFailed: "导入失败，请选择有效的 Munchi 备份文件。"
    },
    today: {
      title: "今天",
      kicker: "今日小食光",
      heading: "把今天的好吃瞬间收起来",
      emptyInline: "今天还没有收进任何像素小食。",
      emptyTitle: "今天还没开吃记录",
      emptyBody: "加一杯饮料、一份甜点、一个零食或一顿饭，开启今天的像素日记。",
      emptyAction: "添加一口小食光",
      boardMeta: "像素拼贴",
      boardTitle: "做一张今日拼贴",
      boardBody: "把今天的像素小食排成一页可以分享的可爱手账。"
    },
    calendar: {
      title: "日历",
      all: "全部",
      weekdays: ["一", "二", "三", "四", "五", "六", "日"],
      detail: "这一天",
      makeBoard: "做像素拼贴",
      emptyTitle: "这天还没有记录",
      emptyBody: "换一天看看，或者添加一口小食光，给这天留个可爱的记忆。",
      emptyAction: "添加一口小食光"
    },
    add: {
      step1: "第 1 步 / 拍下并抠出食物",
      addTitle: "添加一口小食光",
      capture: "开拍",
      placeholder: "拍下奶茶、甜点或今天这顿饭",
      upload: "从相册选择",
      camera: "现在拍照",
      cutoutFoodSetup: "抠图好啦，食物命名还需要再设置一下。",
      cutoutReady: "抠图好啦，可以开始像素化。",
      step2: "第 2 步 / 像素工坊",
      createTitle: "生成像素贴纸",
      retry: "重试",
      original: "原图",
      forgeTitle: "像素工坊",
      progressLabel: "像素贴纸进度",
      steps: ["准备抠图", "像素魔法进行中", "白边贴好啦"],
      sticker: "像素贴纸",
      generated: "生成好的像素贴纸",
      cutoutAttention: "抠图需要再看看",
      preparing: "正在准备食物抠图...",
      creating: "正在生成像素贴纸...",
      willAppear: "像素贴纸会出现在这里",
      cutoutHelp: "换一张更清晰的照片，让 Munchi 更好地认出食物。",
      preparingHelp: "Munchi 正在先把背景轻轻擦掉。",
      creatingHelp: "你可以先逛别的页面，Munchi 会慢慢把它变成 16-bit 小贴纸。",
      pixelCutoutTitle: "像素抠图需要再试试",
      pixelFailed: "像素魔法失败了",
      tryAnother: "换张照片试试",
      retrySticker: "重新生成贴纸",
      continue: "很可爱，继续",
      step3: "第 3 步 / 填写小记录",
      recordTitle: "记录这口小食光",
      recognized: (name: string, confidence: string) => `AI 猜它是 ${name}，可信度：${({ low: "低", medium: "中", high: "高" } as Record<string, string>)[confidence] || confidence}。`,
      name: "名字",
      category: "分类",
      rating: "喜欢程度",
      saveFirst: "请先生成像素贴纸再保存。",
      untitled: "未命名小食",
      saveError: (detail: string) => `浏览器没能保存这张像素贴纸。${detail} 建议用 Chrome 或 Safari 打开，并避免无痕模式。`,
      saving: "保存中...",
      saveToday: "收进今天",
      step4: "第 4 步 / 已保存",
      savedTitle: "已经收进今天的像素页",
      viewToday: "看看今天",
      openDex: "打开小食图鉴",
      readyToast: "像素贴纸做好啦。",
      savedToast: "已经收进今天的日记。"
    },
    collection: {
      eyebrow: "你的小食图鉴",
      title: "图鉴",
      kicker: "小食图鉴",
      start: "开始收集小食图鉴",
      treasure: (count: number) => `${count} 个小小好吃宝藏`,
      today: (count: number) => `今天 ${count} 个`,
      emptyTitle: "还没有像素小食",
      emptyBody: "添加第一张食物照片，Munchi 会把它变成小小的像素贴纸。",
      emptyAction: "创建第一口小食光",
      all: "全部",
      item: "小食",
      stats: [
        ["今日发现", "今天新增的小食光"],
        ["最爱架子", "次收集"],
        ["连续记录", "连续有小食记录的天数"],
        ["全部小食", "已收进小食图鉴"]
      ],
      none: "还没有"
    },
    collage: {
      title: "拼贴工作室",
      exportEyebrow: (width: number, height: number) => `${width} x ${height} 像素拼贴导出`,
      tabLabel: (value: string) => ({
        Layout: "布局",
        Background: "背景",
        Stickers: "贴纸",
        Text: "文字",
        Export: "导出"
      }[value] || value),
      presetLabel: (id: string, label: string) => ({
        "1:1": "方形帖子",
        "4:5": "竖版帖子",
        "9:16": "故事长图",
        "16:9": "横版长图"
      }[id] || label),
      templateLabel: (value: string) => ({
        Scatter: "散落",
        Grid: "网格",
        Journal: "手账",
        Cover: "封面"
      }[value] || value),
      backgroundLabel: (value: string) => ({
        "Cream paper": "奶油纸",
        "Soft gradient": "柔软渐变",
        "Paper grid": "手账格纹",
        "Tiny dots": "小圆点",
        "Solid color": "纯色底",
        "Dark cozy": "深色暖调"
      }[value] || value),
      colorLabel: (value: string) => ({
        "Dusty Rose": "玫瑰粉",
        Cream: "奶油",
        Peach: "蜜桃",
        Matcha: "抹茶",
        Butter: "黄油",
        Lavender: "薰衣草",
        Coral: "珊瑚",
        "Dark Cozy": "深色暖调"
      }[value] || value),
      textPresetLabel: (value: string) => ({
        "Big Title": "大标题",
        "Soft Label": "软标签",
        "Tiny Note": "小便签",
        "Date Stamp": "日期章"
      }[value] || value),
      textPresetText: (label: string, text: string) => ({
        "Big Title": "今日小食光",
        "Soft Label": "软乎乎",
        "Tiny Note": "一点好吃记忆",
        "Date Stamp": new Date().toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
      }[label] || text),
      textBackgroundLabel: (value: string) => ({
        none: "无",
        soft: "柔软",
        label: "标签",
        stamp: "印章"
      }[value] || value),
      exportSize: "导出尺寸",
      layout: "布局模板",
      addDate: "加日期贴纸",
      backgroundStyle: "背景样式",
      munchiColors: "Munchi 色板",
      pixelStickers: "像素贴纸",
      addFirst: "先添加一口小食光，贴纸就会出现在这里。",
      addSticker: (name: string) => `添加 ${name}`,
      decorStickers: "装饰贴纸",
      textStyles: "文字样式",
      selectedText: "选中文字",
      size: "大小",
      color: "颜色",
      addTextHelp: "先添加一种文字样式，再点画布上的文字来编辑。",
      transparentPng: "透明 PNG",
      pngFor: (label: string) => `${label} PNG`,
      transparentBackground: "透明背景",
      exportPng: "导出 PNG",
      saveCollage: "保存拼贴",
      savedCollages: "已保存拼贴",
      yourBoards: "你的小食拼贴",
      savedEmpty: "点“保存拼贴”后，保存的版式会出现在这里。",
      top: "置顶",
      back: "后移",
      copy: "复制",
      delete: "删除",
      rotate: "拖动旋转",
      resize: "拖动缩放",
      canvasSticker: "拼贴贴纸",
      tools: "拼贴工具",
      journalText: "小小食物笔记",
      collageTitle: (id: string) => `Munchi ${id} 拼贴`,
      itemCount: (count: number) => `${count} 个元素`,
      savedToast: "拼贴保存好啦。"
    }
  }
} as const;

const languages: Language[] = ["en", "zh"];
const localeFor = (language: Language) => language === "zh" ? "zh-CN" : "en";
const categoryLabels: Record<string, Record<Language, string>> = {
  "Milk tea": { en: "Milk tea", zh: "奶茶" },
  Coffee: { en: "Coffee", zh: "咖啡" },
  Drink: { en: "Drink", zh: "饮品" },
  Meal: { en: "Meal", zh: "正餐" },
  Dessert: { en: "Dessert", zh: "甜点" },
  Snack: { en: "Snack", zh: "零食" },
  Fruit: { en: "Fruit", zh: "水果" },
  Homemade: { en: "Homemade", zh: "家里做的" },
  Restaurant: { en: "Restaurant", zh: "外食" },
  Other: { en: "Other", zh: "其他" }
};
const labelForCategory = (category: string, language: Language) => categoryLabels[category]?.[language] || category;
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
  pixelError?: string;
  analysis?: FoodAnalysis;
  style: StickerStyle;
};

type FoodAnalysis = {
  name: string;
  category: string;
  confidence: "low" | "medium" | "high";
  note: string;
};

type PixelJobStatus = "idle" | "generating" | "ready" | "error";

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
    <PixelHeading as="h2" text={title} language={/[\u3400-\u9fff]/.test(title) ? "zh" : "en"} />
    <p>{body}</p>
    {action}
  </section>
);

const Shell = ({
  children,
  language,
  addTarget = "/app/add",
  stickerReady = false,
  onOpenAdd,
  className = ""
}: {
  children: React.ReactNode;
  language: Language;
  addTarget?: string;
  stickerReady?: boolean;
  onOpenAdd?: () => void;
  className?: string;
}) => {
  const t = copy[language].nav;
  return (
    <div className={`app-shell ${className}`}>
      <aside className="sidebar">
        <Link className="brand" to="/">
          <span className="brand-mark">M</span>
          <span>Munchi</span>
        </Link>
        <nav className="desktop-nav" aria-label={t.primary}>
          <NavLink to="/app/today">{t.today}</NavLink>
          <NavLink to="/app/calendar">{t.calendar}</NavLink>
          <NavLink className={stickerReady ? "has-sticker-ready" : ""} to={addTarget} onClick={onOpenAdd} aria-label={stickerReady ? t.stickerReady : undefined}>
            {t.add}
            {stickerReady && <span className="add-ready-badge" aria-hidden="true">✓</span>}
          </NavLink>
          <NavLink to="/app/collage">{t.collage}</NavLink>
          <NavLink to="/app/collection">{t.collection}</NavLink>
          <NavLink to="/app/settings">{t.settings}</NavLink>
        </nav>
      </aside>
      <main className="content-frame">{children}</main>
      <nav className="bottom-nav" aria-label={t.primary}>
        <NavLink to="/app/today">{t.today}</NavLink>
        <NavLink to="/app/calendar">{t.calendar}</NavLink>
        <NavLink className={`add-tab ${stickerReady ? "has-sticker-ready" : ""}`} to={addTarget} onClick={onOpenAdd} aria-label={stickerReady ? t.stickerReady : t.addBite}>
          +
          {stickerReady && <span className="add-ready-badge" aria-hidden="true">✓</span>}
        </NavLink>
        <NavLink to="/app/collage">{t.collage}</NavLink>
        <NavLink to="/app/collection">{t.dex}</NavLink>
      </nav>
    </div>
  );
};

const removeBackground = async (image: Blob) => {
  const tokenResponse = await fetch("/api/csrf-token");
  if (!tokenResponse.ok) throw new Error("Could not prepare a sticker request.");
  const { token } = (await tokenResponse.json()) as { token: string };
  const form = new FormData();
  form.append("image_file", image, image instanceof File ? image.name : "photo.jpg");
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

const analyzeFood = async (image: Blob, language: Language) => {
  const tokenResponse = await fetch("/api/csrf-token");
  if (!tokenResponse.ok) throw new Error("Could not prepare food recognition.");
  const { token } = (await tokenResponse.json()) as { token: string };
  const form = new FormData();
  form.append("image_file", image, image instanceof File ? image.name : "photo.jpg");
  form.append("language", language);
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

function PixelHeading({
  as = "h1",
  text,
  className = ""
}: {
  as?: "h1" | "h2";
  text: string;
  language: Language;
  className?: string;
}) {
  const Tag = as;
  return <Tag className={className}>{text}</Tag>;
}

const Header = ({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) => (
  <header className="screen-header">
    <div>
      <p>{eyebrow}</p>
      <PixelHeading as="h1" text={title} language={/[\u3400-\u9fff]/.test(title) ? "zh" : "en"} />
    </div>
    {action}
  </header>
);

const LanguageToggle = ({ language, onChange, compact = false }: { language: Language; onChange: (language: Language) => void; compact?: boolean }) => (
  <div className={`language-toggle ${compact ? "compact" : ""}`} aria-label={copy[language].switchLanguage}>
    {languages.map((item) => (
      <button key={item} className={language === item ? "is-active" : ""} onClick={() => onChange(item)} type="button">
        {compact ? copy[item].languageShort : copy[item].languageName}
      </button>
    ))}
  </div>
);

function Landing({ language, setLanguage }: { language: Language; setLanguage: (language: Language) => void }) {
  const t = copy[language];
  return (
    <main className="landing-page">
      <div className="landing-language">
        <LanguageToggle language={language} onChange={setLanguage} compact />
      </div>
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="kicker">{t.landing.kicker}</p>
          <PixelHeading as="h1" text={t.landing.title} language={language} />
          <p>{t.landing.body}</p>
          <div className="landing-actions">
            <Link className="primary-btn" to="/app/today">{t.landing.open}</Link>
            <Link className="secondary-btn" to="/app/add">{t.landing.create}</Link>
          </div>
        </div>
        <div className="phone-showcase" aria-label={t.landing.previewLabel}>
          <div className="phone-notch" />
          <div className="screen mini-screen">
            <Header eyebrow={t.landing.previewDate} title={t.landing.today} />
            <section className="paper-panel sticker-board demo-board">
              <div className="section-heading">
                <div>
                  <p className="kicker">{t.landing.previewKicker}</p>
                  <h2>{t.landing.previewTitle}</h2>
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
              <span>{t.landing.flow[0]}</span>
              <strong>{t.landing.flow[1]}</strong>
              <strong>{t.landing.flow[2]}</strong>
              <span>{t.landing.flow[3]}</span>
            </section>
          </div>
        </div>
      </section>
      <section className="landing-strip">
        {t.landing.features.map(([index, title, body]) => <article key={index}><span>{index}</span><h2>{title}</h2><p>{body}</p></article>)}
      </section>
    </main>
  );
}

function DailyPoster({ language, records, urls }: { language: Language; records: FoodRecord[]; urls: Record<string, string> }) {
  const posterCopy = language === "zh" ? {
    meta: "今日海报",
    open: "打开今日海报",
    body: "把今天的贴纸整理成一张可以分享的小海报。",
    download: "下载海报",
    close: "关闭海报",
    aria: "今日海报预览",
    label: "今日好味记录",
    title: "小小一口，开心很久。",
    stats: (count: number) => [[`${count} 张贴纸`, "今日小食"], ["1 句心情", "今日氛围"], ["分享", "海报已就绪"]]
  } : {
    meta: "DAILY POSTER",
    open: "Open today's poster",
    body: "View today's sticker summary as a shareable poster.",
    download: "Download poster",
    close: "Close poster",
    aria: "Daily poster preview",
    label: "TODAY'S TASTE NOTE",
    title: "Little bites, big mood.",
    stats: (count: number) => [[`${count} stickers`, "today's bites"], ["1 quote", "daily mood"], ["Share", "poster ready"]]
  };
  const posterRecords = records.filter((record) => urls[record.stickerImageId]).slice(0, 3);
  const [hero, second, third] = posterRecords;
  const dateLabel = new Date().toLocaleDateString(localeFor(language), { month: "short", day: "numeric" });
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
    ctx.fillText(posterCopy.label, 64, 112);
    ctx.font = `700 82px "Munchi Pixel", "Munchi Round", sans-serif`;
    if (language === "zh") {
      ctx.fillText("小小一口，", 64, 190);
      ctx.fillText("开心很久。", 64, 266);
    } else {
      ctx.fillText("Little bites,", 64, 190);
      ctx.fillText("big mood.", 64, 266);
    }

    ctx.save();
    ctx.translate(930, 140);
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

    await drawPosterSticker(ctx, "/poster-decor/bow.svg", 138, 350, 108, 9, 12);
    await drawPosterSticker(ctx, "/poster-decor/flower.svg", 875, 440, 108, -9, 12);
    await drawPosterSticker(ctx, "/poster-decor/cake.svg", 790, 920, 108, -4, 12);
    await drawPosterSticker(ctx, "/poster-decor/glowing-star.svg", 900, 900, 104, 8, 12);
    if (second) await drawPosterSticker(ctx, urls[second.stickerImageId], 260, 485, 250, -9);
    if (third) await drawPosterSticker(ctx, urls[third.stickerImageId], 285, 865, 285, 8);
    await drawPosterSticker(ctx, urls[hero.stickerImageId], 700, 690, 510, 4);
    drawPosterLabel(ctx, dailyPosterQuotes[0], 592, 420, "#efcbd8", 6);
    drawPosterLabel(ctx, dailyPosterQuotes[1], 650, 945, "#dcd3f0", -5);
    drawPosterLabel(ctx, dailyPosterQuotes[2], 170, 1090, "#ffe391", 3);

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
    const stats = posterCopy.stats(posterRecords.length);
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
        <span className="meta">{posterCopy.meta}</span>
        <h2>{posterCopy.open}</h2>
        <p>{posterCopy.body}</p>
      </button>
      {open && (
        <div className="daily-poster-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div className="daily-poster-modal" role="dialog" aria-modal="true" aria-label={posterCopy.aria} onClick={(event) => event.stopPropagation()}>
            <div className="daily-poster-modal-actions">
              <button className="secondary-btn daily-poster-download" onClick={exportPoster}>{posterCopy.download}</button>
              <button className="icon-btn daily-poster-close" onClick={() => setOpen(false)} aria-label={posterCopy.close}>x</button>
            </div>
            <div className="daily-poster-preview">
              <div className="daily-poster-top">
                <div>
                  <p className="pixel">{posterCopy.label}</p>
                  <h3>{posterCopy.title}</h3>
                </div>
                <div className="daily-poster-date pixel">{dateLabel}<br />Munchi</div>
              </div>
              <StickerImage className="daily-poster-hero" src={urls[hero.stickerImageId]} label={hero.name} style={{ ...hero.stickerStyle, rotation: 4, scale: 1, shadow: false }} />
              {second && <StickerImage className="daily-poster-small daily-poster-side-one" src={urls[second.stickerImageId]} label={second.name} style={{ ...second.stickerStyle, rotation: -9, scale: 1, shadow: false }} />}
              {third && <StickerImage className="daily-poster-small daily-poster-side-two" src={urls[third.stickerImageId]} label={third.name} style={{ ...third.stickerStyle, rotation: 8, scale: 1, shadow: false }} />}
              {posterDecor.map((decor) => <img key={decor.src} className={`daily-poster-decor ${decor.className}`} src={decor.src} alt={decor.alt} />)}
              <span className="daily-poster-quote quote-one pixel">{dailyPosterQuotes[0]}</span>
              <span className="daily-poster-quote quote-two pixel">{dailyPosterQuotes[1]}</span>
              <span className="daily-poster-quote quote-three pixel">{dailyPosterQuotes[2]}</span>
              <div className="daily-poster-brand">
                <span className="brand-mark">M</span>
                <strong>Munchi</strong>
              </div>
              <div className="daily-poster-bottom">
                {posterCopy.stats(posterRecords.length).map(([title, body]) => <div key={title}><strong>{title}</strong><span>{body}</span></div>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Today({ language, records, urls }: { language: Language; records: FoodRecord[]; urls: Record<string, string>; collages: Collage[] }) {
  const t = copy[language];
  const todaysRecords = records.filter((record) => isToday(record.timestamp));
  const featuredTodayRecord = todaysRecords[0];
  const sideTodayRecords = todaysRecords.slice(1, 6);
  return (
    <div className="screen today-screen">
      <Header eyebrow={`${new Date().toLocaleDateString(localeFor(language), { month: "long", day: "numeric", weekday: "long" })} / Munchi`} title={t.today.title} />
      {todaysRecords.length ? (
        <>
          <section className="paper-panel sticker-board pixel-journal-board">
            <div className="section-heading">
              <div>
                <p className="kicker">{t.today.kicker}</p>
                <h2>{t.today.heading}</h2>
              </div>
              <span className="count-pill">{todaysRecords.length}</span>
            </div>
            {featuredTodayRecord ? (
              <div className="today-feature">
                <div className="today-main-sticker">
                  <StickerImage className="today-hero-sticker" src={urls[featuredTodayRecord.stickerImageId]} label={featuredTodayRecord.name} style={{ ...featuredTodayRecord.stickerStyle, rotation: -3, scale: 1, shadow: false }} />
                  <div>
                    <strong>{featuredTodayRecord.name}</strong>
                    <span>{labelForCategory(featuredTodayRecord.category, language)}</span>
                  </div>
                </div>
                {sideTodayRecords.length > 0 && (
                  <div className="today-sticker-queue" aria-label={t.today.kicker}>
                    {sideTodayRecords.map((record) => (
                      <div className="today-queue-item" key={record.id}>
                        <StickerImage className="today-mini-sticker" src={urls[record.stickerImageId]} label={record.name} style={{ ...record.stickerStyle, rotation: 0, scale: 1, shadow: false }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="today-feature-empty">{t.today.emptyInline}</div>
            )}
          </section>
          <section className="two-col today-actions-row">
            <DailyPoster language={language} records={todaysRecords} urls={urls} />
            <Link className="card action-card" to="/app/collage">
              <span className="meta">{t.today.boardMeta}</span>
              <h2>{t.today.boardTitle}</h2>
              <p>{t.today.boardBody}</p>
            </Link>
          </section>
        </>
      ) : (
        <EmptyState
          title={t.today.emptyTitle}
          body={t.today.emptyBody}
          action={<Link className="primary-btn" to="/app/add">{t.today.emptyAction}</Link>}
        />
      )}
    </div>
  );
}

function AddCapture({ language, draft, setDraft, toast }: { language: Language; draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>>; toast: (message: string) => void }) {
  const t = copy[language].add;
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
    const processingImage = await shrinkImageBlob(file).catch(() => file);
    const analysisPromise = analyzeFood(processingImage, language).catch(() => undefined);
    try {
      const cutoutBlob = await removeBackground(processingImage);
      setDraft((current) => current.file === file ? { ...current, cutoutBlob, prepError: undefined, pixelError: undefined } : current);
      toast(t.cutoutReady);
      const analysis = await analysisPromise;
      if (analysis) setDraft((current) => current.file === file ? { ...current, analysis } : current);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Background removal failed.";
      setDraft((current) => current.file === file ? { ...current, prepError: message } : current);
    }
  };

  return (
    <div className="screen">
      <Header eyebrow={t.step1} title={t.addTitle} />
      <section className="upload-panel pixel-camera">
        <span className="pixel-corner top-left">{t.capture}</span>
        <span className="pixel-corner bottom-right">PX-01</span>
        <span className="scan-line" />
        {preview ? <img src={preview} alt={t.placeholder} /> : <div className="camera-placeholder">{t.placeholder}</div>}
      </section>
      <section className="capture-actions">
        <label className="secondary-btn">
          {t.upload}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif" onChange={(event) => pickFile(event, "upload")} />
        </label>
        <label className="primary-btn">
          {t.camera}
          <input type="file" accept="image/*" capture="environment" onChange={(event) => pickFile(event, "camera")} />
        </label>
      </section>
    </div>
  );
}

function StickerPreview({
  language,
  draft,
  pixelJobStatus,
  retryPixelSticker
}: {
  language: Language;
  draft: Draft;
  pixelJobStatus: PixelJobStatus;
  retryPixelSticker: () => void;
}) {
  const t = copy[language].add;
  const navigate = useNavigate();
  const [originalUrl, setOriginalUrl] = useState("");
  const [stickerUrl, setStickerUrl] = useState("");
  const creating = pixelJobStatus === "generating";
  const error = draft.pixelError || "";

  useEffect(() => {
    if (!draft.originalBlob) return;
    const original = URL.createObjectURL(draft.originalBlob);
    setOriginalUrl(original);
    return () => {
      URL.revokeObjectURL(original);
    };
  }, [draft.originalBlob]);

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
      <Header eyebrow={t.step2} title={t.createTitle} action={error && draft.cutoutBlob ? <button className="icon-btn" onClick={retryPixelSticker}>{t.retry}</button> : undefined} />
      <section className="pixel-forge-layout">
        <aside className="forge-side">
          <div className="photo-tile forge-source"><span>{t.original}</span>{originalUrl && <img src={originalUrl} alt={t.original} />}</div>
          <div className={`pixel-forge ${!draft.prepError && !error && (!draft.cutoutBlob || creating) ? "is-active" : ""} ${draft.stickerBlob ? "is-complete" : ""} ${draft.prepError || error ? "is-error" : ""}`}>
            <span className="forge-title">{t.forgeTitle}</span>
            <ol className="forge-steps" aria-label={t.progressLabel}>
              <li className={draft.cutoutBlob ? "is-complete" : draft.prepError ? "" : "is-active"}>{t.steps[0]}</li>
              <li className={creating ? "is-active" : draft.stickerBlob ? "is-complete" : ""}>{t.steps[1]}</li>
              <li className={draft.stickerBlob ? "is-complete" : ""}>{t.steps[2]}</li>
            </ol>
          </div>
        </aside>
        <div className={`photo-tile paper pixel-preview forge-result ${!draft.prepError && !error && (!draft.cutoutBlob || creating) ? "is-active" : ""} ${draft.stickerBlob ? "is-complete" : ""} ${draft.prepError || error ? "is-error" : ""}`}>
          <span>{t.sticker}</span>
          {stickerUrl ? (
            <StickerImage src={stickerUrl} label={t.generated} style={draft.style} />
          ) : (
            <div className="forge-empty-state">
              <div className="forge-pixels" aria-hidden="true">
                {Array.from({ length: 16 }).map((_, index) => <i key={index} />)}
              </div>
              <strong>{draft.prepError ? t.cutoutAttention : !draft.cutoutBlob ? t.preparing : creating ? t.creating : t.willAppear}</strong>
              <p>{draft.prepError ? t.cutoutHelp : !draft.cutoutBlob ? t.preparingHelp : t.creatingHelp}</p>
            </div>
          )}
        </div>
      </section>
      {(draft.prepError || error) && (
        <section className="error-box pixel-error">
          <h2>{draft.prepError ? t.pixelCutoutTitle : t.pixelFailed}</h2>
          <p>{draft.prepError || error}</p>
          {draft.prepError ? <Link className="secondary-btn" to="/app/add">{t.tryAnother}</Link> : <button className="secondary-btn" onClick={retryPixelSticker}>{t.retrySticker}</button>}
        </section>
      )}
      <button className="primary-btn full forge-continue" disabled={!draft.stickerBlob || creating || !draft.cutoutBlob} onClick={() => navigate("/app/add/details")}>{t.continue}</button>
    </div>
  );
}

function RecordDetails({
  language,
  draft,
  settings,
  onSave
}: {
  language: Language;
  draft: Draft;
  settings: Settings;
  onSave: (asset: StickerAsset, record: FoodRecord) => Promise<void>;
}) {
  const t = copy[language].add;
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
      setSaveError(t.saveFirst);
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
        name: name.trim().slice(0, 80) || t.untitled,
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
      setSaveError(t.saveError(detail));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="screen record-screen">
      <Header eyebrow={t.step3} title={t.recordTitle} />
      <section className="card form-card record-form">
        <div className="record-preview"><StickerImage src={preview} label={name} style={draft.style} /></div>
        {draft.analysis && <p className="status">{t.recognized(draft.analysis.name, draft.analysis.confidence)}</p>}
        <label>{t.name}<input value={name} maxLength={80} onChange={(event) => setName(event.target.value)} /></label>
        <div>
          <p className="field-label">{t.category}</p>
          <div className="chip-row">{tags.map((tag) => <button key={tag} className={`chip ${category === tag ? "is-active" : ""}`} onClick={() => setCategory(tag)}>{labelForCategory(tag, language)}</button>)}</div>
        </div>
        <div>
          <p className="field-label">{t.rating}</p>
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
      <button className="primary-btn full" disabled={saving} onClick={save}>{saving ? t.saving : t.saveToday}</button>
    </div>
  );
}

function Saved({ language }: { language: Language }) {
  const t = copy[language].add;
  return (
    <div className="screen">
      <Header eyebrow={t.step4} title={t.savedTitle} />
      <section className="paper-panel saved-drop pixel-page-drop">
        <div className="journal-page-target">
          <span className="date-tape">TODAY</span>
          <div className="sticker-photo mini-pop acquired-sticker"><span>PX</span></div>
        </div>
        <h2>{t.savedTitle}</h2>
      </section>
      <div className="stack-actions">
        <Link className="primary-btn" to="/app/today">{t.viewToday}</Link>
        <Link className="secondary-btn" to="/app/collection">{t.openDex}</Link>
      </div>
    </div>
  );
}

function CalendarView({ language, records, urls }: { language: Language; records: FoodRecord[]; urls: Record<string, string> }) {
  const t = copy[language].calendar;
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
      <Header eyebrow={month.toLocaleDateString(localeFor(language), { month: "long", year: "numeric" })} title={t.title} />
      <div className="chip-row">{filters.map((item) => <button key={item} className={`chip ${filter === item ? "is-active" : ""}`} onClick={() => setFilter(item)}>{item === "All" ? t.all : labelForCategory(item, language)}</button>)}</div>
      <section className="paper-panel calendar-panel">
        {t.weekdays.map((day) => <span className="weekday" key={day}>{day}</span>)}
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

function DayDetail({ language, records, urls }: { language: Language; records: FoodRecord[]; urls: Record<string, string> }) {
  const t = copy[language].calendar;
  const { date = todayKey() } = useParams();
  const dayRecords = records.filter((record) => dateKey(record.timestamp) === date);
  return (
    <div className="screen">
      <Header eyebrow={new Date(`${date}T12:00:00`).toLocaleDateString(localeFor(language), { month: "short", day: "numeric", weekday: "short" })} title={t.detail} action={<Link className="secondary-btn" to="/app/collage">{t.makeBoard}</Link>} />
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
                    <span>{labelForCategory(record.category, language)}</span>
                    <span>{new Date(record.timestamp).toLocaleTimeString(localeFor(language), { hour: "2-digit", minute: "2-digit" })}</span>
                    <img className="record-rating-icon" src={recordRating.image} alt={recordRating.label} />
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState title={t.emptyTitle} body={t.emptyBody} action={<Link className="primary-btn" to="/app/add">{t.emptyAction}</Link>} />
      )}
    </div>
  );
}

function CollageView({
  language,
  records,
  urls,
  collages,
  saveCollage
}: {
  language: Language;
  records: FoodRecord[];
  urls: Record<string, string>;
  collages: Collage[];
  saveCollage: (collage: Collage) => Promise<void>;
}) {
  const t = copy[language].collage;
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
  const collageCanvasFont = language === "zh"
    ? '"Munchi CN Pixel", "HarmonyOS Sans SC", "汉仪旗黑 Lenovo 60S", sans-serif'
    : '"Munchi Pixel", "Munchi Round", sans-serif';

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
      text: t.textPresetText(preset.label, preset.text),
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
        ctx.font = `700 ${fontSize}px ${collageCanvasFont}`;
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
      ctx.font = `700 ${fontSize}px ${collageCanvasFont}`;
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
      ctx.font = `700 ${18 * scale}px ${collageCanvasFont}`;
      ctx.fillText(new Date().toLocaleDateString(localeFor(language), { month: "short", day: "numeric" }), 18 * scaleX, 34 * scaleY);
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
    const title = t.collageTitle(exportPreset.id);
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
        text: t.journalText,
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
      <Header eyebrow={t.exportEyebrow(exportPreset.width, exportPreset.height)} title={t.title} />
      <section className="collage-editor-shell">
        <div className="collage-stage">
          <section ref={canvasRef} className="collage-canvas" data-ratio={exportPreset.id} style={collageBackgroundStyle(background)}>
            {showDate && <span className="date-tape">{new Date().toLocaleDateString(localeFor(language), { month: "short", day: "numeric" })}</span>}
            {items.map((item) => (
              <div
                className={`collage-item ${selected === item.id ? "selected" : ""}`}
                data-collage-id={item.id}
                key={item.id}
                onPointerDown={(event) => drag(event, item.id)}
                style={{ left: item.x, top: item.y, zIndex: zIndexOf(item), transform: `rotate(${item.rotation}deg) scale(${item.scale})` }}
              >
                <StickerImage src={urls[item.stickerImageId]} label={t.canvasSticker} />
                {selected === item.id && (
                  <span className="item-handles">
                    <button className="transform-handle rotate" title={t.rotate} onPointerDown={(event) => transformItem(event, item.id, "sticker", "rotate")}>R</button>
                    <button className="transform-handle scale" title={t.resize} onPointerDown={(event) => transformItem(event, item.id, "sticker", "scale")}>+</button>
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
                    <button className="transform-handle rotate" title={t.rotate} onPointerDown={(event) => transformItem(event, item.id, "decor", "rotate")}>R</button>
                    <button className="transform-handle scale" title={t.resize} onPointerDown={(event) => transformItem(event, item.id, "decor", "scale")}>+</button>
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
                    <button className="transform-handle rotate" title={t.rotate} onPointerDown={(event) => transformItem(event, item.id, "text", "rotate")}>R</button>
                    <button className="transform-handle scale" title={t.resize} onPointerDown={(event) => transformItem(event, item.id, "text", "scale")}>+</button>
                  </span>
                )}
              </span>
            ))}
          </section>
          {(selectedItem || selectedDecor || selectedText) && (
            <div className="selected-actions">
              <button className="chip" onClick={bringForward}>{t.top}</button>
              <button className="chip" onClick={sendBackward}>{t.back}</button>
              <button className="chip" onClick={duplicateSelected}>{t.copy}</button>
              <button className="chip danger" onClick={deleteSelected}>{t.delete}</button>
            </div>
          )}
        </div>
        <section className="editor-panel">
          <nav className="editor-tabs" aria-label={t.tools}>
            {editorTabs.map((tab) => <button key={tab} className={activeTool === tab ? "is-active" : ""} onClick={() => setActiveTool(tab)}>{t.tabLabel(tab)}</button>)}
          </nav>

          {activeTool === "Layout" && (
            <div className="tool-panel">
              <p className="field-label">{t.exportSize}</p>
              <div className="preset-grid">{exportPresets.map((preset) => (
                <button key={preset.id} className={`preset-card ${exportPreset.id === preset.id ? "is-active" : ""}`} onClick={() => setExportPreset(preset)}>
                  <strong>{preset.id}</strong>
                  <span>{t.presetLabel(preset.id, preset.label)}</span>
                </button>
              ))}</div>
              <p className="field-label">{t.layout}</p>
              <div className="chip-row">{layoutTemplates.map((item) => <button key={item} className={`chip ${template === item ? "is-active" : ""}`} onClick={() => applyTemplate(item)}>{t.templateLabel(item)}</button>)}</div>
              <label className="inline-check"><input type="checkbox" checked={showDate} onChange={(event) => setShowDate(event.target.checked)} /> {t.addDate}</label>
            </div>
          )}

          {activeTool === "Background" && (
            <div className="tool-panel">
              <p className="field-label">{t.backgroundStyle}</p>
              <div className="background-grid">{backgroundOptions.map((item) => (
                <button key={item.label} className={background.label === item.label && background.type === item.type ? "is-active" : ""} onClick={() => setBackground(item)}>
                  <span style={collageBackgroundStyle(item)} />
                  {t.backgroundLabel(item.label)}
                </button>
              ))}</div>
              <p className="field-label">{t.munchiColors}</p>
              <div className="swatch-row">{munchiPalette.map((item) => (
                <button key={item.label} className={background.color === item.color ? "is-active" : ""} onClick={() => setBackground({ ...background, color: item.color, label: background.type === "solid" ? item.label : background.label })} title={t.colorLabel(item.label)} style={{ background: item.color }} />
              ))}</div>
            </div>
          )}

          {activeTool === "Stickers" && (
            <div className="tool-panel">
              <p className="field-label">{t.pixelStickers}</p>
              <section className="sticker-tray">
                {records.length ? records.map((record) => <button key={record.id} title={record.name} aria-label={t.addSticker(record.name)} onClick={() => addRecord(record)}><StickerImage src={urls[record.stickerImageId]} label={record.name} style={{ ...record.stickerStyle, rotation: 0, scale: 1, shadow: false }} /></button>) : <p>{t.addFirst}</p>}
              </section>
              <p className="field-label">{t.decorStickers}</p>
              <div className="decor-tray merged-decor-tray">{decorStickers.map((item) => <button key={`${item.category}-${item.label}`} className={`decor-sticker ${item.tone}`} onClick={() => addDecor(item)}>{item.label}</button>)}</div>
            </div>
          )}

          {activeTool === "Text" && (
            <div className="tool-panel">
              <p className="field-label">{t.textStyles}</p>
              <div className="text-preset-grid">{textPresets.map((preset) => <button key={preset.label} className={`collage-text-item ${preset.style} ${preset.backgroundStyle}`} onClick={() => addText(preset)}>{t.textPresetLabel(preset.label)}</button>)}</div>
              {selectedText ? (
                <>
                  <label>{t.selectedText}<textarea value={selectedText.text} maxLength={90} onChange={(event) => updateSelectedText({ text: event.target.value })} /></label>
                  <div className="two-col">
                    <label>{t.size}<input type="number" min="11" max="54" value={selectedText.fontSize} onChange={(event) => updateSelectedText({ fontSize: Number(event.target.value) })} /></label>
                    <label>{t.color}<input type="color" value={selectedText.color} onChange={(event) => updateSelectedText({ color: event.target.value })} /></label>
                  </div>
                  <div className="chip-row">
                    {(["none", "soft", "label", "stamp"] as const).map((item) => <button key={item} className={`chip ${selectedText.backgroundStyle === item ? "is-active" : ""}`} onClick={() => updateSelectedText({ backgroundStyle: item })}>{t.textBackgroundLabel(item)}</button>)}
                  </div>
                </>
              ) : (
                <p className="status">{t.addTextHelp}</p>
              )}
            </div>
          )}

          {activeTool === "Export" && (
            <div className="tool-panel">
              <div className="export-summary">
                <strong>{exportPreset.width} x {exportPreset.height}</strong>
                <span>{transparentExport ? t.transparentPng : t.pngFor(t.presetLabel(exportPreset.id, exportPreset.label))}</span>
              </div>
              <label className="inline-check"><input type="checkbox" checked={transparentExport} onChange={(event) => setTransparentExport(event.target.checked)} /> {t.transparentBackground}</label>
              <div className="two-col">
                <button className="secondary-btn" onClick={exportPng}>{t.exportPng}</button>
                <button className="primary-btn" onClick={saveCurrentCollage}>{t.saveCollage}</button>
              </div>
              <section className="collage-history">
                <div className="section-heading">
                  <div>
                    <p className="kicker">{t.savedCollages}</p>
                    <h2>{t.yourBoards}</h2>
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
                          <span>{preset.id} / {t.itemCount(collage.items.length + (collage.decorItems?.length || 0) + normalizeTextItems(collage).length)} / {new Date(collage.updatedAt).toLocaleDateString(localeFor(language), { month: "short", day: "numeric" })}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="status">{t.savedEmpty}</p>
                )}
              </section>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

function Collection({ language, records, urls }: { language: Language; records: FoodRecord[]; urls: Record<string, string> }) {
  const t = copy[language].collection;
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
    <div className="screen collection-screen">
      <Header
        eyebrow={t.eyebrow}
        title={t.title}
        action={(
          <NavLink className="mobile-settings-link" to="/app/settings" aria-label={copy[language].nav.settings}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05a2 2 0 0 1-2.83 2.83l-.05-.05a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 0 1-4 0v-.07a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.05.05a2 2 0 0 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 0 1 0-4h.07A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88l-.05-.05a2 2 0 0 1 2.83-2.83l.05.05a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 10 3.01V3a2 2 0 0 1 4 0v.07a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.05-.05a2 2 0 0 1 2.83 2.83l-.05.05a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 0 1 0 4h-.07A1.7 1.7 0 0 0 19.4 15Z" />
            </svg>
          </NavLink>
        )}
      />
      <section className="paper-panel pixel-dex-hero pixel-dex-book">
        <div className="section-heading">
          <div>
            <p className="kicker">{t.kicker}</p>
            <h2>{records.length ? t.treasure(records.length) : t.start}</h2>
          </div>
          <span className="count-pill">{t.today(todaysRecords.length)}</span>
        </div>
        {records.length ? (
          <div className="pixel-dex-grid">
            {visibleRecords.map((record) => (
              <article className="pixel-dex-item" key={record.id}>
                <span className="item-slot-badge">{t.item}</span>
                <StickerImage className="dex-sticker" src={urls[record.stickerImageId]} label={record.name} style={{ ...record.stickerStyle, rotation: 0, scale: 1, shadow: false }} />
                <strong>{record.name}</strong>
                <span>{labelForCategory(record.category, language)}</span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title={t.emptyTitle} body={t.emptyBody} action={<Link className="primary-btn" to="/app/add">{t.emptyAction}</Link>} />
        )}
      </section>
      <div className="chip-row">{["All", ...categories].map((item) => <button key={item} className={`chip ${filter === item ? "is-active" : ""}`} onClick={() => setFilter(item)}>{item === "All" ? t.all : labelForCategory(item, language)}</button>)}</div>
      <section className="two-col pixel-stat-grid">
        <div className="card stat-card"><span className="meta">{t.stats[0][0]}</span><h2>{todaysRecords.length}</h2><p>{t.stats[0][1]}</p></div>
        <div className="card stat-card"><span className="meta">{t.stats[1][0]}</span><h2>{mostCollected ? labelForCategory(mostCollected.category, language) : t.none}</h2><p>{mostCollected?.count || 0} {t.stats[1][1]}</p></div>
        <div className="card stat-card"><span className="meta">{t.stats[2][0]}</span><h2>{streak}</h2><p>{t.stats[2][1]}</p></div>
        <div className="card stat-card"><span className="meta">{t.stats[3][0]}</span><h2>{records.length}</h2><p>{t.stats[3][1]}</p></div>
      </section>
    </div>
  );
}

function ChineseFontPreview() {
  return (
    <div className="screen zh-font-preview-page" lang="zh-CN">
      <header className="zh-font-preview-hero">
        <div>
          <p className="kicker">ZCOOL KuaiLe / 中文版预览</p>
          <h1>Munchi 中文字体预览</h1>
          <p>这页只预览中文版全局换成站酷快乐体后的样子。英文版不会跟着改，正式应用前也不会保存任何设置。</p>
        </div>
        <div className="zh-font-preview-badge">
          <span>像素日记</span>
          <strong>今日小食光</strong>
        </div>
      </header>

      <section className="paper-panel zh-preview-board">
        <div className="section-heading">
          <div>
            <p className="kicker">今天 / Munchi</p>
            <h2>把今天的好吃瞬间收起来</h2>
          </div>
          <span className="count-pill">3</span>
        </div>
        <div className="zh-preview-sticker-row" aria-label="字体预览贴纸">
          <img src="/landing-demo-stickers/latte.png" alt="拿铁像素贴纸" />
          <img src="/landing-demo-stickers/pizza.png" alt="披萨像素贴纸" />
          <img src="/landing-demo-stickers/tiramisu.png" alt="提拉米苏像素贴纸" />
        </div>
        <p>拍下奶茶、甜点、零食和正餐。Munchi 会把它们变成暖乎乎的像素贴纸，再收进日记、日历、拼贴板和小食图鉴里。</p>
      </section>

      <section className="two-col zh-font-preview-grid">
        <article className="card zh-preview-card">
          <span className="meta">按钮和标签</span>
          <h2>记录这口小食光</h2>
          <div className="chip-row">
            <button className="chip is-active">奶茶</button>
            <button className="chip">甜点</button>
            <button className="chip">家里做的</button>
          </div>
          <div className="zh-preview-actions">
            <button className="primary-btn">收进今天</button>
            <button className="secondary-btn">重新生成贴纸</button>
          </div>
        </article>

        <article className="card zh-preview-card">
          <span className="meta">表单和正文</span>
          <h2>小记录</h2>
          <label>名字<input value="草莓奶油蛋糕" readOnly /></label>
          <label>备注<textarea value="下午三点的小奖励，奶油很轻，草莓很甜。" readOnly /></label>
        </article>
      </section>

      <section className="journal-preview zh-font-preview-compare">
        <div>
          <p className="kicker">英文版对照</p>
          <h2>English keeps the current Munchi font.</h2>
          <p className="english-sample">Munchi turns everyday bites into pixel diary treasures.</p>
        </div>
        <Link className="secondary-btn" to="/app/settings">返回设置</Link>
      </section>
    </div>
  );
}

function SettingsView({
  language,
  setLanguage,
  settings,
  setSettings,
  reload,
  toast
}: {
  language: Language;
  setLanguage: (language: Language) => void;
  settings: Settings;
  setSettings: (settings: Settings) => void;
  reload: () => Promise<void>;
  toast: (message: string) => void;
}) {
  const t = copy[language].settings;
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
    toast(t.exported);
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse((await file.text()).replace(/^\uFEFF/, ""));
      await importData(data);
      await reload();
      toast(t.imported);
    } catch {
      toast(t.importFailed);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="screen">
      <Header eyebrow={t.eyebrow} title={t.title} />
      <section className="card settings-list">
        <div className="setting-field language-setting">
          <div>
            <p>{t.language}</p>
            <span>{t.languageHint}</span>
          </div>
          <LanguageToggle language={language} onChange={setLanguage} />
        </div>
        <label>{t.theme}<input value={settings.theme} maxLength={40} onChange={(event) => update({ theme: event.target.value })} /></label>
        <label>{t.stickerBorder}<input type="range" min="6" max="24" value={settings.stickerBorderStyle} onChange={(event) => update({ stickerBorderStyle: Number(event.target.value) })} /></label>
        <label>{t.customTags}<input value={settings.customTags.join(", ")} onChange={(event) => update({ customTags: event.target.value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20) })} /></label>
        <label>{t.defaultRecords}<input value={settings.defaultRecordTypes.join(", ")} onChange={(event) => update({ defaultRecordTypes: event.target.value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20) })} /></label>
      </section>
      <section className="card stack-actions">
        <button className="secondary-btn" onClick={downloadExport}>{t.export}</button>
        <button className="secondary-btn" onClick={() => fileRef.current?.click()}>{t.import}</button>
        <input ref={fileRef} hidden type="file" accept=".json,application/json" onChange={importFile} />
      </section>
      <section className="journal-preview">
        <h2>{t.aboutTitle}</h2>
        <p>{t.aboutBody}</p>
      </section>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [assets, setAssets] = useState<StickerAsset[]>([]);
  const [collages, setCollages] = useState<Collage[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [pixelJobStatus, setPixelJobStatus] = useState<PixelJobStatus>("idle");
  const [pixelRetryNonce, setPixelRetryNonce] = useState(0);
  const [stickerReadySeen, setStickerReadySeen] = useState(false);
  const [toast, setToast] = useState("");
  const activePixelJob = useRef<Blob | null>(null);
  const urls = useAssetUrls(assets);
  const language = settings.language || "en";

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  const setLanguage = (nextLanguage: Language) => {
    const next = { ...settings, language: nextLanguage };
    setSettings(next);
    saveSettings(next);
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

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  useEffect(() => {
    if (!draft.cutoutBlob) {
      activePixelJob.current = null;
      setPixelJobStatus("idle");
      setStickerReadySeen(false);
      return;
    }
    if (draft.stickerBlob) {
      setPixelJobStatus("ready");
      return;
    }
    if (activePixelJob.current === draft.cutoutBlob) return;

    const cutoutBlob = draft.cutoutBlob;
    const border = draft.style.border;
    activePixelJob.current = cutoutBlob;
    setPixelJobStatus("generating");
    setStickerReadySeen(false);
    setDraft((current) => current.cutoutBlob === cutoutBlob ? { ...current, pixelError: undefined } : current);

    (async () => {
      try {
        const pixelBlob = await createPixelSticker(cutoutBlob);
        const stickerBlob = await makeStickerBlob(pixelBlob, border);
        if (activePixelJob.current === cutoutBlob) activePixelJob.current = null;
        setDraft((current) => current.cutoutBlob === cutoutBlob ? { ...current, pixelBlob, stickerBlob, pixelError: undefined } : current);
        setPixelJobStatus("ready");
        showToast(copy[language].add.readyToast);
      } catch (caught) {
        if (activePixelJob.current === cutoutBlob) activePixelJob.current = null;
        const message = caught instanceof Error ? caught.message : "Pixel sticker generation failed.";
        setDraft((current) => current.cutoutBlob === cutoutBlob ? { ...current, pixelError: message } : current);
        setPixelJobStatus("error");
      }
    })();
  }, [draft.cutoutBlob, draft.stickerBlob, draft.style.border, language, pixelRetryNonce]);

  useEffect(() => {
    if (location.pathname.startsWith("/app/add/details")) setStickerReadySeen(true);
  }, [location.pathname]);

  const saveRecord = async (asset: StickerAsset, record: FoodRecord) => {
    await putItem("assets", asset);
    await putItem("records", record);
    setDraft(initialDraft);
    setAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
    setRecords((current) => [record, ...current.filter((item) => item.id !== record.id)].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    showToast(copy[language].add.savedToast);
  };

  const saveCollage = async (collage: Collage) => {
    await putItem("collages", collage);
    setCollages((current) => [collage, ...current.filter((item) => item.id !== collage.id)]);
    showToast(copy[language].collage.savedToast);
  };

  const retryPixelSticker = () => {
    if (!draft.cutoutBlob) return;
    activePixelJob.current = null;
    setPixelRetryNonce((current) => current + 1);
  };

  const routeBundle = useMemo(() => ({ records, assets, urls, settings, collages }), [records, assets, urls, settings, collages]);
  const addTarget = draft.stickerBlob ? "/app/add/details" : draft.originalBlob ? "/app/add/preview" : "/app/add";
  const showStickerReadyBadge = pixelJobStatus === "ready" && Boolean(draft.stickerBlob) && !stickerReadySeen && !location.pathname.startsWith("/app/add");
  const shell = (children: React.ReactNode) => (
    <Shell language={language} addTarget={addTarget} stickerReady={showStickerReadyBadge} onOpenAdd={() => {
      if (showStickerReadyBadge) setStickerReadySeen(true);
    }}>
      {children}
    </Shell>
  );
  const zhFontPreviewShell = (children: React.ReactNode) => (
    <Shell className="zh-font-preview-shell" language="zh" addTarget={addTarget}>
      {children}
    </Shell>
  );

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing language={language} setLanguage={setLanguage} />} />
        <Route path="/app" element={shell(<Navigate to="/app/today" replace />)} />
        <Route path="/app/today" element={shell(<Today language={language} records={routeBundle.records} urls={routeBundle.urls} collages={routeBundle.collages} />)} />
        <Route path="/app/add" element={shell(<AddCapture language={language} draft={draft} setDraft={setDraft} toast={showToast} />)} />
        <Route path="/app/add/preview" element={shell(<StickerPreview language={language} draft={draft} pixelJobStatus={pixelJobStatus} retryPixelSticker={retryPixelSticker} />)} />
        <Route path="/app/add/details" element={shell(<RecordDetails language={language} draft={draft} settings={settings} onSave={saveRecord} />)} />
        <Route path="/app/add/saved" element={shell(<Saved language={language} />)} />
        <Route path="/app/calendar" element={shell(<CalendarView language={language} records={records} urls={urls} />)} />
        <Route path="/app/calendar/:date" element={shell(<DayDetail language={language} records={records} urls={urls} />)} />
        <Route path="/app/collage" element={shell(<CollageView language={language} records={records} urls={urls} collages={collages} saveCollage={saveCollage} />)} />
        <Route path="/app/collection" element={shell(<Collection language={language} records={records} urls={urls} />)} />
        <Route path="/app/stay-fit" element={<Navigate to="/app/collection" replace />} />
        <Route path="/app/zh-font-preview" element={zhFontPreviewShell(<ChineseFontPreview />)} />
        <Route path="/app/settings" element={shell(<SettingsView language={language} setLanguage={setLanguage} settings={settings} setSettings={setSettings} reload={reload} toast={showToast} />)} />
        <Route path="/today" element={<Navigate to="/app/today" replace />} />
        <Route path="/add/*" element={<Navigate to="/app/add" replace />} />
        <Route path="/calendar" element={<Navigate to="/app/calendar" replace />} />
        <Route path="/collage" element={<Navigate to="/app/collage" replace />} />
        <Route path="/collection" element={<Navigate to="/app/collection" replace />} />
        <Route path="/stay-fit" element={<Navigate to="/app/collection" replace />} />
        <Route path="/zh-font-preview" element={<Navigate to="/app/zh-font-preview" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
      </Routes>
      <Toast message={toast} />
    </>
  );
}
