'use strict';
describe('$firebase', function () {

  var $firebase, $FirebaseArray, $timeout;

  beforeEach(function() {
    module('mock.firebase');
    module('firebase');
    inject(function (_$firebase_, _$FirebaseArray_, _$timeout_) {
      $firebase = _$firebase_;
      $FirebaseArray = _$FirebaseArray_;
      $timeout = _$timeout_;
    });
  });

  describe('<constructor>', function() {
    it('should accept a Firebase ref', function() {
      var ref = new Firebase('Mock://');
      var fb = new $firebase(ref);
      expect(fb.ref()).toBe(ref);
    });

    it('should throw an error if passed a string', function() {
      expect(function() {
        $firebase('hello world');
      }).toThrowError(/valid Firebase reference/);
    });
  });

  describe('#add', function() {
    xit('should have tests');
  });

  describe('#save', function() {
    xit('should have tests');
  });

  describe('#remove', function() {
    xit('should have tests');
  });

  describe('#keyAt', function() {
    xit('should have tests');
  });

  describe('#indexFor', function() {
    xit('should have tests');
  });

  describe('#loaded', function() {
    xit('should have tests');
  });

  describe('#inst', function() {
    xit('should return $firebase instance it was created with');
  });

  describe('#destroy', function() {
    xit('should have tests');
  });
});