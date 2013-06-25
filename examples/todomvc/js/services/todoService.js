/*global todomvc */
'use strict';

todomvc.factory('todoFactory', [
	'angularFireCollection',

	function todoFactory(angularFireCollection) {
		var url = 'https://angularFire.firebaseio-demo.com/todomvc';

		return {
			addTodo: function(newTodo) {
				this.getAllTodos('todos').add({
					title: newTodo,
					completed: false
				}, function() {

				});
			},
			getAllTodos: function(path) {
				var ref = angularFireCollection(url + '/' + path);
				return ref;
			},
			editTodo: function(todo) {
				this.getAllTodos('todos').update(todo);
			},
			removeTodo: function(todo) {
				this.getAllTodos('todos').remove(todo);
			}
		};
	}
]);