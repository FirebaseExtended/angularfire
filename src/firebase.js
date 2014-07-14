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
          this._arraySync = null;
          this._objectSync = null;
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
            if (!this._objectSync || this._objectSync.$isDestroyed) {
              this._objectSync = new SyncObject(this, this._config.objectFactory);
            }
            return this._objectSync.getObject();
          },

          asArray: function () {
            if (!this._arraySync || this._arraySync._isDestroyed) {
              this._arraySync = new SyncArray(this, this._config.arrayFactory);
            }
            return this._arraySync.getArray();
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
          }
        };

        function SyncArray($inst, ArrayFactory) {
          function destroy() {
            self.$isDestroyed = true;
            var ref = $inst.ref();
            ref.off('child_added', created);
            ref.off('child_moved', moved);
            ref.off('child_changed', updated);
            ref.off('child_removed', removed);
            array = null;
          }

          function init() {
            var ref = $inst.ref();

            // listen for changes at the Firebase instance
            ref.on('child_added', created, error);
            ref.on('child_moved', moved, error);
            ref.on('child_changed', updated, error);
            ref.on('child_removed', removed, error);
          }

          var array = new ArrayFactory($inst, destroy);
          var batch = $firebaseUtils.batch();
          var created = batch(array.$created, array);
          var updated = batch(array.$updated, array);
          var moved = batch(array.$moved, array);
          var removed = batch(array.$removed, array);
          var error = batch(array.$error, array);

          var self = this;
          self.$isDestroyed = false;
          self.getArray = function() { return array; };
          init();
        }

        function SyncObject($inst, ObjectFactory) {
          function destroy() {
            self.$isDestroyed = true;
            ref.off('value', applyUpdate);
            obj = null;
          }

          function init() {
            ref.on('value', applyUpdate, error);
          }

          var obj = new ObjectFactory($inst, destroy);
          var ref = $inst.ref();
          var batch = $firebaseUtils.batch();
          var applyUpdate = batch(obj.$updated, obj);
          var error = batch(obj.$error, obj);

          var self = this;
          self.$isDestroyed = false;
          self.getObject = function() { return obj; };
          init();
        }

        return AngularFire;
      }
    ]);
})();