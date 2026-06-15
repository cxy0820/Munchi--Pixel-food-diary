import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import sharp from "sharp";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const dist = path.resolve(projectRoot, "dist");
const app = express();
const port = Number(process.env.PORT || 5173);
const csrfToken = crypto.randomBytes(32).toString("hex");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 }
});

const rateWindowMs = 60_000;
const rateLimit = 20;
const hits = new Map();

const isImageBuffer = (buffer) => {
  if (!buffer || buffer.length < 12) return false;
  const png = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const jpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const webp = buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  const heic = buffer.toString("ascii", 4, 12).includes("ftyphei") || buffer.toString("ascii", 4, 12).includes("ftypmif");
  return png || jpg || webp || heic;
};

const extensionForMime = (mimetype) => {
  const extensions = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif"
  };
  return extensions[mimetype] || ".jpg";
};

const removeBackgroundWithRembg = async (file) => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "munchi-rembg-"));
  const inputPath = path.join(tempDir, `input${extensionForMime(file.mimetype)}`);
  const outputPath = path.join(tempDir, "output.png");
  const pythonPath =
    process.env.REMBG_PYTHON ||
    path.join(projectRoot, ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
  const scriptPath = path.join(projectRoot, "scripts", "rembg_remove.py");
  const modelHome = process.env.U2NET_HOME || path.join(projectRoot, "models", "rembg");
  const requestedModel = process.env.REMBG_MODEL || "u2netp";
  const model = process.env.RENDER && requestedModel === "u2net" && process.env.ALLOW_HEAVY_REMBG !== "true" ? "u2netp" : requestedModel;
  const timeout = Number(process.env.REMBG_TIMEOUT_MS || 300_000);

  try {
    await writeFile(inputPath, file.buffer);
    await new Promise((resolve, reject) => {
      execFile(
        pythonPath,
        [scriptPath, "--model", model, inputPath, outputPath],
        {
          cwd: projectRoot,
          env: {
            ...process.env,
            U2NET_HOME: modelHome,
            PYTHONIOENCODING: "utf-8",
            OMP_NUM_THREADS: process.env.OMP_NUM_THREADS || "1",
            OPENBLAS_NUM_THREADS: process.env.OPENBLAS_NUM_THREADS || "1",
            MKL_NUM_THREADS: process.env.MKL_NUM_THREADS || "1",
            NUMEXPR_NUM_THREADS: process.env.NUMEXPR_NUM_THREADS || "1",
            VECLIB_MAXIMUM_THREADS: process.env.VECLIB_MAXIMUM_THREADS || "1"
          },
          maxBuffer: 1024 * 1024,
          timeout,
          windowsHide: true
        },
        (error, _stdout, stderr) => {
          if (error) {
            error.stderr = stderr;
            reject(error);
            return;
          }
          resolve();
        }
      );
    });
    return readFile(outputPath);
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
};

let briaServerCutoutPromise;

const loadBriaServerCutout = async () => {
  if (!briaServerCutoutPromise) {
    briaServerCutoutPromise = import("@huggingface/transformers").then(async ({ AutoModel, AutoProcessor, RawImage, env }) => {
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      env.cacheDir = path.join(projectRoot, "models", "bria-rmbg");
      const onnxWasm = env.backends?.onnx?.wasm;
      if (onnxWasm) {
        onnxWasm.numThreads = 1;
        onnxWasm.proxy = false;
      }
      const [model, processor] = await Promise.all([
        AutoModel.from_pretrained("briaai/RMBG-1.4", { dtype: "q8", subfolder: "onnx" }),
        AutoProcessor.from_pretrained("briaai/RMBG-1.4")
      ]);
      return { model, processor, RawImage };
    }).catch((error) => {
      briaServerCutoutPromise = undefined;
      throw error;
    });
  }
  return briaServerCutoutPromise;
};

const removeBackgroundWithBria = async (file) => {
  const { model, processor, RawImage } = await loadBriaServerCutout();
  const rawImage = await RawImage.fromBlob(new Blob([file.buffer], { type: file.mimetype }));
  const pixelCount = rawImage.width * rawImage.height;
  if (pixelCount > 9_000_000) {
    const error = new Error("Image is too large for local BRIA cutout.");
    error.code = "IMAGE_TOO_LARGE";
    throw error;
  }

  const processed = await processor(rawImage);
  const output = await model({ input: processed.pixel_values });
  const mask = await RawImage.fromTensor(output.output[0].mul(255).to("uint8"));
  const resizedMask = await mask.resize(rawImage.width, rawImage.height);
  const source = rawImage.data;
  const channels = rawImage.channels || 4;
  const rgba = Buffer.alloc(pixelCount * 4);

  for (let pixelIndex = 0, alphaIndex = 0; pixelIndex < rgba.length; pixelIndex += 4, alphaIndex += 1) {
    const sourceIndex = alphaIndex * channels;
    const red = source[sourceIndex] ?? 0;
    rgba[pixelIndex] = red;
    rgba[pixelIndex + 1] = channels > 1 ? source[sourceIndex + 1] ?? red : red;
    rgba[pixelIndex + 2] = channels > 2 ? source[sourceIndex + 2] ?? red : red;
    rgba[pixelIndex + 3] = Math.round(((channels > 3 ? source[sourceIndex + 3] ?? 255 : 255) * (resizedMask.data[alphaIndex] ?? 0)) / 255);
  }

  return sharp(rgba, {
    raw: { width: rawImage.width, height: rawImage.height, channels: 4 }
  }).png().toBuffer();
};

const securityHeaders = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' blob: data:; connect-src 'self' https://huggingface.co https://*.huggingface.co https://*.hf.co; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' blob: 'wasm-unsafe-eval'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"
  );
  if (_req.secure) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
};

const limiter = (req, res, next) => {
  const key = req.ip || "local";
  const now = Date.now();
  const item = hits.get(key);
  if (!item || now - item.start > rateWindowMs) {
    hits.set(key, { start: now, count: 1 });
    next();
    return;
  }
  item.count += 1;
  if (item.count > rateLimit) {
    res.status(429).json({ error: "Too many sticker requests. Please wait a minute and try again." });
    return;
  }
  next();
};

app.disable("x-powered-by");
app.use(securityHeaders);
app.use(express.json({ limit: "32kb" }));

app.get("/api/csrf-token", (_req, res) => {
  res.json({ token: csrfToken });
});

app.post("/api/bria-cutout", limiter, upload.single("image_file"), async (req, res) => {
  if (req.headers["x-csrf-token"] !== csrfToken) {
    res.status(403).json({ error: "The sticker request could not be verified. Refresh and try again." });
    return;
  }

  if (process.env.DISABLE_HOSTED_BRIA_CUTOUT === "true") {
    res.status(503).json({ error: "BRIA cutout is paused on this server." });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "Upload a photo before creating a sticker." });
    return;
  }

  if (!["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"].includes(req.file.mimetype) || !isImageBuffer(req.file.buffer)) {
    res.status(400).json({ error: "Upload a PNG, JPG, WebP, or HEIC image." });
    return;
  }

  try {
    const result = await removeBackgroundWithBria(req.file);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.send(result);
  } catch (error) {
    if (error?.code === "IMAGE_TOO_LARGE") {
      res.status(413).json({ error: "This photo is too large for local BRIA cutout. Try a smaller image." });
      return;
    }
    res.status(502).json({ error: "Local BRIA cutout could not remove the background. Refresh and try another clear photo." });
  }
});

app.post("/api/remove-background", limiter, upload.single("image_file"), async (req, res) => {
  if (req.headers["x-csrf-token"] !== csrfToken) {
    res.status(403).json({ error: "The sticker request could not be verified. Refresh and try again." });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "Upload a photo before creating a sticker." });
    return;
  }

  if (!["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"].includes(req.file.mimetype) || !isImageBuffer(req.file.buffer)) {
    res.status(400).json({ error: "Upload a PNG, JPG, WebP, or HEIC image." });
    return;
  }

  if (process.env.ENABLE_SERVER_BACKGROUND_REMOVAL !== "true") {
    res.status(503).json({ error: "Server background removal is paused while browser cutout is enabled." });
    return;
  }

  let provider = (process.env.BACKGROUND_PROVIDER || "removebg").toLowerCase();
  if (provider === "rembg" && (process.env.ALLOW_LOCAL_REMBG !== "true" || process.env.RENDER)) {
    if (!process.env.REMOVE_BG_API_KEY) {
      res.status(503).json({ error: "Hosted local rembg is disabled. Set BACKGROUND_PROVIDER=removebg and add REMOVE_BG_API_KEY." });
      return;
    }
    provider = "removebg";
  }

  if (provider === "removebg") {
    if (process.env.ENABLE_REMOVE_BG_PROVIDER !== "true") {
      res.status(503).json({ error: "remove.bg backup is paused while BRIA cutout is enabled." });
      return;
    }

    if (!process.env.REMOVE_BG_API_KEY) {
      res.status(503).json({ error: "remove.bg is not configured. Add REMOVE_BG_API_KEY to .env and restart the server." });
      return;
    }

    const form = new FormData();
    form.append("image_file", new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname || "photo.jpg");
    form.append("size", "auto");
    form.append("format", "png");

    try {
      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": process.env.REMOVE_BG_API_KEY },
        body: form
      });

      if (!response.ok) {
        const fallback = {
          400: "remove.bg could not read this image. Try a PNG, JPG, WebP, or HEIC photo.",
          402: "remove.bg has no credits left for this account.",
          403: "remove.bg rejected the API key. Check REMOVE_BG_API_KEY.",
          429: "remove.bg is rate limiting requests. Please try again soon."
        };
        const text = await response.text().catch(() => "");
        res.status(response.status).json({ error: fallback[response.status] || text || "remove.bg could not remove the background." });
        return;
      }

      const result = Buffer.from(await response.arrayBuffer());
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "no-store");
      res.send(result);
    } catch {
      res.status(502).json({ error: "Could not reach remove.bg. Check your network and try again." });
    }
    return;
  }

  if (provider === "rembg") {
    try {
      const result = await removeBackgroundWithRembg(req.file);
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "no-store");
      res.send(result);
    } catch (error) {
      if (error?.code === "ENOENT") {
        res.status(503).json({ error: "Local rembg is not installed. Run the rembg setup in this project and restart the server." });
        return;
      }
      if (error?.killed || error?.signal === "SIGTERM") {
        res.status(504).json({ error: "Local rembg took too long. Try a smaller image or increase REMBG_TIMEOUT_MS." });
        return;
      }
      res.status(502).json({ error: "Local rembg could not remove the background. Try a PNG, JPG, WebP, or HEIC photo." });
    }
    return;
  }

  const form = new FormData();
  form.append("image_file", new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname || "photo.jpg");

  if (provider !== "clipdrop") {
    res.status(503).json({ error: "Unknown background removal provider. Use BACKGROUND_PROVIDER=removebg, rembg, or clipdrop." });
    return;
  }

  if (!process.env.CLIPDROP_API_KEY) {
    res.status(503).json({ error: "Clipdrop is not configured. Add CLIPDROP_API_KEY to .env and restart the server." });
    return;
  }

  try {
    const response = await fetch("https://clipdrop-api.co/remove-background/v1", {
      method: "POST",
      headers: { "x-api-key": process.env.CLIPDROP_API_KEY },
      body: form
    });

    if (!response.ok) {
      const fallback = {
        401: "Clipdrop rejected the API key. Check CLIPDROP_API_KEY.",
        402: "Clipdrop has no credits left for this account.",
        403: "Clipdrop says this API key cannot use background removal.",
        429: "Clipdrop is rate limiting requests. Please try again soon."
      };
      const text = await response.text().catch(() => "");
      res.status(response.status).json({ error: fallback[response.status] || text || "Clipdrop could not remove the background." });
      return;
    }

    const result = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.send(result);
  } catch {
    res.status(502).json({ error: "Could not reach Clipdrop. Check your network and try again." });
  }
});

app.post("/api/analyze-food", limiter, upload.single("image_file"), async (req, res) => {
  if (req.headers["x-csrf-token"] !== csrfToken) {
    res.status(403).json({ error: "The food analysis request could not be verified. Refresh and try again." });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(503).json({ error: "Food recognition is not configured. Add OPENAI_API_KEY to .env and restart the server." });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "Upload a photo before analyzing food." });
    return;
  }

  if (!["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"].includes(req.file.mimetype) || !isImageBuffer(req.file.buffer)) {
    res.status(400).json({ error: "Upload a PNG, JPG, WebP, or HEIC image." });
    return;
  }

  const language = req.body?.language === "zh" ? "zh" : "en";
  const responseLanguage = language === "zh" ? "Simplified Chinese" : "English";
  const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.5",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Identify the main food or drink in this image for a cozy pixel food diary. Return the name and note in ${responseLanguage}. Keep category as one exact English enum value. Return a short memory-friendly note. Do not give medical, dieting, or nutrition advice.`
              },
              {
                type: "input_image",
                image_url: dataUrl
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "food_sticker_analysis",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string" },
                category: {
                  type: "string",
                  enum: ["Milk tea", "Coffee", "Drink", "Meal", "Dessert", "Snack", "Fruit", "Homemade", "Restaurant", "Other"]
                },
                confidence: { type: "string", enum: ["low", "medium", "high"] },
                note: { type: "string" }
              },
              required: ["name", "category", "confidence", "note"]
            }
          }
        }
      })
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const fallback = {
        401: "OpenAI rejected the API key. Check OPENAI_API_KEY.",
        429: "OpenAI is rate limiting requests. Please try again soon."
      };
      res.status(response.status).json({ error: fallback[response.status] || body.error?.message || "Food recognition failed." });
      return;
    }

    const text = body.output_text || body.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
    if (!text) {
      res.status(502).json({ error: "Food recognition returned no result." });
      return;
    }
    res.json(JSON.parse(text));
  } catch {
    res.status(502).json({ error: "Could not analyze the food photo. Check your network and try again." });
  }
});

app.post("/api/pixel-sticker", limiter, upload.single("image_file"), async (req, res) => {
  if (req.headers["x-csrf-token"] !== csrfToken) {
    res.status(403).json({ error: "The pixel sticker request could not be verified. Refresh and try again." });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(503).json({ error: "Pixel sticker generation is not configured. Add OPENAI_API_KEY to .env and restart the server." });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "Create a cutout before generating a pixel sticker." });
    return;
  }

  if (!["image/png", "image/jpeg", "image/webp"].includes(req.file.mimetype) || !isImageBuffer(req.file.buffer)) {
    res.status(400).json({ error: "Upload a PNG, JPG, or WebP cutout." });
    return;
  }

  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1");
  form.append("image", new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname || "cutout.png");
  form.append("prompt", "Create warm pixel art for a cozy food diary app. Turn the input food or drink cutout into a single centered sticker-like game item icon with a transparent background. Preserve the main food identity and readable silhouette. No text, no UI, no logo, no hands, no extra objects, no plate unless the plate is part of the input.");
  form.append("size", "1024x1024");
  form.append("background", "transparent");
  form.append("output_format", "png");

  try {
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: form
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const fallback = {
        400: "OpenAI could not create a pixel sticker from this image. Try another photo.",
        401: "OpenAI rejected the API key. Check OPENAI_API_KEY.",
        429: "OpenAI is rate limiting pixel sticker requests. Please try again soon."
      };
      res.status(response.status).json({ error: fallback[response.status] || body.error?.message || "Pixel sticker generation failed." });
      return;
    }

    const b64 = body.data?.[0]?.b64_json;
    if (!b64) {
      res.status(502).json({ error: "Pixel sticker generation returned no image." });
      return;
    }

    const result = Buffer.from(b64, "base64");
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.send(result);
  } catch {
    res.status(502).json({ error: "Could not create the pixel sticker. Check your network and try again." });
  }
});

app.use(express.static(dist, {
  index: false,
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-store");
  }
}));
app.use((req, res, next) => {
  if (req.path.startsWith("/assets/") || req.path.startsWith("/models/")) {
    res.status(404).type("text/plain").send("Not found");
    return;
  }
  next();
});
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(path.join(dist, "index.html"), (error) => {
    if (error) next();
  });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Munchi running at http://127.0.0.1:${port}`);
  console.log("For phone testing, open http://YOUR-COMPUTER-IP:" + port);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
