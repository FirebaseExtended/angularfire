# Uploading & Downloading Binary Content | AngularFire Guide

## Table of Contents

* [Overview](#overview)
* [API Summary](#api-summary)
* [Uploading files](#uploading-files)
* [Displaying images with the `firebase-src` directive](#displaying-images-with-the-firebase-src-directive)
* [Retrieving files from the template](#retrieving-files-from-the-template)

## Overview

Firebase provides [a hosted binary storage service](https://firebase.google.com/docs/storage/)
which enables you to store and retrieve user-generated content like images, audio, and
video directly from the Firebase client SDK.

Binary files are stored in a Firebase Storage bucket, not in the Realtime Database.
The files in your bucket are stored in a hierarchical structure, just like
in the Realtime Database.

To use the Firebase Storage binding, first [create a Firebase Storage reference](https://firebase.google.com/docs/storage/web/create-reference).
Then, using this reference, pass it into the `$firebaseStorage` service:

```js
// define our app and dependencies (remember to include firebase!)
angular
  .module("sampleApp", [
    "firebase"
  ])
  .controller("SampleCtrl", SampleCtrl);

// inject $firebaseStorage into our controller
function SampleCtrl($firebaseStorage) {
  // create a Firebase Storage Reference for the $firebaseStorage binding
  var storageRef = firebase.storage().ref("userProfiles/physicsmarie");
  var storage = $firebaseStorage(storageRef);
}
SampleCtrl.$inject = ["$firebaseStorage"];
```

## API Summary

The Firebase Storage service is created with several special `$` methods, all of which are listed in the following table:

| Method  | Description |
| ------------- | ------------- |
| [`$put(file, metadata)`](/docs/reference.md#putfile-metadata) |	Uploads file to configured path with optional metadata. Returns an AngularFire wrapped `UploadTask`. |
| [`$putString(string, format, metadata)`](/docs/reference.md#putstringstring-format-metadata)	| Uploads a upload a raw, base64, or base64url encoded string with optional metadata. Returns an AngularFire wrapped `UploadTask`. |
| [`$getDownloadURL()`](/docs/reference.md#getdownloadurl) |	Returns a `Promise` fulfilled with the download URL for the file stored at the configured path. |
| [`$getMetadata()`](/docs/reference.md#getmetadata) | Returns a `Promise` fulfilled with the metadata of the file stored at the configured path. |
| [`$updateMetadata(metadata)`](/docs/reference.md#updatemetadatametadata) | Returns a `Promise` containing the updated metadata. |
| [`$delete()`](/docs/reference.md#delete) | Permanently deletes the file stored at the configured path. Returns a `Promise` that is resolved when the delete completes. |
| [`$toString()`](/docs/reference.md#tostring) | Returns a string version of the bucket path stored as a `gs://` scheme. |


## Uploading files
To upload files, use either the `$put()` or `$putString()` methods. These methods
return an [`UploadTask`](https://firebase.google.com/docs/reference/js/firebase.storage#uploadtask) which is wrapped by AngularFire to handle the `$digest` loop.

```js
function SampleCtrl($firebaseStorage) {
  // create a Firebase Storage Reference for the $firebaseStorage binding
  var storageRef = firebase.storage().ref('userProfiles/physicsmarie');
  var storage = $firebaseStorage(storageRef);
  var file = // get a file from the template (see Retrieving files from template section below)
  var uploadTask = storage.$put(file);
  // of upload via a RAW, base64, or base64url string
  var stringUploadTask = storage.$putString('5b6p5Y+344GX44G+44GX44Gf77yB44GK44KB44Gn44Go44GG77yB', 'base64');
}
SampleCtrl.$inject = ["$firebaseStorage"];
```

### Upload Task API Summary

| Method  | Description |
| ------------- | ------------- |
| [`$progress(callback)`](/docs/reference.md#uploadtask-progress) |	Calls the provided callback function whenever there is an update in the progress of the file uploading. |
| [`$error(callback)`](/docs/reference.md#uploadtask-error)	| Calls the provided callback function when there is an error uploading the file |
| [`$complete(callback)`](/docs/reference.md#uploadtask-complete) |	Calls the provided callback function when the upload is complete. |
| [`$cancel()`](/docs/reference.md#uploadtask-cancel) | Cancels the upload. |
| [`$pause()`](/docs/reference.md#uploadtask-pause) | Pauses the upload. |
| [`$snapshot()`](/docs/reference.md#uploadtask-$snapshot) | Returns the [current immutable view of the task](https://firebase.google.com/docs/storage/web/upload-files#monitor_upload_progress) at the time the event occurred. |
| [`then(callback)`](/docs/reference.md#uploadtask-then) | An Upload Task implements a promise like interface. The callback is called when the upload is complete. |
| [`catch(callback)`](/docs/reference.md#uploadtask-then) | An Upload Task implements a promise like interface. The callback is called when an error occurs. |

## Displaying images with the `firebase-src` directive
AngularFire provides a directive that displays a file with any `src` compatible element.

Instead of using the tradional `src` attribute, use `firebase-src`:

```html
<img firebase-src="userProfiles/physicsmarie" />
<!-- Works with bindings as well -->
<img firebase-src="{{ userProfileId }}" />
```

## Retrieving files from the template
AngularFire does not provide a directive for retrieving a upload file. However,
the below directive is basic but provides a baseline to work off.

```js
angular
  .module("sampleApp", [
    "firebase"
  ])
  .directive("fileUpload", FileUploadDirective);

function FileUploadDirective() {
  return {
    restrict: "E",
    transclude: true,
    scope: {
      onChange: "="
    },
    template: "<input type="file" name="file" class="inputfile" /><label><ng-transclude></ng-transclude></label>",
    link: function (scope, element, attrs) {
      element.bind("change", function () {
        scope.onChange(element.children()[0].files);
      });
    }
  }
}
```

To use this directive, create a controller to bind the `onChange` method.

```js
function UploadCtrl($firebaseStorage) {
  var ctrl = this;
  var storageRef = firebase.storage().ref('userProfiles/physicsmarie');
  var storage = $firebaseStorage(storageRef);
  ctrl.fileToUpload = null;
  ctrl.onChange = function onChange(fileList) {
    ctrl.fileToUpload = fileList[0];
  };
}
```

Then specify your template to use the directive.

```html
<div ng-controller="UploadCtrl as $ctrl">
  <file-upload on-change="$ctrl.onChange">
    Upload
  </file-upload>
</div>
```