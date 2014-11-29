describe('FirebaseAuth',function(){
  'use strict';

  var $firebaseAuth, ref, auth, result, failure, $timeout;

  beforeEach(function(){

    module('mock.firebase');
    module('firebase');
    module('testutils');

    result = undefined;
    failure = undefined;

    ref = jasmine.createSpyObj('ref',
      ['authWithCustomToken','authAnonymously','authWithPassword',
        'authWithOAuthPopup','authWithOAuthRedirect','authWithOAuthToken',
        'unauth','getAuth','onAuth','offAuth'
      ]);

    inject(function(_$firebaseAuth_,_$timeout_){
      $firebaseAuth = _$firebaseAuth_;
      auth = $firebaseAuth(ref);
      $timeout = _$timeout_;
    });

  });

  function getArgIndex(callbackName){
    //In the firebase API, the completion callback is the second argument for all but a few functions.
    switch (callbackName){
      case 'authAnonymously':
      case 'onAuth':
        return 0;
      case 'authWithOAuthToken':
        return 2;
      default :
        return 1;
    }
  }

  function wrapPromise(promise){
    promise.then(function(_result_){
      result = _result_;
    },function(_failure_){
      failure = _failure_;
    });
  }

  function callback(callbackName,callIndex){
    callIndex = callIndex || 0; //assume the first call.
    var argIndex = getArgIndex(callbackName);
    return ref[callbackName].calls.argsFor(callIndex)[argIndex];
  }

  describe('.$authWithCustomToken',function(){
    it('passes custom token to underlying method',function(){
      var options = {optionA:'a'};
      auth.$authWithCustomToken('myToken',options);
      expect(ref.authWithCustomToken).toHaveBeenCalledWith('myToken', jasmine.any(Function), options);
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

  describe('.$getAuth()',function(){
    it('returns getAuth() from backing ref',function(){
      ref.getAuth.and.returnValue({provider:'facebook'});
      expect(auth.$getAuth()).toEqual({provider:'facebook'});
      ref.getAuth.and.returnValue({provider:'twitter'});
      expect(auth.$getAuth()).toEqual({provider:'twitter'});
      ref.getAuth.and.returnValue(null);
      expect(auth.$getAuth()).toEqual(null);
    });
  });

  describe('.$unauth()',function(){
    it('will call unauth() on the backing ref if logged in',function(){
      ref.getAuth.and.returnValue({provider:'facebook'});
      auth.$unauth();
      expect(ref.unauth).toHaveBeenCalled();
    });

    it('will NOT call unauth() on the backing ref if NOT logged in',function(){
      ref.getAuth.and.returnValue(null);
      auth.$unauth();
      expect(ref.unauth).not.toHaveBeenCalled();
    });
  });

  describe('.$onAuth()',function(){
    it('calls onAuth() on the backing ref with callback and context provided',function(){
      function cb(){}
      var ctx = {};
      auth.$onAuth(cb,ctx);
      expect(ref.onAuth).toHaveBeenCalledWith(cb, ctx);
    });

    it('returns a deregistration function that calls offAuth on the backing ref with callback and context',function(){
      function cb(){}
      var ctx = {};
      var deregister = auth.$onAuth(cb,ctx);
      deregister();
      expect(ref.offAuth).toHaveBeenCalledWith(cb, ctx);
    });
  });

  describe('.$requireAuth()',function(){
    it('will be resolved if user is logged in', function(){
      wrapPromise(auth.$requireAuth());
      callback('onAuth')({provider:'facebook'});
      $timeout.flush();
      expect(result).toEqual({provider:'facebook'});
    });

    it('will be rejected if user is not logged in', function(){
      wrapPromise(auth.$requireAuth());
      callback('onAuth')(null);
      $timeout.flush();
      expect(failure).toBe('AUTH_REQUIRED');
    });
  });

  describe('.$waitForAuth()',function(){
    it('will be resolved with authData if user is logged in', function(){
      wrapPromise(auth.$waitForAuth());
      callback('onAuth')({provider:'facebook'});
      $timeout.flush();
      expect(result).toEqual({provider:'facebook'});
    });

    it('will be resolved with null if user is not logged in', function(){
      wrapPromise(auth.$waitForAuth());
      callback('onAuth')(null);
      $timeout.flush();
      expect(result).toBe(null);
    });
  });
});