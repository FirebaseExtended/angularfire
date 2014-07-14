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

});