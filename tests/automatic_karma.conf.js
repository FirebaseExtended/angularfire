// Configuration file for Karma
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
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

    autoWatch: true,
    //Recommend starting Chrome manually with experimental javascript flag enabled, and open localhost:9876.
    browsers: ['Chrome', 'Safari']
  });
};
