'use strict';
describe('$firebaseUtils', function () {
  var $utils, $timeout, testutils;
  beforeEach(function () {
    module('firebase');
    module('testutils');
    inject(function (_$firebaseUtils_, _$timeout_, _testutils_) {
      $utils = _$firebaseUtils_;
      $timeout = _$timeout_;
      testutils = _testutils_;
    });
  });

  describe('#batch', function() {
    it('should return a function', function() {
      expect(typeof $utils.batch()).toBe('function');
    });

    it('should trigger function with arguments', function() {
      var spy = jasmine.createSpy();
      var batch = $utils.batch();
      var b = batch(spy);
      b('foo', 'bar');
      $timeout.flush();
      expect(spy).toHaveBeenCalledWith('foo', 'bar');
    });

    it('should queue up requests until timeout', function() {
      var spy = jasmine.createSpy();
      var batch = $utils.batch();
      var b = batch(spy);
      for(var i=0; i < 4; i++) {
        b(i);
      }
      expect(spy).not.toHaveBeenCalled();
      $timeout.flush();
      expect(spy.calls.count()).toBe(4);
    });

    it('should observe context', function() {
      var a = {}, b;
      var spy = jasmine.createSpy().and.callFake(function() {
        b = this;
      });
      var batch = $utils.batch();
      batch(spy, a)();
      $timeout.flush();
      expect(spy).toHaveBeenCalled();
      expect(b).toBe(a);
    });
  });

  describe('#debounce', function(){
    it('should trigger function with arguments',function(){
      var spy = jasmine.createSpy();
      $utils.debounce(spy,10)('foo', 'bar');
      $timeout.flush();
      expect(spy).toHaveBeenCalledWith('foo', 'bar');
    });

    it('should only trigger once, with most recent arguments',function(){
      var spy = jasmine.createSpy();
      var fn =  $utils.debounce(spy,10);
      fn('foo', 'bar');
      fn('baz', 'biz');
      $timeout.flush();
      expect(spy.calls.count()).toBe(1);
      expect(spy).toHaveBeenCalledWith('baz', 'biz');
    });

    it('should only trigger once (timing corner case)',function(){
      var spy = jasmine.createSpy();
      var fn =  $utils.debounce(spy, null, 1, 2);
      fn('foo', 'bar');
      var start = Date.now();

      // block for 3ms without releasing
      while(Date.now() - start < 3){ }

      fn('bar', 'baz');
      fn('baz', 'biz');
      expect(spy).not.toHaveBeenCalled();
      $timeout.flush();
      expect(spy.calls.count()).toBe(1);
      expect(spy).toHaveBeenCalledWith('baz', 'biz');
    });
  });

  describe('#updateRec', function() {
    it('should return true if changes applied', function() {
      var rec = {};
      expect($utils.updateRec(rec, testutils.snap('foo'))).toBe(true);
    });

    it('should be false if no changes applied', function() {
      var rec = {foo: 'bar',  $id: 'foo', $priority: null};
      expect($utils.updateRec(rec, testutils.snap({foo: 'bar'}, 'foo'))).toBe(false);
    });

    it('should apply changes to record', function() {
      var rec = {foo: 'bar',  bar: 'foo', $id: 'foo', $priority: null};
      $utils.updateRec(rec, testutils.snap({bar: 'baz', baz: 'foo'}));
      expect(rec).toEqual({bar: 'baz', baz: 'foo', $id: 'foo', $priority: null})
    });

    it('should delete $value property if not a primitive',function(){
      var rec = {$id:'foo', $priority:null, $value:null };
      $utils.updateRec(rec, testutils.snap({bar: 'baz', baz:'foo'}));
      expect(rec).toEqual({bar: 'baz', baz: 'foo', $id: 'foo', $priority: null});
    });
  });

  describe('#scopeData',function(){
    it('$id, $priority, and $value are only private properties that get copied',function(){
      var data = {$id:'foo',$priority:'bar',$value:null,$private1:'baz',$private2:'foo'};
      expect($utils.scopeData(data)).toEqual({$id:'foo',$priority:'bar',$value:null});
    });

    it('all public properties will be copied',function(){
      var data = {$id:'foo',$priority:'bar',public1:'baz',public2:'test'};
      expect($utils.scopeData(data)).toEqual({$id:'foo',$priority:'bar',public1:'baz',public2:'test'});
    });

    it('$value will not be copied if public properties are present',function(){
      var data = {$id:'foo',$priority:'bar',$value:'noCopy',public1:'baz',public2:'test'};
      expect($utils.scopeData(data)).toEqual({$id:'foo',$priority:'bar',public1:'baz',public2:'test'});
    });
  });

  describe('#applyDefaults', function() {
    it('should return rec', function() {
      var rec = {foo: 'bar'};
      expect($utils.applyDefaults(rec), {bar: 'baz'}).toBe(rec);
    });

    it('should do nothing if no defaults exist', function() {
      var rec = {foo: 'bar'};
      $utils.applyDefaults(rec, null);
      expect(rec).toEqual({foo: 'bar'});
    });

    it('should add $$defaults if they exist', function() {
      var rec = {foo: 'foo',  bar: 'bar', $id: 'foo', $priority: null};
      var defaults = { baz: 'baz', bar: 'not_applied' };
      $utils.applyDefaults(rec, defaults);
      expect(rec).toEqual({foo: 'foo',  bar: 'bar', $id: 'foo', $priority: null, baz: 'baz'});
    });
  });

  describe('#toJSON', function() {
    it('should use toJSON if it exists', function() {
      var json = {json: true};
      var spy = jasmine.createSpy('toJSON').and.callFake(function() {
        return json;
      });
      var F = function() {};
      F.prototype.toJSON = spy;
      expect($utils.toJSON(new F())).toEqual(json);
      expect(spy).toHaveBeenCalled();
    });

    it('should use $value if found', function() {
      var json = {$value: 'foo'};
      expect($utils.toJSON(json)).toEqual({'.value': json.$value});
    });

    it('should set $priority if exists', function() {
      var json = {$value: 'foo', $priority: 0};
      expect($utils.toJSON(json)).toEqual({'.value': json.$value, '.priority': json.$priority});
    });

    it('should not set $priority if it is the only key', function() {
      var json = {$priority: true};
      expect($utils.toJSON(json)).toEqual({});
    });

    it('should remove any variables prefixed with $', function() {
      var json = {foo: 'bar', $foo: '$bar'};
      expect($utils.toJSON(json)).toEqual({foo: json.foo});
    });

    it('should remove any deeply nested variables prefixed with $', function() {
      var json = {
        arr: [[
            {$$hashKey: false, $key: 1, alpha: 'alpha', bravo: {$$private: '$$private', $key: '$key', bravo: 'bravo'}},
            {$$hashKey: false, $key: 1, alpha: 'alpha', bravo: {$$private: '$$private', $key: '$key', bravo: 'bravo'}}

        ], ["a", "b", {$$key: '$$key'}]],
        obj: {
          nest: {$$hashKey: false, $key: 1, alpha: 'alpha', bravo: {$$private: '$$private', $key: '$key', bravo: 'bravo'} }
        }
      };

      expect($utils.toJSON(json)).toEqual({
        arr: [[
          {alpha: 'alpha', bravo: {bravo: 'bravo'}},
          {alpha: 'alpha', bravo: {bravo: 'bravo'}}

        ], ["a", "b", {}]],
        obj: {
          nest: {alpha: 'alpha', bravo: {bravo: 'bravo'} }
        }
      });
    });

    it('should throw error if an invalid character in key', function() {
      expect(function() {
        $utils.toJSON({'foo.bar': 'foo.bar'});
      }).toThrowError(Error);
      expect(function() {
        $utils.toJSON({'foo$bar': 'foo.bar'});
      }).toThrowError(Error);
      expect(function() {
        $utils.toJSON({'foo#bar': 'foo.bar'});
      }).toThrowError(Error);
      expect(function() {
        $utils.toJSON({'foo[bar': 'foo.bar'});
      }).toThrowError(Error);
      expect(function() {
        $utils.toJSON({'foo]bar': 'foo.bar'});
      }).toThrowError(Error);
      expect(function() {
        $utils.toJSON({'foo/bar': 'foo.bar'});
      }).toThrowError(Error);
    });

    it('should throw error if undefined value', function() {
      expect(function() {
        var undef;
        $utils.toJSON({foo: 'bar', baz: undef});
      }).toThrowError(Error);
    });
  });

  describe('#getKey', function() {
    it('should return the key name given a DataSnapshot', function() {
      var snapshot = testutils.snap('data', 'foo');
      expect($utils.getKey(snapshot)).toEqual('foo');
    });
  });

  describe('#makeNodeResolver', function(){
    var deferred, callback;
    beforeEach(function(){
      deferred = jasmine.createSpyObj('promise',['resolve','reject']);
      callback = $utils.makeNodeResolver(deferred);
    });

    it('should return a function', function(){
      expect(callback).toBeA('function');
    });

    it('should reject the promise if the first argument is truthy', function(){
      var error = new Error('blah');
      callback(error);
      expect(deferred.reject).toHaveBeenCalledWith(error);
    });

    it('should reject the promise if the first argument is not null', function(){
      callback(false);
      expect(deferred.reject).toHaveBeenCalledWith(false);
    });
    
    it('should resolve the promise if the first argument is null', function(){
      var result = {data:'hello world'};
      callback(null,result);
      expect(deferred.resolve).toHaveBeenCalledWith(result);
    });

    it('should aggregate multiple arguments into an array', function(){
      var result1 = {data:'hello world!'};
      var result2 = {data:'howdy!'};
      callback(null,result1,result2);
      expect(deferred.resolve).toHaveBeenCalledWith([result1,result2]);
    });
  });

});

describe('#promise (ES6 Polyfill)', function(){

  var status, result, reason, $utils, $timeout;

  function wrapPromise(promise){
    promise.then(function(_result){
      status = 'resolved';
      result = _result;
    },function(_reason){
      status = 'rejected';
      reason = _reason;
    });
  }

  beforeEach(function(){
    status = 'pending';
    result = null;
    reason = null;
  });

  beforeEach(module('firebase',function($provide){
    $provide.decorator('$q',function($delegate){
      //Forces polyfil even if we are testing against angular 1.3.x
      return {
        defer:$delegate.defer,
        all:$delegate.all
      }
    });
  }));

  beforeEach(inject(function(_$firebaseUtils_, _$timeout_){
    $utils = _$firebaseUtils_;
    $timeout = _$timeout_;
  }));

  it('throws an error if not called with a function',function(){
    expect(function(){
      $utils.promise();
    }).toThrow();
    expect(function(){
      $utils.promise({});
    }).toThrow();
  });

  it('calling resolve will resolve the promise with the provided result',function(){
    wrapPromise(new $utils.promise(function(resolve,reject){
      resolve('foo');
    }));
    $timeout.flush();
    expect(status).toBe('resolved');
    expect(result).toBe('foo');
  });

  it('calling reject will reject the promise with the provided reason',function(){
    wrapPromise(new $utils.promise(function(resolve,reject){
      reject('bar');
    }));
    $timeout.flush();
    expect(status).toBe('rejected');
    expect(reason).toBe('bar');
  });

});
