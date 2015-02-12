'use strict';
describe('$firebase', function () {

  var $firebase, $timeout, $rootScope, $utils;

  var defaults = JSON.parse(window.__html__['fixtures/data.json']);

  beforeEach(function () {
    module('firebase');
    module('mock.utils');
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
