angular.module('omniFire', []).
  service('firebinder', function () {
    this.subscribe = function (binder) {
      binder.fbRef = new Firebase(binder.query.url);
      typeof binder.query.limit === 'number' &&
        binder.fbRef.limit(binder.query.limit);

      typeof binder.query.startAt === 'number' &&
        binder.fbRef.startAt(binder.query.startAt);
    };
  });
