(function() {
  "use strict";

  function unwrapStorageSnapshot(storageSnapshot) {
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

  function isStorageRef(value) {
    value = value || {};
    return typeof value.put === 'function';
  }

  function _assertStorageRef(storageRef) {
    if (!isStorageRef(storageRef)) {
      throw new Error('$firebaseStorage expects a Storage reference');
    }
  }

  function FirebaseStorage($firebaseUtils, $q) {

    var Storage = function Storage(storageRef) {
      _assertStorageRef(storageRef);
      return {
        $put: function $put(file) {
          var task = storageRef.put(file);

          return {
            $progress: function $progress(callback) {
              task.on('state_changed', function () {
                $firebaseUtils.compile(function () {
                  callback(unwrapStorageSnapshot(task.snapshot));
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
                  callback(unwrapStorageSnapshot(task.snapshot));
                });
              });
            },
            $cancel: task.cancel,
            $resume: task.resume,
            $pause: task.pause,
            then: task.then,
            catch: task.catch,
            _task: task
          };
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
        }
      };
    };

    Storage.utils = {
      _unwrapStorageSnapshot: unwrapStorageSnapshot,
      _isStorageRef: isStorageRef,
      _assertStorageRef: _assertStorageRef
    };

    return Storage;
  }

  angular.module('firebase.storage')
    .factory('$firebaseStorage', ["$firebaseUtils", "$q", FirebaseStorage]);

})();
