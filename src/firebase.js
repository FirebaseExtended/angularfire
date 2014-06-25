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
            var ref = this._ref.ref().push();
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
            var ref = this._ref.ref();
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
            //todo is this the best option? should remove blow away entire
            //todo data set if we are operating on a query result? probably
            //todo not; instead, we should probably forEach the results and
            //todo remove them individually
            //todo https://github.com/firebase/angularFire/issues/325
            var ref = this._ref.ref();
            var def = $firebaseUtils.defer();
            if (arguments.length > 0) {
              ref = ref.child(key);
            }
            ref.remove(this._handle(def, ref));
            return def.promise;
          },

          update: function (key, data) {
            var ref = this._ref.ref();
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
            var ref = this._ref.ref();
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