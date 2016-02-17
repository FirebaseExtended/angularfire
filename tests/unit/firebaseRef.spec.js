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

    it('creates a default reference with a config object', inject(function() {
      firebaseRefProvider.registerUrl({
        default: MOCK_URL
      });
      var firebaseRef = firebaseRefProvider.$get();
      expect(firebaseRef).toBeAFirebaseRef();
    }));

    it('creates multiple references with a config object', inject(function() {
      firebaseRefProvider.registerUrl({
        default: MOCK_URL,
        messages: MOCK_URL + 'messages'
      });
      var firebaseRef = firebaseRefProvider.$get();
      expect(firebaseRef).toBeAFirebaseRef();
      expect(firebaseRef.messages).toBeAFirebaseRef();
    }));

    it('should throw an error when no url is provided', inject(function () {
      function errorWrapper() {
        firebaseRefProvider.registerUrl();
        firebaseRefProvider.$get();
      }
      expect(errorWrapper).toThrow();
    }));

    it('should throw an error when a reserved property is used', inject(function() {
      function errorWrapper() {
        firebaseRefProvider.registerUrl({
          path: 'hello'
        });
        firebaseRefProvider.$get();
      }
      expect(errorWrapper).toThrow();
    }));

  });

});
