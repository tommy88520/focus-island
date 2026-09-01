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
            title: { 'en-US': 'Online Study Room', 'zh-TW': '線上專注自習室' },
            description: {
              'en-US':
                'A live seat-synced online study room with a Pomodoro timer and ambient sound to help you stay in deep focus.',
              'zh-TW': '即時座位同步的線上自習室，搭配番茄鐘與白噪音，幫助你維持深度專注。',
            },
            robots: 'index,follow',
          },
        },
      },
      {
        path: 'progress',
        component: () => import('pages/ProgressPage.vue'),
        meta: {
          seo: {
            title: { 'en-US': "Today's Focus Progress", 'zh-TW': '今日專注進度' },
            description: {
              'en-US':
                'See how many focus sessions you completed today, plus total minutes and hours, to track your study rhythm.',
              'zh-TW': '查看今日完成的專注次數、累積分鐘與時數，追蹤你的學習節奏。',
            },
            robots: 'index,follow',
          },
        },
      },
    ],
  },

  // Standalone, layout-less route meant to be loaded inside an <iframe> on
  // other sites — just the Pomodoro timer, no header/nav/seat-map chrome.
  {
    path: '/widget',
    component: () => import('pages/WidgetPage.vue'),
    meta: {
      seo: {
        title: { 'en-US': 'Focus Island Widget', 'zh-TW': 'Focus Island 小工具' },
        description: {
          'en-US': 'Embeddable Pomodoro timer widget for other sites.',
          'zh-TW': '可嵌入其他網站的番茄鐘小工具。',
        },
        robots: 'noindex,nofollow',
      },
    },
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
    meta: {
      seo: {
        title: { 'en-US': 'Page Not Found', 'zh-TW': '找不到頁面' },
        description: {
          'en-US': "The page you're looking for doesn't exist. Please return to the Focus Island home page.",
          'zh-TW': '你要找的頁面不存在，請返回 Focus Island 首頁。',
        },
        robots: 'noindex,nofollow',
      },
    },
  },
];

export default routes;
