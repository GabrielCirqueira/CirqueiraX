const ALLOWED = /^https:\/\/([a-z0-9-]+\.)*(googleusercontent\.com|ggpht\.com|ytimg\.com)\//i;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'ytms-color') return;
  if (typeof msg.url !== 'string' || !ALLOWED.test(msg.url)) {
    sendResponse({ color: null });
    return;
  }
  dominantColor(msg.url)
    .then((color) => sendResponse({ color }))
    .catch(() => sendResponse({ color: null }));
  return true;
});

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
function hslToRgb(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const hue = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)].map((v) => Math.round(v * 255));
}

async function dominantColor(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const bmp = await createImageBitmap(await res.blob(), { resizeWidth: 48, resizeHeight: 48, resizeQuality: 'low' });
  const canvas = new OffscreenCanvas(48, 48);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0);
  const { data } = ctx.getImageData(0, 0, 48, 48);

  const bins = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (data[i + 3] < 200) continue;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const light = (max + min) / 510;
    if (light < 0.08 || light > 0.92) continue;
    const sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
    const w = 0.35 + sat;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const e = bins.get(key) || { w: 0, r: 0, g: 0, b: 0 };
    e.w += w; e.r += r * w; e.g += g * w; e.b += b * w;
    bins.set(key, e);
  }
  let best = null;
  for (const e of bins.values()) if (!best || e.w > best.w) best = e;
  if (!best) return null;

  let [h, s, l] = rgbToHsl(best.r / best.w, best.g / best.w, best.b / best.w);
  s = Math.min(s, 0.68);
  l = Math.max(0.28, Math.min(l, 0.40));
  const [r, g, b] = hslToRgb(h, s, l);
  return `rgb(${r
}, ${g
}, ${b
})`;
}
