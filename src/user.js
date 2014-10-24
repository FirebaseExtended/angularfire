/* istanbul ignore next */
(function() {
  "use strict";
  var FirebaseUser;

  // Defines the `$firebaseUser` service that provides simple
  // user authentication support for AngularFire.
  angular.module("firebase").factory("$firebaseUser", [
    "$q", "$timeout", function($q, $t) {
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
        var auth = new FirebaseUser($q, $t, ref);
        return auth.construct();
      };
    }
  ]);

  FirebaseUser = function($q, $t, ref) {
    this._q = $q;
    this._timeout = $t;
    // TODO: do I even need this._currentAuthData? Can I always just use ref.getAuth() since it's synchronous?
    this._currentAuthData = ref.getAuth();

    if (typeof ref === "string") {
      throw new Error("Please provide a Firebase reference instead of a URL when calling `new Firebase()`.");
    }
    this._ref = ref;
  };

  FirebaseUser.prototype = {
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
        $onAuth: this.onAuth.bind(this),
        $offAuth: this.offAuth.bind(this),
        $getAuth: this.getCurrentUser.bind(this),
        $requireUser: this.requireUser.bind(this),

        // User management
        $createUser: this.createUser.bind(this),
        $changePassword: this.changePassword.bind(this),
        $removeUser: this.removeUser.bind(this),
        $sendPasswordResetEmail: this.sendPasswordResetEmail.bind(this)
      };

      return this._object;
    },


    /********************/
    /*  Authentication  */
    /********************/
    _updateAuthData: function(authData) {
      var self = this;
      // TODO: Is the _timeout here needed?
      this._timeout(function() {
        self._object.authData = authData;
        self._currentAuthData = authData;
      });
    },

    _onCompletionHandler: function(deferred, error, authData) {
      if (error !== null) {
        deferred.reject(error);
      } else {
        this._updateAuthData(authData);
        deferred.resolve(authData);
      }
    },

    // TODO: do we even want this method here?
    auth: function(authToken) {
      var deferred = this._q.defer();
      this._ref.authWithPassword(authToken, this._onCompletionHandler.bind(this, deferred), function(error) {
        // TODO: what do we do here?
      });
      return deferred.promise;
    },

    authWithPassword: function(credentials, options) {
      var deferred = this._q.defer();
      this._ref.authWithPassword(credentials, this._onCompletionHandler.bind(this, deferred), options);
      return deferred.promise;
    },

    authAnonymously: function(options) {
      var deferred = this._q.defer();
      this._ref.authAnonymously(this._onCompletionHandler.bind(this, deferred), options);
      return deferred.promise;
    },

    authWithOAuthPopup: function(provider, options) {
      var deferred = this._q.defer();
      this._ref.authWithOAuthPopup(provider, this._onCompletionHandler.bind(this, deferred), options);
      return deferred.promise;
    },

    authWithOAuthRedirect: function(provider, options) {
      var deferred = this._q.defer();
      this._ref.authWithOAuthRedirect(provider, this._onCompletionHandler.bind(this, deferred), options);
      return deferred.promise;
    },

    authWithOAuthToken: function(provider, credentials, options) {
      var deferred = this._q.defer();
      this._ref.authWithOAuthToken(provider, credentials, this._onCompletionHandler.bind(this, deferred), options);
      return deferred.promise;
    },

    unauth: function() {
      if (this._currentAuthData) {
        this._ref.unauth();
        this._updateAuthData(null);
      }
    },

    // The login method takes a provider and authenticates the Firebase reference
    // with which the service was initialized. This method returns a promise, which
    // will be resolved when the login succeeds (and rejected when an error occurs).
    login: function(provider, options) {
      var deferred = this._q.defer();

      if (provider === 'anonymous') {
        this._ref.authAnonymously(this._onCompletionHandler.bind(this, deferred), options);
      } else if (provider === 'password') {
        this._ref.authWithPassword(options, this._onCompletionHandler.bind(this, deferred));
      } else {
        this._ref.authWithOAuthPopup(provider, this._onCompletionHandler.bind(this, deferred), options);
      }

      return deferred.promise;
    },

    // Unauthenticate the Firebase reference.
    logout: function() {
      // TODO: update comment?
      // Simple Login fires _onLoginEvent() even if no user is logged in. We don't care about
      // firing this logout event multiple times, so explicitly check if a user is defined.
      if (this._currentAuthData) {
        this._ref.unauth();
        this._updateAuthData(null);
      }
    },


    /**************************/
    /*  Authentication State  */
    /**************************/
    // Asynchronously fires the provided callback with the current authentication data every time
    // the authentication data changes. It also fires as soon as the authentication data is
    // retrieved from the server.
    onAuth: function(callback) {
      this._onAuthCallback = callback;
      this._ref.onAuth(callback);
    },

    // Detaches the callback previously attached with onAuth().
    offAuth: function() {
      this._ref.offAuth(this._onAuthCallback);
    },

    // Synchronously retrieves the current authentication data.
    getAuth: function() {
      return this._currentAuthData;
    },

    // Returns a promise which is resolved if a user is authenticated and rejects otherwise. This
    // can be used to require routes to have a logged in user.
    requireUser: function() {
      // TODO: this should not fire until after onAuth has been called at least once...

      var deferred = this._q.defer();

      if (this._currentAuthData) {
        deferred.resolve(this._currentAuthData);
      } else {
        deferred.reject();
      }

      return deferred.promise;
    },


    /*********************/
    /*  User Management  */
    /*********************/
    // Creates a user for Firebase Simple Login. Function 'cb' receives an
    // error as the first argument and a Simple Login user object as the second
    // argument. Note that this function only creates the user, if you wish to
    // log in as the newly created user, call $login() after the promise for
    // this method has been fulfilled.
    createUser: function(email, password) {
      var deferred = this._q.defer();

      this._ref.createUser({
        email: email,
        password: password
      }, function(error) {
        if (error !== null) {
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

      self._ref.changePassword({
        email: email,
        oldPassword: oldPassword,
        newPassword: newPassword
      }, function(error) {
          if (error !== null) {
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

      self._ref.removeUser({
        email: email,
        password: password
      }, function(error) {
        if (error !== null) {
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

      self._ref.resetPassword({
        email: email
      }, function(error) {
        if (error !== null) {
          deferred.reject(error);
        } else {
          deferred.resolve();
        }
      });

      return deferred.promise;
    }
  };
})();
