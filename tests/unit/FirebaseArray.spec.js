'use strict';
describe('$FirebaseArray', function () {

  var $firebase, $FirebaseArray, $timeout, $fb, $factory, $fbUtil, $rootScope;
  beforeEach(function() {
    module('mock.firebase');
    module('firebase');
    inject(function (_$firebase_, _$FirebaseArray_, _$timeout_, $FirebaseRecordFactory, $firebaseUtils, _$rootScope_) {
      $firebase = _$firebase_;
      $FirebaseArray = _$FirebaseArray_;
      $timeout = _$timeout_;
      $factory = $FirebaseRecordFactory;
      $fbUtil = $firebaseUtils;
      $fb = $firebase(new Firebase('Mock://').child('data'));
      $rootScope = _$rootScope_;
    })
  });

  describe('<constructor>', function() {
    it('should return a valid array', function() {
      var arr = new $FirebaseArray($fb, $factory);
      expect(Array.isArray(arr)).toBe(true);
    });

    it('should throw error if invalid record factory', function() {
      expect(function() {
        new $FirebaseArray($fb, 'foo');
      }).toThrowError(/invalid/i);
    });

    it('should have API methods', function() {
      var arr = new $FirebaseArray($fb, $factory);
      var keys = Object.keys($fbUtil.getPublicMethods(arr));
      expect(keys.length).toBeGreaterThan(0);
      keys.forEach(function(key) {
        expect(typeof(arr[key])).toBe('function');
      });
    });

    it('should work with inheriting child classes', function() {
      function Extend() { $FirebaseArray.apply(this, arguments); }
      $fbUtil.inherit(Extend, $FirebaseArray);
      Extend.prototype.foo = function() {};
      var arr = new Extend($fb, $factory);
      expect(typeof(arr.foo)).toBe('function');
    });

    it('should load primitives'); //todo-test
  });

  describe('#add', function() {
    it('should create data in Firebase', function() {
      var arr = new $FirebaseArray($fb, $factory);
      var data = {foo: 'bar'};
      arr.add(data);
      flushAll();
      var lastId = $fb.ref().getLastAutoId();
      expect($fb.ref().getData()[lastId]).toEqual(data);
    });

    it('should return a promise', function() {
      var res = new $FirebaseArray($fb, $factory).add({foo: 'bar'});
      expect(typeof(res)).toBe('object');
      expect(typeof(res.then)).toBe('function');
    });

    it('should resolve to ref for new record', function() {
      var arr = new $FirebaseArray($fb, $factory);
      var spy = jasmine.createSpy();
      arr.add({foo: 'bar'}).then(spy);
      flushAll();
      var id = $fb.ref().getLastAutoId();
      expect(id).toBeTruthy();
      expect(spy).toHaveBeenCalled();
      var args = spy.calls.argsFor(0);
      expect(args.length).toBeGreaterThan(0);
      var ref = args[0];
      expect(ref && ref.name()).toBe(id);
    });

    it('should reject promise on fail', function() {
      var arr = new $FirebaseArray($fb, $factory);
      var successSpy = jasmine.createSpy('resolve spy');
      var errSpy = jasmine.createSpy('reject spy');
      $fb.ref().failNext('set', 'rejecto');
      $fb.ref().failNext('push', 'rejecto');
      arr.add('its deed').then(successSpy, errSpy);
      flushAll();
      expect(successSpy).not.toHaveBeenCalled();
      expect(errSpy).toHaveBeenCalledWith('rejecto');
    });

    it('should work with a primitive value', function() {
      var arr = new $FirebaseArray($fb, $factory);
      var successSpy = jasmine.createSpy('resolve spy');
      arr.add('hello').then(successSpy);
      flushAll();
      expect(successSpy).toHaveBeenCalled();
      var lastId = successSpy.calls.argsFor(0)[0].name();
      expect($fb.ref().getData()[lastId]).toEqual('hello');
    });
  });

  describe('#save', function() {
    it('should accept an array index', function() {
      var spy = spyOn($fb, 'set').and.callThrough();
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      var key = arr.keyAt(2);
      arr[2].number = 99;
      arr.save(2);
      flushAll();
      expect(spy).toHaveBeenCalledWith(key, jasmine.any(Object), jasmine.any(Function));
    });

    it('should accept an item from the array', function() {
      var spy = spyOn($fb, 'set').and.callThrough();
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      var key = arr.keyAt(2);
      arr[2].number = 99;
      arr.save(arr[2]);
      flushAll();
      expect(spy).toHaveBeenCalledWith(key, jasmine.any(Object), jasmine.any(Function));
    });

    it('should save correct data into Firebase', function() {
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      arr[1].number = 99;
      var key = arr.keyAt(1);
      var expData = new $factory().toJSON(arr[1]);
      arr.save(1);
      flushAll();
      expect($fb.ref().child(key).set).toHaveBeenCalledWith(expData, jasmine.any(Function));
    });

    it('should return a promise', function() {
      var res = new $FirebaseArray($fb, $factory).save(1);
      expect(typeof res).toBe('object');
      expect(typeof res.then).toBe('function');
    });

    it('should resolve promise on sync', function() {
      var spy = jasmine.createSpy();
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      arr.save(1).then(spy);
      expect(spy).not.toHaveBeenCalled();
      flushAll();
      expect(spy.calls.count()).toBe(1);
    });

    it('should reject promise on failure', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      var key = arr.keyAt(1);
      $fb.ref().child(key).failNext('set', 'no way jose');
      arr.save(1).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('no way jose');
    });

    it('should reject promise on bad index', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      arr.save(99).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy.calls.argsFor(0)[0]).toMatch(/invalid/i);
    });

    it('should reject promise on bad object', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      arr.save({foo: 'baz'}).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy.calls.argsFor(0)[0]).toMatch(/invalid/i);
    });

    it('should accept a primitive', function() {
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      var key = arr.keyAt(1);
      arr[1] = {'.value': 'happy', $id: key};
      var expData = new $factory().toJSON(arr[1]);
      arr.save(1);
      flushAll();
      expect($fb.ref().child(key).set).toHaveBeenCalledWith(expData, jasmine.any(Function));
    });
  });

  describe('#remove', function() {
    it('should remove data from Firebase', function() {
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      var key = arr.keyAt(1);
      arr.remove(1);
      expect($fb.ref().child(key).remove).toHaveBeenCalled();
    });

    it('should return a promise', function() {
      var res = new $FirebaseArray($fb, $factory).remove(1);
      expect(typeof res).toBe('object');
      expect(typeof res.then).toBe('function');
    });

    it('should resolve promise on success', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      arr.remove(1).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).toHaveBeenCalled();
      expect(blackSpy).not.toHaveBeenCalled();
    });

    it('should reject promise on failure', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      $fb.ref().child(arr.keyAt(1)).failNext('set', 'oops');
      arr[1].number = 99;
      arr.remove(1).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('oops');
    });

    it('should reject promise if bad int', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var arr = new $FirebaseArray($fb, $factory);
      arr.remove(-99).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy.calls.argsFor(0)[0]).toMatch(/invalid/i);
    });

    it('should reject promise if bad object', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var arr = new $FirebaseArray($fb, $factory);
      arr.remove({foo: false}).then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy.calls.argsFor(0)[0]).toMatch(/invalid/i);
    });
  });

  describe('#keyAt', function() {
    it('should return key for an integer', function() {
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      expect(arr.keyAt(2)).toBe('c');
    });

    it('should return key for an object', function() {
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      expect(arr.keyAt(arr[2])).toBe('c');
    });

    it('should return null if invalid object', function() {
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      expect(arr.keyAt({foo: false})).toBe(null);
    });

    it('should return null if invalid integer', function() {
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      expect(arr.keyAt(-99)).toBe(null);
    });
  });

  describe('#indexFor', function() {
    it('should return integer for valid key', function() {
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      expect(arr.indexFor('c')).toBe(2);
    });

    it('should return -1 for invalid key', function() {
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      expect(arr.indexFor('notarealkey')).toBe(-1);
    });
  });

  describe('#loaded', function() {
    it('should return a promise', function() {
      var res = new $FirebaseArray($fb, $factory).loaded();
      expect(typeof res).toBe('object');
      expect(typeof res.then).toBe('function');
    });

    it('should resolve when values are received', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      new $FirebaseArray($fb, $factory).loaded().then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).toHaveBeenCalled();
      expect(blackSpy).not.toHaveBeenCalled();
    });

    it('should resolve to the array', function() {
      var spy = jasmine.createSpy('resolve');
      var arr = new $FirebaseArray($fb, $factory);
      arr.loaded().then(spy);
      flushAll();
      expect(spy).toHaveBeenCalledWith(arr);
    });

    it('should resolve after array has all current data in Firebase', function() {
      var arr = new $FirebaseArray($fb, $factory);
      var spy = jasmine.createSpy('resolve').and.callFake(function() {
        expect(arr.length).toBeGreaterThan(0);
        expect(arr.length).toBe(Object.keys($fb.ref().getData()).length);
      });
      arr.loaded().then(spy);
      flushAll();
      expect(spy).toHaveBeenCalled();
    });

    it('should reject when error fetching records', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      $fb.ref().failNext('once', 'oops');
      new $FirebaseArray($fb, $factory).loaded().then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('oops');
    });
  });

  describe('#inst', function() {
    it('should return $firebase instance it was created with', function() {
      var res = new $FirebaseArray($fb, $factory).inst();
      expect(res).toBe($fb);
    });
  });

  describe('#destroy', function() {
    it('should cancel listeners', function() {
      new $FirebaseArray($fb, $factory).destroy();
      expect($fb.ref().off.calls.count()).toBe(4);
    });

    it('should empty the array', function() {
      var arr = new $FirebaseArray($fb, $factory);
      flushAll();
      expect(arr.length).toBeGreaterThan(0);
      arr.destroy();
      expect(arr.length).toBe(0);
    });

    it('should reject loaded() if not completed yet', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var arr = new $FirebaseArray($fb, $factory);
      arr.loaded().then(whiteSpy, blackSpy);
      arr.destroy();
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy.calls.argsFor(0)[0]).toMatch(/destroyed/i);
    });
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