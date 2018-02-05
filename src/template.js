
import Scope from './scope';
import parse from './parse';
import cmds from './cmds';
import evalExpression from './eval';

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

export default template;
