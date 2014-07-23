'use strict';
describe('$FirebaseArray', function () {

  var $firebase, $fb, arr, $FirebaseArray, $utils, $rootScope, $timeout, destroySpy;
  beforeEach(function() {
    module('mock.firebase');
    module('firebase');
    inject(function ($firebase, _$FirebaseArray_, $firebaseUtils, _$rootScope_, _$timeout_) {
      destroySpy = jasmine.createSpy('destroy spy');
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      $FirebaseArray = _$FirebaseArray_;
      $utils = $firebaseUtils;
      $fb = $firebase(new Firebase('Mock://').child('data'));
      //todo-test right now we use $asArray() in order to test the sync functionality
      //todo-test we should mock SyncArray instead and isolate this after $asArray is
      //todo-test properly specified
      arr = $fb.$asArray();
      flushAll();
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

    it('should load primitives'); //todo-test

    it('should save priorities on records'); //todo-test

    it('should be ordered by priorities'); //todo-test
  });

  describe('$add', function() {
    it('should create data in Firebase', function() {
      var data = {foo: 'bar'};
      arr.$add(data);
      flushAll();
      var lastId = $fb.$ref().getLastAutoId();
      expect($fb.$ref().getData()[lastId]).toEqual(data);
    });

    it('should return a promise', function() {
      var res = arr.$add({foo: 'bar'});
      expect(typeof(res)).toBe('object');
      expect(typeof(res.then)).toBe('function');
    });

    it('should resolve to ref for new record', function() {
      var spy = jasmine.createSpy();
      arr.$add({foo: 'bar'}).then(spy);
      flushAll();
      var id = $fb.$ref().getLastAutoId();
      expect(id).toBeTruthy();
      expect(spy).toHaveBeenCalled();
      var args = spy.calls.argsFor(0);
      expect(args.length).toBeGreaterThan(0);
      var ref = args[0];
      expect(ref && ref.name()).toBe(id);
    });

    it('should reject promise on fail', function() {
      var successSpy = jasmine.createSpy('resolve spy');
      var errSpy = jasmine.createSpy('reject spy');
      $fb.$ref().failNext('set', 'rejecto');
      $fb.$ref().failNext('push', 'rejecto');
      arr.$add('its deed').then(successSpy, errSpy);
      flushAll();
      expect(successSpy).not.toHaveBeenCalled();
      expect(errSpy).toHaveBeenCalledWith('rejecto');
    });

    it('should work with a primitive value', function() {
      var successSpy = jasmine.createSpy('resolve spy');
      arr.$add('hello').then(successSpy);
      flushAll();
      expect(successSpy).toHaveBeenCalled();
      var lastId = successSpy.calls.argsFor(0)[0].name();
      expect($fb.$ref().getData()[lastId]).toEqual('hello');
    });

    it('should throw error if array is destroyed', function() {
      arr.$destroy();
      expect(function() {
        arr.$add({foo: 'bar'});
      }).toThrowError(Error);
    });
  });

  describe('$save', function() {
    it('should accept an array index', function() {
      var spy = spyOn($fb, '$set').and.callThrough();
      flushAll();
      var key = arr.$keyAt(2);
      arr[2].number = 99;
      arr.$save(2);
      var expResult = $utils.toJSON(arr[2]);
      flushAll();
      expect(spy).toHaveBeenCalled();
      var args = spy.calls.argsFor(0);
      expect(args[0]).toBe(key);
      expect(args[1]).toEqual(expResult);
    });

    it('should accept an item from the array', function() {
      var spy = spyOn($fb, '$set').and.callThrough();
      var key = arr.$keyAt(2);
      arr[2].number = 99;
      arr.$save(arr[2]);
      var expResult = $utils.toJSON(arr[2]);
      flushAll();
      expect(spy).toHaveBeenCalled();
      var args = spy.calls.argsFor(0);
      expect(args[0]).toBe(key);
      expect(args[1]).toEqual(expResult);
    });

    it('should save correct data into Firebase', function() {
      arr[1].number = 99;
      var key = arr.$keyAt(1);
      var expData = $utils.toJSON(arr[1]);
      arr.$save(1);
      flushAll();
      var m = $fb.$ref().child(key).set;
      expect(m).toHaveBeenCalled();
      var args = m.calls.argsFor(0);
      expect(args[0]).toEqual(expData);
    });

    it('should return a promise', function() {
      var res = arr.$save(1);
      expect(typeof res).toBe('object');
      expect(typeof res.then).toBe('function');
    });

    it('should resolve promise on sync', function() {
      var spy = jasmine.createSpy();
      arr.$save(1).then(spy);
      expect(spy).not.toHaveBeenCalled();
      flushAll();
      expect(spy.calls.count()).toBe(1);
    });

    it('should reject promise on failure', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var key = arr.$keyAt(1);
      $fb.$ref().child(key).failNext('set', 'no way jose');
      arr.$save(1).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('no way jose');
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
      expect($fb.$ref().child(key).set).toHaveBeenCalledWith(expData, jasmine.any(Function));
    });

    it('should throw error if object is destroyed', function() {
      arr.$destroy();
      expect(function() {
        arr.$save(0);
      }).toThrowError(Error);
    });
  });

  describe('$remove', function() {
    it('should remove data from Firebase', function() {
      var key = arr.$keyAt(1);
      arr.$remove(1);
      expect($fb.$ref().child(key).remove).toHaveBeenCalled();
    });

    it('should return a promise', function() {
      var res = arr.$remove(1);
      expect(typeof res).toBe('object');
      expect(typeof res.then).toBe('function');
    });

    it('should resolve promise on success', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      arr.$remove(1).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).toHaveBeenCalled();
      expect(blackSpy).not.toHaveBeenCalled();
    });

    it('should reject promise on failure', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      $fb.$ref().child(arr.$keyAt(1)).failNext('remove', 'test_failure');
      arr[1].number = 99;
      arr.$remove(1).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('test_failure');
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
  });

  describe('$loaded', function() {
    it('should return a promise', function() {
      var res = arr.$loaded();
      expect(typeof res).toBe('object');
      expect(typeof res.then).toBe('function');
    });

    it('should resolve when values are received', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      arr.$loaded().then(whiteSpy, blackSpy);
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

    it('should resolve after array has all current data in Firebase', function() {
      var arr = makeArray();
      var spy = jasmine.createSpy('resolve').and.callFake(function() {
        expect(arr.length).toBe(3);
      });
      arr.$loaded().then(spy);
      flushAll();
      expect(spy).not.toHaveBeenCalled();
      arr.$$test.load({
        a: {foo: 'a'},
        b: {foo: 'b'},
        c: {foo: 'c'}
      });
      expect(spy).toHaveBeenCalled();
    });

    it('should reject when error fetching records', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var arr = makeArray();
      arr.$loaded().then(whiteSpy, blackSpy);
      flushAll();
      arr.$$test.fail('test_fail');
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('test_fail');
    });
  });

  describe('$inst', function() {
    it('should return $firebase instance it was created with', function() {
      var res = arr.$inst();
      expect(res).toBe($fb);
    });
  });

  describe('$watch', function() {
    it('should get notified on an add', function() {
      var spy = jasmine.createSpy();
      arr.$watch(spy);
      $fb.$ref().fakeEvent('child_added', 'new', 'foo');
      flushAll();
      expect(spy).toHaveBeenCalled();
      var args = spy.calls.argsFor(0);
      expect(args[0]).toEqual({event: 'child_added', key: 'new', prevChild: null});
    });

    it('should get notified on a delete', function() {
      var spy = jasmine.createSpy();
      arr.$watch(spy);
      $fb.$ref().fakeEvent('child_removed', 'c');
      flushAll();
      expect(spy).toHaveBeenCalled();
      var args = spy.calls.argsFor(0);
      expect(args[0]).toEqual({event: 'child_removed', key: 'c'});
    });

    it('should get notified on a change', function() {
      var spy = jasmine.createSpy();
      arr.$watch(spy);
      $fb.$ref().fakeEvent('child_changed', 'c');
      flushAll();
      expect(spy).toHaveBeenCalled();
      var args = spy.calls.argsFor(0);
      expect(args[0]).toEqual({event: 'child_changed', key: 'c'});
    });

    it('should get notified on a move', function() {
      var spy = jasmine.createSpy();
      arr.$watch(spy);
      $fb.$ref().fakeEvent('child_moved', 'c', null, 'a');
      flushAll();
      expect(spy).toHaveBeenCalled();
      var args = spy.calls.argsFor(0);
      expect(args[0]).toEqual({event: 'child_moved', key: 'c', prevChild: 'a'});
    });

    it('should not get notified if destroy is invoked?'); //todo-test
  });

  describe('$destroy', function() { //todo should test these against the destroyFn instead of off()
    it('should cancel listeners', function() {
      var prev= $fb.$ref().off.calls.count();
      arr.$destroy();
      expect($fb.$ref().off.calls.count()).toBe(prev+4);
    });

    it('should empty the array', function() {
      expect(arr.length).toBeGreaterThan(0);
      arr.$destroy();
      expect(arr.length).toBe(0);
    });

    it('should reject $loaded() if not completed yet', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var arr = makeArray();
      arr.$loaded().then(whiteSpy, blackSpy);
      arr.$destroy();
      flushAll();
      expect(arr.$$test.spy).toHaveBeenCalled();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalled();
      expect(blackSpy.calls.argsFor(0)[0]).toMatch(/destroyed/i);
    });
  });

  //todo-test most of the functionality here is now part of SyncArray
  //todo-test should add tests for $$added, $$updated, $$moved, $$removed, $$error, and $$toJSON
  //todo-test then move this logic to $asArray

  describe('child_added', function() {
    it('should add to local array', function() {
      var len = arr.length;
      $fb.$ref().fakeEvent('child_added', 'fakeadd', {fake: 'add'}).flush();
      flushAll();
      expect(arr.length).toBe(len+1);
      expect(arr[0].$id).toBe('fakeadd');
      expect(arr[0]).toEqual(jasmine.objectContaining({fake: 'add'}));
    });

    it('should position after prev child', function() {
      var pos = arr.$indexFor('b')+1;
      $fb.$ref().fakeEvent('child_added', 'fakeadd', {fake: 'add'}, 'b').flush();
      flushAll();
      expect(arr[pos].$id).toBe('fakeadd');
      expect(arr[pos]).toEqual(jasmine.objectContaining({fake: 'add'}));
    });

    it('should position first if prevChild is null', function() {
      $fb.$ref().fakeEvent('child_added', 'fakeadd', {fake: 'add'}, null).flush();
      flushAll();
      expect(arr.$indexFor('fakeadd')).toBe(0);
    });

    it('should position last if prevChild not found', function() {
      $fb.$ref().fakeEvent('child_added', 'fakeadd', {fake: 'add'}, 'notarealid').flush();
      flushAll();
      expect(arr.$indexFor('fakeadd')).toBe(arr.length-1);
    });

    it('should not re-add if already exists', function() {
      var len = arr.length;
      $fb.$ref().fakeEvent('child_added', 'c', {fake: 'add'}).flush();
      expect(arr.length).toBe(len);
    });

    it('should accept a primitive', function() {
      $fb.$ref().fakeEvent('child_added', 'new', 'foo').flush();
      flushAll();
      var i = arr.$indexFor('new');
      expect(i).toBeGreaterThan(-1);
      expect(arr[i]).toEqual(jasmine.objectContaining({'$value': 'foo'}));
    });


    it('should trigger an angular compile', function() {
      var spy = spyOn($rootScope, '$apply').and.callThrough();
      var x = spy.calls.count();
      $fb.$ref().fakeEvent('child_added', 'b').flush();
      flushAll();
      expect(spy.calls.count()).toBeGreaterThan(x);
    });
  });

  describe('child_changed', function() {
    it('should update local data', function() {
      var i = arr.$indexFor('b');
      expect(i).toBeGreaterThan(-1);
      $fb.$ref().fakeEvent('child_changed', 'b', 'foo').flush();
      flushAll();
      expect(arr[i]).toEqual(jasmine.objectContaining({'$value': 'foo'}));
    });

    it('should ignore if not found', function() {
      var len = arr.length;
      var copy = deepCopy(arr);
      $fb.$ref().fakeEvent('child_changed', 'notarealkey', 'foo').flush();
      flushAll();
      expect(len).toBeGreaterThan(0);
      expect(arr.length).toBe(len);
      expect(arr).toEqual(copy);
    });

    it('should trigger an angular compile', function() {
      var spy = spyOn($rootScope, '$apply').and.callThrough();
      var x = spy.calls.count();
      $fb.$ref().fakeEvent('child_changed', 'b').flush();
      flushAll();
      expect(spy.calls.count()).toBeGreaterThan(x);
    });

    it('should preserve ids'); //todo-test

    it('should preserve priorities'); //todo-test
  });

  describe('child_moved', function() {
    it('should move local record', function() {
      var b = arr.$indexFor('b');
      var c = arr.$indexFor('c');
      expect(b).toBeLessThan(c);
      expect(b).toBeGreaterThan(-1);
      $fb.$ref().fakeEvent('child_moved', 'b', $utils.toJSON(arr[b]), 'c').flush();
      flushAll();
      expect(arr.$indexFor('c')).toBe(b);
      expect(arr.$indexFor('b')).toBe(c);
    });

    it('should position at 0 if prevChild is null', function() {
      var b = arr.$indexFor('b');
      expect(b).toBeGreaterThan(0);
      $fb.$ref().fakeEvent('child_moved', 'b', $utils.toJSON(arr[b]), null).flush();
      flushAll();
      expect(arr.$indexFor('b')).toBe(0);
    });

    it('should position at end if prevChild not found', function() {
      var b = arr.$indexFor('b');
      expect(b).toBeLessThan(arr.length-1);
      expect(b).toBeGreaterThan(0);
      $fb.$ref().fakeEvent('child_moved', 'b', $utils.toJSON(arr[b]), 'notarealkey').flush();
      flushAll();
      expect(arr.$indexFor('b')).toBe(arr.length-1);
    });

    it('should do nothing if record not found', function() {
      var copy = deepCopy(arr);
      $fb.$ref().fakeEvent('child_moved', 'notarealkey', true, 'c').flush();
      expect(arr).toEqual(copy);
    });

    it('should trigger an angular compile', function() {
      var spy = spyOn($rootScope, '$apply').and.callThrough();
      var x = spy.calls.count();
      $fb.$ref().fakeEvent('child_moved', 'b').flush();
      flushAll();
      expect(spy.calls.count()).toBeGreaterThan(x);
    });
  });

  describe('child_removed', function() {
    it('should remove from local array', function() {
      var len = arr.length;
      var i = arr.$indexFor('b');
      expect(i).toBeGreaterThan(0);
      $fb.$ref().fakeEvent('child_removed', 'b').flush();
      flushAll();
      expect(arr.length).toBe(len-1);
      expect(arr.$indexFor('b')).toBe(-1);
    });

    it('should do nothing if record not found', function() {
      var copy = deepCopy(arr);
      $fb.$ref().fakeEvent('child_removed', 'notakey').flush();
      expect(arr).toEqual(copy);
    });

    it('should trigger an angular compile', function() {
      var spy = spyOn($rootScope, '$apply').and.callThrough();
      var x = spy.calls.count();
      $fb.$ref().fakeEvent('child_removed', 'b').flush();
      flushAll();
      expect(spy.calls.count()).toBeGreaterThan(x);
    });
  });

  describe('$extendFactory', function() {
    it('should return a valid array', function() {
      var F = $FirebaseArray.$extendFactory({});
      expect(Array.isArray(new F($fb, noop, $utils.resolve()))).toBe(true);
    });

    it('should preserve child prototype', function() {
      function Extend() { $FirebaseArray.apply(this, arguments); }
      Extend.prototype.foo = function() {};
      $FirebaseArray.$extendFactory(Extend);
      var arr = new Extend($fb, noop, $utils.resolve());
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
      expect(new A($fb, noop, $utils.resolve()) instanceof $FirebaseArray).toBe(true);
    });

    it('should add on methods passed into function', function() {
      function foo() { return 'foo'; }
      var F = $FirebaseArray.$extendFactory({foo: foo});
      var res = new F($fb, noop, $utils.resolve());
      expect(typeof res.$$updated).toBe('function');
      expect(typeof res.foo).toBe('function');
      expect(res.foo()).toBe('foo');
    });
  });

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
      $rootScope.$digest();
      try { $timeout.flush(); }
      catch(e) {}
    }
  })();

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

  function makeArray(resolveWithData, $altFb) {
    if( !$altFb ) { $altFb = $fb; }
    var def = $utils.defer();
    var spy = jasmine.createSpy('destroy').and.callFake(function(err) {
      def.reject(err||'destroyed');
    });
    var list = new $FirebaseArray($altFb, spy, def.promise);
    list.$$test = {
      def: def,
      spy: spy,
      load: function(data) {
        var ref = $altFb.$ref();
        if( data === true ) { data = ref.getData(); }
        var prev = null;
        angular.forEach(data, function(v,key) {
          var pri;
          if( angular.isObject(v) && v.hasOwnProperty('$priority') ) {
            pri = data[key]['$priority'];
            delete data[key]['$priority'];
          }
          list.$$added(fakeSnap(ref.child(key), data[key], pri), prev);
          prev = key;
        });
        def.resolve(list);
        $timeout.flush();
      },
      fail: function(err) {
        def.reject(err);
        list.$$error(err);
        $timeout.flush();
      }
    };
    if( resolveWithData ) {
      list.$$test.load(resolveWithData);
    }
    return list;
  }

  function noop() {}

});