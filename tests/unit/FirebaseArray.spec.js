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

  var $firebase, $fb, $fbOldTodo, arr, $FirebaseArray, $utils, $rootScope, $timeout, destroySpy, testutils;
  beforeEach(function() {
    module('mock.firebase');
    module('firebase');
    module('testutils');
    inject(function ($firebase, _$FirebaseArray_, $firebaseUtils, _$rootScope_, _$timeout_, _testutils_) {
      testutils = _testutils_;
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
      var lastId = $fb.$ref().getLastAutoId();
      expect(spy).toHaveBeenCalledWith($fb.$ref().child(lastId));
    });

    it('should reject promise on fail', function() {
      var successSpy = jasmine.createSpy('resolve spy');
      var errSpy = jasmine.createSpy('reject spy');
      spyOn($fb.$ref(), 'push').and.returnValue($utils.reject('fail_push'));
      arr.$add('its deed').then(successSpy, errSpy);
      flushAll();
      expect(successSpy).not.toHaveBeenCalled();
      expect(errSpy).toHaveBeenCalledWith('fail_push');
    });

    it('should work with a primitive value', function() {
      arr.$add('hello');
      flushAll();
      expect(arr.$inst().$push).toHaveBeenCalledWith(jasmine.objectContaining({'.value': 'hello'}));
    });

    it('should throw error if array is destroyed', function() {
      arr.$destroy();
      expect(function() {
        arr.$add({foo: 'bar'});
      }).toThrowError(Error);
    });

    it('should store priorities', function() {
      var arr = stubArray();
      addAndProcess(arr, testutils.snap('one', 'b', 1), null);
      addAndProcess(arr, testutils.snap('two', 'a', 2), 'b');
      addAndProcess(arr, testutils.snap('three', 'd', 3), 'd');
      addAndProcess(arr, testutils.snap('four', 'c', 4), 'c');
      addAndProcess(arr, testutils.snap('five', 'e', 5), 'e');
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
      expect(resRef.key()).toBe(expName);
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
      var rec = arr.$getRecord('b');
      expect(rec).not.toBe(null);
      arr.$$removed(testutils.refSnap(testutils.ref('b')));
      arr.$$process('child_removed', rec);
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
    it('should get notified when $$notify is called', function() {
      var spy = jasmine.createSpy('$watch');
      arr.$watch(spy);
      arr.$$notify('child_removed', 'removedkey123', 'prevkey456');
      expect(spy).toHaveBeenCalledWith({event: 'child_removed', key: 'removedkey123', prevChild: 'prevkey456'});
    });

    it('should return a dispose function', function() {
      expect(arr.$watch(function() {})).toBeA('function');
    });

    it('should not get notified after dispose function is called', function() {
      var spy = jasmine.createSpy('$watch');
      var off = arr.$watch(spy);
      off();
      arr.$$notify('child_removed', 'removedkey123', 'prevkey456');
      expect(spy).not.toHaveBeenCalled();
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
    it('should return an object', function() {
      var snap = testutils.snap({foo: 'bar'}, 'newObj');
      var res = arr.$$added(snap);
      expect(res).toEqual(jasmine.objectContaining({foo: 'bar'}));
    });

    it('should return false if key already exists', function() {
      var snap = testutils.snap({foo: 'bar'}, 'a');
      var res = arr.$$added(snap);
      expect(res).toBe(false);
    });

    it('should accept a primitive', function() {
      var res = arr.$$added(testutils.snap(true, 'newPrimitive'), null);
      expect(res.$value).toBe(true);
    });

    it('should apply $$defaults if they exist', function() {
      var arr = stubArray(null, $FirebaseArray.$extendFactory({
        $$defaults: {aString: 'not_applied', foo: 'foo'}
      }));
      var res = arr.$$added(testutils.snap(STUB_DATA.a));
      expect(res.aString).toBe(STUB_DATA.a.aString);
      expect(res.foo).toBe('foo');
    });
  });

  describe('$$updated', function() {
    it('should return true if data changes', function() {
      var res = arr.$$updated(testutils.snap('foo', 'b'));
      expect(res).toBe(true);
    });

    it('should return false if data does not change', function() {
      var i = arr.$indexFor('b');
      var res = arr.$$updated(testutils.snap(arr[i], 'b'));
      expect(res).toBe(false);
    });

    it('should update local data', function() {
      var i = arr.$indexFor('b');
      expect(i).toBeGreaterThan(-1);
      arr.$$updated(testutils.snap('foo', 'b'));
      expect(arr[i]).toEqual(jasmine.objectContaining({'$value': 'foo'}));
    });

    it('should ignore if not found', function() {
      var len = arr.length;
      expect(len).toBeGreaterThan(0);
      var copy = testutils.deepCopyObject(arr);
      arr.$$updated(testutils.snap('foo', 'notarealkey'));
      expect(arr).toEqual(copy);
    });

    it('should preserve ids', function() {
      var pos = arr.$indexFor('b');
      expect(pos).toBeGreaterThan(-1);
      arr.$$updated(testutils.snap({foo: 'bar'}, 'b'));
      expect(arr[pos].$id).toBe('b');
    });

    it('should set priorities', function() {
      var pos = arr.$indexFor('b');
      expect(pos).toBeGreaterThan(-1);
      arr.$$updated(testutils.snap({foo: 'bar'}, 'b', 250));
      expect(arr[pos].$priority).toBe(250);
    });

    it('should apply $$defaults if they exist', function() {
      var arr = stubArray(STUB_DATA, $FirebaseArray.$extendFactory({
        $$defaults: {aString: 'not_applied', foo: 'foo'}
      }));
      var rec = arr.$getRecord('a');
      expect(rec.aString).toBe(STUB_DATA.a.aString);
      expect(rec.foo).toBe('foo');
      delete rec.foo;
      arr.$$updated(testutils.snap($utils.toJSON(rec), 'a'));
      expect(rec.aString).toBe(STUB_DATA.a.aString);
      expect(rec.foo).toBe('foo');
    });
  });

  describe('$$moved', function() {
    it('should set $priority', function() {
      var rec = arr.$getRecord('c');
      expect(rec.$priority).not.toBe(999);
      arr.$$moved(testutils.snap($utils.toJSON(rec), 'c', 999), 'd');
      expect(rec.$priority).toBe(999);
    });

    it('should return true if record exists', function() {
      var rec = arr.$getRecord('a');
      var res = arr.$$moved(testutils.snap($utils.toJSON(rec), 'a'), 'c');
      expect(res).toBe(true);
    });

    it('should return false record not found', function() {
      var res = arr.$$moved(testutils.snap(true, 'notarecord'), 'c');
      expect(res).toBe(false);
    });
  });

  describe('$$removed', function() {
    it('should return true if exists in data', function() {
      var res = arr.$$removed(testutils.snap(null, 'e'));
      expect(res).toBe(true);
    });

    it('should return false if does not exist in data', function() {
      var res = arr.$$removed(testutils.snap(null, 'notarecord'));
      expect(res).toBe(false);
    });
  });

  describe('$$error', function() {
    it('should call $destroy', function() {
      var spy = jasmine.createSpy('$destroy');
      var arr = stubArray(STUB_DATA, $FirebaseArray.$extendFactory({ $destroy: spy }));
      spy.calls.reset();
      arr.$$error('test_err');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('$$notify', function() {
    it('should notify $watch listeners', function() {
      var spy1 = jasmine.createSpy('$watch1');
      var spy2 = jasmine.createSpy('$watch2');
      arr.$watch(spy1);
      arr.$watch(spy2);
      arr.$$notify('added', 'e', 'd');
      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
    });

    it('should pass an object containing key, event, and prevChild if present', function() {
      var spy = jasmine.createSpy('$watch1');
      arr.$watch(spy);
      arr.$$notify('child_added', 'e', 'd');
      expect(spy).toHaveBeenCalledWith({event: 'child_added', key: 'e', prevChild: 'd'});
    });
  });

  describe('$$process', function() {

    /////////////// ADD
    it('should add to local array', function() {
      var len = arr.length;
      var rec = arr.$$added(testutils.snap({hello: 'world'}, 'addz'), 'b');
      arr.$$process('child_added', rec, 'b');
      expect(arr.length).toBe(len+1);
    });

    it('should position after prev child', function() {
      var pos = arr.$indexFor('b');
      expect(pos).toBeGreaterThan(-1);
      var rec = arr.$$added(testutils.snap({hello: 'world'}, 'addAfterB'), 'b');
      arr.$$process('child_added', rec, 'b');
      expect(arr.$keyAt(pos+1)).toBe('addAfterB');
    });

    it('should position first if prevChild is null', function() {
      var rec = arr.$$added(testutils.snap({hello: 'world'}, 'addFirst'), null);
      arr.$$process('child_added', rec, null);
      expect(arr.$keyAt(0)).toBe('addFirst');
    });

    it('should position last if prevChild not found', function() {
      var len = arr.length;
      var rec = arr.$$added(testutils.snap({hello: 'world'}, 'addLast'), 'notarealkeyinarray');
      arr.$$process('child_added', rec, 'notrealkeyinarray');
      expect(arr.$keyAt(len)).toBe('addLast');
    });

    it('should invoke $$notify with "child_added" event', function() {
      var spy = jasmine.createSpy('$$notify');
      var arr = stubArray(STUB_DATA, $FirebaseArray.$extendFactory({ $$notify: spy }));
      spy.calls.reset();
      var rec = arr.$$added(testutils.snap({hello: 'world'}, 'addFirst'), null);
      arr.$$process('child_added', rec, null);
      expect(spy).toHaveBeenCalled();
    });

    ///////////////// UPDATE

    it('should invoke $$notify with "child_changed" event', function() {
      var spy = jasmine.createSpy('$$notify');
      var arr = stubArray(STUB_DATA, $FirebaseArray.$extendFactory({ $$notify: spy }));
      spy.calls.reset();
      arr.$$updated(testutils.snap({hello: 'world'}, 'a'));
      arr.$$process('child_changed', arr.$getRecord('a'));
      expect(spy).toHaveBeenCalled();
    });

    ///////////////// MOVE
    it('should move local record', function() {
      var b = arr.$indexFor('b');
      var c = arr.$indexFor('c');
      arr.$$moved(testutils.refSnap(testutils.ref('b')), 'c');
      arr.$$process('child_moved', arr.$getRecord('b'), 'c');
      expect(arr.$indexFor('c')).toBe(b);
      expect(arr.$indexFor('b')).toBe(c);
    });

    it('should position at 0 if prevChild is null', function() {
      var b = arr.$indexFor('b');
      expect(b).toBeGreaterThan(0);
      arr.$$moved(testutils.snap(null, 'b'), null);
      arr.$$process('child_moved', arr.$getRecord('b'), null);
      expect(arr.$indexFor('b')).toBe(0);
    });

    it('should position at end if prevChild not found', function() {
      var b = arr.$indexFor('b');
      expect(b).toBeLessThan(arr.length-1);
      arr.$$moved(testutils.refSnap(testutils.ref('b')), 'notarealkey');
      arr.$$process('child_moved', arr.$getRecord('b'), 'notarealkey');
      expect(arr.$indexFor('b')).toBe(arr.length-1);
    });

    it('should invoke $$notify with "child_moved" event', function() {
      var spy = jasmine.createSpy('$$notify');
      var arr = stubArray(STUB_DATA, $FirebaseArray.$extendFactory({ $$notify: spy }));
      spy.calls.reset();
      arr.$$moved(testutils.refSnap(testutils.ref('b')), 'notarealkey');
      arr.$$process('child_moved', arr.$getRecord('b'), 'notarealkey');
      expect(spy).toHaveBeenCalled();
    });

    ///////////////// REMOVE
    it('should remove from local array', function() {
      var len = arr.length;
      expect(arr.$indexFor('b')).toBe(1);
      arr.$$removed(testutils.refSnap(testutils.ref('b')));
      arr.$$process('child_removed', arr.$getRecord('b'));
      expect(arr.length).toBe(len-1);
      expect(arr.$indexFor('b')).toBe(-1);
    });

    it('should trigger $$notify with "child_removed" event', function() {
      var spy = jasmine.createSpy('$$notify');
      var arr = stubArray(STUB_DATA, $FirebaseArray.$extendFactory({ $$notify: spy }));
      spy.calls.reset();
      arr.$$removed(testutils.refSnap(testutils.ref('e')));
      arr.$$process('child_removed', arr.$getRecord('e'));
      expect(spy).toHaveBeenCalled();
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

  //todo abstract into testutils
  function stubFb() {
    var ref = testutils.ref();
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

  function stubArray(initialData, Factory) {
    if( !Factory ) { Factory = $FirebaseArray; }
    var readyFuture = $utils.defer();
    var destroySpy = jasmine.createSpy('destroy').and.callFake(function(err) {
      readyFuture.reject(err||'destroyed');
    });
    var fb = stubFb();
    var arr = new Factory(fb, destroySpy, readyFuture.promise);
    if( initialData ) {
      var prev = null;
      for (var key in initialData) {
        if (initialData.hasOwnProperty(key)) {
          var pri = extractPri(initialData[key]);
          var rec = arr.$$added(testutils.snap(testutils.deepCopyObject(initialData[key]), key, pri), prev);
          arr.$$process('child_added', rec, prev);
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

  function addAndProcess(arr, snap, prevChild) {
    arr.$$process('child_added', arr.$$added(snap, prevChild), prevChild);
  }

  function noop() {}

});
