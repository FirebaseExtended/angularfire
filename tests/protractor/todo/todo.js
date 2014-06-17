var app = angular.module('todo', ['firebase']);
app. controller('Todo', function Todo($scope, $firebase) {
  // Get a reference to the Firebase
  var todosFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/todo');

  // Bind the todos using AngularFire
  $firebase(todosFirebaseRef).$bind($scope, 'todos').then(function(unbind) {
    $scope.newTodo = '';
  });

  // Clears the demo Firebase reference
  $scope.clearRef = function () {
    todosFirebaseRef.set(null);
  };

  // Adds a new todo item
  $scope.addTodo = function() {
    if ($scope.newTodo !== '') {
      if (!$scope.todos) {
        $scope.todos = {};
      }

      $scope.todos[todosFirebaseRef.push().name()] = {
        title: $scope.newTodo,
        completed: false
      };

      $scope.newTodo = '';
    }
  };

  // Adds a random todo item
  $scope.addRandomTodo = function () {
    $scope.newTodo = 'Todo ' + new Date();
    $scope.addTodo();
  }

  // Removes a todo item
  $scope.removeTodo = function(id) {
    delete $scope.todos[id];
  };
});