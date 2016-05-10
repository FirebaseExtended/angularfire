(function() {
  'use strict';
  var FirebaseAuth;

  // Define a service which provides user authentication and management.
  angular.module('firebase').factory('$firebaseAuth', [
    '$q', '$firebaseUtils', function($q, $firebaseUtils) {
      /**
       * This factory returns an object allowing you to manage the client's authentication state.
       *
       * @param {Firebase} ref A Firebase reference to authenticate.
       * @return {object} An object containing methods for authenticating clients, retrieving
       * authentication state, and managing users.
       */
      return function(auth) {
        auth = auth || firebase.auth();

        var firebaseAuth = new FirebaseAuth($q, $firebaseUtils, auth);
        return firebaseAuth.construct();
      };
    }
  ]);

  FirebaseAuth = function($q, $firebaseUtils, auth) {
    this._q = $q;
    this._utils = $firebaseUtils;
    if (typeof ref === 'string') {
      throw new Error('Please provide a Firebase reference instead of a URL when creating a `$firebaseAuth` object.');
    }
    this._auth = auth;
    this._initialAuthResolver = this._initAuthResolver();
  };

  FirebaseAuth.prototype = {
    construct: function() {
      this._object = {
        // Authentication methods
        $signInWithCustomToken: this.signInWithCustomToken.bind(this),
        $signInAnonymously: this.signInAnonymously.bind(this),
        $signInWithEmailAndPassword: this.signInWithEmailAndPassword.bind(this),
        $signInWithPopup: this.signInWithPopup.bind(this),
        $signInWithRedirect: this.signInWithRedirect.bind(this),
        $signInWithCredential: this.signInWithCredential.bind(this),
        $signOut: this.signOut.bind(this),

        // Authentication state methods
        $onAuthStateChanged: this.onAuthStateChanged.bind(this),
        $getAuth: this.getAuth.bind(this),
        $requireAuth: this.requireAuth.bind(this),
        $waitForAuth: this.waitForAuth.bind(this),

        // User management methods
        $createUserWithEmailAndPassword: this.createUserWithEmailAndPassword.bind(this),
        $updatePassword: this.updatePassword.bind(this),
        $updateEmail: this.updateEmail.bind(this),
        $deleteUser: this.deleteUser.bind(this),
        $sendPasswordResetEmail: this.sendPasswordResetEmail.bind(this),

        _: this
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
     * @return {Promise<Object>} A promise fulfilled with an object containing authentication data.
     */
    signInWithCustomToken: function(authToken) {
      return this._utils.Q(this._auth.signInWithCustomToken(authToken).then);
    },

    /**
     * Authenticates the Firebase reference anonymously.
     *
     * @return {Promise<Object>} A promise fulfilled with an object containing authentication data.
     */
    signInAnonymously: function() {
      return this._utils.Q(this._auth.signInAnonymously().then);
    },

    /**
     * Authenticates the Firebase reference with an email/password user.
     *
     * @param {String} email An email address for the new user.
     * @param {String} password A password for the new email.
     * @return {Promise<Object>} A promise fulfilled with an object containing authentication data.
     */
    signInWithEmailAndPassword: function(email, password) {
      return this._utils.Q(this._auth.signInWithEmailAndPassword(email, password).then);
    },

    /**
     * Authenticates the Firebase reference with the OAuth popup flow.
     *
     * @param {object} provider A firebase.auth.AuthProvider or a unique provider ID like 'facebook'
     * @return {Promise<Object>} A promise fulfilled with an object containing authentication data.
     */
    signInWithPopup: function(provider) {
      return this._utils.Q(this._auth.signInWithPopup(this._getProvider(provider)).then);
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
    signInWithRedirect: function(provider, options) {
      return this._utils.Q(this._auth.signInWithRedirect(this._getProvider(provider)).then);
    },

    /**
     * Authenticates the Firebase reference with an OAuth token.
     *
     * @param {firebase.auth.AuthCredential} credential The Firebase credential.
     * @return {Promise<Object>} A promise fulfilled with an object containing authentication data.
     */
    signInWithCredential: function(credential) {
      return this._utils.Q(this._auth.signInWithCredential(credential).then);
    },

    /**
     * Unauthenticates the Firebase reference.
     */
    signOut: function() {
      this._auth.signOut();
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
     * @return {Promise<Function>} A promised fulfilled with a function which can be used to
     * deregister the provided callback.
     */
    onAuthStateChanged: function(callback, context) {
      var self = this;

      var fn = this._utils.debounce(callback, context, 0);
      var off = this._auth.onAuthStateChanged(fn);

      // Return a method to detach the `onAuth()` callback.
      return off;
    },

    /**
     * Synchronously retrieves the current authentication data.
     *
     * @return {Object} The client's authentication data.
     */
    getAuth: function() {
      return this._auth.currentUser;
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
      var utils = this._utils, self = this;

      // wait for the initial auth state to resolve; on page load we have to request auth state
      // asynchronously so we don't want to resolve router methods or flash the wrong state
      return this._initialAuthResolver.then(function() {
        // auth state may change in the future so rather than depend on the initially resolved state
        // we also check the auth data (synchronously) if a new promise is requested, ensuring we resolve
        // to the current auth state and not a stale/initial state
        var authData = self.getAuth(), res = null;
        if (rejectIfAuthDataIsNull && authData === null) {
          res = utils.reject("AUTH_REQUIRED");
        }
        else {
          res = utils.resolve(authData);
        }
        return res;
      });
    },

    /**
     * Helper method to turn provider names into AuthProvider instances
     *
     * @param {object} stringOrProvider Provider ID string to AuthProvider instance
     * @return {firebdase.auth.AuthProvider} A valid AuthProvider instance
     */
    _getProvider: function (stringOrProvider) {
      var provider;
      if (typeof stringOrProvider == "string") {
        var providerID = stringOrProvider.slice(0, 1).toUpperCase() + stringOrProvider.slice(1);
        provider = new firebase.auth[providerID+"AuthProvider"]();
      } else {
        provider = stringOrProvider;
      }
      return provider;
    },

    /**
     * Helper that returns a promise which resolves when the initial auth state has been
     * fetched from the Firebase server. This never rejects and resolves to undefined.
     *
     * @return {Promise<Object>} A promise fulfilled when the server returns initial auth state.
     */
    _initAuthResolver: function() {
      var auth = this._auth;

      return this._utils.promise(function(resolve) {
        var off;
        function callback() {
          // Turn off this onAuthStateChanged callback since we just needed to get the authentication data once.
          off();
          resolve();
        }
        off = auth.onAuthStateChanged(callback);
      });
    },

    /**
     * Utility method which can be used in a route's resolve() method to require that a route has
     * a logged in client.
     *
     * @returns {Promise<Object>} A promise fulfilled with the client's current authentication
     * state or rejected if the client is not authenticated.
     */
    requireAuth: function() {
      return this._routerMethodOnAuthPromise(true, this);
    },

    /**
     * Utility method which can be used in a route's resolve() method to grab the current
     * authentication data.
     *
     * @returns {Promise<Object|null>} A promise fulfilled with the client's current authentication
     * state, which will be null if the client is not authenticated.
     */
    waitForAuth: function() {
      return this._routerMethodOnAuthPromise(false, this);
    },


    /*********************/
    /*  User Management  */
    /*********************/
    /**
     * Creates a new email/password user. Note that this function only creates the user, if you
     * wish to log in as the newly created user, call $authWithPassword() after the promise for
     * this method has been resolved.
     *
     * @param {string} email An email for this user.
     * @param {string} password A password for this user.
     * @return {Promise<Object>} A promise fulfilled with the user object, which contains the
     * uid of the created user.
     */
    createUserWithEmailAndPassword: function(email, password) {
      return this._utils.Q(this._auth.createUserWithEmailAndPassword(email, password).then);
    },

    /**
     * Changes the password for an email/password user.
     *
     * @param {string} password A new password for the current user
     * @return {Promise<>} An empty promise fulfilled once the password change is complete.
     */
    updatePassword: function(password) {
      var user = this.getAuth();
      if (user) {
        return this._utils.Q(user.updatePassword(password).then);
      } else {
        var badDeferred = this._utils.defer();
        badDeferred.reject("No current user to change password of.");
        return badDeferred.promise;
      }
    },

    /**
     * Changes the email for an email/password user.
     *
     * @param {String} email The new email for the currently logged in user.
     * @return {Promise<>} An empty promise fulfilled once the email change is complete.
     */
    updateEmail: function(email) {
      var user = this.getAuth();
      if (user) {
        return this._utils.Q(user.updateEmail(email).then);
      } else {
        var badDeferred = this._utils.defer();
        badDeferred.reject("No current user to change email of.");
        return badDeferred.promise;
      }
    },

    /**
     * Deletes the currently logged in user.
     *
     * @return {Promise<>} An empty promise fulfilled once the user is removed.
     */
    deleteUser: function() {
      var user = this.getAuth();
      if (user) {
        return this._utils.Q(user.delete().then);
      } else {
        var badDeferred = this._utils.defer();
        badDeferred.reject("No current user to delete.");
        return badDeferred.promise;
      }
    },


    /**
     * Sends a password reset email to an email/password user.
     *
     * @param {string} email An email address to send a password reset to.
     * @return {Promise<>} An empty promise fulfilled once the reset password email is sent.
     */
    sendPasswordResetEmail: function(email) {
      return this._utils.Q(this._auth.sendPasswordResetEmail(email).then);
    }
  };
})();
