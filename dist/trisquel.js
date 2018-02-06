(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.trisquel = factory());
}(this, (function () { 'use strict';

function pipeResult (process_map, result, scope) {

  for( var i = 0, n = process_map.length ; i < n ; i++ ) {
    result = process_map[i](result, scope);
  }

  return result;
}

function mapFilters (filters, parts) {
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
      if( !filters[filter_name] ) throw new Error('filter \'' + filter_name + '\' is not defined');
      return filters[filter_name].apply(scope, [result].concat( args.map(function (arg) {
        return scope.eval(arg);
      }) ) );
    };
  });
}

function parseExpression (expression) {
  var parts = expression.split(/ *\| */),
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
    expression: filters.shift().trim(),
    filters: filters,
  };
}

function evalExpression (expression, filters) {
  var parsed = parseExpression(expression);

  var evaluator = (new Function('scope', 'try { with(scope) { return (' + parsed.expression + '); }; } catch(err) { return \'\'; }'));

  var filters_map = filters ? mapFilters(filters, parsed.filters) : [];

  return function (scope, processExpression) {
    return pipeResult(filters_map, processExpression ? processExpression.call(scope, parsed.expression, scope) : evaluator(scope), scope );
  };
}

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

var REsplit = /\$\w*{[^}]*}|{\/}|{:}|{else}/;
var REmatch = /\$(\w*){([^}]*)}|{(\/|:|else)}/g;
    // cmds = require('./cmds');

function raiseList (_this, tokens, cmd, expression, waitingForClose) {
  var token = tokens.shift(),
      targets = { $$content: [], $$otherwise: [] },
      target = '$$content',
      cmds = _this.cmds,
      singleCmd = function (cmds, cmd, expression) {
        return function (data) {
          return cmds[cmd].call(_this, data instanceof Scope ? data : new Scope(data) , expression);
        };
      },
      resolver = function (data) {
        return cmds[cmd].call(_this, data instanceof Scope ? data : new Scope(data), expression, function (s) {
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
          targets[target].push(singleCmd(cmds, token.cmd, token.expression));
        } else {
          targets[target].push( raiseList(_this, tokens, token.cmd, token.expression, true) );
        }

      } else {
        targets[target].push(singleCmd(cmds, token.cmd, token.expression));
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

function parse (tmpl) {
  if( typeof tmpl !== 'string' ) throw new TypeError('template should be a string');

  var i = 0,
      texts = tmpl.split(REsplit),
      list = [],
      cmds = this.cmds;

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

  return raiseList(this, list, 'root');
}



// module.exports = parse;

var REeach = /([^,]+)(\s*,\s*([\S]+))? in (\S+)/;

var cmds = {
  '': function (scope, expression) {
    return this.eval(expression, scope);
  },
  root: function (scope, expression, content, _otherwise) {
    return content(scope);
  },
  if: function (scope, expression, content, otherwise) {
    return this.eval(expression, scope) ? content(scope) : otherwise(scope);
  },
  each: function (scope, expression, content, _otherwise) {
    var values = REeach.exec(expression.trim()), key, i, n, s;

    if( !values ) {
      throw new Error('each expression is not correct');
    }

    var result = '',
        item = values[1],
        items = this.eval(values[4], scope),
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

function compile (tmpl, data) {
  return data ? parse.call(this, tmpl)(data) : parse.call(this, tmpl);
}

function trisquel (tmpl, data) {
  return compile.call(trisquel, tmpl, data);
}

trisquel.cmds = Object.create(cmds);
trisquel.filters = {};
trisquel.cache = {};

trisquel.scope = Scope;
trisquel.Scope = Scope;

function Trisquel (inherit_globals) {
  if( inherit_globals || inherit_globals === undefined ) {
    this.cmds = Object.create(trisquel.cmds);
    this.filters = Object.create(trisquel.filters);
    this.cache = Object.create(trisquel.cache);
  } else {
    this.cmds = Object.create(cmds);
    this.filters = {};
    this.cache = {};
  }
}
trisquel.Trisquel = Trisquel;

var template_funcs = {
  compile: compile,
  eval: function (expression, scope, processExpression) {
    if( scope ) return evalExpression(expression, this.filters)(scope, processExpression);
    return evalExpression(expression, this.filters);
  },
  filter: function (filter_name, filterFn) {
    if( filterFn === undefined ) return this.filters[filter_name];
    this.filters[filter_name] = filterFn;
  },
  cmd: function (cmd_name, fn, no_content) {
    fn.$no_content = no_content;
    this.cmds[cmd_name] = fn;
  },
  get: function (template_name) {
    return this.cache[template_name];
  },
  put: function (template_name, template_str) {
    this.cache[template_name] = this.compile(template_str);
    return this.cache[template_name];
  },
  clear: function () {
    for( var k in this.cache ) {
      delete this.cache[k];
    }
  },
};

for( var fn_name in template_funcs ) {
  trisquel[fn_name] = template_funcs[fn_name];
  Trisquel.prototype[fn_name] = template_funcs[fn_name];
}

trisquel.cmd('include', function (scope, expression) {
  var tmpl = this.get(expression.trim());
  if( !tmpl ) {
    throw new Error('can not include template: \'' + this.eval(expression, scope) + '\' ( expression: ' + expression + ' )');
  }
  return tmpl(scope);
}, true);

trisquel.cmd('includeEval', function (scope, expression) {
  var tmpl = this.get( this.eval(expression, scope) );
  if( !tmpl ) {
    throw new Error('can not include template: \'' + this.eval(expression, scope) + '\' ( expression: ' + expression + ' )');
  }
  return tmpl(scope);
}, true);

return trisquel;

})));
