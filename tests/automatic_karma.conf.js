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
      "../src/*.js": "coverage",
      "./fixtures/**/*.json": "html2js"
    },

    coverageReporter: {
      reporters: [
        {
          // Nice HTML reports on developer machines, but not on Travis
          type: process.env.TRAVIS ? "lcovonly" : "lcov",
          dir: "coverage",
          subdir: "."
        },
        {
          type: "text-summary"
        }
      ]
    },

    files: [
      '../bower_components/angular/angular.js',
      '../bower_components/angular-mocks/angular-mocks.js',
      '../bower_components/mockfirebase/browser/mockfirebase.js',
      'lib/**/*.js',
      '../src/module.js',
      '../src/**/*.js',
      'mocks/**/*.js',
      "fixtures/**/*.json",
      'unit/**/*.spec.js'
    ]
  });
};
