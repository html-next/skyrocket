const { Builder, By, until } = require('selenium-webdriver');

async function main() {
  let driver = await new Builder().forBrowser('safari').build();
  try {
    let url = process.argv[2];

    await driver.get(url);
    let result = await driver.wait(until.elementLocated(By.id('qunit-testresult-display')), 30 * 1000);
    await driver.wait(until.elementTextMatches(result, /[^Running:]/), 60 * 60 * 1000);
  } catch (e) {
    await driver.quit();
    throw e;
  }
}

main();
