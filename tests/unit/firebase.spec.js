'use strict';
describe('$firebase', function () {

  var $firebase, $timeout, $rootScope, $utils;

  beforeEach(function() {
    module('firebase');
    module('mock.firebase');
    module('mock.utils');
    // have to create these before the first call to inject
    // or they will not be registered with the angular mock injector
    angular.module('firebase').provider('TestArrayFactory', {
      $get: function() {
        return function() {}
      }
    }).provider('TestObjectFactory', {
      $get: function() {
        return function() {};
      }
    }).value('NonFunctionFactory','NonFunctionValue');
    inject(function (_$firebase_, _$timeout_, _$rootScope_, $firebaseUtils) {
      $firebase = _$firebase_;
      $timeout = _$timeout_;
      $rootScope = _$rootScope_;
      $utils = $firebaseUtils;
    });
  });

  describe('<constructor>', function() {
    var $fb;
    beforeEach(function() {
      $fb = $firebase(new Firebase('Mock://').child('data'));
    });

    it('should accept a Firebase ref', function() {
      var ref = new Firebase('Mock://');
      var $fb = new $firebase(ref);
      expect($fb.$ref()).toBe(ref);
    });

    it('should throw an error if passed a string', function() {
      expect(function() {
        $firebase('hello world');
      }).toThrowError(/valid Firebase reference/);
    });

    it('should accept a factory name for arrayFactory', function() {
      var ref = new Firebase('Mock://');
      // if this does not throw an error we are fine
      expect($firebase(ref, {arrayFactory: 'TestArrayFactory'})).toBeAn('object');
    });

    it('should accept a factory name for objectFactory', function() {
      var ref = new Firebase('Mock://');
      var app = angular.module('firebase');
      app.provider('TestObjectFactory', {
        $get: function() {
          return function() {}
        }
      });
      // if this does not throw an error we are fine
      expect($firebase(ref, {objectFactory: 'TestObjectFactory'})).toBeAn('object');
    });

    it('should throw an error if factory name for arrayFactory does not exist', function()  {
      var ref = new Firebase('Mock://');
      expect(function() {
        $firebase(ref, {arrayFactory: 'notarealarrayfactorymethod'}); //injectable by that name doesn't exist.
      }).toThrowError();
    });

    it('should throw an error if factory name for arrayFactory exists, but is not a function', function()  {
      var ref = new Firebase('Mock://');
      expect(function() {
        $firebase(ref, {arrayFactory: 'NonFunctionFactory'}); //injectable exists, but is not a function.
      }).toThrowError();
    });

    it('should throw an error if factory name for objectFactory does not exist', function()  {
      var ref = new Firebase('Mock://');
      expect(function() {
        $firebase(ref, {objectFactory: 'notarealobjectfactorymethod'}); //injectable by that name doesn't exist.
      }).toThrowError();
    });

    it('should throw an error if factory name for objectFactory exists, but is not a function', function()  {
      var ref = new Firebase('Mock://');
      expect(function() {
        $firebase(ref, {objectFactory: 'NonFunctionFactory'}); //injectable exists, but is not a function.
      }).toThrowError();
    });
  });

  describe('$ref', function() {
    var $fb;
    beforeEach(function() {
      $fb = $firebase(new Firebase('Mock://').child('data'));
    });

    it('should return ref that created the $firebase instance', function() {
      var ref = new Firebase('Mock://');
      var $fb = new $firebase(ref);
      expect($fb.$ref()).toBe(ref);
    });
  });

  describe('$push', function() {
    var $fb, flushAll;
    beforeEach(function() {
      $fb = $firebase(new Firebase('Mock://').child('data'));
      flushAll = flush.bind(null, $fb.$ref());
    });

    it('should return a promise', function() {
      var res = $fb.$push({foo: 'bar'});
      expect(angular.isObject(res)).toBe(true);
      expect(typeof res.then).toBe('function');
    });

    it('should resolve to the ref for new id', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      $fb.$push({foo: 'bar'}).then(whiteSpy, blackSpy);
      flushAll();
      var newId = $fb.$ref().getLastAutoId();
      expect(whiteSpy).toHaveBeenCalled();
      expect(blackSpy).not.toHaveBeenCalled();
      var ref = whiteSpy.calls.argsFor(0)[0];
      expect(ref.key()).toBe(newId);
    });

    it('should reject if fails', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      $fb.$ref().failNext('push', 'failpush');
      $fb.$push({foo: 'bar'}).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('failpush');
    });

    it('should save correct data into Firebase', function() {
      var spy = jasmine.createSpy('push callback').and.callFake(function(ref) {
        expect($fb.$ref().getData()[ref.key()]).toEqual({foo: 'pushtest'});
      });
      $fb.$push({foo: 'pushtest'}).then(spy);
      flushAll();
      expect(spy).toHaveBeenCalled();
    });

    it('should work on a query', function() {
      var ref = new Firebase('Mock://').child('ordered').limit(5);
      var $fb = $firebase(ref);
      spyOn(ref.ref(), 'push').and.callThrough();
      flushAll();
      expect(ref.ref().push).not.toHaveBeenCalled();
      $fb.$push({foo: 'querytest'});
      flushAll();
      expect(ref.ref().push).toHaveBeenCalled();
    });
  });

  describe('$set', function() {
    var $fb, flushAll;
    beforeEach(function() {
      $fb = $firebase(new Firebase('Mock://').child('data'));
      flushAll = flush.bind(null, $fb.$ref());
    });

    it('should return a promise', function() {
      var res = $fb.$set(null);
      expect(angular.isObject(res)).toBe(true);
      expect(typeof res.then).toBe('function');
    });

    it('should resolve to ref for child key', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      $fb.$set('reftest', {foo: 'bar'}).then(whiteSpy, blackSpy);
      flushAll();
      expect(blackSpy).not.toHaveBeenCalled();
      expect(whiteSpy).toHaveBeenCalledWith($fb.$ref().child('reftest'));
    });

    it('should resolve to ref if no key', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      $fb.$set({foo: 'bar'}).then(whiteSpy, blackSpy);
      flushAll();
      expect(blackSpy).not.toHaveBeenCalled();
      expect(whiteSpy).toHaveBeenCalledWith($fb.$ref());
    });

    it('should save a child if key used', function() {
      $fb.$set('foo', 'bar');
      flushAll();
      expect($fb.$ref().getData()['foo']).toEqual('bar');
    });

    it('should save everything if no key', function() {
      $fb.$set(true);
      flushAll();
      expect($fb.$ref().getData()).toBe(true);
    });

    it('should reject if fails', function() {
      $fb.$ref().failNext('set', 'setfail');
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      $fb.$set({foo: 'bar'}).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('setfail');
    });

    it('should affect query keys only if query used', function() {
      var ref = new Firebase('Mock://').child('ordered').limit(1);
      var $fb = $firebase(ref);
      spyOn(ref.ref(), 'update');
      ref.flush();
      var expKeys = ref.slice().keys;
      $fb.$set({hello: 'world'});
      ref.flush();
      var args = ref.ref().update.calls.mostRecent().args[0];
      expect(Object.keys(args)).toEqual(['hello'].concat(expKeys));
    });
  });

  describe('$remove', function() {
    var $fb, flushAll;
    beforeEach(function() {
      $fb = $firebase(new Firebase('Mock://').child('data'));
      flushAll = flush.bind(null, $fb.$ref());
    });

    it('should return a promise', function() {
      var res = $fb.$remove();
      expect(angular.isObject(res)).toBe(true);
      expect(typeof res.then).toBe('function');
    });

    it('should resolve to ref if no key', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      $fb.$remove().then(whiteSpy, blackSpy);
      flushAll();
      expect(blackSpy).not.toHaveBeenCalled();
      expect(whiteSpy).toHaveBeenCalledWith($fb.$ref());
    });

    it('should resolve to ref if query', function() {
      var spy = jasmine.createSpy('resolve');
      var ref = new Firebase('Mock://').child('ordered').limit(2);
      var $fb = $firebase(ref);
      $fb.$remove().then(spy);
      flushAll(ref);
      flushAll(ref);
      expect(spy).toHaveBeenCalledWith(ref);
    });

    it('should resolve to child ref if key', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      $fb.$remove('b').then(whiteSpy, blackSpy);
      flushAll();
      expect(blackSpy).not.toHaveBeenCalled();
      expect(whiteSpy).toHaveBeenCalledWith($fb.$ref().child('b'));
    });

    it('should remove a child if key used', function() {
      $fb.$remove('c');
      flushAll();
      var dat = $fb.$ref().getData();
      expect(angular.isObject(dat)).toBe(true);
      expect(dat.hasOwnProperty('c')).toBe(false);
    });

    it('should remove everything if no key', function() {
      $fb.$remove();
      flushAll();
      expect($fb.$ref().getData()).toBe(null);
    });

    it('should reject if fails', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      $fb.$ref().failNext('remove', 'test_fail_remove');
      $fb.$remove().then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('test_fail_remove');
    });

    it('should remove data in Firebase', function() {
      spyOn($fb.$ref(), 'remove');
      $fb.$remove();
      flushAll();
      expect($fb.$ref().remove).toHaveBeenCalled();
    });

    it('should only remove keys in query if used on a query', function() {
      var ref = new Firebase('Mock://').child('ordered').limit(2);
      var keys = ref.slice().keys;
      var origKeys = ref.ref().getKeys();
      expect(keys.length).toBeGreaterThan(0);
      expect(origKeys.length).toBeGreaterThan(keys.length);
      var $fb = $firebase(ref);
      flushAll(ref);
      origKeys.forEach(function (key) {
        spyOn(ref.ref().child(key), 'remove');
      });
      $fb.$remove();
      flushAll(ref);
      keys.forEach(function(key) {
        expect(ref.ref().child(key).remove).toHaveBeenCalled();
      });
      origKeys.forEach(function(key) {
        if( keys.indexOf(key) === -1 ) {
          expect(ref.ref().child(key).remove).not.toHaveBeenCalled();
        }
      });
    });

    it('should wait to resolve promise until data is actually deleted',function(){
      var ref = new Firebase('Mock://').child('ordered').limit(2);
      var $fb = $firebase(ref);
      var resolved = false;
      $fb.$remove().then(function(){
        resolved = true;
      });
      try {$timeout.flush();} catch(e){} //this may actually throw an error
      expect(resolved).toBe(false);
      flushAll(ref);
      flushAll(ref);
      expect(resolved).toBe(true);
    });
  });

  describe('$update', function() {
    var $fb, flushAll;
    beforeEach(function() {
      $fb = $firebase(new Firebase('Mock://').child('data'));
      flushAll = flush.bind(null, $fb.$ref());
    });

    it('should return a promise', function() {
      expect($fb.$update({foo: 'bar'})).toBeAPromise();
    });

    it('should resolve to ref when done', function() {
      var spy = jasmine.createSpy('resolve');
      $fb.$update('index', {foo: 'bar'}).then(spy);
      flushAll();
      var arg = spy.calls.argsFor(0)[0];
      expect(arg).toBeAFirebaseRef();
      expect(arg.key()).toBe('index');
    });

    it('should reject if failed', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      $fb.$ref().failNext('update', 'oops');
      $fb.$update({index: {foo: 'bar'}}).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalled();
    });

    it('should not destroy untouched keys', function() {
      flushAll();
      var data = $fb.$ref().getData();
      data.a = 'foo';
      delete data.b;
      expect(Object.keys(data).length).toBeGreaterThan(1);
      $fb.$update({a: 'foo', b: null});
      flushAll();
      expect($fb.$ref().getData()).toEqual(data);
    });

    it('should replace keys specified', function() {
      $fb.$update({a: 'foo', b: null});
      flushAll();
      var data = $fb.$ref().getData();
      expect(data.a).toBe('foo');
      expect(data.b).toBeUndefined();
    });

    it('should work on a query object', function() {
      var $fb2 = $firebase($fb.$ref().limit(1));
      flushAll();
      $fb2.$update({foo: 'bar'});
      flushAll();
      expect($fb2.$ref().ref().getData().foo).toBe('bar');
    });
  });

  describe('$transaction', function() {
    var $fb, flushAll;
    beforeEach(function() {
      $fb = $firebase(new Firebase('Mock://').child('data'));
      flushAll = flush.bind(null, $fb.$ref());
    });

    it('should return a promise', function() {
      expect($fb.$transaction('a', function() {})).toBeAPromise();
    });

    it('should resolve to snapshot on success', function() {
      var whiteSpy = jasmine.createSpy('success');
      var blackSpy = jasmine.createSpy('failed');
      $fb.$transaction('a', function() { return true; }).then(whiteSpy, blackSpy);
      flushAll();
      expect(blackSpy).not.toHaveBeenCalled();
      expect(whiteSpy).toHaveBeenCalled();
      expect(whiteSpy.calls.argsFor(0)[0]).toBeASnapshot();
    });

    it('should resolve to null on abort', function() {
      var spy = jasmine.createSpy('success');
      $fb.$transaction('a', function() {}).then(spy);
      flushAll();
      expect(spy).toHaveBeenCalledWith(null);
    });

    it('should reject if failed', function() {
      var whiteSpy = jasmine.createSpy('success');
      var blackSpy = jasmine.createSpy('failed');
      $fb.$ref().child('a').failNext('transaction', 'test_fail');
      $fb.$transaction('a', function() { return true; }).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('test_fail');
    });

    it('should modify data in firebase', function() {
      var newData = {hello: 'world'};
      $fb.$transaction('c', function() { return newData; });
      flushAll();
      expect($fb.$ref().child('c').getData()).toEqual(jasmine.objectContaining(newData));
    });

    it('should work okay on a query', function() {
      var whiteSpy = jasmine.createSpy('success');
      var blackSpy = jasmine.createSpy('failed');
      $fb.$transaction(function() { return 'happy'; }).then(whiteSpy, blackSpy);
      flushAll();
      expect(blackSpy).not.toHaveBeenCalled();
      expect(whiteSpy).toHaveBeenCalled();
      expect(whiteSpy.calls.argsFor(0)[0]).toBeASnapshot();
    });
  });

  describe('$asArray', function() {
    var $ArrayFactory, $fb;

    function flushAll() {
      flush($fb.$ref());
    }

    beforeEach(function() {
      $ArrayFactory = stubArrayFactory();
      $fb = $firebase(new Firebase('Mock://').child('data'), {arrayFactory: $ArrayFactory});
    });

    it('should call $FirebaseArray constructor with correct args', function() {
      var arr = $fb.$asArray();
      expect($ArrayFactory).toHaveBeenCalledWith($fb, jasmine.any(Function), jasmine.objectContaining({}));
      expect(arr.$$$readyPromise).toBeAPromise();
    });

    it('should return the factory value (an array)', function() {
      var factory = stubArrayFactory();
      var res = $firebase($fb.$ref(), {arrayFactory: factory}).$asArray();
      expect(res).toBe(factory.$myArray);
    });

    it('should explode if ArrayFactory does not return an array', function() {
      expect(function() {
        function fn() { return {}; }
        $firebase(new Firebase('Mock://').child('data'), {arrayFactory: fn}).$asArray();
      }).toThrowError(Error);
    });

    it('should contain data in ref() after load', function() {
      var count = Object.keys($fb.$ref().getData()).length;
      expect(count).toBeGreaterThan(1);
      var arr = $fb.$asArray();
      flushAll();
      expect(arr.$$added).toHaveCallCount(count);
    });

    it('should return same instance if called multiple times', function() {
      expect($fb.$asArray()).toBe($fb.$asArray());
    });

    it('should use arrayFactory', function() {
      var spy = stubArrayFactory();
      $firebase($fb.$ref(), {arrayFactory: spy}).$asArray();
      expect(spy).toHaveBeenCalled();
    });

    it('should match query keys if query used', function() {
      // needs to contain more than 2 items in data for this limit to work
      expect(Object.keys($fb.$ref().getData()).length).toBeGreaterThan(2);
      var ref = $fb.$ref().limit(2);
      var arr = $firebase(ref, {arrayFactory: $ArrayFactory}).$asArray();
      flushAll();
      expect(arr.$$added).toHaveCallCount(2);
    });

    it('should return new instance if old one is destroyed', function() {
      var arr = $fb.$asArray();
      // invoke the destroy function
      arr.$$$destroyFn();
      expect($fb.$asObject()).not.toBe(arr);
    });

    it('should call $$added if child_added event is received', function() {
      var arr = $fb.$asArray();
      // flush all the existing data through
      flushAll();
      arr.$$added.calls.reset();
      // now add a new record and see if it sticks
      $fb.$ref().push({hello: 'world'});
      flushAll();
      expect(arr.$$added).toHaveCallCount(1);
    });

    it('should call $$updated if child_changed event is received', function() {
      var arr = $fb.$asArray();
      // flush all the existing data through
      flushAll();
      arr.$getRecord.and.returnValue({$id: 'c'});
      // now change a new record and see if it sticks
      $fb.$ref().child('c').set({hello: 'world'});
      flushAll();
      expect(arr.$$updated).toHaveCallCount(1);
    });

    it('should not call $$updated if rec does not exist', function() {
      var arr = $fb.$asArray();
      // flush all the existing data through
      flushAll();
      arr.$getRecord.and.returnValue(null);
      // now change a new record and see if it sticks
      $fb.$ref().child('c').set({hello: 'world'});
      flushAll();
      expect(arr.$$updated).not.toHaveBeenCalled();
    });

    it('should call $$moved if child_moved event is received', function() {
      var arr = $fb.$asArray();
      // flush all the existing data through
      flushAll();
      arr.$getRecord.and.returnValue({$id: 'c'});
      // now change a new record and see if it sticks
      $fb.$ref().child('c').setPriority(299);
      flushAll();
      expect(arr.$$moved).toHaveCallCount(1);
    });

    it('should not call $$moved if rec does not exist', function() {
      var arr = $fb.$asArray();
      // flush all the existing data through
      flushAll();
      arr.$getRecord.and.returnValue(null);
      // now change a new record and see if it sticks
      $fb.$ref().child('c').setPriority(299);
      flushAll();
      expect(arr.$$moved).not.toHaveBeenCalled();
    });

    it('should call $$removed if child_removed event is received', function() {
      var arr = $fb.$asArray();
      // flush all the existing data through
      flushAll();
      arr.$getRecord.and.returnValue({$id: 'a'});
      // now change a new record and see if it sticks
      $fb.$ref().child('a').remove();
      flushAll();
      expect(arr.$$removed).toHaveCallCount(1);
    });

    it('should not call $$removed if rec does not exist', function() {
      var arr = $fb.$asArray();
      // flush all the existing data through
      flushAll();
      arr.$getRecord.and.returnValue(null);
      // now change a new record and see if it sticks
      $fb.$ref().child('a').remove();
      flushAll();
      expect(arr.$$removed).not.toHaveBeenCalled();
    });

    it('should call $$error if an error event occurs', function() {
      var arr = $fb.$asArray();
      // flush all the existing data through
      flushAll();
      $fb.$ref().forceCancel('test_failure');
      flushAll();
      expect(arr.$$error).toHaveBeenCalledWith('test_failure');
    });

    it('should resolve readyPromise after initial data loaded', function() {
      var arr = $fb.$asArray();
      var spy = jasmine.createSpy('resolved').and.callFake(function(arrRes) {
        expect(arrRes.$$added).toHaveCallCount($fb.$ref().getKeys().length);
      });
      arr.$$$readyPromise.then(spy);
      expect(spy).not.toHaveBeenCalled();
      flushAll($fb.$ref());
      expect(spy).toHaveBeenCalled();
    });

    it('should cancel listeners if destroyFn is invoked', function() {
      var ref = $fb.$ref();
      spyOn(ref, 'on').and.callThrough();
      spyOn(ref, 'off').and.callThrough();
      var arr = $fb.$asArray();
      flushAll();
      expect(ref.on).toHaveBeenCalled();
      arr.$$$destroyFn();
      expect(ref.off).toHaveCallCount(ref.on.calls.count());
    });

    it('should trigger an angular compile', function() {
      $fb.$asObject(); // creates the listeners
      var ref = $fb.$ref();
      flushAll();
      $utils.wait.completed.calls.reset();
      ref.push({newa: 'newa'});
      flushAll();
      expect($utils.wait.completed).toHaveBeenCalled();
    });

    it('should batch requests', function() {
      $fb.$asArray(); // creates listeners
      flushAll();
      $utils.wait.completed.calls.reset();
      var ref = $fb.$ref();
      ref.push({newa: 'newa'});
      ref.push({newb: 'newb'});
      ref.push({newc: 'newc'});
      ref.push({newd: 'newd'});
      flushAll();
      expect($utils.wait.completed).toHaveCallCount(1);
    });
  });

  describe('$asObject', function() {
    var $fb;

    function flushAll() {
      flush($fb.$ref());
    }

    beforeEach(function() {
      var Factory = stubObjectFactory();
      $fb = $firebase(new Firebase('Mock://').child('data'), {objectFactory: Factory});
      $fb.$Factory = Factory;
    });

    it('should contain data in ref() after load', function() {
      var data = $fb.$ref().getData();
      var obj = $fb.$asObject();
      flushAll();
      expect(obj.$$updated.calls.argsFor(0)[0].val()).toEqual(jasmine.objectContaining(data));
    });

    it('should return same instance if called multiple times', function() {
      expect($fb.$asObject()).toBe($fb.$asObject());
    });

    it('should use recordFactory', function() {
      var res = $fb.$asObject();
      expect(res).toBeInstanceOf($fb.$Factory);
    });

    it('should only contain query keys if query used', function() {
      var ref = $fb.$ref().limit(2);
      // needs to have more data than our query slice
      expect(ref.ref().getKeys().length).toBeGreaterThan(2);
      var obj = $fb.$asObject();
      flushAll();
      var snap = obj.$$updated.calls.argsFor(0)[0];
      expect(snap.val()).toEqual(jasmine.objectContaining(ref.getData()));
    });

    it('should call $$updated if value event is received', function() {
      var obj = $fb.$asObject();
      var ref = $fb.$ref();
      flushAll();
      obj.$$updated.calls.reset();
      expect(obj.$$updated).not.toHaveBeenCalled();
      ref.set({foo: 'bar'});
      flushAll();
      expect(obj.$$updated).toHaveBeenCalled();
    });

    it('should call $$error if an error event occurs', function() {
      var ref = $fb.$ref();
      var obj = $fb.$asObject();
      flushAll();
      expect(obj.$$error).not.toHaveBeenCalled();
      ref.forceCancel('test_cancel');
      flushAll();
      expect(obj.$$error).toHaveBeenCalledWith('test_cancel');
    });

    it('should resolve readyPromise after initial data loaded', function() {
      var obj = $fb.$asObject();
      var spy = jasmine.createSpy('resolved').and.callFake(function(obj) {
        var snap = obj.$$updated.calls.argsFor(0)[0];
        expect(snap.val()).toEqual(jasmine.objectContaining($fb.$ref().getData()));
      });
      obj.$$$readyPromise.then(spy);
      expect(spy).not.toHaveBeenCalled();
      flushAll();
      expect(spy).toHaveBeenCalled();
    });

    it('should cancel listeners if destroyFn is invoked', function() {
      var ref = $fb.$ref();
      spyOn(ref, 'on').and.callThrough();
      spyOn(ref, 'off').and.callThrough();
      var obj = $fb.$asObject();
      flushAll();
      expect(ref.on).toHaveBeenCalled();
      obj.$$$destroyFn();
      expect(ref.off).toHaveCallCount(ref.on.calls.count());
    });

    it('should trigger an angular compile', function() {
      $fb.$asObject(); // creates the listeners
      var ref = $fb.$ref();
      flushAll();
      $utils.wait.completed.calls.reset();
      ref.push({newa: 'newa'});
      flushAll();
      expect($utils.wait.completed).toHaveBeenCalled();
    });

    it('should batch requests', function() {
      $fb.$asObject(); // creates the listeners
      flushAll();
      $utils.wait.completed.calls.reset();
      var ref = $fb.$ref();
      ref.push({newa: 'newa'});
      ref.push({newb: 'newb'});
      ref.push({newc: 'newc'});
      ref.push({newd: 'newd'});
      flushAll();
      expect($utils.wait.completed).toHaveCallCount(1);
    });
  });

  function stubArrayFactory() {
    var arraySpy = [];
    angular.forEach(['$$added', '$$updated', '$$moved', '$$removed', '$$error', '$getRecord', '$indexFor'], function(m) {
      arraySpy[m] = jasmine.createSpy(m);
    });
    var factory = jasmine.createSpy('ArrayFactory')
      .and.callFake(function(inst, destroyFn, readyPromise) {
        arraySpy.$$$destroyFn = destroyFn;
        arraySpy.$$$readyPromise = readyPromise;
        return arraySpy;
      });
    factory.$myArray = arraySpy;
    return factory;
  }

  function stubObjectFactory() {
    function Factory(inst, destFn, readyPromise) {
      this.$$$destroyFn = destFn;
      this.$$$readyPromise = readyPromise;
    }
    angular.forEach(['$$updated', '$$error'], function(m) {
      Factory.prototype[m] = jasmine.createSpy(m);
    });
    return Factory;
  }

  function flush() {
    // the order of these flush events is significant
    Array.prototype.slice.call(arguments, 0).forEach(function(o) {
      o.flush();
    });
    try { $timeout.flush(); }
    catch(e) {}
  }
});
