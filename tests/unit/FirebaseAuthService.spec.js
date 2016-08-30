'use strict';
describe('$firebaseAuthService', function () {
  beforeEach(function () {
    module('firebase.auth')
  });

  describe('<constructor>', function() {

    var $firebaseAuthService;
    beforeEach(function() {
      module('firebase');
      inject(function (_$firebaseAuthService_) {
        $firebaseAuthService = _$firebaseAuthService_;
      });
    });

    it('should exist', inject(function() {
      expect($firebaseAuthService).not.toBe(null);
    }));

  });
});
