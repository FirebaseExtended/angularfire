(function() {
  "use strict";

  /**
   * Take an UploadTask and create an interface for the user to monitor the
   * file's upload. The $progress, $error, and $complete methods are provided
   * to work with the $digest cycle.
   *
   * @param task
   * @param $firebaseUtils
   * @returns A converted task, which contains methods for monitoring the
   * upload progress.
   */
  function _convertTask(task, $firebaseUtils) {
    return {
      $progress: function $progress(callback) {
        task.on('state_changed', function () {
          $firebaseUtils.compile(function () {
            callback(_unwrapStorageSnapshot(task.snapshot));
          });
        });
      },
      $error: function $error(callback) {
        task.on('state_changed', null, function (err) {
          $firebaseUtils.compile(function () {
            callback(err);
          });
        });
      },
      $complete: function $complete(callback) {
        task.on('state_changed', null, null, function () {
          $firebaseUtils.compile(function () {
            callback(_unwrapStorageSnapshot(task.snapshot));
          });
        });
      },
      $cancel: task.cancel,
      $resume: task.resume,
      $pause: task.pause,
      then: task.then,
      catch: task.catch,
      $snapshot: task.snapshot
    };
  }

  /**
   * Take a Storage snapshot and unwrap only the needed properties.
   *
   * @param snapshot
   * @returns An object containing the unwrapped values.
   */
  function _unwrapStorageSnapshot(storageSnapshot) {
    return {
      bytesTransferred: storageSnapshot.bytesTransferred,
      downloadURL: storageSnapshot.downloadURL,
      metadata: storageSnapshot.metadata,
      ref: storageSnapshot.ref,
      state: storageSnapshot.state,
      task: storageSnapshot.task,
      totalBytes: storageSnapshot.totalBytes
    };
  }

  /**
   * Determines if the value passed in is a Storage Reference. The
   * put method is used for the check.
   *
   * @param value
   * @returns A boolean that indicates if the value is a Storage Reference.
   */
  function _isStorageRef(value) {
    value = value || {};
    return typeof value.put === 'function';
  }

  /**
   * Checks if the parameter is a Storage Reference, and throws an
   * error if it is not.
   *
   * @param storageRef
   */
  function _assertStorageRef(storageRef) {
    if (!_isStorageRef(storageRef)) {
      throw new Error('$firebaseStorage expects a Storage reference');
    }
  }

  /**
   * This constructor should probably never be called manually. It is setup
   * for dependecy injection of the $firebaseUtils and $q service.
   *
   * @param {Object} $firebaseUtils
   * @param {Object} $q
   * @returns {Object}
   * @constructor
   */
  function FirebaseStorage($firebaseUtils, $q) {

    /**
     * This inner constructor `Storage` allows for exporting of private methods
     * like _assertStorageRef, _isStorageRef, _convertTask, and _unwrapStorageSnapshot.
     */
    var Storage = function Storage(storageRef) {
      _assertStorageRef(storageRef);
      return {
        $put: function $put(file, metadata) {
          var task = storageRef.put(file, metadata);
          return _convertTask(task, $firebaseUtils);
        },
        $putString: function $putString(data, format, metadata) {
          var task = storageRef.putString(data, format, metadata);
          return _convertTask(task, $firebaseUtils);
        },
        $getDownloadURL: function $getDownloadURL() {
          return $q.when(storageRef.getDownloadURL());
        },
        $delete: function $delete() {
          return $q.when(storageRef.delete());
        },
        $getMetadata: function $getMetadata() {
          return $q.when(storageRef.getMetadata());
        },
        $updateMetadata: function $updateMetadata(object) {
          return $q.when(storageRef.updateMetadata(object));
        },
        $toString: function $toString() {
          return storageRef.toString();
        }
      };
    };

    Storage.utils = {
      _unwrapStorageSnapshot: _unwrapStorageSnapshot,
      _isStorageRef: _isStorageRef,
      _assertStorageRef: _assertStorageRef
    };

    return Storage;
  }

  /**
   * Creates a wrapper for the firebase.storage() object. This factory allows
   * you to upload files and monitor their progress and the callbacks are
   * wrapped in the $digest cycle.
   */
  angular.module('firebase.storage')
    .factory('$firebaseStorage', ["$firebaseUtils", "$q", FirebaseStorage]);

})();
