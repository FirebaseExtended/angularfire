'use strict';

todomvc.controller('OtherCtrl', [ '$scope', 'todoFactory', 'filterFilter',
	function OtherCtrl($scope, todoFactory, filterFilter) {
		$scope.todos = todoFactory.getAllTodos('todos');

		$scope.newTodo = '';
		$scope.editedTodo = '';

		$scope.addTodo = function() {
			todoFactory.addTodo($scope.newTodo);
		};

		$scope.editTodo = function(todo) {
			$scope.editedTodo = todo;
			todoFactory.editTodo(todo);
		};

		$scope.doneEditing = function(todo) {
			$scope.editedTodo = null;

			if (!todo.title) {
				$scope.removeTodo(todo);
			}
		};

		$scope.removeTodo = function(todo) {
			todoFactory.removeTodo(todo);
		};

		$scope.markAll = function(completed) {
			$scope.todos.forEach(function (todo) {
				todo.completed = completed;
			});
		};
	}
]);
