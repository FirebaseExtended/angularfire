/* istanbul ignore next */
(function() {
  'use strict';
  var FirebaseAuth;

  // Define a service which provides user authentication and management.
  angular.module('firebase').factory('$firebaseAuth', [
    '$q', '$parse', function($q, $parse) {
      // This factory returns an object containing the current authentication state of the client.
      // This service takes one argument:
      //
      //   * `ref`: A Firebase reference.
      //
      // The returned object contains methods for authenticating clients, retrieving authentication
      // state, and managing users.
      return function(ref) {
        var auth = new FirebaseAuth($q, $parse, ref);
        return auth.construct();
      };
    }
  ]);

  FirebaseAuth = function($q, $parse, ref) {
    this._q = $q;
    this._parse = $parse;

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
        $bindTo:this.bindTo.bind(this),

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
    // Common login completion handler for all authentication methods.
    _onLoginHandler: function(deferred, error, authData) {
      if (error !== null) {
        deferred.reject(error);
      } else {
        deferred.resolve(authData);
      }
    },

    // Authenticates the Firebase reference with a custom authentication token.
    authWithCustomToken: function(authToken, options) {
      var deferred = this._q.defer();

      this._ref.authWithCustomToken(authToken, this._onLoginHandler.bind(this, deferred), options);

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
      }
    },


    /**************************/
    /*  Authentication State  */
    /**************************/
    // Asynchronously fires the provided callback with the current authentication data every time
    // the authentication data changes. It also fires as soon as the authentication data is
    // retrieved from the server.
    onAuth: function(callback, context) {
      var self = this;

      this._ref.onAuth(callback, context);

      // Return a method to detach the `onAuth()` callback.
      return function() {
        self._ref.offAuth(callback, context);
      };
    },

    // Synchronously retrieves the current authentication data.
    getAuth: function() {
      return this._ref.getAuth();
    },

    // Helper onAuth() callback method for the two router-related methods.
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

    // Returns a promise which is resolved if the client is authenticated and rejects otherwise.
    // This can be used to require that a route has a logged in user.
    requireAuth: function() {
      return this._routerMethodOnAuthPromise(true);
    },

    // Returns a promise which is resolved with the client's current authenticated data. This can
    // be used in a route's resolve() method to grab the current authentication data.
    waitForAuth: function() {
      return this._routerMethodOnAuthPromise(false);
    },

    // Bind the authentication state to a property on scope.
    // Returns a deregistration function, which is called automatically when scope is destroyed.
    bindTo:function(scope,propertyName){
      var ref = this._ref;
      var parsed = this._parse(propertyName);

      function callback(authData){
        scope.$evalAsync(function(){
          parsed.assign(scope,authData);
        });
      }

      function deregister(){
        ref.offAuth(callback);
      }

      scope.$on('$destroy',deregister);

      ref.onAuth(callback);

      return deregister;
    },


    /*********************/
    /*  User Management  */
    /*********************/
    // Creates a new email/password user. Returns a promise fulfilled with the uid of the created
    // user. Note that this function only creates the user, if you wish to log in as the newly
    // created user, call $authWithPassword() after the promise for this method has been resolved.
    createUser: function(email, password) {
      var deferred = this._q.defer();

      this._ref.createUser({
        email: email,
        password: password
      }, function(error, user) {
        if (error !== null) {
          deferred.reject(error);
        } else {
          deferred.resolve(user);
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
