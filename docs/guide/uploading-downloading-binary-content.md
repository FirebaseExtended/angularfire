# Uploading & Downloading Binary Content | AngularFire Guide

## Table of Contents

* [Overview](#overview)
* [API Summary](#api-summary)
* [Uploading files](#uploading-files)
* [Displaying images with the `firebase-src` directive](#displaying-images-with-the-firebase-src-directive)
* [Retrieving files from the template](retrieving-files-from-the-template)
* [Plnkr demo]()

## Overview

Firebase provides [a hosted binary storage service](https://firebase.google.com/docs/storage/)
which enables you to store and retrieve user-generated content like images, audio and
video directly from the Firebase client SDK.

Binary files are stored in a Firebase Storage bucket, not in the Realtime Database.
The file files in your bucket are stored in a hierarchical structure, just like
in the Realtime Database.

To use the Firebase Storage binding, first [create a Firebase Storage reference](https://firebase.google.com/docs/storage/web/create-reference).
Then using this reference, pass it into the `$firebaseStorage` service.

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
  var storageRef = firebase.storage().ref('userProfiles/physicsmarie');
  var storage = $firebaseStorage(storageRef);
}
SampleCtrl.$inject = ["$firebaseStorage"];
```

## API Summary

The Firebase Storage service is created with several special $ methods, all of which are listed in the following table:

| Method  | Description |
| ------------- | ------------- |
| [`$put(file, metadata)`](/docs/reference.md#put) |	Uploads file to configured path with optional metadata. Returns an AngularFire wrapped UploadTask. |
| [`$putString(string, format, metadata)`](/docs/reference.md#putstring)	| Uploads a upload a raw, base64, or base64url encoded string with optional metadata. Returns an AngularFire wrapped UploadTask. |
| [`$getDownloadURL()`](/docs/reference.md#getdownloadurl) |	Returns a promise of the download URL for the file stored at the configured path. |
| [`$getMetadata()`](/docs/reference.md#getmetadata) | Returns a promise of the metadata of the file stored at the configured path. |
| [`$updateMetadata(metadata)`](/docs/reference.md#updatemetadata) | Updates the metadata of the file stored at the configured path. Returns a promise containing the complete metadata or en error. |
| [`$delete()`](/docs/reference.md#delete) | Permanently deletes the file stored at the configured path. Returns a promise that is resolved when the delete completes. |
| [`$toString()`](/docs/reference.md#tostring) | Returns a string version of the bucket path stored as a `gs://` scheme. |


## Uploading files
To upload files use either the `$put()` or `$putString()` methods. These methods
return an `UploadTask` which is wrapped by AngularFire to handle the `$digest` loop.

```js
function SampleCtrl($firebaseStorage) {
  // create a Firebase Storage Reference for the $firebaseStorage binding
  var storageRef = firebase.storage().ref('userProfiles/physicsmarie');
  var storage = $firebaseStorage(storageRef);
  var file = // get a file from the template (see Retrieving files from template section below)
  var uploadTask = storage.$put(file);
  // of upload via a RAW, base64, or base64url string
  var stringUploadTask = storage.$putString('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');
}
SampleCtrl.$inject = ["$firebaseStorage"];
```

### Upload Task API Summary

| Method  | Description |
| ------------- | ------------- |
| [`$progress(callback)`](/docs/reference.md#uploadtask-progress) |	Calls the provided callback function whenever there is an update in the progress of the file uploading. |
| [`$error(callback)`](/docs/reference.md#uploadtask-error)	| Calls the provided callback function when there is an error uploading the file |
| [`$complete(callback)`](/docs/reference.md#uploadtask-complete) |	Calls the provided callback function when the upload is complete. |
| [`$cancel()`](/docs/reference.md#uploadtask-cancel) | Cancels the upload in progress. |
| [`$pause()`](/docs/reference.md#uploadtask-pause) | Pauses the upload in progress. |
| [`$snapshot()`](/docs/reference.md#uploadtask-$snapshot) | Returns the [current immutable view of the task](https://firebase.google.com/docs/storage/web/upload-files#monitor_upload_progress) at the time the event occurred. |
| [`then(callback)`](/docs/reference.md#uploadtask-then) | An Upload Task implements a promise like interface. This method is called when the upload is complete. |
| [`catch(callback)`](/docs/reference.md#uploadtask-then) | An Upload Task implements a promise like interface. This method is called when an error occurs. |

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