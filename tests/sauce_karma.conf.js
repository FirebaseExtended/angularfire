// Configuration file for Karma
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  var customLaunchers = require('./browsers.json')
    .reduce(function (browsers, browser) {
      browsers[(browser.name + '_v' + browser.version).replace(/(\.|\s)/g, '_')] = {
        base: 'SauceLabs',
        browserName: browser.name,
        platform: browser.platform,
        version: browser.version
      };
      return browsers;
    }, {});
  var browsers = Object.keys(customLaunchers);

  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      '../bower_components/angular/angular.js',
      '../bower_components/angular-mocks/angular-mocks.js',
      '../bower_components/mockfirebase/browser/mockfirebase.js',
      'lib/**/*.js',
      '../dist/angularfire.js',
      'mocks/**/*.js',
      'unit/**/*.spec.js'
    ],

    logLevel: config.LOG_INFO,

    transports: ['xhr-polling'],

    sauceLabs: {
      testName: 'AngularFire Unit Tests',
      startConnect: false,
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
    },

    captureTimeout: 0,
    browserNoActivityTimeout: 120000,

    //Recommend starting Chrome manually with experimental javascript flag enabled, and open localhost:9876.
    customLaunchers: customLaunchers,
    browsers: browsers,
    reporters: ['dots', 'saucelabs'],
    singleRun: true

  });
};
