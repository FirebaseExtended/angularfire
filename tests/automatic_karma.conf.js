// Configuration file for Karma
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    browsers: ['Chrome'],
    reporters: ['spec', 'failed', 'coverage'],
    autowatch: false,
    singleRun: true,

    preprocessors: {
      "../src/!(lib)/**/*.js": "coverage",
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
      '../node_modules/angular/angular.js',
      '../node_modules/angular-mocks/angular-mocks.js',
      '../node_modules/firebase/firebase.js',
      'lib/**/*.js',
      '../src/module.js',
      '../src/**/*.js',
      'mocks/**/*.js',
      "fixtures/**/*.json",
      'initialize.js',
      'unit/**/*.spec.js'
    ]
  });

  var configuration = {
      customLaunchers: {
          Chrome_travis_ci: {
              base: 'Chrome',
              flags: ['--no-sandbox']
          }
      },
  };

  if (process.env.TRAVIS) {
      configuration.browsers = ['Chrome_travis_ci'];
  }

  config.set(configuration);
};
