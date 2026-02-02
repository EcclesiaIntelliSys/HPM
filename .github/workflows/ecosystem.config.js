module.exports = {
  apps: [
    {
      name: "hpm",
      script: "./server/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    }
  ]
};
