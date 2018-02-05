
import Scope from './scope';
import parse from './parse';
import cmds from './cmds';
import evalExpression from './eval';

function trisquel (tmpl, data) {
  return data ? parse.call(this, tmpl)( data instanceof Scope ? data : new Scope(data) ) : parse.call(this, tmpl);
}

trisquel.cmds = cmds;
trisquel.filters = {};
trisquel.cache = {};

trisquel.eval = evalExpression;

trisquel.scope = Scope;
trisquel.Scope = Scope;

function Template (inherit_globals) {
  if( inherit_globals || inherit_globals === undefined ) {
    this.filters = Object.create(trisquel.filters);
    this.cmds = Object.create(trisquel.cmds);
    this.cache = Object.create(trisquel.cache);
  } else {
    this.filters = {};
    this.cmds = {};
    this.cache = {};
  }
}
trisquel.Template = Template;

var template_funcs = {
  compile: trisquel,
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
  trisquel[fn_name] = template_funcs[fn_name];
  Template.prototype[fn_name] = template_funcs[fn_name];
}

trisquel.cmd('include', function (scope, expression) {
  var tmpl = this.get(expression.trim());
  if( !tmpl ) {
    throw new Error('can not include template: \'' + scope.eval(expression) + '\' ( expression: ' + expression + ' )');
  }
  return tmpl(scope);
}, true);

trisquel.cmd('includeEval', function (scope, expression) {
  var tmpl = this.get(scope.eval(expression));
  if( !tmpl ) {
    throw new Error('can not include template: \'' + scope.eval(expression) + '\' ( expression: ' + expression + ' )');
  }
  return tmpl(scope);
}, true);

export default trisquel;
