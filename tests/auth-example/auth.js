var app = angular.module('auth',['firebase']);

app.controller('MainCtrl',function($scope,$firebaseAuth,$location){

  var ref = new Firebase('https://jrtechnical-testing.firebaseio.com/authtesting');

  var auth = $firebaseAuth(ref);

  $scope.data = {};

  auth.$bindTo($scope,'data.authData');

  $scope.prettyData = function(){
    return angular.toJson($scope.data.authData,true);
  };

  $scope.authMode=$location.search().authMode || 'popup';

  $scope.$watch('authMode',function(newValue, oldValue){
    if(newValue !== oldValue){
      $location.search('authMode',newValue);
    }
  });

  $scope.login = function (provider){
    switch ($scope.authMode) {
      case 'popup' :
        return auth.$authWithOAuthPopup(provider);
      case 'redirect' :
        return auth.$authWithOAuthRedirect(provider);
      default :
        throw new Error('authMode not set correctly');
    }
  };

  $scope.anonymous = auth.$authAnonymously;
  $scope.logout = auth.$unauth;

});