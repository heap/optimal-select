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
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};


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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm9wdGltaXplLmpzIl0sIm5hbWVzIjpbIm9wdGltaXplIiwic2VsZWN0b3IiLCJlbGVtZW50Iiwib3B0aW9ucyIsImdsb2JhbE1vZGlmaWVkIiwicGF0aCIsInJlcGxhY2UiLCJzcGxpdCIsImxlbmd0aCIsInNob3J0ZW5lZCIsInBvcCIsImN1cnJlbnQiLCJwcmVQYXJ0Iiwiam9pbiIsInBvc3RQYXJ0IiwicGF0dGVybiIsIm1hdGNoZXMiLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJ1bnNoaWZ0Iiwib3B0aW1pemVQYXJ0Iiwic2xpY2UiLCJnbG9iYWwiLCJ0cmltIiwidGVzdCIsImtleSIsInJlZmVyZW5jZXMiLCJpIiwibCIsImNvbnRhaW5zIiwiZGVzY3JpcHRpb24iLCJ0YWdOYW1lIiwidG9Mb3dlckNhc2UiLCJkZXNjZW5kYW50IiwidHlwZSIsIm5hbWVzIiwibWFwIiwibmFtZSIsInNvcnQiLCJjdXJyIiwibmV4dCIsInBhcnRpYWwiLCJzaGlmdCIsIm1hdGNoIl0sIm1hcHBpbmdzIjoiOzs7OztrQkFld0JBLFE7O0FBUnhCOzs7Ozs7QUFFQTs7Ozs7O0FBTWUsU0FBU0EsUUFBVCxDQUFtQkMsUUFBbkIsRUFBNkJDLE9BQTdCLEVBQW9EO0FBQUEsTUFBZEMsT0FBYyx1RUFBSixFQUFJOzs7QUFFakUsTUFBTUMsaUJBQWlCLHFCQUFNRixPQUFOLEVBQWVDLE9BQWYsQ0FBdkI7O0FBRUE7QUFDQSxNQUFJRSxPQUFPSixTQUFTSyxPQUFULENBQWlCLEtBQWpCLEVBQXdCLEdBQXhCLEVBQTZCQyxLQUE3QixDQUFtQyxpQ0FBbkMsQ0FBWDs7QUFFQSxNQUFJRixLQUFLRyxNQUFMLEdBQWMsQ0FBbEIsRUFBcUI7QUFDbkIsV0FBT1AsUUFBUDtBQUNEOztBQUVELE1BQU1RLFlBQVksQ0FBQ0osS0FBS0ssR0FBTCxFQUFELENBQWxCO0FBQ0EsU0FBT0wsS0FBS0csTUFBTCxHQUFjLENBQXJCLEVBQXlCO0FBQ3ZCLFFBQU1HLFVBQVVOLEtBQUtL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QUNGOztBQUVELFNBQU9uQixPQUFQO0FBQ0QiLCJmaWxlIjoib3B0aW1pemUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqICMgT3B0aW1pemVcbiAqXG4gKiAxLikgSW1wcm92ZSBlZmZpY2llbmN5IHRocm91Z2ggc2hvcnRlciBzZWxlY3RvcnMgYnkgcmVtb3ZpbmcgcmVkdW5kYW5jeVxuICogMi4pIEltcHJvdmUgcm9idXN0bmVzcyB0aHJvdWdoIHNlbGVjdG9yIHRyYW5zZm9ybWF0aW9uXG4gKi9cblxuaW1wb3J0IGFkYXB0IGZyb20gJy4vYWRhcHQnXG5cbi8qKlxuICogQXBwbHkgZGlmZmVyZW50IG9wdGltaXphdGlvbiB0ZWNobmlxdWVzXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgc2VsZWN0b3IgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG9wdGltaXplIChzZWxlY3RvciwgZWxlbWVudCwgb3B0aW9ucyA9IHt9KSB7XG5cbiAgY29uc3QgZ2xvYmFsTW9kaWZpZWQgPSBhZGFwdChlbGVtZW50LCBvcHRpb25zKVxuXG4gIC8vIGNodW5rIHBhcnRzIG91dHNpZGUgb2YgcXVvdGVzIChodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yNTY2MzcyOSlcbiAgdmFyIHBhdGggPSBzZWxlY3Rvci5yZXBsYWNlKC8+IC9nLCAnPicpLnNwbGl0KC9cXHMrKD89KD86KD86W15cIl0qXCIpezJ9KSpbXlwiXSokKS8pXG5cbiAgaWYgKHBhdGgubGVuZ3RoIDwgMykge1xuICAgIHJldHVybiBzZWxlY3RvclxuICB9XG5cbiAgY29uc3Qgc2hvcnRlbmVkID0gW3BhdGgucG9wKCldXG4gIHdoaWxlIChwYXRoLmxlbmd0aCA+IDEpICB7XG4gICAgY29uc3QgY3VycmVudCA9IHBhdGgucG9wKClcbiAgICBjb25zdCBwcmVQYXJ0ID0gcGF0aC5qb2luKCcgJylcbiAgICBjb25zdCBwb3N0UGFydCA9IHNob3J0ZW5lZC5qb2luKCcgJylcblxuICAgIGNvbnN0IHBhdHRlcm4gPSBgJHtwcmVQYXJ0fSAke3Bvc3RQYXJ0fWBcbiAgICBjb25zdCBtYXRjaGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgIGlmIChtYXRjaGVzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgc2hvcnRlbmVkLnVuc2hpZnQob3B0aW1pemVQYXJ0KHByZVBhcnQsIGN1cnJlbnQsIHBvc3RQYXJ0LCBlbGVtZW50KSlcbiAgICB9XG4gIH1cbiAgc2hvcnRlbmVkLnVuc2hpZnQocGF0aFswXSlcbiAgcGF0aCA9IHNob3J0ZW5lZFxuXG4gIC8vIG9wdGltaXplIHN0YXJ0ICsgZW5kXG4gIHBhdGhbMF0gPSBvcHRpbWl6ZVBhcnQoJycsIHBhdGhbMF0sIHBhdGguc2xpY2UoMSkuam9pbignICcpLCBlbGVtZW50KVxuICBwYXRoW3BhdGgubGVuZ3RoLTFdID0gb3B0aW1pemVQYXJ0KHBhdGguc2xpY2UoMCwgLTEpLmpvaW4oJyAnKSwgcGF0aFtwYXRoLmxlbmd0aC0xXSwgJycsIGVsZW1lbnQpXG5cbiAgaWYgKGdsb2JhbE1vZGlmaWVkKSB7XG4gICAgZGVsZXRlIGdsb2JhbC5kb2N1bWVudFxuICB9XG5cbiAgcmV0dXJuIHBhdGguam9pbignICcpLnJlcGxhY2UoLz4vZywgJz4gJykudHJpbSgpXG59XG5cbi8qKlxuICogSW1wcm92ZSBhIGNodW5rIG9mIHRoZSBzZWxlY3RvclxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgIHByZVBhcnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgIGN1cnJlbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgIHBvc3RQYXJ0IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBvcHRpbWl6ZVBhcnQgKHByZVBhcnQsIGN1cnJlbnQsIHBvc3RQYXJ0LCBlbGVtZW50KSB7XG4gIGlmIChwcmVQYXJ0Lmxlbmd0aCkgcHJlUGFydCA9IGAke3ByZVBhcnR9IGBcbiAgaWYgKHBvc3RQYXJ0Lmxlbmd0aCkgcG9zdFBhcnQgPSBgICR7cG9zdFBhcnR9YFxuXG4gIC8vIHJvYnVzdG5lc3M6IGF0dHJpYnV0ZSB3aXRob3V0IHZhbHVlIChnZW5lcmFsaXphdGlvbilcbiAgaWYgKC9cXFsqXFxdLy50ZXN0KGN1cnJlbnQpKSB7XG4gICAgY29uc3Qga2V5ID0gY3VycmVudC5yZXBsYWNlKC89LiokLywgJ10nKVxuICAgIHZhciBwYXR0ZXJuID0gYCR7cHJlUGFydH0ke2tleX0ke3Bvc3RQYXJ0fWBcbiAgICB2YXIgbWF0Y2hlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocGF0dGVybilcbiAgICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDEgJiYgbWF0Y2hlc1swXSA9PT0gZWxlbWVudCkge1xuICAgICAgY3VycmVudCA9IGtleVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyByb2J1c3RuZXNzOiByZXBsYWNlIHNwZWNpZmljIGtleS12YWx1ZSB3aXRoIHRhZyAoaGV1cmlzdGljKVxuICAgICAgY29uc3QgcmVmZXJlbmNlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYCR7cHJlUGFydH0ke2tleX1gKVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSByZWZlcmVuY2VzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBpZiAocmVmZXJlbmNlc1tpXS5jb250YWlucyhlbGVtZW50KSkge1xuICAgICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gcmVmZXJlbmNlc1tpXS50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICB2YXIgcGF0dGVybiA9IGAke3ByZVBhcnR9JHtkZXNjcmlwdGlvbn0ke3Bvc3RQYXJ0fWBcbiAgICAgICAgICB2YXIgbWF0Y2hlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocGF0dGVybilcbiAgICAgICAgICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDEgJiYgbWF0Y2hlc1swXSA9PT0gZWxlbWVudCkge1xuICAgICAgICAgICAgY3VycmVudCA9IGRlc2NyaXB0aW9uXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyByb2J1c3RuZXNzOiBkZXNjZW5kYW50IGluc3RlYWQgY2hpbGQgKGhldXJpc3RpYylcbiAgaWYgKC8+Ly50ZXN0KGN1cnJlbnQpKSB7XG4gICAgY29uc3QgZGVzY2VuZGFudCA9IGN1cnJlbnQucmVwbGFjZSgvPi8sICcnKVxuICAgIHZhciBwYXR0ZXJuID0gYCR7cHJlUGFydH0ke2Rlc2NlbmRhbnR9JHtwb3N0UGFydH1gXG4gICAgdmFyIG1hdGNoZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHBhdHRlcm4pXG4gICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxICYmIG1hdGNoZXNbMF0gPT09IGVsZW1lbnQpIHtcbiAgICAgIGN1cnJlbnQgPSBkZXNjZW5kYW50XG4gICAgfVxuICB9XG5cbiAgLy8gcm9idXN0bmVzczogJ250aC1vZi10eXBlJyBpbnN0ZWFkICdudGgtY2hpbGQnIChoZXVyaXN0aWMpXG4gIGlmICgvOm50aC1jaGlsZC8udGVzdChjdXJyZW50KSkge1xuICAgIC8vIFRPRE86IGNvbnNpZGVyIGNvbXBsZXRlIGNvdmVyYWdlIG9mICdudGgtb2YtdHlwZScgcmVwbGFjZW1lbnRcbiAgICBjb25zdCB0eXBlID0gY3VycmVudC5yZXBsYWNlKC9udGgtY2hpbGQvZywgJ250aC1vZi10eXBlJylcbiAgICB2YXIgcGF0dGVybiA9IGAke3ByZVBhcnR9JHt0eXBlfSR7cG9zdFBhcnR9YFxuICAgIHZhciBtYXRjaGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSAmJiBtYXRjaGVzWzBdID09PSBlbGVtZW50KSB7XG4gICAgICBjdXJyZW50ID0gdHlwZVxuICAgIH1cbiAgfVxuXG4gIC8vIGVmZmljaWVuY3k6IGNvbWJpbmF0aW9ucyBvZiBjbGFzc25hbWUgKHBhcnRpYWwgcGVybXV0YXRpb25zKVxuICBpZiAoL1xcLlxcUytcXC5cXFMrLy50ZXN0KGN1cnJlbnQpKSB7XG4gICAgY29uc3QgbmFtZXMgPSBjdXJyZW50LnRyaW0oKS5zcGxpdCgnLicpLnNsaWNlKDEpLm1hcCgobmFtZSkgPT4gYC4ke25hbWV9YClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGN1cnIsIG5leHQpID0+IGN1cnIubGVuZ3RoIC0gbmV4dC5sZW5ndGgpXG4gICAgd2hpbGUgKG5hbWVzLmxlbmd0aCkge1xuICAgICAgdmFyIHBhcnRpYWwgPSBjdXJyZW50LnJlcGxhY2UobmFtZXMuc2hpZnQoKSwgJycpXG4gICAgICB2YXIgcGF0dGVybiA9IGAke3ByZVBhcnR9JHtwYXJ0aWFsfSR7cG9zdFBhcnR9YFxuICAgICAgdmFyIG1hdGNoZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHBhdHRlcm4pXG4gICAgICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDEgJiYgbWF0Y2hlc1swXSA9PT0gZWxlbWVudCkge1xuICAgICAgICBjdXJyZW50ID0gcGFydGlhbFxuICAgICAgfVxuICAgIH1cbiAgICAvLyByb2J1c3RuZXNzOiBkZWdyYWRlIGNvbXBsZXggY2xhc3NuYW1lIChoZXVyaXN0aWMpXG4gICAgaWYgKGN1cnJlbnQgJiYgY3VycmVudC5tYXRjaCgvXFwuL2cpLmxlbmd0aCA+IDIpIHtcbiAgICAgIGNvbnN0IHJlZmVyZW5jZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAke3ByZVBhcnR9JHtjdXJyZW50fWApXG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHJlZmVyZW5jZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChyZWZlcmVuY2VzW2ldLmNvbnRhaW5zKGVsZW1lbnQpKSB7XG4gICAgICAgICAgLy8gVE9ETzpcbiAgICAgICAgICAvLyAtIGNoZWNrIHVzaW5nIGF0dHJpYnV0ZXMgKyByZWdhcmQgZXhjbHVkZXNcbiAgICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHJlZmVyZW5jZXNbaV0udGFnTmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgdmFyIHBhdHRlcm4gPSBgJHtwcmVQYXJ0fSR7ZGVzY3JpcHRpb259JHtwb3N0UGFydH1gXG4gICAgICAgICAgdmFyIG1hdGNoZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHBhdHRlcm4pXG4gICAgICAgICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxICYmIG1hdGNoZXNbMF0gPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBkZXNjcmlwdGlvblxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGN1cnJlbnRcbn1cbiJdfQ==
