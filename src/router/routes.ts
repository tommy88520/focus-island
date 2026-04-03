import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue'),
        meta: {
          seo: {
            title: '線上專注自習室',
            description: '即時座位同步的線上自習室，搭配番茄鐘與白噪音，幫助你維持深度專注。',
            robots: 'index,follow',
          },
        },
      },
      {
        path: 'progress',
        component: () => import('pages/ProgressPage.vue'),
        meta: {
          seo: {
            title: '今日專注進度',
            description: '查看今日完成的專注次數、累積分鐘與時數，追蹤你的學習節奏。',
            robots: 'index,follow',
          },
        },
      },
      {
        path: 'test-ws',
        component: () => import('pages/TestWSPage.vue'),
        meta: {
          seo: {
            title: 'WebSocket 測試頁',
            description: '內部連線測試頁面。',
            robots: 'noindex,nofollow',
          },
        },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
    meta: {
      seo: {
        title: '找不到頁面',
        description: '你要找的頁面不存在，請返回 Focus Island 首頁。',
        robots: 'noindex,nofollow',
      },
    },
  },
];

export default routes;
