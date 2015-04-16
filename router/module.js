angular.module('newRouterFire', ['firebase', 'ngNewRouter'])
  .value('$resolveScopePromiseStep',resolveScopePromiseStepValue);

angular.module('ngNewRouter')
  .config(['$pipelineProvider', pipelineDecorator]);

function pipelineDecorator($pipelineProvider) {
  var i = $pipelineProvider.steps.indexOf('$initControllersStep');
  $pipelineProvider.steps.splice(i+1,0,'$resolveScopePromiseStep');
  $pipelineProvider.config($pipelineProvider.steps);
}

function resolveScopePromiseStepValue(instruction) {
  return instruction.router.traverseInstruction(instruction, function(instruction) {
     if (instruction.controller.$$resolveScope) {
       var oldactivate = instruction.controller.activate;
       function activate ($injector){
         this.$$resolveScope(instruction.locals.$scope);
         if (oldactivate){
           return $injector.invoke(oldactivate, this, instruction.locals);
         }
       }
       activate.$inject = ['$injector'];
       instruction.controller.activate = activate;
       return true;
     }
    else {
       return instruction.controller;
     }
  });
}