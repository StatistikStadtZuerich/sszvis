const recursiveReadSync = require('recursive-readdir-sync');
const assert = require('assert');

const normalizeString = x =>
  x.toLowerCase().replace(/\s+/g, '-');

const checkDocument = async (capabilities, test) => {
  await browser.pause(200);
  const results = await browser.checkDocument({ capabilities, test });
  results.forEach(result => assert.ok(result.isExactSameImage));
};

suite('visual-regression-tests', function() {
  recursiveReadSync('docs').filter(file => file.match(/\.html$/)).forEach(file => {
    test(file.replace('.html', ''), async function() {
      const capabilities = browser.session().value;

      await browser.url(file);
      await checkDocument(capabilities, 'base');

      const controlButtons = await browser.$$('.sszvis-control-buttonGroup__item');
      for (const button of controlButtons) {
        const buttonLabel = (await browser.elementIdText(button.ELEMENT)).value;
        const test = `button-${controlButtons.indexOf(button)}-${normalizeString(buttonLabel)}`;

        await browser.elementIdClick(button.ELEMENT);
        await checkDocument(capabilities, test);
      }
    });
  });
});
