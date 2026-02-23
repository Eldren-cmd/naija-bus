const path = require("node:path");

module.exports = {
  // Keep browser downloads inside the service directory so build/start use the same cache.
  cacheDirectory: path.join(__dirname, ".cache", "puppeteer"),
};
