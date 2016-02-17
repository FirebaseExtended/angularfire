'use strict';
describe('firebaseRef', function () {

  var firebaseRefProvider;
  var MOCK_URL = 'https://stub.firebaseio-demo.com/'

  beforeEach(module('firebase', function(_firebaseRefProvider_) {
    firebaseRefProvider = _firebaseRefProvider_;
  }));

  describe('registerUrl', function() {

    it('creates a single reference with a url', inject(function() {
      firebaseRefProvider.registerUrl(MOCK_URL);
      expect(firebaseRefProvider.$get()).toBeAFirebaseRef();
    }));

  });

});
