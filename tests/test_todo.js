
casper.test.comment("Testing TODO example with implicit sync angularFire");

casper.start("tests/test_todo.html", function() {
  // Sanity test for environment.
  this.test.assertTitle("AngularFire TODO Test");
  this.test.assertEval(function() {
    if (!Firebase) return false;
    if (!AngularFire) return false;
    if (!_scope) return false;
    return true;
  }, "AngularFire exists");
});

casper.thenEvaluate(function() {
  // Clean up Firebase to start fresh test.
  var fbRef = new Firebase(_url);
  fbRef.set(null, function(err) {
    window.__flag = true;
  });
});

/*
casper.then(function() {
  var _testTodo = {
    completed: false,
    title: "Eat some Chocolate"
  };

  this.test.assertEval(function(todo) {
    _scope.newTodo = todo;
    _scope.addTodo();
    return _scope.newTodo == "";
  }, "Adding a new TODO", _testTodo);

  this.waitForSelector(".todoView", function() {
    this.test.assertEval(function(todo) {
      return testIfInDOM(todo, document.querySelector(".todoView"));
    }, "Testing if TODO is in the DOM", _testTodo);
  });
});
*/

casper.run(function() {
  this.test.done();
});

