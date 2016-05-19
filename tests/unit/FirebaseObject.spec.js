describe('$firebaseObject', function() {
  'use strict';
  var $firebaseObject, $utils, $rootScope, $timeout, $q, tick, obj, testutils, $interval, log;

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
    inject(function (_$interval_, _$firebaseObject_, _$timeout_, $firebaseUtils, _$rootScope_, _$q_, _testutils_) {
      $firebaseObject = _$firebaseObject_;
      $timeout = _$timeout_;
      $interval = _$interval_;
      $utils = $firebaseUtils;
      $rootScope = _$rootScope_;
      $q = _$q_;
      testutils = _testutils_;

      tick = function (cb) {
        setTimeout(function() {
          $q.defer();
          $rootScope.$digest();
          cb && cb();
        }, 1000)
      };

      obj = makeObject(FIXTURE_DATA);
    });
  });

  describe('constructor', function() {
    it('should set the record id', function() {
      expect(obj.$id).toEqual(obj.$ref().key);
    });

    it('should accept a query', function() {
      var obj = makeObject(FIXTURE_DATA, stubRef().limitToLast(1).startAt(null));

      obj.$$updated(testutils.snap({foo: 'bar'}));
      expect(obj).toEqual(jasmine.objectContaining({foo: 'bar'}));
    });

    it('should apply $$defaults if they exist', function() {
      var F = $firebaseObject.$extend({
        $$defaults: {aNum: 0, aStr: 'foo', aBool: false}
      });
      var ref = stubRef();
      var obj = new F(ref);

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

    it('should resolve promise to the ref for this object', function (done) {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      obj.$save()
        .then(whiteSpy, blackSpy)
        .then(function () {
          expect(whiteSpy).toHaveBeenCalled();
          expect(blackSpy).not.toHaveBeenCalled();
          done();
        });
      tick();
    });

    it('should reject promise on failure', function (done) {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');

      obj['child/invalid'] = true;
      obj.$save().then(whiteSpy, blackSpy)
        .finally(function () {
          expect(blackSpy).toHaveBeenCalled();
          expect(whiteSpy).not.toHaveBeenCalled();
          done();
        });

      tick();
    });

    it('should trigger watch event', function(done) {
      var spy = jasmine.createSpy('$watch');
      obj.$watch(spy);
      obj.foo = 'watchtest';
      obj.$save()
        .then(function () {
          expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({event: 'value', key: obj.$id}));
          done();
        });

      tick();
    });

    it('should work on a query', function(done) {
      var ref = stubRef();
      ref.set({foo: 'baz'});
      var query = ref.limitToLast(3);
      var spy = spyOn(firebase.database.Reference.prototype, 'update').and.callThrough();
      var obj = $firebaseObject(query);

      obj.foo = 'bar';
      obj.$save().then(function () {
        expect(spy).toHaveBeenCalledWith({foo: 'bar'}, jasmine.any(Function));
        done();
      });

      tick();
    });
  });

  describe('$loaded', function () {
    it('should return a promise', function () {
      expect(obj.$loaded()).toBeAPromise();
    });

    it('should resolve when all server data is downloaded', function (done) {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var obj = makeObject();

      obj.$loaded()
        .then(whiteSpy, blackSpy)
        .then(function () {
          expect(whiteSpy).toHaveBeenCalledWith(obj);
          expect(blackSpy).not.toHaveBeenCalled();
          done();
        });

      obj.key = "value";
      obj.$save();

      tick();
    });

    it('should reject if the ready promise is rejected', function (done) {
      var whiteSpy = jasmine.createSpy('resolve');
      var blackSpy = jasmine.createSpy('reject');
      var err = new Error('test_fail');

      spyOn(firebase.database.Reference.prototype, "once").and.callFake(function (event, cb, cancel_cb) {
        cancel_cb(err);
      });

      var obj = makeObject();

      obj.$loaded()
        .then(whiteSpy, blackSpy)
        .finally(function () {
          expect(whiteSpy).not.toHaveBeenCalled();
          expect(blackSpy).toHaveBeenCalledWith(err);
          done();
        });

      tick();
    });

    it('should resolve to the FirebaseObject instance', function (done) {
      var spy = jasmine.createSpy('loaded');
      obj.$loaded().then(spy).then(function () {
        expect(spy).toHaveBeenCalledWith(obj);
        done()
      })

      tick();
    });

    it('should contain all data at the time $loaded is called', function (done) {
      var obj = makeObject(FIXTURE_DATA);
      obj.$loaded().then(function (data) {
        expect(data).toEqual(jasmine.objectContaining(FIXTURE_DATA));
        done();
      });
      obj.$ref().set(FIXTURE_DATA);

      tick();
    });

    it('should trigger if attached before load completes', function(done) {
      var obj = makeObject(FIXTURE_DATA);

      obj.$loaded().then(function (data) {
        expect(data).toEqual(jasmine.objectContaining(FIXTURE_DATA));
        done();
      });

      tick();
    });

    it('should trigger if attached after load completes', function(done) {
      var obj = makeObject(FIXTURE_DATA);

      obj.$loaded().then(function (data) {
        expect(data).toEqual(jasmine.objectContaining(FIXTURE_DATA));
        done();
      });

      tick();
    });

    it('should resolve properly if function passed directly into $loaded', function(done) {
      var obj = makeObject(FIXTURE_DATA);

      obj.$loaded(function (data) {
          expect(data).toEqual(jasmine.objectContaining(FIXTURE_DATA));
          done();
      })

      tick();
    });

    it('should reject properly if function passed directly into $loaded', function(done) {
      var whiteSpy = jasmine.createSpy('resolve');
      var err = new Error('test_fail');

      spyOn(firebase.database.Reference.prototype, "on").and.callFake(function (event, cb, cancel_cb) {
        cancel_cb(err);
      });

      var obj = $firebaseObject(stubRef());

      obj.$loaded(whiteSpy, function () {
        expect(whiteSpy).not.toHaveBeenCalled();
        done();
      });

      tick();
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

    it('should resolve to an off function', function (done) {
      obj.$bindTo($rootScope.$new(), 'test').then(function (off) {
        expect(off).toBeA('function');
        done();
      });

      tick();
    });

    it('should have data when it resolves', function (done) {
      var obj = makeObject(FIXTURE_DATA);

      obj.$bindTo($rootScope.$new(), 'test').then(function () {
          expect(obj).toEqual(jasmine.objectContaining(FIXTURE_DATA));
          done();
      });

      tick();
    });

    it('should have data in $scope when resolved', function(done) {
      var data = {"a": true};
      var obj = makeObject(data);
      var $scope = $rootScope.$new();

      obj.$bindTo($scope, 'test').then(function () {
        expect($scope.test).toEqual(jasmine.objectContaining(data));
        expect($scope.test.$id).toBe(obj.$id);
        done();
      });

      tick();
    });

    it('should send local changes to $firebase.$set', function (done) {
      var obj = makeObject(FIXTURE_DATA);
      var spy = spyOn(firebase.database.Reference.prototype, 'set').and.callThrough();
      var $scope = $rootScope.$new();

      obj.$bindTo($scope, 'test')
        .then(function () {
          $scope.test.bar = 'baz';
        })
        .then(function () {
          tick(function () {
            $timeout.flush();
            expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({bar: 'baz'}), jasmine.any(Function));
            done();
          });
        });

      tick();
    });

    it('should allow data to be set inside promise callback', function (done) {
      var ref = obj.$ref();
      spyOn(ref, 'set');
      var $scope = $rootScope.$new();
      var oldData = { 'old': true }
      var newData = { 'bar': 'foo' };
      var spy = jasmine.createSpy('resolve').and.callFake(function () {
        $scope.test = newData;
      });
      obj.$bindTo($scope, 'test').then(spy).then(function () {
        expect(spy).toHaveBeenCalled();
        expect($scope.test).toEqual(jasmine.objectContaining(newData));
        expect(ref.set).toHaveBeenCalledWith(oldData);
        done();
      });

      ref.set(oldData);
      tick();
    });

    it('should apply server changes to scope variable', function () {
      var $scope = $rootScope.$new();
      obj.$bindTo($scope, 'test');
      $timeout.flush();
      obj.$$updated(fakeSnap({foo: 'bar'}));
      obj.$$notify();
      //1:flushAll();
      expect($scope.test).toEqual({foo: 'bar', $id: obj.$id, $priority: obj.$priority});
    });

    it('will replace the object on scope if new server value is not deeply equal', function () {
      var $scope = $rootScope.$new();
      obj.$bindTo($scope, 'test');
      $timeout.flush();
      obj.$$updated(fakeSnap({foo: 'bar'}));
      obj.$$notify();
      //1:flushAll();
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
      //1:flushAll();
      var oldTest = $scope.test;
      obj.$$updated(fakeSnap({foo: 'bar'}));
      obj.$$notify();
      expect($scope.test === oldTest).toBe(true);
    });

    it('should stop binding when off function is called', function (done) {
      var origData = $utils.scopeData(obj);
      var $scope = $rootScope.$new();
      var spy = jasmine.createSpy('$bindTo').and.callFake(function (off) {
        expect($scope.obj).toEqual(origData);
        off();
      });
      obj.$bindTo($scope, 'obj').then(spy).then(function () {
        obj.$$updated(fakeSnap({foo: 'bar'}))
        expect(spy).toHaveBeenCalled();
        expect($scope.obj).toEqual(origData);
        done();
      });
      $rootScope.$digest();
    });

    it('should not destroy remote data if local is pre-set', function () {
      var origValue = $utils.scopeData(obj);
      var $scope = $rootScope.$new();
      $scope.test = {foo: true};
      obj.$bindTo($scope, 'test');
      //1:flushAll();
      expect($utils.scopeData(obj)).toEqual(origValue);
    });

    it('should not fail if remote data is null', function (done) {
      var $scope = $rootScope.$new();
      var obj = makeObject(FIXTURE_DATA);
      obj.$bindTo($scope, 'test');
      obj.$ref().set(null).then(function () {
        $rootScope.$digest();
        expect($scope.test).toEqual({$value: null, $id: obj.$id, $priority: obj.$priority});
        done();
      });
    });

    it('should delete $value if set to an object', function (done) {
      var $scope = $rootScope.$new();
      var obj = makeObject(null);

      $timeout.flush();
      // Note: Failing because we're not writing -> reading -> fixing $scope.test
      obj.$bindTo($scope, 'test')
        .then(function () {
          expect($scope.test).toEqual({$value: null, $id: obj.$id, $priority: obj.$priority});
        }).then(function () {
          $scope.test.text = "hello";
        }).then(function () {
          // This isn't ideal, but needed to fulfill promises, then trigger timeout created
          // by that promise, then fulfil the promise created by that timeout. Yep.
          tick(function () {
            $timeout.flush();
            tick(function () {
              expect($scope.test).toEqual({text: 'hello', $id: obj.$id, $priority: obj.$priority});
              done();
            })
          });
        });

      tick();
    });

    it('should update $priority if $priority changed in $scope', function (done) {
      var $scope = $rootScope.$new();
      var ref = stubRef();
      var obj = $firebaseObject(ref);

      var spy = spyOn(firebase.database.Reference.prototype, 'set').and.callThrough();
      obj.$value = 'foo';
      obj.$save().then(function () {
          return obj.$bindTo($scope, 'test');
        })
        .then(function () {
          $scope.test.$priority = 9999;
        })
        .then(function () {
          tick(function () {
            $timeout.flush();
            expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({'.priority': 9999}), jasmine.any(Function));
            done();
          });
        });

      tick();
    });

    it('should update $value if $value changed in $scope', function () {
      var $scope = $rootScope.$new();
      var ref = stubRef();
      var obj = $firebaseObject(ref);

      obj.$$updated(testutils.refSnap(ref, 'foo', null));
      expect(obj.$value).toBe('foo');
      var spy = spyOn(firebase.database.Reference.prototype, 'set');
      obj.$bindTo($scope, 'test')
        .then(function () {
          $scope.test.$value = 'bar';
        })
        .then(function () {
          expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({'.value': 'bar'}), jasmine.any(Function));
        })

      tick();
    });

    it('should only call $$scopeUpdated once if both metaVars and properties change in the same $digest', function(done){
      var $scope = $rootScope.$new();
      var ref = stubRef();
      ref.setWithPriority({text:'hello'}, 3);
      var obj = $firebaseObject(ref);

      var old$scopeUpdated = obj.$$scopeUpdated;
      var callCount = 0;

      obj.$bindTo($scope, 'test')
        .then(function () {
          expect($scope.test).toEqual({text:'hello', $id: obj.$id, $priority: 3});
        })
        .then(function () {

          obj.$$scopeUpdated = function(){
            callCount++;
            done();
            return old$scopeUpdated.apply(this,arguments);
          };

          $scope.test.text='goodbye';
          $scope.test.$priority=4;
        })
        .then(function () {
          tick(function () {
            $timeout.flush();
            expect(callCount).toBe(1);
            done();
          });
        });

      tick();
    });

    it('should throw error if double bound', function(done) {
      var $scope = $rootScope.$new();
      var aSpy = jasmine.createSpy('firstBind');
      var bResolve = jasmine.createSpy('secondBindResolve');
      var bReject = jasmine.createSpy('secondBindReject');
      obj.$bindTo($scope, 'a')
        .then(aSpy)
        .then(function () {
          expect(aSpy).toHaveBeenCalled();
          return obj.$bindTo($scope, 'b').then(bResolve, bReject);
        })
        .then(function () {
          expect(bResolve).not.toHaveBeenCalled();
          expect(bReject).toHaveBeenCalled();
          done();
        });

      tick();
    });

    it('should accept another binding after off is called', function(done) {
      var $scope = $rootScope.$new();

      var bSpy = jasmine.createSpy('secondResolve');
      var bFail = jasmine.createSpy('secondReject');
      obj.$bindTo($scope, 'a')
        .then(function (unbind) {
          unbind();
        })
        .then(function () {
          return obj.$bindTo($scope, 'b');
        })
        .then(bSpy, bFail)
        .then(function () {
          expect(bSpy).toHaveBeenCalled();
          expect(bFail).not.toHaveBeenCalled();
          done();
        });

      tick();
    });
  });

  describe('$watch', function(){
    it('should return a deregistration function',function(done){
      var spy = jasmine.createSpy('$watch');
      var off = obj.$watch(spy);
      obj.foo = 'watchtest';
      obj.$save()
        .then(function () {
          expect(spy).toHaveBeenCalled();
          spy.calls.reset();
          off();
          expect(spy).not.toHaveBeenCalled();
          done();
        });

      tick();
    });

    it('additional calls to the deregistration function should be silently ignored',function(done){
      var spy = jasmine.createSpy('$watch');
      var off = obj.$watch(spy);
      off();
      off();

      obj.foo = 'watchtest';
      obj.$save()
        .then(function () {
          expect(spy).not.toHaveBeenCalled();
          done();
        });

      tick();
    });
  });

  describe('$remove', function() {
    it('should return a promise', function() {
      expect(obj.$remove()).toBeAPromise();
    });

    it('should set $value to null and remove any local keys', function() {
      expect($utils.dataKeys(obj).sort()).toEqual($utils.dataKeys(FIXTURE_DATA).sort());
      obj.$remove();
      expect($utils.dataKeys(obj)).toEqual([]);
    });

    it('should call remove on the Firebase ref', function(done) {
      obj.$ref().set("Hello!");
      obj.$remove()
      obj.$ref().on("value", function (ss) {
        if (ss.val() == null) {
          done();
        }
      })
    });

    it('should delete a primitive value', function() {
      var snap = fakeSnap('foo');
      obj.$$updated(snap);

      expect(obj.$value).toBe('foo');
      obj.$remove().then(function () {
        expect(obj.$value).toBe(null);
      });

      tick();
    });

    it('should trigger a value event for $watch listeners', function(done) {
      var spy = jasmine.createSpy('$watch listener');

      obj.$watch(spy);
      obj.$remove().then(function () {
        expect(spy).toHaveBeenCalledWith({ event: 'value', key: obj.$id });
        done();
      });

      tick();
    });

    it('should work on a query', function(done) {
      var ref = stubRef();
      ref.set({foo: 'bar'});
      var query = ref.limitToLast(3);
      var obj = $firebaseObject(query);

      obj.$loaded().then(function () {
        expect(obj.foo).toBe('bar');
      }).then(function () {
        var p = obj.$remove();
        tick();
        return p;
      }).then(function () {
        expect(obj.$value).toBe(null);
        done();
      });

      tick();
    });
  });

  describe('$destroy', function () {
    it('should call off on Firebase ref', function () {
      var spy = spyOn(obj.$ref(), 'off');
      obj.$destroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should dispose of any bound instance', function (done) {
      var $scope = $rootScope.$new();
      spyOnWatch($scope);
      // now bind to scope and destroy to see what happens
      obj.$bindTo($scope, 'foo').then(function () {
        expect($scope.$watch).toHaveBeenCalled();
        return obj.$destroy();
      }).then(function () {
        expect($scope.$watch.$$$offSpy).toHaveBeenCalled();
        done();
      });

      tick();
    });

    it('should unbind if scope is destroyed', function (done) {
      var $scope = $rootScope.$new();
      spyOnWatch($scope);
      obj.$bindTo($scope, 'foo')
        .then(function () {
          expect($scope.$watch).toHaveBeenCalled();
          $scope.$emit('$destroy');
          expect($scope.$watch.$$$offSpy).toHaveBeenCalled();
          done();
        });

      tick()
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
      var res = F(stubRef());
      expect(res.$$updated).toBeA('function');
      expect(res.foo).toBeA('function');
      expect(res.foo()).toBe('foo');
    });


    it('should work with the new keyword', function() {
      var fn = function() {};
      var Res = $firebaseObject.$extend({foo: fn});
      expect(new Res(stubRef()).foo).toBeA('function');
    });

    it('should work without the new keyword', function() {
      var fn = function() {};
      var Res = $firebaseObject.$extend({foo: fn});
      expect(Res(stubRef()).foo).toBeA('function');
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
      //1:flushAll();
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
    return firebase.database().ref().push();
  }

  function makeObject(initialData, ref) {
    if( !ref ) {
      ref = stubRef();
    }
    var obj = $firebaseObject(ref);
    if (angular.isDefined(initialData)) {
      ref.ref.set(initialData);
      $rootScope.$digest();
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
