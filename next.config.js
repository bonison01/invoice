module.exports = {
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/index.html', // Handle all requests by serving index.html
      },
    ];
  },
};