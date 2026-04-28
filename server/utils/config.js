// utils/config.js
const OpsConfig = require("../models/opsconfig");

let cachedConfig = null;

async function getConfig() {
  if (cachedConfig) return cachedConfig;

  const config = await OpsConfig.findOne();
  cachedConfig = config;
  return config;
}

module.exports = { getConfig };
