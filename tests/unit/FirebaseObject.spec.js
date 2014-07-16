(function () {
  'use strict';
  describe('$FirebaseObject', function() {
    var $firebase, $FirebaseObject, $timeout, $fb, obj, objData, objNew, $utils, $rootScope, destroySpy;
    beforeEach(function() {
      module('mock.firebase');
      module('firebase');
      inject(function (_$firebase_, _$FirebaseObject_, _$timeout_, $firebaseUtils, _$rootScope_) {
        $firebase = _$firebase_;
        $FirebaseObject = _$FirebaseObject_;
        $timeout = _$timeout_;
        $utils = $firebaseUtils;
        $rootScope = _$rootScope_;
        $fb = $firebase(new Firebase('Mock://').child('data/a'));
        //todo-test must use $asObject() to create our instance in order to test sync proxy
        obj = $fb.$asObject();

        // start using the direct methods here until we can refactor `obj`
        destroySpy = jasmine.createSpy('destroy');
        objData = {
          aString: 'alpha',
          aNumber: 1,
          aBoolean: false
        };
        objNew = new $FirebaseObject($fb, destroySpy);
        objNew.$$updated(fakeSnap($fb.$ref(), objData));

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
        expect(res).toBeAn('object');
        expect(res.then).toBeA('function');
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
        expect(res).toBeAPromise();
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
      it('should return a promise', function() {
        var res = objNew.$bindTo($rootScope.$new(), 'test');
        expect(res).toBeAPromise();
      });

      it('should resolve to an off function', function() {
        var whiteSpy = jasmine.createSpy('resolve').and.callFake(function(off) {
          expect(off).toBeA('function');
        });
        var blackSpy = jasmine.createSpy('reject');
        objNew.$bindTo($rootScope.$new(), 'test').then(whiteSpy, blackSpy);
        flushAll();
        expect(whiteSpy).toHaveBeenCalled();
        expect(blackSpy).not.toHaveBeenCalled();
      });

      it('should have data when it resolves', function() {
        var whiteSpy = jasmine.createSpy('resolve').and.callFake(function() {
          var dat = $fb.$ref().getData();
          expect(obj).toEqual(jasmine.objectContaining(dat));
        });
        var blackSpy = jasmine.createSpy('reject');
        objNew.$bindTo($rootScope.$new(), 'test').then(whiteSpy, blackSpy);
        flushAll();
        expect(whiteSpy).toHaveBeenCalled();
        expect(blackSpy).not.toHaveBeenCalled();
      });

      it('should send local changes to the server', function() {
        var $scope = $rootScope.$new();
        var spy = spyOn(obj.$inst(), '$set');
        objNew.$bindTo($scope, 'test');
        $timeout.flush();
        $scope.$apply(function() {
          $scope.test.bar = 'baz';
        });
        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({bar: 'baz'}));
      });

      it('should allow data to be set inside promise callback', function() {
        var $scope = $rootScope.$new();
        var newData = { 'bar': 'foo' };
        var setSpy = spyOn(obj.$inst(), '$set');
        var whiteSpy = jasmine.createSpy('resolve').and.callFake(function() {
          $scope.test = newData;
        });
        var blackSpy = jasmine.createSpy('reject');
        objNew.$bindTo($scope, 'test').then(whiteSpy, blackSpy);
        flushAll();
        expect(whiteSpy).toHaveBeenCalled();
        expect(blackSpy).not.toHaveBeenCalled();
        expect($scope.test).toEqual(jasmine.objectContaining(newData));
        expect(setSpy).toHaveBeenCalled();
      });

      it('should apply server changes to scope variable', function() {
        var $scope = $rootScope.$new();
        var spy = jasmine.createSpy('$watch');
        $scope.$watchCollection('test', spy);
        objNew.$bindTo($scope, 'test');
        $timeout.flush();
        expect(spy.calls.count()).toBe(1);
        objNew.$$updated(fakeSnap($fb.$ref(), {foo: 'bar'}, null));
        $scope.$digest();
        expect(spy.calls.count()).toBe(2);
      });

      it('should stop binding when off function is called', function() {
        var off;
        var $scope = $rootScope.$new();
        var spy = jasmine.createSpy('$watch');
        $scope.$watchCollection('test', spy);
        objNew.$bindTo($scope, 'test').then(function(_off) {
          off = _off;
        });
        $timeout.flush();
        expect(spy.calls.count()).toBe(1);
        off();
        objNew.$$updated(fakeSnap($fb.$ref(), {foo: 'bar'}, null));
        $scope.$digest();
        expect(spy.calls.count()).toBe(1);
      });

      it('should not destroy remote data if local is pre-set', function() {
        var origValue = $utils.toJSON(obj);
        var $scope = $rootScope.$new();
        $scope.test = {foo: true};
        objNew.$bindTo($scope, 'test');
        flushAll();
        expect($utils.toJSON(obj)).toEqual(origValue);
      });

      it('should not fail if remote data is null', function() {
        var $scope = $rootScope.$new();
        var obj = new $FirebaseObject($fb, noop);
        obj.$bindTo($scope, 'test');
        obj.$$updated(fakeSnap($fb.$ref(), null, null));
        flushAll();
        expect($scope.test).toEqual({$value: null, $id: 'a', $priority: null});
      });

      //todo-test https://github.com/firebase/angularFire/issues/333
      xit('should update priority if $priority changed in $scope', function() {
        var $scope = $rootScope.$new();
        var spy = spyOn(objNew.$inst(), '$set');
        objNew.$bindTo($scope, 'test');
        $timeout.flush();
        $scope.test.$priority = 999;
        $scope.$digest();
        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({'.priority': 999}));
      });

      //todo-test https://github.com/firebase/angularFire/issues/333
      xit('should update value if $value changed in $scope', function() {
        var $scope = $rootScope.$new();
        var obj = new $FirebaseObject($fb, noop);
        obj.$$updated(fakeSnap($fb.$ref(), 'foo', null));
        expect(obj.$value).toBe('foo');
        var spy = spyOn(obj.$inst(), '$set');
        objNew.$bindTo($scope, 'test');
        $timeout.flush();
        $scope.test.$value = 'bar';
        $scope.$digest();
        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({'.value': 'bar'}));
      });
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

    describe('$extendFactory', function() {
      it('should preserve child prototype', function() {
        function Extend() { $FirebaseObject.apply(this, arguments); }
        Extend.prototype.foo = function() {};
        $FirebaseObject.$extendFactory(Extend);
        var arr = new Extend($fb, jasmine.createSpy);
        expect(arr.foo).toBeA('function');
      });

      it('should return child class', function() {
        function A() {}
        var res = $FirebaseObject.$extendFactory(A);
        expect(res).toBe(A);
      });

      it('should be instanceof $FirebaseObject', function() {
        function A() {}
        $FirebaseObject.$extendFactory(A);
        expect(new A($fb, noop)).toBeInstanceOf($FirebaseObject);
      });

      it('should add on methods passed into function', function() {
        function foo() { return 'foo'; }
        var F = $FirebaseObject.$extendFactory({foo: foo});
        var res = new F($fb, noop);
        expect(res.$$updated).toBeA('function');
        expect(res.foo).toBeA('function');
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

    function fakeSnap(ref, data, pri) {
       return {
         ref: function() { return ref; },
         val: function() { return data; },
         getPriority: function() { return angular.isDefined(pri)? pri : null; },
         name: function() { return ref.name(); },
         child: function(key) {
           var childData = angular.isObject(data) && data.hasOwnProperty(key)? data[key] : null;
           return fakeSnap(ref.child(key), childData, null);
         }
       }
    }

    function noop() {}
  });

})();