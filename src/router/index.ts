import { defineRouter } from '#q-app/wrappers';
import { watch } from 'vue';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useLocale } from 'src/composables/useLocale';
import { applySeoMeta, type RouteSeoMeta } from 'src/utils/seo';

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

  const { locale } = useLocale();

  Router.afterEach((to) => {
    applySeoMeta(to.path, locale.value, to.meta?.seo as RouteSeoMeta | undefined);
  });

  // A language toggle doesn't trigger navigation, so re-apply SEO meta for
  // the current route whenever the user switches locale.
  watch(locale, () => {
    const current = Router.currentRoute.value;
    applySeoMeta(current.path, locale.value, current.meta?.seo as RouteSeoMeta | undefined);
  });

  return Router;
});
