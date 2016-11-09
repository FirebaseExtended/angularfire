'use strict';
describe('firebaseRef', function () {

  var $firebaseRefProvider;
  var MOCK_URL = firebase.database().ref().toString();

  beforeEach(module('firebase.database', function(_$firebaseRefProvider_) {
    $firebaseRefProvider = _$firebaseRefProvider_;
  }));

  describe('registerUrl', function() {

    it('creates a single reference with a url', inject(function() {
      $firebaseRefProvider.registerUrl(MOCK_URL);
      expect($firebaseRefProvider.$get().default).toBeAFirebaseRef();
    }));

    it('creates a default reference with a config object', inject(function() {
      $firebaseRefProvider.registerUrl({
        default: MOCK_URL
      });
      var firebaseRef = $firebaseRefProvider.$get();
      expect(firebaseRef.default).toBeAFirebaseRef();
    }));

    it('creates multiple references with a config object', inject(function() {
      $firebaseRefProvider.registerUrl({
        default: MOCK_URL,
        messages: MOCK_URL + '/messages'
      });
      var firebaseRef = $firebaseRefProvider.$get();
      expect(firebaseRef.default).toBeAFirebaseRef();
      expect(firebaseRef.messages).toBeAFirebaseRef();
    }));

    it('should throw an error when no url is provided', inject(function () {
      function errorWrapper() {
        $firebaseRefProvider.registerUrl();
        $firebaseRefProvider.$get();
      }
      expect(errorWrapper).toThrow();
    }));

    it('should throw an error when no default url is provided', inject(function() {
      function errorWrapper() {
        $firebaseRefProvider.registerUrl({ messages: MOCK_URL + '/messages' });
        $firebaseRefProvider.$get();
      }
      expect(errorWrapper).toThrow();
    }));


  });

});
