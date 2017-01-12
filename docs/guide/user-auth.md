# User Auth | AngularFire Guide

## Table of Contents

* [Overview](#overview)
* [Signing Users In](#signing-users-in)
* [Managing Users](#managing-users)
* [Retrieving Authentication State](#retrieving-authentication-state)
* [User-Based Security](#user-based-security)
* [Authenticating With Routers](#authenticating-with-routers)
   - [`ngRoute` Example](#ngroute-example)
   - [`ui-router` Example](#ui-router-example)


## Overview

Firebase provides [a hosted authentication service](https://firebase.google.com/docs/auth/) which
provides a completely client-side solution to user management and authentication. It supports
anonymous authentication, email / password sign in, and sign in via several OAuth providers, including
Facebook, GitHub, Google, and Twitter.

Each provider has to be configured individually and also enabled from the **Auth** tab of
your [Firebase Console](https://console.firebase.google.com). Select a provider from the table below
to learn more.

| Provider | Description |
|----------|-------------|
| [Custom](https://firebase.google.com/docs/auth/web/custom-auth) | Generate your own authentication tokens. Use this to integrate with existing authentication systems. You can also use this to authenticate server-side workers. |
| [Email & Password](https://firebase.google.com/docs/auth/web/password-auth) | Let Firebase manage passwords for you. Register and authenticate users by email & password. |
| [Anonymous](https://firebase.google.com/docs/auth/web/anonymous-auth) | Build user-centric functionality without requiring users to share their personal information. Anonymous authentication generates a unique identifier for each user that lasts as long as their session. |
| [Facebook](https://firebase.google.com/docs/auth/web/facebook-login) | Authenticate users with Facebook by writing only client-side code. |
| [Twitter](https://firebase.google.com/docs/auth/web/twitter-login) |	Authenticate users with Twitter by writing only client-side code. |
| [GitHub](https://firebase.google.com/docs/auth/web/github-auth) |	Authenticate users with GitHub by writing only client-side code. |
| [Google](https://firebase.google.com/docs/auth/web/google-signin) |	Authenticate users with Google by writing only client-side code. |

AngularFire provides a service named `$firebaseAuth` which wraps the authentication methods provided
by the Firebase client library. It can be injected into any controller, service, or factory.

```js
// define our app and dependencies (remember to include firebase!)
var app = angular.module("sampleApp", ["firebase"]);

// inject $firebaseAuth into our controller
app.controller("SampleCtrl", ["$scope", "$firebaseAuth",
  function($scope, $firebaseAuth) {
    var auth = $firebaseAuth();
  }
]);
```


## Signing Users In

The `$firebaseAuth` service has methods for each authentication type. For example, to authenticate
an anonymous user, you can use `$signInAnonymously()`:

```js
var app = angular.module("sampleApp", ["firebase"]);

app.controller("SampleCtrl", ["$scope", "$firebaseAuth",
  function($scope, $firebaseAuth) {
    var auth = $firebaseAuth();

    $scope.signIn = function() {
      $scope.firebaseUser = null;
      $scope.error = null;

      auth.$signInAnonymously().then(function(firebaseUser) {
        $scope.firebaseUser = firebaseUser;
      }).catch(function(error) {
        $scope.error = error;
      });
    };
  }
]);
```

```html
<div ng-app="sampleApp" ng-controller="SampleCtrl">
  <button ng-click="signIn()">Sign In Anonymously</button>

  <p ng-if="firebaseUser">Signed in user: <strong>{{ firebaseUser.uid }}</strong></p>
  <p ng-if="error">Error: <strong>{{ error }}</strong></p>
</div>
```


## Managing Users

The `$firebaseAuth` service also provides [a full suite of methods](/docs/reference.md#firebaseauth)
for managing users. This includes methods for creating and removing users, changing an users's email
or password, and sending email verification and password reset emails. The following example gives
you a taste of just how easy this is:

```js
var app = angular.module("sampleApp", ["firebase"]);

// let's create a re-usable factory that generates the $firebaseAuth instance
app.factory("Auth", ["$firebaseAuth",
  function($firebaseAuth) {
    return $firebaseAuth();
  }
]);

// and use it in our controller
app.controller("SampleCtrl", ["$scope", "Auth",
  function($scope, Auth) {
    $scope.createUser = function() {
      $scope.message = null;
      $scope.error = null;

      // Create a new user
      Auth.$createUserWithEmailAndPassword($scope.email, $scope.password)
        .then(function(firebaseUser) {
          $scope.message = "User created with uid: " + firebaseUser.uid;
        }).catch(function(error) {
          $scope.error = error;
        });
    };

    $scope.deleteUser = function() {
      $scope.message = null;
      $scope.error = null;

      // Delete the currently signed-in user
      Auth.$deleteUser().then(function() {
        $scope.message = "User deleted";
      }).catch(function(error) {
        $scope.error = error;
      });
    };
  }
]);
```

```html
<div ng-app="sampleApp" ng-controller="SampleCtrl">
  Email: <input type="text" ng-model="email">
  Password: <input type="text" ng-model="password">

  <br><br>

  <button ng-click="createUser()">Create User</button>

  <br><br>

  <button ng-click="deleteUser()">Delete User</button>

  <p ng-if="message">Message: <strong>{{ message }}</strong></p>
  <p ng-if="error">Error: <strong>{{ error }}</strong></p>
</div>
```


## Retrieving Authentication State

Whenever a user is authenticated, you can use the synchronous [`$getAuth()`](/docs/reference.md#getauth)
method to retrieve the client's current authentication state. This includes the authenticated user's
`uid` (a user identifier which is unique across all providers), the `providerId` used to
authenticate (e.g. `google.com`, `facebook.com`), as well as other properties
[listed here](https://firebase.google.com/docs/reference/js/firebase.User#properties). Additional
variables are included for each specific provider and are covered in the provider-specific links in
the table above.

In addition to the synchronous `$getAuth()` method, there is also an asynchronous
[`$onAuthStateChanged()`](/docs/reference.md#onauthstatechangedcallback-context) method which fires a
user-provided callback every time authentication state changes. This is often more convenient than
using `$getAuth()` since it gives you a single, consistent place to handle updates to authentication
state, including users signing in or out and sessions expiring.

Pulling some of these concepts together, we can create a sign in form with dynamic content based on
the user's current authentication state:

```js
var app = angular.module("sampleApp", ["firebase"]);

app.factory("Auth", ["$firebaseAuth",
  function($firebaseAuth) {
    return $firebaseAuth();
  }
]);

app.controller("SampleCtrl", ["$scope", "Auth",
  function($scope, Auth) {
    $scope.auth = Auth;

    // any time auth state changes, add the user data to scope
    $scope.auth.$onAuthStateChanged(function(firebaseUser) {
      $scope.firebaseUser = firebaseUser;
    });
  }
]);
```

```html
<div ng-app="sampleApp" ng-controller="SampleCtrl">
  <div ng-show="firebaseUser">
    <p>Hello, {{ firebaseUser.displayName }}</p>
    <button ng-click="auth.$signOut()">Sign Out</button>
  </div>
  <div ng-hide="firebaseUser">
    <p>Welcome, please sign in.</p>
    <button ng-click="auth.$signInWithPopup('facebook')">Sign In With Facebook</button>
  </div>
</div>
```

The `ng-show` and `ng-hide` directives dynamically change out the content based on the
authentication state, by checking to see if `firebaseUser` is not `null`. The sign in and sign out
methods were bound directly from the view using `ng-click`.


## User-Based Security

Authenticating users is only one piece of making an application secure. It is critical to configure
Security and Firebase Rules before going into production. These declarative rules dictate when and
how data may be read or written.

Within our [Firebase and Security Rules](https://firebase.google.com/docs/database/security/), the
predefined `auth` variable is `null` before authentication takes place. Once a user is authenticated,
it will contain the following attributes:

| Key | Description |
|-----|-------------|
| `uid` |	A user ID, guaranteed to be unique across all providers. |
| `provider` | The authentication method used (e.g. "anonymous" or "google.com"). |
| `token` | The contents of the authentication token (an OpenID JWT). |

The contents of `auth.token` will contain the following information:

```
{
  "email": "foo@bar.com",   // The email corresponding to the authenticated user
  "email_verified": false,  // Whether or not the above email is verified
  "exp": 1465366314,        // JWT expiration time
  "iat": 1465279914,        // JWT issued-at time
  "sub": "g8u5h1i3t51b5",   // JWT subject (same as auth.uid)
  "auth_time": 1465279914,  // When the original authentication took place
  "firebase": {             // Firebase-namespaced claims
    "identities": {         // Authentication identities
      "github.com": [       // Provider
        "8513515"           // ID of the user on the above provider
      ]
    }
  }
}
```

We can then use the `auth` variable within our rules. For example, we can grant everyone read access
to all data, but only write access to their own data, our rules would look like this:

```js
{
  "rules": {
    // public read access
    ".read": true,
    "users": {
      "$uid": {
        // write access only to your own data
        ".write": "$uid === auth.uid",
      }
    }
  }
}
```

For a more in-depth explanation of this important feature, check out the web guide on
[user-based security](https://firebase.google.com/docs/database/security/user-security).


## Authenticating With Routers

Checking to make sure the client has authenticated can be cumbersome and lead to a lot of `if` /
`else` logic in our controllers. In addition, apps which use authentication often have issues upon
initial page load with the signed out state flickering into view temporarily before the
authentication check completes. We can abstract away these complexities by taking advantage of the
`resolve()` method of Angular routers.

AngularFire provides two helper methods to use with Angular routers. The first is
[`$waitForSignIn()`](/docs/reference.md#waitforsignin)
which returns a promise fulfilled with the current authentication state. This is useful when you
want to grab the authentication state before the route is rendered. The second helper method is
[`$requireSignIn()`](/docs/reference.md#requiresignin)
which resolves the promise successfully if a user is authenticated and rejects otherwise. This is
useful in cases where you want to require a route to have an authenticated user. You can catch the
rejected promise and redirect the unauthenticated user to a different page, such as the sign in page.
Both of these methods work well with the `resolve()` methods of `ngRoute` and `ui-router`.

### `ngRoute` Example

```js
// for ngRoute
app.run(["$rootScope", "$location", function($rootScope, $location) {
  $rootScope.$on("$routeChangeError", function(event, next, previous, error) {
    // We can catch the error thrown when the $requireSignIn promise is rejected
    // and redirect the user back to the home page
    if (error === "AUTH_REQUIRED") {
      $location.path("/home");
    }
  });
}]);

app.config(["$routeProvider", function($routeProvider) {
  $routeProvider.when("/home", {
    // the rest is the same for ui-router and ngRoute...
    controller: "HomeCtrl",
    templateUrl: "views/home.html",
    resolve: {
      // controller will not be loaded until $waitForSignIn resolves
      // Auth refers to our $firebaseAuth wrapper in the factory below
      "currentAuth": ["Auth", function(Auth) {
        // $waitForSignIn returns a promise so the resolve waits for it to complete
        return Auth.$waitForSignIn();
      }]
    }
  }).when("/account", {
    // the rest is the same for ui-router and ngRoute...
    controller: "AccountCtrl",
    templateUrl: "views/account.html",
    resolve: {
      // controller will not be loaded until $requireSignIn resolves
      // Auth refers to our $firebaseAuth wrapper in the factory below
      "currentAuth": ["Auth", function(Auth) {
        // $requireSignIn returns a promise so the resolve waits for it to complete
        // If the promise is rejected, it will throw a $routeChangeError (see above)
        return Auth.$requireSignIn();
      }]
    }
  });
}]);

app.controller("HomeCtrl", ["currentAuth", function(currentAuth) {
  // currentAuth (provided by resolve) will contain the
  // authenticated user or null if not signed in
}]);

app.controller("AccountCtrl", ["currentAuth", function(currentAuth) {
  // currentAuth (provided by resolve) will contain the
  // authenticated user or throw a $routeChangeError (see above) if not signed in
}]);

app.factory("Auth", ["$firebaseAuth",
  function($firebaseAuth) {
    return $firebaseAuth();
  }
]);
```

### `ui-router` Example

```js
// for ui-router
app.run(["$rootScope", "$state", function($rootScope, $state) {
  $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
    // We can catch the error thrown when the $requireSignIn promise is rejected
    // and redirect the user back to the home page
    if (error === "AUTH_REQUIRED") {
      $state.go("home");
    }
  });
}]);

app.config(["$stateProvider", function ($stateProvider) {
  $stateProvider
    .state("home", {
      // the rest is the same for ui-router and ngRoute...
      controller: "HomeCtrl",
      templateUrl: "views/home.html",
      resolve: {
        // controller will not be loaded until $waitForSignIn resolves
        // Auth refers to our $firebaseAuth wrapper in the factory below
        "currentAuth": ["Auth", function(Auth) {
          // $waitForSignIn returns a promise so the resolve waits for it to complete
          return Auth.$waitForSignIn();
        }]
      }
    })
    .state("account", {
      // the rest is the same for ui-router and ngRoute...
      controller: "AccountCtrl",
      templateUrl: "views/account.html",
      resolve: {
        // controller will not be loaded until $requireSignIn resolves
        // Auth refers to our $firebaseAuth wrapper in the factory below
        "currentAuth": ["Auth", function(Auth) {
          // $requireSignIn returns a promise so the resolve waits for it to complete
          // If the promise is rejected, it will throw a $stateChangeError (see above)
          return Auth.$requireSignIn();
        }]
      }
    });
}]);

app.controller("HomeCtrl", ["currentAuth", function(currentAuth) {
  // currentAuth (provided by resolve) will contain the
  // authenticated user or null if not signed in
}]);

app.controller("AccountCtrl", ["currentAuth", function(currentAuth) {
  // currentAuth (provided by resolve) will contain the
  // authenticated user or throw a $stateChangeError (see above) if not signed in
}]);

app.factory("Auth", ["$firebaseAuth",
  function($firebaseAuth) {
    return $firebaseAuth();
  }
]);
```
Keep in mind that, even when using `ng-annotate` or `grunt-ngmin` to minify code, that these tools
cannot peer inside of functions. So even though we don't need the array notation to declare our
injected dependencies for our controllers, services, etc., we still need to use an array and
explicitly state our dependencies for the routes, since they are inside of a function.

We have covered the three services AngularFire provides:
[`$firebaseObject`](/docs/reference.md#firebaseobject),
[`$firebaseArray`](/docs/reference.md#firebasearray), and
[`$firebaseAuth`](/docs/reference.md#firebaseauth).
In the [next section](extending-services.md) we will discuss the advanced topic of extending the
functionality of the `$firebaseObject` and `$firebaseArray` services.
