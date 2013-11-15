angular.module('omniFire', []).
  service('firebinder', function () {
    var self = this;

    this.subscribe = function (binder) {
      binder.fbRef = new Firebase(binder.query.url);
      binder.index = [];

      typeof binder.query.limit === 'number' &&
        binder.fbRef.limit(binder.query.limit);

      typeof binder.query.startAt === 'number' &&
        binder.fbRef.startAt(binder.query.startAt);

      binder.fbRef.on('child_added', function (snapshot, prev) {
        self.onChildAdded(binder, snapshot, prev);
      });
    };

    this.onChildAdded = function onChildAdded (binder, snapshot, prev) {
      var key = snapshot.name();
      var currIndex = binder.index.indexOf(key)
      if (currIndex !== -1) {
        binder.index.splice(currIndex, 1);
      }

      if (prev) {
        var prevIndex = binder.index.indexOf(prev);
        binder.index.splice(prevIndex + 1, 0, key);
      }
      else {
        binder.index.push(key);
      }
    }
  });
