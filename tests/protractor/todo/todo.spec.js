var protractor = require('protractor');
var Firebase = require('firebase');

describe('Todo App', function () {
  // Reference to the Firebase which stores the data for this demo
  var firebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/todo');

  // Boolean used to clear the Firebase on the first test only
  var firebaseCleared = false;

  // Reference to the todos repeater
  var todos = element.all(by.repeater('(id, todo) in todos'));
  var flow = protractor.promise.controlFlow();

  function waitOne() {
    return protractor.promise.delayed(500);
  }

  function sleep() {
    return flow.execute(waitOne);
  }

  beforeEach(function () {

    if( !firebaseCleared ) {
      flow.execute(purge);
    }

    // Navigate to the todo app
    browser.get('todo/todo.html');

    flow.execute(waitForData);

    function purge() {
      var def = protractor.promise.defer();
      firebaseRef.remove(function(err) {
        if( err ) { def.reject(err); return; }
        firebaseCleared = true;
        def.fulfill();
      });
      return def.promise;
    }

    function waitForData() {
      var def = protractor.promise.defer();
      firebaseRef.once('value', function() {
        waitOne().then(function() {
          def.fulfill(true);
        });
      });
      return def.promise;
    }
  });

  it('loads', function () {
  });

  it('has the correct title', function () {
    expect(browser.getTitle()).toEqual('AngularFire Todo e2e Test');
  });

  it('starts with an empty list of Todos', function () {
    expect(todos.count()).toBe(0);
  });

  it('adds new Todos', function () {
    // Add three new todos by typing into the input and pressing enter
    var newTodoInput = element(by.model('newTodo'));
    newTodoInput.sendKeys('Buy groceries\n');
    newTodoInput.sendKeys('Run 10 miles\n');
    newTodoInput.sendKeys('Build Firebase\n');

    sleep();

    expect(todos.count()).toBe(3);
  });

  it('adds random Todos', function () {
    // Add a three new random todos via the provided button
    var addRandomTodoButton = $('#addRandomTodoButton');
    addRandomTodoButton.click();
    addRandomTodoButton.click();
    addRandomTodoButton.click();

    sleep();

    expect(todos.count()).toBe(6);
  });

  it('removes Todos', function () {
    // Remove two of the todos via the provided buttons
    $('.todo:nth-of-type(2) .removeTodoButton').click();
    $('.todo:nth-of-type(3) .removeTodoButton').click();

    sleep();

    expect(todos.count()).toBe(4);
  });

  it('updates when a new Todo is added remotely', function () {
    // Simulate a todo being added remotely
    flow.execute(function() {
      var def = protractor.promise.defer();
      firebaseRef.push({
        title: 'Wash the dishes',
        completed: false
      }, function(err) {
        if( err ) { def.reject(err); }
        else { def.fulfill(); }
      });
      return def.promise;
    });
    expect(todos.count()).toBe(5);
  });

  it('updates when an existing Todo is removed remotely', function () {
    // Simulate a todo being removed remotely
    flow.execute(function() {
      var def = protractor.promise.defer();
      var onCallback = firebaseRef.limitToLast(1).on("child_added", function(childSnapshot) {
        // Make sure we only remove a child once
        firebaseRef.off("child_added", onCallback);

        childSnapshot.ref().remove(function(err) {
          if( err ) { def.reject(err); }
          else { def.fulfill(); }
        });
      });
      return def.promise;
    });
    expect(todos.count()).toBe(4);
  });

  it('stops updating once the sync array is destroyed', function () {
    // Destroy the sync array
    $('#destroyArrayButton').click();

    sleep();

    expect(todos.count()).toBe(0);
  });
});