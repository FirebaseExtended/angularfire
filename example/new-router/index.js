angular.module('example', ['ngNewRouter','firebase','newRouterFire']).
  controller('AppController', ['$router', AppController]).
  controller('EditMessageController',  EditMessageController).
  controller('ListMessagesController', ListMessageController);

function AppController($router) {
  $router.config([
    { path: '/', component: 'listMessages'},
    { path: '/message/:messageId', component: 'editMessage' }
  ]);
}

function EditMessageController($routeParams, $firebaseObject){
  this.messageId = $routeParams.messageId;
  var ref = new Firebase("https://fbbug.firebaseio.com/messages/" + this.messageId);
  var sync = $firebaseObject(ref);
  sync.$bindTo(this, 'message');
}

EditMessageController.$inject = ['$routeParams', '$firebaseObject'];

function ListMessageController() {
  this.messages = ['-Jmessage1', '-Jmessage2'];
}