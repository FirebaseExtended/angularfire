
import 'package:angular/angular.dart';
import 'package:firebase/firebase.dart';
import 'package:angularfire/angularfire.dart';

@NgController(
    selector: '[af-test]',
    publishAs: 'ctrl')
class TestController {
  String test;
  AngularFire sample;
  TestController() {
    this.test = 'Foo';
    this.sample = new AngularFire(new Firebase("https://anant.firebaseio.com/dart"));
  }
  void addItem(e) {
    if (e.keyCode != 13) {
      return;
    }
    this.sample.add(this.test).then((f) {
      this.test = "";
    });
    e.preventDefault();
  }
}

class TestAppModule extends Module {
  TestAppModule() {
    type(TestController);
  }
}

main() {
  ngBootstrap(module: new TestAppModule());
}