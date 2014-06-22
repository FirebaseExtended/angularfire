(function() {
  'use strict';
  angular.module('firebase').factory('$firebaseRecordFactory', ['$log', function($log) {
    return {
      create: function (snap) {
        return objectify(snap.val(), snap.name());
      },

      update: function (rec, snap) {
        return applyToBase(rec, objectify(snap.val(), snap.name()));
      },

      toJSON: function (rec) {
        var dat;
        if( !angular.isObject(rec) ) {
          dat = angular.isDefined(rec)? rec : null;
        }
        else {
          dat = angular.isFunction(rec.toJSON)? rec.toJSON() : angular.extend({}, rec);
          if( angular.isObject(dat) ) {
            delete dat.$id;
            for(var key in dat) {
              if(dat.hasOwnProperty(key) && key.match(/[.$\[\]#]/)) {
                $log.error('Invalid key in record (skipped):' + key);
              }
            }
          }
        }
        return dat;
      },

      destroy: function (rec) {
        if( typeof(rec.destroy) === 'function' ) {
          rec.destroy();
        }
        return rec;
      },

      getKey: function (rec) {
        if( rec.hasOwnProperty('$id') ) {
          return rec.$id;
        }
        else if( angular.isFunction(rec.getId) ) {
          return rec.getId();
        }
        else {
          return null;
        }
      },

      getPriority: function (rec) {
        if( rec.hasOwnProperty('$priority') ) {
          return rec.$priority;
        }
        else if( angular.isFunction(rec.getPriority) ) {
          return rec.getPriority();
        }
        else {
          return null;
        }
      }
    };
  }]);


  function objectify(data, id) {
    if( !angular.isObject(data) ) {
      data = { ".value": data };
    }
    if( arguments.length > 1 ) {
      data.$id = id;
    }
    return data;
  }

  function applyToBase(base, data) {
    // do not replace the reference to objects contained in the data
    // instead, just update their child values
    angular.forEach(base, function(val, key) {
      if( base.hasOwnProperty(key) &&  key !== '$id' && !data.hasOwnProperty(key) ) {
        delete base[key];
      }
    });
    angular.extend(base, data);
    return base;
  }

})();