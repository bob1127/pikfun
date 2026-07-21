// next-i18next.config.js
const path = require('path');

module.exports = {
  i18n: {
    defaultLocale: 'zh-TW', 
    locales: ['zh-TW', 'en'], 
  },
  // 🔥 關鍵修正：確保 Vercel 環境能正確找到翻譯檔的路徑
  localePath: typeof window === 'undefined'
    ? path.resolve('./public/locales')
    : '/locales',
  // 開發模式下每次 SSR 重新讀取語系檔，新增翻譯 key 不必重啟
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};