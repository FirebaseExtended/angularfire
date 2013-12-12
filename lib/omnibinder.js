angular.module("OmniBinder", []).factory("obBinder", [ "$timeout", "$q", "$parse", "$window", "obSyncEvents", "obBinderTypes", "obModelWriter", "obObserver", function($timeout, $q, $parse, $window, obSyncEvents, obBinderTypes, obModelWriter, obObserver) {
    function Binder(scope, model, protocol, options) {
        if (options = options || {}, !protocol) throw new Error("protocol is required");
        if (!scope) throw new Error("scope is required");
        if (!model) throw new Error("model is required");
        if (options.key && "string" != typeof options.key) throw new Error("key must be a string");
        this.protocol = protocol, this.scope = scope, this.model = model, this.query = options.query, 
        this.type = options.type, this.key = options.key, this.bindModel(this.type, scope, model), 
        this.protocol.subscribe(this), this.ignoreNModelChanges = 0, this.ignoreNProtocolChanges = 0;
    }
    return Binder.prototype.bindModel = function(type, scope, model) {
        switch (type) {
          case obBinderTypes.COLLECTION:
            this.observer = obObserver.observeCollection(this, scope[model], this.onModelChange);
        }
    }, Binder.prototype.onModelChange = function(changes) {
        for (var numAffectedItems = 0, delta = {
            changes: changes
        }, i = 0; i < changes.length; i++) numAffectedItems += changes.name && 1 || changes[i].addedCount + (changes[i].removed && changes[i].removed.length) || 0;
        return delta.changes.length ? this.ignoreNModelChanges ? this.ignoreNModelChanges -= numAffectedItems : (this.protocol.processChanges(this, delta), 
        void 0) : void 0;
    }, Binder.prototype.onProtocolChange = function(changes) {
        if (delta = {
            changes: changes
        }, changes.length) if (this.ignoreNProtocolChanges) {
            newChanges = [];
            for (var i = 0; i < changes.length; i++) changes[i].force && newChanges.push(changes[i]), 
            this.ignoreNProtocolChanges--;
            if (!newChanges.length) return;
            delta.changes = newChanges, obModelWriter.processChanges(this, delta);
        } else obModelWriter.processChanges(this, delta);
    }, Binder.prototype.val = function() {
        var getter = $parse(this.model);
        return getter(this.scope);
    }, function() {
        var binder = Object.create(Binder.prototype);
        return Binder.apply(binder, arguments), binder;
    };
} ]), angular.module("OmniBinder").factory("obBinderTypes", [ function() {
    return {
        COLLECTION: "collection",
        OBJECT: "object",
        BOOLEAN: "boolean",
        STRING: "string",
        NUMBER: "number",
        BINARY: "binary",
        BINARY_STREAM: "binaryStream"
    };
} ]), function() {
    var DeltaFactory = function() {};
    DeltaFactory.prototype.addChange = function(change) {
        if (!change.type) throw new Error("Change must contain a type");
        this.changes.push(change);
    }, DeltaFactory.prototype.updateObject = function(object) {
        this.object = object, angular.forEach(this.changes, function(change, i, list) {
            list[i].object = object;
        });
    }, angular.module("OmniBinder").factory("obDelta", function() {
        return function(change) {
            var delta = Object.create(DeltaFactory.prototype);
            return DeltaFactory.call(delta), delta.changes = [], change && delta.addChange(change), 
            delta;
        };
    });
}(), angular.module("OmniBinder").service("obModelWriter", [ "$parse", "obBinderTypes", "obSyncEvents", function($parse, obBinderTypes) {
    this.applyArrayChange = function(binder, change) {
        var model = $parse(binder.model)(binder.scope);
        if (change.added) {
            var firstChange = change.added.shift();
            for (model.splice(change.index, change.removed ? change.removed.length : 0, firstChange); next = change.added.shift(); ) change.index++, 
            model.splice(change.index, 0, next);
        } else model.splice(change.index, change.removed ? change.removed.length : 0);
        binder.ignoreNModelChanges += (change.removed && change.removed.length || 0) + change.addedCount, 
        $parse(binder.model).assign(binder.scope, model), binder.scope.$$phase || binder.scope.$apply();
    }, this.applyObjectChange = function(binder, change) {
        function findObject(keyName, key) {
            var obj, collection = binder.scope[binder.model];
            return angular.forEach(collection, function(item) {
                obj || (item[keyName] === key ? obj = item : "undefined" == typeof item[keyName] && (obj = item));
            }), obj;
        }
        if (binder.key) {
            var obj = findObject(binder.key, change.object[binder.key]);
            if (!obj) throw new Error("Could not find object with key" + change.object[binder.key]);
            switch (change.type) {
              case "update":
                obj[change.name] !== change.object[change.name] && binder.ignoreNModelChanges++, 
                obj[change.name] = change.object[change.name];
                break;

              case "delete":
                binder.ignoreNModelChanges++, delete obj[change.name];
                break;

              case "new":
                obj[change.name] !== change.object[change.name] && binder.ignoreNModelChanges++, 
                obj[change.name] = change.object[change.name];
            }
            binder.scope.$$phase || binder.scope.$apply();
        }
    }, this.processChanges = function(binder, delta) {
        angular.forEach(delta.changes, function(change) {
            switch (binder.type) {
              case obBinderTypes.COLLECTION:
                "number" == typeof change.index ? this.applyArrayChange(binder, change) : "string" == typeof change.name && this.applyObjectChange(binder, change);
            }
        }, this);
    };
} ]), angular.module("OmniBinder").factory("obArrayChange", function() {
    return function(addedCount, removed, index) {
        return {
            addedCount: addedCount,
            removed: removed,
            index: index
        };
    };
}).factory("obOldObject", function() {
    return function(change) {
        var oldObject = angular.copy(change.object);
        return oldObject[change.name] = change.oldValue, oldObject;
    };
}).service("obObserver", [ "obArrayChange", "obOldObject", function(obArrayChange, obOldObject) {
    this.observeObjectInCollection = function(context, collection, object, callback) {
        function onObjectObserved(changes) {
            function pushSplice(change) {
                var oldObject = obOldObject(change), index = collection.indexOf(change.object), change = obArrayChange(1, [ oldObject ], index);
                splices.push(change);
            }
            var splices = [];
            context.key ? callback.call(context, changes) : (angular.forEach(changes, pushSplice), 
            callback.call(context, splices));
        }
        this.observers[object] = onObjectObserved, Object.observe(object, onObjectObserved);
    }, this.observers = {}, this.observeCollection = function(context, collection, callback) {
        function observeOne(obj) {
            self.observeObjectInCollection(context, collection, obj, callback);
        }
        function onArrayChange(changes) {
            angular.forEach(changes, watchNewObjects), callback.call(context, changes);
        }
        function watchNewObjects(change) {
            for (var i = change.index, lastIndex = change.addedCount + change.index; lastIndex > i; ) observeOne(collection[i]), 
            i++;
            change.removed.length && angular.forEach(change.removed, function(obj) {
                Object.unobserve(obj, self.observers[obj]);
            });
        }
        var observer, self = this;
        return angular.forEach(collection, observeOne), observer = new ArrayObserver(collection, onArrayChange);
    };
} ]), angular.module("OmniBinder").value("obSyncEvents", {
    NEW: "new",
    UPDATED: "update",
    DELETED: "deleted",
    RECONFIGURED: "reconfigured",
    READ: "read",
    MOVE: "move",
    NONE: "none",
    INIT: "init",
    UNKNOWN: "unknown"
});