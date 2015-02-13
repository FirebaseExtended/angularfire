describe('$firebaseObject', function() {
  'use strict';
  var $firebaseObject, $utils, $rootScope, $timeout, obj, testutils, $interval, log;

  var DEFAULT_ID = 'REC1';
  var FIXTURE_DATA = {
    aString: 'alpha',
    aNumber: 1,
    aBoolean: false,
    anObject: { bString: 'bravo' }
  };

  beforeEach(function () {
    log = {
      error:[]
    };

    module('firebase');
    module('testutils',function($provide){
      $provide.value('$log',{
        error:function(){
          log.error.push(Array.prototype.slice.call(arguments));
        }
      })
    });
    inject(function (_$interval_, _$firebaseObject_, _$timeout_, $firebaseUtils, _$rootScope_, _testutils_) {
      $firebaseObject = _$firebaseObject_;
      $timeout = _$timeout_;
      $interval = _$interval_;
      $utils = $firebaseUtils;
      $rootScope = _$rootScope_;
      testutils = _testutils_;

      // start using the direct methods here until we can refactor `obj`
      obj = makeObject(FIXTURE_DATA);
    });
  });

  describe('constructor', function() {
    it('should set the record id', function() {
      expect(obj.$id).toEqual(obj.$ref().key());
    });

    it('should accept a query', function() {
      var obj = makeObject(FIXTURE_DATA, stubRef().limit(1).startAt(null));
      flushAll();
      obj.$$updated(testutils.snap({foo: 'bar'}));
      expect(obj).toEqual(jasmine.objectContaining({foo: 'bar'}));
    });

    it('should apply $$defaults if they exist', function() {
      var F = $firebaseObject.$extend({
        $$defaults: {aNum: 0, aStr: 'foo', aBool: false}
      });
      var ref = stubRef();
      var obj = new F(ref);
      ref.flush();
      expect(obj).toEqual(jasmine.objectContaining({aNum: 0, aStr: 'foo', aBool: false}));
    })
  });

  describe('$save', function () {
    it('should call $firebase.$set', function () {
      spyOn(obj.$ref(), 'set');
      obj.foo = 'bar';
      obj.$save();
      expect(obj.$ref().set).toHaveBeenCalled();
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
      var err = new Error('test_fail');
      obj.$ref().failNext('set', err);
      obj.$save().then(whiteSpy, blackSpy);
      expect(blackSpy).not.toHaveBeenCalled();
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith(err);
    });

    it('should trigger watch event', function() {
      var spy = jasmine.createSpy('$watch');
      obj.$watch(spy);
      obj.foo = 'watchtest';
      obj.$save();
      flushAll();
      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({event: 'value', key: obj.$id}));
    });

    it('should work on a query', function() {
      var ref = stubRef();
      ref.set({foo: 'baz'});
      ref.flush();
      var spy = spyOn(ref, 'update');
      var query = ref.limit(3);
      var obj = $firebaseObject(query);
      flushAll(query);
      obj.foo = 'bar';
      obj.$save();
      flushAll(query);
      expect(spy).toHaveBeenCalledWith({foo: 'bar'}, jasmine.any(Function));
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
      obj.$ref().flush();
      flushAll();
      expect(whiteSpy).toHaveBeenCalledWith(obj);
      expect(blackSpy).not.toHaveBeenCalled();
    });

    it('should reject if the ready promise is rejected', function () {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var ref = stubRef();
      var err = new Error('test_fail');
      ref.failNext('once', err);
      var obj = makeObject(null, ref);
      obj.$loaded().then(whiteSpy, blackSpy);
      flushAll();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith(err);
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
      obj.$ref().set(FIXTURE_DATA);
      flushAll(obj.$ref());
      expect(spy).toHaveBeenCalled();
    });

    it('should trigger if attached before load completes', function() {
      var obj = makeObject();
      var spy = jasmine.createSpy('$loaded');
      obj.$loaded(spy);
      expect(spy).not.toHaveBeenCalled();
      flushAll(obj.$ref());
      expect(spy).toHaveBeenCalled();
    });

    it('should trigger if attached after load completes', function() {
      var obj = makeObject();
      var spy = jasmine.createSpy('$loaded');
      obj.$ref().flush();
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
      var err = new Error('test_fail');
      var ref = stubRef();
      ref.failNext('once', err);
      var obj = makeObject(undefined, ref);
      obj.$loaded(whiteSpy, blackSpy);
      ref.flush();
      $timeout.flush();
      expect(whiteSpy).not.toHaveBeenCalled();
      expect(blackSpy).toHaveBeenCalledWith(err);
    });
  });

  describe('$ref', function () {
    it('should return the Firebase instance that created it', function () {
      var ref = stubRef();
      var obj = $firebaseObject(ref);
      expect(obj.$ref()).toBe(ref);
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
      obj.$bindTo($rootScope.$new(), 'test').then(spy, function() { console.error(arguments); });
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
      spyOn(obj.$ref(), 'set');
      var $scope = $rootScope.$new();
      obj.$bindTo($scope, 'test');
      flushAll();
      obj.$ref().set.calls.reset();
      $scope.$apply(function () {
        $scope.test.bar = 'baz';
      });
      $timeout.flush();
      expect(obj.$ref().set).toHaveBeenCalledWith(jasmine.objectContaining({bar: 'baz'}), jasmine.any(Function));
    });

    it('should allow data to be set inside promise callback', function () {
      var ref = obj.$ref();
      spyOn(ref, 'set');
      var $scope = $rootScope.$new();
      var newData = { 'bar': 'foo' };
      var spy = jasmine.createSpy('resolve').and.callFake(function () {
        $scope.test = newData;
      });
      obj.$bindTo($scope, 'test').then(spy);
      flushAll(); // for $loaded
      flushAll(); // for $watch timeout
      expect(spy).toHaveBeenCalled();
      expect($scope.test).toEqual(jasmine.objectContaining(newData));
      expect(ref.set).toHaveBeenCalledWith(newData, jasmine.any(Function));
    });

    it('should apply server changes to scope variable', function () {
      var $scope = $rootScope.$new();
      obj.$bindTo($scope, 'test');
      $timeout.flush();
      obj.$$updated(fakeSnap({foo: 'bar'}));
      obj.$$notify();
      flushAll();
      expect($scope.test).toEqual({foo: 'bar', $id: obj.$id, $priority: obj.$priority});
    });

    it('will replace the object on scope if new server value is not deeply equal', function () {
      var $scope = $rootScope.$new();
      obj.$bindTo($scope, 'test');
      $timeout.flush();
      obj.$$updated(fakeSnap({foo: 'bar'}));
      obj.$$notify();
      flushAll();
      var oldTest = $scope.test;
      obj.$$updated(fakeSnap({foo: 'baz'}));
      obj.$$notify();
      expect($scope.test === oldTest).toBe(false);
    });

    it('will leave the scope value alone if new server value is deeply equal', function () {
      var $scope = $rootScope.$new();
      obj.$bindTo($scope, 'test');
      $timeout.flush();
      obj.$$updated(fakeSnap({foo: 'bar'}));
      obj.$$notify();
      flushAll();
      var oldTest = $scope.test;
      obj.$$updated(fakeSnap({foo: 'bar'}));
      obj.$$notify();
      expect($scope.test === oldTest).toBe(true);
    });

    it('should stop binding when off function is called', function () {
      var origData = $utils.scopeData(obj);
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
      var origValue = $utils.scopeData(obj);
      var $scope = $rootScope.$new();
      $scope.test = {foo: true};
      obj.$bindTo($scope, 'test');
      flushAll();
      expect($utils.scopeData(obj)).toEqual(origValue);
    });

    it('should not fail if remote data is null', function () {
      var $scope = $rootScope.$new();
      var obj = makeObject();
      obj.$bindTo($scope, 'test');
      obj.$ref().set(null);
      flushAll(obj.$ref());
      expect($scope.test).toEqual({$value: null, $id: obj.$id, $priority: obj.$priority});
    });

    it('should delete $value if set to an object', function () {
      var $scope = $rootScope.$new();
      var obj = makeObject();
      obj.$bindTo($scope, 'test');
      flushAll(obj.$ref());
      expect($scope.test).toEqual({$value: null, $id: obj.$id, $priority: obj.$priority});
      $scope.$apply(function() {
        $scope.test.text = 'hello';
      });
      flushAll();
      obj.$ref().flush();
      flushAll();
      expect($scope.test).toEqual({text: 'hello', $id: obj.$id, $priority: obj.$priority});
    });

    it('should update $priority if $priority changed in $scope', function () {
      var $scope = $rootScope.$new();
      var spy = spyOn(obj.$ref(), 'set');
      obj.$bindTo($scope, 'test');
      $timeout.flush();
      $scope.$apply(function() {
        $scope.test.$priority = 999;
      });
      $interval.flush(500);
      $timeout.flush();
      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({'.priority': 999}), jasmine.any(Function));
    });

    it('should update $value if $value changed in $scope', function () {
      var $scope = $rootScope.$new();
      var ref = stubRef();
      var obj = $firebaseObject(ref);
      ref.flush();
      obj.$$updated(testutils.refSnap(ref, 'foo', null));
      expect(obj.$value).toBe('foo');
      var spy = spyOn(ref, 'set');
      obj.$bindTo($scope, 'test');
      flushAll();
      $scope.$apply(function() {
        $scope.test.$value = 'bar';
      });
      $interval.flush(500);
      $timeout.flush();
      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({'.value': 'bar'}), jasmine.any(Function));
    });

    it('should only call $$scopeUpdated once if both metaVars and properties change in the same $digest',function(){
      var $scope = $rootScope.$new();
      var ref = stubRef();
      ref.autoFlush(true);
      ref.setWithPriority({text:'hello'},3);
      var obj = $firebaseObject(ref);
      flushAll();
      flushAll();
      obj.$bindTo($scope, 'test');
      $scope.$apply();
      expect($scope.test).toEqual({text:'hello', $id: obj.$id, $priority: 3});
      var callCount = 0;
      var old$scopeUpdated = obj.$$scopeUpdated;
      obj.$$scopeUpdated = function(){
        callCount++;
        return old$scopeUpdated.apply(this,arguments);
      };
      $scope.$apply(function(){
        $scope.test.text='goodbye';
        $scope.test.$priority=4;
      });
      flushAll();
      flushAll();
      flushAll();
      flushAll();
      expect(callCount).toEqual(1);
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

  describe('$watch', function(){
    it('should return a deregistration function',function(){
      var spy = jasmine.createSpy('$watch');
      var off = obj.$watch(spy);
      obj.foo = 'watchtest';
      obj.$save();
      flushAll();
      expect(spy).toHaveBeenCalled();
      spy.calls.reset();
      off();
      expect(spy).not.toHaveBeenCalled();
    });

    it('additional calls to the deregistration function should be silently ignored',function(){
      var spy = jasmine.createSpy('$watch');
      var off = obj.$watch(spy);
      off();
      off();
      obj.foo = 'watchtest';
      obj.$save();
      flushAll();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('$remove', function() {
    it('should return a promise', function() {
      expect(obj.$remove()).toBeAPromise();
    });

    it('should set $value to null and remove any local keys', function() {
      expect($utils.dataKeys(obj).sort()).toEqual($utils.dataKeys(FIXTURE_DATA).sort());
      obj.$remove();
      flushAll();
      expect($utils.dataKeys(obj)).toEqual([]);
    });

    it('should call remove on the Firebase ref', function() {
      var spy = spyOn(obj.$ref(), 'remove');
      expect(spy).not.toHaveBeenCalled();
      obj.$remove();
      flushAll();
      expect(spy).toHaveBeenCalled(); // should not pass a key
    });

    it('should delete a primitive value', function() {
      var snap = fakeSnap('foo');
      obj.$$updated(snap);
      flushAll();
      expect(obj.$value).toBe('foo');
      obj.$remove();
      flushAll();
      expect(obj.$value).toBe(null);
    });

    it('should trigger a value event for $watch listeners', function() {
      var spy = jasmine.createSpy('$watch listener');
      obj.$watch(spy);
      obj.$remove();
      flushAll();
      expect(spy).toHaveBeenCalledWith({ event: 'value', key: obj.$id });
    });

    it('should work on a query', function() {
      var ref = stubRef();
      ref.set({foo: 'bar'});
      ref.flush();
      var query = ref.limit(3);
      var obj = $firebaseObject(query);
      flushAll(query);
      expect(obj.foo).toBe('bar');
      obj.$remove();
      flushAll(query);
      expect(obj.$value).toBe(null);
    });
  });

  describe('$destroy', function () {
    it('should call off on Firebase ref', function () {
      var spy = spyOn(obj.$ref(), 'off');
      obj.$destroy();
      expect(spy).toHaveBeenCalled();
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

  describe('$extend', function () {
    it('should preserve child prototype', function () {
      function Extend() {
        $firebaseObject.apply(this, arguments);
      }
      Extend.prototype.foo = function () {};
      var ref = stubRef();
      $firebaseObject.$extend(Extend);
      var arr = new Extend(ref);
      expect(arr.foo).toBeA('function');
    });

    it('should return child class', function () {
      function A() {}
      var res = $firebaseObject.$extend(A);
      expect(res).toBe(A);
    });

    it('should be instanceof $firebaseObject', function () {
      function A() {}
      $firebaseObject.$extend(A);
      expect(new A(stubRef())).toBeInstanceOf($firebaseObject);
    });

    it('should add on methods passed into function', function () {
      function foo() {
        return 'foo';
      }
      var F = $firebaseObject.$extend({foo: foo});
      var res = new F(stubRef());
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
      var F = $firebaseObject.$extend({
        $$defaults: {baz: 'baz', aString: 'bravo'}
      });
      var obj = new F(stubRef());
      obj.$$updated(fakeSnap(FIXTURE_DATA));
      expect(obj.aString).toBe(FIXTURE_DATA.aString);
      expect(obj.baz).toBe('baz');
    });
  });

  describe('$$error',function(){
    it('will log an error',function(){
      obj.$$error(new Error());
      expect(log.error).toHaveLength(1);
    });

    it('will call $destroy',function(){
      obj.$destroy = jasmine.createSpy('$destroy');
      var error = new Error();
      obj.$$error(error);
      expect(obj.$destroy).toHaveBeenCalledWith(error);
    });
  });

  function flushAll() {
    Array.prototype.slice.call(arguments, 0).forEach(function (o) {
      angular.isFunction(o.resolve) ? o.resolve() : o.flush();
    });
    try { obj.$ref().flush(); }
    catch(e) {}
    try { $interval.flush(500); }
    catch(e) {}
    try { $timeout.flush(); }
    catch (e) {}
  }

  var pushCounter = 1;

  function fakeSnap(data, pri) {
    return testutils.refSnap(testutils.ref('data/a'), data, pri);
  }

  function stubRef() {
    return new MockFirebase('Mock://').child('data').child(DEFAULT_ID);
  }

  function makeObject(initialData, ref) {
    if( !ref ) {
      ref = stubRef();
    }
    var obj = $firebaseObject(ref);
    if (angular.isDefined(initialData)) {
      ref.ref().set(initialData);
      ref.flush();
      $timeout.flush();
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