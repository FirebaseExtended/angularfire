'use strict';
describe('$firebaseUtils', function () {
  var $utils, $timeout, testutils;
  beforeEach(function () {
    module('mock.firebase');
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

    it('should parse dates into milliseconds since epoch', function() {
      var date = new Date();
      var ts = date.getTime();
      expect($utils.toJSON({date: date}).date).toBe(ts);
    });
  });

  describe('#getKey', function() {
    it('should return the key name given a DataSnapshot', function() {
      var snapshot = testutils.snap('data', 'foo');
      expect($utils.getKey(snapshot)).toEqual('foo');
    });
  });

});
