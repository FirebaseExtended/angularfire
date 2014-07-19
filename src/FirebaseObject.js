(function() {
  'use strict';
  /**
   * Creates and maintains a synchronized boject. This constructor should not be
   * manually invoked. Instead, one should create a $firebase object and call $asObject
   * on it:  <code>$firebase( firebaseRef ).$asObject()</code>;
   *
   * Internally, the $firebase object depends on this class to provide 2 methods, which it invokes
   * to notify the object whenever a change has been made at the server:
   *    $$updated - called whenever a change occurs (a value event from Firebase)
   *    $$error - called when listeners are canceled due to a security error
   *
   * Instead of directly modifying this class, one should generally use the $extendFactory
   * method to add or change how methods behave:
   *
   * <pre><code>
   * var NewFactory = $FirebaseObject.$extendFactory({
   *    // add a new method to the prototype
   *    foo: function() { return 'bar'; },
   * });
   * </code></pre>
   *
   * And then the new factory can be used by passing it as an argument:
   * <code>$firebase( firebaseRef, {objectFactory: NewFactory}).$asObject();</code>
   */
  angular.module('firebase').factory('$FirebaseObject', [
    '$parse', '$firebaseUtils', '$log',
    function($parse, $firebaseUtils, $log) {
      /**
       * This constructor should probably never be called manually. It is used internally by
       * <code>$firebase.$asObject()</code>.
       *
       * @param $firebase
       * @param {Function} destroyFn invoking this will cancel all event listeners and stop
       *                   notifications from being delivered to $$updated and $$error
       * @returns {FirebaseObject}
       * @constructor
       */
      function FirebaseObject($firebase, destroyFn) {
        var self = this, def = $firebaseUtils.defer();

        // These are private config props and functions used internally
        // they are collected here to reduce clutter on the prototype
        // and instance signatures.
        self.$$conf = {
          promise: def.promise,
          inst: $firebase,
          bound: null,
          destroyFn: destroyFn,
          listeners: [],
          /**
           * Called when initial data is loaded or an error occurs to resolve the promise
           * used by $loaded method
           * @param {Error|string} [err] rejects the promise
           */
          resolve: function(err) {
            if( def ) {
              var d = def;
              def = null;
              if( err ) {
                d.reject(err);
              }
              else {
                d.resolve(self);
              }
            }
          },
          /**
           * Updates any bound scope variables and notifies listeners registered
           * with $watch any time there is a change to data
           */
          notify: function() {
            if( self.$$conf.bound ) {
              self.$$conf.bound.update();
            }
            // be sure to do this after setting up data and init state
            self.$$conf.resolve();
            angular.forEach(self.$$conf.listeners, function (parts) {
              parts[0].call(parts[1], {event: 'updated', key: self.$id});
            });
          }
        };

        self.$id = $firebase.$ref().name();
        self.$priority = null;
      }

      FirebaseObject.prototype = {
        /**
         * Saves all data on the FirebaseObject back to Firebase.
         * @returns a promise which will resolve after the save is completed.
         */
        $save: function () {
          return this.$inst().$set($firebaseUtils.toJSON(this));
        },

        /**
         * The loaded method is invoked after the initial batch of data arrives from the server.
         * When this resolves, all data which existed prior to calling $asObject() is now cached
         * locally in the object.
         *
         * As a shortcut is also possible to pass resolve/reject methods directly into this
         * method just as they would be passed to .then()
         *
         * @param {Function} resolve
         * @param {Function} reject
         * @returns a promise which resolves after initial data is downloaded from Firebase
         */
        $loaded: function(resolve, reject) {
          var promise = this.$$conf.promise;
          if (arguments.length) {
            // allow this method to be called just like .then
            // by passing any arguments on to .then
            promise = promise.then.call(promise, resolve, reject);
          }
          return promise;
        },

        /**
         * @returns the original $firebase object used to create this object.
         */
        $inst: function () {
          return this.$$conf.inst;
        },

        /**
         * Creates a 3-way data sync between this object, the Firebase server, and a
         * scope variable. This means that any changes made to the scope variable are
         * pushed to Firebase, and vice versa.
         *
         * If scope emits a $destroy event, the binding is automatically severed. Otherwise,
         * it is possible to unbind the scope variable by using the `unbind` function
         * passed into the resolve method.
         *
         * @param {object} scope
         * @param {string} varName
         * @returns a promise which resolves to an unbind method after data is set in scope
         */
        $bindTo: function (scope, varName) {
          var self = this;
          return self.$loaded().then(function () {
            if (self.$$conf.bound) {
              throw new Error('Can only bind to one scope variable at a time');
            }

            var unbind = function () {
              if (self.$$conf.bound) {
                self.$$conf.bound = null;
                off();
              }
            };

            // expose a few useful methods to other methods
            var parsed = $parse(varName);
            var $bound = self.$$conf.bound = {
              update: function() {
                var curr = $bound.get();
                if( !angular.isObject(curr) ) {
                  curr = {};
                }
                $firebaseUtils.each(self, function(v,k) {
                  curr[k] = v;
                });
                curr.$id = self.$id;
                curr.$priority = self.$priority;
                if( self.hasOwnProperty('$value') ) {
                  curr.$value = self.$value;
                }
                parsed.assign(scope, curr);
              },
              get: function () {
                return parsed(scope);
              },
              unbind: unbind
            };

            $bound.update();
            scope.$on('$destroy', $bound.unbind);

            // monitor scope for any changes
            var off = scope.$watch(varName, function () {
              var newData = $firebaseUtils.toJSON($bound.get());
              var oldData = $firebaseUtils.toJSON(self);
              if (!angular.equals(newData, oldData)) {
                self.$inst().$set(newData);
              }
            }, true);

            return unbind;
          });
        },

        /**
         * Listeners passed into this method are notified whenever a new change is received
         * from the server. Each invocation is sent an object containing
         * <code>{ type: 'updated', key: 'my_firebase_id' }</code>
         *
         * This method returns an unbind function that can be used to detach the listener.
         *
         * @param {Function} cb
         * @param {Object} [context]
         * @returns {Function} invoke to stop observing events
         */
        $watch: function (cb, context) {
          var list = this.$$conf.listeners;
          list.push([cb, context]);
          // an off function for cancelling the listener
          return function () {
            var i = list.findIndex(function (parts) {
              return parts[0] === cb && parts[1] === context;
            });
            if (i > -1) {
              list.splice(i, 1);
            }
          };
        },

        /**
         * Informs $firebase to stop sending events and clears memory being used
         * by this object (delete's its local content).
         */
        $destroy: function () {
          var self = this;
          if (!self.$isDestroyed) {
            self.$isDestroyed = true;
            self.$$conf.destroyFn();
            if (self.$$conf.bound) {
              self.$$conf.bound.unbind();
            }
            $firebaseUtils.each(self, function (v, k) {
              delete self[k];
            });
            self.$$conf.resolve('destroyed');
          }
        },

        /**
         * Called by $firebase whenever an item is changed at the server.
         * This method must exist on any objectFactory passed into $firebase.
         *
         * @param snap
         */
        $$updated: function (snap) {
          this.$id = snap.name();
          // applies new data to this object
          var changed = $firebaseUtils.updateRec(this, snap);
          if( changed ) {
            // notifies $watch listeners and
            // updates $scope if bound to a variable
            this.$$conf.notify();
          }
        },

        /**
         * Called whenever a security error or other problem causes the listeners to become
         * invalid. This is generally an unrecoverable error.
         * @param {Object} err which will have a `code` property and possibly a `message`
         */
        $$error: function (err) {
          // prints an error to the console (via Angular's logger)
          $log.error(err);
          // rejects the $loaded promise
          this.$$conf.resolve(err);
          // frees memory and cancels any remaining listeners
          this.$destroy();
        }
      };

      /**
       * This method allows FirebaseObject to be copied into a new factory. Methods passed into this
       * function will be added onto the object's prototype. They can override existing methods as
       * well.
       *
       * In addition to passing additional methods, it is also possible to pass in a class function.
       * The prototype on that class function will be preserved, and it will inherit from
       * FirebaseObject. It's also possible to do both, passing a class to inherit and additional
       * methods to add onto the prototype.
       *
       * Once a factory is obtained by this method, it can be passed into $firebase as the
       * `objectFactory` parameter:
       *
       * <pre><code>
       * var MyFactory = $FirebaseObject.$extendFactory({
       *    // add a method onto the prototype that prints a greeting
       *    getGreeting: function() {
       *       return 'Hello ' + this.first_name + ' ' + this.last_name + '!';
       *    }
       * });
       *
       * // use our new factory in place of $FirebaseObject
       * var obj = $firebase(ref, {objectFactory: MyFactory}).$asObject();
       * </code></pre>
       *
       * @param {Function} [ChildClass] a child class which should inherit FirebaseObject
       * @param {Object} [methods] a list of functions to add onto the prototype
       * @returns {Function} a new factory suitable for use with $firebase
       */
      FirebaseObject.$extendFactory = function(ChildClass, methods) {
        if( arguments.length === 1 && angular.isObject(ChildClass) ) {
          methods = ChildClass;
          ChildClass = function() { FirebaseObject.apply(this, arguments); };
        }
        return $firebaseUtils.inherit(ChildClass, FirebaseObject, methods);
      };

      return FirebaseObject;
    }
  ]);
})();