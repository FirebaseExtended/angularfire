(function() {
  'use strict';
  /**
   * Creates and maintains a synchronized list of data. This constructor should not be
   * manually invoked. Instead, one should create a $firebase object and call $asArray
   * on it:  <code>$firebase( firebaseRef ).$asArray()</code>;
   *
   * Internally, the $firebase object depends on this class to provide 5 methods, which it invokes
   * to notify the array whenever a change has been made at the server:
   *    $$added - called whenever a child_added event occurs
   *    $$updated - called whenever a child_changed event occurs
   *    $$moved - called whenever a child_moved event occurs
   *    $$removed - called whenever a child_removed event occurs
   *    $$error - called when listeners are canceled due to a security error
   *
   * Instead of directly modifying this class, one should generally use the $extendFactory
   * method to add or change how methods behave:
   *
   * <pre><code>
   * var NewFactory = $FirebaseArray.$extendFactory({
   *    // add a new method to the prototype
   *    foo: function() { return 'bar'; },
   *
   *    // change how records are created
   *    $$createRecord: function(snap) {
   *       return new Widget(snap);
   *    }
   * });
   * </code></pre>
   *
   * And then the new factory can be used by passing it as an argument:
   * <code>$firebase( firebaseRef, {arrayFactory: NewFactory}).$asObject();</code>
   */
  var nott;
  angular.module('firebase').factory('$FirebaseArray', ["$log", "$firebaseUtils",
    function($log, $firebaseUtils) {
      if( !nott ) {
        nott = true;
        throw new Error('oops');
      }
      /**
       * This constructor should probably never be called manually. It is used internally by
       * <code>$firebase.$asArray()</code>.
       *
       * @param {$firebase} $firebase
       * @param {Function} destroyFn invoking this will cancel all event listeners and stop
       *                   notifications from being delivered to $$added, $$updated, $$moved, and $$removed
       * @returns {Array}
       * @constructor
       */
      function FirebaseArray($firebase, destroyFn) {
        // observers registered with the $watch function
        this._observers = [];
        // the synchronized list of records
        this.$list = [];
        this._inst = $firebase;
        // used by the $loaded() function
        this._promise = this._init();
        this._destroyFn = destroyFn;
        // Array.isArray will not work on objects which extend the Array class.
        // So instead of extending the Array class, we just return an actual array.
        // However, it's still possible to extend FirebaseArray and have the public methods
        // appear on the array object. We do this by iterating the prototype and binding
        // any method that is not prefixed with an underscore onto the final array.
        return this.$list;
      }

      FirebaseArray.prototype = {
        /**
         *
         * @param data
         * @returns {*}
         */
        $add: function(data) {
          this._assertNotDestroyed('$add');
          return this.$inst().$push(data);
        },

        $save: function(indexOrItem) {
          this._assertNotDestroyed('$save');
          var item = this._resolveItem(indexOrItem);
          var key = this.$keyAt(item);
          if( key !== null ) {
            return this.$inst().$set(key, $firebaseUtils.toJSON(item));
          }
          else {
            return $firebaseUtils.reject('Invalid record; could determine its key: '+indexOrItem);
          }
        },

        $remove: function(indexOrItem) {
          this._assertNotDestroyed('$remove');
          var key = this.$keyAt(indexOrItem);
          if( key !== null ) {
            return this.$inst().$remove(this.$keyAt(indexOrItem));
          }
          else {
            return $firebaseUtils.reject('Invalid record; could not find key: '+indexOrItem);
          }
        },

        $keyAt: function(indexOrItem) {
          var item = this._resolveItem(indexOrItem);
          return angular.isUndefined(item) || angular.isUndefined(item.$id)? null : item.$id;
        },

        $indexFor: function(key) {
          // todo optimize and/or cache these? they wouldn't need to be perfect
          return this.$list.findIndex(function(rec) { return rec.$id === key; });
        },

        $loaded: function() {
          var promise = this._promise;
          if( arguments.length ) {
            promise = promise.then.apply(promise, arguments);
          }
          return promise;
        },

        $inst: function() { return this._inst; },

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

        $destroy: function() {
          if( !this._isDestroyed ) {
            this._isDestroyed = true;
            this.$list.length = 0;
            $log.debug('destroy called for FirebaseArray: '+this.$inst().$ref().toString());
            this._destroyFn();
          }
        },

        $getRecord: function(key) {
          var i = this.$indexFor(key);
          return i > -1? this.$list[i] : null;
        },

        $$createRecord: function(snap) {
          var data = snap.val();
          if( !angular.isObject(data) ) {
            data = { $value: data };
          }
          data.$id = snap.name();
          data.$priority = snap.getPriority();
          return data;
        },

        $$added: function(snap, prevChild) {
          var rec = this.$getRecord(snap.name());
          if( !rec ) {
            // get the new record object
            rec = this.$$createRecord(snap);
            // add it to the array
            this._addAfter(rec, prevChild);
            // send notifications to anybody monitoring $watch
            this._notify('child_added', snap.name(), prevChild);
          }
        },

        $$removed: function(snap) {
          // remove record from the array
          var rec = this._spliceOut(snap.name());
          if( angular.isDefined(rec) ) {
            // if it was found, send notifications
            this._notify('child_removed', snap.name());
          }
        },

        $$updated: function(snap) {
          // find the record
          var rec = this.$getRecord(snap.name());
          if( angular.isObject(rec) ) {
            // apply changes to the record
            var changed = $firebaseUtils.updateRec(rec, snap);
            if( changed ) {
              // if something actually changed, notify listeners of $watch
              this._notify('child_changed', snap.name());
            }
          }
        },

        $$moved: function(snap, prevChild) {
          // take record out of the array
          var dat = this._spliceOut(snap.name());
          if( angular.isDefined(dat) ) {
            // if it was found, put it back in the new location
            this._addAfter(dat, prevChild);
            // notify listeners of $watch
            this._notify('child_moved', snap.name(), prevChild);
          }
        },

        $$error: function(err) {
          $log.error(err);
          this.$destroy(err);
        },

        _notify: function(event, key, prevChild) {
          var eventData = {event: event, key: key};
          if( arguments.length === 3 ) {
            eventData.prevChild = prevChild;
          }
          angular.forEach(this._observers, function(parts) {
            parts[0].call(parts[1], eventData);
          });
        },

        _addAfter: function(dat, prevChild) {
          var i;
          if( prevChild === null ) {
            i = 0;
          }
          else {
            i = this.$indexFor(prevChild)+1;
            if( i === 0 ) { i = this.$list.length; }
          }
          this.$list.splice(i, 0, dat);
        },

        _spliceOut: function(key) {
          var i = this.$indexFor(key);
          if( i > -1 ) {
            return this.$list.splice(i, 1)[0];
          }
        },

        _resolveItem: function(indexOrItem) {
          return angular.isNumber(indexOrItem)? this.$list[indexOrItem] : indexOrItem;
        },

        _assertNotDestroyed: function(method) {
          if( this._isDestroyed ) {
            throw new Error('Cannot call ' + method + ' method on a destroyed $FirebaseArray object');
          }
        },

        _init: function() {
          var self = this;
          var list = self.$list;
          var def = $firebaseUtils.defer();
          var ref = self.$inst().$ref();

          // we return $list, but apply our public prototype to it first
          // see FirebaseArray.prototype's assignment comments
          $firebaseUtils.getPublicMethods(self, function(fn, key) {
            list[key] = fn.bind(self);
          });

          // for our $loaded() function
          ref.once('value', function() {
            $firebaseUtils.compile(function() {
              if( self._isDestroyed ) {
                def.reject('instance was destroyed before load completed');
              }
              else {
                def.resolve(list);
              }
            });
          }, def.reject.bind(def));

          return def.promise;
        }
      };

      FirebaseArray.$extendFactory = function(ChildClass, methods) {
        if( arguments.length === 1 && angular.isObject(ChildClass) ) {
          methods = ChildClass;
          ChildClass = function() { return FirebaseArray.apply(this, arguments); };
        }
        return $firebaseUtils.inherit(ChildClass, FirebaseArray, methods);
      };

      return FirebaseArray;
    }
  ]);
})();