var app = angular.module('priority', ['firebase']);
app.controller('PriorityCtrl', function Chat($scope, $firebase) {
  // Get a reference to the Firebase
  var messagesFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/priority');

  // Get the messages as an AngularFire sync object
  var messagesSync = $firebase(messagesFirebaseRef);

  // Get the chat messages as an array
  $scope.messages = messagesSync.$asArray();

  // Verify that $inst() works
  verify($scope.messages.$inst() === messagesSync, 'Something is wrong with $FirebaseArray.$inst().');

  // Initialize $scope variables
  $scope.message = '';
  $scope.username = 'Guest' + Math.floor(Math.random() * 101);

  /* Clears the priority Firebase reference */
  $scope.clearRef = function () {
    messagesSync.$remove();
  };

  /* Adds a new message to the messages list */
  $scope.addMessage = function () {
    if ($scope.message !== '') {
      // Add a new message to the messages list
      var priority = $scope.messages.length;
      $scope.messages.$inst().$push({
        from: $scope.username,
        content: $scope.message
      }).then(function (ref) {
        var newItem = $firebase(ref).$asObject();

        newItem.$loaded().then(function (data) {
          verify(newItem === data, '$FirebaseArray.$loaded() does not return correct value.');

          // Update the message's priority
          // Note: we need to also update a non-$priority variable since Angular won't
          // recognize the change otherwise
          newItem.a = priority;
          newItem.$priority = priority;
          newItem.$save();
        });
      }, function (error) {
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