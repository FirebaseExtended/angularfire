var protractor = require('protractor');
var Firebase = require('firebase');

var ptor = protractor.getInstance();
var cleared = false;

describe('Todo App', function () {
  beforeEach(function (done) {
    // Navigate to the todo app
    ptor.get('todo/todo.html');

    // Verify the title
    expect(ptor.getTitle()).toBe('AngularFire Todo e2e Test');

    // Clear the Firebase before the first test and sleep until it's finished
    if (!cleared) {
      var firebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/');
      firebaseRef.remove(function() {
        cleared = true;
        done();
      });
    }
    else {
      ptor.sleep(500);
      done();
    }
  });

  it('loads', function() {
  });

  it('starts with an empty list of todos', function() {
    var todos = element.all(by.repeater('(id, todo) in todos'));
    expect(todos.count()).toBe(0);
  });

  it('adds new todos', function() {
    // Add three new todos by typing into the input and pressing enter
    var newTodoInput = element(by.input('newTodo'));
    newTodoInput.sendKeys('Buy groceries\n');
    newTodoInput.sendKeys('Run 10 miles\n');
    newTodoInput.sendKeys('Build Firebase\n');

    var todos = element.all(by.repeater('(id, todo) in todos'));
    expect(todos.count()).toBe(3);
  });

  it('adds random todos', function() {
    // Add a three new random todos via the provided button
    var addRandomTodoButton = element(by.id('addRandomTodo'));
    addRandomTodoButton.click();
    addRandomTodoButton.click();
    addRandomTodoButton.click();

    var todos = element.all(by.repeater('(id, todo) in todos'));
    expect(todos.count()).toBe(6);
  });

  it('updates upon new remote todos', function(done) {
    // Simulate a todo being added remotely
    var firebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/todo');
    firebaseRef.push({
      title: 'Wash the dishes',
      completed: false
    }, function() {
      var todos = element.all(by.repeater('(id, todo) in todos'));
      expect(todos.count()).toBe(7);
      done();
    });
  });

  it('updates upon removed remote todos', function(done) {
    // Simulate a todo being removed remotely
    var firebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/todo');
    firebaseRef.limit(1).on("child_added", function(childSnapshot) {
      firebaseRef.off();
      childSnapshot.ref().remove(function() {
        var todos = element.all(by.repeater('(id, todo) in todos'));
        expect(todos.count()).toBe(6);
        done();
      });
    });
  });

  it('removes todos', function() {
    // Remove two of the todos via the provided buttons
    element(by.css('.todo:nth-of-type(2) .removeTodoButton')).click();
    element(by.css('.todo:nth-of-type(3) .removeTodoButton')).click();

    var todos = element.all(by.repeater('(id, todo) in todos'));
    expect(todos.count()).toBe(4);
  });
});