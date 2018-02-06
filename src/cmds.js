
var REeach = /([^,]+)(\s*,\s*([\S]+))? in (\S+)/;

export default {
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
