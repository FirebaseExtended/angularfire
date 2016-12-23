'use strict';
describe('$firebaseStorage', function () {
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

    describe('$firebaseStorage.utils', function () {

      describe('_unwrapStorageSnapshot', function () {

        it('should unwrap the snapshot', function () {
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

      describe('_$put', function () {

        it('should call a storage ref put', function () {
          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var task = null;
          var digestFn = $firebaseUtils.compile;
          spyOn(ref, 'put');
          task = $firebaseStorage.utils._$put(ref, file, digestFn, $q);
          expect(ref.put).toHaveBeenCalledWith('file');
          expect(task.$progress).toEqual(jasmine.any(Function));
          expect(task.$error).toEqual(jasmine.any(Function));
          expect(task.$complete).toEqual(jasmine.any(Function));
        });

        it('should return the observer functions', function () {
          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var task = null;
          var digestFn = $firebaseUtils.compile;
          spyOn(ref, 'put');
          task = $firebaseStorage.utils._$put(ref, file, digestFn, $q);
          expect(task.$progress).toEqual(jasmine.any(Function));
          expect(task.$error).toEqual(jasmine.any(Function));
          expect(task.$complete).toEqual(jasmine.any(Function));
        });

        it('should return a promise with then and catch', function() {
          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var task = null;
          var digestFn = $firebaseUtils.compile;
          spyOn(ref, 'put');
          task = $firebaseStorage.utils._$put(ref, file, digestFn, $q);
          expect(task.then).toEqual(jasmine.any(Function));
          expect(task.catch).toEqual(jasmine.any(Function));
        });

        it('should create a mock task', function() {
          var mockTask = new MockTask();
          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var $task = null;
          var digestFn = $firebaseUtils.compile;
          spyOn(ref, 'put').and.returnValue(mockTask);
          $task = $firebaseStorage.utils._$put(ref, file, digestFn, $q);
          expect($task._task()).toEqual(mockTask);
        });

        it('$cancel', function() {
          var mockTask = new MockTask();
          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var $task = null;
          var digestFn = $firebaseUtils.compile;
          spyOn(ref, 'put').and.returnValue(mockTask);
          spyOn(mockTask, 'cancel')
          $task = $firebaseStorage.utils._$put(ref, file, digestFn, $q);
          $task.$cancel();
          expect(mockTask.cancel).toHaveBeenCalled();
        });

        it('$resume', function() {
          var mockTask = new MockTask();
          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var $task = null;
          var digestFn = $firebaseUtils.compile;
          spyOn(ref, 'put').and.returnValue(mockTask);
          spyOn(mockTask, 'resume')
          $task = $firebaseStorage.utils._$put(ref, file, digestFn, $q);
          $task.$resume();
          expect(mockTask.resume).toHaveBeenCalled();
        });

        it('$pause', function() {
          var mockTask = new MockTask();
          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var $task = null;
          var digestFn = $firebaseUtils.compile;
          spyOn(ref, 'put').and.returnValue(mockTask);
          spyOn(mockTask, 'pause')
          $task = $firebaseStorage.utils._$put(ref, file, digestFn, $q);
          $task.$pause();
          expect(mockTask.pause).toHaveBeenCalled();
        });

        it('then', function() {
          var mockTask = new MockTask();
          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var $task = null;
          var digestFn = $firebaseUtils.compile;
          spyOn(ref, 'put').and.returnValue(mockTask);
          spyOn(mockTask, 'then')
          $task = $firebaseStorage.utils._$put(ref, file, digestFn, $q);
          $task.then();
          expect(mockTask.then).toHaveBeenCalled();
        });

        it('catch', function() {
          var mockTask = new MockTask();
          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var $task = null;
          var digestFn = $firebaseUtils.compile;
          spyOn(ref, 'put').and.returnValue(mockTask);
          spyOn(mockTask, 'catch')
          $task = $firebaseStorage.utils._$put(ref, file, digestFn, $q);
          $task.catch();
          expect(mockTask.catch).toHaveBeenCalled();
        });

      });

      describe('_$getDownloadURL', function () {
        it('should call a storage ref getDownloadURL', function (done) {
          var ref = firebase.storage().ref('thing');
          var testUrl = 'https://google.com/';
          var storage = $firebaseStorage(ref);
          var promise = $q(function (resolve, reject) {
            resolve(testUrl);
            reject(null);
          });
          var testPromise = null;
          spyOn(ref, 'getDownloadURL').and.returnValue(promise);
          testPromise = $firebaseStorage.utils._$getDownloadURL(ref, $q);
          testPromise.then(function (resolvedUrl) {
            expect(resolvedUrl).toEqual(testUrl)
            done();
          });
          $rootScope.$apply();
        });

      });

      describe('_$delete', function () {

        it('should call a storage ref delete', function (done) {
          var ref = firebase.storage().ref('thing');
          var fakePromise = $q(function (resolve, reject) {
            resolve(null);
            reject(null);
          });
          var testPromise = null;
          var deleted = false;
          spyOn(ref, 'delete').and.returnValue(fakePromise);
          testPromise = $firebaseStorage.utils._$delete(ref, $q);
          testPromise.then(function () {
            deleted = true;
            expect(deleted).toEqual(true);
            done();
          });
          $rootScope.$apply();
        });

      });

      describe('_isStorageRef', function () {

        it('should determine a storage ref', function () {
          var ref = firebase.storage().ref('thing');
          var isTrue = $firebaseStorage.utils._isStorageRef(ref);
          var isFalse = $firebaseStorage.utils._isStorageRef(true);
          expect(isTrue).toEqual(true);
          expect(isFalse).toEqual(false);
        });

      });

      describe('_assertStorageRef', function () {
        it('should not throw an error if a storage ref is passed', function () {
          var ref = firebase.storage().ref('thing');
          function errorWrapper() {
            $firebaseStorage.utils._assertStorageRef(ref);
          }
          expect(errorWrapper).not.toThrow();
        });

        it('should throw an error if a storage ref is passed', function () {
          function errorWrapper() {
            $firebaseStorage.utils._assertStorageRef(null);
          }
          expect(errorWrapper).toThrow();
        });
      });

    });

    describe('$firebaseStorage', function() {

      describe('$put', function() {

        it('should call the _$put method', function() {
          // test that $firebaseStorage.utils._$put is called with
          //  - storageRef, file, $firebaseUtils.compile, $q
          var ref = firebase.storage().ref('thing');
          var storage = $firebaseStorage(ref);
          var fakePromise = $q(function(resolve, reject) {
            resolve('file');
          });
          spyOn(ref, 'put');
          spyOn($firebaseStorage.utils, '_$put').and.returnValue(fakePromise);
          storage.$put('file'); // don't ever call this with a string
          expect($firebaseStorage.utils._$put).toHaveBeenCalledWith(ref, 'file', $firebaseUtils.compile, $q);
        })

      });

      describe('$getDownloadURL', function() {
        it('should call the _$getDownloadURL method', function() {
          // test that $firebaseStorage.utils._$getDownloadURL is called with
          //  - storageRef, $q
          var ref = firebase.storage().ref('thing');
          var storage = $firebaseStorage(ref);
          var fakePromise = $q(function(resolve, reject) {
            resolve('https://google.com');
          });
          spyOn(ref, 'getDownloadURL');
          spyOn($firebaseStorage.utils, '_$getDownloadURL').and.returnValue(fakePromise);
          storage.$getDownloadURL();
          expect($firebaseStorage.utils._$getDownloadURL).toHaveBeenCalledWith(ref, $q);
        });
      });

      describe('$delete', function() {
        it('should call the _$delete method', function() {
          // test that $firebaseStorage.utils._$delete is called with
          //  - storageRef, $q
          var ref = firebase.storage().ref('thing');
          var storage = $firebaseStorage(ref);
          var fakePromise = $q(function(resolve, reject) {
            resolve();
          });
          spyOn(ref, 'delete');
          spyOn($firebaseStorage.utils, '_$delete').and.returnValue(fakePromise);
          storage.$delete();
          expect($firebaseStorage.utils._$delete).toHaveBeenCalledWith(ref, $q);
        });
      });

      describe('$getMetadata', function() {
        it('should call ref getMetadata', function() {
          var ref = firebase.storage().ref('thing');
          var storage = $firebaseStorage(ref);
          var fakePromise = $q(function(resolve, reject) {
            resolve();
          });
          spyOn(ref, 'getMetadata');
          spyOn($firebaseStorage.utils, '_$getMetadata').and.returnValue(fakePromise);
          storage.$getMetadata();
          expect($firebaseStorage.utils._$getMetadata).toHaveBeenCalled();
        });
      });

      describe('$updateMetadata', function() {
        it('should call ref updateMetadata', function() {
          var ref = firebase.storage().ref('thing');
          var storage = $firebaseStorage(ref);
          var fakePromise = $q(function(resolve, reject) {
            resolve();
          });
          var fakeMetadata = {};
          spyOn(ref, 'updateMetadata');
          spyOn($firebaseStorage.utils, '_$updateMetadata').and.returnValue(fakePromise);
          storage.$updateMetadata(fakeMetadata);
          expect($firebaseStorage.utils._$updateMetadata).toHaveBeenCalled();
        });
      });

    });
  });
});

/**
 * A Mock for Firebase Storage Tasks. It has the same .on() method signature
 * but it simply stores the callbacks without doing anything. To make something
 * happen you call the makeProgress(), causeError(), or complete() methods. The
 * empty methods are intentional noops.
 */
var MockTask = (function () {
  function MockTask() {
  }
  MockTask.prototype.on = function (event, successCallback, errorCallback, completionCallback) {
    this.event = event;
    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    this.completionCallback = completionCallback;
  };
  MockTask.prototype.makeProgress = function () {
    this.successCallback();
  };
  MockTask.prototype.causeError = function () {
    this.errorCallback();
  };
  MockTask.prototype.complete = function () {
    this.completionCallback();
  };
  MockTask.prototype.cancel = function () { };
  MockTask.prototype.resume = function () { };
  MockTask.prototype.pause = function () { };
  MockTask.prototype.then = function () { };
  MockTask.prototype.catch = function () { };
  return MockTask;
} ());
