// Configuration file for Karma
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    browsers: ['PhantomJS'],
    reporters: ['spec', 'failed', 'coverage'],
    autowatch: false,
    singleRun: true,

    preprocessors: {
      "../src/**/*.js": "coverage"
    },
    coverageReporter: {
      type: "html"
    },

    files: [
      '../bower_components/lodash/dist/lodash.js',
      '../bower_components/angular/angular.js',
      '../bower_components/angular-mocks/angular-mocks.js',
      'lib/**/*.js',
      '../src/module.js',
      '../src/**/*.js',
      'mocks/**/*.js',
      'unit/**/*.spec.js'
    ]
  });
};
