# Beyond AngularFire | AngularFire Guide

## Table of Contents

* [Overview](#overview)
* [Best Practices](#best-practices)
* [Deploying Your App](#deploying-your-app)
* [Next Steps](#next-steps)


## Overview

AngularFire greatly simplifies bindings and abstracts a lot of the internal workings of Angular,
such as how to notify the compiler when changes occur. However, it does not attempt to replicate
the entire Firebase client library's API.

There are plenty of use cases for dropping down to the SDK level and using it directly. This
section will cover a few best practices and techniques for grabbing data directly from our
database using the JavaScript client library.

This is easiest to accomplish with an example, so read the comments carefully.

```js
app.controller("SampleCtrl", ["$scope", "$timeout", function($scope, $timeout) {
  // create a reference to our Firebase database
  var ref = firebase.database().ref();

  // read data from the database into a local scope variable
  ref.on("value", function(snapshot) {
    // Since this event will occur outside Angular's $apply scope, we need to notify Angular
    // each time there is an update. This can be done using $scope.$apply or $timeout. We
    // prefer to use $timeout as it a) does not throw errors and b) ensures all levels of the
    // scope hierarchy are refreshed (necessary for some directives to see the changes)
    $timeout(function() {
      $scope.data = snapshot.val();
    });
  });
}]);
```

Synchronizing simple data like this is trivial. When we start operating on synchronized arrays
and dealing with bindings, things get a little more interesting. For a comparison of the
bare-bones work needed to synchronize an array, examine
[a naive comparison of AngularFire versus the vanilla Firebase client library](https://gist.github.com/katowulf/a8466f4d66a4cea7af7c), and look at
[Firebase.getAsArray()](https://github.com/katowulf/Firebase.getAsArray) for a more
fully functional synchronized array implementation and the work involved.


## Best Practices

When using the vanilla Firebase client library with Angular, it is best to keep the following things
in mind:

* **Wrap events in `$timeout()`**: Wrap all server notifications in
`$timeout()` to ensure the Angular compiler is notified of changes.
* **Use `$window.Firebase`**: This allows test units and end-to-end
tests to spy on the Firebase client library and replace it with mock functions. It also avoids the linter warnings about
globals.


## Deploying Your App

Once you are done building your application, you'll need a way to share it with the world. To
deploy your Angular applications free, fast, and without fuss, do it Firebase style! Our
production-grade hosting service serves your content over HTTPS and is backed by a global CDN.
You can deploy your application for free at your very own subdomain of `firebaseapp.com`
or you can host it at any custom domain on one of our paid plans. Check out
[Firebase Hosting](https://firebase.google.com/docs/hosting/) for more information.


## Next Steps

There are many additional resources for learning about using Firebase with Angular applications:

* Browse the [AngularFire API reference](/docs/reference.md).
* The [`angularfire-seed`](https://github.com/firebase/angularfire-seed) repo contains a template
project to help you get started.
* Check out the [various examples that use AngularFire](/README.md#examples).
* Join our [Firebase mailing list](https://groups.google.com/forum/#!forum/firebase-talk) to
keep up to date with any announcements and learn from the AngularFire community.
* The [`angularfire` tag on Stack Overflow](http://stackoverflow.com/questions/tagged/angularfire)
has answers to a lot of code-related questions.
