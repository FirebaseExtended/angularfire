angular.module('omniFire', []).
  service('firebinder', function () {
    var self = this;

    this.subscribe = function (binder) {
      binder.fbRef = new Firebase(binder.query.url);
      binder.index = [];
      binder.isLocal = false;

      typeof binder.query.limit === 'number' &&
        binder.fbRef.limit(binder.query.limit);

      typeof binder.query.startAt === 'number' &&
        binder.fbRef.startAt(binder.query.startAt);

      binder.fbRef.on('child_added', function (snapshot, prev) {
        self.onChildAdded(binder, snapshot, prev);
      });
    };

    this.onChildAdded = function onChildAdded (binder, snapshot, prev) {
      if (binder.isLocal) return binder.isLocal = !binder.isLocal;

      var key = snapshot.name(),
          currIndex = binder.index.indexOf(key),
          changeObject = {
            addedCount: 1,
            removed: [],
            added: [snapshot.val()]
          },
          prevIndex;

      if (currIndex !== -1) {
        binder.index.splice(currIndex, 1);
      }

      if (prev) {
        prevIndex = binder.index.indexOf(prev);
        changeObject.index = prevIndex + 1;
        binder.index.splice(changeObject.index, 0, key);
      }
      else {
        changeObject.index = 0;
        binder.index.unshift(key);
      }

      binder.onProtocolChange.call(binder, [changeObject]);
    }
  });
