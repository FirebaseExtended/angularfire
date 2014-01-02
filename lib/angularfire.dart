library angularfire;

import 'dart:async';
import 'package:angular/angular.dart';
import 'package:firebase/firebase.dart';

@NgInjectableService()
class AngularFire {
  List _idx;
  Firebase _fRef;

  Map value;
  List<String> index;

  AngularFire(this._fRef) {
    this.index = new List();
    this.value = new Map<String, dynamic>();
    this._initialize();
  }

  Future add(item) {
    var newRef = this._fRef.push();
    return newRef.set(item);
  }

  Future save([String key=null]) {
    if (key != null) {
      return this._fRef.child(key).set(this.value[key]);
    } else {
      return this._fRef.set(this.value);
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
      this.index.remove(key);
      this.value[key] = null;
    });
  }

  _processSnapshot(Event e) {
    var snap = e.snapshot;
    var prevChild = e.prevChild;
    var key = snap.name();

    // If the item is already in the list, remove it first.
    this.index.remove(key);

    // Update index. This will be used by the orderByPriority filter.
    if (prevChild != null) {
      var prevIdx = this.index.indexOf(prevChild);
      this.index.insert(prevIdx + 1, key);
    } else {
      this.index.add(key);
    }

    this.value[key] = snap.val();
  }
}
