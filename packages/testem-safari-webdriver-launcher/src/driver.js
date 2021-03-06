/* eslint-disable no-console */
const { Builder, By, until } = require('selenium-webdriver');

async function main() {
  let driver = await new Builder().forBrowser('safari').build();
  let closed = false;

  async function close() {
    if (closed) {
      return;
    }
    try {
      await driver.sleep(100);
      await driver.close();
    } catch (e) {
      console.log('Issue closing driver', e);
    } finally {
      closed = true;
    }
  }

  async function exitHandler(options, exitCode) {
    console.log('exit handler called');
    if (options.cleanup) {
      await close();
    } else if (options.exit) {
      process.exit(exitCode);
    }
  }

  //do something when app is closing
  process.on('exit', exitHandler.bind(null, { cleanup: true }));
  [
    'SIGHUP',
    'SIGINT',
    'SIGQUIT',
    'SIGILL',
    'SIGTRAP',
    'SIGABRT',
    'SIGBUS',
    'SIGFPE',
    'SIGUSR1',
    'SIGSEGV',
    'SIGUSR2',
    'SIGTERM',
    'uncaughtException',
  ].forEach(signal => {
    process.on(signal, exitHandler.bind(null, { exit: true }));
  });

  try {
    let url = process.argv[2];

    await driver.get(url);
    await driver.wait(
      until.elementLocated(By.id('qunit-testresult')),
      5 * 1000,
      'Timed out waiting for test container',
      100
    );

    await driver.wait(
      async () => {
        try {
          let result = await driver.findElement(By.id('qunit-testresult'));
          let text = await result.getText();
          return /[^Running:]/.test(text);
        } catch (e) {
          return false;
        }
      },
      60 * 60 * 1000,
      'Timed Out waiting for test complete',
      100
    );

    await close();
  } catch (e) {
    console.log('Script Errored', e);
    await close();
  }
}

try {
  main();
} catch (e) {
  console.log('Exiting Poorly', e);
  process.exit(1);
}
