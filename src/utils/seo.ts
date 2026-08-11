import type { LocaleKey } from 'src/composables/useLocale';

export interface RouteSeoMeta {
  title?: Partial<Record<LocaleKey, string>>;
  description?: Partial<Record<LocaleKey, string>>;
  robots?: string;
}

const SITE_URL = 'https://focus-island.huangyanming.com';
const SEO_IMAGE_URL = 'https://imgs.huangyanming.com/Focus-Island.png';

const DEFAULT_SEO: Record<LocaleKey, { title: string; description: string }> = {
  'en-US': {
    title: 'Focus Island | Online Study Room & Pomodoro Timer',
    description:
      'Focus Island is a visual online study room with synced seats, a Pomodoro timer, ambient sound, and daily focus tracking.',
  },
  'zh-TW': {
    title: 'Focus Island | 專注自習室與番茄鐘',
    description: 'Focus Island 是可視化的線上專注自習室，提供座位同步、番茄鐘、白噪音與每日專注進度追蹤。',
  },
};

const OG_LOCALE: Record<LocaleKey, string> = {
  'en-US': 'en_US',
  'zh-TW': 'zh_TW',
};

const HTML_LANG: Record<LocaleKey, string> = {
  'en-US': 'en',
  'zh-TW': 'zh-Hant-TW',
};

function upsertMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;

  let tag = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  if (typeof document === 'undefined') return;

  let tag = document.head.querySelector('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

/**
 * Applies both route-level SEO (title/description per path) and the current
 * UI locale (html lang, og:locale) to <head>. Called on every route change
 * AND every language toggle — a crawler or share-card unfurler only ever
 * sees whichever state was current when it fetched the page, so this needs
 * to reflect both dimensions, not just routing.
 */
export function applySeoMeta(path: string, locale: LocaleKey, seo?: RouteSeoMeta) {
  if (typeof document === 'undefined') return;

  const fallback = DEFAULT_SEO[locale];
  const routeTitle = seo?.title?.[locale];
  const routeDescription = seo?.description?.[locale];

  const title = routeTitle ? `${routeTitle} | Focus Island` : fallback.title;
  const description = routeDescription || fallback.description;
  const robots = seo?.robots || 'index,follow';
  const canonical = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const alternateLocale: LocaleKey = locale === 'en-US' ? 'zh-TW' : 'en-US';

  document.documentElement.lang = HTML_LANG[locale];
  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('name', 'robots', robots);
  upsertMeta('property', 'og:site_name', 'Focus Island');
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:image', SEO_IMAGE_URL);
  upsertMeta('property', 'og:locale', OG_LOCALE[locale]);
  upsertMeta('property', 'og:locale:alternate', OG_LOCALE[alternateLocale]);
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', SEO_IMAGE_URL);
  upsertCanonical(canonical);
}
