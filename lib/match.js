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
 *
 * Score attributes by their "robustness", so that auto-generated selectors prioritize less finicky attributes. Attributes with lower
 * scores are prioritized above attributes wit higher scores.
 */
function scoreAttribute(attribute) {
  if (attribute.indexOf('data-') === 0) return -1;
  if (attribute === 'aria-label') return -1;
  if (attribute === 'href') return 1;
  if (attribute === 'src') return 2;
  if (attribute === 'alt' || attribute === 'title') return 3;
  return 0;
}

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

  var _options$root = options.root,
      root = _options$root === undefined ? document : _options$root,
      _options$skip = options.skip,
      skip = _options$skip === undefined ? null : _options$skip,
      _options$ignore = options.ignore,
      ignore = _options$ignore === undefined ? {} : _options$ignore;


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
    var ignoreAttribute = ignore.attribute;
    ignore.attribute = function (name, value, defaultPredicate) {
      return ignore.class(value) || ignoreAttribute && ignoreAttribute(name, value, defaultPredicate);
    };
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

    if (element === node && path.length === 0) {
      var elementSelector = element.tagName.toLowerCase();
      var className = element.getAttribute('class');
      if (className) {
        elementSelector += '.' + className.trim().replace(/\s+/g, '.');
      }
      path.unshift(elementSelector);
    }

    element = element.parentNode;
    length = path.length;
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
  return Object.keys(attributes).sort(function (key1, key2) {
    var attributeName1 = attributes[key1].name;
    var attributeName2 = attributes[key2].name;
    return scoreAttribute(attributeName1) - scoreAttribute(attributeName2);
  }).some(function (key) {
    var attribute = attributes[key];
    var attributeName = attribute.name;
    // FIXME: Downstream hierarchy parsing is broken. For now, just omit double-quotes.
    var attributeValue = attribute.value.replace(/"/g, '');
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
  return Object.keys(attributes).sort(function (key1, key2) {
    var attributeName1 = attributes[key1].name;
    var attributeName2 = attributes[key2].name;
    return scoreAttribute(attributeName1) - scoreAttribute(attributeName2);
  }).some(function (key) {
    var attribute = attributes[key];
    var attributeName = attribute.name;
    // FIXME: Downstream hierarchy parsing is broken. For now, just omit double-quotes.
    var attributeValue = attribute.value.replace(/"/g, '');
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hdGNoLmpzIl0sIm5hbWVzIjpbIm1hdGNoIiwiZGVmYXVsdElnbm9yZSIsImF0dHJpYnV0ZSIsImF0dHJpYnV0ZU5hbWUiLCJpbmRleE9mIiwic2NvcmVBdHRyaWJ1dGUiLCJub2RlIiwib3B0aW9ucyIsInBhdGgiLCJlbGVtZW50IiwibGVuZ3RoIiwicm9vdCIsImRvY3VtZW50Iiwic2tpcCIsImlnbm9yZSIsInNraXBDb21wYXJlIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwiZW50cnkiLCJza2lwQ2hlY2tzIiwic29tZSIsImNvbXBhcmUiLCJpZ25vcmVDbGFzcyIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwidHlwZSIsInByZWRpY2F0ZSIsInRvU3RyaW5nIiwiUmVnRXhwIiwidGVzdCIsImJpbmQiLCJpZ25vcmVBdHRyaWJ1dGUiLCJuYW1lIiwidmFsdWUiLCJkZWZhdWx0UHJlZGljYXRlIiwiY2xhc3MiLCJjaGVja0lkIiwiY2hlY2tBdHRyaWJ1dGVHbG9iYWwiLCJjaGVja0NsYXNzR2xvYmFsIiwiY2hlY2tUYWdHbG9iYWwiLCJjaGVja0F0dHJpYnV0ZUxvY2FsIiwiY2hlY2tDbGFzc0xvY2FsIiwiY2hlY2tUYWdMb2NhbCIsImNoaWxkU2VsZWN0b3IiLCJjaGVja0NsYXNzQ2hpbGQiLCJjaGVja0F0dHJpYnV0ZUNoaWxkIiwiY2hlY2tUYWdDaGlsZCIsImVsZW1lbnRTZWxlY3RvciIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsImNsYXNzTmFtZSIsImdldEF0dHJpYnV0ZSIsInRyaW0iLCJyZXBsYWNlIiwidW5zaGlmdCIsInBhcmVudE5vZGUiLCJqb2luIiwiY2hlY2tDbGFzcyIsImNoZWNrSWdub3JlIiwiY2hlY2tDaGlsZCIsImNoZWNrQXR0cmlidXRlIiwiYXR0cmlidXRlcyIsInNvcnQiLCJrZXkxIiwia2V5MiIsImF0dHJpYnV0ZU5hbWUxIiwiYXR0cmlidXRlTmFtZTIiLCJrZXkiLCJhdHRyaWJ1dGVWYWx1ZSIsInBhdHRlcm4iLCJjaGVja1RhZyIsInRhZyIsImlkIiwicGFyZW50IiwibWF0Y2hlcyIsImdldEVsZW1lbnRzQnlDbGFzc05hbWUiLCJxdWVyeVNlbGVjdG9yQWxsIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJzZWxlY3RvciIsImNoaWxkcmVuIiwiY2hpbGRUYWdzIiwiaSIsImwiLCJjaGVjayJdLCJtYXBwaW5ncyI6Ijs7Ozs7a0JBb0N3QkEsSztBQXBDeEI7Ozs7OztBQU1BLElBQU1DLGdCQUFnQjtBQUNwQkMsV0FEb0IscUJBQ1RDLGFBRFMsRUFDTTtBQUN4QixXQUFPLENBQ0wsT0FESyxFQUVMLGNBRkssRUFHTCxxQkFISyxFQUlMQyxPQUpLLENBSUdELGFBSkgsSUFJb0IsQ0FBQyxDQUo1QjtBQUtEO0FBUG1CLENBQXRCOztBQVVBOzs7OztBQUtBLFNBQVNFLGNBQVQsQ0FBeUJILFNBQXpCLEVBQW9DO0FBQ2xDLE1BQUlBLFVBQVVFLE9BQVYsQ0FBa0IsT0FBbEIsTUFBK0IsQ0FBbkMsRUFBc0MsT0FBTyxDQUFDLENBQVI7QUFDdEMsTUFBSUYsY0FBYyxZQUFsQixFQUFnQyxPQUFPLENBQUMsQ0FBUjtBQUNoQyxNQUFJQSxjQUFjLE1BQWxCLEVBQTBCLE9BQU8sQ0FBUDtBQUMxQixNQUFJQSxjQUFjLEtBQWxCLEVBQXlCLE9BQU8sQ0FBUDtBQUN6QixNQUFJQSxjQUFjLEtBQWQsSUFBdUJBLGNBQWMsT0FBekMsRUFBa0QsT0FBTyxDQUFQO0FBQ2xELFNBQU8sQ0FBUDtBQUNEOztBQUVEOzs7Ozs7QUFNZSxTQUFTRixLQUFULENBQWdCTSxJQUFoQixFQUFzQkMsT0FBdEIsRUFBK0I7QUFDNUMsTUFBTUMsT0FBTyxFQUFiO0FBQ0EsTUFBSUMsVUFBVUgsSUFBZDtBQUNBLE1BQUlJLFNBQVNGLEtBQUtFLE1BQWxCOztBQUg0QyxzQkFTeENILE9BVHdDLENBTTFDSSxJQU4wQztBQUFBLE1BTTFDQSxJQU4wQyxpQ0FNbkNDLFFBTm1DO0FBQUEsc0JBU3hDTCxPQVR3QyxDQU8xQ00sSUFQMEM7QUFBQSxNQU8xQ0Es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QUE5QyxFQUFnRTtBQUM5RCxNQUFJLENBQUNGLElBQUwsRUFBVztBQUNULFdBQU8sSUFBUDtBQUNEO0FBQ0QsTUFBTW1ELFFBQVF6RCxhQUFhUSxnQkFBM0I7QUFDQSxNQUFJLENBQUNpRCxLQUFMLEVBQVk7QUFDVixXQUFPLEtBQVA7QUFDRDtBQUNELFNBQU9BLE1BQU1uRCxJQUFOLEVBQVlDLFNBQVNELElBQXJCLEVBQTJCRSxnQkFBM0IsQ0FBUDtBQUNEIiwiZmlsZSI6Im1hdGNoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiAjIE1hdGNoXG4gKlxuICogUmV0cmlldmVzIHNlbGVjdG9yXG4gKi9cblxuY29uc3QgZGVmYXVsdElnbm9yZSA9IHtcbiAgYXR0cmlidXRlIChhdHRyaWJ1dGVOYW1lKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICdzdHlsZScsXG4gICAgICAnZGF0YS1yZWFjdGlkJyxcbiAgICAgICdkYXRhLXJlYWN0LWNoZWNrc3VtJ1xuICAgIF0uaW5kZXhPZihhdHRyaWJ1dGVOYW1lKSA+IC0xXG4gIH1cbn1cblxuLyoqXG4gKlxuICogU2NvcmUgYXR0cmlidXRlcyBieSB0aGVpciBcInJvYnVzdG5lc3NcIiwgc28gdGhhdCBhdXRvLWdlbmVyYXRlZCBzZWxlY3RvcnMgcHJpb3JpdGl6ZSBsZXNzIGZpbmlja3kgYXR0cmlidXRlcy4gQXR0cmlidXRlcyB3aXRoIGxvd2VyXG4gKiBzY29yZXMgYXJlIHByaW9yaXRpemVkIGFib3ZlIGF0dHJpYnV0ZXMgd2l0IGhpZ2hlciBzY29yZXMuXG4gKi9cbmZ1bmN0aW9uIHNjb3JlQXR0cmlidXRlIChhdHRyaWJ1dGUpIHtcbiAgaWYgKGF0dHJpYnV0ZS5pbmRleE9mKCdkYXRhLScpID09PSAwKSByZXR1cm4gLTFcbiAgaWYgKGF0dHJpYnV0ZSA9PT0gJ2FyaWEtbGFiZWwnKSByZXR1cm4gLTFcbiAgaWYgKGF0dHJpYnV0ZSA9PT0gJ2hyZWYnKSByZXR1cm4gMVxuICBpZiAoYXR0cmlidXRlID09PSAnc3JjJykgcmV0dXJuIDJcbiAgaWYgKGF0dHJpYnV0ZSA9PT0gJ2FsdCcgfHwgYXR0cmlidXRlID09PSAndGl0bGUnKSByZXR1cm4gM1xuICByZXR1cm4gMFxufVxuXG4vKipcbiAqIEdldCB0aGUgcGF0aCBvZiB0aGUgZWxlbWVudFxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IG5vZGUgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgb3B0aW9ucyAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge1N0cmluZ30gICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBtYXRjaCAobm9kZSwgb3B0aW9ucykge1xuICBjb25zdCBwYXRoID0gW11cbiAgdmFyIGVsZW1lbnQgPSBub2RlXG4gIHZhciBsZW5ndGggPSBwYXRoLmxlbmd0aFxuXG4gIGNvbnN0IHtcbiAgICByb290ID0gZG9jdW1lbnQsXG4gICAgc2tpcCA9IG51bGwsXG4gICAgaWdub3JlID0ge31cbiAgfSA9IG9wdGlvbnNcblxuICBjb25zdCBza2lwQ29tcGFyZSA9IHNraXAgJiYgKEFycmF5LmlzQXJyYXkoc2tpcCkgPyBza2lwIDogW3NraXBdKS5tYXAoKGVudHJ5KSA9PiB7XG4gICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIChlbGVtZW50KSA9PiBlbGVtZW50ID09PSBlbnRyeVxuICAgIH1cbiAgICByZXR1cm4gZW50cnlcbiAgfSlcblxuICBjb25zdCBza2lwQ2hlY2tzID0gKGVsZW1lbnQpID0+IHtcbiAgICByZXR1cm4gc2tpcCAmJiBza2lwQ29tcGFyZS5zb21lKChjb21wYXJlKSA9PiBjb21wYXJlKGVsZW1lbnQpKVxuICB9XG5cbiAgdmFyIGlnbm9yZUNsYXNzID0gZmFsc2VcblxuICBPYmplY3Qua2V5cyhpZ25vcmUpLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICBpZiAodHlwZSA9PT0gJ2NsYXNzJykge1xuICAgICAgaWdub3JlQ2xhc3MgPSB0cnVlXG4gICAgfVxuICAgIHZhciBwcmVkaWNhdGUgPSBpZ25vcmVbdHlwZV1cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ2Jvb2xlYW4nKSByZXR1cm5cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuXG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdudW1iZXInKSB7XG4gICAgICBwcmVkaWNhdGUgPSBwcmVkaWNhdGUudG9TdHJpbmcoKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHByZWRpY2F0ZSA9IG5ldyBSZWdFeHAocHJlZGljYXRlKVxuICAgIH1cbiAgICAvLyBjaGVjayBjbGFzcy0vYXR0cmlidXRlbmFtZSBmb3IgcmVnZXhcbiAgICBpZ25vcmVbdHlwZV0gPSBwcmVkaWNhdGUudGVzdC5iaW5kKHByZWRpY2F0ZSlcbiAgfSlcblxuICBpZiAoaWdub3JlQ2xhc3MpIHtcbiAgICBjb25zdCBpZ25vcmVBdHRyaWJ1dGUgPSBpZ25vcmUuYXR0cmlidXRlXG4gICAgaWdub3JlLmF0dHJpYnV0ZSA9IChuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSkgPT4ge1xuICAgICAgcmV0dXJuIGlnbm9yZS5jbGFzcyh2YWx1ZSkgfHwgaWdub3JlQXR0cmlidXRlICYmIGlnbm9yZUF0dHJpYnV0ZShuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSlcbiAgICB9XG4gIH1cblxuICB3aGlsZSAoZWxlbWVudCAhPT0gcm9vdCkge1xuXG4gICAgaWYgKHNraXBDaGVja3MoZWxlbWVudCkgIT09IHRydWUpIHtcbiAgICAgIC8vIGdsb2JhbFxuICAgICAgaWYgKGNoZWNrSWQoZWxlbWVudCwgcGF0aCwgaWdub3JlKSkgYnJlYWtcbiAgICAgIGlmIChjaGVja0F0dHJpYnV0ZUdsb2JhbChlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHJvb3QpKSBicmVha1xuICAgICAgaWYgKGNoZWNrQ2xhc3NHbG9iYWwoZWxlbWVudCwgcGF0aCwgaWdub3JlLCByb290KSkgYnJlYWtcbiAgICAgIGlmIChjaGVja1RhZ0dsb2JhbChlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHJvb3QpKSBicmVha1xuXG4gICAgICAvLyBsb2NhbFxuICAgICAgY2hlY2tBdHRyaWJ1dGVMb2NhbChlbGVtZW50LCBwYXRoLCBpZ25vcmUpXG5cbiAgICAgIC8vIGRlZmluZSBvbmx5IG9uZSBzZWxlY3RvciBlYWNoIGl0ZXJhdGlvblxuICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgY2hlY2tDbGFzc0xvY2FsKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSlcbiAgICAgIH1cbiAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgIGNoZWNrVGFnTG9jYWwoZWxlbWVudCwgcGF0aCwgaWdub3JlKVxuICAgICAgfVxuXG4gICAgICBpZiAoaWdub3JlLmNoaWxkU2VsZWN0b3IgIT09IHRydWUpIHtcbiAgICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgICBjaGVja0NsYXNzQ2hpbGQoZWxlbWVudCwgcGF0aCwgaWdub3JlKVxuICAgICAgICB9XG4gICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgY2hlY2tBdHRyaWJ1dGVDaGlsZChlbGVtZW50LCBwYXRoLCBpZ25vcmUpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgICBjaGVja1RhZ0NoaWxkKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbGVtZW50ID09PSBub2RlICYmIHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgICB2YXIgZWxlbWVudFNlbGVjdG9yID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgIHZhciBjbGFzc05hbWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnY2xhc3MnKVxuICAgICAgaWYgKGNsYXNzTmFtZSkge1xuICAgICAgICBlbGVtZW50U2VsZWN0b3IgKz0gYC4ke2NsYXNzTmFtZS50cmltKCkucmVwbGFjZSgvXFxzKy9nLCAnLicpfWBcbiAgICAgIH1cbiAgICAgIHBhdGgudW5zaGlmdChlbGVtZW50U2VsZWN0b3IpXG4gICAgfVxuXG4gICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZVxuICAgIGxlbmd0aCA9IHBhdGgubGVuZ3RoXG4gIH1cblxuICByZXR1cm4gcGF0aC5qb2luKCcgJylcbn1cblxuXG4vKipcbiAqIFtjaGVja0NsYXNzR2xvYmFsIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQ2xhc3NHbG9iYWwgKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgcm9vdCkge1xuICByZXR1cm4gY2hlY2tDbGFzcyhlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHJvb3QpXG59XG5cbi8qKlxuICogW2NoZWNrQ2xhc3NMb2NhbCBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0NsYXNzTG9jYWwgKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSkge1xuICByZXR1cm4gY2hlY2tDbGFzcyhlbGVtZW50LCBwYXRoLCBpZ25vcmUsIGVsZW1lbnQucGFyZW50Tm9kZSlcbn1cblxuLyoqXG4gKiBbY2hlY2tDbGFzc0NoaWxkIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQ2xhc3NDaGlsZCAoZWxlbWVudCwgcGF0aCwgaWdub3JlKSB7XG4gIGNvbnN0IGNsYXNzTmFtZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpXG4gIGlmIChjaGVja0lnbm9yZShpZ25vcmUuY2xhc3MsIGNsYXNzTmFtZSkpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gY2hlY2tDaGlsZChlbGVtZW50LCBwYXRoLCBgLiR7Y2xhc3NOYW1lLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcuJyl9YClcbn1cblxuLyoqXG4gKiBbY2hlY2tBdHRyaWJ1dGVHbG9iYWwgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tBdHRyaWJ1dGVHbG9iYWwgKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgcm9vdCkge1xuICByZXR1cm4gY2hlY2tBdHRyaWJ1dGUoZWxlbWVudCwgcGF0aCwgaWdub3JlLCByb290KVxufVxuXG4vKipcbiAqIFtjaGVja0F0dHJpYnV0ZUxvY2FsIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQXR0cmlidXRlTG9jYWwgKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSkge1xuICByZXR1cm4gY2hlY2tBdHRyaWJ1dGUoZWxlbWVudCwgcGF0aCwgaWdub3JlLCBlbGVtZW50LnBhcmVudE5vZGUpXG59XG5cbi8qKlxuICogW2NoZWNrQXR0cmlidXRlQ2hpbGQgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tBdHRyaWJ1dGVDaGlsZCAoZWxlbWVudCwgcGF0aCwgaWdub3JlKSB7XG4gIGNvbnN0IGF0dHJpYnV0ZXMgPSBlbGVtZW50LmF0dHJpYnV0ZXNcbiAgcmV0dXJuIE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpXG4gICAgLnNvcnQoKGtleTEsIGtleTIpID0+IHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUxID0gYXR0cmlidXRlc1trZXkxXS5uYW1lXG4gICAgICBjb25zdCBhdHRyaWJ1dGVOYW1lMiA9IGF0dHJpYnV0ZXNba2V5Ml0ubmFtZVxuICAgICAgcmV0dXJuIHNjb3JlQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUxKSAtIHNjb3JlQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUyKVxuICAgIH0pXG4gICAgLnNvbWUoKGtleSkgPT4ge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1trZXldXG4gICAgICBjb25zdCBhdHRyaWJ1dGVOYW1lID0gYXR0cmlidXRlLm5hbWVcbiAgICAgIC8vIEZJWE1FOiBEb3duc3RyZWFtIGhpZXJhcmNoeSBwYXJzaW5nIGlzIGJyb2tlbi4gRm9yIG5vdywganVzdCBvbWl0IGRvdWJsZS1xdW90ZXMuXG4gICAgICBjb25zdCBhdHRyaWJ1dGVWYWx1ZSA9IGF0dHJpYnV0ZS52YWx1ZS5yZXBsYWNlKC9cIi9nLCAnJylcbiAgICAgIGlmIChjaGVja0lnbm9yZShpZ25vcmUuYXR0cmlidXRlLCBhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVWYWx1ZSwgZGVmYXVsdElnbm9yZS5hdHRyaWJ1dGUpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgY29uc3QgcGF0dGVybiA9IGBbJHthdHRyaWJ1dGVOYW1lfT1cIiR7YXR0cmlidXRlVmFsdWV9XCJdYFxuICAgICAgcmV0dXJuIGNoZWNrQ2hpbGQoZWxlbWVudCwgcGF0aCwgcGF0dGVybilcbiAgICB9KVxufVxuXG4vKipcbiAqIFtjaGVja1RhZ0dsb2JhbCBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja1RhZ0dsb2JhbCAoZWxlbWVudCwgcGF0aCwgaWdub3JlLCByb290KSB7XG4gIHJldHVybiBjaGVja1RhZyhlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHJvb3QpXG59XG5cbi8qKlxuICogW2NoZWNrVGFnTG9jYWwgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tUYWdMb2NhbCAoZWxlbWVudCwgcGF0aCwgaWdub3JlKSB7XG4gIHJldHVybiBjaGVja1RhZyhlbGVtZW50LCBwYXRoLCBpZ25vcmUsIGVsZW1lbnQucGFyZW50Tm9kZSlcbn1cblxuLyoqXG4gKiBbY2hlY2tUYWJDaGlsZHJlbiBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja1RhZ0NoaWxkIChlbGVtZW50LCBwYXRoLCBpZ25vcmUpIHtcbiAgY29uc3QgdGFnTmFtZSA9IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpXG4gIGlmIChjaGVja0lnbm9yZShpZ25vcmUudGFnLCB0YWdOYW1lKSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiBjaGVja0NoaWxkKGVsZW1lbnQsIHBhdGgsIHRhZ05hbWUpXG59XG5cbi8qKlxuICogW2NoZWNrSWQgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tJZCAoZWxlbWVudCwgcGF0aCwgaWdub3JlKSB7XG4gIGNvbnN0IGlkID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2lkJylcbiAgaWYgKGNoZWNrSWdub3JlKGlnbm9yZS5pZCwgaWQpKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcGF0aC51bnNoaWZ0KGAjJHtpZH1gKVxuICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIFtjaGVja0NsYXNzIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IHBhcmVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDbGFzcyAoZWxlbWVudCwgcGF0aCwgaWdub3JlLCBwYXJlbnQpIHtcbiAgY29uc3QgY2xhc3NOYW1lID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJylcbiAgaWYgKGNoZWNrSWdub3JlKGlnbm9yZS5jbGFzcywgY2xhc3NOYW1lKSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIGNvbnN0IG1hdGNoZXMgPSBwYXJlbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShjbGFzc05hbWUpXG4gIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgIHBhdGgudW5zaGlmdChgLiR7Y2xhc3NOYW1lLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcuJyl9YClcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIFtjaGVja0F0dHJpYnV0ZSBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBwYXJlbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQXR0cmlidXRlIChlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHBhcmVudCkge1xuICBjb25zdCBhdHRyaWJ1dGVzID0gZWxlbWVudC5hdHRyaWJ1dGVzXG4gIHJldHVybiBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKVxuICAgIC5zb3J0KChrZXkxLCBrZXkyKSA9PiB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGVOYW1lMSA9IGF0dHJpYnV0ZXNba2V5MV0ubmFtZVxuICAgICAgY29uc3QgYXR0cmlidXRlTmFtZTIgPSBhdHRyaWJ1dGVzW2tleTJdLm5hbWVcbiAgICAgIHJldHVybiBzY29yZUF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lMSkgLSBzY29yZUF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lMilcbiAgICB9KVxuICAgIC5zb21lKChrZXkpID0+IHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNba2V5XVxuICAgICAgY29uc3QgYXR0cmlidXRlTmFtZSA9IGF0dHJpYnV0ZS5uYW1lXG4gICAgICAvLyBGSVhNRTogRG93bnN0cmVhbSBoaWVyYXJjaHkgcGFyc2luZyBpcyBicm9rZW4uIEZvciBub3csIGp1c3Qgb21pdCBkb3VibGUtcXVvdGVzLlxuICAgICAgY29uc3QgYXR0cmlidXRlVmFsdWUgPSBhdHRyaWJ1dGUudmFsdWUucmVwbGFjZSgvXCIvZywgJycpXG4gICAgICBpZiAoY2hlY2tJZ25vcmUoaWdub3JlLmF0dHJpYnV0ZSwgYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWUsIGRlZmF1bHRJZ25vcmUuYXR0cmlidXRlKSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhdHRlcm4gPSBgWyR7YXR0cmlidXRlTmFtZX09XCIke2F0dHJpYnV0ZVZhbHVlfVwiXWBcbiAgICAgIGNvbnN0IG1hdGNoZXMgPSBwYXJlbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHBhdGgudW5zaGlmdChwYXR0ZXJuKVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgIH0pXG59XG5cbi8qKlxuICogW2NoZWNrVGFnIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBwYXJlbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tUYWcgKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgcGFyZW50KSB7XG4gIGNvbnN0IHRhZ05hbWUgPSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKVxuICBpZiAoY2hlY2tJZ25vcmUoaWdub3JlLnRhZywgdGFnTmFtZSkpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICBjb25zdCBtYXRjaGVzID0gcGFyZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWUpXG4gIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgIHBhdGgudW5zaGlmdCh0YWdOYW1lKVxuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogW2NoZWNrQ2hpbGQgZGVzY3JpcHRpb25dXG4gKiBOb3RlOiBjaGlsZFRhZ3MgaXMgYSBjdXN0b20gcHJvcGVydHkgdG8gdXNlIGEgdmlldyBmaWx0ZXIgZm9yIHRhZ3Mgb24gZm9yIHZpcnV0YWwgZWxlbWVudHNcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge1N0cmluZ30gICAgICBzZWxlY3RvciAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDaGlsZCAoZWxlbWVudCwgcGF0aCwgc2VsZWN0b3IpIHtcbiAgY29uc3QgcGFyZW50ID0gZWxlbWVudC5wYXJlbnROb2RlXG4gIGNvbnN0IGNoaWxkcmVuID0gcGFyZW50LmNoaWxkVGFncyB8fCBwYXJlbnQuY2hpbGRyZW5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBpZiAoY2hpbGRyZW5baV0gPT09IGVsZW1lbnQpIHtcbiAgICAgIHBhdGgudW5zaGlmdChgPiAke3NlbGVjdG9yfTpudGgtY2hpbGQoJHtpKzF9KWApXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBbY2hlY2tJZ25vcmUgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gcHJlZGljYXRlICAgICAgICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgbmFtZSAgICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgdmFsdWUgICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZGVmYXVsdFByZWRpY2F0ZSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrSWdub3JlIChwcmVkaWNhdGUsIG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKSB7XG4gIGlmICghbmFtZSkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgY29uc3QgY2hlY2sgPSBwcmVkaWNhdGUgfHwgZGVmYXVsdFByZWRpY2F0ZVxuICBpZiAoIWNoZWNrKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIGNoZWNrKG5hbWUsIHZhbHVlIHx8IG5hbWUsIGRlZmF1bHRQcmVkaWNhdGUpXG59XG4iXX0=
