// Configuration file for Karma
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      '../bower_components/angular/angular.js',
      '../bower_components/angular-mocks/angular-mocks.js',
      '../bower_components/firebase/firebase.js',
      '../bower_components/firebase-simple-login/firebase-simple-login.js',
      '../angularfire.js',
      'manual/**/*.spec.js'
    ],
    autoWatch: true,
    browsers: ['Chrome']
  });
};
