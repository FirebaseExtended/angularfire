
angular.module('mock.firebase', [])
  .run(function($window) {
    $window.mockfirebase.override();
    $window.Firebase = $window.MockFirebase;
  })
  .factory('Firebase', function($window) {
    return $window.MockFirebase;
  });