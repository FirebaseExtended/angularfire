(function() {
  'use strict';
  angular.module('firebase').factory('$firebaseRecordFactory', ['$log', function($log) {
    return {
      create: function (snap) {
        return objectify(snap.val(), snap.name(), snap.getPriority());
      },

      update: function (rec, snap) {
        return applyToBase(rec, objectify(snap.val(), null, snap.getPriority()));
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
              if(dat.hasOwnProperty(key) && key !== '.value' && key !== '.priority' && key.match(/[.$\[\]#]/)) {
                $log.error('Invalid key in record (skipped):' + key);
                delete dat[key];
              }
            }
          }
          var pri = this.getPriority(rec);
          if( pri !== null ) {
            dat['.priority'] = pri;
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
        if( rec.hasOwnProperty('.priority') ) {
          return rec['.priority'];
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


  function objectify(data, id, pri) {
    if( !angular.isObject(data) ) {
      data = { ".value": data };
    }
    if( angular.isDefined(id) && id !== null ) {
      data.$id = id;
    }
    if( angular.isDefined(pri) && pri !== null ) {
      data['.priority'] = pri;
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