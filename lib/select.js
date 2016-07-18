'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                   * # Select
                                                                                                                                                                                                                                                   *
                                                                                                                                                                                                                                                   * Construct a unique CSS queryselector to access the selected DOM element(s).
                                                                                                                                                                                                                                                   * Applies different matching and optimization strategies for efficiency.
                                                                                                                                                                                                                                                   */

exports.default = getQuerySelector;
exports.getSingleSelector = getSingleSelector;
exports.getMultiSelector = getMultiSelector;

var _adapt = require('./adapt');

var _adapt2 = _interopRequireDefault(_adapt);

var _match = require('./match');

var _match2 = _interopRequireDefault(_match);

var _optimize = require('./optimize');

var _optimize2 = _interopRequireDefault(_optimize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Choose action depending on the input (single/multi)
 * @param  {HTMLElement|Array} input   - [description]
 * @param  {Object}            options - [description]
 * @return {string}                    - [description]
 */
function getQuerySelector(input) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  if (Array.isArray(input)) {
    return getMultiSelector(input, options);
  }
  return getSingleSelector(input, options);
}

/**
 * Get a selector for the provided element
 * @param  {HTMLElement} element - [description]
 * @param  {Object}      options - [description]
 * @return {String}              - [description]
 */
function getSingleSelector(element, options) {

  if (element.nodeType === 3) {
    return getSingleSelector(element.parentNode);
  }
  if (element.nodeType !== 1) {
    throw new Error('Invalid input - only HTMLElements or representations of them are supported! (not "' + (typeof element === 'undefined' ? 'undefined' : _typeof(element)) + '")');
  }

  var globalModified = (0, _adapt2.default)(element, options);

  var selector = (0, _match2.default)(element, options);
  var optimized = (0, _optimize2.default)(selector, element, options);

  // debug
  // console.log(`
  //   selector: ${selector}
  //   optimized:${optimized}
  // `)

  if (globalModified) {
    delete global.document;
  }

  return optimized;
}

/**
 * Get a selector to match multiple children from a parent
 * @param  {Array}  elements - [description]
 * @param  {Object} options  - [description]
 * @return {string}          - [description]
 */
function getMultiSelector(elements, options) {
  var commonParentNode = null;
  var commonClassName = null;
  var commonAttribute = null;
  var commonTagName = null;

  for (var i = 0, l = elements.length; i < l; i++) {
    var element = elements[i];
    if (!commonParentNode) {
      // 1st entry
      commonParentNode = element.parentNode;
      commonClassName = element.className;
      // commonAttribute = element.attributes
      commonTagName = element.tagName;
    } else if (commonParentNode !== element.parentNode) {
      return console.log('Can\'t be efficiently mapped. It probably best to use multiple single selectors instead!');
    }
    if (element.className !== commonClassName) {
      var classNames = [];
      var longer, shorter;
      if (element.className.length > commonClassName.length) {
        longer = element.className;
        shorter = commonClassName;
      } else {
        longer = commonClassName;
        shorter = element.className;
      }
      shorter.split(' ').forEach(function (name) {
        if (longer.indexOf(name) > -1) {
          classNames.push(name);
        }
      });
      commonClassName = classNames.join(' ');
    }
    // TODO:
    // - check attributes
    // if (element.attributes !== commonAttribute) {
    //
    // }
    if (element.tagName !== commonTagName) {
      commonTagName = null;
    }
  }

  var selector = getSingleSelector(commonParentNode, options);
  console.log(selector, commonClassName, commonAttribute, commonTagName);

  if (commonClassName) {
    return selector + ' > .' + commonClassName.replace(/ /g, '.');
  }
  // if (commonAttribute) {
  //
  // }
  if (commonTagName) {
    return selector + ' > ' + commonTagName.toLowerCase();
  }
  return selector + ' > *';
}
//# sourceMappingURL=data:application/json;base64,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aEI7QUFDRDtBQUNGOztBQUVELE1BQU0sV0FBVyxrQkFBa0IsZ0JBQWxCLEVBQW9DLE9BQXBDLENBQWpCO0FBQ0EsVUFBUSxHQUFSLENBQVksUUFBWixFQUFzQixlQUF0QixFQUF1QyxlQUF2QyxFQUF3RCxhQUF4RDs7QUFFQSxNQUFJLGVBQUosRUFBcUI7QUFDbkIsV0FBVSxRQUFWLFlBQXlCLGdCQUFnQixPQUFoQixDQUF3QixJQUF4QixFQUE4QixHQUE5QixDQUF6QjtBQUNEO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsTUFBSSxhQUFKLEVBQW1CO0FBQ2pCLFdBQVUsUUFBVixXQUF3QixjQUFjLFdBQWQsRUFBeEI7QUFDRDtBQUNELFNBQVUsUUFBVjtBQUNEIiwiZmlsZSI6InNlbGVjdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogIyBTZWxlY3RcbiAqXG4gKiBDb25zdHJ1Y3QgYSB1bmlxdWUgQ1NTIHF1ZXJ5c2VsZWN0b3IgdG8gYWNjZXNzIHRoZSBzZWxlY3RlZCBET00gZWxlbWVudChzKS5cbiAqIEFwcGxpZXMgZGlmZmVyZW50IG1hdGNoaW5nIGFuZCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcyBmb3IgZWZmaWNpZW5jeS5cbiAqL1xuXG5pbXBvcnQgYWRhcHQgZnJvbSAnLi9hZGFwdCdcbmltcG9ydCBtYXRjaCBmcm9tICcuL21hdGNoJ1xuaW1wb3J0IG9wdGltaXplIGZyb20gJy4vb3B0aW1pemUnXG5cbi8qKlxuICogQ2hvb3NlIGFjdGlvbiBkZXBlbmRpbmcgb24gdGhlIGlucHV0IChzaW5nbGUvbXVsdGkpXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudHxBcnJheX0gaW5wdXQgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICAgICBvcHRpb25zIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGdldFF1ZXJ5U2VsZWN0b3IgKGlucHV0LCBvcHRpb25zID0ge30pIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoaW5wdXQpKSB7XG4gICAgcmV0dXJuIGdldE11bHRpU2VsZWN0b3IoaW5wdXQsIG9wdGlvbnMpXG4gIH1cbiAgcmV0dXJuIGdldFNpbmdsZVNlbGVjdG9yKGlucHV0LCBvcHRpb25zKVxufVxuXG4vKipcbiAqIEdldCBhIHNlbGVjdG9yIGZvciB0aGUgcHJvdmlkZWQgZWxlbWVudFxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgb3B0aW9ucyAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge1N0cmluZ30gICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2luZ2xlU2VsZWN0b3IgKGVsZW1lbnQsIG9wdGlvbnMpIHtcblxuICBpZiAoZWxlbWVudC5ub2RlVHlwZSA9PT0gMykge1xuICAgIHJldHVybiBnZXRTaW5nbGVTZWxlY3RvcihlbGVtZW50LnBhcmVudE5vZGUpXG4gIH1cbiAgaWYgKGVsZW1lbnQubm9kZVR5cGUgIT09IDEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgaW5wdXQgLSBvbmx5IEhUTUxFbGVtZW50cyBvciByZXByZXNlbnRhdGlvbnMgb2YgdGhlbSBhcmUgc3VwcG9ydGVkISAobm90IFwiJHt0eXBlb2YgZWxlbWVudH1cIilgKVxuICB9XG5cbiAgY29uc3QgZ2xvYmFsTW9kaWZpZWQgPSBhZGFwdChlbGVtZW50LCBvcHRpb25zKVxuXG4gIGNvbnN0IHNlbGVjdG9yID0gbWF0Y2goZWxlbWVudCwgb3B0aW9ucylcbiAgY29uc3Qgb3B0aW1pemVkID0gb3B0aW1pemUoc2VsZWN0b3IsIGVsZW1lbnQsIG9wdGlvbnMpXG5cbiAgLy8gZGVidWdcbiAgLy8gY29uc29sZS5sb2coYFxuICAvLyAgIHNlbGVjdG9yOiAke3NlbGVjdG9yfVxuICAvLyAgIG9wdGltaXplZDoke29wdGltaXplZH1cbiAgLy8gYClcblxuICBpZiAoZ2xvYmFsTW9kaWZpZWQpIHtcbiAgICBkZWxldGUgZ2xvYmFsLmRvY3VtZW50XG4gIH1cblxuICByZXR1cm4gb3B0aW1pemVkXG59XG5cbi8qKlxuICogR2V0IGEgc2VsZWN0b3IgdG8gbWF0Y2ggbXVsdGlwbGUgY2hpbGRyZW4gZnJvbSBhIHBhcmVudFxuICogQHBhcmFtICB7QXJyYXl9ICBlbGVtZW50cyAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TXVsdGlTZWxlY3RvciAoZWxlbWVudHMsIG9wdGlvbnMpIHtcbiAgdmFyIGNvbW1vblBhcmVudE5vZGUgPSBudWxsXG4gIHZhciBjb21tb25DbGFzc05hbWUgPSBudWxsXG4gIHZhciBjb21tb25BdHRyaWJ1dGUgPSBudWxsXG4gIHZhciBjb21tb25UYWdOYW1lID0gbnVsbFxuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gZWxlbWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBlbGVtZW50c1tpXVxuICAgIGlmICghY29tbW9uUGFyZW50Tm9kZSkgeyAvLyAxc3QgZW50cnlcbiAgICAgIGNvbW1vblBhcmVudE5vZGUgPSBlbGVtZW50LnBhcmVudE5vZGVcbiAgICAgIGNvbW1vbkNsYXNzTmFtZSA9IGVsZW1lbnQuY2xhc3NOYW1lXG4gICAgICAvLyBjb21tb25BdHRyaWJ1dGUgPSBlbGVtZW50LmF0dHJpYnV0ZXNcbiAgICAgIGNvbW1vblRhZ05hbWUgPSBlbGVtZW50LnRhZ05hbWVcbiAgICB9IGVsc2UgaWYgKGNvbW1vblBhcmVudE5vZGUgIT09IGVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKCdDYW5cXCd0IGJlIGVmZmljaWVudGx5IG1hcHBlZC4gSXQgcHJvYmFibHkgYmVzdCB0byB1c2UgbXVsdGlwbGUgc2luZ2xlIHNlbGVjdG9ycyBpbnN0ZWFkIScpXG4gICAgfVxuICAgIGlmIChlbGVtZW50LmNsYXNzTmFtZSAhPT0gY29tbW9uQ2xhc3NOYW1lKSB7XG4gICAgICB2YXIgY2xhc3NOYW1lcyA9IFtdXG4gICAgICB2YXIgbG9uZ2VyLCBzaG9ydGVyXG4gICAgICBpZiAoZWxlbWVudC5jbGFzc05hbWUubGVuZ3RoID4gY29tbW9uQ2xhc3NOYW1lLmxlbmd0aCkge1xuICAgICAgICBsb25nZXIgPSBlbGVtZW50LmNsYXNzTmFtZVxuICAgICAgICBzaG9ydGVyID0gY29tbW9uQ2xhc3NOYW1lXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb25nZXIgPSBjb21tb25DbGFzc05hbWVcbiAgICAgICAgc2hvcnRlciA9IGVsZW1lbnQuY2xhc3NOYW1lXG4gICAgICB9XG4gICAgICBzaG9ydGVyLnNwbGl0KCcgJykuZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgICAgICBpZiAobG9uZ2VyLmluZGV4T2YobmFtZSkgPiAtMSkge1xuICAgICAgICAgIGNsYXNzTmFtZXMucHVzaChuYW1lKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgY29tbW9uQ2xhc3NOYW1lID0gY2xhc3NOYW1lcy5qb2luKCcgJylcbiAgICB9XG4gICAgLy8gVE9ETzpcbiAgICAvLyAtIGNoZWNrIGF0dHJpYnV0ZXNcbiAgICAvLyBpZiAoZWxlbWVudC5hdHRyaWJ1dGVzICE9PSBjb21tb25BdHRyaWJ1dGUpIHtcbiAgICAvL1xuICAgIC8vIH1cbiAgICBpZiAoZWxlbWVudC50YWdOYW1lICE9PSBjb21tb25UYWdOYW1lKSB7XG4gICAgICBjb21tb25UYWdOYW1lID0gbnVsbFxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHNlbGVjdG9yID0gZ2V0U2luZ2xlU2VsZWN0b3IoY29tbW9uUGFyZW50Tm9kZSwgb3B0aW9ucylcbiAgY29uc29sZS5sb2coc2VsZWN0b3IsIGNvbW1vbkNsYXNzTmFtZSwgY29tbW9uQXR0cmlidXRlLCBjb21tb25UYWdOYW1lKVxuXG4gIGlmIChjb21tb25DbGFzc05hbWUpIHtcbiAgICByZXR1cm4gYCR7c2VsZWN0b3J9ID4gLiR7Y29tbW9uQ2xhc3NOYW1lLnJlcGxhY2UoLyAvZywgJy4nKX1gXG4gIH1cbiAgLy8gaWYgKGNvbW1vbkF0dHJpYnV0ZSkge1xuICAvL1xuICAvLyB9XG4gIGlmIChjb21tb25UYWdOYW1lKSB7XG4gICAgcmV0dXJuIGAke3NlbGVjdG9yfSA+ICR7Y29tbW9uVGFnTmFtZS50b0xvd2VyQ2FzZSgpfWBcbiAgfVxuICByZXR1cm4gYCR7c2VsZWN0b3J9ID4gKmBcbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
