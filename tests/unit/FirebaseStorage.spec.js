'use strict';
describe('$firebaseStorage', function () {
  var $firebaseStorage;
  var URL = 'https://oss-test.firebaseio.com';

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

        function setupPutTests(file, mockTask) {
          var ref = firebase.storage().ref('thing');
          var task = null;
          var digestFn = $firebaseUtils.compile;
          // If a MockTask is provided use it as the
          // return value of the spy on put
          if (mockTask) {
            spyOn(ref, 'put').and.returnValue(mockTask);
          } else {
            spyOn(ref, 'put');
          }
          task = $firebaseStorage.utils._$put(ref, file, digestFn);
          return {
            ref: ref,
            task: task,
            digestFn: digestFn
          };
        }

        it('should call a storage ref put', function () {
          var mockTask = new MockTask();
          var setup = setupPutTests('file', mockTask);
          var ref = setup.ref;
          expect(ref.put).toHaveBeenCalledWith('file');
        });

        it('should return the observer functions', function () {
          var mockTask = new MockTask();
          var setup = setupPutTests('file', mockTask);
          var task = setup.task;
          expect(task.$progress).toEqual(jasmine.any(Function));
          expect(task.$error).toEqual(jasmine.any(Function));
          expect(task.$complete).toEqual(jasmine.any(Function));
        });

        it('should return a promise with then and catch', function() {
          var mockTask = new MockTask();
          var setup = setupPutTests('file', mockTask);
          var task = setup.task;
          expect(task.then).toEqual(jasmine.any(Function));
          expect(task.catch).toEqual(jasmine.any(Function));
        });

        it('should create a mock task', function() {
          var mockTask = new MockTask();
          var setup = setupPutTests('file', mockTask);
          var task = setup.task;
          expect(task._task).toEqual(mockTask);
        });

        it('$cancel', function() {
          var mockTask = new MockTask();
          spyOn(mockTask, 'cancel');
          var setup = setupPutTests('file', mockTask);
          var task = setup.task;
          task.$cancel();
          expect(mockTask.cancel).toHaveBeenCalled();
        });

        it('$resume', function() {
          var mockTask = new MockTask();
          spyOn(mockTask, 'resume');
          var setup = setupPutTests('file', mockTask);
          var task = setup.task;
          task.$resume();
          expect(mockTask.resume).toHaveBeenCalled();
        });

        it('$pause', function() {
          var mockTask = new MockTask();
          spyOn(mockTask, 'pause')
          var setup = setupPutTests('file', mockTask);
          var task = setup.task;
          task.$pause();
          expect(mockTask.pause).toHaveBeenCalled();
        });

        it('then', function() {
          var mockTask = new MockTask();
          spyOn(mockTask, 'then');
          var setup = setupPutTests('file', mockTask);
          var task = setup.task;
          task.then();
          expect(mockTask.then).toHaveBeenCalled();
        });

        it('catch', function() {
          var mockTask = new MockTask();
          spyOn(mockTask, 'catch');
          var setup = setupPutTests('file', mockTask);
          var task = setup.task;
          task.catch();
          expect(mockTask.catch).toHaveBeenCalled();
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
          storage.$put('file'); // don't ever call this with a string IRL
          expect($firebaseStorage.utils._$put).toHaveBeenCalledWith(ref, 'file', $firebaseUtils.compile);
        })

      });

      describe('$getDownloadURL', function() {
        it('should call the ref getDownloadURL method', function() {
          var ref = firebase.storage().ref('thing');
          var storage = $firebaseStorage(ref);
          spyOn(ref, 'getDownloadURL');
          storage.$getDownloadURL();
          expect(ref.getDownloadURL).toHaveBeenCalled();
        });
      });

      describe('$delete', function() {
        it('should call the storage ref delete method', function() {
          // test that $firebaseStorage.$delete() calls storageRef.delete()
          var ref = firebase.storage().ref('thing');
          var storage = $firebaseStorage(ref);
          var fakePromise = $q(function(resolve, reject) {
            resolve();
          });
          spyOn(ref, 'delete');
          storage.$delete();
          expect(ref.delete).toHaveBeenCalled();
        });
      });

      describe('$getMetadata', function() {
        it('should call ref getMetadata', function() {
          var ref = firebase.storage().ref('thing');
          var storage = $firebaseStorage(ref);
          spyOn(ref, 'getMetadata');
          storage.$getMetadata();
          expect(ref.getMetadata).toHaveBeenCalled();
        });
      });

      describe('$updateMetadata', function() {
        it('should call ref updateMetadata', function() {
          var ref = firebase.storage().ref('thing');
          var storage = $firebaseStorage(ref);
          spyOn(ref, 'updateMetadata');
          storage.$updateMetadata();
          expect(ref.updateMetadata).toHaveBeenCalled();
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
