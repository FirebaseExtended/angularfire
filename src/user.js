/* istanbul ignore next */
(function() {
  "use strict";
  var FirebaseUser;

  // Define a service which provides user authentication and management.
  angular.module("firebase").factory("$firebaseUser", [
    "$q", "$timeout", function($q, $t) {
      // This factory returns an object containing the current authentication state of the client.
      // This service takes one argument:
      //
      //   * `ref`: A Firebase reference.
      //
      // The returned object has the following properties:
      //
      //  * `authData`: Set to "null" if the client is not currently authenticated. This value will
      //    be changed to an object when the client is authenticated. This object will contain
      //    details about the authentication state. The exact properties will vary based on the
      //    method used to authenticate, but will at a minimum contain `uid` and `provider`.
      return function(ref) {
        var auth = new FirebaseUser($q, $t, ref);
        return auth.construct();
      };
    }
  ]);

  FirebaseUser = function($q, $t, ref) {
    this._q = $q;
    this._timeout = $t;

    if (typeof ref === "string") {
      throw new Error("Please provide a Firebase reference instead of a URL when calling `new Firebase()`.");
    }
    this._ref = ref;
  };

  FirebaseUser.prototype = {
    construct: function() {
      this._object = {
        // The client's current authentication state
        authData: null,

        // Authentication methods
        $authWithCustomToken: this.authWithCustomToken.bind(this),
        $authAnonymously: this.authAnonymously.bind(this),
        $authWithPassword: this.authWithPassword.bind(this),
        $authWithOAuthPopup: this.authWithOAuthPopup.bind(this),
        $authWithOAuthRedirect: this.authWithOAuthRedirect.bind(this),
        $authWithOAuthToken: this.authWithOAuthToken.bind(this),
        $unauth: this.unauth.bind(this),

        // Authentication state methods
        $onAuth: this.onAuth.bind(this),
        $offAuth: this.offAuth.bind(this),
        $getAuth: this.getAuth.bind(this),
        $requireUser: this.requireUser.bind(this),

        // User management methods
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
    // Updates the authentication state of the client.
    _updateAuthData: function(authData) {
      var self = this;
      // TODO: Is the _timeout here needed?
      this._timeout(function() {
        self._object.authData = authData;
      });
    },

    // Common login completion handler for all authentication methods.
    _onLoginHandler: function(deferred, error, authData) {
      if (error !== null) {
        deferred.reject(error);
      } else {
        this._updateAuthData(authData);
        deferred.resolve(authData);
      }
    },

    // TODO: do we even want this method here?
    // Authenticates the Firebase reference with a custom authentication token.
    authWithCustomToken: function(authToken) {
      var deferred = this._q.defer();

      this._ref.authWithCustomToken(authToken, this._onLoginHandler.bind(this, deferred), function(error) {
        // TODO: what do we do here?
      });

      return deferred.promise;
    },

    // Authenticates the Firebase reference anonymously.
    authAnonymously: function(options) {
      var deferred = this._q.defer();

      this._ref.authAnonymously(this._onLoginHandler.bind(this, deferred), options);

      return deferred.promise;
    },

    // Authenticates the Firebase reference with an email/password user.
    authWithPassword: function(credentials, options) {
      var deferred = this._q.defer();

      this._ref.authWithPassword(credentials, this._onLoginHandler.bind(this, deferred), options);

      return deferred.promise;
    },

    // Authenticates the Firebase reference with the OAuth popup flow.
    authWithOAuthPopup: function(provider, options) {
      var deferred = this._q.defer();

      this._ref.authWithOAuthPopup(provider, this._onLoginHandler.bind(this, deferred), options);

      return deferred.promise;
    },

    // Authenticates the Firebase reference with the OAuth redirect flow.
    authWithOAuthRedirect: function(provider, options) {
      var deferred = this._q.defer();

      this._ref.authWithOAuthRedirect(provider, this._onLoginHandler.bind(this, deferred), options);

      return deferred.promise;
    },

    // Authenticates the Firebase reference with an OAuth token.
    authWithOAuthToken: function(provider, credentials, options) {
      var deferred = this._q.defer();

      this._ref.authWithOAuthToken(provider, credentials, this._onLoginHandler.bind(this, deferred), options);

      return deferred.promise;
    },

    // Unauthenticates the Firebase reference.
    unauth: function() {
      if (this.getAuth() !== null) {
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
      return this._ref.getAuth();
    },

    // Helper callback method which returns a promise which is resolved if a user is authenticated
    // and rejects otherwise. This can be used to require that routes have a logged in user.
    _requireUserOnAuthCallback: function(deferred, authData) {
      console.log("_requireUserOnAuthCallback() fired with ", authData);
      if (authData) {
        deferred.resolve(authData);
      } else {
        deferred.reject();
      }

      // Turn off this onAuth() callback since we just needed to get the authentication state once.
      this._ref.offAuth(this._requireUserOnAuthCallback);
    },

    // Returns a promise which is resolved if a user is authenticated and rejects otherwise. This
    // can be used to require that routes have a logged in user.
    requireUser: function() {
      var deferred = this._q.defer();

      // TODO: this should not fire until after onAuth has been called at least once...
      this._ref.onAuth(this._requireUserOnAuthCallback.bind(this, deferred));

      return deferred.promise;
    },


    /*********************/
    /*  User Management  */
    /*********************/
    // Creates a new email/password user. Note that this function only creates the user, if you
    // wish to log in as the newly created user, call $authWithPassword() after the promise for
    // this method has been resolved.
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

    // Changes the password for an email/password user.
    changePassword: function(email, oldPassword, newPassword) {
      var deferred = this._q.defer();

      this._ref.changePassword({
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

    // Removes an email/password user.
    removeUser: function(email, password) {
      var deferred = this._q.defer();

      this._ref.removeUser({
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

    // Sends a password reset email to an email/password user.
    sendPasswordResetEmail: function(email) {
      var deferred = this._q.defer();

      this._ref.resetPassword({
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
