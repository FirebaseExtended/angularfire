(function() {
  'use strict';
  angular.module('firebase').factory('$FirebaseRecordFactory', function() {
    return function() {
      return {
        create: function (snap) {
          return objectify(snap.val(), snap.name());
        },

        update: function (rec, snap) {
          return applyToBase(rec, objectify(snap.val(), snap.name()));
        },

        toJSON: function (rec) {
          var dat = angular.isFunction(rec.toJSON)? rec.toJSON() : angular.extend({}, rec);
          if( angular.isObject(dat) ) {
            delete dat.$id;
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
    };
  });


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
    var key;
    for(key in base) {
      if( base.hasOwnProperty(key) &&  key !== '$id' && !data.hasOwnProperty(key) ) {
        delete base[key];
      }
    }
    for(key in data) {
      if( data.hasOwnProperty(key) ) {
        base[key] = data[key];
      }
    }
    return base;
  }

})();