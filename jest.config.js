module.exports = {
  preset: "jest-puppeteer",
  roots: ["test"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
