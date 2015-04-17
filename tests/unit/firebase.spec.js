'use strict';
describe('$firebase', function () {

  beforeEach(function () {
    module('firebase');
  });

  describe('<constructor>', function () {
    var $firebase;
    beforeEach(function() {
      inject(function (_$firebase_) {
        $firebase = _$firebase_;
      });
    });
    it('throws an error', function() {
      expect(function() {
        $firebase(new Firebase('Mock://'));
      }).toThrow();
    });
  });
});
