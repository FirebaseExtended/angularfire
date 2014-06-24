/*!
 angularfire v0.8.0-pre1 2014-06-24
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
  angular.module('firebase').factory('$FirebaseArray', ["$log", "$firebaseUtils",
    function($log, $firebaseUtils) {
      function FirebaseArray($firebase) {
        this._observers = [];
        this._events = [];
        this._list = [];
        this._factory = $firebase.getRecordFactory();
        this._inst = $firebase;
        this._promise = this._init();
        return this._list;
      }

      /**
       * Array.isArray will not work on object which extend the Array class.
       * So instead of extending the Array class, we just return an actual array.
       * However, it's still possible to extend FirebaseArray and have the public methods
       * appear on the array object. We do this by iterating the prototype and binding
       * any method that is not prefixed with an underscore onto the final array.
       */
      FirebaseArray.prototype = {
        add: function(data) {
          return this.inst().push(data);
        },

        save: function(indexOrItem) {
          var item = this._resolveItem(indexOrItem);
          var key = this.keyAt(item);
          if( key !== null ) {
            return this.inst().set(key, this._factory.toJSON(item));
          }
          else {
            return $firebaseUtils.reject('Invalid record; could determine its key: '+indexOrItem);
          }
        },

        remove: function(indexOrItem) {
          var key = this.keyAt(indexOrItem);
          if( key !== null ) {
            return this.inst().remove(this.keyAt(indexOrItem));
          }
          else {
            return $firebaseUtils.reject('Invalid record; could not find key: '+indexOrItem);
          }
        },

        keyAt: function(indexOrItem) {
          var item = this._resolveItem(indexOrItem);
          return angular.isUndefined(item)? null : this._factory.getKey(item);
        },

        indexFor: function(key) {
          // todo optimize and/or cache these? they wouldn't need to be perfect
          // todo since we can call getKey() on the cache to ensure records have
          // todo not been altered
          var factory = this._factory;
          return this._list.findIndex(function(rec) { return factory.getKey(rec) === key; });
        },

        loaded: function() { return this._promise; },

        inst: function() { return this._inst; },

        watch: function(cb, context) {
          var list = this._observers;
          list.push([cb, context]);
          // an off function for cancelling the listener
          return function() {
            var i = list.findIndex(function(parts) {
              return parts[0] === cb && parts[1] === context;
            });
            if( i > -1 ) {
              list.splice(i, 1);
            }
          };
        },

        destroy: function(err) {
          if( err ) { $log.error(err); }
          if( !this._isDestroyed ) {
            this._isDestroyed = true;
            $log.debug('destroy called for FirebaseArray: '+this._inst.ref().toString());
            var ref = this.inst().ref();
            ref.off('child_added', this._serverAdd, this);
            ref.off('child_moved', this._serverMove, this);
            ref.off('child_changed', this._serverUpdate, this);
            ref.off('child_removed', this._serverRemove, this);
            this._list.length = 0;
            this._list = null;
          }
        },

        _serverAdd: function(snap, prevChild) {
          var i = this.indexFor(snap.name());
          if( i > -1 ) {
            this._serverUpdate(snap);
            if( prevChild !== null && i !== this.indexFor(prevChild)+1 ) {
              this._serverMove(snap, prevChild);
            }
          }
          else {
            var dat = this._factory.create(snap);
            this._addAfter(dat, prevChild);
            this._addEvent('child_added', snap.name(), prevChild);
            this._compile();
          }
        },

        _serverRemove: function(snap) {
          var dat = this._spliceOut(snap.name());
          if( angular.isDefined(dat) ) {
            this._addEvent('child_removed', snap.name());
            this._compile();
          }
        },

        _serverUpdate: function(snap) {
          var i = this.indexFor(snap.name());
          if( i >= 0 ) {
            var oldData = this._factory.toJSON(this._list[i]);
            this._list[i] = this._factory.update(this._list[i], snap);
            if( !angular.equals(oldData, this._list[i]) ) {
              this._addEvent('child_changed', snap.name());
              this._compile();
            }
          }
        },

        _serverMove: function(snap, prevChild) {
          var dat = this._spliceOut(snap.name());
          if( angular.isDefined(dat) ) {
            this._addAfter(dat, prevChild);
            this._addEvent('child_moved', snap.name(), prevChild);
            this._compile();
          }
        },

        _addEvent: function(event, key, prevChild) {
          var dat = {event: event, key: key};
          if( arguments.length > 2 ) { dat.prevChild = prevChild; }
          this._events.push(dat);
        },

        _addAfter: function(dat, prevChild) {
          var i;
          if( prevChild === null ) {
            i = 0;
          }
          else {
            i = this.indexFor(prevChild)+1;
            if( i === 0 ) { i = this._list.length; }
          }
          this._list.splice(i, 0, dat);
        },

        _spliceOut: function(key) {
          var i = this.indexFor(key);
          if( i > -1 ) {
            return this._list.splice(i, 1)[0];
          }
        },

        _notify: function() {
          var self = this;
          var events = self._events;
          self._events = [];
          if( events.length ) {
            self._observers.forEach(function(parts) {
              parts[0].call(parts[1], events);
            });
          }
        },

        _resolveItem: function(indexOrItem) {
          return angular.isNumber(indexOrItem)? this._list[indexOrItem] : indexOrItem;
        },

        _init: function() {
          var self = this;
          var list = self._list;
          var def = $firebaseUtils.defer();
          var ref = self.inst().ref();

          // we return _list, but apply our public prototype to it first
          // see FirebaseArray.prototype's assignment comments
          $firebaseUtils.getPublicMethods(self, function(fn, key) {
            list[key] = fn.bind(self);
          });

          // we debounce the compile function so that angular's digest only needs to do
          // dirty checking once for each "batch" of updates that come in close proximity
          // we fire the notifications within the debounce result so they happen in the digest
          // and don't need to bother with $digest/$apply calls.
          self._compile = $firebaseUtils.debounce(self._notify.bind(self), $firebaseUtils.batchDelay);

          // listen for changes at the Firebase instance
          ref.on('child_added', self._serverAdd, self.destroy, self);
          ref.on('child_moved', self._serverMove, self.destroy, self);
          ref.on('child_changed', self._serverUpdate, self.destroy, self);
          ref.on('child_removed', self._serverRemove, self.destroy, self);
          ref.once('value', function() {
            if( self._isDestroyed ) {
              def.reject('instance was destroyed before load completed');
            }
            else {
              def.resolve(list);
            }
          }, def.reject.bind(def));

          return def.promise;
        }
      };

      return FirebaseArray;
    }
  ]);
})();
(function() {
  'use strict';
  angular.module('firebase').factory('$FirebaseObject', [
    '$parse', '$firebaseUtils',
    function($parse, $firebaseUtils) {
      function FirebaseObject($firebase) {
        var self = this, def = $firebaseUtils.defer();
        var factory = $firebase.getRecordFactory();
        self.$conf = {
          def: def,
          inst: $firebase,
          bound: null,
          factory: factory,
          serverUpdate: function(snap) {
            factory.update(self, snap);
            compile();
          }
        };
        self.$id = $firebase.ref().name();

        var compile = $firebaseUtils.debounce(function() {
          if( self.$conf.bound ) {
            self.$conf.bound.set(self.toJSON());
          }
        });

        // prevent iteration and accidental overwrite of props
        var methods = ['$id', '$conf']
          .concat(Object.keys(FirebaseObject.prototype));
        angular.forEach(methods, function(key) {
          readOnlyProp(self, key, key === '$bound');
        });

        // listen for updates to the data
        self.$conf.inst.ref().on('value', self.$conf.serverUpdate);
        // resolve the loaded promise once data is downloaded
        self.$conf.inst.ref().once('value',
          def.resolve.bind(def, self),
          def.reject.bind(def)
        );
      }

      FirebaseObject.prototype = {
        save: function() {
          return this.$conf.inst.set(this.$conf.factory.toJSON(this));
        },

        loaded: function() {
          return this.$conf.def.promise;
        },

        inst: function() {
          return this.$conf.inst;
        },

        bindTo: function(scope, varName) {
          var self = this, loaded = false;
          if( self.$conf.bound ) {
            throw new Error('Can only bind to one scope variable at a time');
          }

          var parsed = $parse(varName);

          // monitor scope for any changes
          var off = scope.$watchCollection(varName, function() {
            var data = self.$conf.factory.toJSON(parsed(scope));
            if( loaded ) { self.$conf.inst.set(data); }
          });

          var unbind = function() {
            if( self.$conf.bound ) {
              off();
              self.$conf.bound = null;
            }
          };

          // expose a few useful methods to other methods
          var $bound = self.$conf.bound = {
            set: function(data) {
              parsed.assign(scope, data);
            },
            get: function() {
              return parsed(scope);
            },
            unbind: unbind
          };

          scope.$on('$destroy', $bound.unbind);

          var def = $firebaseUtils.defer();
          self.loaded().then(function() {
            loaded = true;
            def.resolve(unbind);
          }, def.reject.bind(def));

          return def.promise;
        },

        destroy: function() {
          var self = this;
          if( !self.$isDestroyed ) {
            self.$isDestroyed = true;
            self.$conf.inst.ref().off('value', self.$conf.serverUpdate);
            if( self.$conf.bound ) {
              self.$conf.bound.unbind();
            }
            self.forEach(function(v,k) {
              delete self[k];
            });
            self.$isDestroyed = true;
          }
        },

        toJSON: function() {
          var out = {};
          this.forEach(function(v,k) {
            out[k] = v;
          });
          return out;
        },

        forEach: function(iterator, context) {
          var self = this;
          angular.forEach(Object.keys(self), function(k) {
            if( !k.match(/^\$/) ) {
              iterator.call(context, self[k], k, self);
            }
          });
        }
      };

      return FirebaseObject;
    }
  ]);

  function readOnlyProp(obj, key, writable) {
    if( Object.defineProperty ) {
      Object.defineProperty(obj, key, {
        writable: writable||false,
        enumerable: false,
        value: obj[key]
      });
    }
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
    .factory("$firebase", [ "$firebaseUtils", "$firebaseConfig",
      function ($firebaseUtils, $firebaseConfig) {
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
            var def = $firebaseUtils.defer();
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
            var def = $firebaseUtils.defer();
            if (arguments.length > 1) {
              ref = ref.child(key);
            }
            else {
              data = key;
            }
            ref.set(data, this._handle(def, ref));
            return def.promise;
          },

          remove: function (key) {
            var ref = this._ref;
            var def = $firebaseUtils.defer();
            if (arguments.length > 0) {
              ref = ref.child(key);
            }
            ref.remove(this._handle(def, ref));
            return def.promise;
          },

          update: function (key, data) {
            var ref = this._ref;
            var def = $firebaseUtils.defer();
            if (arguments.length > 1) {
              ref = ref.child(key);
            }
            else {
              data = key;
            }
            ref.update(data, this._handle(def, ref));
            return def.promise;
          },

          transaction: function (key, valueFn, applyLocally) {
            var ref = this._ref;
            if( angular.isFunction(key) ) {
              applyLocally = valueFn;
              valueFn = key;
            }
            else {
              ref = ref.child(key);
            }
            if( angular.isUndefined(applyLocally) ) {
              applyLocally = false;
            }

            var def = $firebaseUtils.defer();
            ref.transaction(valueFn, function(err, committed, snap) {
               if( err ) {
                 def.reject(err);
               }
               else {
                 def.resolve(committed? snap : null);
               }
            }, applyLocally);
            return def.promise;
          },

          asObject: function () {
            if (!this._object || this._object.$isDestroyed) {
              this._object = new this._config.objectFactory(this, this._config.recordFactory);
            }
            return this._object;
          },

          asArray: function () {
            if (!this._array || this._array._isDestroyed) {
              this._array = new this._config.arrayFactory(this, this._config.recordFactory);
            }
            return this._array;
          },

          getRecordFactory: function() {
            return this._config.recordFactory;
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
            if (!angular.isFunction(cnf.arrayFactory)) {
              throw new Error('config.arrayFactory must be a valid function');
            }
            if (!angular.isFunction(cnf.objectFactory)) {
              throw new Error('config.arrayFactory must be a valid function');
            }
            if (!angular.isObject(cnf.recordFactory)) {
              throw new Error('config.recordFactory must be a valid object with ' +
                'same methods as $FirebaseRecordFactory');
            }
          }
        };

        return AngularFire;
      }
    ]);
})();
(function() {
  'use strict';
  angular.module('firebase').factory('$firebaseRecordFactory', ['$log', function($log) {
    return {
      create: function (snap) {
        return objectify(snap.val(), snap.name(), snap.getPriority());
      },

      update: function (rec, snap) {
        return applyToBase(rec, objectify(snap.val(), null, snap.getPriority()));
      },

      toJSON: function (rec) {
        var dat;
        if( !angular.isObject(rec) ) {
          dat = angular.isDefined(rec)? rec : null;
        }
        else {
          dat = angular.isFunction(rec.toJSON)? rec.toJSON() : angular.extend({}, rec);
          if( angular.isObject(dat) ) {
            delete dat.$id;
            for(var key in dat) {
              if(dat.hasOwnProperty(key) && key !== '.value' && key !== '.priority' && key.match(/[.$\[\]#]/)) {
                $log.error('Invalid key in record (skipped):' + key);
                delete dat[key];
              }
            }
          }
          var pri = this.getPriority(rec);
          if( pri !== null ) {
            dat['.priority'] = pri;
          }
        }
        return dat;
      },

      destroy: function (rec) {
        if( typeof(rec.destroy) === 'function' ) {
          rec.destroy();
        }
        return rec;
      },

      getKey: function (rec) {
        if( rec.hasOwnProperty('$id') ) {
          return rec.$id;
        }
        else if( angular.isFunction(rec.getId) ) {
          return rec.getId();
        }
        else {
          return null;
        }
      },

      getPriority: function (rec) {
        if( rec.hasOwnProperty('.priority') ) {
          return rec['.priority'];
        }
        else if( angular.isFunction(rec.getPriority) ) {
          return rec.getPriority();
        }
        else {
          return null;
        }
      }
    };
  }]);


  function objectify(data, id, pri) {
    if( !angular.isObject(data) ) {
      data = { ".value": data };
    }
    if( angular.isDefined(id) && id !== null ) {
      data.$id = id;
    }
    if( angular.isDefined(pri) && pri !== null ) {
      data['.priority'] = pri;
    }
    return data;
  }

  function applyToBase(base, data) {
    // do not replace the reference to objects contained in the data
    // instead, just update their child values
    angular.forEach(base, function(val, key) {
      if( base.hasOwnProperty(key) &&  key !== '$id' && !data.hasOwnProperty(key) ) {
        delete base[key];
      }
    });
    angular.extend(base, data);
    return base;
  }

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

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
if (typeof Object.create != 'function') {
  (function () {
    var F = function () {};
    Object.create = function (o) {
      if (arguments.length > 1) {
        throw new Error('Second argument not supported');
      }
      if (o === null) {
        throw new Error('Cannot set a null [[Prototype]]');
      }
      if (typeof o != 'object') {
        throw new TypeError('Argument must be an object');
      }
      F.prototype = o;
      return new F();
    };
  })();
}

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
  Object.keys = (function () {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
      hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
      dontEnums = [
        'toString',
        'toLocaleString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'constructor'
      ],
      dontEnumsLength = dontEnums.length;

    return function (obj) {
      if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
}

// http://ejohn.org/blog/objectgetprototypeof/
if ( typeof Object.getPrototypeOf !== "function" ) {
  if ( typeof "test".__proto__ === "object" ) {
    Object.getPrototypeOf = function(object){
      return object.__proto__;
    };
  } else {
    Object.getPrototypeOf = function(object){
      // May break if the constructor has been tampered with
      return object.constructor.prototype;
    };
  }
}

(function() {
  'use strict';

  angular.module('firebase')
    .factory('$firebaseConfig', ["$firebaseRecordFactory", "$FirebaseArray", "$FirebaseObject",
      function($firebaseRecordFactory, $FirebaseArray, $FirebaseObject) {
        return function(configOpts) {
          var out = angular.extend({
            recordFactory: $firebaseRecordFactory,
            arrayFactory: $FirebaseArray,
            objectFactory: $FirebaseObject
          }, configOpts);
          return out;
        };
      }
    ])

    .factory('$firebaseUtils', ["$q", "$timeout", "firebaseBatchDelay", "$log",
      function($q, $timeout, firebaseBatchDelay, $log) {
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
                  $log.error(e);
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

        // http://stackoverflow.com/questions/7509831/alternative-for-the-deprecated-proto
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
        function inherit(childClass,parentClass) {
          childClass.prototype = Object.create(parentClass.prototype);
          childClass.prototype.constructor = childClass; // restoring proper constructor for child class
        }

        function getPrototypeMethods(inst, iterator, context) {
          var methods = {};
          var objProto = Object.getPrototypeOf({});
          var proto = angular.isFunction(inst) && angular.isObject(inst.prototype)?
            inst.prototype : Object.getPrototypeOf(inst);
          while(proto && proto !== objProto) {
            for (var key in proto) {
              // we only invoke each key once; if a super is overridden it's skipped here
              if (proto.hasOwnProperty(key) && !methods.hasOwnProperty(key)) {
                methods[key] = true;
                iterator.call(context, proto[key], key, proto);
              }
            }
            proto = Object.getPrototypeOf(proto);
          }
        }

        function getPublicMethods(inst, iterator, context) {
          getPrototypeMethods(inst, function(m, k) {
            if( typeof(m) === 'function' && !/^_/.test(k) ) {
              iterator.call(context, m, k);
            }
          });
        }

        function defer() {
          return $q.defer();
        }

        function reject(msg) {
          var def = defer();
          def.reject(msg);
          return def.promise;
        }

        return {
          debounce: debounce,
          assertValidRef: assertValidRef,
          batchDelay: firebaseBatchDelay,
          inherit: inherit,
          getPrototypeMethods: getPrototypeMethods,
          getPublicMethods: getPublicMethods,
          reject: reject,
          defer: defer
        };
      }
    ]);

})();