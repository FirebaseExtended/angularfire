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

    function setupPutTests(fileOrRawString, mockTask, isPutString) {
      var ref = firebase.storage().ref('thing');
      var task = null;
      var storage = $firebaseStorage(ref);
      var putMethod = isPutString ? 'putString': 'put';
      var metadata = {
        contentType: 'image/jpeg'
      };
      // If a MockTask is provided use it as the
      // return value of the spy on put
      if (mockTask) {
        spyOn(ref, putMethod).and.returnValue(mockTask);
      } else {
        spyOn(ref, putMethod);
      }
      if(isPutString) {
        task = storage.$putString(fileOrRawString, 'raw', metadata);
      } else {
        task = storage.$put(fileOrRawString, metadata);
      }
      return {
        ref: ref,
        task: task
      };
    }

    function setupPutStringTests(rawString, mockTask) {
      return setupPutTests(rawString, mockTask, true);
    }

    it('should exist', inject(function () {
      expect($firebaseStorage).not.toBe(null);
    }));

    it('should create an instance', function () {
      var ref = firebase.storage().ref('thing');
      var storage = $firebaseStorage(ref);
      expect(storage).not.toBe(null);
    });

    it('should throw error given a non-reference', function() {
      function errorWrapper() {
        var storage = $firebaseStorage(null);
      }
      expect(errorWrapper).toThrow();
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
            totalBytes: 0,
            randomAttr: 'rando', // gets removed
            anotherRando: 'woooo' // gets removed
          };
          var unwrapped = $firebaseStorage.utils._unwrapStorageSnapshot(mockSnapshot);
          expect(unwrapped).toEqual({
            bytesTransferred: 0,
            downloadURL: 'url',
            metadata: {},
            ref: {},
            state: {},
            task: {},
            totalBytes: 0
          });
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

        it('should call a storage ref put', function () {
          var mockTask = new MockTask();
          var setup = setupPutTests('file', mockTask);
          var ref = setup.ref;
          expect(ref.put).toHaveBeenCalledWith('file', {
            contentType: 'image/jpeg'
          });
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

        it('$snapshot', function() {
          var mockTask = new MockTask();
          var setup = null;
          var task = null;
          mockTask.on('', null, null, function() {});
          mockTask.complete();
          setup = setupPutTests('file', mockTask);
          task = setup.task;
          expect(mockTask.snapshot).toEqual(task.$snapshot);
        });

      });

      describe('$putString', function() {
        it('should call a storage ref putString', function () {
          var mockTask = new MockTask();
          var setup = setupPutStringTests('string data', mockTask);
          var ref = setup.ref;
          expect(ref.putString).toHaveBeenCalledWith('string data', 'raw', {
            contentType: 'image/jpeg'
          });
        });
      });

      describe('$toString', function() {
        it('should call a storage ref to string', function() {
          var ref = firebase.storage().ref('myfile');
          var storage = $firebaseStorage(ref);
          spyOn(ref, 'toString');
          storage.$toString();
          expect(ref.toString).toHaveBeenCalled();
        });

        it('should return the proper gs:// URL', function() {
          var ref = firebase.storage().ref('myfile');
          var storage = $firebaseStorage(ref);
          var stringValue = storage.$toString();
          expect(stringValue).toEqual(ref.toString());
        });
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
          var ref = firebase.storage().ref('thing');
          var storage = $firebaseStorage(ref);
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
 * A Mock for Cloud Storage for Firebase tasks. It has the same .on() method signature
 * but it simply stores the callbacks without doing anything. To make something
 * happen you call the makeProgress(), causeError(), or complete() methods. The
 * empty methods are intentional noops.
 */
var MockTask = (function () {
  function MockTask() {
    this.snapshot = null;
  }
  MockTask.prototype.on = function (event, successCallback, errorCallback, completionCallback) {
    this.event = event;
    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    this.completionCallback = completionCallback;
  };
  MockTask.prototype.makeProgress = function () {
    this.snapshot = {};
    this.successCallback();
  };
  MockTask.prototype.causeError = function () {
    this.errorCallback();
  };
  MockTask.prototype.complete = function () {
    this.snapshot = {};
    this.completionCallback();
  };
  MockTask.prototype.cancel = function () { };
  MockTask.prototype.resume = function () { };
  MockTask.prototype.pause = function () { };
  MockTask.prototype.then = function () { };
  MockTask.prototype.catch = function () { };
  return MockTask;
} ());
