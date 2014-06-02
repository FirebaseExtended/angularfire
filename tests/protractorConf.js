exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',

  specs: [
    './protractor/**/*.spec.js'
  ],

  capabilities: {
    'browserName': 'chrome'
  },

  baseUrl: 'http://localhost:3030/tests/protractor/',

  jasmineNodeOpts: {
    isVerbose: true,
    showColors: true,
    includeStackTrace: true,
    defaultTimeoutInterval: 5000
  }
}