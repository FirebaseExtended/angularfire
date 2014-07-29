'use strict';
describe('$firebaseUtils', function () {
  var $utils, $timeout;
  beforeEach(function () {
    module('mock.firebase');
    module('firebase');
    inject(function (_$firebaseUtils_, _$timeout_) {
      $utils = _$firebaseUtils_;
      $timeout = _$timeout_;
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

});