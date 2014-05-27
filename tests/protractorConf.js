exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',

  specs: [
    './protractor/test_todo-omnibinder.js'
  ],

  capabilities: {
    'browserName': 'chrome'
  },

  baseUrl: 'http://localhost:3030/tests/protractor/', //default test port with Yeoman

  jasmineNodeOpts: {
    isVerbose: true,
    showColors: true,
    includeStackTrace: true,
    defaultTimeoutInterval: 5000
  }
}