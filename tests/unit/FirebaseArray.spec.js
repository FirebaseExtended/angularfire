'use strict';
describe('$FirebaseArray', function () {

  var $firebase, $FirebaseArray, $timeout, $fb, $factory, $fbUtil, $rootScope;
  beforeEach(function() {
    module('mock.firebase');
    module('firebase');
    inject(function (_$firebase_, _$FirebaseArray_, _$timeout_, $firebaseRecordFactory, $firebaseUtils, _$rootScope_) {
      $firebase = _$firebase_;
      $FirebaseArray = _$FirebaseArray_;
      $timeout = _$timeout_;
      $factory = $firebaseRecordFactory;
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
      var arr = new $FirebaseArray($fb, $factory);
      var res = arr.add({foo: 'bar'});
      flushAll();
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
    xit('should have tests'); //todo-test
  });

  describe('#remove', function() {
    xit('should have tests'); //todo-test
  });

  describe('#keyAt', function() {
    xit('should have tests'); //todo-test
  });

  describe('#indexFor', function() {
    xit('should have tests'); //todo-test
  });

  describe('#loaded', function() {
    xit('should have tests'); //todo-test
  });

  describe('#inst', function() {
    xit('should return $firebase instance it was created with'); //todo-test
  });

  describe('#destroy', function() {
    xit('should have tests'); //todo-test
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