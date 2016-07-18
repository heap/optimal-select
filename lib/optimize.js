'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = optimize;

var _adapt = require('./adapt');

var _adapt2 = _interopRequireDefault(_adapt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Apply different optimization techniques
 * @param  {string}      selector - [description]
 * @param  {HTMLElement} element  - [description]
 * @return {string}               - [description]
 */
function optimize(selector, element) {
  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];


  var globalModified = (0, _adapt2.default)(element, options);

  // chunk parts outside of quotes (http://stackoverflow.com/a/25663729)
  var path = selector.replace(/> /g, '>').split(/\s+(?=(?:(?:[^"]*"){2})*[^"]*$)/);

  if (path.length < 3) {
    return selector;
  }

  var shortened = [path.pop()];
  while (path.length > 1) {
    var current = path.pop();
    var prePart = path.join(' ');
    var postPart = shortened.join(' ');

    var pattern = prePart + ' ' + postPart;
    var matches = document.querySelectorAll(pattern);
    if (matches.length !== 1) {
      shortened.unshift(optimizePart(prePart, current, postPart, element));
    }
  }
  shortened.unshift(path[0]);
  path = shortened;

  // optimize start + end
  path[0] = optimizePart('', path[0], path.slice(1).join(' '), element);
  path[path.length - 1] = optimizePart(path.slice(0, -1).join(' '), path[path.length - 1], '', element);

  if (globalModified) {
    delete global.document;
  }

  return path.join(' ').replace(/>/g, '> ').trim();
}

/**
 * Improve a chunk of the selector
 * @param  {string}      prePart  - [description]
 * @param  {string}      current  - [description]
 * @param  {string}      postPart - [description]
 * @param  {HTMLElement} element  - [description]
 * @return {string}               - [description]
 */
/**
 * # Optimize
 *
 * 1.) Improve efficiency through shorter selectors by removing redundancy
 * 2.) Improve robustness through selector transformation
 */

function optimizePart(prePart, current, postPart, element) {
  if (prePart.length) prePart = prePart + ' ';
  if (postPart.length) postPart = ' ' + postPart;

  // robustness: attribute without value (generalization)
  if (/\[*\]/.test(current)) {
    var key = current.replace(/=.*$/, ']');
    var pattern = '' + prePart + key + postPart;
    var matches = document.querySelectorAll(pattern);
    if (matches.length === 1 && matches[0] === element) {
      current = key;
    } else {
      // robustness: replace specific key-value with tag (heuristic)
      var references = document.querySelectorAll('' + prePart + key);
      for (var i = 0, l = references.length; i < l; i++) {
        if (references[i].contains(element)) {
          var description = references[i].tagName.toLowerCase();
          var pattern = '' + prePart + description + postPart;
          var matches = document.querySelectorAll(pattern);
          if (matches.length === 1 && matches[0] === element) {
            current = description;
          }
          break;
        }
      }
    }
  }

  // robustness: descendant instead child (heuristic)
  if (/>/.test(current)) {
    var descendant = current.replace(/>/, '');
    var pattern = '' + prePart + descendant + postPart;
    var matches = document.querySelectorAll(pattern);
    if (matches.length === 1 && matches[0] === element) {
      current = descendant;
    }
  }

  // robustness: 'nth-of-type' instead 'nth-child' (heuristic)
  if (/:nth-child/.test(current)) {
    // TODO: consider complete coverage of 'nth-of-type' replacement
    var type = current.replace(/nth-child/g, 'nth-of-type');
    var pattern = '' + prePart + type + postPart;
    var matches = document.querySelectorAll(pattern);
    if (matches.length === 1 && matches[0] === element) {
      current = type;
    }
  }

  // efficiency: combinations of classname (partial permutations)
  if (/\.\S+\.\S+/.test(current)) {
    var names = current.trim().split('.').slice(1).map(function (name) {
      return '.' + name;
    }).sort(function (curr, next) {
      return curr.length - next.length;
    });
    while (names.length) {
      var partial = current.replace(names.shift(), '');
      var pattern = '' + prePart + partial + postPart;
      var matches = document.querySelectorAll(pattern);
      if (matches.length === 1 && matches[0] === element) {
        current = partial;
      }
    }
    // robustness: degrade complex classname (heuristic)
    if (current && current.match(/\./g).length > 2) {
      var _references = document.querySelectorAll('' + prePart + current);
      for (var i = 0, l = _references.length; i < l; i++) {
        if (_references[i].contains(element)) {
          // TODO:
          // - check using attributes + regard excludes
          var _description = _references[i].tagName.toLowerCase();
          var pattern = '' + prePart + _description + postPart;
          var matches = document.querySelectorAll(pattern);
          if (matches.length === 1 && matches[0] === element) {
            current = _description;
          }
          break;
        }
      }
    }
  }

  return current;
}
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm9wdGltaXplLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O2tCQWV3QixROztBQVJ4Qjs7Ozs7O0FBRUE7Ozs7OztBQU1lLFNBQVMsUUFBVCxDQUFtQixRQUFuQixFQUE2QixPQUE3QixFQUFvRDtBQUFBLE1BQWQsT0FBYyx5REFBSixFQUFJOzs7QUFFakUsTUFBTSxpQkFBaUIscUJBQU0sT0FBTixFQUFlLE9BQWYsQ0FBdkI7O0FBRUE7QUFDQSxNQUFJLE9BQU8sU0FBUyxPQUFULENBQWlCLEtBQWpCLEVBQXdCLEdBQXhCLEVBQTZCLEtBQTdCLENBQW1DLGlDQUFuQyxDQUFYOztBQUVBLE1BQUksS0FBSyxNQUFMLEdBQWMsQ0FBbEIsRUFBcUI7QUFDbkIsV0FBTyxRQUFQO0FBQ0Q7O0FBRUQsTUFBTSxZQUFZLENBQUMsS0FBSyxHQUFMLEVBQUQsQ0FBbEI7QUFDQSxTQUFPLEtBQUssTUFBTCxHQUFjLENBQXJCLEVBQXlCO0FBQ3ZCLFFBQU0sVUFBVSxLQUFLLEdBQUwsRUFBaEI7QUFDQSxRQUFNLFVBQVUsS0FBSyxJQUFMLENBQVUsR0FBVixDQUFoQjtBQUNBLFFBQU0sV0FBVyxVQUFVLElBQVYsQ0FBZSxHQUFmLENBQWpCOztBQUVBLFFBQU0sVUFBYSxPQUFiLFNBQXdCLFFBQTlCO0FBQ0EsUUFBTSxVQUFVLFNBQVMsZ0JBQVQsQ0FBMEIsT0FBMUIsQ0FBaEI7QUFDQSxRQUFJLFFBQVEsTUFBUixLQUFtQixDQUF2QixFQUEwQjtBQUN4QixnQkFBVSxPQUFWLENBQWtCLGFBQWEsT0FBYixFQUFzQixPQUF0QixFQUErQixRQUEvQixFQUF5QyxPQUF6QyxDQUFsQjtBQUNEO0FBQ0Y7QUFDRCxZQUFVLE9BQVYsQ0FBa0IsS0FBSyxDQUFMLENBQWxCO0FBQ0EsU0FBTyxTQUFQOztBQUVBO0FBQ0EsT0FBSyxDQUFMLElBQVUsYUFBYSxFQUFiLEVBQWlCLEtBQUssQ0FBTCxDQUFqQixFQUEwQixLQUFLLEtBQUwsQ0FBVyxDQUFYLEVBQWMsSUFBZCxDQUFtQixHQUFuQixDQUExQixFQUFtRCxPQUFuRCxDQUFWO0FBQ0EsT0FBSyxLQUFLLE1BQUwsR0FBWSxDQUFqQixJQUFzQixhQUFhLEtBQUssS0FBTCxDQUFXLENBQVgsRUFBYyxDQUFDLENBQWYsRUFBa0IsSUFBbEIsQ0FBdUIsR0FBdkIsQ0FBYixFQUEwQyxLQUFLLEtBQUssTUFBTCxHQUFZLENBQWpCLENBQTFDLEVBQStELEVBQS9ELEVBQW1FLE9BQW5FLENBQXRCOztBQUVBLE1BQUksY0FBSixFQUFvQjtBQUNsQixXQUFPLE9BQU8sUUFBZDtBQUNEOztBQUVELFNBQU8sS0FBSyxJQUFMLENBQVUsR0FBVixFQUFlLE9BQWYsQ0FBdUIsSUFBdkIsRUFBNkIsSUFBN0IsRUFBbUMsSUFBbkMsRUFBUDtBQUNEOztBQUVEOzs7Ozs7OztBQXBEQTs7Ozs7OztBQTREQSxTQUFTLFlBQVQsQ0FBdUIsT0FBdkIsRUFBZ0MsT0FBaEMsRUFBeUMsUUFBekMsRUFBbUQsT0FBbkQsRUFBNEQ7QUFDMUQsTUFBSSxRQUFRLE1BQVosRUFBb0IsVUFBYSxPQUFiO0FBQ3BCLE1BQUksU0FBUyxNQUFiLEVBQXFCLGlCQUFlLFFBQWY7O0FBRXJCO0FBQ0EsTUFBSSxRQUFRLElBQVIsQ0FBYSxPQUFiLENBQUosRUFBMkI7QUFDekIsUUFBTSxNQUFNLFFBQVEsT0FBUixDQUFnQixNQUFoQixFQUF3QixHQUF4QixDQUFaO0FBQ0EsUUFBSSxlQUFhLE9BQWIsR0FBdUIsR0FBdkIsR0FBNkIsUUFBakM7QUFDQSxRQUFJLFVBQVUsU0FBUyxnQkFBVCxDQUEwQixPQUExQixDQUFkO0FBQ0EsUUFBSSxRQUFRLE1BQVIsS0FBbUIsQ0FBbkIsSUFBd0IsUUFBUSxDQUFSLE1BQWUsT0FBM0MsRUFBb0Q7QUFDbEQsZ0JBQVUsR0FBVjtBQUNELEtBRkQsTUFFTztBQUNMO0FBQ0EsVUFBTSxhQUFhLFNBQVMsZ0JBQVQsTUFBNkIsT0FBN0IsR0FBdUMsR0FBdkMsQ0FBbkI7QUFDQSxXQUFLLElBQUksSUFBSSxDQUFSLEVBQVcsSUFBSSxXQUFXLE1BQS9CLEVBQXVDLElBQUksQ0FBM0MsRUFBOEMsR0FBOUMsRUFBbUQ7QUFDakQsWUFBSSxXQUFXLENBQVgsRUFBYyxRQUFkLENBQXVCLE9BQXZCLENBQUosRUFBcUM7QUFDbkMsY0FBTSxjQUFjLFdBQVcsQ0FBWCxFQUFjLE9BQWQsQ0FBc0IsV0FBdEIsRUFBcEI7QUFDQSxjQUFJLGVBQWEsT0FBYixHQUF1QixXQUF2QixHQUFxQyxRQUF6QztBQUNBLGNBQUksVUFBVSxTQUFTLGdCQUFULENBQTBCLE9BQTFCLENBQWQ7QUFDQSxjQUFJLFFBQVEsTUFBUixLQUFtQixDQUFuQixJQUF3QixRQUFRLENBQVIsTUFBZSxPQUEzQyxFQUFvRDtBQUNsRCxzQkFBVSxXQUFWO0FBQ0Q7QUFDRDtBQUNEO0FBQ0Y7QUFDRjtBQUNGOztBQUVEO0FBQ0EsTUFBSSxJQUFJLElBQUosQ0FBUyxPQUFULENBQUosRUFBdUI7QUFDckIsUUFBTSxhQUFhLFFBQVEsT0FBUixDQUFnQixHQUFoQixFQUFxQixFQUFyQixDQUFuQjtBQUNBLFFBQUksZUFBYSxPQUFiLEdBQXVCLFVBQXZCLEdBQW9DLFFBQXhDO0FBQ0EsUUFBSSxVQUFVLFNBQVMsZ0JBQVQsQ0FBMEIsT0FBMUIsQ0FBZDtBQUNBLFFBQUksUUFBUSxNQUFSLEtBQW1CLENBQW5CLElBQXdCLFFBQVEsQ0FBUixNQUFlLE9BQTNDLEVBQW9EO0FBQ2xELGdCQUFVLFVBQVY7QUFDRDtBQUNGOztBQUVEO0FBQ0EsTUFBSSxhQUFhLElBQWIsQ0FBa0IsT0FBbEIsQ0FBSixFQUFnQztBQUM5QjtBQUNBLFFBQU0sT0FBTyxRQUFRLE9BQVIsQ0FBZ0IsWUFBaEIsRUFBOEIsYUFBOUIsQ0FBYjtBQUNBLFFBQUksZUFBYSxPQUFiLEdBQXVCLElBQXZCLEdBQThCLFFBQWxDO0FBQ0EsUUFBSSxVQUFVLFNBQVMsZ0JBQVQsQ0FBMEIsT0FBMUIsQ0FBZDtBQUNBLFFBQUksUUFBUSxNQUFSLEtBQW1CLENBQW5CLElBQXdCLFFBQVEsQ0FBUixNQUFlLE9BQTNDLEVBQW9EO0FBQ2xELGdCQUFVLElBQVY7QUFDRDtBQUNGOztBQUVEO0FBQ0EsTUFBSSxhQUFhLElBQWIsQ0FBa0IsT0FBbEIsQ0FBSixFQUFnQztBQUM5QixRQUFNLFFBQVEsUUFBUSxJQUFSLEdBQWUsS0FBZixDQUFxQixHQUFyQixFQUEwQixLQUExQixDQUFnQyxDQUFoQyxFQUFtQyxHQUFuQyxDQUF1QyxVQUFDLElBQUQ7QUFBQSxtQkFBYyxJQUFkO0FBQUEsS0FBdkMsRUFDZSxJQURmLENBQ29CLFVBQUMsSUFBRCxFQUFPLElBQVA7QUFBQSxhQUFnQixLQUFLLE1BQUwsR0FBYyxLQUFLLE1BQW5DO0FBQUEsS0FEcEIsQ0FBZDtBQUVBLFdBQU8sTUFBTSxNQUFiLEVBQXFCO0FBQ25CLFVBQUksVUFBVSxRQUFRLE9BQVIsQ0FBZ0IsTUFBTSxLQUFOLEVBQWhCLEVBQStCLEVBQS9CLENBQWQ7QUFDQSxVQUFJLGVBQWEsT0FBYixHQUF1QixPQUF2QixHQUFpQyxRQUFyQztBQUNBLFVBQUksVUFBVSxTQUFTLGdCQUFULENBQTBCLE9BQTFCLENBQWQ7QUFDQSxVQUFJLFFBQVEsTUFBUixLQUFtQixDQUFuQixJQUF3QixRQUFRLENBQVIsTUFBZSxPQUEzQyxFQUFvRDtBQUNsRCxrQkFBVSxPQUFWO0FBQ0Q7QUFDRjtBQUNEO0FBQ0EsUUFBSSxXQUFXLFFBQVEsS0FBUixDQUFjLEtBQWQsRUFBcUIsTUFBckIsR0FBOEIsQ0FBN0MsRUFBZ0Q7QUFDOUMsVUFBTSxjQUFhLFNBQVMsZ0JBQVQsTUFBNkIsT0FBN0IsR0FBdUMsT0FBdkMsQ0FBbkI7QUFDQSxXQUFLLElBQUksSUFBSSxDQUFSLEVBQVcsSUFBSSxZQUFXLE1BQS9CLEVBQXVDLElBQUksQ0FBM0MsRUFBOEMsR0FBOUMsRUFBbUQ7QUFDakQsWUFBSSxZQUFXLENBQVgsRUFBYyxRQUFkLENBQXVCLE9BQXZCLENBQUosRUFBcUM7QUFDbkM7QUFDQTtBQUNBLGNBQU0sZUFBYyxZQUFXLENBQVgsRUFBYyxPQUFkLENBQXNCLFdBQXRCLEVBQXBCO0FBQ0EsY0FBSSxlQUFhLE9BQWIsR0FBdUIsWUFBdkIsR0FBcUMsUUFBekM7QUFDQSxjQUFJLFVBQVUsU0FBUyxnQkFBVCxDQUEwQixPQUExQixDQUFkO0FBQ0EsY0FBSSxRQUFRLE1BQVIsS0FBbUIsQ0FBbkIsSUFBd0IsUUFBUSxDQUFSLE1BQWUsT0FBM0MsRUFBb0Q7QUFDbEQsc0JBQVUsWUFBVjtBQUNEO0FBQ0Q7QUFDRDtBQUNGO0FBQ0Y7QUFDRjs7QUFFRCxTQUFPLE9BQVA7QUFDRCIsImZpbGUiOiJvcHRpbWl6ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogIyBPcHRpbWl6ZVxuICpcbiAqIDEuKSBJbXByb3ZlIGVmZmljaWVuY3kgdGhyb3VnaCBzaG9ydGVyIHNlbGVjdG9ycyBieSByZW1vdmluZyByZWR1bmRhbmN5XG4gKiAyLikgSW1wcm92ZSByb2J1c3RuZXNzIHRocm91Z2ggc2VsZWN0b3IgdHJhbnNmb3JtYXRpb25cbiAqL1xuXG5pbXBvcnQgYWRhcHQgZnJvbSAnLi9hZGFwdCdcblxuLyoqXG4gKiBBcHBseSBkaWZmZXJlbnQgb3B0aW1pemF0aW9uIHRlY2huaXF1ZXNcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICBzZWxlY3RvciAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gb3B0aW1pemUgKHNlbGVjdG9yLCBlbGVtZW50LCBvcHRpb25zID0ge30pIHtcblxuICBjb25zdCBnbG9iYWxNb2RpZmllZCA9IGFkYXB0KGVsZW1lbnQsIG9wdGlvbnMpXG5cbiAgLy8gY2h1bmsgcGFydHMgb3V0c2lkZSBvZiBxdW90ZXMgKGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzI1NjYzNzI5KVxuICB2YXIgcGF0aCA9IHNlbGVjdG9yLnJlcGxhY2UoLz4gL2csICc+Jykuc3BsaXQoL1xccysoPz0oPzooPzpbXlwiXSpcIil7Mn0pKlteXCJdKiQpLylcblxuICBpZiAocGF0aC5sZW5ndGggPCAzKSB7XG4gICAgcmV0dXJuIHNlbGVjdG9yXG4gIH1cblxuICBjb25zdCBzaG9ydGVuZWQgPSBbcGF0aC5wb3AoKV1cbiAgd2hpbGUgKHBhdGgubGVuZ3RoID4gMSkgIHtcbiAgICBjb25zdCBjdXJyZW50ID0gcGF0aC5wb3AoKVxuICAgIGNvbnN0IHByZVBhcnQgPSBwYXRoLmpvaW4oJyAnKVxuICAgIGNvbnN0IHBvc3RQYXJ0ID0gc2hvcnRlbmVkLmpvaW4oJyAnKVxuXG4gICAgY29uc3QgcGF0dGVybiA9IGAke3ByZVBhcnR9ICR7cG9zdFBhcnR9YFxuICAgIGNvbnN0IG1hdGNoZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHBhdHRlcm4pXG4gICAgaWYgKG1hdGNoZXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICBzaG9ydGVuZWQudW5zaGlmdChvcHRpbWl6ZVBhcnQocHJlUGFydCwgY3VycmVudCwgcG9zdFBhcnQsIGVsZW1lbnQpKVxuICAgIH1cbiAgfVxuICBzaG9ydGVuZWQudW5zaGlmdChwYXRoWzBdKVxuICBwYXRoID0gc2hvcnRlbmVkXG5cbiAgLy8gb3B0aW1pemUgc3RhcnQgKyBlbmRcbiAgcGF0aFswXSA9IG9wdGltaXplUGFydCgnJywgcGF0aFswXSwgcGF0aC5zbGljZSgxKS5qb2luKCcgJyksIGVsZW1lbnQpXG4gIHBhdGhbcGF0aC5sZW5ndGgtMV0gPSBvcHRpbWl6ZVBhcnQocGF0aC5zbGljZSgwLCAtMSkuam9pbignICcpLCBwYXRoW3BhdGgubGVuZ3RoLTFdLCAnJywgZWxlbWVudClcblxuICBpZiAoZ2xvYmFsTW9kaWZpZWQpIHtcbiAgICBkZWxldGUgZ2xvYmFsLmRvY3VtZW50XG4gIH1cblxuICByZXR1cm4gcGF0aC5qb2luKCcgJykucmVwbGFjZSgvPi9nLCAnPiAnKS50cmltKClcbn1cblxuLyoqXG4gKiBJbXByb3ZlIGEgY2h1bmsgb2YgdGhlIHNlbGVjdG9yXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgcHJlUGFydCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgY3VycmVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgcG9zdFBhcnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIG9wdGltaXplUGFydCAocHJlUGFydCwgY3VycmVudCwgcG9zdFBhcnQsIGVsZW1lbnQpIHtcbiAgaWYgKHByZVBhcnQubGVuZ3RoKSBwcmVQYXJ0ID0gYCR7cHJlUGFydH0gYFxuICBpZiAocG9zdFBhcnQubGVuZ3RoKSBwb3N0UGFydCA9IGAgJHtwb3N0UGFydH1gXG5cbiAgLy8gcm9idXN0bmVzczogYXR0cmlidXRlIHdpdGhvdXQgdmFsdWUgKGdlbmVyYWxpemF0aW9uKVxuICBpZiAoL1xcWypcXF0vLnRlc3QoY3VycmVudCkpIHtcbiAgICBjb25zdCBrZXkgPSBjdXJyZW50LnJlcGxhY2UoLz0uKiQvLCAnXScpXG4gICAgdmFyIHBhdHRlcm4gPSBgJHtwcmVQYXJ0fSR7a2V5fSR7cG9zdFBhcnR9YFxuICAgIHZhciBtYXRjaGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSAmJiBtYXRjaGVzWzBdID09PSBlbGVtZW50KSB7XG4gICAgICBjdXJyZW50ID0ga2V5XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHJvYnVzdG5lc3M6IHJlcGxhY2Ugc3BlY2lmaWMga2V5LXZhbHVlIHdpdGggdGFnIChoZXVyaXN0aWMpXG4gICAgICBjb25zdCByZWZlcmVuY2VzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgJHtwcmVQYXJ0fSR7a2V5fWApXG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHJlZmVyZW5jZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChyZWZlcmVuY2VzW2ldLmNvbnRhaW5zKGVsZW1lbnQpKSB7XG4gICAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSByZWZlcmVuY2VzW2ldLnRhZ05hbWUudG9Mb3dlckNhc2UoKVxuICAgICAgICAgIHZhciBwYXR0ZXJuID0gYCR7cHJlUGFydH0ke2Rlc2NyaXB0aW9ufSR7cG9zdFBhcnR9YFxuICAgICAgICAgIHZhciBtYXRjaGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgICAgICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSAmJiBtYXRjaGVzWzBdID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICBjdXJyZW50ID0gZGVzY3JpcHRpb25cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIHJvYnVzdG5lc3M6IGRlc2NlbmRhbnQgaW5zdGVhZCBjaGlsZCAoaGV1cmlzdGljKVxuICBpZiAoLz4vLnRlc3QoY3VycmVudCkpIHtcbiAgICBjb25zdCBkZXNjZW5kYW50ID0gY3VycmVudC5yZXBsYWNlKC8+LywgJycpXG4gICAgdmFyIHBhdHRlcm4gPSBgJHtwcmVQYXJ0fSR7ZGVzY2VuZGFudH0ke3Bvc3RQYXJ0fWBcbiAgICB2YXIgbWF0Y2hlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocGF0dGVybilcbiAgICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDEgJiYgbWF0Y2hlc1swXSA9PT0gZWxlbWVudCkge1xuICAgICAgY3VycmVudCA9IGRlc2NlbmRhbnRcbiAgICB9XG4gIH1cblxuICAvLyByb2J1c3RuZXNzOiAnbnRoLW9mLXR5cGUnIGluc3RlYWQgJ250aC1jaGlsZCcgKGhldXJpc3RpYylcbiAgaWYgKC86bnRoLWNoaWxkLy50ZXN0KGN1cnJlbnQpKSB7XG4gICAgLy8gVE9ETzogY29uc2lkZXIgY29tcGxldGUgY292ZXJhZ2Ugb2YgJ250aC1vZi10eXBlJyByZXBsYWNlbWVudFxuICAgIGNvbnN0IHR5cGUgPSBjdXJyZW50LnJlcGxhY2UoL250aC1jaGlsZC9nLCAnbnRoLW9mLXR5cGUnKVxuICAgIHZhciBwYXR0ZXJuID0gYCR7cHJlUGFydH0ke3R5cGV9JHtwb3N0UGFydH1gXG4gICAgdmFyIG1hdGNoZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHBhdHRlcm4pXG4gICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxICYmIG1hdGNoZXNbMF0gPT09IGVsZW1lbnQpIHtcbiAgICAgIGN1cnJlbnQgPSB0eXBlXG4gICAgfVxuICB9XG5cbiAgLy8gZWZmaWNpZW5jeTogY29tYmluYXRpb25zIG9mIGNsYXNzbmFtZSAocGFydGlhbCBwZXJtdXRhdGlvbnMpXG4gIGlmICgvXFwuXFxTK1xcLlxcUysvLnRlc3QoY3VycmVudCkpIHtcbiAgICBjb25zdCBuYW1lcyA9IGN1cnJlbnQudHJpbSgpLnNwbGl0KCcuJykuc2xpY2UoMSkubWFwKChuYW1lKSA9PiBgLiR7bmFtZX1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc29ydCgoY3VyciwgbmV4dCkgPT4gY3Vyci5sZW5ndGggLSBuZXh0Lmxlbmd0aClcbiAgICB3aGlsZSAobmFtZXMubGVuZ3RoKSB7XG4gICAgICB2YXIgcGFydGlhbCA9IGN1cnJlbnQucmVwbGFjZShuYW1lcy5zaGlmdCgpLCAnJylcbiAgICAgIHZhciBwYXR0ZXJuID0gYCR7cHJlUGFydH0ke3BhcnRpYWx9JHtwb3N0UGFydH1gXG4gICAgICB2YXIgbWF0Y2hlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocGF0dGVybilcbiAgICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSAmJiBtYXRjaGVzWzBdID09PSBlbGVtZW50KSB7XG4gICAgICAgIGN1cnJlbnQgPSBwYXJ0aWFsXG4gICAgICB9XG4gICAgfVxuICAgIC8vIHJvYnVzdG5lc3M6IGRlZ3JhZGUgY29tcGxleCBjbGFzc25hbWUgKGhldXJpc3RpYylcbiAgICBpZiAoY3VycmVudCAmJiBjdXJyZW50Lm1hdGNoKC9cXC4vZykubGVuZ3RoID4gMikge1xuICAgICAgY29uc3QgcmVmZXJlbmNlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYCR7cHJlUGFydH0ke2N1cnJlbnR9YClcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcmVmZXJlbmNlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYgKHJlZmVyZW5jZXNbaV0uY29udGFpbnMoZWxlbWVudCkpIHtcbiAgICAgICAgICAvLyBUT0RPOlxuICAgICAgICAgIC8vIC0gY2hlY2sgdXNpbmcgYXR0cmlidXRlcyArIHJlZ2FyZCBleGNsdWRlc1xuICAgICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gcmVmZXJlbmNlc1tpXS50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICB2YXIgcGF0dGVybiA9IGAke3ByZVBhcnR9JHtkZXNjcmlwdGlvbn0ke3Bvc3RQYXJ0fWBcbiAgICAgICAgICB2YXIgbWF0Y2hlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocGF0dGVybilcbiAgICAgICAgICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDEgJiYgbWF0Y2hlc1swXSA9PT0gZWxlbWVudCkge1xuICAgICAgICAgICAgY3VycmVudCA9IGRlc2NyaXB0aW9uXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gY3VycmVudFxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
