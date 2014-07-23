'use strict';
describe('$firebase', function () {

  var $firebase, $timeout, $fb, $rootScope;

  beforeEach(function() {
    module('mock.firebase');
    module('firebase');
    inject(function (_$firebase_, _$timeout_, _$rootScope_) {
      $firebase = _$firebase_;
      $timeout = _$timeout_;
      $rootScope = _$rootScope_;
      $fb = $firebase(new Firebase('Mock://').child('data'));
      flushAll();
    });
  });

  describe('<constructor>', function() {
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
  });

  describe('$ref', function() {
    it('should return ref that created the $firebase instance', function() {
      var ref = new Firebase('Mock://');
      var $fb = new $firebase(ref);
      expect($fb.$ref()).toBe(ref);
    });
  });

  describe('$push', function() {
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
      expect(ref.name()).toBe(newId);
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
        expect($fb.$ref().getData()[ref.name()]).toEqual({foo: 'pushtest'});
      });
      $fb.$push({foo: 'pushtest'}).then(spy);
      flushAll();
      expect(spy).toHaveBeenCalled();
    });

    it('should work on a query', function() {
      var ref = new Firebase('Mock://').child('ordered').limit(5);
      var $fb = $firebase(ref);
      flushAll();
      expect(ref.ref().push).not.toHaveBeenCalled();
      $fb.$push({foo: 'querytest'});
      flushAll();
      expect(ref.ref().push).toHaveBeenCalled();
    });
  });

  describe('$set', function() {
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
      ref.flush();
      var expKeys = ref.slice().keys;
      $fb.$set({hello: 'world'});
      ref.flush();
      var args = ref.ref().update.calls.mostRecent().args[0];
      expect(_.keys(args)).toEqual(['hello'].concat(expKeys));
    });
  });

  describe('$remove', function() {
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
      $fb.$remove();
      flushAll();
      expect($fb.$ref().remove).toHaveBeenCalled();
    });

    //todo-test this is working, but MockFirebase is not properly deleting the records
    //todo-test https://github.com/katowulf/mockfirebase/issues/9
    xit('should only remove keys in query if used on a query', function() {
      var ref = new Firebase('Mock://').child('ordered').limit(2);
      var keys = ref.slice().keys;
      var origKeys = ref.ref().getKeys();
      var expLength = origKeys.length - keys.length;
      expect(keys.length).toBeGreaterThan(0);
      expect(origKeys.length).toBeGreaterThan(keys.length);
      var $fb = $firebase(ref);
      flushAll(ref);
      $fb.$remove();
      flushAll(ref);
      expect(ref.ref().getKeys().length).toBe(expLength);
    });
  });

  describe('$update', function() {
    it('should return a promise', function() {
      expect($fb.$update({foo: 'bar'})).toBeAPromise();
    });

    it('should resolve to ref when done', function() {
      var spy = jasmine.createSpy('resolve');
      $fb.$update('index', {foo: 'bar'}).then(spy);
      flushAll();
      var arg = spy.calls.argsFor(0)[0];
      expect(arg).toBeAFirebaseRef();
      expect(arg.name()).toBe('index');
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
    var $ArrayFactory, $fbArr;
    beforeEach(function() {
      $ArrayFactory = stubArrayFactory();
      $fbArr = $firebase(new Firebase('Mock://').child('data'), {arrayFactory: $ArrayFactory});
    });

    it('should call $FirebaseArray constructor with correct args', function() {
      var arr = $fbArr.$asArray();
      expect($ArrayFactory).toHaveBeenCalledWith($fbArr, jasmine.any(Function), jasmine.objectContaining({}));
      expect(arr.$readyPromise).toBeAPromise();
    });

    it('should return the factory value (an array)', function() {
      var factory = stubArrayFactory();
      var res = $firebase($fbArr.$ref(), {arrayFactory: factory}).$asArray();
      expect(res).toBe(factory.$myArray);
    });

    it('should explode if ArrayFactory does not return an array', function() {
      expect(function() {
        function fn() { return {}; }
        $firebase(new Firebase('Mock://').child('data'), {arrayFactory: fn}).$asArray();
      }).toThrowError(Error);
    });

    it('should contain data in ref() after load', function() {
      var count = Object.keys($fbArr.$ref().getData()).length;
      expect(count).toBeGreaterThan(1);
      var arr = $fbArr.$asArray();
      flushAll($fbArr.$ref());
      expect(arr.$$added.calls.count()).toBe(count);
    });

    it('should return same instance if called multiple times', function() {
      expect($fbArr.$asArray()).toBe($fbArr.$asArray());
    });

    it('should use arrayFactory', function() {
      var spy = stubArrayFactory();
      $firebase($fbArr.$ref(), {arrayFactory: spy}).$asArray();
      expect(spy).toHaveBeenCalled();
    });

    it('should match query keys if query used', function() {
      // needs to contain more than 2 items in data for this limit to work
      expect(Object.keys($fbArr.$ref().getData()).length).toBeGreaterThan(2);
      var ref = $fbArr.$ref().limit(2);
      var arr = $firebase(ref, {arrayFactory: $ArrayFactory}).$asArray();
      flushAll(ref);
      expect(arr.$$added.calls.count()).toBe(2);
    });

    it('should return new instance if old one is destroyed', function() {
      var arr = $fbArr.$asArray();
      // invoke the destroy function
      arr.$destroyFn();
      expect($fbArr.$asObject()).not.toBe(arr);
    });

    it('should call $$added if child_added event is received', function() {
      var ref = $fbArr.$ref();
      var arr = $fbArr.$asArray();
      // flush all the existing data through
      flushAll(ref);
      arr.$$added.calls.reset();
      // now add a new record and see if it sticks
      ref.push({hello: 'world'});
      flushAll(ref);
      expect(arr.$$added.calls.count()).toBe(1);
    });

    it('should call $$updated if child_changed event is received', function() {
      var ref = $fbArr.$ref();
      var arr = $fbArr.$asArray();
      // flush all the existing data through
      flushAll(ref);
      // now change a new record and see if it sticks
      ref.child('c').set({hello: 'world'});
      flushAll(ref);
      expect(arr.$$updated.calls.count()).toBe(1);
    });

    it('should call $$moved if child_moved event is received', function() {
      var ref = $fbArr.$ref();
      var arr = $fbArr.$asArray();
      // flush all the existing data through
      flushAll(ref);
      // now change a new record and see if it sticks
      ref.child('c').setPriority(299);
      flushAll(ref);
      expect(arr.$$moved.calls.count()).toBe(1);
    });

    it('should call $$removed if child_removed event is received', function() {
      var ref = $fbArr.$ref();
      var arr = $fbArr.$asArray();
      // flush all the existing data through
      flushAll(ref);
      // now change a new record and see if it sticks
      ref.child('a').remove();
      flushAll(ref);
      expect(arr.$$removed.calls.count()).toBe(1);
    });

    it('should call $$error if an error event occurs', function() {
      var ref = $fbArr.$ref();
      var arr = $fbArr.$asArray();
      // flush all the existing data through
      flushAll(ref);
      ref.forceCancel('test_failure');
      flushAll(ref);
      expect(arr.$$error).toHaveBeenCalledWith('test_failure');
    });

    it('should resolve readyPromise after initial data loaded', function() {
      var arr = $fbArr.$asArray();
      var spy = jasmine.createSpy('resolved');
      arr.$readyPromise.then(spy);
      expect(spy).not.toHaveBeenCalled();
      flushAll($fbArr.$ref());
      expect(spy).toHaveBeenCalled();
    });

    it('should cancel listeners if destroyFn is invoked', function() {
      var arr = $fbArr.$asArray();
      var ref = $fbArr.$ref();
      flushAll(ref);
      expect(ref.on).toHaveBeenCalled();
      arr.$destroyFn();
      expect(ref.off.calls.count()).toBe(ref.on.calls.count());
    });
  });

  describe('$asObject', function() {
    var $fbObj, $FirebaseRecordFactory;

    beforeEach(function() {
      var Factory = stubObjectFactory();
      $fbObj = $firebase(new Firebase('Mock://').child('data'), {objectFactory: Factory});
      $fbObj.$Factory = Factory;
    });

    it('should contain data in ref() after load', function() {
      var data = $fbObj.$ref().getData();
      var obj = $fbObj.$asObject();
      flushAll($fbObj.$ref());
      expect(obj.$$updated.calls.argsFor(0)[0].val()).toEqual(jasmine.objectContaining(data));
    });

    it('should return same instance if called multiple times', function() {
      expect($fbObj.$asObject()).toBe($fbObj.$asObject());
    });

    it('should use recordFactory', function() {
      var res = $fbObj.$asObject();
      expect(res).toBeInstanceOf($fbObj.$Factory);
    });

    it('should only contain query keys if query used', function() {
      var ref = $fbObj.$ref().limit(2);
      // needs to have more data than our query slice
      expect(ref.ref().getKeys().length).toBeGreaterThan(2);
      var obj = $fbObj.$asObject();
      flushAll(ref);
      var snap = obj.$$updated.calls.argsFor(0)[0];
      expect(snap.val()).toEqual(jasmine.objectContaining(ref.getData()));
    });

    it('should call $$updated if value event is received', function() {
      var obj = $fbObj.$asObject();
      var ref = $fbObj.$ref();
      flushAll(ref);
      obj.$$updated.calls.reset();
      expect(obj.$$updated).not.toHaveBeenCalled();
      ref.set({foo: 'bar'});
      flushAll(ref);
      expect(obj.$$updated).toHaveBeenCalled();
    });

    it('should call $$error if an error event occurs', function() {
      var ref = $fbObj.$ref();
      var obj = $fbObj.$asObject();
      flushAll(ref);
      expect(obj.$$error).not.toHaveBeenCalled();
      ref.forceCancel('test_cancel');
      flushAll(ref);
      expect(obj.$$error).toHaveBeenCalledWith('test_cancel');
    });

    it('should resolve readyPromise after initial data loaded', function() {
      var obj = $fbObj.$asObject();
      var spy = jasmine.createSpy('resolved');
      obj.$readyPromise.then(spy);
      expect(spy).not.toHaveBeenCalled();
      flushAll($fbObj.$ref());
      expect(spy).toHaveBeenCalled();
    });

    it('should cancel listeners if destroyFn is invoked', function() {
      var obj = $fbObj.$asObject();
      var ref = $fbObj.$ref();
      flushAll(ref);
      expect(ref.on).toHaveBeenCalled();
      obj.$destroyFunction();
      expect(ref.off.calls.count()).toBe(ref.on.calls.count());
    });
  });

  function stubArrayFactory() {
    var arraySpy = [];
    angular.forEach(['$$added', '$$updated', '$$moved', '$$removed', '$$error'], function(m) {
      arraySpy[m] = jasmine.createSpy(m);
    });
    var factory = jasmine.createSpy('ArrayFactory')
      .and.callFake(function(inst, destroyFn, readyPromise) {
        arraySpy.$inst = inst;
        arraySpy.$destroyFn = destroyFn;
        arraySpy.$readyPromise = readyPromise;
        return arraySpy;
      });
    factory.$myArray = arraySpy;
    return factory;
  }

  function stubObjectFactory() {
    function Factory(inst, destFn, readyPromise) {
      this.$myInst = inst;
      this.$destroyFunction = destFn;
      this.$readyPromise = readyPromise;
    }
    angular.forEach(['$$updated', '$$error'], function(m) {
      Factory.prototype[m] = jasmine.createSpy(m);
    });
    return Factory;
  }

  function deepCopy(arr) {
    var newCopy = arr.slice();
    angular.forEach(arr, function(obj, k)  {
      newCopy[k] = angular.extend({}, obj);
    });
    return newCopy;
  }

  var flushAll = (function() {
    return function flushAll() {
      // the order of these flush events is significant
      $fb.$ref().flush();
      Array.prototype.slice.call(arguments, 0).forEach(function(o) {
        o.flush();
      });
      try { $timeout.flush(); }
      catch(e) {}
    }
  })();
});