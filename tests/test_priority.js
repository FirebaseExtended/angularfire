casper.test.comment("Testing priority changes with angularFireCollection");

casper.start("tests/test_priority.html", function() {
  // Sanity test for the environment.
  this.test.assertTitle("AngularFire Chat Test");
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
  }, "Adding a new message", [_testName, _testMessage]);

  this.waitForSelector(".messageBlock", function() {
    this.test.assertEval(function(params) {
      return testIfInDOMAtPos(
        params[0], params[1], document.querySelectorAll(".messageBlock"), 0
      );
    }, "Testing if message is in the DOM", [_testName, _testMessage]);
    this.test.assertEval(function(params) {
      return getMessagePriority(params[0]) == params[1];
    }, "Testing message is at priority 0", [0, 0]);
    
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
  }, "Adding a new message", [_testName, _testMessage]);

  this.waitForSelector(".messageBlock", function() {
    this.test.assertEval(function(params) {
      return testIfInDOMAtPos(
        params[0], params[1], document.querySelectorAll(".messageBlock"), 1
      );
    }, "Testing if message is in the DOM", [_testName, _testMessage]);
    this.test.assertEval(function(params) {
      return getMessagePriority(params[0]) == params[1];
    }, "Testing message is at priority 1", [1, 1]);
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
  }, "Adding a new message", [_testName, _testMessage]);

  this.waitForSelector(".messageBlock", function() {
    this.test.assertEval(function(params) {
      return testIfInDOMAtPos(
        params[0], params[1], document.querySelectorAll(".messageBlock"), 2
      );
    }, "Testing if message is in the DOM", [_testName, _testMessage]);
    this.test.assertEval(function(params) {
      return getMessagePriority(params[0]) == params[1];
    }, "Testing message is at priority 2", [2, 2]);
    
  });
});

casper.then(function() {
  this.evaluate(function() {
  	_scope.messages[1].$ref.setPriority(0);
  	_scope.messages[0].$ref.setPriority(1);
  	
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
  this.test.assertEval(function(params) {
  	return getMessagePriority(params[0]) == params[1];
  }, "Testing array's first element has priority 0", [0, 0]);
  this.test.assertEval(function(params) {
  	return getMessagePriority(params[0]) == params[1];
  }, "Testing array's second element has priority 1", [1, 1]);
  this.test.assertEval(function(params) {
  	return getMessagePriority(params[0]) == params[1];
  }, "Testing array's third element has priority 2", [2, 2]);
});

casper.then(function() {
  this.evaluate(function() {
  	_scope.messages[1].$ref.setPriority(0);
  	_scope.messages[0].$ref.setPriority(1);
  	
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
