'use strict';
fdescribe('$firebaseStorage', function () {
  var $firebaseStorage;
  var URL = 'https://angularfire-dae2e.firebaseio.com';
  
  beforeEach(function () {
    module('firebase.storage');
  });

  describe('<constructor>', function() {

    var $firebaseStorage;
    var $q;
    var $rootScope;
    beforeEach(function() {
      module('firebase.storage');
      inject(function (_$firebaseStorage_, _$q_, _$rootScope_) {
        $firebaseStorage = _$firebaseStorage_;
        $q = _$q_;
        $rootScope = _$rootScope_;
      });
    });

    it('should exist', inject(function() {
      expect($firebaseStorage).not.toBe(null);
    }));

    it('should create an instance', function() {
      var ref = firebase.storage().ref('thing');
      var storage = $firebaseStorage(ref);
      expect(storage).not.toBe(null);
    });

    describe('$firebaseStorage.utils', function() {

      describe('_unwrapStorageSnapshot', function() {

        it('should unwrap the snapshot', function() {
          var mockSnapshot = {
            bytesTransferred: 0,
            downloadURL: 'url',
            metadata: {},
            ref: {},
            state: {},
            task: {},
            totalBytes: 0
          };
          var unwrapped = $firebaseStorage.utils._unwrapStorageSnapshot(mockSnapshot);
          expect(mockSnapshot).toEqual(unwrapped);
        });

      });

      describe('_$put', function() {
        
        it('should call a storage ref put', function() {
          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var storage = $firebaseStorage(ref);
          var task = null;
          spyOn(ref, 'put');
          task = storage.$put(file);
          expect(ref.put).toHaveBeenCalledWith('file');
          expect(task.$progress).toEqual(jasmine.any(Function));
          expect(task.$error).toEqual(jasmine.any(Function));
          expect(task.$complete).toEqual(jasmine.any(Function));
        });

        it('should return the observer functions', function() {
          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var storage = $firebaseStorage(ref);
          var task = null;
          spyOn(ref, 'put');
          task = storage.$put(file);
          expect(task.$progress).toEqual(jasmine.any(Function));
          expect(task.$error).toEqual(jasmine.any(Function));
          expect(task.$complete).toEqual(jasmine.any(Function));          
        });

      });

      describe('_$getDownloadURL', function() {
        it('should call a storage ref getDownloadURL', function (done) {
          var ref = firebase.storage().ref('thing');
          var testUrl = 'https://google.com/';
          var storage = $firebaseStorage(ref);
          var fakePromise = $q(function(resolve, reject) {
            resolve(testUrl);
            reject(null);
          });
          var testPromise = null;
          spyOn(ref, 'getDownloadURL').and.returnValue(fakePromise);
          testPromise = storage.$getDownloadURL();
          testPromise.then(function(resolvedUrl) {
            expect(resolvedUrl).toEqual(testUrl)
            done();
          });
          $rootScope.$apply();
        });

      });

      describe('_isStorageRef', function() {
        
        it('should determine a storage ref', function() {
          var ref = firebase.storage().ref('thing');
          var isTrue = $firebaseStorage.utils._isStorageRef(ref);
          var isFalse = $firebaseStorage.utils._isStorageRef(true);
          expect(isTrue).toEqual(true);
          expect(isFalse).toEqual(false);
        });

      });

      describe('_assertStorageRef', function() {
        it('should not throw an error if a storage ref is passed', function() {
          var ref = firebase.storage().ref('thing');
          function errorWrapper() {
            $firebaseStorage.utils._assertStorageRef(ref);
          }
          expect(errorWrapper).not.toThrow();
        }); 

        it('should throw an error if a storage ref is passed', function() {
          function errorWrapper() {
            $firebaseStorage.utils._assertStorageRef(null);
          }
          expect(errorWrapper).toThrow();
        });        
      });

    });

  });
});
