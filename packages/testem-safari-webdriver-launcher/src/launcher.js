const script = require.resolve('./driver');

const SafariLauncher = {
  name: 'Safari',
  protocol: 'browser',
  setup(_, done) {
    const url = this.getUrl();
    this.settings.command = `node ${script} ` + url;
    done();
  },
};

module.exports = SafariLauncher;
