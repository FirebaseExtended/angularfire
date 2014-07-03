// Configuration file for Karma
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  var customLaunchers = {
    sl_chrome: {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: '35'
    },
    sl_firefox: {
      base: 'SauceLabs',
      browserName: 'firefox', 
      version: '30'
    },
    sl_safari: {
      base: 'SauceLabs',
      browserName: 'safari',
      platform: 'OS X 10.9',
      version: '7'
    },
    sl_ios_safari: {
      base: 'SauceLabs',
      browserName: 'iphone',
      platform: 'OS X 10.9',
      version: '7.1'
    },
    sl_android: {
      base: 'SauceLabs',
      browserName: 'android',
      platform: 'Linux',
      version: '4.3'
    },
    sl_ie_11: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 8.1',
      version: '11'
    },
    sl_ie_9: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 7',
      version: '9'
    }
  };

  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      '../bower_components/angular/angular.js',
      '../bower_components/angular-mocks/angular-mocks.js',
      '../lib/omnibinder-protocol.js',
      'lib/lodash.js',
      'lib/MockFirebase.js',
      '../angularfire.js',
      'unit/**/*.spec.js'
    ],

    logLevel: config.LOG_INFO,

    transports: ['xhr-polling'],

    sauceLabs: {
      testName: 'angularFire Unit Tests',
      startConnect: false,
      tunnelIdentifier: process.env.TRAVIS && process.env.TRAVIS_JOB_NUMBER
    },

    captureTimeout: 0,
    browserNoActivityTimeout: 120000,

    //Recommend starting Chrome manually with experimental javascript flag enabled, and open localhost:9876.
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),
    reporters: ['dots', 'saucelabs'],
    singleRun: true

  });
};
