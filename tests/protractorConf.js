// An example configuration file.
exports.config = {
  // The address of a running selenium server. If this is specified,
  // seleniumServerJar and seleniumPort will be ignored.
  // seleniumAddress: 'http://localhost:4444/wd/hub',
  seleniumServerJar: './selenium/selenium-server-standalone-2.37.0.jar',
  seleniumPort: 4444,

  chromeDriver: './selenium/chromedriver',

  seleniumArgs: [],

  // A base URL for your application under test. Calls to protractor.get()
  // with relative paths will be prepended with this.
  baseUrl: '',

  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'chrome'
  },
  specs: [
    'tests/protractor/test_todo-omnibinder.js'
  ],
  // Options to be passed to Jasmine-node.
  jasmineNodeOpts: {
    // onComplete will be called before the driver quits.
    onComplete: null,
    isVerbose: true,
    showColors: true,
    includeStackTrace: true,
    defaultTimeoutInterval: 10000
  }
};
