var toDot = require('jsonpath-to-dot');
var _ = require('lodash');

function _isInt(value) {
  var x;
  return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
}

function _set(update, path, p) {

  if (!update.$set) {
    update.$set = {};
  }

  update.$set[toDot(p.path)] = p.value;
}

function _push(update, path, p, index) {

  if (!update.$push) {
    update.$push = {};
  }

  if (!update.$push[path]) {
    update.$push[path] = {
      $each: [p.value]
    };
    if (index) {
      update.$push[path].$position = index;
    }

  } else if (update.$push[path]) {
    if (!update.$push[path].$each) {
      update.$push[path] = {
        $each: [update.$push[path]]
      };

      if (index) {
        update.$push[path].$position = index;
      }
    }
    update.$push[path].$each.push(p.value);
  }
}

module.exports = function(patches) {
  var update = {};
  patches.map(function(p) {
    if (p.op === 'add') {
      var path = toDot(p.path);

      var lastNode = _.chain(path)
        .split('.')
        .last()
        .value();

      var lastNodeParsed = parseInt(lastNode, 10);

      var isArray =  lastNode === '-' || _isInt(lastNodeParsed);

      if (isArray) {
        var newPath = _.chain(path)
          .split('.')
          .initial()
          .join('.')
          .value();

        _push(update, newPath, p, lastNodeParsed);
      } else {
        _set(update, path, p);
      }
    } else if (p.op === 'remove') {
      if (!update.$unset) {
        update.$unset = {};
      }
      update.$unset[toDot(p.path)] = 1;
    } else if (p.op === 'replace') {
      if (!update.$set) {
        update.$set = {};
      }
      update.$set[toDot(p.path)] = p.value;
    } else if (p.op !== 'test') {
      throw new Error('Unsupported Operation! op = ' + p.op);
    }
  });
  return update;
};
