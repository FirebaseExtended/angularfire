/* istanbul ignore next */
(function() {
  'use strict';
  var AngularFireAuth;

  // Defines the `$firebaseSimpleLogin` service that provides simple
  // user authentication support for AngularFire.
  angular.module("firebase").factory("$firebaseSimpleLogin", [
    "$q", "$timeout", "$rootScope", function($q, $t, $rs) {
      // The factory returns an object containing the authentication state
      // of the current user. This service takes one argument:
      //
      //   * `ref`     : A Firebase reference.
      //
      // The returned object has the following properties:
      //
      //  * `user`: Set to "null" if the user is currently logged out. This
      //    value will be changed to an object when the user successfully logs
      //    in. This object will contain details of the logged in user. The
      //    exact properties will vary based on the method used to login, but
      //    will at a minimum contain the `id` and `provider` properties.
      //
      // The returned object will also have the following methods available:
      // $login(), $logout(), $createUser(), $changePassword(), $removeUser(),
      // and $getCurrentUser().
      return function(ref) {
        var auth = new AngularFireAuth($q, $t, $rs, ref);
        return auth.construct();
      };
    }
  ]);

  AngularFireAuth = function($q, $t, $rs, ref) {
    this._q = $q;
    this._timeout = $t;
    this._rootScope = $rs;
    this._loginDeferred = null;
    this._getCurrentUserDeferred = [];
    this._currentUserData = undefined;

    if (typeof ref == "string") {
      throw new Error("Please provide a Firebase reference instead " +
        "of a URL, eg: new Firebase(url)");
    }
    this._fRef = ref;
  };

  AngularFireAuth.prototype = {
    construct: function() {
      var object = {
        user: null,
        $login: this.login.bind(this),
        $logout: this.logout.bind(this),
        $createUser: this.createUser.bind(this),
        $changePassword: this.changePassword.bind(this),
        $removeUser: this.removeUser.bind(this),
        $getCurrentUser: this.getCurrentUser.bind(this),
        $sendPasswordResetEmail: this.sendPasswordResetEmail.bind(this)
      };
      this._object = object;

      // Initialize Simple Login.
      if (!window.FirebaseSimpleLogin) {
        var err = new Error("FirebaseSimpleLogin is undefined. " +
          "Did you forget to include firebase-simple-login.js?");
        this._rootScope.$broadcast("$firebaseSimpleLogin:error", err);
        throw err;
      }

      var client = new FirebaseSimpleLogin(this._fRef,
        this._onLoginEvent.bind(this));
      this._authClient = client;
      return this._object;
    },

    // The login method takes a provider (for Simple Login) and authenticates
    // the Firebase reference with which the service was initialized. This
    // method returns a promise, which will be resolved when the login succeeds
    // (and rejected when an error occurs).
    login: function(provider, options) {
      var deferred = this._q.defer();
      var self = this;

      // To avoid the promise from being fulfilled by our initial login state,
      // make sure we have it before triggering the login and creating a new
      // promise.
      this.getCurrentUser().then(function() {
        self._loginDeferred = deferred;
        self._authClient.login(provider, options);
      });

      return deferred.promise;
    },

    // Unauthenticate the Firebase reference.
    logout: function() {
      // Tell the simple login client to log us out.
      this._authClient.logout();

      // Forget who we were, so that any getCurrentUser calls will wait for
      // another user event.
      delete this._currentUserData;
    },

    // Creates a user for Firebase Simple Login. Function 'cb' receives an
    // error as the first argument and a Simple Login user object as the second
    // argument. Note that this function only creates the user, if you wish to
    // log in as the newly created user, call $login() after the promise for
    // this method has been fulfilled.
    createUser: function(email, password) {
      var self = this;
      var deferred = this._q.defer();

      self._authClient.createUser(email, password, function(err, user) {
        if (err) {
          self._rootScope.$broadcast("$firebaseSimpleLogin:error", err);
          deferred.reject(err);
        } else {
          deferred.resolve(user);
        }
      });

      return deferred.promise;
    },

    // Changes the password for a Firebase Simple Login user. Take an email,
    // old password and new password as three mandatory arguments. Returns a
    // promise.
    changePassword: function(email, oldPassword, newPassword) {
      var self = this;
      var deferred = this._q.defer();

      self._authClient.changePassword(email, oldPassword, newPassword,
        function(err) {
          if (err) {
            self._rootScope.$broadcast("$firebaseSimpleLogin:error", err);
            deferred.reject(err);
          } else {
            deferred.resolve();
          }
        }
      );

      return deferred.promise;
    },

    // Gets a promise for the current user info.
    getCurrentUser: function() {
      var self = this;
      var deferred = this._q.defer();

      if (self._currentUserData !== undefined) {
        deferred.resolve(self._currentUserData);
      } else {
        self._getCurrentUserDeferred.push(deferred);
      }

      return deferred.promise;
    },

    // Remove a user for the listed email address. Returns a promise.
    removeUser: function(email, password) {
      var self = this;
      var deferred = this._q.defer();

      self._authClient.removeUser(email, password, function(err) {
        if (err) {
          self._rootScope.$broadcast("$firebaseSimpleLogin:error", err);
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      });

      return deferred.promise;
    },

    // Send a password reset email to the user for an email + password account.
    sendPasswordResetEmail: function(email) {
      var self = this;
      var deferred = this._q.defer();

      self._authClient.sendPasswordResetEmail(email, function(err) {
        if (err) {
          self._rootScope.$broadcast("$firebaseSimpleLogin:error", err);
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      });

      return deferred.promise;
    },

    // Internal callback for any Simple Login event.
    _onLoginEvent: function(err, user) {
      // HACK -- calls to logout() trigger events even if we're not logged in,
      // making us get extra events. Throw them away. This should be fixed by
      // changing Simple Login so that its callbacks refer directly to the
      // action that caused them.
      if (this._currentUserData === user && err === null) {
        return;
      }

      var self = this;
      if (err) {
        if (self._loginDeferred) {
          self._loginDeferred.reject(err);
          self._loginDeferred = null;
        }
        self._rootScope.$broadcast("$firebaseSimpleLogin:error", err);
      } else {
        this._currentUserData = user;

        self._timeout(function() {
          self._object.user = user;
          if (user) {
            self._rootScope.$broadcast("$firebaseSimpleLogin:login", user);
          } else {
            self._rootScope.$broadcast("$firebaseSimpleLogin:logout");
          }
          if (self._loginDeferred) {
            self._loginDeferred.resolve(user);
            self._loginDeferred = null;
          }
          while (self._getCurrentUserDeferred.length > 0) {
            var def = self._getCurrentUserDeferred.pop();
            def.resolve(user);
          }
        });
      }
    }
  };
})();