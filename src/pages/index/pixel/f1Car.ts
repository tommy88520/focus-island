// F1 賽車（俯視、車頭朝右）：前後翼、寬胎、懸吊臂、側箱塗裝、引擎蓋、駕駛艙裡的安全帽和 Halo 護環。
// 每種塗裝先畫成一張 36×17 的小圖存起來，畫的時候轉到車頭方向；尾燈另外一閃一閃。
// F1 賽車場、台北台中高雄大獎賽、車庫裡停的車都用這一台。
import { px } from './pixelUtil';

// 可以選的塗裝（順序 = 編號，會存在帳號、送給同房間的人；只能加在最後面，最多 16 種）
export const LIVERIES: { name: { 'zh-TW': string; 'en-US': string }; body: string; accent: string; helmet: string }[] = [
  { name: { 'zh-TW': '黃色閃電', 'en-US': 'Yellow Flash' }, body: '#f6c945', accent: '#2b2d33', helmet: '#e25a4a' },
  { name: { 'zh-TW': '烈焰紅', 'en-US': 'Blaze Red' }, body: '#d72d2d', accent: '#f6c945', helmet: '#f6c945' },
  { name: { 'zh-TW': '薄荷綠', 'en-US': 'Mint' }, body: '#2fb3a6', accent: '#2b2d33', helmet: '#f4f4f4' },
  { name: { 'zh-TW': '木瓜橘', 'en-US': 'Papaya' }, body: '#f2a541', accent: '#5b6ee1', helmet: '#5b6ee1' },
  { name: { 'zh-TW': '深海藍', 'en-US': 'Deep Blue' }, body: '#3b4fbf', accent: '#e25a4a', helmet: '#f6c945' },
  { name: { 'zh-TW': '珍珠白', 'en-US': 'Pearl White' }, body: '#e8e8ee', accent: '#2fb3a6', helmet: '#2fb3a6' },
  { name: { 'zh-TW': '賽道綠', 'en-US': 'Racing Green' }, body: '#3f8f4f', accent: '#f6c945', helmet: '#f6c945' },
  { name: { 'zh-TW': '紫電', 'en-US': 'Violet' }, body: '#8b5cf6', accent: '#f4f4f4', helmet: '#f4f4f4' },
  { name: { 'zh-TW': '櫻花粉', 'en-US': 'Sakura Pink' }, body: '#f06292', accent: '#2b2d33', helmet: '#ffffff' },
];

export function livery(index: number | undefined): (typeof LIVERIES)[number] {
  return LIVERIES[index ?? 0] ?? LIVERIES[0] ?? { name: { 'zh-TW': '', 'en-US': '' }, body: '#f6c945', accent: '#2b2d33', helmet: '#e25a4a' };
}

// 選車面板的預覽圖（車頭朝上、放大 3 倍）
export function liveryPreview(index: number): string {
  const l = livery(index);
  const canvas = document.createElement('canvas');
  canvas.width = CAR_H * 3 + 6;
  canvas.height = CAR_W * 3 + 6;
  const c = canvas.getContext('2d');
  if (!c) return '';
  c.imageSmoothingEnabled = false;
  c.translate(canvas.width / 2, canvas.height / 2);
  c.rotate(-Math.PI / 2);
  c.scale(3, 3);
  c.drawImage(sprite(l.body, l.accent, l.helmet), -CAR_W / 2, -Math.floor(CAR_H / 2));
  return canvas.toDataURL();
}

const CAR_W = 36;
const CAR_H = 17;
const cache = new Map<string, HTMLCanvasElement>();

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `rgb(${ch((n >> 16) & 255)}, ${ch((n >> 8) & 255)}, ${ch(n & 255)})`;
}

function sprite(body: string, accent: string, helmet: string): HTMLCanvasElement {
  const key = `${body}|${accent}|${helmet}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = CAR_W;
  canvas.height = CAR_H;
  const c = canvas.getContext('2d');
  if (!c) return canvas;
  const dark = shade(body, -0.35);
  const light = shade(body, 0.3);
  const accentDark = shade(accent, -0.3);
  const carbon = '#1b1c22';
  const tire = '#121318';
  const tread = '#3a3c46';
  const silver = '#8d93a3';
  const fill = (x0: number, x1: number, y0: number, y1: number, color: string) => px(c, color, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  const mirror = (x0: number, x1: number, y0: number, y1: number, color: string) => {
    fill(x0, x1, y0, y1, color);
    fill(x0, x1, CAR_H - 1 - y1, CAR_H - 1 - y0, color);
  };
  // 底板（碳纖維，比車身寬一點）
  fill(4, 22, 4, 12, carbon);
  fill(23, 27, 6, 10, carbon);
  // 後胎、前胎（胎面有一條亮紋）
  mirror(3, 9, 0, 3, tire);
  mirror(4, 8, 1, 1, tread);
  mirror(25, 29, 1, 3, tire);
  mirror(26, 28, 1, 1, tread);
  // 懸吊臂
  mirror(6, 6, 4, 4, silver);
  mirror(8, 8, 4, 4, silver);
  mirror(26, 26, 4, 5, silver);
  mirror(28, 28, 4, 6, silver);
  // 後翼：兩片翼板＋端板、中間的支柱
  fill(0, 2, 2, 14, accent);
  fill(0, 0, 2, 14, accentDark);
  fill(1, 1, 3, 13, shade(accent, 0.25));
  mirror(0, 2, 1, 1, carbon);
  fill(3, 3, 7, 9, carbon);
  // 車身：引擎蓋往後收窄，側箱最寬
  fill(4, 8, 6, 10, body);
  fill(9, 19, 5, 11, body);
  mirror(9, 19, 5, 5, dark);
  // 側箱上的塗裝條紋
  mirror(11, 18, 6, 6, accent);
  // 進氣口（側箱前緣）
  mirror(19, 19, 5, 6, carbon);
  // 引擎蓋中線（亮）、空氣盒
  fill(5, 19, 8, 8, light);
  fill(17, 19, 7, 9, dark);
  fill(18, 18, 8, 8, carbon);
  // 車號貼紙
  fill(12, 13, 8, 8, '#ffffff');
  // 駕駛艙：開口、安全帽、Halo 護環
  fill(20, 24, 6, 10, body);
  fill(20, 23, 7, 9, carbon);
  fill(21, 22, 7, 9, helmet);
  fill(21, 21, 7, 7, shade(helmet, 0.4));
  fill(22, 22, 8, 9, shade(helmet, -0.35));
  mirror(20, 23, 6, 6, '#c9ccd6');
  fill(24, 25, 8, 8, '#c9ccd6');
  // 車鼻：往前收窄
  fill(25, 29, 7, 9, body);
  fill(25, 29, 7, 7, light);
  fill(30, 32, 8, 8, body);
  mirror(30, 31, 7, 7, dark);
  // 前翼：主翼＋翼片＋端板
  fill(33, 33, 2, 14, accent);
  fill(34, 34, 1, 15, shade(accent, 0.2));
  fill(35, 35, 1, 15, accentDark);
  mirror(33, 35, 1, 1, carbon);
  fill(32, 32, 7, 9, carbon);
  cache.set(key, canvas);
  return canvas;
}

// (x, y) 是車子中心的像素座標；angle 是車頭方向（弧度）
export function drawF1Car(c: CanvasRenderingContext2D, x: number, y: number, angle: number, body: string, accent: string, seconds: number, helmet = '#f6c945'): void {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.rotate(angle);
  // 影子（往右下偏一點）
  c.fillStyle = 'rgba(0, 0, 0, 0.35)';
  c.beginPath();
  c.roundRect(-CAR_W / 2 + 2, -CAR_H / 2 + 3, CAR_W - 2, CAR_H - 2, 4);
  c.fill();
  c.drawImage(sprite(body, accent, helmet), -CAR_W / 2, -Math.floor(CAR_H / 2));
  // 尾燈（雨燈）一閃一閃
  if (Math.floor(seconds * 4) % 2 === 0) px(c, '#ff3030', -CAR_W / 2 - 1, -1, 2, 2);
  c.restore();
}
