///////////////////////////////////////////////////
////////// Tutorial Constructor ///////////////////

function Tutorial(tutName, tutData, templater) {
  this.name_ = tutName;
  this.tutorialData_ = tutData;
  this.templater_ = templater;

  //set some initial state
  this.capturedVars_ = {};
  this.curLessonNum_ = 0;
  this.curCompleted_ = false;

  //We want to make it easy to format examples, so we allow them to start
  //with a ^, in which case we replace it with a ' '
  for (var lN = 0; lN < this.tutorialData_.lessons.length; lN++) {
    var codeSegs = this.tutorialData_.lessons[lN].exampleCode;

    for (var i = 0; i < codeSegs.length; i++) {
      var seg = codeSegs[i]
      if (seg.text.indexOf("^") == 0) {
        seg.text = " " + seg.text.substring(1);
      }
      if (seg.validate && seg.validate.html && seg.validate.html.indexOf("^") == 0) {
        seg.validate.html = " " + seg.validate.html.substring(1);
      }
      if (seg.validate && seg.validate.javascript && seg.validate.javascript.indexOf("^") == 0) {
        seg.validate.javascript = " " + seg.validate.javascript.substring(1);
      }
    }
  }
}

Tutorial.prototype.getSampleData = function() {
  return this.tutorialData_.sampleData;
}

Tutorial.prototype.getName = function () {
  return this.name_;
}

Tutorial.NONEXISTENT_SENTINEL = {};

Tutorial.prototype.getLessonData = function (lessonNum, completed) {

  this.curLessonNum_ = lessonNum;
  this.curCompleted_ = completed;

  var lesson = this.tutorialData_.lessons[lessonNum];
  if (!lesson) {
    //They must have completed the tutorial.
    return Tutorial.NONEXISTENT_SENTINEL;
  }

  var retVal = {
    instructions:{
      title:lesson.title,
      progress:{
        name:this.name_,
        maxLessons:this.tutorialData_.lessons.length,
        lesson:lessonNum
      },
      completed: completed
    },
    code:this.getCodeForLesson_(lessonNum, completed)
  };

  if (completed) {
    retVal.instructions.body = this.populateTemplate_(lesson.completion.body);
    retVal.instructions.button = lesson.completion.button;
  } else {
    retVal.instructions.body = this.populateTemplate_(lesson.instructions.body);
    retVal.instructions.button = lesson.instructions.button;
  }
  return retVal;
}

Tutorial.prototype.getNextLessonHistoryToken = function () {
  //Lets figure out what the next hash should be to advance in this tutorial
  var nextLesson = 0;
  var nextCompleted = false;
  if(this.curCompleted_) {
    nextLesson = this.curLessonNum_ + 1;
    nextCompleted = !this.curCompleted_;
  } else {
    if(!this.tutorialData_.lessons[this.curLessonNum_].completion) {
      nextLesson = this.curLessonNum_ + 1;
      nextCompleted = false;
    } else {
      nextLesson = this.curLessonNum_;
      nextCompleted = !this.curCompleted_;
    }
  }
  if (nextLesson >= this.tutorialData_.lessons.length) {
    return null;
  } else {
    return "tutorial/" + this.name_ + "/" + nextLesson + (nextCompleted ? "/true" : "");
  }
}

Tutorial.prototype.getDefaultLesson = function () {
  return "tutorial/" + this.name_ + "/0";
}

/**
 * Get the state that the tutorial should be in after the last lesson (for the purpose of creating a shareable session)
 * @return {*}
 */
Tutorial.prototype.getFinalCode = function () {
  var finalCode = this.tutorialData_.final;
  var templateData = this.getDefinedVariablesForLesson_(this.tutorialData_.lessons.length - 1, true);
  return this.templater_.render(finalCode, templateData);
}

Tutorial.prototype.validateCurrentLesson = function (codeSegments) {

  //we don't need to validate a "completed" page.
  if (this.curCompleted_) return;

  var exampleCode = this.tutorialData_.lessons[this.curLessonNum_].exampleCode;

  for (var i = 0; i < codeSegments.length; i++) {
    var validationInfo = exampleCode[i].validate;
    var code = codeSegments[i];
    if (validationInfo) {
      if (validationInfo.html) {
        var renderedValid = this.populateTemplate_(validationInfo.html);
        var error = this.compareHTML_(code, renderedValid);
        if (error) {
          return error;
        }
      } else if (validationInfo.javascript) {
        //We populate the validation template with all of the variables we've captured so far, so that if they
        //try to redefine them we'll detect it as an error.
        var renderedValid = this.populateTemplate_(validationInfo.javascript);
        var error = this.compareJavascript_(code, renderedValid);
        if (error) {
          return error;
        }
      }
    }
  }
  return;
}

Tutorial.prototype.getCodeForLesson_ = function (lessonNum, completed) {
  var lesson = this.tutorialData_.lessons[lessonNum];

  //fill in the code
  var retVal = [];
  for (var i = 0; i < lesson.exampleCode.length; i++) {
    var section = lesson.exampleCode[i];
    var codeTemplate = section.text;

    //If this is a completed step, use the "correct" answer from the validation.
    if (completed && section.validate) {
      if (section.validate.html) {
        codeTemplate = section.validate.html;
      } else if (section.validate.javascript) {
        codeTemplate = section.validate.javascript;
      }
    }
    var toDisplay = {
      text:this.populateTemplate_(codeTemplate),
      readOnly:section.readOnly || completed
    };
    retVal.push(toDisplay);
  }
  return retVal;
}

Tutorial.prototype.populateTemplate_ = function (template) {
  var templateData = this.getCurrentlyDefinedVariables_();
  return this.templater_.render(template, templateData);
}

/**
 * This function figures out what variables should be defined up to this point in the tutorial, based
 * on the default vars, the captured vars, and where we currently are in the tutorial.
 * @return {Object}
 * @private
 */
Tutorial.prototype.getCurrentlyDefinedVariables_ = function() {
  return this.getDefinedVariablesForLesson_(this.curLessonNum_, this.curCompleted_);
}

Tutorial.prototype.getDefinedVariablesForLesson_ = function(curLesson, curCompleted) {
  var vars = {};

  var mergeInto = function (obj) {
    if(!obj) return;
    var keys = _.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      vars[keys[i]] = obj[keys[i]];
    }
  };

  var upToLesson = curLesson + (curCompleted ? 1 : 0);

  for(var i = 0; i < upToLesson; i++) {
    var varDefaults = this.tutorialData_.lessons[i].varDefaults;
    mergeInto(varDefaults);
    mergeInto(this.capturedVars_[i]);
  }
  return vars;
}

Tutorial.prototype.saveCapturedVarsForThisLesson_ = function(capturedVars) {
  this.capturedVars_[this.curLessonNum_] = capturedVars;
}

/**
 * Returns a string if there's a problem. undefined otherwise.
 * //TODO: this implementation only compares attributes at the root html element. I should
 * //make this recursively compare attributes at some point (right now the tutorial doesn't need this).
 * @param input
 * @param valid
 * @return {*}
 */
Tutorial.prototype.compareHTML_ = function(input, valid) {
  var inputParsed = null;
  try {
    inputParsed = $(input.trim());
    if (inputParsed.length == 0) {
      throw new Error();
    }
  } catch (err) {
    return "Oops! Something's wrong with your HTML. Make sure it looks like the example."
  }

  var validParsed = $(valid.trim());

  if(inputParsed.length > validParsed.length) {
    return "Oops! It looks like you have some extra HTML.";
  } else if(inputParsed.length < validParsed.length) {
    return "Oops! It looks like you're missing some HTML.";
  }

  var buildMap = function (el) {
    var map = {}
    if (!el.attributes) {
      return map;
    }
    $.each(el.attributes, function (ind, attr) {
      map[attr.name] = attr.value;
    });
    return map;
  }

  for(var i = 0; i < inputParsed.length; i++) {
    var inputNode = inputParsed[i];
    var validNode = validParsed[i];

    if(inputNode.nodeName != validNode.nodeName) {
      return "Woops! Your tag should be a " + validNode.nodeName.toLowerCase() +
        " rather than a " + inputNode.nodeName.toLowerCase() + ".";
    }

    var inputAttrAsMap = buildMap(inputNode);
    var validAttrAsMap = buildMap(validNode);

    //now lets compare the maps of attributes
    var keys = _.keys(validAttrAsMap);

    for (var j = 0; j < keys.length; j++) {
      var propName = keys[j];
      if (!inputAttrAsMap[propName]) {
        return "Oops! It looks like your script include is missing the \"" + propName + "\" attribute.";
      } else if (inputAttrAsMap[propName] != validAttrAsMap[propName]) {
        return "Oops! It looks like your \"" + propName + "\" attribute isn't quite right.";
      }
    }
  }
}

Tutorial.prototype.compareJavascript_ = function(input, match) {
  var inputSyntax = null;

  try {
    inputSyntax = esprima.parse(input);
  } catch (err) {
    return "Oops! There's a syntax error in your JavaScript. Make sure it looks like the example."
  }

  var matchSyntax = esprima.parse(match);
  var newSymbols = new SymbolContainer();
  try {
    this.compareAndExtract_(inputSyntax, matchSyntax, newSymbols);
  } catch(err) {
      //if the syntax trees were different, return.
    return err.message;
  }

  //remember this vars for later use.
  this.saveCapturedVarsForThisLesson_(newSymbols.getSymbols());
}

var defaultJSMatchError = "Oops! Something doesn't look quite right. Make sure your JavaScript looks like the example!";

/**
 * Compares two syntax trees. Returns a string error if they aren't equal. Also extracts any symbols in 'input'
 * that start with a $ in 'match' into the symbols object
 * @param input
 * @param match
 * @param symbols
 * @return {*}
 */
Tutorial.prototype.compareAndExtract_ = function(input, match, symbols) {

  if (input.type != match.type) {
    if(match.type == "Identifier" && match.name.indexOf("$_") == 0) {
      //we found a wildcard variable that can match more than just an identifier. Re-stringify the contained code
      //and place it in the symbols. Return safely.
      symbols.addSymbol(match.name.substring(1), renderAST(input));
      return;
    }
    throw new JSCompareException(JSCompareException.MISC, defaultJSMatchError);
  }

  switch (input.type) {
    case "Program":
      this.compareArrays_(input.body, match.body, symbols);
      break;
    case "VariableDeclaration":
      if (input.kind != match.kind) {
        throw new JSCompareException(JSCompareException.MISC, "Oops. Your variable declaration doesn't look quite right.");
      }
      this.compareArrays_(input.declarations, match.declarations, symbols);
      break;
    case "VariableDeclarator":
      this.compareAndExtract_(input.id, match.id, symbols);
      this.compareAndExtract_(input.init, match.init, symbols);
      break;
    case "Identifier":
      if (match.name.indexOf("$") == 0) {
        //we're supposed to extract this variable
        symbols.addSymbol(match.name.substring(1), input.name);
      } else {
        if (match.name != input.name) {
          throw new JSCompareException(JSCompareException.MISC, "One of your names doesn't match. Change \"" + input.name + "\" to \"" + match.name + "\".");
        }
      }
      break;
    case "Literal":
      if (input.value !== match.value) {
        throw new JSCompareException(JSCompareException.MISC, "Almost. You need to change the value " + input.value + " to " + match.value + ".");
      }
      break;
    case "NewExpression":
      this.compareAndExtract_(input.callee, match.callee, symbols);
      this.compareArrays_(input.arguments, match.arguments, symbols);
      break;
    case "ExpressionStatement":
      this.compareAndExtract_(input.expression, match.expression, symbols);
      break;
    case "CallExpression":
      this.compareArrays_(input.arguments, match.arguments, symbols);
      this.compareAndExtract_(input.callee, match.callee, symbols);
      break;
    case "MemberExpression":
      if(input.computed != match.computed) {
        throw new JSCompareException(JSCompareException.MISC, defaultJSMatchError);
      }
      this.compareAndExtract_(input.object, match.object, symbols);
      this.compareAndExtract_(input.property, match.property, symbols);
      break;
    case "ObjectExpression":
      var self = this;
      var sortFunc = function(a, b) {
        return self.compareKeys_(a.key, b.key);
      }
      var inputPropertiesClone = input.properties.slice(0).sort(sortFunc);
      var matchPropertiesClone = match.properties.slice(0).sort(sortFunc);
      this.compareArrays_(inputPropertiesClone, matchPropertiesClone, symbols);
      break;
    case "Property":
      if(input.kind != match.kind) {
        throw new JSCompareException(JSCompareException.MISC, defaultJSMatchError);
      }
      if(this.compareKeys_(input.key, match.key, symbols) !== 0) {
        throw new JSCompareException(JSCompareException.MISC, "Almost. You need to change the property name " + k1text + " to " + k2text + ".");
      }
      this.compareAndExtract_(input.value, match.value, symbols);
      break;
    case "FunctionExpression":
      if(input.expression != match.expression || input.generator != match.generator || input.rest != match.rest) {
        throw new JSCompareException(JSCompareException.MISC, defaultJSMatchError);
      }
      this.compareAndExtract_(input.body, match.body, symbols);
      this.compareArrays_(input.defaults, match.defaults, symbols);
      this.compareArrays_(input.params, match.params, symbols);
      break;
    case "BlockStatement":
      this.compareArrays_(input.body, match.body, symbols);
      break;
    case "ArrayExpression":
      this.compareArrays_(input.elements, match.elements, symbols);
      break;
    case "FunctionDeclaration":
      this.compareAndExtract_(input.id, match.id, symbols);
      this.compareArrays_(input.defaults, match.defaults, symbols);
      this.compareArrays_(input.params, match.params, symbols);
      break;
    default:
      //We may have more things to implement here.
      throw new JSCompareException("unimplemented", "JSMatch: Unimplemented AST type: " + input.type);
      break;
  }
}

Tutorial.prototype.compareKeys_ = function(inputKey, matchKey){
  var getKeyText = function(k) {
    if(k.type == 'Literal') {
      return k.value;
    } else if(k.type == 'Identifier') {
      return k.name;
    }
    return null;
  }

  var k1text = getKeyText(inputKey);
  var k2text = getKeyText(matchKey);
  if(k1text === null || k2text === null) {
    throw new JSCompareException(JSCompareException.MISC, "Almost. Your object has an invalid property key type.");
  }
  if(k1text !== k2text) {
    if(k1text > k2text) {
      return 1;
    }
    return -1;
  } else {
    return 0;
  }
}

Tutorial.prototype.compareArrays_ = function(arr1, arr2, symbols) {
  if (arr1.length != arr2.length) {
    throw new JSCompareException(JSCompareException.ARR_LENGTHS, defaultJSMatchError)
  }
  for (var i = 0; i < arr1.length; i++) {
    this.compareAndExtract_(arr1[i], arr2[i], symbols);
  }
}

function renderAST(ast) {
  //NOTE: this isn't accurate, but people prob won't notice... we only use it in one spot right now.
  switch(ast.type) {
    case "BinaryExpression":
      return renderAST(ast.left) + " " + ast.operator + " " + renderAST(ast.right);
      break;
    case "Identifier":
      return ast.name;
      break;
    case "Literal":
      return ast.raw;
      break;
    default:
      break;
  }
}

//Custom error object
function JSCompareException(eid, exp) {
  this.code = eid;
  this.message = exp;
  Error.apply(this, [exp]);
}

JSCompareException.prototype = new Error();
JSCompareException.prototype.constructor = JSCompareException;
JSCompareException.prototype.name = 'JSCompareException';

JSCompareException.ARR_LENGTHS = "arr_lengths";
JSCompareException.MISC = "misc";
JSCompareException.SYMBOL_MISMATCH = "symbol_mismatch";

//holds symbols and throws errors if there are mismatches.
function SymbolContainer() {
  this.symbols_ = {};
}

SymbolContainer.prototype.addSymbol = function(sym, val) {
  if(this.symbols_[sym] && this.symbols_[sym] != val) {
    throw new JSCompareException(JSCompareException.SYMBOL_MISMATCH,
      "Oops. You've inconsistently named a variable. \"" + val + "\" and \"" + this.symbols_[sym] + "\" should be the same.")
  }
  this.symbols_[sym] = val;
}

SymbolContainer.prototype.getSymbols = function() {
  return this.symbols_;
}
