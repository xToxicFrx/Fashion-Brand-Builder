/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow remote images (avatars, mockups stored on external storage in prod).
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  webpack: (config) => {
    // Konva tries to require the Node `canvas` package, which is not needed in
    // the browser build. Mark it external so webpack does not try to bundle it.
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

module.exports = nextConfig;
