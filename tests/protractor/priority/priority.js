var app = angular.module('priority', ['firebase']);
app.controller('PriorityCtrl', function Chat($scope, $FirebaseArray, $FirebaseObject) {
  // Get a reference to the Firebase
  var messagesFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/priority');

  // Get the chat messages as an array
  $scope.messages = new $FirebaseArray(messagesFirebaseRef);

  // Verify that $inst() works
  verify($scope.messages.$ref() === messagesFirebaseRef, 'Something is wrong with $FirebaseArray.$ref().');

  // Initialize $scope variables
  $scope.message = '';
  $scope.username = 'Guest' + Math.floor(Math.random() * 101);

  /* Clears the priority Firebase reference */
  $scope.clearRef = function () {
    messagesFirebaseRef.remove();
  };

  /* Adds a new message to the messages list */
  $scope.addMessage = function () {
    if ($scope.message !== '') {
      // Add a new message to the messages list
      var priority = $scope.messages.length;
      $scope.messages.$add({
        from: $scope.username,
        content: $scope.message
      }).then(function (ref) {
        var newItem = new $FirebaseObject(ref);

        newItem.$loaded().then(function (data) {
          verify(newItem === data, '$FirebaseObject.$loaded() does not return correct value.');

          // Update the message's priority
          newItem.$priority = priority;
          newItem.$save();
        });
      }, function (error) {
        verify(false, 'Something is wrong with $FirebaseArray.$add().');
      });

      // Reset the message input
      $scope.message = '';
    };
  };

  /* Destroys all AngularFire bindings */
  $scope.destroy = function() {
    $scope.messages.$destroy();
  };

  /* Logs a message and throws an error if the inputted expression is false */
  function verify(expression, message) {
    if (!expression) {
      console.log(message);
      throw new Error(message);
    }
  }
});