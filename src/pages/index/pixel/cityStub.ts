// 暫時的：新城市還在畫的時候先用這個佔位（畫好就換掉，全部換完刪掉這份）
import type { CityDef, CityId, Country } from './city';
import { T } from './cityArt';

export function stubCity(id: CityId, country: Country, line: NonNullable<CityDef['line']>, zh: string, en: string, emoji: string): CityDef {
  return {
    id,
    country,
    line,
    W: 40,
    H: 30,
    title: { 'zh-TW': zh, 'en-US': en },
    stop: { 'zh-TW': zh, 'en-US': en },
    emoji,
    station: { x: 20, y: 6, name: { 'zh-TW': '車站', 'en-US': 'Station' }, arrive: { x: 20, y: 8 } },
    background: '#d6d3cb',
    soundscape: 'city',
    paintGround: (c) => {
      c.fillStyle = '#d6d3cb';
      c.fillRect(0, 0, 40 * T, 30 * T);
    },
    props: [],
    solid: [],
    seats: Array.from({ length: 12 }, (_, i) => ({ x: 6 + (i % 6) * 5, y: 16 + Math.floor(i / 6) * 6, facing: 'down' as const })),
    drawSeat: () => undefined,
    shops: [],
    infos: [],
    labels: [],
    walkers: [],
    traffic: [],
    lights: [],
    hintDesktop: { 'zh-TW': '', 'en-US': '' },
    hintTouch: { 'zh-TW': '', 'en-US': '' },
  };
}
