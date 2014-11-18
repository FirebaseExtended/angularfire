describe('FirebaseAuth',function(){
  'use strict';

  var $firebaseAuth, ref, auth, result, failure, wrapPromise, $timeout;

  beforeEach(function(){

    module('mock.firebase');
    module('firebase');
    module('testutils');

    result = null;
    failure = null;

    ref = jasmine.createSpyObj('ref',
      ['authWithCustomToken','authAnonymously','authWithPassword',
        'authWithOAuthPopup','authWithOAuthRedirect','authWithOAuthToken'
      ]);

    inject(function(_$firebaseAuth_,_$timeout_){
      $firebaseAuth = _$firebaseAuth_;
      auth = $firebaseAuth(ref);
      $timeout = _$timeout_;
    });

    wrapPromise = function(promise){
      promise.then(function(_result_){
        result = _result_;
      },function(_failure_){
        failure = _failure_;
      });
    }
  });

  function getArgIndex(callbackName){
    //In the firebase API, the completion callback is the second argument for all but two functions.
    switch (callbackName){
      case 'authAnonymously':
        return 0;
      case 'authWithOAuthToken':
        return 2;
      default :
        return 1;
    }
  }

  function callback(callbackName,callIndex){
    callIndex = callIndex || 0; //assume the first call.
    var argIndex = getArgIndex(callbackName);
    return ref[callbackName].calls.argsFor(callIndex)[argIndex];
  }

  describe('.$authWithCustomToken',function(){

    it('passes custom token to underlying method',function(){
      auth.$authWithCustomToken('myToken');
      expect(ref.authWithCustomToken).toHaveBeenCalledWith('myToken',jasmine.any(Function));
    });

    it('will revoke the promise if authentication fails',function(){
      wrapPromise(auth.$authWithCustomToken('myToken'));
      callback('authWithCustomToken')('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      wrapPromise(auth.$authWithCustomToken('myToken'));
      callback('authWithCustomToken')(null,'myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });

  });

  describe('.$authAnonymously',function(){

    it('passes options object to underlying method',function(){
      var options = {someOption:'a'};
      auth.$authAnonymously(options);
      expect(ref.authAnonymously).toHaveBeenCalledWith(jasmine.any(Function),{someOption:'a'});
    });

    it('will revoke the promise if authentication fails',function(){
      wrapPromise(auth.$authAnonymously());
      callback('authAnonymously')('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      wrapPromise(auth.$authAnonymously());
      callback('authAnonymously')(null,'myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });

  });

  describe('.$authWithPassword',function(){

    it('passes options and credentials object to underlying method',function(){
      var options = {someOption:'a'};
      var credentials = {username:'myname',password:'password'};
      auth.$authWithPassword(credentials,options);
      expect(ref.authWithPassword).toHaveBeenCalledWith(
        {username:'myname',password:'password'},
        jasmine.any(Function),
        {someOption:'a'}
      );
    });

    it('will revoke the promise if authentication fails',function(){
      wrapPromise(auth.$authWithPassword());
      callback('authWithPassword')('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      wrapPromise(auth.$authWithPassword());
      callback('authWithPassword')(null,'myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });

  });

  describe('.$authWithOAuthPopup',function(){

    it('passes provider and options object to underlying method',function(){
      var options = {someOption:'a'};
      var provider = 'facebook';
      auth.$authWithOAuthPopup(provider,options);
      expect(ref.authWithOAuthPopup).toHaveBeenCalledWith(
        'facebook',
        jasmine.any(Function),
        {someOption:'a'}
      );
    });

    it('will revoke the promise if authentication fails',function(){
      wrapPromise(auth.$authWithOAuthPopup());
      callback('authWithOAuthPopup')('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      wrapPromise(auth.$authWithOAuthPopup());
      callback('authWithOAuthPopup')(null,'myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });

  });

  describe('.$authWithOAuthRedirect',function(){

    it('passes provider and options object to underlying method',function(){
      var provider = 'facebook';
      var options = {someOption:'a'};
      auth.$authWithOAuthRedirect(provider,options);
      expect(ref.authWithOAuthRedirect).toHaveBeenCalledWith(
        'facebook',
        jasmine.any(Function),
        {someOption:'a'}
      );
    });

    it('will revoke the promise if authentication fails',function(){
      wrapPromise(auth.$authWithOAuthRedirect());
      callback('authWithOAuthRedirect')('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      wrapPromise(auth.$authWithOAuthRedirect());
      callback('authWithOAuthRedirect')(null,'myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });

  }); 
  
  describe('.$authWithOAuthToken',function(){

    it('passes provider,credentials, and options object to underlying method',function(){
      var provider = 'facebook';
      var credentials = {username:'myname',password:'password'};
      var options = {someOption:'a'};
      auth.$authWithOAuthToken(provider,credentials,options);
      expect(ref.authWithOAuthToken).toHaveBeenCalledWith(
        'facebook',
        {username:'myname',password:'password'},
        jasmine.any(Function),
        {someOption:'a'}
      );
    });

    it('will revoke the promise if authentication fails',function(){
      wrapPromise(auth.$authWithOAuthToken());
      callback('authWithOAuthToken')('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      wrapPromise(auth.$authWithOAuthToken());
      callback('authWithOAuthToken')(null,'myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });

  });
});