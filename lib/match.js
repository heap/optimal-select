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
  return Object.keys(attributes).sort(function (key1, key2) {
    var attributeName1 = attributes[key1].name;
    var attributeName2 = attributes[key2].name;
    if (attributeName1.indexOf('data-') === 0 || attributeName2 === 'href') {
      return -1;
    } else if (attributeName1 === 'href' || attributeName2.indexOf('data-') === 0) {
      return 1;
    } else {
      return 0;
    }
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
    if (attributeName1.indexOf('data-') === 0 || attributeName2 === 'href') {
      return -1;
    } else if (attributeName1 === 'href' || attributeName2.indexOf('data-') === 0) {
      return 1;
    } else {
      return 0;
    }
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
//# sourceMappingURL=data:application/json;base64,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LElBQUwsRUFBVztBQUNULFdBQU8sSUFBUDtBQUNEO0FBQ0QsTUFBTSxRQUFRLGFBQWEsZ0JBQTNCO0FBQ0EsTUFBSSxDQUFDLEtBQUwsRUFBWTtBQUNWLFdBQU8sS0FBUDtBQUNEO0FBQ0QsU0FBTyxNQUFNLElBQU4sRUFBWSxTQUFTLElBQXJCLEVBQTJCLGdCQUEzQixDQUFQO0FBQ0QiLCJmaWxlIjoibWF0Y2guanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqICMgTWF0Y2hcbiAqXG4gKiBSZXRyaWV2ZXMgc2VsZWN0b3JcbiAqL1xuXG5jb25zdCBkZWZhdWx0SWdub3JlID0ge1xuICBhdHRyaWJ1dGUgKGF0dHJpYnV0ZU5hbWUpIHtcbiAgICByZXR1cm4gW1xuICAgICAgJ3N0eWxlJyxcbiAgICAgICdkYXRhLXJlYWN0aWQnLFxuICAgICAgJ2RhdGEtcmVhY3QtY2hlY2tzdW0nXG4gICAgXS5pbmRleE9mKGF0dHJpYnV0ZU5hbWUpID4gLTFcbiAgfVxufVxuXG4vKipcbiAqIEdldCB0aGUgcGF0aCBvZiB0aGUgZWxlbWVudFxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IG5vZGUgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgb3B0aW9ucyAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge1N0cmluZ30gICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBtYXRjaCAobm9kZSwgb3B0aW9ucykge1xuICBjb25zdCBwYXRoID0gW11cbiAgdmFyIGVsZW1lbnQgPSBub2RlXG4gIHZhciBsZW5ndGggPSBwYXRoLmxlbmd0aFxuXG4gIGNvbnN0IHtcbiAgICByb290ID0gZG9jdW1lbnQsXG4gICAgc2tpcCA9IG51bGwsXG4gICAgaWdub3JlID0ge31cbiAgfSA9IG9wdGlvbnNcblxuICBjb25zdCBza2lwQ29tcGFyZSA9IHNraXAgJiYgKEFycmF5LmlzQXJyYXkoc2tpcCkgPyBza2lwIDogW3NraXBdKS5tYXAoKGVudHJ5KSA9PiB7XG4gICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIChlbGVtZW50KSA9PiBlbGVtZW50ID09PSBlbnRyeVxuICAgIH1cbiAgICByZXR1cm4gZW50cnlcbiAgfSlcblxuICBjb25zdCBza2lwQ2hlY2tzID0gKGVsZW1lbnQpID0+IHtcbiAgICByZXR1cm4gc2tpcCAmJiBza2lwQ29tcGFyZS5zb21lKChjb21wYXJlKSA9PiBjb21wYXJlKGVsZW1lbnQpKVxuICB9XG5cbiAgdmFyIGlnbm9yZUNsYXNzID0gZmFsc2VcblxuICBPYmplY3Qua2V5cyhpZ25vcmUpLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICBpZiAodHlwZSA9PT0gJ2NsYXNzJykge1xuICAgICAgaWdub3JlQ2xhc3MgPSB0cnVlXG4gICAgfVxuICAgIHZhciBwcmVkaWNhdGUgPSBpZ25vcmVbdHlwZV1cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ2Jvb2xlYW4nKSByZXR1cm5cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuXG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdudW1iZXInKSB7XG4gICAgICBwcmVkaWNhdGUgPSBwcmVkaWNhdGUudG9TdHJpbmcoKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHByZWRpY2F0ZSA9IG5ldyBSZWdFeHAocHJlZGljYXRlKVxuICAgIH1cbiAgICAvLyBjaGVjayBjbGFzcy0vYXR0cmlidXRlbmFtZSBmb3IgcmVnZXhcbiAgICBpZ25vcmVbdHlwZV0gPSBwcmVkaWNhdGUudGVzdC5iaW5kKHByZWRpY2F0ZSlcbiAgfSlcblxuICBpZiAoaWdub3JlQ2xhc3MpIHtcbiAgICBjb25zdCBpZ25vcmVBdHRyaWJ1dGUgPSBpZ25vcmUuYXR0cmlidXRlXG4gICAgaWdub3JlLmF0dHJpYnV0ZSA9IChuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSkgPT4ge1xuICAgICAgcmV0dXJuIGlnbm9yZS5jbGFzcyh2YWx1ZSkgfHwgaWdub3JlQXR0cmlidXRlICYmIGlnbm9yZUF0dHJpYnV0ZShuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSlcbiAgICB9XG4gIH1cblxuICB3aGlsZSAoZWxlbWVudCAhPT0gcm9vdCkge1xuXG4gICAgaWYgKHNraXBDaGVja3MoZWxlbWVudCkgIT09IHRydWUpIHtcbiAgICAgIC8vIGdsb2JhbFxuICAgICAgaWYgKGNoZWNrSWQoZWxlbWVudCwgcGF0aCwgaWdub3JlKSkgYnJlYWtcbiAgICAgIGlmIChjaGVja0F0dHJpYnV0ZUdsb2JhbChlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHJvb3QpKSBicmVha1xuICAgICAgaWYgKGNoZWNrQ2xhc3NHbG9iYWwoZWxlbWVudCwgcGF0aCwgaWdub3JlLCByb290KSkgYnJlYWtcbiAgICAgIGlmIChjaGVja1RhZ0dsb2JhbChlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHJvb3QpKSBicmVha1xuXG4gICAgICAvLyBsb2NhbFxuICAgICAgY2hlY2tBdHRyaWJ1dGVMb2NhbChlbGVtZW50LCBwYXRoLCBpZ25vcmUpXG5cbiAgICAgIC8vIGRlZmluZSBvbmx5IG9uZSBzZWxlY3RvciBlYWNoIGl0ZXJhdGlvblxuICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgY2hlY2tDbGFzc0xvY2FsKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSlcbiAgICAgIH1cbiAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgIGNoZWNrVGFnTG9jYWwoZWxlbWVudCwgcGF0aCwgaWdub3JlKVxuICAgICAgfVxuXG4gICAgICBpZiAoaWdub3JlLmNoaWxkU2VsZWN0b3IgIT09IHRydWUpIHtcbiAgICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgICBjaGVja0NsYXNzQ2hpbGQoZWxlbWVudCwgcGF0aCwgaWdub3JlKVxuICAgICAgICB9XG4gICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgY2hlY2tBdHRyaWJ1dGVDaGlsZChlbGVtZW50LCBwYXRoLCBpZ25vcmUpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgICBjaGVja1RhZ0NoaWxkKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGVcbiAgICBsZW5ndGggPSBwYXRoLmxlbmd0aFxuICB9XG5cbiAgaWYgKGVsZW1lbnQgPT09IHJvb3QpIHtcbiAgICBwYXRoLnVuc2hpZnQoJyonKVxuICB9XG5cbiAgcmV0dXJuIHBhdGguam9pbignICcpXG59XG5cblxuLyoqXG4gKiBbY2hlY2tDbGFzc0dsb2JhbCBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0NsYXNzR2xvYmFsIChlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHJvb3QpIHtcbiAgcmV0dXJuIGNoZWNrQ2xhc3MoZWxlbWVudCwgcGF0aCwgaWdub3JlLCByb290KVxufVxuXG4vKipcbiAqIFtjaGVja0NsYXNzTG9jYWwgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDbGFzc0xvY2FsIChlbGVtZW50LCBwYXRoLCBpZ25vcmUpIHtcbiAgcmV0dXJuIGNoZWNrQ2xhc3MoZWxlbWVudCwgcGF0aCwgaWdub3JlLCBlbGVtZW50LnBhcmVudE5vZGUpXG59XG5cbi8qKlxuICogW2NoZWNrQ2xhc3NDaGlsZCBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0NsYXNzQ2hpbGQgKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSkge1xuICBjb25zdCBjbGFzc05hbWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnY2xhc3MnKVxuICBpZiAoY2hlY2tJZ25vcmUoaWdub3JlLmNsYXNzLCBjbGFzc05hbWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIGNoZWNrQ2hpbGQoZWxlbWVudCwgcGF0aCwgYC4ke2NsYXNzTmFtZS50cmltKCkucmVwbGFjZSgvXFxzKy9nLCAnLicpfWApXG59XG5cbi8qKlxuICogW2NoZWNrQXR0cmlidXRlR2xvYmFsIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQXR0cmlidXRlR2xvYmFsIChlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHJvb3QpIHtcbiAgcmV0dXJuIGNoZWNrQXR0cmlidXRlKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgcm9vdClcbn1cblxuLyoqXG4gKiBbY2hlY2tBdHRyaWJ1dGVMb2NhbCBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0F0dHJpYnV0ZUxvY2FsIChlbGVtZW50LCBwYXRoLCBpZ25vcmUpIHtcbiAgcmV0dXJuIGNoZWNrQXR0cmlidXRlKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgZWxlbWVudC5wYXJlbnROb2RlKVxufVxuXG4vKipcbiAqIFtjaGVja0F0dHJpYnV0ZUNoaWxkIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQXR0cmlidXRlQ2hpbGQgKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSkge1xuICBjb25zdCBhdHRyaWJ1dGVzID0gZWxlbWVudC5hdHRyaWJ1dGVzXG4gIHJldHVybiBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKVxuICAgIC5zb3J0KChrZXkxLCBrZXkyKSA9PiB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGVOYW1lMSA9IGF0dHJpYnV0ZXNba2V5MV0ubmFtZVxuICAgICAgY29uc3QgYXR0cmlidXRlTmFtZTIgPSBhdHRyaWJ1dGVzW2tleTJdLm5hbWVcbiAgICAgIGlmIChhdHRyaWJ1dGVOYW1lMS5pbmRleE9mKCdkYXRhLScpID09PSAwIHx8IGF0dHJpYnV0ZU5hbWUyID09PSAnaHJlZicpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9IGVsc2UgaWYgKGF0dHJpYnV0ZU5hbWUxID09PSAnaHJlZicgfHwgYXR0cmlidXRlTmFtZTIuaW5kZXhPZignZGF0YS0nKSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gMVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIDBcbiAgICAgIH1cbiAgICB9KVxuICAgIC5zb21lKChrZXkpID0+IHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNba2V5XVxuICAgICAgY29uc3QgYXR0cmlidXRlTmFtZSA9IGF0dHJpYnV0ZS5uYW1lXG4gICAgICAvLyBGSVhNRTogRG93bnN0cmVhbSBoaWVyYXJjaHkgcGFyc2luZyBpcyBicm9rZW4uIEZvciBub3csIGp1c3Qgb21pdCBkb3VibGUtcXVvdGVzLlxuICAgICAgY29uc3QgYXR0cmlidXRlVmFsdWUgPSBhdHRyaWJ1dGUudmFsdWUucmVwbGFjZSgvXCIvZywgJycpXG4gICAgICBpZiAoY2hlY2tJZ25vcmUoaWdub3JlLmF0dHJpYnV0ZSwgYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWUsIGRlZmF1bHRJZ25vcmUuYXR0cmlidXRlKSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhdHRlcm4gPSBgWyR7YXR0cmlidXRlTmFtZX09XCIke2F0dHJpYnV0ZVZhbHVlfVwiXWBcbiAgICAgIHJldHVybiBjaGVja0NoaWxkKGVsZW1lbnQsIHBhdGgsIHBhdHRlcm4pXG4gICAgfSlcbn1cblxuLyoqXG4gKiBbY2hlY2tUYWdHbG9iYWwgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tUYWdHbG9iYWwgKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgcm9vdCkge1xuICByZXR1cm4gY2hlY2tUYWcoZWxlbWVudCwgcGF0aCwgaWdub3JlLCByb290KVxufVxuXG4vKipcbiAqIFtjaGVja1RhZ0xvY2FsIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrVGFnTG9jYWwgKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSkge1xuICByZXR1cm4gY2hlY2tUYWcoZWxlbWVudCwgcGF0aCwgaWdub3JlLCBlbGVtZW50LnBhcmVudE5vZGUpXG59XG5cbi8qKlxuICogW2NoZWNrVGFiQ2hpbGRyZW4gZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tUYWdDaGlsZCAoZWxlbWVudCwgcGF0aCwgaWdub3JlKSB7XG4gIGNvbnN0IHRhZ05hbWUgPSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKVxuICBpZiAoY2hlY2tJZ25vcmUoaWdub3JlLnRhZywgdGFnTmFtZSkpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gY2hlY2tDaGlsZChlbGVtZW50LCBwYXRoLCB0YWdOYW1lKVxufVxuXG4vKipcbiAqIFtjaGVja0lkIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrSWQgKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSkge1xuICBjb25zdCBpZCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdpZCcpXG4gIGlmIChjaGVja0lnbm9yZShpZ25vcmUuaWQsIGlkKSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHBhdGgudW5zaGlmdChgIyR7aWR9YClcbiAgcmV0dXJuIHRydWVcbn1cblxuLyoqXG4gKiBbY2hlY2tDbGFzcyBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBwYXJlbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQ2xhc3MgKGVsZW1lbnQsIHBhdGgsIGlnbm9yZSwgcGFyZW50KSB7XG4gIGNvbnN0IGNsYXNzTmFtZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpXG4gIGlmIChjaGVja0lnbm9yZShpZ25vcmUuY2xhc3MsIGNsYXNzTmFtZSkpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICBjb25zdCBtYXRjaGVzID0gcGFyZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoY2xhc3NOYW1lKVxuICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICBwYXRoLnVuc2hpZnQoYC4ke2NsYXNzTmFtZS50cmltKCkucmVwbGFjZSgvXFxzKy9nLCAnLicpfWApXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBbY2hlY2tBdHRyaWJ1dGUgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gcGFyZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0F0dHJpYnV0ZSAoZWxlbWVudCwgcGF0aCwgaWdub3JlLCBwYXJlbnQpIHtcbiAgY29uc3QgYXR0cmlidXRlcyA9IGVsZW1lbnQuYXR0cmlidXRlc1xuICByZXR1cm4gT2JqZWN0LmtleXMoYXR0cmlidXRlcylcbiAgICAuc29ydCgoa2V5MSwga2V5MikgPT4ge1xuICAgICAgY29uc3QgYXR0cmlidXRlTmFtZTEgPSBhdHRyaWJ1dGVzW2tleTFdLm5hbWVcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUyID0gYXR0cmlidXRlc1trZXkyXS5uYW1lXG4gICAgICBpZiAoYXR0cmlidXRlTmFtZTEuaW5kZXhPZignZGF0YS0nKSA9PT0gMCB8fCBhdHRyaWJ1dGVOYW1lMiA9PT0gJ2hyZWYnKSB7XG4gICAgICAgIHJldHVybiAtMVxuICAgICAgfSBlbHNlIGlmIChhdHRyaWJ1dGVOYW1lMSA9PT0gJ2hyZWYnIHx8IGF0dHJpYnV0ZU5hbWUyLmluZGV4T2YoJ2RhdGEtJykgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDFcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAwXG4gICAgICB9XG4gICAgfSlcbiAgICAuc29tZSgoa2V5KSA9PiB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2tleV1cbiAgICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUgPSBhdHRyaWJ1dGUubmFtZVxuICAgICAgLy8gRklYTUU6IERvd25zdHJlYW0gaGllcmFyY2h5IHBhcnNpbmcgaXMgYnJva2VuLiBGb3Igbm93LCBqdXN0IG9taXQgZG91YmxlLXF1b3Rlcy5cbiAgICAgIGNvbnN0IGF0dHJpYnV0ZVZhbHVlID0gYXR0cmlidXRlLnZhbHVlLnJlcGxhY2UoL1wiL2csICcnKVxuICAgICAgaWYgKGNoZWNrSWdub3JlKGlnbm9yZS5hdHRyaWJ1dGUsIGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlLCBkZWZhdWx0SWdub3JlLmF0dHJpYnV0ZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBjb25zdCBwYXR0ZXJuID0gYFske2F0dHJpYnV0ZU5hbWV9PVwiJHthdHRyaWJ1dGVWYWx1ZX1cIl1gXG4gICAgICBjb25zdCBtYXRjaGVzID0gcGFyZW50LnF1ZXJ5U2VsZWN0b3JBbGwocGF0dGVybilcbiAgICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBwYXRoLnVuc2hpZnQocGF0dGVybilcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICB9KVxufVxuXG4vKipcbiAqIFtjaGVja1RhZyBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgIHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gcGFyZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrVGFnIChlbGVtZW50LCBwYXRoLCBpZ25vcmUsIHBhcmVudCkge1xuICBjb25zdCB0YWdOYW1lID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgaWYgKGNoZWNrSWdub3JlKGlnbm9yZS50YWcsIHRhZ05hbWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgY29uc3QgbWF0Y2hlcyA9IHBhcmVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lKVxuICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICBwYXRoLnVuc2hpZnQodGFnTmFtZSlcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIFtjaGVja0NoaWxkIGRlc2NyaXB0aW9uXVxuICogTm90ZTogY2hpbGRUYWdzIGlzIGEgY3VzdG9tIHByb3BlcnR5IHRvIHVzZSBhIHZpZXcgZmlsdGVyIGZvciB0YWdzIG9uIGZvciB2aXJ1dGFsIGVsZW1lbnRzXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgcGF0aCAgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgICAgc2VsZWN0b3IgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQ2hpbGQgKGVsZW1lbnQsIHBhdGgsIHNlbGVjdG9yKSB7XG4gIGNvbnN0IHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZVxuICBjb25zdCBjaGlsZHJlbiA9IHBhcmVudC5jaGlsZFRhZ3MgfHwgcGFyZW50LmNoaWxkcmVuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYgKGNoaWxkcmVuW2ldID09PSBlbGVtZW50KSB7XG4gICAgICBwYXRoLnVuc2hpZnQoYD4gJHtzZWxlY3Rvcn06bnRoLWNoaWxkKCR7aSsxfSlgKVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogW2NoZWNrSWdub3JlIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7RnVuY3Rpb259IHByZWRpY2F0ZSAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7c3RyaW5nfSAgIG5hbWUgICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7c3RyaW5nfSAgIHZhbHVlICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7RnVuY3Rpb259IGRlZmF1bHRQcmVkaWNhdGUgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0lnbm9yZSAocHJlZGljYXRlLCBuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSkge1xuICBpZiAoIW5hbWUpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIGNvbnN0IGNoZWNrID0gcHJlZGljYXRlIHx8IGRlZmF1bHRQcmVkaWNhdGVcbiAgaWYgKCFjaGVjaykge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiBjaGVjayhuYW1lLCB2YWx1ZSB8fCBuYW1lLCBkZWZhdWx0UHJlZGljYXRlKVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
