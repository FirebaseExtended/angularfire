/*!
 angularfire v0.8.0-pre1 2014-06-19
* https://github.com/firebase/angularFire
* Copyright (c) 2014 Firebase, Inc.
* MIT LICENSE: http://firebase.mit-license.org/
*/

// AngularFire is an officially supported AngularJS binding for Firebase.
// The bindings let you associate a Firebase URL with a model (or set of
// models), and they will be transparently kept in sync across all clients
// currently using your app. The 2-way data binding offered by AngularJS works
// as normal, except that the changes are also sent to all other clients
// instead of just a server.
(function(exports) {
  "use strict";

// Define the `firebase` module under which all AngularFire
// services will live.
  angular.module("firebase", [])
    .value("Firebase", exports.Firebase)

    // used in conjunction with firebaseUtils.debounce function, this is the
    // amount of time we will wait for additional records before triggering
    // Angular's digest scope to dirty check and re-render DOM elements. A
    // larger number here significantly improves performance when working with
    // big data sets that are frequently changing in the DOM, but delays the
    // speed at which each record is rendered in real-time. A number less than
    // 100ms will usually be optimal.
    .value('firebaseBatchDelay', 50 /* milliseconds */);

})(window);
(function() {
  'use strict';
  angular.module('firebase').factory('$FirebaseArray', ["$q", "$log", "$firebaseUtils",
    function($q, $log, $firebaseUtils) {
      function FirebaseArray($firebase, RecordFactory) {
        $firebaseUtils.assertValidRecordFactory(RecordFactory);
        this._list = [];
        this._factory = new RecordFactory();
        this._inst = $firebase;
        this._promise = this._init();
        return this._list;
      }

      /**
       * Array.isArray will not work on object which extend the Array class.
       * So instead of extending the Array class, we just return an actual array.
       * However, it's still possible to extend FirebaseArray and have the public methods
       * appear on the array object. We do this by iterating the prototype and binding
       * any method that is not prefixed with an underscore onto the final array we return.
       */
      FirebaseArray.prototype = {
        add: function(data) {
          return this.inst().push(data);
        },

        save: function(indexOrItem) {
          var item = this._resolveItem(indexOrItem);
          if( !angular.isDefined(item) ) {
            throw new Error('Invalid item or index', indexOrItem);
          }
          var key = angular.isDefined(item)? this._factory.getKey(item) : null;
          return this.inst().set(key, this._factory.toJSON(item), this._compile);
        },

        remove: function(indexOrItem) {
          return this.inst().remove(this.keyAt(indexOrItem));
        },

        keyAt: function(indexOrItem) {
          return this._factory.getKey(this._resolveItem(indexOrItem));
        },

        indexFor: function(key) {
          var factory = this._factory;
          return this._list.findIndex(function(rec) { return factory.getKey(rec) === key; });
        },

        loaded: function() { return this._promise; },

        inst: function() { return this._inst; },

        destroy: function(err) {
          if( err ) { $log.error(err); }
          if( this._list ) {
            $log.debug('destroy called for FirebaseArray: '+this.ref.toString());
            var ref = this.inst().ref();
            ref.on('child_added', this._serverAdd, this);
            ref.on('child_moved', this._serverMove, this);
            ref.on('child_changed', this._serverUpdate, this);
            ref.on('child_removed', this._serverRemove, this);
            this._list.length = 0;
            this._list = null;
          }
        },

        _serverAdd: function(snap, prevChild) {
          var dat = this._factory.create(snap);
          var i = prevChild === null? 0 : this.indexFor(prevChild);
          if( i === -1 ) { i = this._list.length; }
          this._list.splice(i, 0, dat);
          this._compile();
        },

        _serverRemove: function() {},

        _serverUpdate: function() {},

        _serverMove: function() {},

        _compile: function() {
          // does nothing for now
        },

        _resolveItem: function(indexOrItem) {
          return angular.isNumber(indexOrItem)? this._list[indexOrItem] : indexOrItem;
        },

        _init: function() {
          var self = this;
          var list = self._list;
          var def = $q.defer();
          var ref = self.inst().ref();

          // we return _list, but apply our public prototype to it first
          // see FirebaseArray.prototype's assignment comments
          var methods = $firebaseUtils.getPublicMethods(self);
          angular.forEach(methods, function(fn, key) {
            list[key] = fn.bind(self);
          });

          // we debounce the compile function so that angular's digest only needs to do
          // dirty checking once for each "batch" of updates that come in close proximity
          self._compile = $firebaseUtils.debounce(self._compile.bind(self), $firebaseUtils.batchDelay);

          // listen for changes at the Firebase instance
          ref.once('value', function() { def.resolve(list); }, def.reject.bind(def));
          ref.on('child_added', self._serverAdd, self.destroy, self);
          ref.on('child_moved', self._serverMove, self.destroy, self);
          ref.on('child_changed', self._serverUpdate, self.destroy, self);
          ref.on('child_removed', self._serverRemove, self.destroy, self);

          return def.promise;
        }
      };

      return FirebaseArray;
    }
  ]);




//  // Return a synchronized array
//  object.$asArray = function($scope) {
//    var sync = new ReadOnlySynchronizedArray(object);
//    if( $scope ) {
//      $scope.$on('$destroy', sync.dispose.bind(sync));
//    }
//    var arr = sync.getList();
//    arr.$firebase = object;
//    return arr;
//  };
  /****** OLD STUFF *********/
//  function ReadOnlySynchronizedArray($obj, eventCallback) {
//    this.subs = []; // used to track event listeners for dispose()
//    this.ref = $obj.$getRef();
//    this.eventCallback = eventCallback||function() {};
//    this.list = this._initList();
//    this._initListeners();
//  }
//
//  ReadOnlySynchronizedArray.prototype = {
//    getList: function() {
//      return this.list;
//    },
//
//    add: function(data) {
//      var key = this.ref.push().name();
//      var ref = this.ref.child(key);
//      if( arguments.length > 0 ) { ref.set(parseForJson(data), this._handleErrors.bind(this, key)); }
//      return ref;
//    },
//
//    set: function(key, newValue) {
//      this.ref.child(key).set(parseForJson(newValue), this._handleErrors.bind(this, key));
//    },
//
//    update: function(key, newValue) {
//      this.ref.child(key).update(parseForJson(newValue), this._handleErrors.bind(this, key));
//    },
//
//    setPriority: function(key, newPriority) {
//      this.ref.child(key).setPriority(newPriority);
//    },
//
//    remove: function(key) {
//      this.ref.child(key).remove(this._handleErrors.bind(null, key));
//    },
//
//    posByKey: function(key) {
//      return findKeyPos(this.list, key);
//    },
//
//    placeRecord: function(key, prevId) {
//      if( prevId === null ) {
//        return 0;
//      }
//      else {
//        var i = this.posByKey(prevId);
//        if( i === -1 ) {
//          return this.list.length;
//        }
//        else {
//          return i+1;
//        }
//      }
//    },
//
//    getRecord: function(key) {
//      var i = this.posByKey(key);
//      if( i === -1 ) { return null; }
//      return this.list[i];
//    },
//
//    dispose: function() {
//      var ref = this.ref;
//      this.subs.forEach(function(s) {
//        ref.off(s[0], s[1]);
//      });
//      this.subs = [];
//    },
//
//    _serverAdd: function(snap, prevId) {
//      var data = parseVal(snap.name(), snap.val());
//      this._moveTo(snap.name(), data, prevId);
//      this._handleEvent('child_added', snap.name(), data);
//    },
//
//    _serverRemove: function(snap) {
//      var pos = this.posByKey(snap.name());
//      if( pos !== -1 ) {
//        this.list.splice(pos, 1);
//        this._handleEvent('child_removed', snap.name(), this.list[pos]);
//      }
//    },
//
//    _serverChange: function(snap) {
//      var pos = this.posByKey(snap.name());
//      if( pos !== -1 ) {
//        this.list[pos] = applyToBase(this.list[pos], parseVal(snap.name(), snap.val()));
//        this._handleEvent('child_changed', snap.name(), this.list[pos]);
//      }
//    },
//
//    _serverMove: function(snap, prevId) {
//      var id = snap.name();
//      var oldPos = this.posByKey(id);
//      if( oldPos !== -1 ) {
//        var data = this.list[oldPos];
//        this.list.splice(oldPos, 1);
//        this._moveTo(id, data, prevId);
//        this._handleEvent('child_moved', snap.name(), data);
//      }
//    },
//
//    _moveTo: function(id, data, prevId) {
//      var pos = this.placeRecord(id, prevId);
//      this.list.splice(pos, 0, data);
//    },
//
//    _handleErrors: function(key, err) {
//      if( err ) {
//        this._handleEvent('error', null, key);
//        console.error(err);
//      }
//    },
//
//    _handleEvent: function(eventType, recordId, data) {
//      // console.log(eventType, recordId);
//      this.eventCallback(eventType, recordId, data);
//    },
//
//    _initList: function() {
//      var list = [];
//      list.$indexOf = this.posByKey.bind(this);
//      list.$add = this.add.bind(this);
//      list.$remove = this.remove.bind(this);
//      list.$set = this.set.bind(this);
//      list.$update = this.update.bind(this);
//      list.$move = this.setPriority.bind(this);
//      list.$rawData = function(key) { return parseForJson(this.getRecord(key)); }.bind(this);
//      list.$off = this.dispose.bind(this);
//      return list;
//    },
//
//    _initListeners: function() {
//      this._monit('child_added', this._serverAdd);
//      this._monit('child_removed', this._serverRemove);
//      this._monit('child_changed', this._serverChange);
//      this._monit('child_moved', this._serverMove);
//    },
//
//    _monit: function(event, method) {
//      this.subs.push([event, this.ref.on(event, method.bind(this))]);
//    }
//  };
//
//  function applyToBase(base, data) {
//    // do not replace the reference to objects contained in the data
//    // instead, just update their child values
//    if( isObject(base) && isObject(data) ) {
//      var key;
//      for(key in base) {
//        if( key !== '$id' && base.hasOwnProperty(key) && !data.hasOwnProperty(key) ) {
//          delete base[key];
//        }
//      }
//      for(key in data) {
//        if( data.hasOwnProperty(key) ) {
//          base[key] = data[key];
//        }
//      }
//      return base;
//    }
//    else {
//      return data;
//    }
//  }
//
//  function isObject(x) {
//    return typeof(x) === 'object' && x !== null;
//  }
//
//  function findKeyPos(list, key) {
//    for(var i = 0, len = list.length; i < len; i++) {
//      if( list[i].$id === key ) {
//        return i;
//      }
//    }
//    return -1;
//  }
//
//  function parseForJson(data) {
//    if( data && typeof(data) === 'object' ) {
//      delete data.$id;
//      if( data.hasOwnProperty('.value') ) {
//        data = data['.value'];
//      }
//    }
//    if( data === undefined ) {
//      data = null;
//    }
//    return data;
//  }
//
//  function parseVal(id, data) {
//    if( typeof(data) !== 'object' || !data ) {
//      data = { '.value': data };
//    }
//    data.$id = id;
//    return data;
//  }
})();
(function() {
  'use strict';
  angular.module('firebase').factory('$FirebaseObject', function() {
    return function() {};
  });
})();
(function() {
  'use strict';
  angular.module('firebase').factory('$FirebaseRecordFactory', function() {
    return function() {
      return {
        create: function (snap) {
          return objectify(snap.val(), snap.name());
        },

        update: function (rec, snap) {
          return applyToBase(rec, objectify(snap.val(), snap.name()));
        },

        toJSON: function (rec) {
          var dat = angular.isFunction(rec.toJSON)? rec.toJSON() : rec;
          return this._cleanData(dat);
        },

        destroy: function (rec) {
          if( typeof(rec.off) === 'function' ) {
            rec.off();
          }
          return rec;
        },

        getKey: function (rec) {
          console.log('getKey', rec);
          if( rec.hasOwnProperty('$id') ) {
            return rec.$id;
          }
          else if( angular.isFunction(rec.getId) ) {
            return rec.getId();
          }
          else {
            throw new Error('No valid ID for record', rec);
          }
        },

        getPriority: function (rec) {
          if( rec.hasOwnProperty('$priority') ) {
            return rec.$priority;
          }
          else if( angular.isFunction(rec.getPriority) ) {
            return rec.getPriority();
          }
          else {
            return null; 
          }
        },

        _cleanData: function(data) {
          delete data.$id;
          return data;
        }
      };
    };
  });


  function objectify(data, id) {
    if( !angular.isObject(data) ) {
      data = { ".value": data };
    }
    if( arguments.length > 1 ) {
      data.$id = id;
    }
    console.log('objectinfy', data);//debug
    return data;
  }

  function applyToBase(base, data) {
    console.log('applyToBase', base, data); //debug
    // do not replace the reference to objects contained in the data
    // instead, just update their child values
    var key;
    for(key in base) {
      if( base.hasOwnProperty(key) &&  key !== '$id' && !data.hasOwnProperty(key) ) {
        delete base[key];
      }
    }
    for(key in data) {
      if( data.hasOwnProperty(key) ) {
        base[key] = data[key];
      }
    }
    return base;
  }

})();
(function() {
  'use strict';

  angular.module("firebase")

    // The factory returns an object containing the value of the data at
    // the Firebase location provided, as well as several methods. It
    // takes one or two arguments:
    //
    //   * `ref`: A Firebase reference. Queries or limits may be applied.
    //   * `config`: An object containing any of the advanced config options explained in API docs
    .factory("$firebase", [ "$q", "$firebaseUtils", "$firebaseConfig",
      function ($q, $firebaseUtils, $firebaseConfig) {
        function AngularFire(ref, config) {
          // make the new keyword optional
          if (!(this instanceof AngularFire)) {
            return new AngularFire(ref, config);
          }
          this._config = $firebaseConfig(config);
          this._ref = ref;
          this._array = null;
          this._object = null;
          this._assertValidConfig(ref, this._config);
        }

        AngularFire.prototype = {
          ref: function () {
            return this._ref;
          },

          push: function (data) {
            var def = $q.defer();
            var ref = this._ref.push();
            var done = this._handle(def, ref);
            if (arguments.length > 0) {
              ref.set(data, done);
            }
            else {
              done();
            }
            return def.promise;
          },

          set: function (key, data) {
            var ref = this._ref;
            var def = $q.defer();
            if (arguments.length > 1) {
              ref = ref.child(key);
            }
            else {
              data = key;
            }
            ref.set(data, this._handle(def));
            return def.promise;
          },

          remove: function (key) {
            var ref = this._ref;
            var def = $q.defer();
            if (arguments.length > 0) {
              ref = ref.child(key);
            }
            ref.remove(this._handle(def));
            return def.promise;
          },

          update: function (key, data) {
            var ref = this._ref;
            var def = $q.defer();
            if (arguments.length > 1) {
              ref = ref.child(key);
            }
            else {
              data = key;
            }
            ref.update(data, this._handle(def));
            return def.promise;
          },

          transaction: function () {
          }, //todo

          asObject: function () {
            if (!this._object) {
              this._object = new this._config.objectFactory(this);
            }
            return this._object;
          },

          asArray: function () {
            if (!this._array) {
              this._array = new this._config.arrayFactory(this, this._config.recordFactory);
            }
            return this._array;
          },

          _handle: function (def) {
            var args = Array.prototype.slice.call(arguments, 1);
            return function (err) {
              if (err) {
                def.reject(err);
              }
              else {
                def.resolve.apply(def, args);
              }
            };
          },

          _assertValidConfig: function (ref, cnf) {
            $firebaseUtils.assertValidRef(ref, 'Must pass a valid Firebase reference ' +
              'to $firebase (not a string or URL)');
            $firebaseUtils.assertValidRecordFactory(cnf.recordFactory);
            if (typeof(cnf.arrayFactory) !== 'function') {
              throw new Error('config.arrayFactory must be a valid function');
            }
            if (typeof(cnf.objectFactory) !== 'function') {
              throw new Error('config.arrayFactory must be a valid function');
            }
          }
        };

        return AngularFire;
      }
    ]);
})();
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
'use strict';

// Shim Array.indexOf for IE compatibility.
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (searchElement, fromIndex) {
    if (this === undefined || this === null) {
      throw new TypeError("'this' is null or not defined");
    }
    // Hack to convert object.length to a UInt32
    // jshint -W016
    var length = this.length >>> 0;
    fromIndex = +fromIndex || 0;
    // jshint +W016

    if (Math.abs(fromIndex) === Infinity) {
      fromIndex = 0;
    }

    if (fromIndex < 0) {
      fromIndex += length;
      if (fromIndex < 0) {
        fromIndex = 0;
      }
    }

    for (;fromIndex < length; fromIndex++) {
      if (this[fromIndex] === searchElement) {
        return fromIndex;
      }
    }

    return -1;
  };
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
      fToBind = this,
      fNOP = function () {},
      fBound = function () {
        return fToBind.apply(this instanceof fNOP && oThis
            ? this
            : oThis,
          aArgs.concat(Array.prototype.slice.call(arguments)));
      };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(predicate) {
      if (this == null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var list = Object(this);
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      var value;

      for (var i = 0; i < length; i++) {
        if (i in list) {
          value = list[i];
          if (predicate.call(thisArg, value, i, list)) {
            return i;
          }
        }
      }
      return -1;
    }
  });
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
//if (!Array.prototype.find) {
//  Object.defineProperty(Array.prototype, 'find', {
//    enumerable: false,
//    configurable: true,
//    writable: true,
//    value: function(predicate) {
//      if (this == null) {
//        throw new TypeError('Array.prototype.find called on null or undefined');
//      }
//      if (typeof predicate !== 'function') {
//        throw new TypeError('predicate must be a function');
//      }
//      var list = Object(this);
//      var length = list.length >>> 0;
//      var thisArg = arguments[1];
//      var value;
//
//      for (var i = 0; i < length; i++) {
//        if (i in list) {
//          value = list[i];
//          if (predicate.call(thisArg, value, i, list)) {
//            return value;
//          }
//        }
//      }
//      return undefined;
//    }
//  });
//}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
if (typeof Object.create != 'function') {
  (function () {
    var F = function () {};
    Object.create = function (o) {
      if (arguments.length > 1) {
        throw Error('Second argument not supported');
      }
      if (o === null) {
        throw Error('Cannot set a null [[Prototype]]');
      }
      if (typeof o != 'object') {
        throw TypeError('Argument must be an object');
      }
      F.prototype = o;
      return new F();
    };
  })();
}
(function() {
  'use strict';

  angular.module('firebase')
    .factory('$firebaseConfig', ["$FirebaseRecordFactory", "$FirebaseArray", "$FirebaseObject",
      function($FirebaseRecordFactory, $FirebaseArray, $FirebaseObject) {
        return function(configOpts) {
          return angular.extend({
            recordFactory: $FirebaseRecordFactory,
            arrayFactory: $FirebaseArray,
            objectFactory: $FirebaseObject
          }, configOpts);
        };
      }
    ])

    .factory('$firebaseUtils', ["$timeout", "firebaseBatchDelay", '$FirebaseRecordFactory',
      function($timeout, firebaseBatchDelay, $FirebaseRecordFactory) {
        function debounce(fn, wait, options) {
          if( !wait ) { wait = 0; }
          var opts = angular.extend({maxWait: wait*25||250}, options);
          var to, startTime = null, maxWait = opts.maxWait;
          function cancelTimer() {
            if( to ) { clearTimeout(to); }
          }

          function init() {
            if( !startTime ) {
              startTime = Date.now();
            }
          }

          function delayLaunch() {
            init();
            cancelTimer();
            if( Date.now() - startTime > maxWait ) {
              launch();
            }
            else {
              to = timeout(launch, wait);
            }
          }

          function timeout() {
            if( opts.scope ) {
              to = setTimeout(function() {
                try {
                  //todo should this be $digest?
                  opts.scope.$apply(launch);
                }
                catch(e) {
                  console.error(e);
                }
              }, wait);
            }
            else {
              to = $timeout(launch, wait);
            }
          }

          function launch() {
            startTime = null;
            fn();
          }

          return delayLaunch;
        }

        function assertValidRef(ref, msg) {
          if( !angular.isObject(ref) ||
            typeof(ref.ref) !== 'function' ||
            typeof(ref.transaction) !== 'function' ) {
            throw new Error(msg || 'Invalid Firebase reference');
          }
        }

        function assertValidRecordFactory(factory) {
          if( !angular.isFunction(factory) || !angular.isObject(factory.prototype) ) {
            throw new Error('Invalid argument passed for $FirebaseRecordFactory; must be a valid Class function');
          }
          var proto = $FirebaseRecordFactory.prototype;
          for (var key in proto) {
            if (proto.hasOwnProperty(key) && angular.isFunction(proto[key]) && key !== 'isValidFactory') {
              if( angular.isFunction(factory.prototype[key]) ) {
                throw new Error('Record factory does not have '+key+' method');
              }
            }
          }
        }

        // http://stackoverflow.com/questions/7509831/alternative-for-the-deprecated-proto
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
        function inherit(childClass,parentClass) {
          childClass.prototype = Object.create(parentClass.prototype);
          childClass.prototype.constructor = childClass; // restoring proper constructor for child class
        }

        function getPublicMethods(inst) {
          var methods = {};
          for (var key in inst) {
            //noinspection JSUnfilteredForInLoop
            if (typeof(inst[key]) === 'function' && !/^_/.test(key)) {
              methods[key] = inst[key];
            }
          }
          return methods;
        }

        return {
          debounce: debounce,
          assertValidRef: assertValidRef,
          assertValidRecordFactory: assertValidRecordFactory,
          batchDelay: firebaseBatchDelay,
          inherit: inherit,
          getPublicMethods: getPublicMethods
        };
      }]);

})();