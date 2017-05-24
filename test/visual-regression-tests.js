const recursiveReadSync = require('recursive-readdir-sync');
const assert = require('assert');

suite('visual-regression-tests', function() {
  recursiveReadSync('docs').filter(file => file.match(/\.html$/)).forEach(file => {
    test(file.replace('.html', ''), async function() {
      const capabilities = browser.session().value;

      await browser.url(file);
      await browser.pause(100);

      const results = await browser.checkDocument({ capabilities });
      results.forEach(result => assert.ok(result.isExactSameImage));
    });
  });
});
