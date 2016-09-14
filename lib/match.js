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
 * Score attributes by their "robustness", so that
 * auto-generated selectors prioritize less finicky attributes.
 */
function scoreAttribute(attribute) {
  if (attribute.indexOf('data-') === 0) return -1;
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
//# sourceMappingURL=data:application/json;base64,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S0FBUDtBQUNEOztBQUVEOzs7Ozs7OztBQVFBLFNBQVMsV0FBVCxDQUFzQixTQUF0QixFQUFpQyxJQUFqQyxFQUF1QyxLQUF2QyxFQUE4QyxnQkFBOUMsRUFBZ0U7QUFDOUQsTUFBSSxDQUFDLElBQUwsRUFBVztBQUNULFdBQU8sSUFBUDtBQUNEO0FBQ0QsTUFBTSxRQUFRLGFBQWEsZ0JBQTNCO0FBQ0EsTUFBSSxDQUFDLEtBQUwsRUFBWTtBQUNWLFdBQU8sS0FBUDtBQUNEO0FBQ0QsU0FBTyxNQUFNLElBQU4sRUFBWSxTQUFTLElBQXJCLEVBQTJCLGdCQUEzQixDQUFQO0FBQ0QiLCJmaWxlIjoibWF0Y2guanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqICMgTWF0Y2hcbiAqXG4gKiBSZXRyaWV2ZXMgc2VsZWN0b3JcbiAqL1xuXG5jb25zdCBkZWZhdWx0SWdub3JlID0ge1xuICBhdHRyaWJ1dGUgKGF0dHJpYnV0ZU5hbWUpIHtcbiAgICByZXR1cm4gW1xuICAgICAgJ3N0eWxlJyxcbiAgICAgICdkYXRhLXJlYWN0aWQnLFxuICAgICAgJ2RhdGEtcmVhY3QtY2hlY2tzdW0nXG4gICAgXS5pbmRleE9mKGF0dHJpYnV0ZU5hbWUpID4gLTFcbiAgfVxufVxuXG4vKipcbiAqXG4gKiBTY29yZSBhdHRyaWJ1dGVzIGJ5IHRoZWlyIFwicm9idXN0bmVzc1wiLCBzbyB0aGF0XG4gKiBhdXRvLWdlbmVyYXRlZCBzZWxlY3RvcnMgcHJpb3JpdGl6ZSBsZXNzIGZpbmlja3kgYXR0cmlidXRlcy5cbiAqL1xuZnVuY3Rpb24gc2NvcmVBdHRyaWJ1dGUgKGF0dHJpYnV0ZSkge1xuICBpZiAoYXR0cmlidXRlLmluZGV4T2YoJ2RhdGEtJykgPT09IDApIHJldHVybiAtMVxuICBpZiAoYXR0cmlidXRlID09PSAnaHJlZicpIHJldHVybiAxXG4gIGlmIChhdHRyaWJ1dGUgPT09ICdzcmMnKSByZXR1cm4gMlxuICBpZiAoYXR0cmlidXRlID09PSAnYWx0JyB8fCBhdHRyaWJ1dGUgPT09ICd0aXRsZScpIHJldHVybiAzXG4gIHJldHVybiAwXG59XG5cbi8qKlxuICogR2V0IHRoZSBwYXRoIG9mIHRoZSBlbGVtZW50XG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gbm9kZSAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBvcHRpb25zIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7U3RyaW5nfSAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG1hdGNoIChub2RlLCBvcHRpb25zKSB7XG4gIGNvbnN0IHBhdGggPSBbXVxuICB2YXIgZWxlbWVudCA9IG5vZGVcbiAgdmFyIGxlbmd0aCA9IHBhdGgubGVuZ3RoXG5cbiAgY29uc3Qge1xuICAgIHJvb3QgPSBkb2N1bWVudCxcbiAgICBza2lwID0gbnVsbCxcbiAgICBpZ25vcmUgPSB7fVxuICB9ID0gb3B0aW9uc1xuXG4gIGNvbnN0IHNraXBDb21wYXJlID0gc2tpcCAmJiAoQXJyYXkuaXNBcnJheShza2lwKSA/IHNraXAgOiBbc2tpcF0pLm1hcCgoZW50cnkpID0+IHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gKGVsZW1lbnQpID0+IGVsZW1lbnQgPT09IGVudHJ5XG4gICAgfVxuICAgIHJldHVybiBlbnRyeVxuICB9KVxuXG4gIGNvbnN0IHNraXBDaGVja3MgPSAoZWxlbWVudCkgPT4ge1xuICAgIHJldHVybiBza2lwICYmIHNraXBDb21wYXJlLnNvbWUoKGNvbXBhcmUpID0+IGNvbXBhcmUoZWxlbWVudCkpXG4gIH1cblxuICB2YXIgaWdub3JlQ2xhc3MgPSBmYWxzZVxuXG4gIE9iamVjdC5rZXlzKGlnbm9yZSkuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgIGlmICh0eXBlID09PSAnY2xhc3MnKSB7XG4gICAgICBpZ25vcmVDbGFzcyA9IHRydWVcbiAgICB9XG4gICAgdmFyIHByZWRpY2F0ZSA9IGlnbm9yZVt0eXBlXVxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnYm9vbGVhbicpIHJldHVyblxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnZnVuY3Rpb24nKSByZXR1cm5cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHByZWRpY2F0ZSA9IHByZWRpY2F0ZS50b1N0cmluZygpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgcHJlZGljYXRlID0gbmV3IFJlZ0V4cChwcmVkaWNhdGUpXG4gICAgfVxuICAgIC8vIGNoZWNrIGNsYXNzLS9hdHRyaWJ1dGVuYW1lIGZvciByZWdleFxuICAgIGlnbm9yZVt0eXBlXSA9IHByZWRpY2F0ZS50ZXN0LmJpbmQocHJlZGljYXRlKVxuICB9KVxuXG4gIGlmIChpZ25vcmVDbGFzcykge1xuICAgIGNvbnN0IGlnbm9yZUF0dHJpYnV0ZSA9IGlnbm9yZS5hdHRyaWJ1dGVcbiAgICBpZ25vcmUuYXR0cmlidXRlID0gKG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKSA9PiB7XG4gICAgICByZXR1cm4gaWdub3JlLmNsYXNzKHZhbHVlKSB8fCBpZ25vcmVBdHRyaWJ1dGUgJiYgaWdub3JlQXR0cmlidXRlKG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKVxuICAgIH1cbiAgfVxuXG4gIHdoaWxlIChlbGVtZW50ICE9PSByb290KSB7XG5cbiAgICBpZiAoc2tpcENoZWNrcyhlbGVtZW50KSAhPT0gdHJ1ZSkge1xuICAgICAgLy8gZ2xvYmFsXG4gICAgICBpZiAoY2hlY2tJZChlbGVtZW50LCBwYXRoLCBpZ25vcmUpKSBicmVha1xuICAgICAgaWYgKGNoZWNrQXR0cmlidXRlR2xvYmFsKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgcm9vdCkpIGJyZWFrXG4gICAgICBpZiAoY2hlY2tDbGFzc0dsb2JhbChlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHJvb3QpKSBicmVha1xuICAgICAgaWYgKGNoZWNrVGFnR2xvYmFsKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgcm9vdCkpIGJyZWFrXG5cbiAgICAgIC8vIGxvY2FsXG4gICAgICBjaGVja0F0dHJpYnV0ZUxvY2FsKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSlcblxuICAgICAgLy8gZGVmaW5lIG9ubHkgb25lIHNlbGVjdG9yIGVhY2ggaXRlcmF0aW9uXG4gICAgICBpZiAocGF0aC5sZW5ndGggPT09IGxlbmd0aCkge1xuICAgICAgICBjaGVja0NsYXNzTG9jYWwoZWxlbWVudCwgcGF0aCwgaWdub3JlKVxuICAgICAgfVxuICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgY2hlY2tUYWdMb2NhbChlbGVtZW50LCBwYXRoLCBpZ25vcmUpXG4gICAgICB9XG5cbiAgICAgIGlmIChpZ25vcmUuY2hpbGRTZWxlY3RvciAhPT0gdHJ1ZSkge1xuICAgICAgICBpZiAocGF0aC5sZW5ndGggPT09IGxlbmd0aCkge1xuICAgICAgICAgIGNoZWNrQ2xhc3NDaGlsZChlbGVtZW50LCBwYXRoLCBpZ25vcmUpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgICBjaGVja0F0dHJpYnV0ZUNoaWxkKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSlcbiAgICAgICAgfVxuICAgICAgICBpZiAocGF0aC5sZW5ndGggPT09IGxlbmd0aCkge1xuICAgICAgICAgIGNoZWNrVGFnQ2hpbGQoZWxlbWVudCwgcGF0aCwgaWdub3JlKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGVsZW1lbnQgPT09IG5vZGUgJiYgcGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgIHZhciBlbGVtZW50U2VsZWN0b3IgPSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKVxuICAgICAgdmFyIGNsYXNzTmFtZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpXG4gICAgICBpZiAoY2xhc3NOYW1lKSB7XG4gICAgICAgIGVsZW1lbnRTZWxlY3RvciArPSBgLiR7Y2xhc3NOYW1lLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcuJyl9YFxuICAgICAgfVxuICAgICAgcGF0aC51bnNoaWZ0KGVsZW1lbnRTZWxlY3RvcilcbiAgICB9XG5cbiAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlXG4gICAgbGVuZ3RoID0gcGF0aC5sZW5ndGhcbiAgfVxuXG4gIHJldHVybiBwYXRoLmpvaW4oJyAnKVxufVxuXG5cbi8qKlxuICogW2NoZWNrQ2xhc3NHbG9iYWwgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDbGFzc0dsb2JhbCAoZWxlbWVudCwgcGF0aCwgaWdub3JlLCByb290KSB7XG4gIHJldHVybiBjaGVja0NsYXNzKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgcm9vdClcbn1cblxuLyoqXG4gKiBbY2hlY2tDbGFzc0xvY2FsIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQ2xhc3NMb2NhbCAoZWxlbWVudCwgcGF0aCwgaWdub3JlKSB7XG4gIHJldHVybiBjaGVja0NsYXNzKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgZWxlbWVudC5wYXJlbnROb2RlKVxufVxuXG4vKipcbiAqIFtjaGVja0NsYXNzQ2hpbGQgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDbGFzc0NoaWxkIChlbGVtZW50LCBwYXRoLCBpZ25vcmUpIHtcbiAgY29uc3QgY2xhc3NOYW1lID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJylcbiAgaWYgKGNoZWNrSWdub3JlKGlnbm9yZS5jbGFzcywgY2xhc3NOYW1lKSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiBjaGVja0NoaWxkKGVsZW1lbnQsIHBhdGgsIGAuJHtjbGFzc05hbWUudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJy4nKX1gKVxufVxuXG4vKipcbiAqIFtjaGVja0F0dHJpYnV0ZUdsb2JhbCBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0F0dHJpYnV0ZUdsb2JhbCAoZWxlbWVudCwgcGF0aCwgaWdub3JlLCByb290KSB7XG4gIHJldHVybiBjaGVja0F0dHJpYnV0ZShlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHJvb3QpXG59XG5cbi8qKlxuICogW2NoZWNrQXR0cmlidXRlTG9jYWwgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tBdHRyaWJ1dGVMb2NhbCAoZWxlbWVudCwgcGF0aCwgaWdub3JlKSB7XG4gIHJldHVybiBjaGVja0F0dHJpYnV0ZShlbGVtZW50LCBwYXRoLCBpZ25vcmUsIGVsZW1lbnQucGFyZW50Tm9kZSlcbn1cblxuLyoqXG4gKiBbY2hlY2tBdHRyaWJ1dGVDaGlsZCBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0F0dHJpYnV0ZUNoaWxkIChlbGVtZW50LCBwYXRoLCBpZ25vcmUpIHtcbiAgY29uc3QgYXR0cmlidXRlcyA9IGVsZW1lbnQuYXR0cmlidXRlc1xuICByZXR1cm4gT2JqZWN0LmtleXMoYXR0cmlidXRlcylcbiAgICAuc29ydCgoa2V5MSwga2V5MikgPT4ge1xuICAgICAgY29uc3QgYXR0cmlidXRlTmFtZTEgPSBhdHRyaWJ1dGVzW2tleTFdLm5hbWVcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUyID0gYXR0cmlidXRlc1trZXkyXS5uYW1lXG4gICAgICByZXR1cm4gc2NvcmVBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZTEpIC0gc2NvcmVBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZTIpXG4gICAgfSlcbiAgICAuc29tZSgoa2V5KSA9PiB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2tleV1cbiAgICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUgPSBhdHRyaWJ1dGUubmFtZVxuICAgICAgLy8gRklYTUU6IERvd25zdHJlYW0gaGllcmFyY2h5IHBhcnNpbmcgaXMgYnJva2VuLiBGb3Igbm93LCBqdXN0IG9taXQgZG91YmxlLXF1b3Rlcy5cbiAgICAgIGNvbnN0IGF0dHJpYnV0ZVZhbHVlID0gYXR0cmlidXRlLnZhbHVlLnJlcGxhY2UoL1wiL2csICcnKVxuICAgICAgaWYgKGNoZWNrSWdub3JlKGlnbm9yZS5hdHRyaWJ1dGUsIGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlLCBkZWZhdWx0SWdub3JlLmF0dHJpYnV0ZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBjb25zdCBwYXR0ZXJuID0gYFske2F0dHJpYnV0ZU5hbWV9PVwiJHthdHRyaWJ1dGVWYWx1ZX1cIl1gXG4gICAgICByZXR1cm4gY2hlY2tDaGlsZChlbGVtZW50LCBwYXRoLCBwYXR0ZXJuKVxuICAgIH0pXG59XG5cbi8qKlxuICogW2NoZWNrVGFnR2xvYmFsIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrVGFnR2xvYmFsIChlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHJvb3QpIHtcbiAgcmV0dXJuIGNoZWNrVGFnKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgcm9vdClcbn1cblxuLyoqXG4gKiBbY2hlY2tUYWdMb2NhbCBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja1RhZ0xvY2FsIChlbGVtZW50LCBwYXRoLCBpZ25vcmUpIHtcbiAgcmV0dXJuIGNoZWNrVGFnKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgZWxlbWVudC5wYXJlbnROb2RlKVxufVxuXG4vKipcbiAqIFtjaGVja1RhYkNoaWxkcmVuIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrVGFnQ2hpbGQgKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSkge1xuICBjb25zdCB0YWdOYW1lID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgaWYgKGNoZWNrSWdub3JlKGlnbm9yZS50YWcsIHRhZ05hbWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIGNoZWNrQ2hpbGQoZWxlbWVudCwgcGF0aCwgdGFnTmFtZSlcbn1cblxuLyoqXG4gKiBbY2hlY2tJZCBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0lkIChlbGVtZW50LCBwYXRoLCBpZ25vcmUpIHtcbiAgY29uc3QgaWQgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnaWQnKVxuICBpZiAoY2hlY2tJZ25vcmUoaWdub3JlLmlkLCBpZCkpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICBwYXRoLnVuc2hpZnQoYCMke2lkfWApXG4gIHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogW2NoZWNrQ2xhc3MgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gcGFyZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0NsYXNzIChlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHBhcmVudCkge1xuICBjb25zdCBjbGFzc05hbWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnY2xhc3MnKVxuICBpZiAoY2hlY2tJZ25vcmUoaWdub3JlLmNsYXNzLCBjbGFzc05hbWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgY29uc3QgbWF0Y2hlcyA9IHBhcmVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKGNsYXNzTmFtZSlcbiAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgcGF0aC51bnNoaWZ0KGAuJHtjbGFzc05hbWUudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJy4nKX1gKVxuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogW2NoZWNrQXR0cmlidXRlIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IHBhcmVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tBdHRyaWJ1dGUgKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgcGFyZW50KSB7XG4gIGNvbnN0IGF0dHJpYnV0ZXMgPSBlbGVtZW50LmF0dHJpYnV0ZXNcbiAgcmV0dXJuIE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpXG4gICAgLnNvcnQoKGtleTEsIGtleTIpID0+IHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUxID0gYXR0cmlidXRlc1trZXkxXS5uYW1lXG4gICAgICBjb25zdCBhdHRyaWJ1dGVOYW1lMiA9IGF0dHJpYnV0ZXNba2V5Ml0ubmFtZVxuICAgICAgcmV0dXJuIHNjb3JlQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUxKSAtIHNjb3JlQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUyKVxuICAgIH0pXG4gICAgLnNvbWUoKGtleSkgPT4ge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1trZXldXG4gICAgICBjb25zdCBhdHRyaWJ1dGVOYW1lID0gYXR0cmlidXRlLm5hbWVcbiAgICAgIC8vIEZJWE1FOiBEb3duc3RyZWFtIGhpZXJhcmNoeSBwYXJzaW5nIGlzIGJyb2tlbi4gRm9yIG5vdywganVzdCBvbWl0IGRvdWJsZS1xdW90ZXMuXG4gICAgICBjb25zdCBhdHRyaWJ1dGVWYWx1ZSA9IGF0dHJpYnV0ZS52YWx1ZS5yZXBsYWNlKC9cIi9nLCAnJylcbiAgICAgIGlmIChjaGVja0lnbm9yZShpZ25vcmUuYXR0cmlidXRlLCBhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVWYWx1ZSwgZGVmYXVsdElnbm9yZS5hdHRyaWJ1dGUpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgY29uc3QgcGF0dGVybiA9IGBbJHthdHRyaWJ1dGVOYW1lfT1cIiR7YXR0cmlidXRlVmFsdWV9XCJdYFxuICAgICAgY29uc3QgbWF0Y2hlcyA9IHBhcmVudC5xdWVyeVNlbGVjdG9yQWxsKHBhdHRlcm4pXG4gICAgICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfSlcbn1cblxuLyoqXG4gKiBbY2hlY2tUYWcgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IHBhcmVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja1RhZyAoZWxlbWVudCwgcGF0aCwgaWdub3JlLCBwYXJlbnQpIHtcbiAgY29uc3QgdGFnTmFtZSA9IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpXG4gIGlmIChjaGVja0lnbm9yZShpZ25vcmUudGFnLCB0YWdOYW1lKSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIGNvbnN0IG1hdGNoZXMgPSBwYXJlbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnTmFtZSlcbiAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgcGF0aC51bnNoaWZ0KHRhZ05hbWUpXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBbY2hlY2tDaGlsZCBkZXNjcmlwdGlvbl1cbiAqIE5vdGU6IGNoaWxkVGFncyBpcyBhIGN1c3RvbSBwcm9wZXJ0eSB0byB1c2UgYSB2aWV3IGZpbHRlciBmb3IgdGFncyBvbiBmb3IgdmlydXRhbCBlbGVtZW50c1xuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7U3RyaW5nfSAgICAgIHNlbGVjdG9yIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0NoaWxkIChlbGVtZW50LCBwYXRoLCBzZWxlY3Rvcikge1xuICBjb25zdCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGVcbiAgY29uc3QgY2hpbGRyZW4gPSBwYXJlbnQuY2hpbGRUYWdzIHx8IHBhcmVudC5jaGlsZHJlblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlmIChjaGlsZHJlbltpXSA9PT0gZWxlbWVudCkge1xuICAgICAgcGF0aC51bnNoaWZ0KGA+ICR7c2VsZWN0b3J9Om50aC1jaGlsZCgke2krMX0pYClcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIFtjaGVja0lnbm9yZSBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBwcmVkaWNhdGUgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge3N0cmluZ30gICBuYW1lICAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge3N0cmluZ30gICB2YWx1ZSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBkZWZhdWx0UHJlZGljYXRlIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tJZ25vcmUgKHByZWRpY2F0ZSwgbmFtZSwgdmFsdWUsIGRlZmF1bHRQcmVkaWNhdGUpIHtcbiAgaWYgKCFuYW1lKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBjb25zdCBjaGVjayA9IHByZWRpY2F0ZSB8fCBkZWZhdWx0UHJlZGljYXRlXG4gIGlmICghY2hlY2spIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gY2hlY2sobmFtZSwgdmFsdWUgfHwgbmFtZSwgZGVmYXVsdFByZWRpY2F0ZSlcbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
