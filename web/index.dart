
import 'package:angular/angular.dart';
import 'package:firebase/firebase.dart';
import 'angularfire.dart';

@NgController(
    selector: '[af-test]',
    publishAs: 'ctrl')
class TestController {
  String test;
  Map testMap;
  AngularFire aF;
  TestController() {
    this.aF = new AngularFire(new Firebase("https://anant.firebaseio.com/dart"));
    this.testMap = new Map();
    this.testMap['foo'] = 'bar';
    this.test = 'Foo';
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