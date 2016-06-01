// Make sure dependencies are loaded on the window
require('angular');
require('firebase');

// Load the Angular module which uses window.angular and window.Firebase
require('./dist/angularfire');

// Export the module name from the Angular module
module.exports = 'firebase';
