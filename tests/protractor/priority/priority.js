var app = angular.module('priority', ['firebase']);
app.controller('PriorityCtrl', function Chat($scope, $firebase) {
  // Get a reference to the Firebase
  var messagesFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/priority');

  // Get AngularFire sync objects
  var messagesSync = $firebase(messagesFirebaseRef);

  // Get the chat messages as an object
  $scope.messages = messagesSync.$asObject();

  // Verify that $inst() works
  verify($scope.messages.$inst() === messagesSync, 'Something is wrong with $FirebaseObject.$inst().');

  // Initialize $scope variables
  $scope.message = '';
  $scope.username = 'Guest' + Math.floor(Math.random() * 101);

  /* Clears the priority Firebase reference */
  $scope.clearRef = function () {
    chatSync.$remove();
  };

  /* Adds a new message to the messages list */
  $scope.addMessage = function() {
    if ($scope.message !== '') {
      // Add a new message to the messages list
      console.log($scope.messages);
      $scope.messages.$inst().$push({
        from: $scope.username,
        content: $scope.message
      }).then(function(ref) {
        var newItem = $firebase(ref).$asObject();

        newItem.$loaded().then(function(data) {
          setTimeout(function() {
            verify(newItem === data, '$FirebaseObject.$loaded() does not return correct value.');
            verify(newItem.content === $scope.messages[ref.name()].content, '$FirebaseObject.$push does not return current ref.');

            // Update the message's priority
            newItem.$priority = 7;
            newItem.$save();
            console.log(newItem);
          }, 100);
        });
      }, function(error) {
        verify(false, 'Something is wrong with $firebase.$push().');
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