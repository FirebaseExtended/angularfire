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
          this._isDestroyed = true;
          if( err ) { $log.error(err); }
          if( this._list ) {
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