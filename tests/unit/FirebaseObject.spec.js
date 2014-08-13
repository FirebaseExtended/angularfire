describe('$FirebaseObject', function() {
  'use strict';
  var $firebase, $FirebaseObject, $utils, $rootScope, $timeout, obj, $fb, testutils;

  var DEFAULT_ID = 'recc';
  var FIXTURE_DATA = {
    aString: 'alpha',
    aNumber: 1,
    aBoolean: false,
    anObject: { bString: 'bravo' }
  };

  beforeEach(function () {
    module('mock.firebase');
    module('firebase');
    module('testutils');
    inject(function (_$firebase_, _$FirebaseObject_, _$timeout_, $firebaseUtils, _$rootScope_, _testutils_) {
      $firebase = _$firebase_;
      $FirebaseObject = _$FirebaseObject_;
      $timeout = _$timeout_;
      $utils = $firebaseUtils;
      $rootScope = _$rootScope_;
      testutils = _testutils_;

      // start using the direct methods here until we can refactor `obj`
      obj = makeObject(FIXTURE_DATA);
      $fb = obj.$$$fb;
    });
  });

  describe('constructor', function() {
    it('should set the record id', function() {
      expect(obj.$id).toEqual($fb.$ref().name());
    });

    it('should accept a query', function() {
      var obj = makeObject(FIXTURE_DATA, $fb.$ref().limit(1).startAt(null));
      obj.$$updated(testutils.snap({foo: 'bar'}));
      flushAll();
      expect(obj).toEqual(jasmine.objectContaining({foo: 'bar'}));
    });
  });

  describe('$save', function () {
    it('should call $firebase.$set', function () {
      obj.foo = 'bar';
      obj.$save();
      expect(obj.$$$fb.$set).toHaveBeenCalled();
    });

    it('should return a promise', function () {
      expect(obj.$save()).toBeAPromise();
    });

    it('should resolve promise to the ref for this object', function () {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      obj.$save().then(whiteSpy, blackSpy);
      expect(whiteSpy).not.toHaveBeenCalled();
      flushAll();
      expect(whiteSpy).toHaveBeenCalled();
      expect(blackSpy).not.toHaveBeenCalled();
    });

    it('should reject promise on failure', function () {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      $fb.$set.and.returnValue($utils.reject('test_fail'));
      obj.$save().then(whiteSpy, blackSpy);
      expect(blackSpy).not.toHaveBeenCalled();
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('test_fail');
    });

    it('should trigger watch event', function() {
      var spy = jasmine.createSpy('$watch');
      obj.$watch(spy);
      obj.foo = 'watchtest';
      obj.$save();
      flushAll();
      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({event: 'value', key: obj.$id}));
    });
  });

  describe('$loaded', function () {
    it('should return a promise', function () {
      expect(obj.$loaded()).toBeAPromise();
    });

    it('should resolve when all server data is downloaded', function () {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var obj = makeObject();
      obj.$loaded().then(whiteSpy, blackSpy);
      obj.$$$ready();
      flushAll();
      expect(whiteSpy).toHaveBeenCalledWith(obj);
      expect(blackSpy).not.toHaveBeenCalled();
    });

    it('should reject if the ready promise is rejected', function () {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var obj = makeObject();
      obj.$loaded().then(whiteSpy, blackSpy);
      obj.$$$reject('test_fail');
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('test_fail');
    });

    it('should resolve to the FirebaseObject instance', function () {
      var spy = jasmine.createSpy('loaded');
      obj.$loaded().then(spy);
      flushAll();
      expect(spy).toHaveBeenCalledWith(obj);
    });

    it('should contain all data at the time $loaded is called', function () {
      var obj = makeObject();
      var spy = jasmine.createSpy('loaded').and.callFake(function (data) {
        expect(data).toEqual(jasmine.objectContaining(FIXTURE_DATA));
      });
      obj.$loaded(spy);
      flushAll();
      expect(spy).not.toHaveBeenCalled();
      obj.$$$ready(FIXTURE_DATA);
      expect(spy).toHaveBeenCalled();
    });

    it('should trigger if attached before load completes', function() {
      var obj = makeObject();
      var spy = jasmine.createSpy('$loaded');
      obj.$loaded(spy);
      expect(spy).not.toHaveBeenCalled();
      obj.$$$ready();
      expect(spy).toHaveBeenCalled();
    });

    it('should trigger if attached after load completes', function() {
      var obj = makeObject();
      var spy = jasmine.createSpy('$loaded');
      obj.$$$ready();
      obj.$loaded(spy);
      flushAll();
      expect(spy).toHaveBeenCalled();
    });

    it('should resolve properly if function passed directly into $loaded', function() {
      var spy = jasmine.createSpy('loaded');
      obj.$loaded(spy);
      flushAll();
      expect(spy).toHaveBeenCalledWith(obj);
    });

    it('should reject properly if function passed directly into $loaded', function() {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var obj = makeObject();
      obj.$loaded(whiteSpy, blackSpy);
      obj.$$$reject('test_fail');
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith('test_fail');
    });
  });

  describe('$inst', function () {
    it('should return the $firebase instance that created it', function () {
      expect(obj.$inst()).toBe($fb);
    });
  });

  describe('$bindTo', function () {
    it('should return a promise', function () {
      var res = obj.$bindTo($rootScope.$new(), 'test');
      expect(res).toBeAPromise();
    });

    it('should resolve to an off function', function () {
      var spy = jasmine.createSpy('resolve').and.callFake(function (off) {
        expect(off).toBeA('function');
      });
      obj.$bindTo($rootScope.$new(), 'test').then(spy);
      flushAll();
      expect(spy).toHaveBeenCalled();
    });

    it('should have data when it resolves', function () {
      var spy = jasmine.createSpy('resolve').and.callFake(function () {
        expect(obj).toEqual(jasmine.objectContaining(FIXTURE_DATA));
      });
      obj.$bindTo($rootScope.$new(), 'test').then(spy);
      flushAll();
      expect(spy).toHaveBeenCalled();
    });

    it('should have data in $scope when resolved', function() {
      var spy = jasmine.createSpy('resolve').and.callFake(function () {
        expect($scope.test).toEqual($utils.parseScopeData(obj));
        expect($scope.test.$id).toBe(obj.$id);
      });
      var $scope = $rootScope.$new();
      obj.$bindTo($scope, 'test').then(spy);
      flushAll();
      expect(spy).toHaveBeenCalled();
    });

    it('should send local changes to $firebase.$set', function () {
      var $scope = $rootScope.$new();
      obj.$bindTo($scope, 'test');
      flushAll();
      $fb.$set.calls.reset();
      $scope.$apply(function () {
        $scope.test.bar = 'baz';
      });
      expect($fb.$set).toHaveBeenCalledWith(jasmine.objectContaining({bar: 'baz'}));
    });

    it('should allow data to be set inside promise callback', function () {
      var $scope = $rootScope.$new();
      var newData = { 'bar': 'foo' };
      var spy = jasmine.createSpy('resolve').and.callFake(function () {
        $scope.test = newData;
      });
      obj.$bindTo($scope, 'test').then(spy);
      flushAll();
      expect(spy).toHaveBeenCalled();
      expect($scope.test).toEqual(jasmine.objectContaining(newData));
      expect($fb.$set).toHaveBeenCalledWith(newData);
    });

    it('should apply server changes to scope variable', function () {
      var $scope = $rootScope.$new();
      obj.$bindTo($scope, 'test');
      $timeout.flush();
      $fb.$set.calls.reset();
      obj.$$updated(fakeSnap({foo: 'bar'}));
      flushAll();
      expect($scope.test).toEqual({foo: 'bar', $id: obj.$id, $priority: obj.$priority});
    });

    it('should stop binding when off function is called', function () {
      var origData = $utils.parseScopeData(obj);
      var $scope = $rootScope.$new();
      var spy = jasmine.createSpy('$bindTo').and.callFake(function (off) {
        expect($scope.obj).toEqual(origData);
        off();
      });
      obj.$bindTo($scope, 'obj').then(spy);
      flushAll();
      obj.$$updated(fakeSnap({foo: 'bar'}));
      flushAll();
      expect(spy).toHaveBeenCalled();
      expect($scope.obj).toEqual(origData);
    });

    it('should not destroy remote data if local is pre-set', function () {
      var origValue = $utils.parseScopeData(obj);
      var $scope = $rootScope.$new();
      $scope.test = {foo: true};
      obj.$bindTo($scope, 'test');
      flushAll();
      expect($utils.parseScopeData(obj)).toEqual(origValue);
    });

    it('should not fail if remote data is null', function () {
      var $scope = $rootScope.$new();
      var obj = makeObject();
      obj.$bindTo($scope, 'test');
      obj.$$$ready(null);
      expect($scope.test).toEqual({$value: null, $id: obj.$id, $priority: obj.$priority});
    });

    //todo-test https://github.com/firebase/angularFire/issues/333
    xit('should update priority if $priority changed in $scope', function () {
      var $scope = $rootScope.$new();
      var spy = spyOn(obj.$inst(), '$set');
      obj.$bindTo($scope, 'test');
      $timeout.flush();
      $scope.test.$priority = 999;
      $scope.$digest();
      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({'.priority': 999}));
    });

    //todo-test https://github.com/firebase/angularFire/issues/333
    xit('should update value if $value changed in $scope', function () {
      var $scope = $rootScope.$new();
      var obj = new $FirebaseObject($fb, noop, $utils.resolve());
      obj.$$updated(testutils.refSnap($fb.$ref(), 'foo', null));
      expect(obj.$value).toBe('foo');
      var spy = spyOn(obj.$inst(), '$set');
      obj.$bindTo($scope, 'test');
      $timeout.flush();
      $scope.test.$value = 'bar';
      $scope.$digest();
      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({'.value': 'bar'}));
    });

    it('should throw error if double bound', function() {
      var $scope = $rootScope.$new();
      var aSpy = jasmine.createSpy('firstBind');
      var bResolve = jasmine.createSpy('secondBindResolve');
      var bReject = jasmine.createSpy('secondBindReject');
      obj.$bindTo($scope, 'a').then(aSpy);
      flushAll();
      expect(aSpy).toHaveBeenCalled();
      obj.$bindTo($scope, 'b').then(bResolve, bReject);
      flushAll();
      expect(bResolve).not.toHaveBeenCalled();
      expect(bReject).toHaveBeenCalled();
    });

    it('should accept another binding after off is called', function() {
      var $scope = $rootScope.$new();
      var aSpy = jasmine.createSpy('firstResolve').and.callFake(function(unbind) {
        unbind();
        var bSpy = jasmine.createSpy('secondResolve');
        var bFail = jasmine.createSpy('secondReject');
        obj.$bindTo($scope, 'b').then(bSpy, bFail);
        $scope.$digest();
        expect(bSpy).toHaveBeenCalled();
        expect(bFail).not.toHaveBeenCalled();
      });
      obj.$bindTo($scope, 'a').then(aSpy);
      flushAll();
      expect(aSpy).toHaveBeenCalled();
    });
  });

  describe('$destroy', function () {
    it('should invoke destroyFn', function () {
      obj.$destroy();
      expect(obj.$$$destroyFn).toHaveBeenCalled();
    });

    it('should dispose of any bound instance', function () {
      var $scope = $rootScope.$new();
      spyOnWatch($scope);
      // now bind to scope and destroy to see what happens
      obj.$bindTo($scope, 'foo');
      flushAll();
      expect($scope.$watch).toHaveBeenCalled();
      obj.$destroy();
      flushAll();
      expect($scope.$watch.$$$offSpy).toHaveBeenCalled();
    });

    it('should unbind if scope is destroyed', function () {
      var $scope = $rootScope.$new();
      spyOnWatch($scope);
      obj.$bindTo($scope, 'foo');
      flushAll();
      expect($scope.$watch).toHaveBeenCalled();
      $scope.$emit('$destroy');
      flushAll();
      expect($scope.$watch.$$$offSpy).toHaveBeenCalled();
    });
  });

  describe('$extendFactory', function () {
    it('should preserve child prototype', function () {
      function Extend() {
        $FirebaseObject.apply(this, arguments);
      }

      Extend.prototype.foo = function () {
      };
      $FirebaseObject.$extendFactory(Extend);
      var arr = new Extend($fb, noop, $utils.resolve());
      expect(arr.foo).toBeA('function');
    });

    it('should return child class', function () {
      function A() {}
      var res = $FirebaseObject.$extendFactory(A);
      expect(res).toBe(A);
    });

    it('should be instanceof $FirebaseObject', function () {
      function A() {}
      $FirebaseObject.$extendFactory(A);
      expect(new A($fb, noop, $utils.resolve())).toBeInstanceOf($FirebaseObject);
    });

    it('should add on methods passed into function', function () {
      function foo() {
        return 'foo';
      }
      var F = $FirebaseObject.$extendFactory({foo: foo});
      var res = new F($fb, noop, $utils.resolve());
      expect(res.$$updated).toBeA('function');
      expect(res.foo).toBeA('function');
      expect(res.foo()).toBe('foo');
    });
  });

  describe('$$updated', function () {
    it('should add keys to local data', function () {
      obj.$$updated(fakeSnap({'key1': true, 'key2': 5}));
      expect(obj.key1).toBe(true);
      expect(obj.key2).toBe(5);
    });

    it('should remove old keys', function () {
      var keys = ['aString', 'aNumber', 'aBoolean', 'anObject'];
      keys.forEach(function(k) {
        expect(obj).toHaveKey(k);
      });
      obj.$$updated(fakeSnap(null));
      flushAll();
      keys.forEach(function (k) {
        expect(obj).not.toHaveKey(k);
      });
    });

    it('should assign null to $value', function() {
      obj.$$updated(fakeSnap(null));
      expect(obj.$value).toBe(null);
    });

    it('should assign primitive value to $value', function () {
      obj.$$updated(fakeSnap(false));
      expect(obj.$value).toBe(false);
    });

    it('should remove other keys when setting primitive', function() {
      var keys = Object.keys(obj);
    });

    it('should preserve the id', function() {
      obj.$id = 'change_id_for_test';
      obj.$$updated(fakeSnap(true));
      expect(obj.$id).toBe('change_id_for_test');
    });

    it('should set the priority', function() {
      obj.$priority = false;
      obj.$$updated(fakeSnap(null, true));
      expect(obj.$priority).toBe(true);
    });

    it('should apply $$defaults if they exist', function() {
      var F = $FirebaseObject.$extendFactory({
        $$defaults: {baz: 'baz', aString: 'bravo'}
      });
      var obj = new F($fb, noop, $utils.resolve());
      obj.$$updated(fakeSnap(FIXTURE_DATA));
      expect(obj.aString).toBe(FIXTURE_DATA.aString);
      expect(obj.baz).toBe('baz');
    });
  });

  function flushAll() {
    Array.prototype.slice.call(arguments, 0).forEach(function (o) {
      angular.isFunction(o.resolve) ? o.resolve() : o.flush();
    });
    try {
      $timeout.flush();
    }
    catch (e) {}
  }

  var pushCounter = 1;

  function stubRef(key) {
    if( !key ) { key = DEFAULT_ID; }
    var stub = {};
    stub.$lastPushRef = null;
    stub.ref = jasmine.createSpy('ref').and.returnValue(stub);
    stub.child = jasmine.createSpy('child').and.callFake(function (childKey) {
      return stubRef(key + '/' + childKey);
    });
    stub.name = jasmine.createSpy('name').and.returnValue(key);
    stub.on = jasmine.createSpy('on');
    stub.off = jasmine.createSpy('off');
    stub.push = jasmine.createSpy('push').and.callFake(function () {
      stub.$lastPushRef = stubRef('newpushid-' + (pushCounter++));
      return stub.$lastPushRef;
    });
    return stub;
  }

  function fakeSnap(data, pri) {
    return testutils.refSnap(testutils.ref('data/a'), data, pri);
  }

  //todo abstract into testutils
  function stubFb(ref) {
    if( !ref ) { ref = testutils.ref('data/a'); }
    var fb = {};
    [
      '$set', '$update', '$remove', '$transaction', '$asArray', '$asObject', '$ref', '$push'
    ].forEach(function (m) {
        var fn;
        switch (m) {
          case '$ref':
            fn = function () {
              return ref;
            };
            break;
          case '$push':
            fn = function () {
              return $utils.resolve(ref.push());
            };
            break;
          case '$set':
          case '$update':
          case '$remove':
          case '$transaction':
          default:
            fn = function (key) {
              return $utils.resolve(typeof(key) === 'string' ? ref.child(key) : ref);
            };
        }
        fb[m] = jasmine.createSpy(m).and.callFake(fn);
      });
    return fb;
  }

  function noop() {}

  function makeObject(initialData, ref) {
    var readyFuture = $utils.defer();
    var destroyFn = jasmine.createSpy('destroyFn');
    var fb = stubFb(ref);
    var obj = new $FirebaseObject(fb, destroyFn, readyFuture.promise);
    obj.$$$readyFuture = readyFuture;
    obj.$$$destroyFn = destroyFn;
    obj.$$$fb = fb;
    obj.$$$reject = function(err) { readyFuture.reject(err); };
    obj.$$$ready = function(data, pri) {
      if(angular.isDefined(data)) {
        obj.$$updated(testutils.refSnap(fb.$ref(), data, pri));
      }
      readyFuture.resolve(obj);
      flushAll();
    };
    if (angular.isDefined(initialData)) {
      obj.$$$ready(initialData);
    }
    return obj;
  }

  function spyOnWatch($scope) {
    // hack on $scope.$watch to return our spy instead of the usual
    // so that we can determine if it gets called
    var _watch = $scope.$watch;
    spyOn($scope, '$watch').and.callFake(function (varName, callback) {
      // call the real watch method and store the real off method
      var _off = _watch.call($scope, varName, callback);
      // replace it with our 007
      var offSpy = jasmine.createSpy('off method for $watch').and.callFake(function () {
        // call the real off method
        _off();
      });
      $scope.$watch.$$$offSpy = offSpy;
      return offSpy;
    });
  }
});