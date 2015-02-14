describe('FirebaseAuth',function(){
  'use strict';

  var $firebaseAuth, ref, auth, result, failure, status, $timeout, log;

  beforeEach(function(){

    log = {
      warn:[]
    };

    module('firebase',function($provide){
      $provide.value('$log',{
        warn:function(){
          log.warn.push(Array.prototype.slice.call(arguments,0));
        }
      })
    });
    module('testutils');

    result = undefined;
    failure = undefined;
    status = null;

    ref = jasmine.createSpyObj('ref',
      ['authWithCustomToken','authAnonymously','authWithPassword',
        'authWithOAuthPopup','authWithOAuthRedirect','authWithOAuthToken',
        'unauth','getAuth','onAuth','offAuth',
        'createUser','changePassword','changeEmail','removeUser','resetPassword'
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
      status = 'resolved';
      result = _result_;
    },function(_failure_){
      status = 'rejected';
      failure = _failure_;
    });
  }

  function callback(callbackName,callIndex){
    callIndex = callIndex || 0; //assume the first call.
    var argIndex = getArgIndex(callbackName);
    return ref[callbackName].calls.argsFor(callIndex)[argIndex];
  }

  it('will throw an error if a string is used in place of a Firebase Ref',function(){
    expect(function(){
      $firebaseAuth('https://some-firebase.firebaseio.com/');
    }).toThrow();
  });

  describe('$authWithCustomToken',function(){
    it('passes custom token to underlying method',function(){
      var options = {optionA:'a'};
      auth.$authWithCustomToken('myToken',options);
      expect(ref.authWithCustomToken).toHaveBeenCalledWith('myToken', jasmine.any(Function), options);
    });

    it('will reject the promise if authentication fails',function(){
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

  describe('$authAnonymously',function(){
    it('passes options object to underlying method',function(){
      var options = {someOption:'a'};
      auth.$authAnonymously(options);
      expect(ref.authAnonymously).toHaveBeenCalledWith(jasmine.any(Function),{someOption:'a'});
    });

    it('will reject the promise if authentication fails',function(){
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

  describe('$authWithPassword',function(){
    it('passes options and credentials object to underlying method',function(){
      var options = {someOption:'a'};
      var credentials = {email:'myname',password:'password'};
      auth.$authWithPassword(credentials,options);
      expect(ref.authWithPassword).toHaveBeenCalledWith(
        {email:'myname',password:'password'},
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

  describe('$authWithOAuthPopup',function(){
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

    it('will reject the promise if authentication fails',function(){
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

  describe('$authWithOAuthRedirect',function(){
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

    it('will reject the promise if authentication fails',function(){
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

  describe('$authWithOAuthToken',function(){
    it('passes provider, token, and options object to underlying method',function(){
      var provider = 'facebook';
      var token = 'FACEBOOK TOKEN';
      var options = {someOption:'a'};
      auth.$authWithOAuthToken(provider,token,options);
      expect(ref.authWithOAuthToken).toHaveBeenCalledWith(
        'facebook',
        'FACEBOOK TOKEN',
        jasmine.any(Function),
        {someOption:'a'}
      );
    });

    it('passes provider, OAuth credentials, and options object to underlying method',function(){
      var provider = 'twitter';
      var oauth_credentials = {
        "user_id": "<USER-ID>",
        "oauth_token": "<ACCESS-TOKEN>",
        "oauth_token_secret": "<ACCESS-TOKEN-SECRET>"
      };
      var options = {someOption:'a'};
      auth.$authWithOAuthToken(provider,oauth_credentials,options);
      expect(ref.authWithOAuthToken).toHaveBeenCalledWith(
        'twitter',
        oauth_credentials,
        jasmine.any(Function),
        {someOption:'a'}
      );
    });

    it('will reject the promise if authentication fails',function(){
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

  describe('$getAuth()',function(){
    it('returns getAuth() from backing ref',function(){
      ref.getAuth.and.returnValue({provider:'facebook'});
      expect(auth.$getAuth()).toEqual({provider:'facebook'});
      ref.getAuth.and.returnValue({provider:'twitter'});
      expect(auth.$getAuth()).toEqual({provider:'twitter'});
      ref.getAuth.and.returnValue(null);
      expect(auth.$getAuth()).toEqual(null);
    });
  });

  describe('$unauth()',function(){
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

  describe('$onAuth()',function(){
    //todo add more testing here after mockfirebase v2 auth is released

    it('calls onAuth() on the backing ref', function() {
      function cb() {}
      var ctx = {};
      auth.$onAuth(cb, ctx);
      expect(ref.onAuth).toHaveBeenCalledWith(jasmine.any(Function));
    });

    it('returns a deregistration function that calls offAuth() on the backing ref', function(){
      function cb() {}
      var ctx = {};
      var deregister = auth.$onAuth(cb, ctx);
      deregister();
      expect(ref.offAuth).toHaveBeenCalledWith(jasmine.any(Function));
    });
  });

  describe('$requireAuth()',function(){
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

  describe('$waitForAuth()',function(){
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

  describe('$createUser()',function(){
    it('passes email/password to method on backing ref',function(){
      auth.$createUser({email:'somebody@somewhere.com',password:'12345'});
      expect(ref.createUser).toHaveBeenCalledWith(
          {email:'somebody@somewhere.com',password:'12345'},
          jasmine.any(Function));
    });

    it('throws error given string arguments',function(){
      expect(function() {
        auth.$createUser('somebody@somewhere.com', '12345');
      }).toThrow();
    });

    it('will reject the promise if creation fails',function(){
      wrapPromise(auth.$createUser({email:'dark@helmet.com', password:'12345'}));
      callback('createUser')("I've got the same combination on my luggage");
      $timeout.flush();
      expect(failure).toEqual("I've got the same combination on my luggage");
    });

    it('will resolve the promise upon creation',function(){
      wrapPromise(auth.$createUser({email:'somebody@somewhere.com', password: '12345'}));
      callback('createUser')(null);
      $timeout.flush();
      expect(status).toEqual('resolved');
    });

    it('promise will resolve with the uid of the user',function(){
      wrapPromise(auth.$createUser({email:'captreynolds@serenity.com',password:'12345'}));
      callback('createUser')(null,{uid:'1234'});
      $timeout.flush();
      expect(result).toEqual({uid:'1234'});
    });
  });

  describe('$changePassword()',function() {
    it('passes credentials to method on backing ref',function() {
      auth.$changePassword({
        email: 'somebody@somewhere.com',
        oldPassword: '54321',
        newPassword: '12345'
      });
      expect(ref.changePassword).toHaveBeenCalledWith({
        email:'somebody@somewhere.com',
        oldPassword: '54321',
        newPassword: '12345'
      }, jasmine.any(Function));
    });

    it('throws error given string arguments',function(){
      expect(function() {
        auth.$changePassword('somebody@somewhere.com', '54321', '12345');
      }).toThrow();
    });

    it('will reject the promise if the password change fails',function() {
      wrapPromise(auth.$changePassword({
        email:'somebody@somewhere.com',
        oldPassword: '54321',
        newPassword: '12345'
      }));
      callback('changePassword')("bad password");
      $timeout.flush();
      expect(failure).toEqual("bad password");
    });

    it('will resolve the promise upon the password change',function() {
      wrapPromise(auth.$changePassword({
        email: 'somebody@somewhere.com',
        oldPassword: '54321',
        newPassword: '12345'
      }));
      callback('changePassword')(null);
      $timeout.flush();
      expect(status).toEqual('resolved');
    });
  });

  describe('$changeEmail()',function() {
    it('passes credentials to method on backing reference', function() {
      auth.$changeEmail({
        oldEmail: 'somebody@somewhere.com',
        newEmail: 'otherperson@somewhere.com',
        password: '12345'
      });
      expect(ref.changeEmail).toHaveBeenCalledWith({
        oldEmail: 'somebody@somewhere.com',
        newEmail: 'otherperson@somewhere.com',
        password: '12345'
      }, jasmine.any(Function));
    });

    it('will reject the promise if the email change fails',function() {
      wrapPromise(auth.$changeEmail({
        oldEmail: 'somebody@somewhere.com',
        newEmail: 'otherperson@somewhere.com',
        password: '12345'
      }));
      callback('changeEmail')("bad password");
      $timeout.flush();
      expect(failure).toEqual("bad password");
    });

    it('will resolve the promise upon the email change',function() {
      wrapPromise(auth.$changeEmail({
        oldEmail: 'somebody@somewhere.com',
        newEmail: 'otherperson@somewhere.com',
        password: '12345'
      }));
      callback('changeEmail')(null);
      $timeout.flush();
      expect(status).toEqual('resolved');
    });
  });

  describe('$removeUser()',function(){
    it('passes email/password to method on backing ref',function(){
      auth.$removeUser({email:'somebody@somewhere.com',password:'12345'});
      expect(ref.removeUser).toHaveBeenCalledWith(
        {email:'somebody@somewhere.com',password:'12345'},
        jasmine.any(Function));
    });

    it('throws error given string arguments',function(){
      expect(function() {
        auth.$removeUser('somebody@somewhere.com', '12345');
      }).toThrow();
    });

    it('will reject the promise if there is an error',function(){
      wrapPromise(auth.$removeUser({email:'somebody@somewhere.com',password:'12345'}));
      callback('removeUser')("bad password");
      $timeout.flush();
      expect(failure).toEqual("bad password");
    });

    it('will resolve the promise upon removal',function(){
      wrapPromise(auth.$removeUser({email:'somebody@somewhere.com',password:'12345'}));
      callback('removeUser')(null);
      $timeout.flush();
      expect(status).toEqual('resolved');
    });
  });

  describe('$resetPassword()',function(){
    it('passes email to method on backing ref',function(){
      auth.$resetPassword({email:'somebody@somewhere.com'});
      expect(ref.resetPassword).toHaveBeenCalledWith(
        {email:'somebody@somewhere.com'},
        jasmine.any(Function));
    });

    it('throws error given string arguments',function(){
      expect(function() {
        auth.$resetPassword('somebody@somewhere.com');
      }).toThrow();
    });

    it('will reject the promise if reset action fails',function(){
      wrapPromise(auth.$resetPassword({email:'somebody@somewhere.com'}));
      callback('resetPassword')("user not found");
      $timeout.flush();
      expect(failure).toEqual("user not found");
    });

    it('will resolve the promise upon success',function(){
      wrapPromise(auth.$resetPassword({email:'somebody@somewhere.com'}));
      callback('resetPassword')(null);
      $timeout.flush();
      expect(status).toEqual('resolved');
    });
  });
});
