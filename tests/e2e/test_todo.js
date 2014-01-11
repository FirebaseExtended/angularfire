
casper.test.comment("Testing TODO example with $firebase.$bind");

casper.start("tests/e2e/test_todo.html", function() {
  // Sanity test for environment.
  this.test.assertTitle("AngularFire TODO Test");
  this.test.assertEval(function() {
    if (!Firebase) return false;
    return true;
  }, "Firebase exists");
});

casper.waitFor(function() {
  return this.evaluate(function() {
    // Wait for initial data to load to check if data was merged.
    return _scope != null;
  });
});

casper.then(function() {
  var _testTodo = "Eat some Chocolate";

  this.test.assertEval(function(title) {
    _scope.newTodo = title;
    _scope.addTodo();
    _scope.$digest();
    return _scope.newTodo == "";
  }, "Adding a new TODO", _testTodo);

  // By adding this new TODO, we now should have two in the list.
  this.waitForSelector(".todoView", function() {
    this.test.assertEval(function(todo) {
      return testIfInDOM(todo, document.querySelectorAll(".todoView")[1]);
    }, "Testing if TODO is in the DOM", {title: _testTodo, completed: false});
  });
});

casper.then(function() {
  this.evaluate(function() {
    _scope.todos[Object.keys(_scope.todos)[0]].completed = true;
    _scope.$digest();
  });
  this.waitFor(function() {
    return this.evaluate(function() {
      return document.querySelector(".todoView").childNodes[1].checked === true;
    });
  });
});

casper.then(function() {
  var _testTodo = "Run for 10 miles";

  this.test.assertEval(function(title) {
    _scope.newTodo = title;
    _scope.addTodo();
    _scope.$digest();
    return _scope.newTodo == "";
  }, "Adding another TODO", _testTodo);

  this.waitFor(function() {
    return this.evaluate(function() {
      return document.querySelectorAll(".todoView").length == 3;
    });
  });
});

casper.then(function() {
  var _testTodo = "This TODO should never show up";

  this.test.assertEval(function(title) {
    _scope.$destroy();
    _scope.newTodo = title;
    _scope.addTodo();
    _scope.$digest();
    return Object.keys(_scope.todos).length == 4;
  }, "Testing if destroying $scope causes disassociate", _testTodo);

  this.evaluate(function() {
    window.__flag = false;
    var ref = new Firebase(_url);
    ref.once("value", function(snapshot) {
      if (Object.keys(snapshot.val()).length == 3) {
        window.__flag = true;
      }
    });
  });

  this.waitFor(function() {
    return this.getGlobal("__flag") === true;
  });
});

casper.run(function() {
  this.test.done();
});

