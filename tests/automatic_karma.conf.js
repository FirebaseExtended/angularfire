// Configuration file for Karma
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      'lib/jasmineMatchers.js',
      '../bower_components/angular/angular.js',
      '../bower_components/angular-mocks/angular-mocks.js',
      'lib/lodash.js',
      'lib/MockFirebase.js',
      '../src/module.js',
      '../src/**/*.js',
      'mocks/**/*.js',
      'unit/**/*.spec.js'
    ],
    notify: true,

    autoWatch: true,
    //Recommend starting Chrome manually with experimental javascript flag enabled, and open localhost:9876.
    browsers: ['PhantomJS']
  });
};
