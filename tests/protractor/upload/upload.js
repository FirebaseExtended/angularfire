var app = angular.module('upload', ['firebase.storage']);

app.controller('UploadCtrl', function Upload($scope, $firebaseStorage, $timeout) {
  // Create a reference
  const storageRef = firebase.storage().ref('user/1.png');
  // Create the storage binding
  const storageFire = $firebaseStorage(storageRef);

  var file;

  $scope.select = function (event) {
    file = event.files[0];
  }

  $scope.upload = function() {
    $scope.metadata = {bytesTransferred: 0, totalBytes: 1};
    $scope.error = null;

    // upload the file
    $scope.task = storageFire.$put(file);

    // pause, wait, then resume.
    $scope.task.$pause();
    setTimeout(() => {
      $scope.task.$resume();
    }, 500);

    // monitor progress state
    $scope.task.$progress(metadata => {
      if (metadata.state === 'running') {
        $scope.isCanceled = false;
        $scope.isUploading = true;
      }

      $scope.metadata = metadata;
    });
    // log a possible error
    $scope.task.$error(error => {
      $scope.error = error;
    });
    // log when the upload completes
    $scope.task.$complete(metadata => {
      $scope.isUploading = false;
      $scope.metadata = metadata;
    });

    $scope.task.then(snapshot => {
      $scope.snapshot = snapshot;
    });

    $scope.task.catch(error => {
      $scope.error = error;
    });

  }

  $scope.cancel = function() {
    if ($scope.task && $scope.task.$cancel()) {
      $scope.isCanceled = true;
      $scope.isUploading = false;
    }
  }

});
