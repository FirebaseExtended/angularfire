
angular.module('mock.firebase', [])
  .run(function() {
    MockFirebase.override();
  })
  .factory('Firebase', function() {
    return MockFirebase;
  });