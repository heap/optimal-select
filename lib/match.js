'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = match;
/**
 * # Match
 *
 * Retrieves selector
 */

var defaultIgnore = {
  attribute: function attribute(attributeName) {
    return ['style', 'data-reactid', 'data-react-checksum'].indexOf(attributeName) > -1;
  }
};

/**
 * Get the path of the element
 * @param  {HTMLElement} node    - [description]
 * @param  {Object}      options - [description]
 * @return {String}              - [description]
 */
function match(node, options) {
  var path = [];
  var element = node;
  var length = path.length;

  var _options$root = options.root;
  var root = _options$root === undefined ? document : _options$root;
  var _options$skip = options.skip;
  var skip = _options$skip === undefined ? null : _options$skip;
  var _options$ignore = options.ignore;
  var ignore = _options$ignore === undefined ? {} : _options$ignore;


  var skipCompare = skip && (Array.isArray(skip) ? skip : [skip]).map(function (entry) {
    if (typeof entry !== 'function') {
      return function (element) {
        return element === entry;
      };
    }
    return entry;
  });

  var skipChecks = function skipChecks(element) {
    return skip && skipCompare.some(function (compare) {
      return compare(element);
    });
  };

  var ignoreClass = false;

  Object.keys(ignore).forEach(function (type) {
    if (type === 'class') {
      ignoreClass = true;
    }
    var predicate = ignore[type];
    if (typeof predicate === 'boolean') return;
    if (typeof predicate === 'function') return;
    if (typeof predicate === 'number') {
      predicate = predicate.toString();
    }
    if (typeof predicate === 'string') {
      predicate = new RegExp(predicate);
    }
    // check class-/attributename for regex
    ignore[type] = predicate.test.bind(predicate);
  });

  if (ignoreClass) {
    (function () {
      var ignoreAttribute = ignore.attribute;
      ignore.attribute = function (name, value, defaultPredicate) {
        return ignore.class(value) || ignoreAttribute && ignoreAttribute(name, value, defaultPredicate);
      };
    })();
  }

  while (element !== root) {

    if (skipChecks(element) !== true) {
      // global
      if (checkId(element, path, ignore)) break;
      if (checkAttributeGlobal(element, path, ignore, root)) break;
      if (checkClassGlobal(element, path, ignore, root)) break;
      if (checkTagGlobal(element, path, ignore, root)) break;

      // local
      checkAttributeLocal(element, path, ignore);

      // define only one selector each iteration
      if (path.length === length) {
        checkClassLocal(element, path, ignore);
      }
      if (path.length === length) {
        checkTagLocal(element, path, ignore);
      }

      if (ignore.childSelector !== true) {
        if (path.length === length) {
          checkClassChild(element, path, ignore);
        }
        if (path.length === length) {
          checkAttributeChild(element, path, ignore);
        }
        if (path.length === length) {
          checkTagChild(element, path, ignore);
        }
      }
    }

    element = element.parentNode;
    length = path.length;
  }

  if (element === root) {
    path.unshift('*');
  }

  return path.join(' ');
}

/**
 * [checkClassGlobal description]
 * @param  {HTMLElement} element - [description]
 * @param  {Array}       path    - [description]
 * @param  {Object}      ignore  - [description]
 * @return {Boolean}             - [description]
 */
function checkClassGlobal(element, path, ignore, root) {
  return checkClass(element, path, ignore, root);
}

/**
 * [checkClassLocal description]
 * @param  {HTMLElement} element - [description]
 * @param  {Array}       path    - [description]
 * @param  {Object}      ignore  - [description]
 * @return {Boolean}             - [description]
 */
function checkClassLocal(element, path, ignore) {
  return checkClass(element, path, ignore, element.parentNode);
}

/**
 * [checkClassChild description]
 * @param  {HTMLElement} element - [description]
 * @param  {Array}       path    - [description]
 * @param  {Object}      ignore  - [description]
 * @return {Boolean}             - [description]
 */
function checkClassChild(element, path, ignore) {
  var className = element.getAttribute('class');
  if (checkIgnore(ignore.class, className)) {
    return false;
  }
  return checkChild(element, path, '.' + className.trim().replace(/\s+/g, '.'));
}

/**
 * [checkAttributeGlobal description]
 * @param  {HTMLElement} element - [description]
 * @param  {Array}       path    - [description]
 * @param  {Object}      ignore  - [description]
 * @return {Boolean}             - [description]
 */
function checkAttributeGlobal(element, path, ignore, root) {
  return checkAttribute(element, path, ignore, root);
}

/**
 * [checkAttributeLocal description]
 * @param  {HTMLElement} element - [description]
 * @param  {Array}       path    - [description]
 * @param  {Object}      ignore  - [description]
 * @return {Boolean}             - [description]
 */
function checkAttributeLocal(element, path, ignore) {
  return checkAttribute(element, path, ignore, element.parentNode);
}

/**
 * [checkAttributeChild description]
 * @param  {HTMLElement} element - [description]
 * @param  {Array}       path    - [description]
 * @param  {Object}      ignore  - [description]
 * @return {Boolean}             - [description]
 */
function checkAttributeChild(element, path, ignore) {
  var attributes = element.attributes;
  return Object.keys(attributes).some(function (key) {
    var attribute = attributes[key];
    var attributeName = attribute.name;
    var attributeValue = attribute.value;
    if (checkIgnore(ignore.attribute, attributeName, attributeValue, defaultIgnore.attribute)) {
      return false;
    }
    var pattern = '[' + attributeName + '="' + attributeValue + '"]';
    return checkChild(element, path, pattern);
  });
}

/**
 * [checkTagGlobal description]
 * @param  {HTMLElement} element - [description]
 * @param  {Array}       path    - [description]
 * @param  {Object}      ignore  - [description]
 * @return {Boolean}             - [description]
 */
function checkTagGlobal(element, path, ignore, root) {
  return checkTag(element, path, ignore, root);
}

/**
 * [checkTagLocal description]
 * @param  {HTMLElement} element - [description]
 * @param  {Array}       path    - [description]
 * @param  {Object}      ignore  - [description]
 * @return {Boolean}             - [description]
 */
function checkTagLocal(element, path, ignore) {
  return checkTag(element, path, ignore, element.parentNode);
}

/**
 * [checkTabChildren description]
 * @param  {HTMLElement} element - [description]
 * @param  {Array}       path    - [description]
 * @param  {Object}      ignore  - [description]
 * @return {Boolean}             - [description]
 */
function checkTagChild(element, path, ignore) {
  var tagName = element.tagName.toLowerCase();
  if (checkIgnore(ignore.tag, tagName)) {
    return false;
  }
  return checkChild(element, path, tagName);
}

/**
 * [checkId description]
 * @param  {HTMLElement} element - [description]
 * @param  {Array}       path    - [description]
 * @param  {Object}      ignore  - [description]
 * @return {Boolean}             - [description]
 */
function checkId(element, path, ignore) {
  var id = element.getAttribute('id');
  if (checkIgnore(ignore.id, id)) {
    return false;
  }
  path.unshift('#' + id);
  return true;
}

/**
 * [checkClass description]
 * @param  {HTMLElement} element - [description]
 * @param  {Array}       path    - [description]
 * @param  {Object}      ignore  - [description]
 * @param  {HTMLElement} parent  - [description]
 * @return {Boolean}             - [description]
 */
function checkClass(element, path, ignore, parent) {
  var className = element.getAttribute('class');
  if (checkIgnore(ignore.class, className)) {
    return false;
  }
  var matches = parent.getElementsByClassName(className);
  if (matches.length === 1) {
    path.unshift('.' + className.trim().replace(/\s+/g, '.'));
    return true;
  }
  return false;
}

/**
 * [checkAttribute description]
 * @param  {HTMLElement} element - [description]
 * @param  {Array}       path    - [description]
 * @param  {Object}      ignore  - [description]
 * @param  {HTMLElement} parent  - [description]
 * @return {Boolean}             - [description]
 */
function checkAttribute(element, path, ignore, parent) {
  var attributes = element.attributes;
  return Object.keys(attributes).some(function (key) {
    var attribute = attributes[key];
    var attributeName = attribute.name;
    var attributeValue = attribute.value;
    if (checkIgnore(ignore.attribute, attributeName, attributeValue, defaultIgnore.attribute)) {
      return false;
    }
    var pattern = '[' + attributeName + '="' + attributeValue + '"]';
    var matches = parent.querySelectorAll(pattern);
    if (matches.length === 1) {
      path.unshift(pattern);
      return true;
    }
  });
}

/**
 * [checkTag description]
 * @param  {HTMLElement} element - [description]
 * @param  {Array}       path    - [description]
 * @param  {HTMLElement} parent  - [description]
 * @param  {Object}      ignore  - [description]
 * @return {Boolean}             - [description]
 */
function checkTag(element, path, ignore, parent) {
  var tagName = element.tagName.toLowerCase();
  if (checkIgnore(ignore.tag, tagName)) {
    return false;
  }
  var matches = parent.getElementsByTagName(tagName);
  if (matches.length === 1) {
    path.unshift(tagName);
    return true;
  }
  return false;
}

/**
 * [checkChild description]
 * Note: childTags is a custom property to use a view filter for tags on for virutal elements
 * @param  {HTMLElement} element  - [description]
 * @param  {Array}       path     - [description]
 * @param  {String}      selector - [description]
 * @return {Boolean}              - [description]
 */
function checkChild(element, path, selector) {
  var parent = element.parentNode;
  var children = parent.childTags || parent.children;
  for (var i = 0, l = children.length; i < l; i++) {
    if (children[i] === element) {
      path.unshift('> ' + selector + ':nth-child(' + (i + 1) + ')');
      return true;
    }
  }
  return false;
}

/**
 * [checkIgnore description]
 * @param  {Function} predicate        [description]
 * @param  {string}   name             [description]
 * @param  {string}   value            [description]
 * @param  {Function} defaultPredicate [description]
 * @return {boolean}                   [description]
 */
function checkIgnore(predicate, name, value, defaultPredicate) {
  if (!name) {
    return true;
  }
  var check = predicate || defaultPredicate;
  if (!check) {
    return false;
  }
  return check(name, value || name, defaultPredicate);
}
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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QUFPLEtBQVA7QUFDRDs7QUFFRDs7Ozs7Ozs7QUFRQSxTQUFTLFdBQVQsQ0FBc0IsU0FBdEIsRUFBaUMsSUFBakMsRUFBdUMsS0FBdkMsRUFBOEMsZ0JBQTlDLEVBQWdFO0FBQzlELE1BQUksQ0FBQyxJQUFMLEVBQVc7QUFDVCxXQUFPLElBQVA7QUFDRDtBQUNELE1BQU0sUUFBUSxhQUFhLGdCQUEzQjtBQUNBLE1BQUksQ0FBQyxLQUFMLEVBQVk7QUFDVixXQUFPLEtBQVA7QUFDRDtBQUNELFNBQU8sTUFBTSxJQUFOLEVBQVksU0FBUyxJQUFyQixFQUEyQixnQkFBM0IsQ0FBUDtBQUNEIiwiZmlsZSI6Im1hdGNoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiAjIE1hdGNoXG4gKlxuICogUmV0cmlldmVzIHNlbGVjdG9yXG4gKi9cblxuY29uc3QgZGVmYXVsdElnbm9yZSA9IHtcbiAgYXR0cmlidXRlIChhdHRyaWJ1dGVOYW1lKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICdzdHlsZScsXG4gICAgICAnZGF0YS1yZWFjdGlkJyxcbiAgICAgICdkYXRhLXJlYWN0LWNoZWNrc3VtJ1xuICAgIF0uaW5kZXhPZihhdHRyaWJ1dGVOYW1lKSA+IC0xXG4gIH1cbn1cblxuLyoqXG4gKiBHZXQgdGhlIHBhdGggb2YgdGhlIGVsZW1lbnRcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBub2RlICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIG9wdGlvbnMgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtTdHJpbmd9ICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbWF0Y2ggKG5vZGUsIG9wdGlvbnMpIHtcbiAgY29uc3QgcGF0aCA9IFtdXG4gIHZhciBlbGVtZW50ID0gbm9kZVxuICB2YXIgbGVuZ3RoID0gcGF0aC5sZW5ndGhcblxuICBjb25zdCB7XG4gICAgcm9vdCA9IGRvY3VtZW50LFxuICAgIHNraXAgPSBudWxsLFxuICAgIGlnbm9yZSA9IHt9XG4gIH0gPSBvcHRpb25zXG5cbiAgY29uc3Qgc2tpcENvbXBhcmUgPSBza2lwICYmIChBcnJheS5pc0FycmF5KHNraXApID8gc2tpcCA6IFtza2lwXSkubWFwKChlbnRyeSkgPT4ge1xuICAgIGlmICh0eXBlb2YgZW50cnkgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiAoZWxlbWVudCkgPT4gZWxlbWVudCA9PT0gZW50cnlcbiAgICB9XG4gICAgcmV0dXJuIGVudHJ5XG4gIH0pXG5cbiAgY29uc3Qgc2tpcENoZWNrcyA9IChlbGVtZW50KSA9PiB7XG4gICAgcmV0dXJuIHNraXAgJiYgc2tpcENvbXBhcmUuc29tZSgoY29tcGFyZSkgPT4gY29tcGFyZShlbGVtZW50KSlcbiAgfVxuXG4gIHZhciBpZ25vcmVDbGFzcyA9IGZhbHNlXG5cbiAgT2JqZWN0LmtleXMoaWdub3JlKS5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgaWYgKHR5cGUgPT09ICdjbGFzcycpIHtcbiAgICAgIGlnbm9yZUNsYXNzID0gdHJ1ZVxuICAgIH1cbiAgICB2YXIgcHJlZGljYXRlID0gaWdub3JlW3R5cGVdXG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdib29sZWFuJykgcmV0dXJuXG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdmdW5jdGlvbicpIHJldHVyblxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnbnVtYmVyJykge1xuICAgICAgcHJlZGljYXRlID0gcHJlZGljYXRlLnRvU3RyaW5nKClcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBwcmVkaWNhdGUgPSBuZXcgUmVnRXhwKHByZWRpY2F0ZSlcbiAgICB9XG4gICAgLy8gY2hlY2sgY2xhc3MtL2F0dHJpYnV0ZW5hbWUgZm9yIHJlZ2V4XG4gICAgaWdub3JlW3R5cGVdID0gcHJlZGljYXRlLnRlc3QuYmluZChwcmVkaWNhdGUpXG4gIH0pXG5cbiAgaWYgKGlnbm9yZUNsYXNzKSB7XG4gICAgY29uc3QgaWdub3JlQXR0cmlidXRlID0gaWdub3JlLmF0dHJpYnV0ZVxuICAgIGlnbm9yZS5hdHRyaWJ1dGUgPSAobmFtZSwgdmFsdWUsIGRlZmF1bHRQcmVkaWNhdGUpID0+IHtcbiAgICAgIHJldHVybiBpZ25vcmUuY2xhc3ModmFsdWUpIHx8IGlnbm9yZUF0dHJpYnV0ZSAmJiBpZ25vcmVBdHRyaWJ1dGUobmFtZSwgdmFsdWUsIGRlZmF1bHRQcmVkaWNhdGUpXG4gICAgfVxuICB9XG5cbiAgd2hpbGUgKGVsZW1lbnQgIT09IHJvb3QpIHtcblxuICAgIGlmIChza2lwQ2hlY2tzKGVsZW1lbnQpICE9PSB0cnVlKSB7XG4gICAgICAvLyBnbG9iYWxcbiAgICAgIGlmIChjaGVja0lkKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSkpIGJyZWFrXG4gICAgICBpZiAoY2hlY2tBdHRyaWJ1dGVHbG9iYWwoZWxlbWVudCwgcGF0aCwgaWdub3JlLCByb290KSkgYnJlYWtcbiAgICAgIGlmIChjaGVja0NsYXNzR2xvYmFsKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgcm9vdCkpIGJyZWFrXG4gICAgICBpZiAoY2hlY2tUYWdHbG9iYWwoZWxlbWVudCwgcGF0aCwgaWdub3JlLCByb290KSkgYnJlYWtcblxuICAgICAgLy8gbG9jYWxcbiAgICAgIGNoZWNrQXR0cmlidXRlTG9jYWwoZWxlbWVudCwgcGF0aCwgaWdub3JlKVxuXG4gICAgICAvLyBkZWZpbmUgb25seSBvbmUgc2VsZWN0b3IgZWFjaCBpdGVyYXRpb25cbiAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgIGNoZWNrQ2xhc3NMb2NhbChlbGVtZW50LCBwYXRoLCBpZ25vcmUpXG4gICAgICB9XG4gICAgICBpZiAocGF0aC5sZW5ndGggPT09IGxlbmd0aCkge1xuICAgICAgICBjaGVja1RhZ0xvY2FsKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSlcbiAgICAgIH1cblxuICAgICAgaWYgKGlnbm9yZS5jaGlsZFNlbGVjdG9yICE9PSB0cnVlKSB7XG4gICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgY2hlY2tDbGFzc0NoaWxkKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSlcbiAgICAgICAgfVxuICAgICAgICBpZiAocGF0aC5sZW5ndGggPT09IGxlbmd0aCkge1xuICAgICAgICAgIGNoZWNrQXR0cmlidXRlQ2hpbGQoZWxlbWVudCwgcGF0aCwgaWdub3JlKVxuICAgICAgICB9XG4gICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgY2hlY2tUYWdDaGlsZChlbGVtZW50LCBwYXRoLCBpZ25vcmUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlXG4gICAgbGVuZ3RoID0gcGF0aC5sZW5ndGhcbiAgfVxuXG4gIGlmIChlbGVtZW50ID09PSByb290KSB7XG4gICAgcGF0aC51bnNoaWZ0KCcqJylcbiAgfVxuXG4gIHJldHVybiBwYXRoLmpvaW4oJyAnKVxufVxuXG5cbi8qKlxuICogW2NoZWNrQ2xhc3NHbG9iYWwgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDbGFzc0dsb2JhbCAoZWxlbWVudCwgcGF0aCwgaWdub3JlLCByb290KSB7XG4gIHJldHVybiBjaGVja0NsYXNzKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgcm9vdClcbn1cblxuLyoqXG4gKiBbY2hlY2tDbGFzc0xvY2FsIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQ2xhc3NMb2NhbCAoZWxlbWVudCwgcGF0aCwgaWdub3JlKSB7XG4gIHJldHVybiBjaGVja0NsYXNzKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgZWxlbWVudC5wYXJlbnROb2RlKVxufVxuXG4vKipcbiAqIFtjaGVja0NsYXNzQ2hpbGQgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDbGFzc0NoaWxkIChlbGVtZW50LCBwYXRoLCBpZ25vcmUpIHtcbiAgY29uc3QgY2xhc3NOYW1lID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJylcbiAgaWYgKGNoZWNrSWdub3JlKGlnbm9yZS5jbGFzcywgY2xhc3NOYW1lKSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiBjaGVja0NoaWxkKGVsZW1lbnQsIHBhdGgsIGAuJHtjbGFzc05hbWUudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJy4nKX1gKVxufVxuXG4vKipcbiAqIFtjaGVja0F0dHJpYnV0ZUdsb2JhbCBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0F0dHJpYnV0ZUdsb2JhbCAoZWxlbWVudCwgcGF0aCwgaWdub3JlLCByb290KSB7XG4gIHJldHVybiBjaGVja0F0dHJpYnV0ZShlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHJvb3QpXG59XG5cbi8qKlxuICogW2NoZWNrQXR0cmlidXRlTG9jYWwgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tBdHRyaWJ1dGVMb2NhbCAoZWxlbWVudCwgcGF0aCwgaWdub3JlKSB7XG4gIHJldHVybiBjaGVja0F0dHJpYnV0ZShlbGVtZW50LCBwYXRoLCBpZ25vcmUsIGVsZW1lbnQucGFyZW50Tm9kZSlcbn1cblxuLyoqXG4gKiBbY2hlY2tBdHRyaWJ1dGVDaGlsZCBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0F0dHJpYnV0ZUNoaWxkIChlbGVtZW50LCBwYXRoLCBpZ25vcmUpIHtcbiAgY29uc3QgYXR0cmlidXRlcyA9IGVsZW1lbnQuYXR0cmlidXRlc1xuICByZXR1cm4gT2JqZWN0LmtleXMoYXR0cmlidXRlcykuc29tZSgoa2V5KSA9PiB7XG4gICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1trZXldXG4gICAgY29uc3QgYXR0cmlidXRlTmFtZSA9IGF0dHJpYnV0ZS5uYW1lXG4gICAgY29uc3QgYXR0cmlidXRlVmFsdWUgPSBhdHRyaWJ1dGUudmFsdWVcbiAgICBpZiAoY2hlY2tJZ25vcmUoaWdub3JlLmF0dHJpYnV0ZSwgYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWUsIGRlZmF1bHRJZ25vcmUuYXR0cmlidXRlKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGNvbnN0IHBhdHRlcm4gPSBgWyR7YXR0cmlidXRlTmFtZX09XCIke2F0dHJpYnV0ZVZhbHVlfVwiXWBcbiAgICByZXR1cm4gY2hlY2tDaGlsZChlbGVtZW50LCBwYXRoLCBwYXR0ZXJuKVxuICB9KVxufVxuXG4vKipcbiAqIFtjaGVja1RhZ0dsb2JhbCBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja1RhZ0dsb2JhbCAoZWxlbWVudCwgcGF0aCwgaWdub3JlLCByb290KSB7XG4gIHJldHVybiBjaGVja1RhZyhlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHJvb3QpXG59XG5cbi8qKlxuICogW2NoZWNrVGFnTG9jYWwgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tUYWdMb2NhbCAoZWxlbWVudCwgcGF0aCwgaWdub3JlKSB7XG4gIHJldHVybiBjaGVja1RhZyhlbGVtZW50LCBwYXRoLCBpZ25vcmUsIGVsZW1lbnQucGFyZW50Tm9kZSlcbn1cblxuLyoqXG4gKiBbY2hlY2tUYWJDaGlsZHJlbiBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja1RhZ0NoaWxkIChlbGVtZW50LCBwYXRoLCBpZ25vcmUpIHtcbiAgY29uc3QgdGFnTmFtZSA9IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpXG4gIGlmIChjaGVja0lnbm9yZShpZ25vcmUudGFnLCB0YWdOYW1lKSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiBjaGVja0NoaWxkKGVsZW1lbnQsIHBhdGgsIHRhZ05hbWUpXG59XG5cbi8qKlxuICogW2NoZWNrSWQgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tJZCAoZWxlbWVudCwgcGF0aCwgaWdub3JlKSB7XG4gIGNvbnN0IGlkID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2lkJylcbiAgaWYgKGNoZWNrSWdub3JlKGlnbm9yZS5pZCwgaWQpKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcGF0aC51bnNoaWZ0KGAjJHtpZH1gKVxuICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIFtjaGVja0NsYXNzIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IHBhcmVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDbGFzcyAoZWxlbWVudCwgcGF0aCwgaWdub3JlLCBwYXJlbnQpIHtcbiAgY29uc3QgY2xhc3NOYW1lID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJylcbiAgaWYgKGNoZWNrSWdub3JlKGlnbm9yZS5jbGFzcywgY2xhc3NOYW1lKSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIGNvbnN0IG1hdGNoZXMgPSBwYXJlbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShjbGFzc05hbWUpXG4gIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgIHBhdGgudW5zaGlmdChgLiR7Y2xhc3NOYW1lLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcuJyl9YClcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIFtjaGVja0F0dHJpYnV0ZSBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBwYXJlbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQXR0cmlidXRlIChlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHBhcmVudCkge1xuICBjb25zdCBhdHRyaWJ1dGVzID0gZWxlbWVudC5hdHRyaWJ1dGVzXG4gIHJldHVybiBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5zb21lKChrZXkpID0+IHtcbiAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2tleV1cbiAgICBjb25zdCBhdHRyaWJ1dGVOYW1lID0gYXR0cmlidXRlLm5hbWVcbiAgICBjb25zdCBhdHRyaWJ1dGVWYWx1ZSA9IGF0dHJpYnV0ZS52YWx1ZVxuICAgIGlmIChjaGVja0lnbm9yZShpZ25vcmUuYXR0cmlidXRlLCBhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVWYWx1ZSwgZGVmYXVsdElnbm9yZS5hdHRyaWJ1dGUpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgY29uc3QgcGF0dGVybiA9IGBbJHthdHRyaWJ1dGVOYW1lfT1cIiR7YXR0cmlidXRlVmFsdWV9XCJdYFxuICAgIGNvbnN0IG1hdGNoZXMgPSBwYXJlbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfSlcbn1cblxuLyoqXG4gKiBbY2hlY2tUYWcgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IHBhcmVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja1RhZyAoZWxlbWVudCwgcGF0aCwgaWdub3JlLCBwYXJlbnQpIHtcbiAgY29uc3QgdGFnTmFtZSA9IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpXG4gIGlmIChjaGVja0lnbm9yZShpZ25vcmUudGFnLCB0YWdOYW1lKSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIGNvbnN0IG1hdGNoZXMgPSBwYXJlbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnTmFtZSlcbiAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgcGF0aC51bnNoaWZ0KHRhZ05hbWUpXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBbY2hlY2tDaGlsZCBkZXNjcmlwdGlvbl1cbiAqIE5vdGU6IGNoaWxkVGFncyBpcyBhIGN1c3RvbSBwcm9wZXJ0eSB0byB1c2UgYSB2aWV3IGZpbHRlciBmb3IgdGFncyBvbiBmb3IgdmlydXRhbCBlbGVtZW50c1xuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7U3RyaW5nfSAgICAgIHNlbGVjdG9yIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0NoaWxkIChlbGVtZW50LCBwYXRoLCBzZWxlY3Rvcikge1xuICBjb25zdCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGVcbiAgY29uc3QgY2hpbGRyZW4gPSBwYXJlbnQuY2hpbGRUYWdzIHx8IHBhcmVudC5jaGlsZHJlblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlmIChjaGlsZHJlbltpXSA9PT0gZWxlbWVudCkge1xuICAgICAgcGF0aC51bnNoaWZ0KGA+ICR7c2VsZWN0b3J9Om50aC1jaGlsZCgke2krMX0pYClcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIFtjaGVja0lnbm9yZSBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBwcmVkaWNhdGUgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge3N0cmluZ30gICBuYW1lICAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge3N0cmluZ30gICB2YWx1ZSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBkZWZhdWx0UHJlZGljYXRlIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tJZ25vcmUgKHByZWRpY2F0ZSwgbmFtZSwgdmFsdWUsIGRlZmF1bHRQcmVkaWNhdGUpIHtcbiAgaWYgKCFuYW1lKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBjb25zdCBjaGVjayA9IHByZWRpY2F0ZSB8fCBkZWZhdWx0UHJlZGljYXRlXG4gIGlmICghY2hlY2spIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gY2hlY2sobmFtZSwgdmFsdWUgfHwgbmFtZSwgZGVmYXVsdFByZWRpY2F0ZSlcbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
