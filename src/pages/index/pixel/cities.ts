// 各城市指標地圖的註冊表（CityScene 用）：新增城市要
// 1. 在 city.ts 的 CITY_ORDER 最後面加 id（座位接在最後面，後端 seatsPerZone 加 CITY_SEAT_COUNT、allowedScenes 加 id）
// 2. 寫一份資料（座位、店家）＋美術，匯出 CityDef，加到下面
// 3. 新的小吃 id 加進 cityItems.ts、pixelWorld 的 ShopItemId、後端 allowedShopItems
import type { CityDef, CityId } from './city';
import { TAINAN } from './tainanArt';
import { TAICHUNG } from './taichungArt';
import { KAOHSIUNG } from './kaohsiungArt';
import { TAMSUI } from './tamsuiArt';
import { SUNMOON } from './sunmoonArt';
import { HUALIEN } from './hualienArt';
import { KEELUNG } from './keelungArt';

export const CITIES: Record<CityId, CityDef> = {
  tainan: TAINAN,
  taichung: TAICHUNG,
  kaohsiung: KAOHSIUNG,
  tamsui: TAMSUI,
  sunmoon: SUNMOON,
  hualien: HUALIEN,
  keelung: KEELUNG,
};
