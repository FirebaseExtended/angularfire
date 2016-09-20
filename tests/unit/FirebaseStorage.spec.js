'use strict';
fdescribe('$firebaseStorage', function () {
  var $firebaseStorage;
  var URL = 'https://angularfire-dae2e.firebaseio.com';

  beforeEach(function () {
    module('firebase.storage');
  });

  describe('<constructor>', function () {

    var $firebaseStorage;
    var $q;
    var $rootScope;
    var $firebaseUtils;
    beforeEach(function () {
      module('firebase.storage');
      inject(function (_$firebaseStorage_, _$q_, _$rootScope_, _$firebaseUtils_) {
        $firebaseStorage = _$firebaseStorage_;
        $q = _$q_;
        $rootScope = _$rootScope_;
        $firebaseUtils = _$firebaseUtils_;
      });
    });

    it('should exist', inject(function () {
      expect($firebaseStorage).not.toBe(null);
    }));

    it('should create an instance', function () {
      var ref = firebase.storage().ref('thing');
      var storage = $firebaseStorage(ref);
      expect(storage).not.toBe(null);
    });

  });
});
