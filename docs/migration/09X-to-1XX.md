# Migrating from AngularFire `0.9.x` to `1.x.x`

This migration guide will walk through some of the major breaking changes with code samples and
guidance to upgrade your existing application from AngularFire version `0.9.x` to `1.x.x`.


## Removal of `$firebase`

The largest breaking change in AngularFire `1.0.0` is the removal of the `$firebase` service. The
service did not provide any capabilities beyond what already existed in the vanilla Firebase SDK.
However, sometimes you do need to quickly write data from your database without first going through
the process of creating a synchronized array or object. Let's walk through some examples of
migrating away from the now defunct `$firebase` service.

To write data to your database, we should now use the Firebase SDK's `set()` method instead of the
removed `$set()` method.

### AngularFire `0.9.X`
```js
app.controller("SampleCtrl", ["$scope", "$firebase",
  function($scope, $firebase) {
    var profileRef = new Firebase("https://<YOUR-FIREBASE-APP>.firebaseio.com/profiles/annie");
    var profileSync = $firebase(profileRef);
    profileSync.$set({ age: 24, gender: "female" }).then(function() {
      console.log("Profile set successfully!");
    }).catch(function(error) {
      console.log("Error:", error);
    });
  }
]);
```

### AngularFire `1.X.X`
```js
app.controller("SampleCtrl", ["$scope",
  function($scope) {
    var profileRef = new Firebase("https://<YOUR-FIREBASE-APP>.firebaseio.com/profiles/annie");
    profileRef.set({ age: 24, gender: "female" }, function(error) {
      if (error) {
        console.log("Error:", error);
      } else {
        console.log("Profile set successfully!");
      }
    });
  }
]);
```

We should similarly use the Firebase SDK's `remove()` method to easily replace the `$remove()`
method provided by the `$firebase` service.

### AngularFire `0.9.X`
```js
app.controller("SampleCtrl", ["$scope", "$firebase",
  function($scope, $firebase) {
    var profileRef = new Firebase("https://<YOUR-FIREBASE-APP>.firebaseio.com/profiles/bobby");
    var profileSync = $firebase(profileRef);
    profileSync.$remove().then(function() {
      console.log("Set successful!");
    }).catch(function(error) {
      console.log("Error:", error);
    });
  }
]);
```

### AngularFire `1.X.X`
```js
app.controller("SampleCtrl", ["$scope",
  function($scope) {
    var profileRef = new Firebase("https://<YOUR-FIREBASE-APP>.firebaseio.com/profiles/bobby");
    profileRef.remove(function(error) {
      if (error) {
        console.log("Error:", error);
      } else {
        console.log("Profile removed successfully!");
      }
    });
  }
]);
```

Replacements for the `$asArray()` and `$asObject()` methods are given below.


## Replacement of `$asObject()` with `$firebaseObject`

Due to the removal of `$firebase`, the process of creating an instance of a synchronized object has
changed. Instead of creating an instance of the `$firebase` service and calling its `$asObject()`
method, use the renamed `$firebaseObject` service directly.

### AngularFire `0.9.X`
```js
app.controller("SampleCtrl", ["$scope", "$firebase",
  function($scope, $firebase) {
    var ref = new Firebase("https://<YOUR-FIREBASE-APP>.firebaseio.com");
    var sync = $firebase(ref);
    var obj = sync.$asObject();
  }
]);
```

### AngularFire `1.X.X`
```js
// Inject $firebaseObject instead of $firebase
app.controller("SampleCtrl", ["$scope", "$firebaseObject",
  function($scope, $firebaseObject) {
    var ref = new Firebase("https://<YOUR-FIREBASE-APP>.firebaseio.com");
    // Pass the Firebase reference to $firebaseObject directly
    var obj = $firebaseObject(ref);
  }
]);
```

## Replacement of `$asArray()` with `$firebaseArray`

Due to the removal of `$firebase`, the process of creating an instance of a synchronized array has
changed. Instead of creating an instance of the `$firebase` service and calling its `$asArray()`
method, use the renamed `$firebaseArray` service directly.

### AngularFire `0.9.X`
```js
app.controller("SampleCtrl", ["$scope", "$firebase",
  function($scope, $firebase) {
    var ref = new Firebase("https://<YOUR-FIREBASE-APP>.firebaseio.com");
    var sync = $firebase(ref);
    var list = sync.$asArray();
  }
]);
```

### AngularFire `1.X.X`
```js
// Inject $firebaseArray instead of $firebase
app.controller("SampleCtrl", ["$scope", "$firebaseArray",
  function($scope, $firebaseArray) {
    var ref = new Firebase("https://<YOUR-FIREBASE-APP>.firebaseio.com");
    // Pass the Firebase reference to $firebaseArray
    var list = $firebaseArray(ref);
  }
]);
```


## Replacement of `$inst()` with `$ref()`

Due to the removal of `$firebase`, the `$inst()` methods off of the old `$FirebaseObject` and
`$FirebaseArray` factories were no longer meaningful. They have been replaced with `$ref()` methods
off of the new `$firebaseObject` and `$firebaseArray` services which return the underlying
`Firebase` reference used to instantiate an instance of the services.

### AngularFire `0.9.X`
```js
// $FirebaseObject
var objSync = $firebase(ref);
var obj = sync.$asObject();
objSync === obj.$inst();  // true
// $FirebaseArray
var listSync = $firebase(ref);
var list = sync.$asArray();
listSync === list.$inst();  // true
```

### AngularFire `1.X.X`
```js
// $firebaseObject
var obj = $firebaseObject(ref);
obj.$ref() === ref;  // true
// $firebaseArray
var list = $firebaseArray(ref);
list.$ref() === ref;  // true
```


## Changes to argument lists for user management methods

The previously deprecated ability to pass in credentials to the user management methods of
`$firebaseAuth` as individual arguments has been removed in favor of a single credentials argument

### AngularFire `0.9.X`
```js
var auth = $firebaseAuth(ref);
auth.$changePassword("foo@bar.com", "somepassword", "otherpassword").then(function() {
  console.log("Password changed successfully!");
}).catch(function(error) {
  console.error("Error: ", error);
});
```

### AngularFire `1.X.X`
```js
var auth = $firebaseAuth(ref);
auth.$changePassword({
  email: "foo@bar.com",
  oldPassword: "somepassword",
  newPassword: "otherpassword"
}).then(function() {
  console.log("Password changed successfully!");
}).catch(function(error) {
  console.error("Error: ", error);
});
```


## Replacement of `$sendPasswordResetEmail()` with `$resetPassword()`

The `$sendPasswordResetEmail()` method has been removed in favor of the functionally equivalent
`$resetPassword()` method.

### AngularFire `0.9.X`
```js
var auth = $firebaseAuth(ref);
auth.$sendPasswordResetEmail("foo@bar.com").then(function() {
  console.log("Password reset email sent successfully!");
}).catch(function(error) {
  console.error("Error: ", error);
});
```

### AngularFire `1.X.X`
```js
var auth = $firebaseAuth(ref);
auth.$resetPassword("foo@bar.com").then(function() {
  console.log("Password reset email sent successfully!");
}).catch(function(error) {
  console.error("Error: ", error);
});
```
