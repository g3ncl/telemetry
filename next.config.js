module.exports = {
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.URL,
  },
  assetPrefix: process.env.URL || undefined,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
};
