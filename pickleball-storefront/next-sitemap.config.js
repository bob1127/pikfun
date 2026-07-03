/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pikfun.com.tw',
  generateRobotsTxt: true, // 自動幫你生成 robots.txt
  // 如果有不需要收錄的後台頁面，可以在這裡排除
  // exclude: ['/admin/*'], 
}