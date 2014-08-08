'use strict';
describe('$FirebaseArray', function () {

  var STUB_DATA = {
    'a': {
      aString: 'alpha',
      aNumber: 1,
      aBoolean: false
    },
    'b': {
      aString: 'bravo',
      aNumber: 2,
      aBoolean: true
    },
    'c': {
      aString: 'charlie',
      aNumber: 3,
      aBoolean: true
    },
    'd': {
      aString: 'delta',
      aNumber: 4,
      aBoolean: true
    },
    'e': {
      aString: 'echo',
      aNumber: 5
    }
  };

  var $firebase, $fb, $fbOldTodo, arr, arrOldTodo, $FirebaseArray, $utils, $rootScope, $timeout, destroySpy;
  beforeEach(function() {
    module('mock.firebase');
    module('firebase');
    inject(function ($firebase, _$FirebaseArray_, $firebaseUtils, _$rootScope_, _$timeout_) {
      destroySpy = jasmine.createSpy('destroy spy');
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      $FirebaseArray = _$FirebaseArray_;
      $utils = $firebaseUtils;
      arr = stubArray(STUB_DATA);
      $fb = arr.$$$fb;
    });
  });

  describe('<constructor>', function() {
    beforeEach(function() {
      inject(function($firebaseUtils, $FirebaseArray) {
        this.$utils = $firebaseUtils;
        this.$FirebaseArray = $FirebaseArray;
      });
    });

    it('should return a valid array', function() {
      expect(Array.isArray(arr)).toBe(true);
    });

    it('should have API methods', function() {
      var i = 0;
      this.$utils.getPublicMethods($FirebaseArray, function(v,k) {
        expect(typeof arr[k]).toBe('function');
        i++;
      });
      expect(i).toBeGreaterThan(0);
    });
  });

  describe('$add', function() {
    it('should call $push on $firebase', function() {
      var data = {foo: 'bar'};
      arr.$add(data);
      expect($fb.$push).toHaveBeenCalled();
    });

    it('should return a promise', function() {
      expect(arr.$add({foo: 'bar'})).toBeAPromise();
    });

    it('should resolve to ref for new record', function() {
      var spy = jasmine.createSpy();
      arr.$add({foo: 'bar'}).then(spy);
      flushAll();
      expect(spy).toHaveBeenCalledWith($fb.$ref().$lastPushRef);
    });

    it('should reject promise on fail', function() {
      var successSpy = jasmine.createSpy('resolve spy');
      var errSpy = jasmine.createSpy('reject spy');
      $fb.$ref().push.and.returnValue($utils.reject('fail_push'));
      arr.$add('its deed').then(successSpy, errSpy);
      flushAll();
      expect(successSpy).not.toHaveBeenCalled();
      expect(errSpy).toHaveBeenCalledWith('fail_push');
    });

    it('should work with a primitive value', function() {
      var spy = jasmine.createSpy('resolve').and.callFake(function(ref) {
        expect(ref.getData()).toBe('hello');
      });
      arr.$add('hello').then(spy);
      flushAll();
      expect(spy).toHaveBeenCalled();
    });

    it('should throw error if array is destroyed', function() {
      arr.$destroy();
      expect(function() {
        arr.$add({foo: 'bar'});
      }).toThrowError(Error);
    });

    it('should store priorities', function() {
      var arr = stubArray();
      arr.$$added(fakeSnap(stubRef('b'), 'one', 1), null);
      arr.$$added(fakeSnap(stubRef('a'), 'two', 2), 'b');
      arr.$$added(fakeSnap(stubRef('d'), 'three', 3), 'd');
      arr.$$added(fakeSnap(stubRef('c'), 'four', 4), 'c');
      arr.$$added(fakeSnap(stubRef('e'), 'five', 5), 'e');
      expect(arr.length).toBe(5);
      for(var i=1; i <= 5; i++) {
        expect(arr[i-1].$priority).toBe(i);
      }
    });

    it('should observe $priority and $value meta keys if present', function() {
      var arr = stubArray();
      arr.$add({$value: 'foo', $priority: 99});
      expect(arr.$$$fb.$push).toHaveBeenCalledWith(jasmine.objectContaining({'.priority': 99, '.value': 'foo'}));
    });
  });

  describe('$save', function() {
    it('should accept an array index', function() {
      var spy = $fb.$set;
      var key = arr.$keyAt(2);
      arr[2].number = 99;
      arr.$save(2);
      var expResult = $utils.toJSON(arr[2]);
      expect(spy).toHaveBeenCalledWith(key, expResult);
    });

    it('should accept an item from the array', function() {
      var spy = $fb.$set;
      var key = arr.$keyAt(2);
      arr[2].number = 99;
      arr.$save(arr[2]);
      var expResult = $utils.toJSON(arr[2]);
      expect(spy).toHaveBeenCalledWith(key, expResult);
    });

    it('should return a promise', function() {
      expect(arr.$save(1)).toBeAPromise();
    });

    it('should resolve promise on sync', function() {
      var spy = jasmine.createSpy();
      arr.$save(1).then(spy);
      expect(spy).not.toHaveBeenCalled();
      flushAll();
      expect(spy).toHaveBeenCalled();
    });

    it('should reject promise on failure', function() {
      $fb.$set.and.returnValue($utils.reject('test_reject'));
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      arr.$save(1).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('test_reject');
    });

    it('should reject promise on bad index', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      arr.$save(99).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy.calls.argsFor(0)[0]).toMatch(/invalid/i);
    });

    it('should reject promise on bad object', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      arr.$save({foo: 'baz'}).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy.calls.argsFor(0)[0]).toMatch(/invalid/i);
    });

    it('should accept a primitive', function() {
      var key = arr.$keyAt(1);
      arr[1] = {$value: 'happy', $id: key};
      var expData = $utils.toJSON(arr[1]);
      arr.$save(1);
      flushAll();
      expect($fb.$set).toHaveBeenCalledWith(key, expData);
    });

    it('should throw error if object is destroyed', function() {
      arr.$destroy();
      expect(function() {
        arr.$save(0);
      }).toThrowError(Error);
    });

    it('should trigger watch event', function() {
      var spy = jasmine.createSpy('$watch');
      arr.$watch(spy);
      var key = arr.$keyAt(1);
      arr[1].foo = 'watchtest';
      arr.$save(1);
      flushAll();
      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({event: 'child_changed', key: key}));
    });
  });

  describe('$remove', function() {
    it('should call $remove on $firebase', function() {
      var key = arr.$keyAt(1);
      arr.$remove(1);
      expect($fb.$remove).toHaveBeenCalledWith(key);
    });

    it('should return a promise', function() {
      expect(arr.$remove(1)).toBeAPromise();
    });

    it('should resolve promise to ref on success', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var expName = arr.$keyAt(1);
      arr.$remove(1).then(whiteSpy, blackSpy);
      flushAll();
      var resRef = whiteSpy.calls.argsFor(0)[0];
      expect(whiteSpy).toHaveBeenCalled();
      expect(resRef).toBeAFirebaseRef();
      expect(resRef.name()).toBe(expName);
      expect(blackSpy).not.toHaveBeenCalled();
    });

    it('should reject promise on failure', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      $fb.$remove.and.returnValue($utils.reject('fail_remove'));
      arr.$remove(1).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('fail_remove');
    });

    it('should reject promise if bad int', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      arr.$remove(-99).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy.calls.argsFor(0)[0]).toMatch(/invalid/i);
    });

    it('should reject promise if bad object', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      arr.$remove({foo: false}).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy.calls.argsFor(0)[0]).toMatch(/invalid/i);
    });

    it('should throw Error if array destroyed', function() {
      arr.$destroy();
      expect(function () {
        arr.$remove(0);
      }).toThrowError(Error);
    });
  });

  describe('$keyAt', function() {
    it('should return key for an integer', function() {
      expect(arr.$keyAt(2)).toBe('c');
    });

    it('should return key for an object', function() {
      expect(arr.$keyAt(arr[2])).toBe('c');
    });

    it('should return null if invalid object', function() {
      expect(arr.$keyAt({foo: false})).toBe(null);
    });

    it('should return null if invalid integer', function() {
      expect(arr.$keyAt(-99)).toBe(null);
    });
  });

  describe('$indexFor', function() {
    it('should return integer for valid key', function() {
      expect(arr.$indexFor('c')).toBe(2);
    });

    it('should return -1 for invalid key', function() {
      expect(arr.$indexFor('notarealkey')).toBe(-1);
    });

    it('should not show up after removing the item', function() {
      expect(arr.$indexFor('b')).toBe(1);
      arr.$$removed(fakeSnap(stubRef('b')));
      expect(arr.$indexFor('b')).toBe(-1);
    });
  });

  describe('$loaded', function() {
    it('should return a promise', function() {
      expect(arr.$loaded()).toBeAPromise();
    });

    it('should resolve when values are received', function() {
      var arr = stubArray();
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      arr.$loaded().then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      arr.$$$readyFuture.resolve(arr);
      flushAll();
      expect(whiteSpy).toHaveBeenCalled();
      expect(blackSpy).not.toHaveBeenCalled();
    });

    it('should resolve to the array', function() {
      var spy = jasmine.createSpy('resolve');
      arr.$loaded().then(spy);
      flushAll();
      expect(spy).toHaveBeenCalledWith(arr);
    });

    it('should reject when error fetching records', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var arr = stubArray();
      arr.$$$readyFuture.reject('test_fail');
      arr.$loaded().then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('test_fail');
    });

    it('should resolve if function passed directly into $loaded', function() {
      var spy = jasmine.createSpy('resolve');
      arr.$loaded(spy);
      flushAll();
      expect(spy).toHaveBeenCalledWith(arr);
    });

    it('should reject properly when function passed directly into $loaded', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var arr = stubArray();
      arr.$$$readyFuture.reject('test_fail');
      arr.$loaded(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('test_fail');
    });
  });

  describe('$inst', function() {
    it('should return $firebase instance it was created with', function() {
      expect(arr.$inst()).toBe($fb);
    });
  });

  describe('$watch', function() {
    it('should get notified on an add', function() {
      var spy = jasmine.createSpy('$watch');
      arr.$watch(spy);
      arr.$$added(fakeSnap(stubRef('new_add'), {foo: 'bar'}), null);
      flushAll();
      expect(spy).toHaveBeenCalledWith({event: 'child_added', key: 'new_add', prevChild: null});
    });

    it('should get notified on a delete', function() {
      var spy = jasmine.createSpy('$watch');
      arr.$watch(spy);
      arr.$$removed(fakeSnap(stubRef('b'), {foo: 'bar'}));
      flushAll();
      expect(spy).toHaveBeenCalledWith({event: 'child_removed', key: 'b'});
    });

    it('should get notified on a change', function() {
      var spy = jasmine.createSpy('$watch');
      arr.$watch(spy);
      arr.$$updated(fakeSnap(stubRef('c'), {foo: 'bar'}));
      flushAll();
      expect(spy).toHaveBeenCalledWith({event: 'child_changed', key: 'c'});
    });

    it('should get notified on a move', function() {
      var spy = jasmine.createSpy('$watch');
      arr.$watch(spy);
      arr.$$moved(fakeSnap(stubRef('b'), {foo: 'bar'}), 'c');
      flushAll();
      expect(spy).toHaveBeenCalledWith({event: 'child_moved', key: 'b', prevChild: 'c'});
    });
  });

  describe('$destroy', function() {
    it('should call destroyFn', function() {
      arr.$destroy();
      expect(arr.$$$destroyFn).toHaveBeenCalled();
    });

    it('should empty the array', function() {
      expect(arr.length).toBeGreaterThan(0);
      arr.$destroy();
      expect(arr.length).toBe(0);
    });

    it('should reject $loaded() if not completed yet', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var arr = stubArray();
      arr.$loaded().then(whiteSpy, blackSpy);
      arr.$destroy();
      flushAll();
      expect(arr.$$$destroyFn).toHaveBeenCalled();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy.calls.argsFor(0)[0]).toMatch(/destroyed/i);
    });
  });

  describe('$$added', function() {
    it('should add to local array', function() {
      var len = arr.length;
      arr.$$added(fakeSnap(stubRef('addz'), {hello: 'world'}), 'b');
      expect(arr.length).toBe(len+1);
    });

    it('should position after prev child', function() {
      var pos = arr.$indexFor('b');
      expect(pos).toBeGreaterThan(-1);
      arr.$$added(fakeSnap(stubRef('addAfterB'), {hello: 'world'}), 'b');
      expect(arr.$keyAt(pos+1)).toBe('addAfterB');
    });

    it('should position first if prevChild is null', function() {
      arr.$$added(fakeSnap(stubRef('addFirst'), {hello: 'world'}), null);
      expect(arr.$keyAt(0)).toBe('addFirst');
    });

    it('should position last if prevChild not found', function() {
      var len = arr.length;
      arr.$$added(fakeSnap(stubRef('addLast'), {hello: 'world'}), 'notarealkeyinarray');
      expect(arr.$keyAt(len)).toBe('addLast');
    });

    it('should not re-add if already exists', function() {
      var len = arr.length;
      arr.$$added(fakeSnap(stubRef('a'), {hello: 'world'}), 'b');
      expect(arr.length).toBe(len);
    });

    it('should accept a primitive', function() {
      arr.$$added(fakeSnap(stubRef('newPrimitive'), true), null);
      expect(arr.$indexFor('newPrimitive')).toBe(0);
      expect(arr[0].$value).toBe(true);
    });

    it('should notify $watch listeners', function() {
      var spy = jasmine.createSpy('$watch');
      arr.$watch(spy);
      arr.$$added(fakeSnap(stubRef('watchKey'), false), null);
      var expectEvent = {event: 'child_added', key: 'watchKey', prevChild: null};
      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining(expectEvent));
    });

    it('should not notify $watch listener if exists', function() {
      var spy = jasmine.createSpy('$watch');
      var pos = arr.$indexFor('a');
      expect(pos).toBeGreaterThan(-1);
      arr.$watch(spy);
      arr.$$added(fakeSnap(stubRef('a'), $utils.toJSON(arr[pos])), null);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('$$updated', function() {
    it('should update local data', function() {
      var i = arr.$indexFor('b');
      expect(i).toBeGreaterThan(-1);
      arr.$$updated(fakeSnap(stubRef('b'), 'foo'));
      expect(arr[i]).toEqual(jasmine.objectContaining({'$value': 'foo'}));
    });

    it('should ignore if not found', function() {
      var len = arr.length;
      expect(len).toBeGreaterThan(0);
      var copy = deepCopyObject(arr);
      arr.$$updated(fakeSnap(stubRef('notarealkey'), 'foo'));
      expect(arr).toEqual(copy);
    });

    it('should preserve ids', function() {
      var pos = arr.$indexFor('b');
      expect(pos).toBeGreaterThan(-1);
      arr.$$updated(fakeSnap(stubRef('b'), {foo: 'bar'}));
      expect(arr[pos].$id).toBe('b');
    });

    it('should set priorities', function() {
      var pos = arr.$indexFor('b');
      expect(pos).toBeGreaterThan(-1);
      arr.$$updated(fakeSnap(stubRef('b'), {foo: 'bar'}, 250));
      expect(arr[pos].$priority).toBe(250);
    });

    it('should notify $watch listeners', function() {
      var spy = jasmine.createSpy('$watch');
      arr.$watch(spy);
      arr.$$updated(fakeSnap(stubRef('b'), {foo: 'bar'}));
      flushAll();
      var expEvent = {event: 'child_changed', key: 'b'};
      expect(spy).toHaveBeenCalledWith(expEvent);
    });

    it('should not notify $watch listener if unchanged', function() {
      var spy = jasmine.createSpy('$watch');
      var pos = arr.$indexFor('a');
      arr.$watch(spy);
      arr.$$updated(fakeSnap(stubRef('a'), $utils.toJSON(arr[pos])), null);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('$$moved', function() {
    it('should move local record', function() {
      var b = arr.$indexFor('b');
      var c = arr.$indexFor('c');
      arr.$$moved(fakeSnap(stubRef('b')), 'c');
      expect(arr.$indexFor('c')).toBe(b);
      expect(arr.$indexFor('b')).toBe(c);
    });

    it('should position at 0 if prevChild is null', function() {
      var b = arr.$indexFor('b');
      expect(b).toBeGreaterThan(0);
      arr.$$moved(fakeSnap(stubRef('b')), null);
      expect(arr.$indexFor('b')).toBe(0);
    });

    it('should position at end if prevChild not found', function() {
      var b = arr.$indexFor('b');
      expect(b).toBeLessThan(arr.length-1);
      arr.$$moved(fakeSnap(stubRef('b')), 'notarealkey');
      expect(arr.$indexFor('b')).toBe(arr.length-1);
    });

    it('should do nothing if record not found', function() {
      var copy = deepCopyObject(arr);
      arr.$$moved(fakeSnap(stubRef('notarealkey')), 'a');
      expect(arr).toEqual(copy);
    });

    it('should notify $watch listeners', function() {
      var spy = jasmine.createSpy('$watch');
      var pos = arr.$indexFor('a');
      expect(pos).toBeGreaterThan(-1);
      arr.$watch(spy);
      arr.$$moved(fakeSnap(stubRef('a'), $utils.toJSON(arr[pos])), 'c');
      expect(spy).toHaveBeenCalled();
    });

    it('should not notify $watch listener if unmoved', function() {
      var spy = jasmine.createSpy('$watch');
      var pos = arr.$indexFor('a');
      expect(pos).toBe(0);
      arr.$watch(spy);
      arr.$$moved(fakeSnap(stubRef('a'), $utils.toJSON(arr[pos])), null);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('$$removed', function() {
    it('should remove from local array', function() {
      var len = arr.length;
      expect(arr.$indexFor('b')).toBe(1);
      arr.$$removed(fakeSnap(stubRef('b')));
      expect(arr.length).toBe(len-1);
      expect(arr.$indexFor('b')).toBe(-1);
    });


    it('should do nothing if record not found', function() {
      var copy = deepCopyObject(arr);
      arr.$$removed(fakeSnap(stubRef('notarealrecord')));
      expect(arr).toEqual(copy);
    });

    it('should notify $watch listeners', function() {
      var spy = jasmine.createSpy('$watch');
      arr.$watch(spy);
      expect(arr.$indexFor('e')).toBeGreaterThan(-1);
      arr.$$removed(fakeSnap(stubRef('e')));
      expect(spy).toHaveBeenCalled();
    });

    it('should not notify watch listeners if not found', function() {
      var spy = jasmine.createSpy('$watch');
      arr.$watch(spy);
      expect(arr.$indexFor('notarealrecord')).toBe(-1);
      arr.$$removed(fakeSnap(stubRef('notarealrecord')));
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('$$error', function() {
    it('should call $destroy', function() {
      //var spy = spyOn(arr, '$destroy');
      arr.$$error('test_err');
      //todo-test for some reason this spy does not trigger even though method is called
      //todo-test worked around for now by just checking the destroyFn
      //expect(spy).toHaveBeenCalled();
      expect(arr.$$$destroyFn).toHaveBeenCalled();
    });
  });

  describe('$extendFactory', function() {
    it('should return a valid array', function() {
      var F = $FirebaseArray.$extendFactory({});
      expect(Array.isArray(new F($fbOldTodo, noop, $utils.resolve()))).toBe(true);
    });

    it('should preserve child prototype', function() {
      function Extend() { $FirebaseArray.apply(this, arguments); }
      Extend.prototype.foo = function() {};
      $FirebaseArray.$extendFactory(Extend);
      var arr = new Extend($fbOldTodo, noop, $utils.resolve());
      expect(typeof(arr.foo)).toBe('function');
    });

    it('should return child class', function() {
      function A() {}
      var res = $FirebaseArray.$extendFactory(A);
      expect(res).toBe(A);
    });

    it('should be instanceof $FirebaseArray', function() {
      function A() {}
      $FirebaseArray.$extendFactory(A);
      expect(new A($fbOldTodo, noop, $utils.resolve()) instanceof $FirebaseArray).toBe(true);
    });

    it('should add on methods passed into function', function() {
      function foo() { return 'foo'; }
      var F = $FirebaseArray.$extendFactory({foo: foo});
      var res = new F($fbOldTodo, noop, $utils.resolve());
      expect(typeof res.$$updated).toBe('function');
      expect(typeof res.foo).toBe('function');
      expect(res.foo()).toBe('foo');
    });
  });

  function copySnapData(obj) {
    if( !angular.isObject(obj) ) { return obj; }
    var copy = {};
    $utils.each(obj, function(v,k) {
      copy[k] = angular.isObject(v)? deepCopyObject(v) : v;
    });
    return copy;
  }

  function deepCopyObject(obj) {
    var newCopy = angular.isArray(obj)? obj.slice() : angular.extend({}, obj);
    for (var key in newCopy) {
      if (newCopy.hasOwnProperty(key)) {
        if( angular.isObject(newCopy[key]) ) {
          newCopy[key] = deepCopyObject(newCopy[key]);
        }
      }
    }
    return newCopy;
  }

  var flushAll = (function() {
    return function flushAll() {
      // the order of these flush events is significant
      Array.prototype.slice.call(arguments, 0).forEach(function(o) {
        o.flush();
      });
      try { $timeout.flush(); }
      catch(e) {}
    }
  })();

  function fakeSnap(ref, data, pri) {
    data = copySnapData(data);
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

  function lastPartOfKey(key) {
    var parts = (key||'').split('/');
    return parts[parts.length-1];
  }

  var pushCounter = 1;
  function stubRef(key) {
    var stub = {};
    stub.$lastPushRef = null;
    stub.ref = jasmine.createSpy('ref').and.returnValue(stub);
    stub.child = jasmine.createSpy('child').and.callFake(function(childKey) { return stubRef(key+'/'+childKey); });
    stub.name = jasmine.createSpy('name').and.returnValue(lastPartOfKey(key));
    stub.on = jasmine.createSpy('on');
    stub.off = jasmine.createSpy('off');
    stub.once = jasmine.createSpy('once');
    stub.set = jasmine.createSpy('set');
    stub.transaction = jasmine.createSpy('transaction');
    stub.toString = jasmine.createSpy('toString').and.callFake(function() {
      return 'stub://'+key;
    });
    stub.push = jasmine.createSpy('push').and.callFake(function() {
      stub.$lastPushRef = stubRef('newpushid-'+(pushCounter++));
      return stub.$lastPushRef;
    });
    return stub;
  }

  function stubFb() {
    var ref = stubRef('data');
    var fb = {};
    [
      '$set', '$update', '$remove', '$transaction', '$asArray', '$asObject', '$ref', '$push'
    ].forEach(function(m) {
      var fn;
      switch(m) {
        case '$ref':
          fn = function() { return ref; };
          break;
        case '$push':
          fn = function() { return $utils.resolve(ref.push()); };
          break;
        case '$set':
        case '$update':
        case '$remove':
        case '$transaction':
        default:
          fn = function(key) {
            return $utils.resolve(typeof(key) === 'string'? ref.child(key) : ref);
          };
      }
      fb[m] = jasmine.createSpy(m).and.callFake(fn);
    });
    return fb;
  }

  function stubArray(initialData) {
    var readyFuture = $utils.defer();
    var destroySpy = jasmine.createSpy('destroy').and.callFake(function(err) {
      readyFuture.reject(err||'destroyed');
    });
    var fb = stubFb();
    var arr = new $FirebaseArray(fb, destroySpy, readyFuture.promise);
    if( initialData ) {
      var prev = null;
      for (var key in initialData) {
        if (initialData.hasOwnProperty(key)) {
          var pri = extractPri(initialData[key]);
          arr.$$added(fakeSnap(stubRef(key), deepCopyObject(initialData[key]), pri), prev);
          prev = key;
        }
      }
      readyFuture.resolve(arr);
      flushAll();
    }
    arr.$$$readyFuture = readyFuture;
    arr.$$$destroyFn = destroySpy;
    arr.$$$fb = fb;
    return arr;
  }

  function extractPri(dat) {
    if( angular.isObject(dat) && angular.isDefined(dat['.priority']) ) {
      return dat['.priority'];
    }
    return null;
  }

  function noop() {}

});