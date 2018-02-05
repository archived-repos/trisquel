(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.trisquel = factory());
}(this, (function () { 'use strict';

function _parseExpression (expression) {
  var parts = expression.split('|'),
      filters =  [],
      part = parts.shift();

  while( part !== undefined ) {
    if( part === '' ) {
      filters[filters.length - 1] += '||' + parts.shift();
    } else {
      filters.push(part);
    }
    part = parts.shift();
  }

  return {
    expression: filters.shift(),
    filters: filters
  };
}

function _mapFilters (filters, parts) {
  return parts.map(function (part) {
    var splitted = part.match(/([^:]+):(.*)/), filter_name, args;

    if( splitted ) {
      filter_name = splitted[1].trim();
      args = [splitted[2]];
    } else {
      filter_name = part.trim();
      args = [];
    }

    return function (result, scope) {
      return filters.get(filter_name).apply(null, [result].concat( args.map(function (arg) {
        return scope.eval(arg);
      }) ) );
    };
  });
}

function _evalExpression (expression) {
  var parsed = _parseExpression(expression);

  var evaluator = (new Function('scope', 'try { with(scope) { return (' + parsed.expression + '); }; } catch(err) { return \'\'; }'));

  var _filters = _mapFilters(this.filters, parsed.filters);

  return function (scope) {
    var result = evaluator(scope);

    for( var i = 0, n = _filters.length ; i < n ; i++ ) {
      result = _filters[i](result, scope);
    }

    return result;
  };
}

function evalExpression (expression, scope) {
  return scope ? _evalExpression(expression)(scope) : _evalExpression(expression);
}

// var evalExpression = require('./eval');

function Scope (data) {
	if( !(this instanceof Scope) ) return new Scope(data);

  if( data instanceof Object ) {
    this.extend(data);
  }
}

Scope.prototype.new = function(data) {
	var child = Object.create(this);
	if( data instanceof Object ) child.extend(data);
  return child;
};

Scope.prototype.extend = function(data) {
  for( var key in data ) {
    this[key] = data[key];
  }
  return this;
};

Scope.prototype.eval = function ( expression ) {
  return evalExpression(expression)(this);
};

var REeach = /([^,]+)(\s*,\s*([\S]+))? in (\S+)/;

var cmds = {
  '': function (scope, expression) {
    return scope.eval(expression);
  },
  root: function (scope, expression, content, _otherwise) {
    return content(scope);
  },
  if: function (scope, expression, content, otherwise) {
    return scope.eval(expression) ? content(scope) : otherwise(scope);
  },
  each: function (scope, expression, content, _otherwise) {
    var values = REeach.exec(expression.trim()), key, i, n, s;

    if( !values ) {
      throw new Error('each expression is not correct');
    }

    var result = '',
        item = values[1],
        items = scope.eval(values[4]),
        iKey = values[3] || ( items instanceof Array ? '$index' : '$key' );

    if( items instanceof Array ) {
      for( i = 0, n = items.length ; i < n ; i++ ) {
        s = scope.new();
        s[iKey] = i;
        s[item] = items[i];
        result += content(s);
      }
    } else {
      for( key in items ) {
        s = scope.new();
        s[iKey] = key;
        s[item] = items[key];
        result += content(s);
      }
    }

    return result;
  }
};

var REsplit = /\$\w*{[^}]*}|{\/}|{:}|{else}/;
var REmatch = /\$(\w*){([^}]*)}|{(\/|:|else)}/g;
    // cmds = require('./cmds');

function singleCmd (cmd, expression) {
  return function (scope) {
    return cmds[cmd](scope, expression);
  };
}

function raiseList (tokens, cmd, expression, waitingForClose) {
  var token = tokens.shift(),
      targets = { $$content: [], $$otherwise: [] },
      target = '$$content',
      resolver = function (scope) {
        return cmds[cmd](scope, expression, function (s) {
          return targets.$$content.map(function (piece) {
            return piece instanceof Function ? piece(s) : piece;
          }).join('');
        }, function (s) {
          return targets.$$otherwise.map(function (piece) {
            return piece instanceof Function ? piece(s) : piece;
          }).join('');
        });
      };

  while( token !== undefined ) {

    if( typeof token === 'string' ) {
      targets[target].push(token);
    // } else if( token.cmd === 'case' ) {
    //   if( !waitingForClose ) {
    //     throw new Error('template root can not have cases');
    //   }
    //   target = expression.trim();
    } else if( typeof token.cmd === 'string' ) {
      if( token.cmd ) {
        if( !cmds[token.cmd] ) {
          throw new Error('cmd \'' + token.cmd + '\' is not defined');
        }

        if( cmds[token.cmd].$no_content ) {
          targets[target].push(singleCmd(token.cmd, token.expression));
        } else {
          targets[target].push( raiseList(tokens, token.cmd, token.expression, true) );
        }

      } else {
        targets[target].push(singleCmd(token.cmd, token.expression));
      }

    } else if( token.expression === ':' || token.expression === 'else' ){
      target = '$$otherwise';
    } else if( token.expression === '/' ) {
      if( !waitingForClose ) {
        throw new Error('can not close root level');
      }
      return resolver;
    } else {
      throw new Error('\'' + token.expression + '\' is not a valid no-cmd expression');
    }

    token = tokens.shift();
  }

  if( waitingForClose ) {
    throw new Error('cmd \'' + cmd + '\' not closed propertly');
  }

  return resolver;
}

function parse(tmpl){
  if( typeof tmpl !== 'string' ) throw new TypeError('template should be a string');

  var i = 0,
      texts = tmpl.split(REsplit),
      list = [];

  list[i++] = texts.shift();

  tmpl.replace(REmatch,function(match, cmd, expression, altExpression){
    expression = altExpression || expression;

    if( cmd && !cmds[cmd] ) {
      throw new Error('cmd \'' + cmd + '\' is not defined');
    }

    var nextText = texts.shift();

    if( /\{/.test(expression) ) {

      var delta = expression.split('{').length - expression.split('}').length;

      if( delta < 0 ) {
        throw new Error('curly brackets mismatch');
      } else if( delta > 0 ) {
        var tracks = nextText.split('}');

        while( delta > 0 ) {
          if( (tracks.length - 1) < delta ) {
            throw new Error('expression curly brackets mismatch');
          }
          expression += tracks.splice(0, delta).join('}') + '}';
          delta = expression.split('{').length - expression.split('}').length;
        }
        nextText = tracks.join('}');
      }
    }

    list[i++] = { cmd: cmd, expression: expression };
    list[i++] = nextText;
  });

  return raiseList(list, 'root');
}



// module.exports = parse;

function compile (tmpl) {
  var render = parse(tmpl);

  return function (data) {
    return render( data instanceof Scope ? data : new Scope(data) );
  };
}

function template (tmpl, scope) {
  return scope ? compile.call(template, tmpl)(scope) : compile.call(template, tmpl);
}

template.cmds = cmds;
template.filters = {};
template.cache = {};

template.eval = evalExpression;

template.scope = Scope;
template.Scope = Scope;

function Template () {
  this.filters = Object.create(template.filters);
  this.cmds = Object.create(cmds);
  this.cache = {};
}
template.Template = Template;

var template_funcs = {
  compile: function (tmpl, scope) {
    return scope ? compile.call(this, tmpl)(scope) : compile(this, tmpl);
  },
  filter: function (filter_name, filterFn) {
    if( filterFn === undefined ) return this.filters[filter_name];
    this.filters[filter_name] = filterFn;
  },
  cmd: function (name, fn, no_content) {
    fn.$no_content = no_content;
    this.cmds[name] = fn;
  },
  get: function (template_name) {
    return this.cache[template_name];
  },
  put: function (template_name, template_str) {
    this.cache[template_name] = this.compile(template_str);
    return this;
  },
  clear: function () {
    for( var k in this.cache ) {
      delete this.cache[k];
    }
  },
};

for( var fn_name in template_funcs ) {
  template[fn_name] = template_funcs[fn_name];
  Template.prototype[fn_name] = template_funcs[fn_name];
}

template.cmd('include', function (scope, expression) {
  var tmpl = template.get(expression.trim());
  if( !tmpl ) {
    throw new Error('can not include template: \'' + scope.eval(expression) + '\' ( expression: ' + expression + ' )');
  }
  return tmpl(scope);
}, true);

template.cmd('includeEval', function (scope, expression) {
  var tmpl = template.get(scope.eval(expression));
  if( !tmpl ) {
    throw new Error('can not include template: \'' + scope.eval(expression) + '\' ( expression: ' + expression + ' )');
  }
  return tmpl(scope);
}, true);

return template;

})));
