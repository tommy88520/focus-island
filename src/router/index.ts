import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';

interface RouteSeoMeta {
  title?: string;
  description?: string;
  robots?: string;
}

const DEFAULT_SEO: Required<RouteSeoMeta> = {
  title: 'Focus Island | 專注自習室與番茄鐘',
  description: 'Focus Island 是可視化的線上專注自習室，提供座位同步、番茄鐘、白噪音與每日專注進度追蹤。',
  robots: 'index,follow',
};

const SITE_URL = 'https://focus-island.huangyanming.com';

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

function applySeoMeta(path: string, seo?: RouteSeoMeta) {
  if (typeof document === 'undefined') return;

  const title = seo?.title ? `${seo.title} | Focus Island` : DEFAULT_SEO.title;
  const description = seo?.description || DEFAULT_SEO.description;
  const robots = seo?.robots || DEFAULT_SEO.robots;
  const canonical = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('name', 'robots', robots);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertCanonical(canonical);
}

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.afterEach((to) => {
    applySeoMeta(to.path, to.meta?.seo as RouteSeoMeta | undefined);
  });

  return Router;
});
