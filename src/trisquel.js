
import Scope from './scope';
import parse from './parse';
import cmds from './cmds';
import evalExpression from './eval';

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

function Template (inherit_globals) {
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
trisquel.Template = Template;

var template_funcs = {
  compile: compile,
  eval: function (expression, scope) {
    return evalExpression(expression, this.filters)(scope);
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
  Template.prototype[fn_name] = template_funcs[fn_name];
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

export default trisquel;
