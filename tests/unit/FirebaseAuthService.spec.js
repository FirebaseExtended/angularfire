'use strict';
describe('$firebaseAuthService', function () {
  var firebaseRefProvider;
  var MOCK_URL = 'https://stub.firebaseio-demo.com/'

  beforeEach(module('firebase', function(_firebaseRefProvider_) {
    firebaseRefProvider = _firebaseRefProvider_;
    firebaseRefProvider.registerUrl(MOCK_URL);
  }));

  describe('<constructor>', function() {

    var $firebaseAuthService;
    beforeEach(function() {
      module('firebase');
      inject(function (_$firebaseAuthService_) {
        $firebaseAuthService = _$firebaseAuthService_;
      });
    });

    it('should exist because we called firebaseRefProvider.registerUrl()', inject(function() {
      expect($firebaseAuthService).not.toBe(null);
    }));
    
  });

});
