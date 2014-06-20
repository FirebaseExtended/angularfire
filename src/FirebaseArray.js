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
          var dat = this._factory.create(snap);
          var i = prevChild === null? 0 : this.indexFor(prevChild);
          if( i === -1 ) { i = this._list.length; }
          this._list.splice(i, 0, dat);
          this._compile();
        },

        _serverRemove: function() {},

        _serverUpdate: function(snap) {
          var i = this.indexFor(snap.name());
          if( i >= 0 ) {
            this[i] = this._factory.update(this._list[i], snap);
            this._compile();
          }
        },

        _serverMove: function() {},

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