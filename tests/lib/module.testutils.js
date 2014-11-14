angular.module('testutils', ['firebase'])
  .factory('testutils', function($firebaseUtils) {
    var utils = {
      ref: function(key, base) {
        var ref = new MockFirebase().child(base||'data');
        if( key ) { ref = ref.child(key); }
        return ref;
      },

      deepCopyObject: function(obj) {
        var newCopy = angular.isArray(obj) ? obj.slice() : angular.extend({}, obj);
        for (var key in newCopy) {
          if (newCopy.hasOwnProperty(key)) {
            if (angular.isObject(newCopy[key])) {
              newCopy[key] = utils.deepCopyObject(newCopy[key]);
            }
          }
        }
        return newCopy;
      },

      snap: function(data, refKey, pri) {
        return utils.refSnap(utils.ref(refKey), data, pri);
      },

      refSnap: function(ref, data, pri) {
        data = copySnapData(data);
        return {
          ref: function () {
            return ref;
          },
          val: function () {
            return data;
          },
          getPriority: function () {
            return angular.isDefined(pri) ? pri : null;
          },
          key: function() {
            return ref.ref().key();
          },
          name: function () {
            return ref.ref().key();
          },
          child: function (key) {
            var childData = angular.isObject(data) && data.hasOwnProperty(key) ? data[key] : null;
            return utils.fakeSnap(ref.child(key), childData, null);
          }
        }
      }
    };

    function copySnapData(obj) {
      if (!angular.isObject(obj)) {
        return obj;
      }
      var copy = {};
      $firebaseUtils.each(obj, function (v, k) {
        copy[k] = angular.isObject(v) ? utils.deepCopyObject(v) : v;
      });
      return copy;
    }

    return utils;
  });