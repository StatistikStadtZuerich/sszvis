const { join } = require('path');
const { networkInterfaces } = require('os');
const VisualRegressionCompare = require('wdio-visual-regression-service/compare');

const cwd = process.cwd();
function getScreenshotName(dir) {
  return function(context) {
    const { type, test: { title }, meta: { viewport }, options: { test, capabilities: { platform, browserName } } } = context;

    // We only handle document screeshots with a fixed viewport.
    if (type === 'document' && viewport !== undefined) {
      const {width, height} = viewport;
      return join(cwd, 'screenshots', dir, title, platform, browserName, `${width}x${height}`, `${test}.png`);
    } else {
      throw new Error(`getScreenshotName: UNEXPECTED`);
    }
  };
}

const externalAddress = () => {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const addr of addresses) {
      if (addr.family === 'IPv4' && addr.internal === false) {
        return addr.address;
      }
    }
  }

  throw new Error('externalAddress: Could not determine external address');
};

exports.config = {
  specs: [
    './test/**/*.js',
  ],
  maxInstances: 10,
  capabilities: [
    {
      browserName: 'chrome',
      chromeOptions: {
        args: ['window-size=1280,800'],
      },
    },
  ],
  baseUrl: `http://${externalAddress()}:8000`,
  services: [
    'visual-regression'
  ],
  visualRegression: {
    compare: new VisualRegressionCompare.LocalCompare({
      referenceName: getScreenshotName('reference'),
      screenshotName: getScreenshotName('taken'),
      diffName: getScreenshotName('diff'),
    }),

    // Testing only a single viewport at the moment. The tests don't run parallel – mocha
    // doesn't support parallel tests. Testing more viewports would double or triple the
    // run time.
    //
    // XXX: Disabled because window resizing doesn't work in chrome headless. We set the
    // viewport size with chromeOptions.args --window-size=width,height instead.
    // See https://bugs.chromium.org/p/chromedriver/issues/detail?id=1625#c39
    //
    // viewports: [{width:1280, height:800}],
    // viewportChangePause: 400,
  },
  framework: 'mocha',
  mochaOpts: {
    ui: 'tdd',
    timeout: 60000,
    compilers: [
      'js:babel-register'
    ],
  },
}
