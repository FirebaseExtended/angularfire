(function () {
  'use strict';
  describe('$FirebaseObject', function() {
    var $firebase, $FirebaseObject, $timeout, $fb, $factory, $fbUtil, $rootScope;
    beforeEach(function() {
      module('mock.firebase');
      module('firebase');
      inject(function (_$firebase_, _$FirebaseObject_, _$timeout_, $firebaseUtils, _$rootScope_) {
        $firebase = _$firebase_;
        $FirebaseObject = _$FirebaseObject_;
        $timeout = _$timeout_;
        $fbUtil = $firebaseUtils;
        $fb = $firebase(new Firebase('Mock://').child('data/a'));
        $rootScope = _$rootScope_;
      })
    });

    it('should have tests', function() {
      pending();
      var o = new $FirebaseObject($fb);
      flushAll();
      console.log(typeof o);
      console.log(o);
      console.log(o.toJSON());
      console.log(Object.keys(o));
      console.log(o.$id);
      angular.forEach(o, function(v,k) {
        console.log(k,v);
      });
      expect(false).toBe(true);
    });

    function flushAll() {
      // the order of these flush events is significant
      $fb.ref().flush();
      Array.prototype.slice.call(arguments, 0).forEach(function(o) {
        o.flush();
      });
      $rootScope.$digest();
      try { $timeout.flush(); }
      catch(e) {}
    }
  });

})();