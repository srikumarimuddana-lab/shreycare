/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://shreycare.com",
  generateRobotsTxt: true,
  exclude: ["/studio/*", "/account/*", "/api/*"],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/studio", "/account", "/api"] },
    ],
  },
};
