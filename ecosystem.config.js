module.exports = {
  apps: [
    {
      name: "hpm",
      script: "./server/server.js",
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
        MONGO_URI: "mongodb+srv://admin:admin@cluster0.uwzkubf.mongodb.net/HPS_DEV?retryWrites=true&w=majority", 
        REACT_APP_API_URL: "http://3.0.104.235:5000",
        JWT_SECRET: "quickbrownfox"
      }
    }
  ]
};
