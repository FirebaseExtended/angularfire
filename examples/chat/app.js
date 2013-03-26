
angular.module('chat', ['firebase']).
controller('Chat', function($scope, angularFireCollection) {
  var el = document.getElementById("messagesDiv");
  var url = 'https://angularFire.firebaseio-demo.com/chat';
  $scope.messages = angularFireCollection(url);
  $scope.username = 'Guest' + Math.floor(Math.random()*101);
  $scope.addMessage = function() {
    $scope.messages.$add({from: $scope.username, content: $scope.message}, function() {
      el.scrollTop = el.scrollHeight;
    });
    $scope.message = "";
  }
});
