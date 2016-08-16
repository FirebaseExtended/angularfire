var app = angular.module('todo', ['firebase.database']);
app. controller('TodoCtrl', function Todo($scope, $firebaseArray) {
  // Get a reference to the Firebase
  var rootRef = firebase.database().ref();

  // Store the data at a random push ID
  var todosRef = rootRef.child('todo').push();

  // Put the Firebase URL into the scope so the tests can grab it.
  $scope.url = todosRef.toString()

  // Get the todos as an array
  $scope.todos = $firebaseArray(todosRef);

  // Verify that $ref() works
  verify($scope.todos.$ref() === todosRef, "Something is wrong with $firebaseArray.$ref().");

  /* Clears the todos Firebase reference */
  $scope.clearRef = function () {
    todosRef.remove();
  };

  /* Adds a new todo item */
  $scope.addTodo = function() {
    if ($scope.newTodo !== '') {
      $scope.todos.$add({
        title: $scope.newTodo,
        completed: false
      });

      $scope.newTodo = '';
    }
  };

  /* Adds a random todo item */
  $scope.addRandomTodo = function () {
    $scope.newTodo = 'Todo ' + new Date().getTime();
    $scope.addTodo();
  };

  /* Removes the todo item with the inputted ID */
  $scope.removeTodo = function(id) {
    // Verify that $indexFor() and $keyAt() work
    verify($scope.todos.$indexFor($scope.todos.$keyAt(id)) === id, "Something is wrong with $firebaseArray.$indexFor() or FirebaseArray.$keyAt().");

    $scope.todos.$remove(id);
  };

  /* Unbinds the todos array */
  $scope.destroyArray = function() {
    $scope.todos.$destroy();
  };

  /* Logs a message and throws an error if the inputted expression is false */
  function verify(expression, message) {
    if (!expression) {
      console.log(message);
      throw new Error(message);
    }
  }
});
