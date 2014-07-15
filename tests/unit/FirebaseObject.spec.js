(function () {
  'use strict';
  describe('$FirebaseObject', function() {
    var $firebase, $FirebaseObject, $timeout, $fb, obj, $fbUtil, $rootScope;
    beforeEach(function() {
      module('mock.firebase');
      module('firebase');
      inject(function (_$firebase_, _$FirebaseObject_, _$timeout_, $firebaseUtils, _$rootScope_) {
        $firebase = _$firebase_;
        $FirebaseObject = _$FirebaseObject_;
        $timeout = _$timeout_;
        $fbUtil = $firebaseUtils;
        $rootScope = _$rootScope_;
        $fb = $firebase(new Firebase('Mock://').child('data/a'));
        // must use $asObject() to create our instance in order to test sync proxy
        obj = $fb.$asObject();
        flushAll();
      })
    });

    describe('$save', function() {
      it('should push changes to Firebase', function() {
        var calls = $fb.$ref().set.calls;
        expect(calls.count()).toBe(0);
        obj.newkey = true;
        obj.$save();
        flushAll();
        expect(calls.count()).toBe(1);
      });

      it('should return a promise', function() {
        var res = obj.$save();
        expect(angular.isObject(res)).toBe(true);
        expect(typeof res.then).toBe('function');
      });

      it('should resolve promise to the ref for this object', function() {
        var whiteSpy = jasmine.createSpy('resolve');
        var blackSpy = jasmine.createSpy('reject');
        obj.$save().then(whiteSpy, blackSpy);
        expect(whiteSpy).not.toHaveBeenCalled();
        flushAll();
        expect(whiteSpy).toHaveBeenCalled();
        expect(blackSpy).not.toHaveBeenCalled();
      });

      it('should reject promise on failure', function(){
        var whiteSpy = jasmine.createSpy('resolve');
        var blackSpy = jasmine.createSpy('reject');
        $fb.$ref().failNext('set', 'oops');
        obj.$save().then(whiteSpy, blackSpy);
        expect(blackSpy).not.toHaveBeenCalled();
        flushAll();
        expect(whiteSpy).not.toHaveBeenCalled();
        expect(blackSpy).toHaveBeenCalledWith('oops');
      });
    });

    describe('$loaded', function() {
      it('should return a promise', function() {
        var res = obj.$loaded();
        expect(angular.isObject(res)).toBe(true);
        expect(angular.isFunction(res.then)).toBe(true);
      });

      it('should resolve when all server data is downloaded', function() {
        var whiteSpy = jasmine.createSpy('resolve');
        var blackSpy = jasmine.createSpy('reject');
        var obj = new $FirebaseObject($fb);
        obj.$loaded().then(whiteSpy, blackSpy);
        expect(whiteSpy).not.toHaveBeenCalled();
        flushAll();
        expect(whiteSpy).toHaveBeenCalled();
        expect(blackSpy).not.toHaveBeenCalled();
      });

      it('should reject if the server data cannot be accessed', function() {
        var whiteSpy = jasmine.createSpy('resolve');
        var blackSpy = jasmine.createSpy('reject');
        $fb.$ref().failNext('once', 'doh');
        var obj = new $FirebaseObject($fb);
        obj.$loaded().then(whiteSpy, blackSpy);
        expect(blackSpy).not.toHaveBeenCalled();
        flushAll();
        expect(whiteSpy).not.toHaveBeenCalled();
        expect(blackSpy).toHaveBeenCalledWith('doh');
      });

      it('should resolve to the FirebaseObject instance', function() {
        var spy = jasmine.createSpy('loaded');
        obj.$loaded().then(spy);
        flushAll();
        expect(spy).toHaveBeenCalled();
        expect(spy.calls.argsFor(0)[0]).toBe(obj);
      });
    });

    describe('$inst', function(){
      it('should return the $firebase instance that created it', function() {
        expect(obj.$inst()).toBe($fb);
      });
    });

    describe('$bindTo', function() {
      it('should return a promise'); //todo-test

      it('should have data when it resolves'); //todo-test

      it('should extend and not destroy an object if already exists in scope'); //todo-test

      it('should allow defaults to be set inside promise callback'); //todo-test

      it('should send local changes to the server'); //todo-test

      it('should apply server changes to scope variable'); //todo-test

      it('should only send keys in toJSON'); //todo-test
    });

    describe('$destroy', function() {
      it('should remove the value listener', function() {
        var old = $fb.$ref().off.calls.count();
        obj.$destroy();
        expect($fb.$ref().off.calls.count()).toBe(old+1);
      });

      it('should dispose of any bound instance', function() {
        var $scope = $rootScope.$new();

        // spy on $scope.$watch and the off method it returns
        // this is a bit of hoop jumping to get access to both methods
        var _watch  = $scope.$watch;
        var offSpy;

        spyOn($scope, '$watch').and.callFake(function(varName, callback) {
          var _off = _watch.call($scope, varName, callback);
          offSpy = jasmine.createSpy('off method for $watch').and.callFake(function() {
            _off();
          });
          return offSpy;
        });

        // now bind to scope and destroy to see what happens
        obj.$bindTo($scope, 'foo');
        flushAll();
        expect($scope.$watch).toHaveBeenCalled();
        obj.$destroy();
        flushAll();
        expect(offSpy).toHaveBeenCalled();
      });

      it('should unbind if scope is destroyed', function() {
        var $scope = $rootScope.$new();

        // spy on $scope.$watch and the off method it returns
        // this is a bit of hoop jumping to get access to both methods
        var _watch  = $scope.$watch;
        var offSpy;

        spyOn($scope, '$watch').and.callFake(function(varName, callback) {
          var _off = _watch.call($scope, varName, callback);
          offSpy = jasmine.createSpy('off method for $watch').and.callFake(function() {
            _off();
          });
          return offSpy;
        });

        obj.$bindTo($scope, 'foo');
        flushAll();
        expect($scope.$watch).toHaveBeenCalled();
        $scope.$emit('$destroy');
        flushAll();
        expect(offSpy).toHaveBeenCalled();
      });
    });

    describe('$toJSON', function() {
      it('should strip prototype functions', function() {
        var dat = obj.$$toJSON();
        for (var key in $FirebaseObject.prototype) {
          if (obj.hasOwnProperty(key)) {
            expect(dat.hasOwnProperty(key)).toBeFalsy();
          }
        }
      });

      it('should strip $ keys', function() {
        obj.$test = true;
        var dat = obj.$$toJSON();
        for(var key in dat) {
          expect(/\$/.test(key)).toBeFalsy();
        }
      });

      it('should return a primitive if the value is a primitive', function() {
        $fb.$ref().set(true);
        flushAll();
        var dat = obj.$$toJSON();
        expect(dat['.value']).toBe(true);
        expect(Object.keys(dat).length).toBe(1);
      });
    });

    describe('$extendFactory', function() {
      it('should preserve child prototype', function() {
        function Extend() { $FirebaseObject.apply(this, arguments); }
        Extend.prototype.foo = function() {};
        $FirebaseObject.$extendFactory(Extend);
        var arr = new Extend($fb, jasmine.createSpy);
        expect(typeof(arr.foo)).toBe('function');
      });

      it('should return child class', function() {
        function A() {}
        var res = $FirebaseObject.$extendFactory(A);
        expect(res).toBe(A);
      });

      it('should be instanceof $FirebaseObject', function() {
        function A() {}
        $FirebaseObject.$extendFactory(A);
        expect(new A($fb, noop) instanceof $FirebaseObject).toBe(true);
      });

      it('should add on methods passed into function', function() {
        function foo() { return 'foo'; }
        var F = $FirebaseObject.$extendFactory({foo: foo});
        var res = new F($fb, noop);
        expect(typeof res.$$updated).toBe('function');
        expect(typeof res.foo).toBe('function');
        expect(res.foo()).toBe('foo');
      });
    });

    //todo-test most of this logic is now part of by SyncObject
    //todo-test should add tests for $$updated, $$error, and $$toJSON
    //todo-test and then move this logic to $asObject
    describe('server update', function() {
      it('should add keys to local data', function() {
        $fb.$ref().set({'key1': true, 'key2': 5});
        flushAll();
        expect(obj.key1).toBe(true);
        expect(obj.key2).toBe(5);
      });

      it('should remove old keys', function() {
        var keys = Object.keys($fb.$ref());
        expect(keys.length).toBeGreaterThan(0);
        $fb.$ref().set(null);
        flushAll();
        keys.forEach(function(k) {
          expect(obj.hasOwnProperty(k)).toBe(false);
        });
      });

      it('should assign primitive value to $value', function() {
        $fb.$ref().set(true);
        flushAll();
        expect(obj.$value).toBe(true);
      });

      it('should trigger an angular compile', function() {
        var spy = spyOn($rootScope, '$apply').and.callThrough();
        var x = spy.calls.count();
        $fb.$ref().fakeEvent('value', {foo: 'bar'}).flush();
        flushAll();
        expect(spy.calls.count()).toBeGreaterThan(x);
      });

      it('should preserve the id'); //todo-test

      it('should preserve the priority'); //todo-test
    });

    function flushAll() {
      // the order of these flush events is significant
      $fb.$ref().flush();
      Array.prototype.slice.call(arguments, 0).forEach(function(o) {
        o.flush();
      });
      $rootScope.$digest();
      try { $timeout.flush(); }
      catch(e) {}
    }

    function noop() {}
  });

})();