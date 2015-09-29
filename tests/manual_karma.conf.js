// Configuration file for Karma
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    browsers: ['Chrome'],
    reporters: ['spec', 'failed'],
    autowatch: false,
    singleRun: false,

    files: [
      '../node_modules/angular/angular.js',
      '../node_modules/angular-mocks/angular-mocks.js',
      '../node_modules/firebase/lib/firebase-web.js',
      '../src/module.js',
      '../src/**/*.js',
      'manual/**/*.spec.js'
    ]
  });
};
