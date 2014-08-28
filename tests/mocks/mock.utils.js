
angular.module('mock.utils', [])
  .config(function($provide) {
    function spyOnCallback($delegate, method) {
      var origMethod = $delegate[method];
      var spy = jasmine.createSpy('utils.'+method+'Callback');
      $delegate[method] = jasmine.createSpy('utils.'+method).and.callFake(function() {
        var args = Array.prototype.slice.call(arguments, 0);
        var origCallback = args[0];
        args[0] = function() {
          origCallback();
          spy(args);
        };
        return origMethod.apply($delegate, args);
      });
      $delegate[method].completed = spy;
      $delegate[method]._super = origMethod;
    }

    $provide.decorator('$firebaseUtils', function($delegate, $timeout) {
      spyOnCallback($delegate, 'compile');
      spyOnCallback($delegate, 'wait');
      return $delegate;
    });
  });