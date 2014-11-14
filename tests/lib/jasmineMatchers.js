/**
 * Adds matchers to Jasmine so they can be called from test units
 * These are handy for debugging because they produce better error
 * messages than "Expected false to be true"
 */
beforeEach(function() {
  'use strict';

  function extendedTypeOf(x) {
    var actual;
    if( isArray(x) ) {
      actual = 'array';
    }
    else if( x === null ) {
      actual = 'null';
    }
    else {
      actual = typeof x;
    }
    return actual.toLowerCase();
  }

  jasmine.addMatchers({
    toBeAFirebaseRef: function() {
      return {
        compare: function(actual) {
          var type = extendedTypeOf(actual);
          var pass = isFirebaseRef(actual);
          var notText = pass? ' not' : '';
          var msg = 'Expected ' + type + notText + ' to be a Firebase ref';
          return {pass: pass, message: msg};
        }
      }
    },

    toBeASnapshot: function() {
      return {
        compare: function(actual) {
          var type = extendedTypeOf(actual);
          var pass =
            type === 'object' &&
            typeof actual.val === 'function' &&
            typeof actual.ref === 'function' &&
            typeof actual.name === 'function';
          var notText = pass? ' not' : '';
          var msg = 'Expected ' + type + notText + ' to be a Firebase snapshot';
          return {pass: pass, message: msg};
        }
      }
    },

    toBeAPromise: function() {
      return {
        compare: function(obj) {
          var objType = extendedTypeOf(obj);
          var pass =
            objType === 'object' &&
            typeof obj.then === 'function' &&
            typeof obj.catch === 'function' &&
            typeof obj.finally === 'function';
          var notText = pass? ' not' : '';
          var msg = 'Expected ' + objType + notText + ' to be a promise';
          return {pass: pass, message: msg};
        }
      }
    },

    // inspired by: https://gist.github.com/prantlf/8631877
    toBeInstanceOf: function() {
      return {
        compare: function (actual, expected, name) {
          var result = {
            pass: actual instanceof expected
          };
          var notText = result.pass? ' not' : '';
          result.message = 'Expected ' + actual + notText + ' to be an instance of ' + (name||expected.constructor.name);
          return result;
        }
      };
    },

    /**
     * Checks type of a value. This method will also accept null and array
     * as valid types. It will not treat null or arrays as objects. Multiple
     * types can be passed into this method and it will be true if any matches
     * are found.
     */
    toBeA: function() {
      return {
        compare: function() {
          var args = Array.prototype.slice.apply(arguments);
          return compare.apply(null, ['a'].concat(args));
        }
      };
    },

    toBeAn: function() {
      return {
        compare: function(actual) {
          var args = Array.prototype.slice.apply(arguments);
          return compare.apply(null, ['an'].concat(args));
        }
      }
    },

    toHaveKey: function() {
      return {
        compare: function(actual, key) {
          var pass =
            actual &&
            typeof(actual) === 'object' &&
            actual.hasOwnProperty(key);
          var notText = pass? ' not' : '';
          return {
            pass: pass,
            message: 'Expected key ' + key + notText + ' to exist in ' + extendedTypeOf(actual)
          }
        }
      }
    },

    toHaveLength: function() {
      return {
        compare: function(actual, len) {
          var actLen = isArray(actual)? actual.length : 'not an array';
          var pass = actLen === len;
          var notText = pass? ' not' : '';
          return {
            pass: pass,
            message: 'Expected array ' + notText + ' to have length ' + len + ', but it was ' + actLen
          }
        }
      }
    },

    toBeEmpty: function() {
      return {
        compare: function(actual) {
          var pass, contents;
          if( isObject(actual) ) {
            actual = Object.keys(actual);
          }
          if( isArray(actual) ) {
            pass = actual.length === 0;
            contents = 'had ' + actual.length + ' items';
          }
          else {
            pass = false;
            contents = 'was not an array or object';
          }
          var notText = pass? ' not' : '';
          return {
            pass: pass,
            message: 'Expected collection ' + notText + ' to be empty, but it ' + contents
          }
        }
      }
    },

    toHaveCallCount: function() {
      return {
        compare: function(spy, expCount) {
          var pass, not, count;
          count = spy.calls.count();
          pass = count === expCount;
          not = pass? '" not' : '"';
          return {
            pass: pass,
            message: 'Expected spy "' + spy.and.identity() + not + ' to have been called ' + expCount + ' times'
            + (pass? '' : ', but it was called ' + count)
          }
        }
      }
    }
  });

  function isObject(x) {
    return x && typeof(x) === 'object' && !isArray(x);
  }

  function isArray(x) {
    if (typeof Array.isArray !== 'function') {
      return x && typeof x === 'object' && Object.prototype.toString.call(x) === '[object Array]';
    }
    return Array.isArray(x);
  }

  function isFirebaseRef(obj) {
    return extendedTypeOf(obj) === 'object' &&
      typeof obj.ref === 'function' &&
      typeof obj.set === 'function' &&
      typeof obj.on === 'function' &&
      typeof obj.once === 'function' &&
      typeof obj.transaction === 'function';
  }

  // inspired by: https://gist.github.com/prantlf/8631877
  function compare(article, actual) {
    var validTypes = Array.prototype.slice.call(arguments, 2);
    if( !validTypes.length ) {
      throw new Error('Must pass at least one valid type into toBeA() and toBeAn() functions');
    }
    var verbiage = validTypes.length === 1 ? 'to be ' + article : 'to be one of';
    var actualType = extendedTypeOf(actual);

    var found = false;
    for (var i = 0, len = validTypes.length; i < len; i++) {
      found = validTypes[i].toLowerCase() === actualType;
      if( found ) { break; }
    }

    var notText = found? ' not' : '';
    var message = 'Expected ' + actualType + notText + ' ' + verbiage + ' ' + validTypes;

    return { pass: found, message: message };
  }
});