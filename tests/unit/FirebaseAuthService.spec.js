'use strict';
describe('$firebaseAuthService', function () {
  var $firebaseRefProvider;
  var URL = 'https://angularfire-dae2e.firebaseio.com'

  beforeEach(module('firebase', function(_$firebaseRefProvider_) {
    $firebaseRefProvider = _$firebaseRefProvider_;
    $firebaseRefProvider.registerUrl(URL);
  }));

  describe('<constructor>', function() {

    var $firebaseAuthService;
    beforeEach(function() {
      module('firebase');
      inject(function (_$firebaseAuthService_) {
        $firebaseAuthService = _$firebaseAuthService_;
      });
    });

    it('should exist because we called $firebaseRefProvider.registerUrl()', inject(function() {
      expect($firebaseAuthService).not.toBe(null);
    }));

  });
});
