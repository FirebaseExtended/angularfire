var protractor = require('protractor');
var firebase = require('firebase');
require('../../initialize-node.js');

describe('Todo App', function () {
  // Reference to the Firebase which stores the data for this demo
  var firebaseRef;

  // Boolean used to load the page on the first test only
  var isPageLoaded = false;

  // Reference to the todos repeater
  var todos = element.all(by.repeater('(id, todo) in todos'));
  var flow = protractor.promise.controlFlow();

  function waitOne() {
    return protractor.promise.delayed(500);
  }

  function sleep() {
    flow.execute(waitOne);
  }

  function clearFirebaseRef() {
    var deferred = protractor.promise.defer();

    firebaseRef.remove(function(err) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.fulfill();
      }
    });

    return deferred.promise;
  }

  beforeEach(function (done) {
    if (!isPageLoaded) {
      isPageLoaded = true;

      // Navigate to the todo app
      browser.get('todo/todo.html').then(function() {
        return browser.waitForAngular()
      }).then(function() {
        return element(by.id('url')).evaluate('url');
      }).then(function (url) {
        // Get the random push ID where the data is being stored
        return firebase.database().refFromURL(url);
      }).then(function(ref) {
        // Update the Firebase ref to point to the random push ID
        firebaseRef = ref;

        // Clear the Firebase ref
        return clearFirebaseRef();
      }).then(done)
    } else {
      done();
    }
  });

  it('loads', function () {
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

  it('updates when a new Todo is added remotely', function (done) {
    // Simulate a todo being added remotely

    expect(todos.count()).toBe(4);
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
    }).then(function () {
      browser.wait(function() {
        return element(by.id('todo-4')).isPresent()
      }, 10000);
    }).then(function () {
      expect(todos.count()).toBe(5);
      done();
    });
  })

  it('updates when an existing Todo is removed remotely', function (done) {
    // Simulate a todo being removed remotely

    expect(todos.count()).toBe(5);
    flow.execute(function() {
      var def = protractor.promise.defer();
      var onCallback = firebaseRef.limitToLast(1).on("child_added", function(childSnapshot) {
        // Make sure we only remove a child once
        firebaseRef.off("child_added", onCallback);

        childSnapshot.ref.remove(function(err) {
          if( err ) { def.reject(err); }
          else { def.fulfill(); }
        });
      });
      return def.promise;
    }).then(function () {
      browser.wait(function() {
        return todos.count(function (count) {
          return count == 4;
        });
      }, 10000);
    }).then(function () {
      expect(todos.count()).toBe(4);
      done();
    });

  });

  it('stops updating once the sync array is destroyed', function () {
    // Destroy the sync array
    $('#destroyArrayButton').click();

    sleep();

    expect(todos.count()).toBe(0);
  });
});
