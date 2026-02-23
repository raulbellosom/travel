/**
 * imageOptimization.js
 *
 * Utility for generating stable, cache-friendly Appwrite preview URLs with
 * per-preset quality/size tuning. Works in tandem with Cloudflare CDN:
 * identical query params on the same fileId always produce the same URL, so
 * Cloudflare can serve the transformed image from edge cache instead of
 * hitting the Appwrite origin on every request.
 *
 * Presets
 * -------
 * thumb      – 300px / q40 / webp  → thumbnail strips, avatar lists
 * card       – 600px / q50 / webp  → listing grid cards (lazy-loaded)
 * detail-low – 900px / q60 / webp  → detail page first paint (blurred)
 * detail-hd  – 1400px / q80 / webp → detail page HD reveal (after viewport)
 *
 * Network-aware loading
 * ---------------------
 * Navigator.connection.effectiveType is used when available:
 *   slow-2g / 2g → skip HD entirely
 *   3g           → delay HD load by HD_DELAY_3G_MS
 *   4g / unknown → load HD at normal speed
 */

import env from "../env";

// ─── Presets ──────────────────────────────────────────────────────────────────

const IMAGE_PRESETS = {
  thumb: { width: 300, quality: 40, output: "webp" },
  card: { width: 600, quality: 50, output: "webp" },
  "detail-low": { width: 900, quality: 60, output: "webp" },
  "detail-hd": { width: 1400, quality: 80, output: "webp" },
  hero: { width: 1920, quality: 70, output: "webp" },
};

// Milliseconds to delay the HD request on a 3g connection so the low-quality
// version can finish painting before the heavier download starts.
const HD_DELAY_3G_MS = 1500;

// ─── Network detection ─────────────────────────────────────────────────────

/**
 * Returns the effective connection type string or "unknown" when the
 * Network Information API is not supported.
 *
 * @returns {"slow-2g"|"2g"|"3g"|"4g"|"unknown"}
 */
const getNetworkQuality = () => {
  const conn =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;
  if (!conn) return "unknown";
  return conn.effectiveType || "unknown";
};

/**
 * Returns true when the current connection is fast enough to load an HD image.
 * Falls back to true when Network Information API is not available so we
 * never silently break on unsupported browsers.
 */
const shouldLoadHD = () => {
  const q = getNetworkQuality();
  return q !== "slow-2g" && q !== "2g";
};

/**
 * Returns the number of milliseconds to wait before starting the HD request.
 * 0 on fast connections, HD_DELAY_3G_MS on 3g, 0 on unknown (safe default).
 */
const getHDDelay = () => {
  const q = getNetworkQuality();
  return q === "3g" ? HD_DELAY_3G_MS : 0;
};

// ─── URL builder ──────────────────────────────────────────────────────────────

/**
 * Builds a stable Appwrite preview URL for the given fileId and preset.
 *
 * URL format:
 *   {APPWRITE_ENDPOINT}/storage/buckets/{bucketId}/files/{fileId}/preview
 *   ?width={w}&height=0&quality={q}&output=webp&project={projectId}
 *
 * The parameter list is always in the same order so Cloudflare's cache key
 * (full URL including query string) is deterministic across renders.
 *
 * @param {string} fileId   - Appwrite file $id
 * @param {string} preset   - One of the IMAGE_PRESETS keys
 * @param {string} [bucketId] - Override bucket; defaults to resourceImages bucket
 * @returns {string} Absolute URL or "" if config is incomplete
 */
const buildPreviewUrl = (fileId, preset, bucketId) => {
  const endpoint = String(env.appwrite.endpoint || "").replace(/\/+$/, "");
  const projectId = env.appwrite.projectId;
  const resolvedBucketId =
    bucketId ||
    env.appwrite.buckets.resourceImages ||
    env.appwrite.buckets.propertyImages;

  if (!endpoint || !projectId || !resolvedBucketId || !fileId) return "";

  const config = IMAGE_PRESETS[preset] || IMAGE_PRESETS.card;

  // Explicit array order guarantees a stable query string for caching.
  // Do NOT include height — Appwrite auto-calculates height from width to
  // preserve aspect ratio. Some self-hosted versions reject height=0.
  const params = new URLSearchParams([
    ["width", String(config.width)],
    ["quality", String(config.quality)],
    ["output", config.output],
    ["project", projectId],
  ]);

  return `${endpoint}/storage/buckets/${resolvedBucketId}/files/${fileId}/preview?${params.toString()}`;
};

/**
 * Public helper. Returns an optimized Appwrite preview URL.
 *
 * @param {string} fileId
 * @param {"thumb"|"card"|"detail-low"|"detail-hd"} preset
 * @param {string} [bucketId]
 * @returns {string}
 */
const getOptimizedImage = (fileId, preset, bucketId) =>
  buildPreviewUrl(fileId, preset, bucketId);

/**
 * Builds a raw Appwrite /view URL (original file, no transformations).
 * Used as a fallback when the /preview endpoint fails.
 *
 * @param {string} fileId
 * @param {string} [bucketId]
 * @returns {string}
 */
const getFileViewUrl = (fileId, bucketId) => {
  const endpoint = String(env.appwrite.endpoint || "").replace(/\/+$/, "");
  const projectId = env.appwrite.projectId;
  const resolvedBucketId =
    bucketId ||
    env.appwrite.buckets.resourceImages ||
    env.appwrite.buckets.propertyImages;

  if (!endpoint || !projectId || !resolvedBucketId || !fileId) return "";

  return `${endpoint}/storage/buckets/${resolvedBucketId}/files/${fileId}/view?project=${projectId}`;
};

export {
  IMAGE_PRESETS,
  HD_DELAY_3G_MS,
  getNetworkQuality,
  shouldLoadHD,
  getHDDelay,
  buildPreviewUrl,
  getOptimizedImage,
  getFileViewUrl,
};
