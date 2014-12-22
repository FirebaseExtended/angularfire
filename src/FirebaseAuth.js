(function() {
  'use strict';
  var FirebaseAuth;

  // Define a service which provides user authentication and management.
  angular.module('firebase').factory('$firebaseAuth', [
    '$q', '$firebaseUtils', '$log', function($q, $firebaseUtils, $log) {
      /**
       * This factory returns an object allowing you to manage the client's authentication state.
       *
       * @param {Firebase} ref A Firebase reference to authenticate.
       * @return {object} An object containing methods for authenticating clients, retrieving
       * authentication state, and managing users.
       */
      return function(ref) {
        var auth = new FirebaseAuth($q, $firebaseUtils, $log, ref);
        return auth.construct();
      };
    }
  ]);

  FirebaseAuth = function($q, $firebaseUtils, $log, ref) {
    this._q = $q;
    this._utils = $firebaseUtils;
    this._log = $log;

    if (typeof ref === 'string') {
      throw new Error('Please provide a Firebase reference instead of a URL when creating a `$firebaseAuth` object.');
    }
    this._ref = ref;
  };

  FirebaseAuth.prototype = {
    construct: function() {
      this._object = {
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
        $getAuth: this.getAuth.bind(this),
        $requireAuth: this.requireAuth.bind(this),
        $waitForAuth: this.waitForAuth.bind(this),

        // User management methods
        $createUser: this.createUser.bind(this),
        $changePassword: this.changePassword.bind(this),
        $removeUser: this.removeUser.bind(this),
        $resetPassword: this.resetPassword.bind(this),
        $sendPasswordResetEmail: this.sendPasswordResetEmail.bind(this)
      };

      return this._object;
    },


    /********************/
    /*  Authentication  */
    /********************/

    /**
     * Authenticates the Firebase reference with a custom authentication token.
     *
     * @param {string} authToken An authentication token or a Firebase Secret. A Firebase Secret
     * should only be used for authenticating a server process and provides full read / write
     * access to the entire Firebase.
     * @param {Object} [options] An object containing optional client arguments, such as configuring
     * session persistence.
     * @return {Promise<Object>} A promise fulfilled with an object containing authentication data.
     */
    authWithCustomToken: function(authToken, options) {
      var deferred = this._q.defer();

      try {
        this._ref.authWithCustomToken(authToken, this._utils.makeNodeResolver(deferred), options);
      } catch (error) {
        deferred.reject(error);
      }

      return deferred.promise;
    },

    /**
     * Authenticates the Firebase reference anonymously.
     *
     * @param {Object} [options] An object containing optional client arguments, such as configuring
     * session persistence.
     * @return {Promise<Object>} A promise fulfilled with an object containing authentication data.
     */
    authAnonymously: function(options) {
      var deferred = this._q.defer();

      try {
        this._ref.authAnonymously(this._utils.makeNodeResolver(deferred), options);
      } catch (error) {
        deferred.reject(error);
      }

      return deferred.promise;
    },

    /**
     * Authenticates the Firebase reference with an email/password user.
     *
     * @param {Object} credentials An object containing email and password attributes corresponding
     * to the user account.
     * @param {Object} [options] An object containing optional client arguments, such as configuring
     * session persistence.
     * @return {Promise<Object>} A promise fulfilled with an object containing authentication data.
     */
    authWithPassword: function(credentials, options) {
      var deferred = this._q.defer();

      try {
        this._ref.authWithPassword(credentials, this._utils.makeNodeResolver(deferred), options);
      } catch (error) {
        deferred.reject(error);
      }

      return deferred.promise;
    },

    /**
     * Authenticates the Firebase reference with the OAuth popup flow.
     *
     * @param {string} provider The unique string identifying the OAuth provider to authenticate
     * with, e.g. google.
     * @param {Object} [options] An object containing optional client arguments, such as configuring
     * session persistence.
     * @return {Promise<Object>} A promise fulfilled with an object containing authentication data.
     */
    authWithOAuthPopup: function(provider, options) {
      var deferred = this._q.defer();

      try {
        this._ref.authWithOAuthPopup(provider, this._utils.makeNodeResolver(deferred), options);
      } catch (error) {
        deferred.reject(error);
      }

      return deferred.promise;
    },

    /**
     * Authenticates the Firebase reference with the OAuth redirect flow.
     *
     * @param {string} provider The unique string identifying the OAuth provider to authenticate
     * with, e.g. google.
     * @param {Object} [options] An object containing optional client arguments, such as configuring
     * session persistence.
     * @return {Promise<Object>} A promise fulfilled with an object containing authentication data.
     */
    authWithOAuthRedirect: function(provider, options) {
      var deferred = this._q.defer();

      try {
        this._ref.authWithOAuthRedirect(provider, this._utils.makeNodeResolver(deferred), options);
      } catch (error) {
        deferred.reject(error);
      }

      return deferred.promise;
    },

    /**
     * Authenticates the Firebase reference with an OAuth token.
     *
     * @param {string} provider The unique string identifying the OAuth provider to authenticate
     * with, e.g. google.
     * @param {string|Object} credentials Either a string, such as an OAuth 2.0 access token, or an
     * Object of key / value pairs, such as a set of OAuth 1.0a credentials.
     * @param {Object} [options] An object containing optional client arguments, such as configuring
     * session persistence.
     * @return {Promise<Object>} A promise fulfilled with an object containing authentication data.
     */
    authWithOAuthToken: function(provider, credentials, options) {
      var deferred = this._q.defer();

      try {
        this._ref.authWithOAuthToken(provider, credentials, this._utils.makeNodeResolver(deferred), options);
      } catch (error) {
        deferred.reject(error);
      }

      return deferred.promise;
    },

    /**
     * Unauthenticates the Firebase reference.
     */
    unauth: function() {
      if (this.getAuth() !== null) {
        this._ref.unauth();
      }
    },


    /**************************/
    /*  Authentication State  */
    /**************************/
    /**
     * Asynchronously fires the provided callback with the current authentication data every time
     * the authentication data changes. It also fires as soon as the authentication data is
     * retrieved from the server.
     *
     * @param {function} callback A callback that fires when the client's authenticate state
     * changes. If authenticated, the callback will be passed an object containing authentication
     * data according to the provider used to authenticate. Otherwise, it will be passed null.
     * @param {string} [context] If provided, this object will be used as this when calling your
     * callback.
     * @return {function} A function which can be used to deregister the provided callback.
     */
    onAuth: function(callback, context) {
      var self = this;

      var fn = this._utils.debounce(callback, context, 0);
      this._ref.onAuth(fn);

      // Return a method to detach the `onAuth()` callback.
      return function() {
        self._ref.offAuth(fn);
      };
    },

    /**
     * Synchronously retrieves the current authentication data.
     *
     * @return {Object} The client's authentication data.
     */
    getAuth: function() {
      return this._ref.getAuth();
    },

    /**
     * Helper onAuth() callback method for the two router-related methods.
     *
     * @param {boolean} rejectIfAuthDataIsNull Determines if the returned promise should be
     * resolved or rejected upon an unauthenticated client.
     * @return {Promise<Object>} A promise fulfilled with the client's authentication state or
     * rejected if the client is unauthenticated and rejectIfAuthDataIsNull is true.
     */
    _routerMethodOnAuthPromise: function(rejectIfAuthDataIsNull) {
      var ref = this._ref;
      var deferred = this._q.defer();

      function callback(authData) {
        if (authData !== null) {
          deferred.resolve(authData);
        } else if (rejectIfAuthDataIsNull) {
          deferred.reject("AUTH_REQUIRED");
        } else {
          deferred.resolve(null);
        }

        // Turn off this onAuth() callback since we just needed to get the authentication data once.
        ref.offAuth(callback);
      }

      ref.onAuth(callback);

      return deferred.promise;
    },

    /**
     * Utility method which can be used in a route's resolve() method to require that a route has
     * a logged in client.
     *
     * @returns {Promise<Object>} A promise fulfilled with the client's current authentication
     * state or rejected if the client is not authenticated.
     */
    requireAuth: function() {
      return this._routerMethodOnAuthPromise(true);
    },

    /**
     * Utility method which can be used in a route's resolve() method to grab the current
     * authentication data.
     *
     * @returns {Promise<Object|null>} A promise fulfilled with the client's current authentication
     * state, which will be null if the client is not authenticated.
     */
    waitForAuth: function() {
      return this._routerMethodOnAuthPromise(false);
    },


    /*********************/
    /*  User Management  */
    /*********************/
    /**
     * Creates a new email/password user. Note that this function only creates the user, if you
     * wish to log in as the newly created user, call $authWithPassword() after the promise for
     * this method has been resolved.
     *
     * @param {Object|string} emailOrCredentials The email of the user to create or an object
     * containing the email and password of the user to create.
     * @param {string} [password] The password for the user to create.
     * @return {Promise<Object>} A promise fulfilled with the user object, which contains the
     * uid of the created user.
     */
    createUser: function(emailOrCredentials, password) {
      var deferred = this._q.defer();

      // Allow this method to take a single credentials argument or two separate string arguments
      var credentials = emailOrCredentials;
      if (typeof emailOrCredentials === "string") {
        this._log.warn("Passing in credentials to $createUser() as individual arguments has been deprecated in favor of a single credentials argument. See the AngularFire API reference for details.");

        credentials = {
          email: emailOrCredentials,
          password: password
        };
      }

      try {
        this._ref.createUser(credentials, this._utils.makeNodeResolver(deferred));
      } catch (error) {
        deferred.reject(error);
      }

      return deferred.promise;
    },

    /**
     * Changes the password for an email/password user.
     *
     * @param {Object|string} emailOrCredentials The email of the user whose password is to change
     * or an objet containing the email, old password, and new password of the user whose password
     * is to change.
     * @param {string} [oldPassword] The current password for the user.
     * @param {string} [newPassword] The new password for the user.
     * @return {Promise<>} An empty promise fulfilled once the password change is complete.
     */
    changePassword: function(emailOrCredentials, oldPassword, newPassword) {
      var deferred = this._q.defer();

      // Allow this method to take a single credentials argument or three separate string arguments
      var credentials = emailOrCredentials;
      if (typeof emailOrCredentials === "string") {
        this._log.warn("Passing in credentials to $changePassword() as individual arguments has been deprecated in favor of a single credentials argument. See the AngularFire API reference for details.");

        credentials = {
          email: emailOrCredentials,
          oldPassword: oldPassword,
          newPassword: newPassword
        };
      }

      try {
        this._ref.changePassword(credentials, this._utils.makeNodeResolver(deferred));
      } catch (error) {
        deferred.reject(error);
      }

      return deferred.promise;
    },

    /**
     * Removes an email/password user.
     *
     * @param {Object|string} emailOrCredentials The email of the user to remove or an object
     * containing the email and password of the user to remove.
     * @param {string} [password] The password of the user to remove.
     * @return {Promise<>} An empty promise fulfilled once the user is removed.
     */
    removeUser: function(emailOrCredentials, password) {
      var deferred = this._q.defer();

      // Allow this method to take a single credentials argument or two separate string arguments
      var credentials = emailOrCredentials;
      if (typeof emailOrCredentials === "string") {
        this._log.warn("Passing in credentials to $removeUser() as individual arguments has been deprecated in favor of a single credentials argument. See the AngularFire API reference for details.");

        credentials = {
          email: emailOrCredentials,
          password: password
        };
      }

      try {
        this._ref.removeUser(credentials, this._utils.makeNodeResolver(deferred));
      } catch (error) {
        deferred.reject(error);
      }

      return deferred.promise;
    },

    /**
     * Sends a password reset email to an email/password user. [DEPRECATED]
     *
     * @deprecated
     * @param {Object|string} emailOrCredentials The email of the user to send a reset password
     * email to or an object containing the email of the user to send a reset password email to.
     * @return {Promise<>} An empty promise fulfilled once the reset password email is sent.
     */
    sendPasswordResetEmail: function(emailOrCredentials) {
      this._log.warn("$sendPasswordResetEmail() has been deprecated in favor of the equivalent $resetPassword().");

      try {
        return this.resetPassword(emailOrCredentials);
      } catch (error) {
        deferred.reject(error);
      }
    },

    /**
     * Sends a password reset email to an email/password user.
     *
     * @param {Object|string} emailOrCredentials The email of the user to send a reset password
     * email to or an object containing the email of the user to send a reset password email to.
     * @return {Promise<>} An empty promise fulfilled once the reset password email is sent.
     */
    resetPassword: function(emailOrCredentials) {
      var deferred = this._q.defer();

      // Allow this method to take a single credentials argument or a single string argument
      var credentials = emailOrCredentials;
      if (typeof emailOrCredentials === "string") {
        this._log.warn("Passing in credentials to $resetPassword() as individual arguments has been deprecated in favor of a single credentials argument. See the AngularFire API reference for details.");

        credentials = {
          email: emailOrCredentials
        };
      }

      try {
        this._ref.resetPassword(credentials, this._utils.makeNodeResolver(deferred));
      } catch (error) {
        deferred.reject(error);
      }

      return deferred.promise;
    }
  };
})();
