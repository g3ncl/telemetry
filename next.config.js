module.exports = {
  assetPrefix: process.env.URL || undefined,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/it/extract',
        permanent: false,
      },
    ];
  },
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
