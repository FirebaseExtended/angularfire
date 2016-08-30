(function() {
  'use strict';
  /**
   * Creates and maintains a synchronized list of data. This is a pseudo-read-only array. One should
   * not call splice(), push(), pop(), et al directly on this array, but should instead use the
   * $remove and $add methods.
   *
   * It is acceptable to .sort() this array, but it is important to use this in conjunction with
   * $watch(), so that it will be re-sorted any time the server data changes. Examples of this are
   * included in the $watch documentation.
   *
   * Internally, the $firebase object depends on this class to provide several $$ (i.e. protected)
   * methods, which it invokes to notify the array whenever a change has been made at the server:
   *    $$added - called whenever a child_added event occurs
   *    $$updated - called whenever a child_changed event occurs
   *    $$moved - called whenever a child_moved event occurs
   *    $$removed - called whenever a child_removed event occurs
   *    $$error - called when listeners are canceled due to a security error
   *    $$process - called immediately after $$added/$$updated/$$moved/$$removed
   *                (assuming that these methods do not abort by returning false or null)
   *                to splice/manipulate the array and invoke $$notify
   *
   * Additionally, these methods may be of interest to devs extending this class:
   *    $$notify - triggers notifications to any $watch listeners, called by $$process
   *    $$getKey - determines how to look up a record's key (returns $id by default)
   *
   * Instead of directly modifying this class, one should generally use the $extend
   * method to add or change how methods behave. $extend modifies the prototype of
   * the array class by returning a clone of $firebaseArray.
   *
   * <pre><code>
   * var ExtendedArray = $firebaseArray.$extend({
   *    // add a new method to the prototype
   *    foo: function() { return 'bar'; },
   *
   *    // change how records are created
   *    $$added: function(snap, prevChild) {
   *       return new Widget(snap, prevChild);
   *    },
   *
   *    // change how records are updated
   *    $$updated: function(snap) {
   *      return this.$getRecord(snap.key()).update(snap);
   *    }
   * });
   *
   * var list = new ExtendedArray(ref);
   * </code></pre>
   */
  angular.module('firebase.database').factory('$firebaseArray', ["$log", "$firebaseUtils", "$q",
    function($log, $firebaseUtils, $q) {
      /**
       * This constructor should probably never be called manually. It is used internally by
       * <code>$firebase.$asArray()</code>.
       *
       * @param {Firebase} ref
       * @returns {Array}
       * @constructor
       */
      function FirebaseArray(ref) {
        if( !(this instanceof FirebaseArray) ) {
          return new FirebaseArray(ref);
        }
        var self = this;
        this._observers = [];
        this.$list = [];
        this._ref = ref;
        this._sync = new ArraySyncManager(this);

        $firebaseUtils.assertValidRef(ref, 'Must pass a valid Firebase reference ' +
        'to $firebaseArray (not a string or URL)');

        // indexCache is a weak hashmap (a lazy list) of keys to array indices,
        // items are not guaranteed to stay up to date in this list (since the data
        // array can be manually edited without calling the $ methods) and it should
        // always be used with skepticism regarding whether it is accurate
        // (see $indexFor() below for proper usage)
        this._indexCache = {};

        // Array.isArray will not work on objects which extend the Array class.
        // So instead of extending the Array class, we just return an actual array.
        // However, it's still possible to extend FirebaseArray and have the public methods
        // appear on the array object. We do this by iterating the prototype and binding
        // any method that is not prefixed with an underscore onto the final array.
        $firebaseUtils.getPublicMethods(self, function(fn, key) {
          self.$list[key] = fn.bind(self);
        });

        this._sync.init(this.$list);

        // $resolved provides quick access to the current state of the $loaded() promise.
        // This is useful in data-binding when needing to delay the rendering or visibilty
        // of the data until is has been loaded from firebase.
        this.$list.$resolved = false;
        this.$loaded().finally(function() {
          self.$list.$resolved = true;
        });

        return this.$list;
      }

      FirebaseArray.prototype = {
        /**
         * Create a new record with a unique ID and add it to the end of the array.
         * This should be used instead of Array.prototype.push, since those changes will not be
         * synchronized with the server.
         *
         * Any value, including a primitive, can be added in this way. Note that when the record
         * is created, the primitive value would be stored in $value (records are always objects
         * by default).
         *
         * Returns a future which is resolved when the data has successfully saved to the server.
         * The resolve callback will be passed a Firebase ref representing the new data element.
         *
         * @param data
         * @returns a promise resolved after data is added
         */
        $add: function(data) {
          this._assertNotDestroyed('$add');
          var self = this;
          var def = $q.defer();
          var ref = this.$ref().ref.push();
          var dataJSON;

          try {
            dataJSON = $firebaseUtils.toJSON(data);
          } catch (err) {
            def.reject(err);
          }

          if (typeof dataJSON !== 'undefined') {
            $firebaseUtils.doSet(ref, dataJSON).then(function() {
              self.$$notify('child_added', ref.key);
              def.resolve(ref);
            }).catch(def.reject);
          }

          return def.promise;
        },

        /**
         * Pass either an item in the array or the index of an item and it will be saved back
         * to Firebase. While the array is read-only and its structure should not be changed,
         * it is okay to modify properties on the objects it contains and then save those back
         * individually.
         *
         * Returns a future which is resolved when the data has successfully saved to the server.
         * The resolve callback will be passed a Firebase ref representing the saved element.
         * If passed an invalid index or an object which is not a record in this array,
         * the promise will be rejected.
         *
         * @param {int|object} indexOrItem
         * @returns a promise resolved after data is saved
         */
        $save: function(indexOrItem) {
          this._assertNotDestroyed('$save');
          var self = this;
          var item = self._resolveItem(indexOrItem);
          var key = self.$keyAt(item);
          var def = $q.defer();

          if( key !== null ) {
            var ref = self.$ref().ref.child(key);
            var dataJSON;

            try {
              dataJSON = $firebaseUtils.toJSON(item);
            } catch (err) {
              def.reject(err);
            }

            if (typeof dataJSON !== 'undefined') {
              $firebaseUtils.doSet(ref, dataJSON).then(function() {
                self.$$notify('child_changed', key);
                def.resolve(ref);
              }).catch(def.reject);
            }
          }
          else {
            def.reject('Invalid record; could not determine key for '+indexOrItem);
          }

          return def.promise;
        },

        /**
         * Pass either an existing item in this array or the index of that item and it will
         * be removed both locally and in Firebase. This should be used in place of
         * Array.prototype.splice for removing items out of the array, as calling splice
         * will not update the value on the server.
         *
         * Returns a future which is resolved when the data has successfully removed from the
         * server. The resolve callback will be passed a Firebase ref representing the deleted
         * element. If passed an invalid index or an object which is not a record in this array,
         * the promise will be rejected.
         *
         * @param {int|object} indexOrItem
         * @returns a promise which resolves after data is removed
         */
        $remove: function(indexOrItem) {
          this._assertNotDestroyed('$remove');
          var key = this.$keyAt(indexOrItem);
          if( key !== null ) {
            var ref = this.$ref().ref.child(key);
            return $firebaseUtils.doRemove(ref).then(function() {
              return ref;
            });
          }
          else {
            return $q.reject('Invalid record; could not determine key for '+indexOrItem);
          }
        },

        /**
         * Given an item in this array or the index of an item in the array, this returns the
         * Firebase key (record.$id) for that record. If passed an invalid key or an item which
         * does not exist in this array, it will return null.
         *
         * @param {int|object} indexOrItem
         * @returns {null|string}
         */
        $keyAt: function(indexOrItem) {
          var item = this._resolveItem(indexOrItem);
          return this.$$getKey(item);
        },

        /**
         * The inverse of $keyAt, this method takes a Firebase key (record.$id) and returns the
         * index in the array where that record is stored. If the record is not in the array,
         * this method returns -1.
         *
         * @param {String} key
         * @returns {int} -1 if not found
         */
        $indexFor: function(key) {
          var self = this;
          var cache = self._indexCache;
          // evaluate whether our key is cached and, if so, whether it is up to date
          if( !cache.hasOwnProperty(key) || self.$keyAt(cache[key]) !== key ) {
            // update the hashmap
            var pos = self.$list.findIndex(function(rec) { return self.$$getKey(rec) === key; });
            if( pos !== -1 ) {
              cache[key] = pos;
            }
          }
          return cache.hasOwnProperty(key)? cache[key] : -1;
        },

        /**
         * The loaded method is invoked after the initial batch of data arrives from the server.
         * When this resolves, all data which existed prior to calling $asArray() is now cached
         * locally in the array.
         *
         * As a shortcut is also possible to pass resolve/reject methods directly into this
         * method just as they would be passed to .then()
         *
         * @param {Function} [resolve]
         * @param {Function} [reject]
         * @returns a promise
         */
        $loaded: function(resolve, reject) {
          var promise = this._sync.ready();
          if( arguments.length ) {
            // allow this method to be called just like .then
            // by passing any arguments on to .then
            promise = promise.then.call(promise, resolve, reject);
          }
          return promise;
        },

        /**
         * @returns {Firebase} the original Firebase ref used to create this object.
         */
        $ref: function() { return this._ref; },

        /**
         * Listeners passed into this method are notified whenever a new change (add, updated,
         * move, remove) is received from the server. Each invocation is sent an object
         * containing <code>{ type: 'child_added|child_updated|child_moved|child_removed',
         * key: 'key_of_item_affected'}</code>
         *
         * Additionally, added and moved events receive a prevChild parameter, containing the
         * key of the item before this one in the array.
         *
         * This method returns a function which can be invoked to stop observing events.
         *
         * @param {Function} cb
         * @param {Object} [context]
         * @returns {Function} used to stop observing
         */
        $watch: function(cb, context) {
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

        /**
         * Informs $firebase to stop sending events and clears memory being used
         * by this array (delete's its local content).
         */
        $destroy: function(err) {
          if( !this._isDestroyed ) {
            this._isDestroyed = true;
            this._sync.destroy(err);
            this.$list.length = 0;
          }
        },

        /**
         * Returns the record for a given Firebase key (record.$id). If the record is not found
         * then returns null.
         *
         * @param {string} key
         * @returns {Object|null} a record in this array
         */
        $getRecord: function(key) {
          var i = this.$indexFor(key);
          return i > -1? this.$list[i] : null;
        },

        /**
         * Called to inform the array when a new item has been added at the server.
         * This method should return the record (an object) that will be passed into $$process
         * along with the add event. Alternately, the record will be skipped if this method returns
         * a falsey value.
         *
         * @param {object} snap a Firebase snapshot
         * @param {string} prevChild
         * @return {object} the record to be inserted into the array
         * @protected
         */
        $$added: function(snap/*, prevChild*/) {
          // check to make sure record does not exist
          var i = this.$indexFor(snap.key);
          if( i === -1 ) {
            // parse data and create record
            var rec = snap.val();
            if( !angular.isObject(rec) ) {
              rec = { $value: rec };
            }
            rec.$id = snap.key;
            rec.$priority = snap.getPriority();
            $firebaseUtils.applyDefaults(rec, this.$$defaults);

            return rec;
          }
          return false;
        },

        /**
         * Called whenever an item is removed at the server.
         * This method does not physically remove the objects, but instead
         * returns a boolean indicating whether it should be removed (and
         * taking any other desired actions before the remove completes).
         *
         * @param {object} snap a Firebase snapshot
         * @return {boolean} true if item should be removed
         * @protected
         */
        $$removed: function(snap) {
          return this.$indexFor(snap.key) > -1;
        },

        /**
         * Called whenever an item is changed at the server.
         * This method should apply the changes, including changes to data
         * and to $priority, and then return true if any changes were made.
         *
         * If this method returns false, then $$process will not be invoked,
         * which means that $$notify will not take place and no $watch events
         * will be triggered.
         *
         * @param {object} snap a Firebase snapshot
         * @return {boolean} true if any data changed
         * @protected
         */
        $$updated: function(snap) {
          var changed = false;
          var rec = this.$getRecord(snap.key);
          if( angular.isObject(rec) ) {
            // apply changes to the record
            changed = $firebaseUtils.updateRec(rec, snap);
            $firebaseUtils.applyDefaults(rec, this.$$defaults);
          }
          return changed;
        },

        /**
         * Called whenever an item changes order (moves) on the server.
         * This method should set $priority to the updated value and return true if
         * the record should actually be moved. It should not actually apply the move
         * operation.
         *
         * If this method returns false, then the record will not be moved in the array
         * and no $watch listeners will be notified. (When true, $$process is invoked
         * which invokes $$notify)
         *
         * @param {object} snap a Firebase snapshot
         * @param {string} prevChild
         * @protected
         */
        $$moved: function(snap/*, prevChild*/) {
          var rec = this.$getRecord(snap.key);
          if( angular.isObject(rec) ) {
            rec.$priority = snap.getPriority();
            return true;
          }
          return false;
        },

        /**
         * Called whenever a security error or other problem causes the listeners to become
         * invalid. This is generally an unrecoverable error.
         *
         * @param {Object} err which will have a `code` property and possibly a `message`
         * @protected
         */
        $$error: function(err) {
          $log.error(err);
          this.$destroy(err);
        },

        /**
         * Returns ID for a given record
         * @param {object} rec
         * @returns {string||null}
         * @protected
         */
        $$getKey: function(rec) {
          return angular.isObject(rec)? rec.$id : null;
        },

        /**
         * Handles placement of recs in the array, sending notifications,
         * and other internals. Called by the synchronization process
         * after $$added, $$updated, $$moved, and $$removed return a truthy value.
         *
         * @param {string} event one of child_added, child_removed, child_moved, or child_changed
         * @param {object} rec
         * @param {string} [prevChild]
         * @protected
         */
        $$process: function(event, rec, prevChild) {
          var key = this.$$getKey(rec);
          var changed = false;
          var curPos;
          switch(event) {
            case 'child_added':
              curPos = this.$indexFor(key);
              break;
            case 'child_moved':
              curPos = this.$indexFor(key);
              this._spliceOut(key);
              break;
            case 'child_removed':
              // remove record from the array
              changed = this._spliceOut(key) !== null;
              break;
            case 'child_changed':
              changed = true;
              break;
            default:
              throw new Error('Invalid event type: ' + event);
          }
          if( angular.isDefined(curPos) ) {
            // add it to the array
            changed = this._addAfter(rec, prevChild) !== curPos;
          }
          if( changed ) {
            // send notifications to anybody monitoring $watch
            this.$$notify(event, key, prevChild);
          }
          return changed;
        },

        /**
         * Used to trigger notifications for listeners registered using $watch. This method is
         * typically invoked internally by the $$process method.
         *
         * @param {string} event
         * @param {string} key
         * @param {string} [prevChild]
         * @protected
         */
        $$notify: function(event, key, prevChild) {
          var eventData = {event: event, key: key};
          if( angular.isDefined(prevChild) ) {
            eventData.prevChild = prevChild;
          }
          angular.forEach(this._observers, function(parts) {
            parts[0].call(parts[1], eventData);
          });
        },

        /**
         * Used to insert a new record into the array at a specific position. If prevChild is
         * null, is inserted first, if prevChild is not found, it is inserted last, otherwise,
         * it goes immediately after prevChild.
         *
         * @param {object} rec
         * @param {string|null} prevChild
         * @private
         */
        _addAfter: function(rec, prevChild) {
          var i;
          if( prevChild === null ) {
            i = 0;
          }
          else {
            i = this.$indexFor(prevChild)+1;
            if( i === 0 ) { i = this.$list.length; }
          }
          this.$list.splice(i, 0, rec);
          this._indexCache[this.$$getKey(rec)] = i;
          return i;
        },

        /**
         * Removes a record from the array by calling splice. If the item is found
         * this method returns it. Otherwise, this method returns null.
         *
         * @param {string} key
         * @returns {object|null}
         * @private
         */
        _spliceOut: function(key) {
          var i = this.$indexFor(key);
          if( i > -1 ) {
            delete this._indexCache[key];
            return this.$list.splice(i, 1)[0];
          }
          return null;
        },

        /**
         * Resolves a variable which may contain an integer or an item that exists in this array.
         * Returns the item or null if it does not exist.
         *
         * @param indexOrItem
         * @returns {*}
         * @private
         */
        _resolveItem: function(indexOrItem) {
          var list = this.$list;
          if( angular.isNumber(indexOrItem) && indexOrItem >= 0 && list.length >= indexOrItem ) {
            return list[indexOrItem];
          }
          else if( angular.isObject(indexOrItem) ) {
            // it must be an item in this array; it's not sufficient for it just to have
            // a $id or even a $id that is in the array, it must be an actual record
            // the fastest way to determine this is to use $getRecord (to avoid iterating all recs)
            // and compare the two
            var key = this.$$getKey(indexOrItem);
            var rec = this.$getRecord(key);
            return rec === indexOrItem? rec : null;
          }
          return null;
        },

        /**
         * Throws an error if $destroy has been called. Should be used for any function
         * which tries to write data back to $firebase.
         * @param {string} method
         * @private
         */
        _assertNotDestroyed: function(method) {
          if( this._isDestroyed ) {
            throw new Error('Cannot call ' + method + ' method on a destroyed $firebaseArray object');
          }
        }
      };

      /**
       * This method allows FirebaseArray to be inherited by child classes. Methods passed into this
       * function will be added onto the array's prototype. They can override existing methods as
       * well.
       *
       * In addition to passing additional methods, it is also possible to pass in a class function.
       * The prototype on that class function will be preserved, and it will inherit from
       * FirebaseArray. It's also possible to do both, passing a class to inherit and additional
       * methods to add onto the prototype.
       *
       *  <pre><code>
       * var ExtendedArray = $firebaseArray.$extend({
       *    // add a method onto the prototype that sums all items in the array
       *    getSum: function() {
       *       var ct = 0;
       *       angular.forEach(this.$list, function(rec) { ct += rec.x; });
        *      return ct;
       *    }
       * });
       *
       * // use our new factory in place of $firebaseArray
       * var list = new ExtendedArray(ref);
       * </code></pre>
       *
       * @param {Function} [ChildClass] a child class which should inherit FirebaseArray
       * @param {Object} [methods] a list of functions to add onto the prototype
       * @returns {Function} a child class suitable for use with $firebase (this will be ChildClass if provided)
       * @static
       */
      FirebaseArray.$extend = function(ChildClass, methods) {
        if( arguments.length === 1 && angular.isObject(ChildClass) ) {
          methods = ChildClass;
          ChildClass = function(ref) {
            if( !(this instanceof ChildClass) ) {
              return new ChildClass(ref);
            }
            FirebaseArray.apply(this, arguments);
            return this.$list;
          };
        }
        return $firebaseUtils.inherit(ChildClass, FirebaseArray, methods);
      };

      function ArraySyncManager(firebaseArray) {
        function destroy(err) {
          if( !sync.isDestroyed ) {
            sync.isDestroyed = true;
            var ref = firebaseArray.$ref();
            ref.off('child_added', created);
            ref.off('child_moved', moved);
            ref.off('child_changed', updated);
            ref.off('child_removed', removed);
            firebaseArray = null;
            initComplete(err||'destroyed');
          }
        }

        function init($list) {
          var ref = firebaseArray.$ref();

          // listen for changes at the Firebase instance
          ref.on('child_added', created, error);
          ref.on('child_moved', moved, error);
          ref.on('child_changed', updated, error);
          ref.on('child_removed', removed, error);

          // determine when initial load is completed
          ref.once('value', function(snap) {
            if (angular.isArray(snap.val())) {
              $log.warn('Storing data using array indices in Firebase can result in unexpected behavior. See https://firebase.google.com/docs/database/web/structure-data for more information.');
            }

            initComplete(null, $list);
          }, initComplete);
        }

        // call initComplete(), do not call this directly
        function _initComplete(err, result) {
          if( !isResolved ) {
            isResolved = true;
            if( err ) { def.reject(err); }
            else { def.resolve(result); }
          }
        }

        var def = $q.defer();
        var created = function(snap, prevChild) {
          if (!firebaseArray) {
            return;
          }
          waitForResolution(firebaseArray.$$added(snap, prevChild), function(rec) {
            firebaseArray.$$process('child_added', rec, prevChild);
          });
        };
        var updated = function(snap) {
          if (!firebaseArray) {
            return;
          }
          var rec = firebaseArray.$getRecord(snap.key);
          if( rec ) {
            waitForResolution(firebaseArray.$$updated(snap), function() {
              firebaseArray.$$process('child_changed', rec);
            });
          }
        };
        var moved   = function(snap, prevChild) {
          if (!firebaseArray) {
            return;
          }
          var rec = firebaseArray.$getRecord(snap.key);
          if( rec ) {
            waitForResolution(firebaseArray.$$moved(snap, prevChild), function() {
              firebaseArray.$$process('child_moved', rec, prevChild);
            });
          }
        };
        var removed = function(snap) {
          if (!firebaseArray) {
            return;
          }
          var rec = firebaseArray.$getRecord(snap.key);
          if( rec ) {
            waitForResolution(firebaseArray.$$removed(snap), function() {
               firebaseArray.$$process('child_removed', rec);
            });
          }
        };

        function waitForResolution(maybePromise, callback) {
          var promise = $q.when(maybePromise);
          promise.then(function(result){
            if (result) {
              callback(result);
            }
          });
          if (!isResolved) {
            resolutionPromises.push(promise);
          }
        }

        var resolutionPromises = [];
        var isResolved = false;
        var error   = $firebaseUtils.batch(function(err) {
          _initComplete(err);
          if( firebaseArray ) {
            firebaseArray.$$error(err);
          }
        });
        var initComplete = $firebaseUtils.batch(_initComplete);

        var sync = {
          destroy: destroy,
          isDestroyed: false,
          init: init,
          ready: function() { return def.promise.then(function(result){
            return $q.all(resolutionPromises).then(function(){
              return result;
            });
          }); }
        };

        return sync;
      }

      return FirebaseArray;
    }
  ]);

  /** @deprecated */
  angular.module('firebase').factory('$FirebaseArray', ['$log', '$firebaseArray',
    function($log, $firebaseArray) {
      return function() {
        $log.warn('$FirebaseArray has been renamed. Use $firebaseArray instead.');
        return $firebaseArray.apply(null, arguments);
      };
    }
  ]);
})();
