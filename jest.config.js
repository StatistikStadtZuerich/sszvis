module.exports = {
  preset: "jest-puppeteer",
  roots: ["test"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"]
};
