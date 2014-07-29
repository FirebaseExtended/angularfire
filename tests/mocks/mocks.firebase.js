
angular.module('mock.firebase', [])
  .run(function($window) {
    MockFirebase.override();
    $window.Firebase = MockFirebase;
  })
  .factory('Firebase', function() {
    return MockFirebase;
  });