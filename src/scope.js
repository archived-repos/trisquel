'use strict';

import evalExpression from './eval';

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

// module.exports = Scope;

export default Scope;
