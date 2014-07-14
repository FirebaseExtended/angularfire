(function() {
  'use strict';
  angular.module('firebase').factory('$FirebaseArray', ["$log", "$firebaseUtils",
    function($log, $firebaseUtils) {
      function FirebaseArray($firebase, destroyFn) {
        this._observers = [];
        this._events = [];
        this._list = [];
        this._inst = $firebase;
        this._promise = this._init();
        this._destroyFn = destroyFn;
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
            return this.inst().set(key, this.$toJSON(item));
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
          return angular.isUndefined(item) || angular.isUndefined(item.$id)? null : item.$id;
        },

        indexFor: function(key) {
          // todo optimize and/or cache these? they wouldn't need to be perfect
          return this._list.findIndex(function(rec) { return rec.$id === key; });
        },

        loaded: function() {
          var promise = this._promise;
          if( arguments.length ) {
            promise = promise.then.apply(promise, arguments);
          }
          return promise;
        },

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

        destroy: function() {
          if( !this._isDestroyed ) {
            this._isDestroyed = true;
            this._list.length = 0;
            $log.debug('destroy called for FirebaseArray: '+this._inst.ref().toString());
            this._destroyFn();
          }
        },

        $created: function(snap, prevChild) {
          var i = this.indexFor(snap.name());
          if( i > -1 ) {
            this.$moved(snap, prevChild);
            this.$updated(snap, prevChild);
          }
          else {
            var dat = this.$createObject(snap);
            this._addAfter(dat, prevChild);
            this.$notify('child_added', snap.name(), prevChild);
          }
        },

        $removed: function(snap) {
          var dat = this._spliceOut(snap.name());
          if( angular.isDefined(dat) ) {
            this.$notify('child_removed', snap.name());
          }
        },

        $updated: function(snap) {
          var i = this.indexFor(snap.name());
          if( i >= 0 ) {
            var oldData = this.$toJSON(this._list[i]);
            $firebaseUtils.updateRec(this._list[i], snap);
            if( !angular.equals(oldData, this.$toJSON(this._list[i])) ) {
              this.$notify('child_changed', snap.name());
            }
          }
        },

        $moved: function(snap, prevChild) {
          var dat = this._spliceOut(snap.name());
          if( angular.isDefined(dat) ) {
            this._addAfter(dat, prevChild);
            this.$notify('child_moved', snap.name(), prevChild);
          }
        },

        $error: function(err) {
          $log.error(err);
          this.destroy(err);
        },

        $toJSON: function(rec) {
          var dat;
          if (angular.isFunction(rec.toJSON)) {
            dat = rec.toJSON();
          }
          else if(angular.isDefined(rec.$value)) {
            dat = {'.value': rec.$value};
          }
          else {
            dat = {};
            $firebaseUtils.each(rec, function (v, k) {
              if (k.match(/[.$\[\]#]/)) {
                throw new Error('Invalid key ' + k + ' (cannot contain .$[]#)');
              }
              else {
                dat[k] = v;
              }
            });
          }
          if( rec.$priority !== null && angular.isDefined(rec.$priority) ) {
            dat['.priority'] = rec.$priority;
          }
          return dat;
        },

        $createObject: function(snap) {
          var data = snap.val();
          if( !angular.isObject(data) ) {
            data = { $value: data };
          }
          data.$id = snap.name();
          data.$priority = snap.getPriority();
          return data;
        },

        $notify: function(event, key, prevChild) {
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

          // for our loaded() function
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

      FirebaseArray.extendFactory = function(ChildClass, methods) {
        if( arguments.length === 1 && angular.isObject(ChildClass) ) {
          methods = ChildClass;
          ChildClass = function() { FirebaseArray.apply(this, arguments); };
        }
        return $firebaseUtils.inherit(ChildClass, FirebaseArray, methods);
      };

      return FirebaseArray;
    }
  ]);
})();