casper.test.comment("Testing priority changes with $firebase");

casper.start("tests/e2e/test_priority.html", function() {
  // Sanity test for the environment.
  this.test.assertTitle("AngularFire Priority Test");
  this.test.assertEval(function() {
    if (!Firebase) return false;
    if (!_scope) return false;
    return true;
  }, "Firebase exists");
});

casper.thenEvaluate(function() {
  // Clean up Firebase to start fresh test.
  var fbRef = new Firebase(_url);
  fbRef.set(null, function(err) {
    window.__flag = true;
  });
});

casper.waitFor(function() {
  return this.getGlobal("__flag") === true;
});

casper.then(function() {

  var _testName = "TestGuest";
  var _testMessage = "First message";

  this.test.assertEval(function(params) {
    _scope.username = params[0];
    _scope.message = params[1];
    _scope.addMessage();
    return _scope.message == "";
  }, "Adding a first message", [_testName, _testMessage]);

  this.waitForSelector(".messageBlock", function() {
    this.test.assertEval(function(params) {
      return testIfInDOMAtPos(
        params[0], params[1], document.querySelectorAll(".messageBlock"), 0
      );
    }, "Testing if first message is in the DOM", [_testName, _testMessage]);
    this.test.assertEvalEquals(function(params) {
      return getMessagePriority(0);
    }, 0, "Testing first message is at priority 0");
  });
});

casper.then(function() {

  var _testName = "TestGuest";
  var _testMessage = "Second message";

  this.test.assertEval(function(params) {
    _scope.username = params[0];
    _scope.message = params[1];
    _scope.addMessage();
    return _scope.message == "";
  }, "Adding a second message", [_testName, _testMessage]);

  this.waitForSelector(".messageBlock", function() {
    this.test.assertEval(function(params) {
      return testIfInDOMAtPos(
        params[0], params[1], document.querySelectorAll(".messageBlock"), 1
      );
    }, "Testing if second message is in the DOM", [_testName, _testMessage]);
    this.test.assertEvalEquals(function(params) {
      return getMessagePriority(1);
    }, 1, "Testing if second message is at priority 1");
  });
});

casper.then(function() {

  var _testName = "TestGuest";
  var _testMessage = "Third message";

  this.test.assertEval(function(params) {
    _scope.username = params[0];
    _scope.message = params[1];
    _scope.addMessage();
    return _scope.message == "";
  }, "Adding a third message", [_testName, _testMessage]);

  this.waitForSelector(".messageBlock", function() {
    this.test.assertEval(function(params) {
      return testIfInDOMAtPos(
        params[0], params[1], document.querySelectorAll(".messageBlock"), 2
      );
    }, "Testing if third message is in the DOM", [_testName, _testMessage]);
    this.test.assertEvalEquals(function(params) {
      return getMessagePriority(2);
    }, 2, "Testing if third message is at priority 2");
  });
});

casper.then(function() {
  this.evaluate(function() {
    _scope.messages[_scope.messages.$getIndex()[1]].$priority = 0;
    _scope.messages[_scope.messages.$getIndex()[0]].$priority = 1;
    _scope.messages.$save();

    window.__flag = null;
    var ref = new Firebase(_url);
    ref.once("value", function(snapshot) {
      window.__flag = snapshot.val();
    });
  }, "Moving second to first");

  this.waitFor(function() {
    return this.getGlobal("__flag") != null;
  }, function() {
    this.test.assertEval(function(params) {
      var nodes = document.querySelectorAll(".messageBlock");
      return testIfInDOMAtPos(params[0], params[1], nodes, 1);
    }, "Testing if first message moved to second position", ["TestGuest", "First message"]);

    this.test.assertEval(function(params) {
      var nodes = document.querySelectorAll(".messageBlock");
      return testIfInDOMAtPos(params[0], params[1], nodes, 0);
    }, "Testing if second message moved to first position", ["TestGuest", "Second message"]);
  });
});

casper.then(function() {
  var checkPrio = function (idx) { return getMessagePriority(idx); }
  this.test.assertEvalEquals(checkPrio, 0, "Testing array's first element has priority 0", 0);
  this.test.assertEvalEquals(checkPrio, 1, "Testing array's second element has priority 1", 1);
  this.test.assertEvalEquals(checkPrio, 2, "Testing array's third element has priority 2", 2);
});

casper.then(function() {
  this.evaluate(function() {
    _scope.messages[_scope.messages.$getIndex()[1]].$priority = 0;
    _scope.messages[_scope.messages.$getIndex()[0]].$priority = 1;
    _scope.messages.$save();

    window.__flag = null;
    var ref = new Firebase(_url);
    ref.once("value", function(snapshot) {
      window.__flag = snapshot.val();
    });
  }, "Moving first message back to first position");

  this.waitFor(function() {
    return this.getGlobal("__flag") != null;
  }, function() {
    this.test.assertEval(function(params) {
      var nodes = document.querySelectorAll(".messageBlock");
      return testIfInDOMAtPos(params[0], params[1], nodes, 0);
    }, "Testing if first message moved to first position", ["TestGuest", "First message"]);

    this.test.assertEval(function(params) {
      var nodes = document.querySelectorAll(".messageBlock");
      return testIfInDOMAtPos(params[0], params[1], nodes, 1);
    }, "Testing if second message moved to second position", ["TestGuest", "Second message"]);
  });
});

casper.run(function() {
  this.test.done();
});
