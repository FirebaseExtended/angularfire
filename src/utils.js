(function() {
  'use strict';

  angular.module('firebase')
    .factory('$firebaseConfig', ["$FirebaseRecordFactory", "$FirebaseArray", "$FirebaseObject",
      function($FirebaseRecordFactory, $FirebaseArray, $FirebaseObject) {
        return function(configOpts) {
          return angular.extend({
            recordFactory: $FirebaseRecordFactory,
            arrayFactory: $FirebaseArray,
            objectFactory: $FirebaseObject
          }, configOpts);
        };
      }
    ])

    .factory('$firebaseUtils', ["$q", "$timeout", "firebaseBatchDelay", '$FirebaseRecordFactory',
      function($q, $timeout, firebaseBatchDelay, $FirebaseRecordFactory) {
        function debounce(fn, wait, options) {
          if( !wait ) { wait = 0; }
          var opts = angular.extend({maxWait: wait*25||250}, options);
          var to, startTime = null, maxWait = opts.maxWait;
          function cancelTimer() {
            if( to ) { clearTimeout(to); }
          }

          function init() {
            if( !startTime ) {
              startTime = Date.now();
            }
          }

          function delayLaunch() {
            init();
            cancelTimer();
            if( Date.now() - startTime > maxWait ) {
              launch();
            }
            else {
              to = timeout(launch, wait);
            }
          }

          function timeout() {
            if( opts.scope ) {
              to = setTimeout(function() {
                try {
                  //todo should this be $digest?
                  opts.scope.$apply(launch);
                }
                catch(e) {
                  console.error(e);
                }
              }, wait);
            }
            else {
              to = $timeout(launch, wait);
            }
          }

          function launch() {
            startTime = null;
            fn();
          }

          return delayLaunch;
        }

        function assertValidRef(ref, msg) {
          if( !angular.isObject(ref) ||
            typeof(ref.ref) !== 'function' ||
            typeof(ref.transaction) !== 'function' ) {
            throw new Error(msg || 'Invalid Firebase reference');
          }
        }

        function assertValidRecordFactory(factory) {
          if( !angular.isFunction(factory) || !angular.isObject(factory.prototype) ) {
            throw new Error('Invalid argument passed for $FirebaseRecordFactory; must be a valid Class function');
          }
          var proto = $FirebaseRecordFactory.prototype;
          for (var key in proto) {
            if (proto.hasOwnProperty(key) && angular.isFunction(proto[key]) && key !== 'isValidFactory') {
              if( angular.isFunction(factory.prototype[key]) ) {
                throw new Error('Record factory does not have '+key+' method');
              }
            }
          }
        }

        // http://stackoverflow.com/questions/7509831/alternative-for-the-deprecated-proto
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
        function inherit(childClass,parentClass) {
          childClass.prototype = Object.create(parentClass.prototype);
          childClass.prototype.constructor = childClass; // restoring proper constructor for child class
        }

        function getPublicMethods(inst) {
          var methods = {};
          for (var key in inst) {
            //noinspection JSUnfilteredForInLoop
            if (typeof(inst[key]) === 'function' && !/^_/.test(key)) {
              methods[key] = inst[key];
            }
          }
          return methods;
        }

        function defer() {
          return $q.defer();
        }

        function reject(msg) {
          var def = defer();
          def.reject(msg);
          return def.promise;
        }

        return {
          debounce: debounce,
          assertValidRef: assertValidRef,
          assertValidRecordFactory: assertValidRecordFactory,
          batchDelay: firebaseBatchDelay,
          inherit: inherit,
          getPublicMethods: getPublicMethods,
          reject: reject,
          defer: defer
        };
      }]);

})();