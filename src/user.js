/* istanbul ignore next */
(function() {
  'use strict';
  var AngularFireUser;

  // Defines the `$angularFireUser` service that provides simple
  // user authentication support for AngularFire.
  angular.module("firebase").factory("$angularFireUser", [
    "$q", "$timeout", "$rootScope", function($q, $t, $rs) {
      // The factory returns an object containing the authentication state
      // of the current user. This service takes one argument:
      //
      //   * `ref`     : A Firebase reference.
      //
      // The returned object has the following properties:
      //
      //  * `authData`: Set to "null" if the user is currently logged out. This
      //    value will be changed to an object when the user successfully logs
      //    in. This object will contain details about the logged in user. The
      //    exact properties will vary based on the method used to login, but
      //    will at a minimum contain the `uid` and `provider` properties.
      //
      // The returned object will also have the following methods available:
      // $login(), $logout(), $createUser(), $changePassword(), $removeUser(),
      // and $getCurrentUser().
      return function(ref) {
        var auth = new AngularFireUser($q, $t, $rs, ref);
        return auth.construct();
      };
    }
  ]);

  AngularFireUser = function($q, $t, $rs, ref) {
    this._q = $q;
    this._timeout = $t;
    this._rootScope = $rs;
    this._loginDeferred = null;
    this._getCurrentUserDeferred = [];
    this._currentAuthData = ref.getAuth();

    // TODO: these events don't seem to fire upon page reload
    if (this._currentAuthData) {
      this._rootScope.$broadcast("$angularFireUser:login", this._currentAuthData);
    } else {
      this._rootScope.$broadcast("$angularFireUser:logout");
    }

    if (typeof ref == "string") {
      throw new Error("Please provide a Firebase reference instead " +
        "of a URL, eg: new Firebase(url)");
    }
    this._fRef = ref;
  };

  AngularFireUser.prototype = {
    construct: function() {
      this._object = {
        authData: null,
        // Authentication
        $auth: this.auth.bind(this),
        $authWithPassword: this.authWithPassword.bind(this),
        $authAnonymously: this.authAnonymously.bind(this),
        $authWithOAuthPopup: this.authWithOAuthPopup.bind(this),
        $authWithOAuthRedirect: this.authWithOAuthRedirect.bind(this),
        $authWithOAuthToken: this.authWithOAuthToken.bind(this),
        $unauth: this.unauth.bind(this),
        $login: this.login.bind(this),
        $logout: this.logout.bind(this),

        // Authentication state
        $getCurrentUser: this.getCurrentUser.bind(this),
        $requireUser: this.requireUser.bind(this),

        // User management
        $createUser: this.createUser.bind(this),
        $changePassword: this.changePassword.bind(this),
        $removeUser: this.removeUser.bind(this),
        $sendPasswordResetEmail: this.sendPasswordResetEmail.bind(this)
      };

      return this._object;
    },

    // TODO: remove the promise?
    // Synchronously retrieves the current auth data.
    getCurrentUser: function() {
      var deferred = this._q.defer();

      deferred.resolve(this._currentAuthData);

      return deferred.promise;
    },

    // Returns a promise which is resolved if a user is authenticated and rejects the promise if
    // the user does not exist. This can be used in routers to require routes to have a user
    // logged in.
    requireUser: function() {
      var deferred = this._q.defer();

      if (this._currentAuthData) {
        deferred.resolve(this._currentAuthData);
      } else {
        deferred.reject();
      }

      return deferred.promise;
    },

    _updateAuthData: function(authData) {
      var self = this;
      this._timeout(function() {
        self._object.authData = authData;
        self._currentAuthData = authData;
      });
    },

    _onCompletionHandler: function(deferred, error, authData) {
      if (error !== null) {
        this._rootScope.$broadcast("$angularFireUser:error", error);
        deferred.reject(error);
      } else {
        this._rootScope.$broadcast("$angularFireUser:login", authData);
        this._updateAuthData(authData);
        deferred.resolve(authData);
      }
    },

    auth: function(authToken) {
      var deferred = this._q.defer();
      var self = this;
      this._fRef.authWithPassword(authToken, this._onCompletionHandler.bind(this, deferred), function(error) {
        self._rootScope.$broadcast("$angularFireUser:error", error);
      });
      return deferred.promise;
    },

    authWithPassword: function(credentials, options) {
      var deferred = this._q.defer();
      this._fRef.authWithPassword(credentials, this._onCompletionHandler.bind(this, deferred), options);
      return deferred.promise;
    },

    authAnonymously: function(options) {
      var deferred = this._q.defer();
      this._fRef.authAnonymously(this._onCompletionHandler.bind(this, deferred), options);
      return deferred.promise;
    },

    authWithOAuthPopup: function(provider, options) {
      var deferred = this._q.defer();
      this._fRef.authWithOAuthPopup(provider, this._onCompletionHandler.bind(this, deferred), options);
      return deferred.promise;
    },

    authWithOAuthRedirect: function(provider, options) {
      var deferred = this._q.defer();
      this._fRef.authWithOAuthRedirect(provider, this._onCompletionHandler.bind(this, deferred), options);
      return deferred.promise;
    },

    authWithOAuthToken: function(provider, credentials, options) {
      var deferred = this._q.defer();
      this._fRef.authWithOAuthToken(provider, credentials, this._onCompletionHandler.bind(this, deferred), options);
      return deferred.promise;
    },

    unauth: function() {
      if (this._currentAuthData) {
        this._fRef.unauth();
        this._updateAuthData(null);
        this._rootScope.$broadcast("$angularFireUser:logout");
      }
    },

    // The login method takes a provider and authenticates the Firebase reference
    // with which the service was initialized. This method returns a promise, which
    // will be resolved when the login succeeds (and rejected when an error occurs).
    login: function(provider, options) {
      var deferred = this._q.defer();

      if (provider === 'anonymous') {
        this._fRef.authAnonymously(this._onCompletionHandler.bind(this, deferred), options);
      } else if (provider === 'password') {
        this._fRef.authWithPassword(options, this._onCompletionHandler.bind(this, deferred));
      } else {
        this._fRef.authWithOAuthPopup(provider, this._onCompletionHandler.bind(this, deferred), options);
      }

      return deferred.promise;
    },

    // Unauthenticate the Firebase reference.
    logout: function() {
      // TODO: update comment?
      // Simple Login fires _onLoginEvent() even if no user is logged in. We don't care about
      // firing this logout event multiple times, so explicitly check if a user is defined.
      if (this._currentAuthData) {
        this._fRef.unauth();
        this._updateAuthData(null);
        this._rootScope.$broadcast("$angularFireUser:logout");
      }
    },

    // Creates a user for Firebase Simple Login. Function 'cb' receives an
    // error as the first argument and a Simple Login user object as the second
    // argument. Note that this function only creates the user, if you wish to
    // log in as the newly created user, call $login() after the promise for
    // this method has been fulfilled.
    createUser: function(email, password) {
      var self = this;
      var deferred = this._q.defer();

      this._fRef.createUser({
        email: email,
        password: password
      }, function(error) {
        if (error !== null) {
          self._rootScope.$broadcast("$angularFireUser:error", error);
          deferred.reject(error);
        } else {
          deferred.resolve();
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

      self._fRef.changePassword({
        email: email,
        oldPassword: oldPassword,
        newPassword: newPassword
      }, function(error) {
          if (error !== null) {
            // TODO: do we want to send the error code as well?
            self._rootScope.$broadcast("$angularFireUser:error", error);
            deferred.reject(error);
          } else {
            deferred.resolve();
          }
        }
      );

      return deferred.promise;
    },

    // Remove a user for the listed email address. Returns a promise.
    removeUser: function(email, password) {
      var self = this;
      var deferred = this._q.defer();

      self._fRef.removeUser({
        email: email,
        password: password
      }, function(error) {
        if (error !== null) {
          // TODO: do we want to send the error code as well?
          self._rootScope.$broadcast("$angularFireUser:error", error);
          deferred.reject(error);
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

      self._fRef.resetPassword({
        email: email
      }, function(error) {
        if (error !== null) {
          // TODO: do we want to send the error code as well?
          self._rootScope.$broadcast("$angularFireUser:error", error);
          deferred.reject(error);
        } else {
          deferred.resolve();
        }
      });

      return deferred.promise;
    }
  };
})();
