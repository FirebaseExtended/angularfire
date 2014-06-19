'use strict';

angular.module("firebase")

  // The factory returns an object containing the value of the data at
  // the Firebase location provided, as well as several methods. It
  // takes one or two arguments:
  //
  //   * `ref`: A Firebase reference. Queries or limits may be applied.
  //   * `config`: An object containing any of the advanced config options explained in API docs
  .factory("$firebase", [ "$q", "$firebaseUtils", "$firebaseConfig",
    function($q, $firebaseUtils, $firebaseConfig) {
      function AngularFire(ref, config) {
        // make the new keyword optional
        if( !(this instanceof AngularFire) ) {
          return new AngularFire(ref, config);
        }
        this._config = $firebaseConfig(config);
        this._ref = ref;
        this._array = null;
        this._object = null;
        this._assertValidConfig(ref, this._config);
      }

      AngularFire.prototype = {
        ref: function() { return this._ref; },

        add: function(data) {
          var def = $q.defer();
          var ref = this._ref.push();
          var done = this._handle(def, ref);
          if( arguments.length > 0 ) {
            ref.set(data, done);
          }
          else {
            done();
          }
          return def.promise;
        },

        set: function(key, data) {
          var ref = this._ref;
          var def = $q.defer();
          if( arguments.length > 1 ) {
            ref = ref.child(key);
          }
          else {
            data = key;
          }
          ref.set(data, this._handle(def));
          return def.promise;
        },

        remove: function(key) {
          var ref = this._ref;
          var def = $q.defer();
          if( arguments.length > 0 ) {
            ref = ref.child(key);
          }
          ref.remove(this._handle(def));
          return def.promise;
        },

        update: function(key, data) {
          var ref = this._ref;
          var def = $q.defer();
          if( arguments.length > 1 ) {
            ref = ref.child(key);
          }
          else {
            data = key;
          }
          ref.update(data, this._handle(def));
          return def.promise;
        },

        transaction: function() {}, //todo

        asObject: function() {
          if( !this._object ) {
            this._object = new this._config.objectFactory(this);
          }
          return this._object;
        },

        asArray: function() {
          if( !this._array ) {
            this._array = new this._config.arrayFactory(this, this._config.recordFactory);
          }
          return this._array;
        },

        _handle: function(def) {
          var args = Array.prototype.slice.call(arguments, 1);
          return function(err) {
            if( err ) { def.reject(err); }
            else { def.resolve.apply(def, args); }
          };
        },

        _assertValidConfig: function(ref, cnf) {
          $firebaseUtils.assertValidRef(ref, 'Must pass a valid Firebase reference ' +
            'to $firebase (not a string or URL)');
          $firebaseUtils.assertValidRecordFactory(cnf.recordFactory);
          if( typeof(cnf.arrayFactory) !== 'function' ) {
            throw new Error('config.arrayFactory must be a valid function');
          }
          if( typeof(cnf.objectFactory) !== 'function' ) {
            throw new Error('config.arrayFactory must be a valid function');
          }
        }
      };

      return AngularFire;
    }
  ]);
