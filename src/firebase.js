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
          $ref: function () {
            return this._ref;
          },

          $push: function (data) {
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

          $set: function (key, data) {
            var ref = this._ref;
            var def = $firebaseUtils.defer();
            if (arguments.length > 1) {
              ref = ref.ref().child(key);
            }
            else {
              data = key;
            }
            if( angular.isFunction(ref.set) || !angular.isObject(data) ) {
              // this is not a query, just do a flat set
              ref.set(data, this._handle(def, ref));
            }
            else {
              var dataCopy = angular.extend({}, data);
              // this is a query, so we will replace all the elements
              // of this query with the value provided, but not blow away
              // the entire Firebase path
              ref.once('value', function(snap) {
                snap.forEach(function(ss) {
                  if( !dataCopy.hasOwnProperty($firebaseUtils.getKey(ss)) ) {
                    dataCopy[$firebaseUtils.getKey(ss)] = null;
                  }
                });
                ref.ref().update(dataCopy, this._handle(def, ref));
              }, this);
            }
            return def.promise;
          },

          $remove: function (key) {
            var ref = this._ref, self = this;
            var def = $firebaseUtils.defer();
            if (arguments.length > 0) {
              ref = ref.ref().child(key);
            }
            if( angular.isFunction(ref.remove) ) {
              // self is not a query, just do a flat remove
              ref.remove(self._handle(def, ref));
            }
            else {
              // self is a query so let's only remove the
              // items in the query and not the entire path
              ref.once('value', function(snap) {
                var promises = [];
                snap.forEach(function(ss) {
                  var d = $firebaseUtils.defer();
                  promises.push(d.promise);
                  ss.ref().remove(self._handle(d));
                }, self);
                $firebaseUtils.allPromises(promises)
                  .then(function() {
                    def.resolve(ref);
                  },
                  function(err){
                    def.reject(err);
                  }
                );
              });
            }
            return def.promise;
          },

          $update: function (key, data) {
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

          $transaction: function (key, valueFn, applyLocally) {
            var ref = this._ref.ref();
            if( angular.isFunction(key) ) {
              applyLocally = valueFn;
              valueFn = key;
            }
            else {
              ref = ref.child(key);
            }
            applyLocally = !!applyLocally;

            return new $firebaseUtils.promise(function(resolve,reject){
              ref.transaction(valueFn, function(err, committed, snap) {
                if( err ) {
                  reject(err);
                  return;
                }
                else {
                  resolve(committed? snap : null);
                  return;
                }
              }, applyLocally);
            });
          },

          $asObject: function () {
            if (!this._objectSync || this._objectSync.isDestroyed) {
              this._objectSync = new SyncObject(this, this._config.objectFactory);
            }
            return this._objectSync.getObject();
          },

          $asArray: function () {
            if (!this._arraySync || this._arraySync.isDestroyed) {
              this._arraySync = new SyncArray(this, this._config.arrayFactory);
            }
            return this._arraySync.getArray();
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
              throw new Error('config.objectFactory must be a valid function');
            }
          }
        };

        function SyncArray($inst, ArrayFactory) {
          function destroy(err) {
            self.isDestroyed = true;
            var ref = $inst.$ref();
            ref.off('child_added', created);
            ref.off('child_moved', moved);
            ref.off('child_changed', updated);
            ref.off('child_removed', removed);
            array = null;
            resolve(err||'destroyed');
          }

          function init() {
            var ref = $inst.$ref();

            // listen for changes at the Firebase instance
            ref.on('child_added', created, error);
            ref.on('child_moved', moved, error);
            ref.on('child_changed', updated, error);
            ref.on('child_removed', removed, error);

            // determine when initial load is completed
            ref.once('value', function() { resolve(null); }, resolve);
          }

          // call resolve(), do not call this directly
          function _resolveFn(err) {
            if( def ) {
              if( err ) { def.reject(err); }
              else { def.resolve(array); }
              def = null;
            }
          }

          var def     = $firebaseUtils.defer();
          var array   = new ArrayFactory($inst, destroy, def.promise);
          var batch   = $firebaseUtils.batch();
          var created = batch(function(snap, prevChild) {
            var rec = array.$$added(snap, prevChild);
            if( rec ) {
              array.$$process('child_added', rec, prevChild);
            }
          });
          var updated = batch(function(snap) {
            var rec = array.$getRecord($firebaseUtils.getKey(snap));
            if( rec ) {
              var changed = array.$$updated(snap);
              if( changed ) {
                array.$$process('child_changed', rec);
              }
            }
          });
          var moved   = batch(function(snap, prevChild) {
            var rec = array.$getRecord($firebaseUtils.getKey(snap));
            if( rec ) {
              var confirmed = array.$$moved(snap, prevChild);
              if( confirmed ) {
                array.$$process('child_moved', rec, prevChild);
              }
            }
          });
          var removed = batch(function(snap) {
            var rec = array.$getRecord($firebaseUtils.getKey(snap));
            if( rec ) {
              var confirmed = array.$$removed(snap);
              if( confirmed ) {
                array.$$process('child_removed', rec);
              }
            }
          });

          assertArray(array);

          var error   = batch(array.$$error, array);
          var resolve = batch(_resolveFn);

          var self = this;
          self.isDestroyed = false;
          self.getArray = function() { return array; };

          init();
        }

        function assertArray(arr) {
          if( !angular.isArray(arr) ) {
            var type = Object.prototype.toString.call(arr);
            throw new Error('arrayFactory must return a valid array that passes ' +
            'angular.isArray and Array.isArray, but received "' + type + '"');
          }
        }

        function SyncObject($inst, ObjectFactory) {
          function destroy(err) {
            self.isDestroyed = true;
            ref.off('value', applyUpdate);
            obj = null;
            resolve(err||'destroyed');
          }

          function init() {
            ref.on('value', applyUpdate, error);
            ref.once('value', function() { resolve(null); }, resolve);
          }

          // call resolve(); do not call this directly
          function _resolveFn(err) {
            if( def ) {
              if( err ) { def.reject(err); }
              else { def.resolve(obj); }
              def = null;
            }
          }

          var def = $firebaseUtils.defer();
          var obj = new ObjectFactory($inst, destroy, def.promise);
          var ref = $inst.$ref();
          var batch = $firebaseUtils.batch();
          var applyUpdate = batch(function(snap) {
            var changed = obj.$$updated(snap);
            if( changed ) {
              // notifies $watch listeners and
              // updates $scope if bound to a variable
              obj.$$notify();
            }
          });
          var error = batch(obj.$$error, obj);
          var resolve = batch(_resolveFn);

          var self = this;
          self.isDestroyed = false;
          self.getObject = function() { return obj; };
          init();
        }

        return AngularFire;
      }
    ]);
})();
