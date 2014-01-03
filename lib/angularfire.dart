library angularfire;

import 'dart:async';
import 'package:angular/angular.dart';
import 'package:firebase/firebase.dart';

/**
 * Top-level Firebase module.
 */
class FirebaseModule extends Module {
  FirebaseModule() {
    type(AngularFire)
    factory(Firebase, (injector) => new Firebase(injector.get(FirebaseUrl).url));
    // this shoud be everidden in application module
    type(FirebaseUrl, new FirebaseUrl('...'));
  }
}

class FirebaseUrl {
  final String url;
  FirebasUrl(this.url);
}

/**
 * A particular instance of AngularFire tied to a specific URL.
 */
class AngularFire {
  Firebase _fRef;

  List values;
  List<String> index;

  AngularFire(this._fRef) {
    this.index = new List();
    this.values = new List();
    this._initialize();
  }

  Future add(item) {
    var newRef = this._fRef.push();
    return newRef.set(item);
  }

  Future save([String key=null]) {
    if (key != null) {
      var idx = this.index.indexOf(key);
      return this._fRef.child(key).set(this._serialize(this.values[idx]));
    } else {
      return this._fRef.set(this._serialize(this.values));
    }
  }

  Future set(newValue) {
    return this._fRef.set(newValue);
  }

  Future remove([String key=null]) {
    if (key != null) {
      return this._fRef.child(key).remove();
    } else {
      return this._fRef.remove();
    }
  }

  // TODO: Add event streams for onLoaded and onChange.
  _initialize() {
    this._fRef.onChildAdded.listen(this._processSnapshot);
    this._fRef.onChildMoved.listen(this._processSnapshot);
    this._fRef.onChildChanged.listen(this._processSnapshot);
    this._fRef.onChildRemoved.listen((Event e) {
      // Remove from index.
      var key = e.snapshot.name();
      var idx = this.index.indexOf(key);
      this.index.remove(key);
      this.values.removeAt(idx);
    });
  }

  _processSnapshot(Event e) {
    var snap = e.snapshot;
    var prevChild = e.prevChild;
    var key = snap.name();

    // If the item is already in the list, remove it first.
    var idx = this.index.indexOf(key);
    if (idx != -1) {
      this.index.remove(key);
      this.values.removeAt(idx);
    }

    // Setup value.
    var val = {
      '\$key': key, '\$value': snap.val()
    };

    // Update index and value.
    if (prevChild != null) {
      var idx = this.index.indexOf(prevChild) + 1;
      this.index.insert(idx, key);
      this.values.insert(idx, val);
    } else {
      this.index.add(key);
      this.values.add(val);
    }
  }

  // TODO: Implement, convert Lists to Maps and change $ properties.
  _serialize(obj) {
    return obj;
  }
}
