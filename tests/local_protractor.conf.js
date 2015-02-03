exports.config = {
  // Locally, we should just use the default standalone Selenium server
  // In Travis, we set up the Selenium serving via Sauce Labs

  // Tests to run
  specs: [
    './protractor/**/*.spec.js'
  ],

  // Capabilities to be passed to the webdriver instance
  // For a full list of available capabilities, see https://code.google.com/p/selenium/wiki/DesiredCapabilities
  capabilities: {
    'browserName': process.env.TRAVIS ? 'firefox' : 'chrome'
  },

  // Calls to protractor.get() with relative paths will be prepended with the baseUrl
  baseUrl: 'http://localhost:3030/tests/protractor/',

  // Selector for the element housing the angular app
  rootElement: 'body',

  // Options to be passed to minijasminenode
  jasmineNodeOpts: {
    // onComplete will be called just before the driver quits.
    onComplete: null,
    // If true, display spec names.
    isVerbose: true,
    // If true, print colors to the terminal.
    showColors: true,
    // If true, include stack traces in failures.
    includeStackTrace: true,
    // Default time to wait in ms before a test fails.
    defaultTimeoutInterval: 20000
  }
};
