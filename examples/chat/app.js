
angular.module('chat', ['firebase']).
controller('Chat', ['$scope', '$timeout', 'angularFireCollection',
  function($scope, $timeout, angularFireCollection) {
    var el = document.getElementById("messagesDiv");
    var url = 'https://angularFire.firebaseio-demo.com/chat';
    $scope.messages = angularFireCollection(url, function() {
      $timeout(function() { el.scrollTop = el.scrollHeight; });
    });
    $scope.username = 'Guest' + Math.floor(Math.random()*101);
    $scope.addMessage = function() {
      $scope.messages.add({from: $scope.username, content: $scope.message}, function() {
        el.scrollTop = el.scrollHeight;
      });
      $scope.message = "";
    }
  }
]);
