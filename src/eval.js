
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
      if( !filters[filter_name] ) throw new Error('filter \'' + filter_name + '\' is not defined');
      return filters[filter_name].apply(scope, [result].concat( args.map(function (arg) {
        return scope.eval(arg);
      }) ) );
    };
  });
}

function evalExpression (expression, filters) {
  var parsed = _parseExpression(expression);

  var evaluator = (new Function('scope', 'try { with(scope) { return (' + parsed.expression + '); }; } catch(err) { return \'\'; }'));

  var _filters = filters ? _mapFilters(filters, parsed.filters) : [];

  return function (scope) {
    var result = evaluator(scope);

    for( var i = 0, n = _filters.length ; i < n ; i++ ) {
      result = _filters[i](result, scope);
    }

    return result;
  };
}

// function evalExpression (expression, scope) {
//   return scope ? _evalExpression(expression, this.filters || {})(scope) : _evalExpression(expression, this.filters || {});
// }

export default evalExpression;
