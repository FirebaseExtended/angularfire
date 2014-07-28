var app = angular.module('todo', ['firebase']);
app. controller('TodoCtrl', function Todo($scope, $firebase) {
  // Get a reference to the Firebase
  var todosFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/todo');
  var todosSync = $firebase(todosFirebaseRef);

  // Get the todos as an array
  $scope.todos = todosSync.$asArray();

  // Verify that $inst() works
  verify($scope.todos.$inst() === todosSync, "Something is wrong with $FirebaseArray.$inst().");

  /* Clears the todos Firebase reference */
  $scope.clearRef = function () {
    todosSync.$remove();
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
  }

  /* Removes the todo item with the inputted ID */
  $scope.removeTodo = function(id) {
    // Verify that $indexFor() and $keyAt() work
    verify($scope.todos.$indexFor($scope.todos.$keyAt(id)) === id, "Something is wrong with $FirebaseArray.$indexFor() or FirebaseArray.$keyAt().");

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