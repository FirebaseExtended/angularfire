
angular.module('mock.utils', [])
  .config(function($provide) {
    $provide.decorator('$firebaseUtils', function($delegate, $timeout) {
      var origCompile = $delegate.compile;
      var completed = jasmine.createSpy('utils.compileCompleted');
      $delegate.compile = jasmine.createSpy('utils.compile').and.callFake(function(fn, wait) {
        return $timeout(function() {
          completed();
          fn();
        }, wait);
      });
      $delegate.compile.completed = completed;
      $delegate.compile._super = origCompile;
      return $delegate;
    });
  });