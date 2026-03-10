module.exports = {
  apps: [
    {
      name: "hpm",
      script: "./server/server.js",
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
        MONGO_URI:
          "mongodb+srv://admin:admin@cluster0.uwzkubf.mongodb.net/HPS_DEV?retryWrites=true&w=majority",
        REACT_APP_API_URL: "https://heartprayermusic.com",
        JWT_SECRET: "quickbrownfoxquickbrownfoxquickbrownfox",
        REFRESH_SECRET: "xofnworbkciuqxofnworbkciuqxofnworbkciuq",
        TITAN_USER: "info@heartprayermusic.com",
        TITAN_PASS: "iLoveMusic!357!",
        TITAN_HOST: "smtp.titan.email",
        TITAN_PORT: 465,
        FRONTEND_URL: "https://heartprayermusic.com",
      },
    },
  ],
};
