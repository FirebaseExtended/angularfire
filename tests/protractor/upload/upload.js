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
    $scope.isUploading = true;
    $scope.metadata = {bytesTransferred: 0, totalBytes: 1};
    $scope.error = null;

    // upload the file
    const task = storageFire.$put(file);

    // monitor progress state
    task.$progress(metadata => {
      $scope.metadata = metadata;
    });
    // log a possible error
    task.$error(error => {
      $scope.error = error;
    });
    // log when the upload completes
    task.$complete(metadata => {
      $scope.isUploading = false;
      $scope.metadata = metadata;
    });

  }

});
