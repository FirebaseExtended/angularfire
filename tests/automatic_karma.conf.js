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
      "../src/*.js": "coverage"
    },

    coverageReporter: {
      reporters: [
        {
          type: "lcovonly",
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
      '../bower_components/mockfirebase/dist/mockfirebase.js',
      'lib/**/*.js',
      '../src/module.js',
      '../src/**/*.js',
      'mocks/**/*.js',
      'unit/**/*.spec.js'
    ]
  });
};
