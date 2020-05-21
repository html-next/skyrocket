const SafariLauncher = {
  name: 'Safari',
  protocol: 'browser',
  setup(_, done) {
    const url = this.getUrl();
    this.settings.command = 'node ./node_modules/testem-safari-webdriver-launcher/src/driver.js ' + url;
    done();
  },
};

module.exports = SafariLauncher;
