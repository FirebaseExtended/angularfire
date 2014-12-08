
angular.module('mock.firebase', [])
  .run(function($window) {
    $window.MockFirebase.override();
  });
