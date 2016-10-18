'use strict';
describe('$firebaseArray', function () {

  var DEFAULT_ID = 'REC1';
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

  var arr, $firebaseArray, $utils, $timeout, $rootScope, $q, tick, testutils;
  beforeEach(function() {
    module('firebase.database');
    module('testutils');
    inject(function (_$firebaseArray_, $firebaseUtils, _$timeout_, _$rootScope_, _$q_, _testutils_) {
      testutils = _testutils_;
      $timeout = _$timeout_;
      $firebaseArray = _$firebaseArray_;
      $utils = $firebaseUtils;
      $rootScope = _$rootScope_;
      $q = _$q_;

      firebase.database.enableLogging(function () {tick()});
      tick = function () {
        setTimeout(function() {
          $q.defer();
          $rootScope.$digest();
          try {
            $timeout.flush();
          } catch (err) {
            // This throws an error when there is nothing to flush...
          }
        })
      };

      arr = stubArray(STUB_DATA);
    });
  });

  describe('<constructor>', function() {
    beforeEach(function() {
      inject(function($firebaseUtils, $firebaseArray) {
        this.$utils = $firebaseUtils;
        this.$firebaseArray = $firebaseArray;
      });
    });

    it('should return a valid array', function() {
      expect(Array.isArray(arr)).toBe(true);
    });

    it('should have API methods', function() {
      var i = 0;
      this.$utils.getPublicMethods($firebaseArray, function(v,k) {
        expect(typeof arr[k]).toBe('function');
        i++;
      });
      expect(i).toBeGreaterThan(0);
    });
  });

  describe('$add', function() {
    it('should call $push on $firebase', function() {
      var spy = spyOn(firebase.database.Reference.prototype, 'push').and.callThrough();
      var data = {foo: 'bar'};
      arr.$add(data);
      expect(spy).toHaveBeenCalled();
    });

    it('should return a promise', function() {
      expect(arr.$add({foo: 'bar'})).toBeAPromise();
    });

    it('should resolve to ref for new record', function(done) {
      arr.$add({foo: 'bar'})
        .then(function (ref) {
          expect(ref.toString()).toBe(arr.$ref().child(ref.key).toString())
          done();
        });
    });

    it('should wait for promise resolution to update array', function () {
      var queue = [];
      function addPromise(snap, prevChild){
        return $q(
          function(resolve) {
            queue.push(resolve);
          }).then(function(name) {
            var data = $firebaseArray.prototype.$$added.call(arr, snap, prevChild);
            data.name = name;
            return data;
          });
      }
      arr = stubArray(null, $firebaseArray.$extend({$$added:addPromise}));
      expect(arr.length).toBe(0);
      arr.$add({userId:'1234'});
      expect(arr.length).toBe(0);
      expect(queue.length).toBe(1);
      queue[0]('James');
      $timeout.flush();
      expect(arr.length).toBe(1);
      expect(arr[0].name).toBe('James');
    });

    it('should wait to resolve $loaded until $$added promise is resolved', function () {
      var queue = [];
      function addPromise(snap, prevChild){
        return $q(
          function(resolve) {
            queue.push(resolve);
          }).then(function(name) {
            var data = $firebaseArray.prototype.$$added.call(arr, snap, prevChild);
            data.name = name;
            return data;
          });
      }
      var called = false;
      var ref = stubRef();
      arr = stubArray(null, $firebaseArray.$extend({$$added:addPromise}), ref);
      arr.$loaded().then(function(){
        expect(arr.length).toBe(1);
        called = true;
      });
      ref.set({'-Jwgx':{username:'James', email:'james@internet.com'}});

      $timeout.flush();
      queue[0]('James');
      $timeout.flush();
      expect(called, 'called').toBe(true);
    });

    it('should reject promise on fail', function(done) {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');

      arr.$add({"bad/key": "will fail!"})
        .then(whiteSpy, blackSpy)
        .finally(function () {
          expect(whiteSpy).not.toHaveBeenCalled();
          expect(blackSpy).toHaveBeenCalled();
          done();
        });
    });

    it('should work with a primitive value', function(done) {
      arr.$add('hello').then(function (ref) {
        ref.once("value", function (ss) {
          expect(ss.val()).toEqual('hello');
          done();
        });
      });
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

      $rootScope.$digest()

      for(var i=1; i <= 5; i++) {
        expect(arr[i-1].$priority).toBe(i);
      }
    });

    it('should observe $priority and $value meta keys if present', function(done) {
      var spy = jasmine.createSpy('$add').and.callFake(function (r) {return r;});
      var arr = stubArray();
      arr.$add({$value: 'foo', $priority: 99})
        .then(spy)
        .then(function (ref) {
          expect(spy).toHaveBeenCalled();
          ref.on("value", function (ss) {
            expect(ss.getPriority()).toBe(99);
            expect(ss.val()).toBe('foo');
            done();
          });
        });
    });

    it('should work on a query', function() {
      var ref = stubRef();
      var query = ref.limitToLast(2);
      var arr = $firebaseArray(query);
      addAndProcess(arr, testutils.snap('one', 'b', 1), null);
      expect(arr.length).toBe(1);
    });
  });

  describe('$save', function() {
    beforeEach(function () {
      arr.$ref().set(STUB_DATA);
      $rootScope.$digest();
    });

    it('should accept an array index', function(done) {
      arr[2].number = 99;

      arr.$save(2).then(function (ref) {
        ref.once("value", function (ss) {
          expect(ss.val().number).toEqual(99);
          done();
        });
      });
    });

    it('should accept an item from the array', function(done) {
      arr[2].number = 99;

      arr.$save(arr[2]).then(function (ref) {
        ref.once("value", function (ss) {
          expect(ss.val().number).toEqual(99);
          done();
        });
      });
    });

    it('should return a promise', function() {
      expect(arr.$save(1)).toBeAPromise();
    });

    it('should resolve promise on sync', function(done) {
      var spy = jasmine.createSpy();
      arr.$save(1).then(spy).then(function () {
        expect(spy).toHaveBeenCalled();
        done();
      });
      expect(spy).not.toHaveBeenCalled();
    });

    it('should reject promise on failure', function(done) {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      arr[2]["invalid/key"] = "Oh noes!";
      arr.$save(2)
        .then(whiteSpy, blackSpy)
        .finally(function () {
          expect(whiteSpy).not.toHaveBeenCalled();
          expect(blackSpy).toHaveBeenCalled();
          done();
        });
    });

    it('should reject promise on bad index', function(done) {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      arr.$save(99)
        .then(whiteSpy, blackSpy)
        .finally(function () {
          expect(whiteSpy).not.toHaveBeenCalled();

          expect(blackSpy.calls.argsFor(0)[0]).toMatch(/invalid/i);
          done();
        });
    });

    it('should reject promise on bad object', function(done) {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      arr.$save({foo: 'baz'}).then(whiteSpy, blackSpy).then(function () {
        expect(whiteSpy).not.toHaveBeenCalled();
        expect(blackSpy.calls.argsFor(0)[0]).toMatch(/invalid/i);
        done();
      });
    });

    it('should accept a primitive', function() {
      var key = arr.$keyAt(1);
      var ref = arr.$ref().child(key);
      arr[1] = {$value: 'happy', $id: key};
      arr.$save(1).then(function (ref) {
        ref.once("value", function (ss) {
          expect(ss.val()).toBe('happy');
        })
      });
    });

    it('should throw error if object is destroyed', function() {
      arr.$destroy();
      expect(function() {
        arr.$save(0);
      }).toThrowError(Error);
    });

    it('should trigger watch event', function(done) {
      var spy = jasmine.createSpy('$watch');
      arr.$watch(spy);
      var key = arr.$keyAt(1);
      arr[1].foo = 'watchtest';
      arr.$save(1).then(function () {
        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({event: 'child_changed', key: key}));
        done()
      });
    });

    it('should work on a query', function(done) {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject').and.callFake(function(e) {
        console.error(e);
      });
      var ref = stubRef();
      ref.set(STUB_DATA);

      var query = ref.limitToLast(5);
      var arr = $firebaseArray(query);

      arr.$loaded().then(function () {
        var key = arr.$keyAt(1);
        arr[1].foo = 'watchtest';

        arr.$save(1).then(whiteSpy, blackSpy).then(function () {
          expect(whiteSpy).toHaveBeenCalled();
          expect(blackSpy).not.toHaveBeenCalled();
          done();
        });
      })
    });
  });

  describe('$remove', function() {
    beforeEach(function () {
      arr.$ref().set(STUB_DATA);
      $rootScope.$digest();
    });

    it('should call remove on Firebase ref', function(done) {
      arr.$remove(1).then(function (ref) {
        ref.once("value", function (ss) {
          expect(ss.val()).toBe(null);
          done();
        });
      });
    });

    it('should return a promise', function() {
      expect(arr.$remove(1)).toBeAPromise();
    });

    it('should resolve promise to ref on success', function(done) {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var expName = arr.$keyAt(1);
      arr.$remove(1).then(whiteSpy, blackSpy).then(function () {
        var resRef = whiteSpy.calls.argsFor(0)[0];
        expect(whiteSpy).toHaveBeenCalled();
        expect(resRef).toBeAFirebaseRef();
        expect(resRef.key).toBe(expName);
        expect(blackSpy).not.toHaveBeenCalled();
        done();
      });
    });

    it('should reject promise on failure', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var err = new Error('test_fail_remove');

      spyOn(firebase.database.Reference.prototype, "remove").and.callFake(function (cb) {
        cb(err);
      });

      arr.$remove(1)
        .then(whiteSpy, blackSpy)
        .then(function () {
          expect(whiteSpy).not.toHaveBeenCalled();
          expect(blackSpy).toHaveBeenCalledWith(err);
          done();
        });
    });

    it('should reject promise if bad int', function(done) {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      arr.$remove(-99)
        .then(whiteSpy, blackSpy)
        .finally(function () {
          expect(whiteSpy).not.toHaveBeenCalled();
          expect(blackSpy.calls.argsFor(0)[0]).toMatch(/invalid/i);
          done();
        });
    });

    it('should reject promise if bad object', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      arr.$remove({foo: false})
        .then(whiteSpy, blackSpy)
        .then(function () {
          expect(whiteSpy).not.toHaveBeenCalled();
          expect(blackSpy).toHaveBeenCalled();
          expect(blackSpy.calls.argsFor(0)[0]).toMatch(/invalid/i);
        });
    });

    it('should work on a query', function(done) {
      var ref = stubRef();
      ref.set(STUB_DATA);

      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject').and.callFake(function(e) {
        console.error(e);
      });
      var query = ref.limitToLast(5);
      var arr = $firebaseArray(query);

      arr.$loaded()
        .then(function () {
          return arr.$remove(1);
        })
        .then(whiteSpy, blackSpy)
        .then(function () {
          expect(whiteSpy).toHaveBeenCalled();
          expect(blackSpy).not.toHaveBeenCalled();
          done();
        });
    });

    it('should throw Error if array destroyed', function() {
      arr.$destroy();
      expect(function () {
        arr.$remove(0);
      }).toThrowError(Error);
    });
  });

  describe('$keyAt', function() {
    beforeEach(function () {
      arr.$ref().set(STUB_DATA);
      $rootScope.$digest();
    });

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
    beforeEach(function () {
      arr.$ref().set(STUB_DATA);
      $rootScope.$digest();
    });

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
    beforeEach(function () {
      arr.$ref().set(STUB_DATA);
      $rootScope.$digest();
    });

    it('should return a promise', function() {
      expect(arr.$loaded()).toBeAPromise();
    });

    it('should resolve when values are received', function(done) {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');

      arr.$loaded().then(whiteSpy, blackSpy).then(function () {
        expect(whiteSpy).toHaveBeenCalled();
        expect(blackSpy).not.toHaveBeenCalled();
        done();
      });

      $rootScope.$digest();
    });

    it('should resolve to the array', function(done) {
      var spy = jasmine.createSpy('resolve');
      arr.$loaded().then(spy).then(function () {
        expect(spy).toHaveBeenCalledWith(arr);
        done();
      })

      $rootScope.$digest();
    });

    it('should have all data loaded when it resolves', function(done) {
      var spy = jasmine.createSpy('resolve');
      arr.$loaded().then(spy).then(function () {
        var list = spy.calls.argsFor(0)[0];
        expect(list.length).toBe(5);
        done();
      });

      $rootScope.$digest();
    });

    it('should reject when error fetching records', function(done) {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var err = new Error('test_fail');

      spyOn(firebase.database.Reference.prototype, "on").and.callFake(function (event, cb, cancel_cb) {
        cancel_cb(err);
      });

      arr = $firebaseArray(stubRef());

      arr.$loaded()
        .then(whiteSpy, blackSpy)
        .finally(function () {
          expect(whiteSpy).not.toHaveBeenCalled();
          expect(blackSpy).toHaveBeenCalledWith(err);
          done();
        });
    });

    it('should resolve if function passed directly into $loaded', function(done) {
      arr.$loaded(function (a) {
        expect(a).toBe(arr);
        done();
      });

      $rootScope.$digest();
    });

    it('should reject properly when function passed directly into $loaded', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var err = new Error('test_fail');

      spyOn(firebase.database.Reference.prototype, "on").and.callFake(function (event, cb, cancel_cb) {
        cancel_cb(err);
      });

      arr = $firebaseArray(stubRef());

      arr.$loaded(whiteSpy, function () {
        expect(whiteSpy).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('$resolved', function () {
    it('should return false on init', function () {
      arr = $firebaseArray(stubRef());
      expect(arr.$resolved).toBe(false);
    });

    it('should return true once $loaded() promise is resolved', function () {
      arr = $firebaseArray(stubRef());

      arr.$loaded()
        .finally(function () {
          expect(arr.$resolved).toBe(true);
          done();
        });
    });

    it('should return true once $loaded() promise is rejected', function () {
      var err = new Error('test_fail');

      spyOn(firebase.database.Reference.prototype, "once").and.callFake(function (event, cb, cancel_cb) {
        cancel_cb(err);
      });

      arr = $firebaseArray(stubRef());

      arr.$loaded()
        .finally(function () {
          expect(arr.$resolved).toBe(true);
          done();
        });
    });
  });

  describe('$ref', function() {
    it('should return Firebase instance it was created with', function() {
      var ref = stubRef();
      var arr = $firebaseArray(ref);
      expect(arr.$ref()).toBe(ref);
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

    it('calling the deregistration function twice should be silently ignored', function(){
      var spy = jasmine.createSpy('$watch');
      var off = arr.$watch(spy);
      off();
      off();
      arr.$$notify('child_removed', 'removedkey123', 'prevkey456');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('$destroy', function() {
    beforeEach(function () {
      arr.$ref().set(STUB_DATA);
      $rootScope.$digest();
    });

    it('should call off on ref', function() {
      var spy = spyOn(arr.$ref(), 'off');
      arr.$destroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should empty the array', function() {
      expect(arr.length).toBeGreaterThan(0);
      arr.$destroy()
      expect(arr.length).toBe(0);
    });

    it('should reject $loaded() if not completed yet', function(done) {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var arr = stubArray();
      arr.$loaded().then(whiteSpy, blackSpy).then(function () {
        expect(whiteSpy).not.toHaveBeenCalled();
        expect(blackSpy.calls.argsFor(0)[0]).toMatch(/destroyed/i);
        done();
      });
      arr.$destroy();

      $rootScope.$digest();
    });
  });

  describe('$$added', function() {
    beforeEach(function () {
      arr.$ref().set(STUB_DATA);
      $rootScope.$digest();
    });

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
      var arr = stubArray(null, $firebaseArray.$extend({
        $$defaults: {aString: 'not_applied', foo: 'foo'}
      }));
      var res = arr.$$added(testutils.snap(STUB_DATA.a));
      expect(res.aString).toBe(STUB_DATA.a.aString);
      expect(res.foo).toBe('foo');
    });
  });

  describe('$$updated', function() {
    beforeEach(function () {
      arr.$ref().set(STUB_DATA);
      $rootScope.$digest();
    });

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
      expect(len).toEqual(copy.length);
      for (var i = 0; i < len; i++) {
        expect(arr[i]).toEqual(copy[i]);
      }
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
      var arr = stubArray(STUB_DATA, $firebaseArray.$extend({
        $$defaults: {aString: 'not_applied', foo: 'foo'}
      }));
      $rootScope.$digest();

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
    beforeEach(function () {
      arr.$ref().set(STUB_DATA);
      $rootScope.$digest();
    });

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
    beforeEach(function () {
      arr.$ref().set(STUB_DATA);
      $rootScope.$digest();
    });

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
      var arr = stubArray(STUB_DATA, $firebaseArray.$extend({ $destroy: spy }));
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
    beforeEach(function () {
      arr.$ref().set(STUB_DATA);
      $rootScope.$digest();
    });

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
      var arr = stubArray(STUB_DATA, $firebaseArray.$extend({ $$notify: spy }));
      spy.calls.reset();
      var rec = arr.$$added(testutils.snap({hello: 'world'}, 'addFirst'), null);
      arr.$$process('child_added', rec, null);
      expect(spy).toHaveBeenCalled();
    });

    it('"child_added" should not invoke $$notify if it already exists after prevChild', function() {
      var spy = jasmine.createSpy('$$notify');
      var arr = stubArray(STUB_DATA, $firebaseArray.$extend({ $$notify: spy }));
      $rootScope.$digest();
      var index = arr.$indexFor('e');
      var prevChild = arr.$$getKey(arr[index -1]);
      spy.calls.reset();
      arr.$$process('child_added', arr.$getRecord('e'), prevChild);
      expect(spy).not.toHaveBeenCalled();
    });

    ///////////////// UPDATE

    it('should invoke $$notify with "child_changed" event', function() {
      var spy = jasmine.createSpy('$$notify');
      var arr = stubArray(STUB_DATA, $firebaseArray.$extend({ $$notify: spy }));
      $rootScope.$digest();
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
      var arr = stubArray(STUB_DATA, $firebaseArray.$extend({ $$notify: spy }));
      spy.calls.reset();
      arr.$$moved(testutils.refSnap(testutils.ref('b')), 'notarealkey');
      arr.$$process('child_moved', arr.$getRecord('b'), 'notarealkey');
      expect(spy).toHaveBeenCalled();
    });

    it('"child_moved" should not trigger $$notify if prevChild is already the previous element' , function() {
      var spy = jasmine.createSpy('$$notify');
      var arr = stubArray(STUB_DATA, $firebaseArray.$extend({ $$notify: spy }));
      $rootScope.$digest();
      var index = arr.$indexFor('e');
      var prevChild = arr.$$getKey(arr[index - 1]);
      spy.calls.reset();
      arr.$$process('child_moved', arr.$getRecord('e'), prevChild);
      expect(spy).not.toHaveBeenCalled();
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
      var arr = stubArray(STUB_DATA, $firebaseArray.$extend({ $$notify: spy }));
      $rootScope.$digest();
      spy.calls.reset();
      arr.$$removed(testutils.refSnap(testutils.ref('e')));
      arr.$$process('child_removed', arr.$getRecord('e'));
      expect(spy).toHaveBeenCalled();
    });

    it('"child_removed" should not trigger $$notify if the record is not in the array' , function() {
      var spy = jasmine.createSpy('$$notify');
      var arr = stubArray(STUB_DATA, $firebaseArray.$extend({ $$notify: spy }));
      $rootScope.$digest();
      spy.calls.reset();
      arr.$$process('child_removed', {$id:'f'});
      expect(spy).not.toHaveBeenCalled();
    });

    //////////////// OTHER
    it('should throw an error for an unknown event type',function(){
      var arr = stubArray(STUB_DATA);
      expect(function(){
        arr.$$process('unknown_event', arr.$getRecord('e'));
      }).toThrow();
    });

  });

  describe('$extend', function() {
    beforeEach(function () {
      arr.$ref().set(STUB_DATA);
      $rootScope.$digest();
    });

    it('should return a valid array', function() {
      var F = $firebaseArray.$extend({});
      expect(Array.isArray(F(stubRef()))).toBe(true);
    });

    it('should preserve child prototype', function() {
      function Extend() { $firebaseArray.apply(this, arguments); }
      Extend.prototype.foo = function() {};
      $firebaseArray.$extend(Extend);
      var arr = new Extend(stubRef());
      expect(typeof(arr.foo)).toBe('function');
    });

    it('should return child class', function() {
      function A() {}
      var res = $firebaseArray.$extend(A);
      expect(res).toBe(A);
    });

    it('should be instanceof $firebaseArray', function() {
      function A() {}
      $firebaseArray.$extend(A);
      expect(new A(stubRef()) instanceof $firebaseArray).toBe(true);
    });

    it('should add on methods passed into function', function() {
      function foo() { return 'foo'; }
      var F = $firebaseArray.$extend({foo: foo});
      var res = F(stubRef());
      expect(typeof res.$$updated).toBe('function');
      expect(typeof res.foo).toBe('function');
      expect(res.foo()).toBe('foo');
    });

    it('should work with the new keyword', function() {
      var fn = function() {};
      var Res = $firebaseArray.$extend({foo: fn});
      expect(new Res(stubRef()).foo).toBeA('function');
    });

    it('should work without the new keyword', function() {
      var fn = function() {};
      var Res = $firebaseArray.$extend({foo: fn});
      expect(Res(stubRef()).foo).toBeA('function');
    });
  });

  function stubRef() {
    return firebase.database().ref().push();
  }

  function stubArray(initialData, Factory, ref) {
    if( !Factory ) { Factory = $firebaseArray; }
    if( !ref ) {
      ref = stubRef();
    }
    var arr = new Factory(ref);
    if( initialData ) {
      ref.set(initialData);
    }
    return arr;
  }

  function addAndProcess(arr, snap, prevChild) {
    arr.$$process('child_added', arr.$$added(snap, prevChild), prevChild);
  }

});
