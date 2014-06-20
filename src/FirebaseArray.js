(function() {
  'use strict';
  angular.module('firebase').factory('$FirebaseArray', ["$log", "$firebaseUtils",
    function($log, $firebaseUtils) {
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
          var key = this.keyAt(item);
          if( key !== null ) {
            return this.inst().set(key, this._factory.toJSON(item), this._compile);
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
            this._serverMove(snap, prevChild);
          }
          else {
            var dat = this._factory.create(snap);
            this._addAfter(dat, prevChild);
            this._compile();
          }
        },

        _serverRemove: function(snap) {
          var dat = this._spliceOut(snap.name());
          if( angular.isDefined(dat) ) {
            this._compile();
          }
        },

        _serverUpdate: function(snap) {
          var i = this.indexFor(snap.name());
          if( i >= 0 ) {
            this[i] = this._factory.update(this._list[i], snap);
            this._compile();
          }
        },

        _serverMove: function(snap, prevChild) {
          var dat = this._spliceOut(snap.name());
          if( angular.isDefined(dat) ) {
            this._addAfter(dat, prevChild);
            this._compile();
          }
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

        _compile: function() {
          // does nothing for now, the debounce invokes $timeout and this method
          // is run internally; could be decorated by apps, but no default behavior
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
          var methods = $firebaseUtils.getPublicMethods(self);
          angular.forEach(methods, function(fn, key) {
            list[key] = fn.bind(self);
          });

          // we debounce the compile function so that angular's digest only needs to do
          // dirty checking once for each "batch" of updates that come in close proximity
          self._compile = $firebaseUtils.debounce(self._compile.bind(self), $firebaseUtils.batchDelay);

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