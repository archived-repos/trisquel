
export function pipeResult (process_map, result, scope) {

  for( var i = 0, n = process_map.length ; i < n ; i++ ) {
    result = process_map[i](result, scope);
  }

  return result;
}

export function mapFilters (filters, parts) {
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

function _trimStr (str) {
  return str.trim();
}

export function parseExpression (expression) {
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
    filters: filters.map(_trimStr),
  };
}

export function evalExpression (expression, filters, trim_expression) {
  var parsed = parseExpression(expression), evaluator,
      filters_map = filters ? mapFilters(filters, parsed.filters) : [];

  if( trim_expression ) parsed.expression = parsed.expression.trim();

  return function (scope, processExpression) {
    if( !processExpression && !evaluator ) {
      evaluator = (new Function('scope', 'try { with(scope) { return (' + parsed.expression + '); }; } catch(err) { return \'\'; }'));
    }
    return pipeResult(filters_map, processExpression ? processExpression.call(scope, parsed.expression, scope) : evaluator(scope), scope );
  };
}
