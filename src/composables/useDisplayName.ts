import { ref, type Ref } from 'vue';
import { useLocale } from 'src/composables/useLocale';

/**
 * 顯示名稱（名牌上的名字）：整個網站共用一份（主頁、衣櫃、設定頁、小工具頁），存在 `lib_display_name`。
 * 沒改過名字也要把預設的「讀者-xxxx」存起來：帳號同步只帶存著的名字，沒存的話朋友那邊（好友清單、去他家）
 * 會變成後端補的「讀者-好友碼」，跟地圖上看到的不一樣。
 */
const STORAGE_KEY = 'lib_display_name';
export const MAX_DISPLAY_NAME = 20;

function read(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

let name: Ref<string> | null = null;

export function useDisplayName() {
  if (!name) {
    const { t } = useLocale();
    const saved = read(STORAGE_KEY);
    const uid = read('lib_uid');
    const initial = saved || (uid ? `${t.value.indexPage.displayNameDefaultPrefix}${uid.slice(-4)}` : '');
    if (!saved && initial) write(STORAGE_KEY, initial);
    name = ref(initial);
  }
  const displayName = name;

  // 主頁拿到（或新建）自己的 userId 之後呼叫：還沒有名字就給預設的「讀者-xxxx」並存起來
  function ensureDefault(userId: string): void {
    if (displayName.value) return;
    const { t } = useLocale();
    setDisplayName(`${t.value.indexPage.displayNameDefaultPrefix}${userId.slice(-4)}`);
  }

  // 改名：去掉前後空白、最多 20 字，空的就不改；回傳最後用的名字
  function setDisplayName(next: string): string {
    const normalized = next.trim().slice(0, MAX_DISPLAY_NAME) || displayName.value;
    displayName.value = normalized;
    write(STORAGE_KEY, normalized);
    return normalized;
  }

  // 登入時帳號同步把雲端的名字寫進 localStorage：畫面跟著換
  function reload(): void {
    const saved = read(STORAGE_KEY);
    if (saved) displayName.value = saved;
  }

  return { displayName, setDisplayName, ensureDefault, reload };
}
