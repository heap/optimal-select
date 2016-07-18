'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = adapt;

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

/**
 * # Universal
 *
 * Check and extend the environment for universal usage
 */

/**
 * [adapt description]
 * @param  {[type]} element [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
function adapt(element, options) {

  // detect environment setup
  if (global.document) {
    return false;
  }

  var context = options.context;


  global.document = context || function () {
    var root = element;
    while (root.parent) {
      root = root.parent;
    }
    return root;
  }();

  // https://github.com/fb55/domhandler/blob/master/index.js#L75
  var ElementPrototype = Object.getPrototypeOf(global.document);

  // alternative descriptor to access elements with filtering invalid elements (e.g. textnodes)
  if (!Object.getOwnPropertyDescriptor(ElementPrototype, 'childTags')) {
    Object.defineProperty(ElementPrototype, 'childTags', {
      enumerable: true,
      get: function get() {
        return this.children.filter(function (node) {
          // https://github.com/fb55/domelementtype/blob/master/index.js#L12
          return node.type === 'tag' || node.type === 'script' || node.type === 'style';
        });
      }
    });
  }

  if (!Object.getOwnPropertyDescriptor(ElementPrototype, 'attributes')) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/attributes
    // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap
    Object.defineProperty(ElementPrototype, 'attributes', {
      enumerable: true,
      get: function get() {
        var attribs = this.attribs;

        var attributesNames = Object.keys(attribs);
        var NamedNodeMap = attributesNames.reduce(function (attributes, attributeName, index) {
          attributes[index] = {
            name: attributeName,
            value: attribs[attributeName]
          };
          return attributes;
        }, {});
        Object.defineProperty(NamedNodeMap, 'length', {
          enumerable: false,
          configurable: false,
          value: attributesNames.length
        });
        return NamedNodeMap;
      }
    });
  }

  if (!ElementPrototype.getAttribute) {
    // https://docs.webplatform.org/wiki/dom/Element/getAttribute
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute
    ElementPrototype.getAttribute = function (name) {
      return this.attribs[name] || null;
    };
  }

  if (!ElementPrototype.getElementsByTagName) {
    // https://docs.webplatform.org/wiki/dom/Document/getElementsByTagName
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByTagName
    ElementPrototype.getElementsByTagName = function (tagName) {
      var HTMLCollection = [];
      traverseDescendants(this.childTags, function (descendant) {
        if (descendant.name === tagName || tagName === '*') {
          HTMLCollection.push(descendant);
        }
      });
      return HTMLCollection;
    };
  }

  if (!ElementPrototype.getElementsByClassName) {
    // https://docs.webplatform.org/wiki/dom/Document/getElementsByClassName
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByClassName
    ElementPrototype.getElementsByClassName = function (className) {
      var names = className.trim().replace(/\s+/g, ' ').split(' ');
      var HTMLCollection = [];
      traverseDescendants([this], function (descendant) {
        var descendantClassName = descendant.attribs.class;
        if (descendantClassName && names.every(function (name) {
          return descendantClassName.indexOf(name) > -1;
        })) {
          HTMLCollection.push(descendant);
        }
      });
      return HTMLCollection;
    };
  }

  if (!ElementPrototype.querySelectorAll) {
    // https://docs.webplatform.org/wiki/css/selectors_api/querySelectorAll
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll
    ElementPrototype.querySelectorAll = function (selectors) {
      var _this = this;

      selectors = selectors.replace(/(>)(\S)/g, '$1 $2').trim(); // add space for '>' selector

      // using right to left execution => https://github.com/fb55/css-select#how-does-it-work

      var _getInstructions = getInstructions(selectors);

      var _getInstructions2 = _toArray(_getInstructions);

      var discover = _getInstructions2[0];

      var ascendings = _getInstructions2.slice(1);

      var total = ascendings.length;
      return discover(this).filter(function (node) {
        var step = 0;
        while (step < total) {
          node = ascendings[step](node, _this);
          if (!node) {
            // hierarchy doesn't match
            return false;
          }
          step += 1;
        }
        return true;
      });
    };
  }

  if (!ElementPrototype.contains) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/contains
    ElementPrototype.contains = function (element) {
      var inclusive = false;
      traverseDescendants([this], function (descendant, done) {
        if (descendant === element) {
          inclusive = true;
          done();
        }
      });
      return inclusive;
    };
  }

  return true;
}

/**
 * [getInstructions description]
 * @param  {[type]} selectors [description]
 * @return {[type]}           [description]
 */
function getInstructions(selectors) {
  return selectors.split(' ').reverse().map(function (selector, step) {
    var discover = step === 0;

    var _selector$split = selector.split(':');

    var _selector$split2 = _slicedToArray(_selector$split, 2);

    var type = _selector$split2[0];
    var pseudo = _selector$split2[1];


    var validate = null;
    var instruction = null;

    (function () {
      switch (true) {

        // child: '>'
        case />/.test(type):
          instruction = function checkParent(node) {
            return function (validate) {
              return validate(node.parent) && node.parent;
            };
          };
          break;

        // class: '.'
        case /^\./.test(type):
          var names = type.substr(1).split('.');
          validate = function validate(node) {
            var nodeClassName = node.attribs.class;
            return nodeClassName && names.every(function (name) {
              return nodeClassName.indexOf(name) > -1;
            });
          };
          instruction = function checkClass(node, root) {
            if (discover) {
              return node.getElementsByClassName(names.join(' '));
            }
            return typeof node === 'function' ? node(validate) : getAncestor(node, root, validate);
          };
          break;

        // attribute: '[key="value"]'
        case /^\[/.test(type):
          var _type$replace$split = type.replace(/\[|\]|"/g, '').split('=');

          var _type$replace$split2 = _slicedToArray(_type$replace$split, 2);

          var attributeKey = _type$replace$split2[0];
          var attributeValue = _type$replace$split2[1];

          validate = function validate(node) {
            var hasAttribute = Object.keys(node.attribs).indexOf(attributeKey) > -1;
            if (hasAttribute) {
              // regard optional attributeValue
              if (!attributeValue || node.attribs[attributeKey] === attributeValue) {
                return true;
              }
            }
            return false;
          };
          instruction = function checkAttribute(node, root) {
            if (discover) {
              var _ret2 = function () {
                var NodeList = [];
                traverseDescendants([node], function (descendant) {
                  if (validate(descendant)) {
                    NodeList.push(descendant);
                  }
                });
                return {
                  v: NodeList
                };
              }();

              if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
            }
            return typeof node === 'function' ? node(validate) : getAncestor(node, root, validate);
          };
          break;

        // id: '#'
        case /^#/.test(type):
          var id = type.substr(1);
          validate = function validate(node) {
            return node.attribs.id === id;
          };
          instruction = function checkId(node, root) {
            if (discover) {
              var _ret3 = function () {
                var NodeList = [];
                traverseDescendants([node], function (descendant, done) {
                  if (validate(descendant)) {
                    NodeList.push(descendant);
                    done();
                  }
                });
                return {
                  v: NodeList
                };
              }();

              if ((typeof _ret3 === 'undefined' ? 'undefined' : _typeof(_ret3)) === "object") return _ret3.v;
            }
            return typeof node === 'function' ? node(validate) : getAncestor(node, root, validate);
          };
          break;

        // universal: '*'
        case /\*/.test(type):
          validate = function validate(node) {
            return true;
          };
          instruction = function checkUniversal(node, root) {
            if (discover) {
              var _ret4 = function () {
                var NodeList = [];
                traverseDescendants([node], function (descendant) {
                  return NodeList.push(descendant);
                });
                return {
                  v: NodeList
                };
              }();

              if ((typeof _ret4 === 'undefined' ? 'undefined' : _typeof(_ret4)) === "object") return _ret4.v;
            }
            return typeof node === 'function' ? node(validate) : getAncestor(node, root, validate);
          };
          break;

        // tag: '...'
        default:
          validate = function validate(node) {
            return node.name === type;
          };
          instruction = function checkTag(node, root) {
            if (discover) {
              var _ret5 = function () {
                var NodeList = [];
                traverseDescendants([node], function (descendant) {
                  if (validate(descendant)) {
                    NodeList.push(descendant);
                  }
                });
                return {
                  v: NodeList
                };
              }();

              if ((typeof _ret5 === 'undefined' ? 'undefined' : _typeof(_ret5)) === "object") return _ret5.v;
            }
            return typeof node === 'function' ? node(validate) : getAncestor(node, root, validate);
          };
      }
    })();

    if (!pseudo) {
      return instruction;
    }

    var rule = pseudo.match(/-(child|type)\((\d+)\)$/);
    var kind = rule[1];
    var index = parseInt(rule[2], 10) - 1;

    var validatePseudo = function validatePseudo(node) {
      if (node) {
        var compareSet = node.parent.childTags;
        if (kind === 'type') {
          compareSet = compareSet.filter(validate);
        }
        var nodeIndex = compareSet.findIndex(function (child) {
          return child === node;
        });
        if (nodeIndex === index) {
          return true;
        }
      }
      return false;
    };

    return function enhanceInstruction(node) {
      var match = instruction(node);
      if (discover) {
        return match.reduce(function (NodeList, matchedNode) {
          if (validatePseudo(matchedNode)) {
            NodeList.push(matchedNode);
          }
          return NodeList;
        }, []);
      }
      return validatePseudo(match) && match;
    };
  });
}

/**
 * Recursive walki
 * @param  {[type]} nodes   [description]
 * @param  {[type]} handler [description]
 * @return {[type]}         [description]
 */
function traverseDescendants(nodes, handler) {
  nodes.forEach(function (node) {
    var progress = true;
    handler(node, function () {
      return progress = false;
    });
    if (node.childTags && progress) {
      traverseDescendants(node.childTags, handler);
    }
  });
}

/**
 * [getAncestor description]
 * @param  {[type]} node     [description]
 * @param  {[type]} root     [description]
 * @param  {[type]} validate [description]
 * @return {[type]}          [description]
 */
function getAncestor(node, root, validate) {
  while (node.parent) {
    node = node.parent;
    if (validate(node)) {
      return node;
    }
    if (node === root) {
      break;
    }
  }
  return null;
}
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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OUIsRUFBcUMsT0FBckMsRUFBOEM7QUFDNUMsUUFBTSxPQUFOLENBQWMsVUFBQyxJQUFELEVBQVU7QUFDdEIsUUFBSSxXQUFXLElBQWY7QUFDQSxZQUFRLElBQVIsRUFBYztBQUFBLGFBQU0sV0FBVyxLQUFqQjtBQUFBLEtBQWQ7QUFDQSxRQUFJLEtBQUssU0FBTCxJQUFrQixRQUF0QixFQUFnQztBQUM5QiwwQkFBb0IsS0FBSyxTQUF6QixFQUFvQyxPQUFwQztBQUNEO0FBQ0YsR0FORDtBQU9EOztBQUVEOzs7Ozs7O0FBT0EsU0FBUyxXQUFULENBQXNCLElBQXRCLEVBQTRCLElBQTVCLEVBQWtDLFFBQWxDLEVBQTRDO0FBQzFDLFNBQU8sS0FBSyxNQUFaLEVBQW9CO0FBQ2xCLFdBQU8sS0FBSyxNQUFaO0FBQ0EsUUFBSSxTQUFTLElBQVQsQ0FBSixFQUFvQjtBQUNsQixhQUFPLElBQVA7QUFDRDtBQUNELFFBQUksU0FBUyxJQUFiLEVBQW1CO0FBQ2pCO0FBQ0Q7QUFDRjtBQUNELFNBQU8sSUFBUDtBQUNEIiwiZmlsZSI6ImFkYXB0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiAjIFVuaXZlcnNhbFxuICpcbiAqIENoZWNrIGFuZCBleHRlbmQgdGhlIGVudmlyb25tZW50IGZvciB1bml2ZXJzYWwgdXNhZ2VcbiAqL1xuXG4vKipcbiAqIFthZGFwdCBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge1t0eXBlXX0gZWxlbWVudCBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IG9wdGlvbnMgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gYWRhcHQgKGVsZW1lbnQsIG9wdGlvbnMpIHtcblxuICAvLyBkZXRlY3QgZW52aXJvbm1lbnQgc2V0dXBcbiAgaWYgKGdsb2JhbC5kb2N1bWVudCkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgY29uc3QgeyBjb250ZXh0IH0gPSBvcHRpb25zXG5cbiAgZ2xvYmFsLmRvY3VtZW50ID0gY29udGV4dCB8fCAoKCkgPT4ge1xuICAgIHZhciByb290ID0gZWxlbWVudFxuICAgIHdoaWxlIChyb290LnBhcmVudCkge1xuICAgICAgcm9vdCA9IHJvb3QucGFyZW50XG4gICAgfVxuICAgIHJldHVybiByb290XG4gIH0pKClcblxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZmI1NS9kb21oYW5kbGVyL2Jsb2IvbWFzdGVyL2luZGV4LmpzI0w3NVxuICBjb25zdCBFbGVtZW50UHJvdG90eXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGdsb2JhbC5kb2N1bWVudClcblxuICAvLyBhbHRlcm5hdGl2ZSBkZXNjcmlwdG9yIHRvIGFjY2VzcyBlbGVtZW50cyB3aXRoIGZpbHRlcmluZyBpbnZhbGlkIGVsZW1lbnRzIChlLmcuIHRleHRub2RlcylcbiAgaWYgKCFPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEVsZW1lbnRQcm90b3R5cGUsICdjaGlsZFRhZ3MnKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFbGVtZW50UHJvdG90eXBlLCAnY2hpbGRUYWdzJywge1xuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGdldCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuLmZpbHRlcigobm9kZSkgPT4ge1xuICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYjU1L2RvbWVsZW1lbnR0eXBlL2Jsb2IvbWFzdGVyL2luZGV4LmpzI0wxMlxuICAgICAgICAgIHJldHVybiBub2RlLnR5cGUgPT09ICd0YWcnIHx8IG5vZGUudHlwZSA9PT0gJ3NjcmlwdCcgfHwgbm9kZS50eXBlID09PSAnc3R5bGUnXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGlmICghT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihFbGVtZW50UHJvdG90eXBlLCAnYXR0cmlidXRlcycpKSB7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnQvYXR0cmlidXRlc1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9OYW1lZE5vZGVNYXBcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRWxlbWVudFByb3RvdHlwZSwgJ2F0dHJpYnV0ZXMnLCB7XG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0ICgpIHtcbiAgICAgICAgY29uc3QgeyBhdHRyaWJzIH0gPSB0aGlzXG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZXNOYW1lcyA9IE9iamVjdC5rZXlzKGF0dHJpYnMpXG4gICAgICAgIGNvbnN0IE5hbWVkTm9kZU1hcCA9IGF0dHJpYnV0ZXNOYW1lcy5yZWR1Y2UoKGF0dHJpYnV0ZXMsIGF0dHJpYnV0ZU5hbWUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgYXR0cmlidXRlc1tpbmRleF0gPSB7XG4gICAgICAgICAgICBuYW1lOiBhdHRyaWJ1dGVOYW1lLFxuICAgICAgICAgICAgdmFsdWU6IGF0dHJpYnNbYXR0cmlidXRlTmFtZV1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXNcbiAgICAgICAgfSwgeyB9KVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTmFtZWROb2RlTWFwLCAnbGVuZ3RoJywge1xuICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgICAgdmFsdWU6IGF0dHJpYnV0ZXNOYW1lcy5sZW5ndGhcbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuIE5hbWVkTm9kZU1hcFxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBpZiAoIUVsZW1lbnRQcm90b3R5cGUuZ2V0QXR0cmlidXRlKSB7XG4gICAgLy8gaHR0cHM6Ly9kb2NzLndlYnBsYXRmb3JtLm9yZy93aWtpL2RvbS9FbGVtZW50L2dldEF0dHJpYnV0ZVxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50L2dldEF0dHJpYnV0ZVxuICAgIEVsZW1lbnRQcm90b3R5cGUuZ2V0QXR0cmlidXRlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmF0dHJpYnNbbmFtZV0gfHwgbnVsbFxuICAgIH1cbiAgfVxuXG4gIGlmICghRWxlbWVudFByb3RvdHlwZS5nZXRFbGVtZW50c0J5VGFnTmFtZSkge1xuICAgIC8vIGh0dHBzOi8vZG9jcy53ZWJwbGF0Zm9ybS5vcmcvd2lraS9kb20vRG9jdW1lbnQvZ2V0RWxlbWVudHNCeVRhZ05hbWVcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudC9nZXRFbGVtZW50c0J5VGFnTmFtZVxuICAgIEVsZW1lbnRQcm90b3R5cGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUgPSBmdW5jdGlvbiAodGFnTmFtZSkge1xuICAgICAgY29uc3QgSFRNTENvbGxlY3Rpb24gPSBbXVxuICAgICAgdHJhdmVyc2VEZXNjZW5kYW50cyh0aGlzLmNoaWxkVGFncywgKGRlc2NlbmRhbnQpID0+IHtcbiAgICAgICAgaWYgKGRlc2NlbmRhbnQubmFtZSA9PT0gdGFnTmFtZSB8fCB0YWdOYW1lID09PSAnKicpIHtcbiAgICAgICAgICBIVE1MQ29sbGVjdGlvbi5wdXNoKGRlc2NlbmRhbnQpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICByZXR1cm4gSFRNTENvbGxlY3Rpb25cbiAgICB9XG4gIH1cblxuICBpZiAoIUVsZW1lbnRQcm90b3R5cGUuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSkge1xuICAgIC8vIGh0dHBzOi8vZG9jcy53ZWJwbGF0Zm9ybS5vcmcvd2lraS9kb20vRG9jdW1lbnQvZ2V0RWxlbWVudHNCeUNsYXNzTmFtZVxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50L2dldEVsZW1lbnRzQnlDbGFzc05hbWVcbiAgICBFbGVtZW50UHJvdG90eXBlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUgPSBmdW5jdGlvbiAoY2xhc3NOYW1lKSB7XG4gICAgICBjb25zdCBuYW1lcyA9IGNsYXNzTmFtZS50cmltKCkucmVwbGFjZSgvXFxzKy9nLCAnICcpLnNwbGl0KCcgJylcbiAgICAgIGNvbnN0IEhUTUxDb2xsZWN0aW9uID0gW11cbiAgICAgIHRyYXZlcnNlRGVzY2VuZGFudHMoW3RoaXNdLCAoZGVzY2VuZGFudCkgPT4ge1xuICAgICAgICBjb25zdCBkZXNjZW5kYW50Q2xhc3NOYW1lID0gZGVzY2VuZGFudC5hdHRyaWJzLmNsYXNzXG4gICAgICAgIGlmIChkZXNjZW5kYW50Q2xhc3NOYW1lICYmIG5hbWVzLmV2ZXJ5KChuYW1lKSA9PiBkZXNjZW5kYW50Q2xhc3NOYW1lLmluZGV4T2YobmFtZSkgPiAtMSkpIHtcbiAgICAgICAgICBIVE1MQ29sbGVjdGlvbi5wdXNoKGRlc2NlbmRhbnQpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICByZXR1cm4gSFRNTENvbGxlY3Rpb25cbiAgICB9XG4gIH1cblxuICBpZiAoIUVsZW1lbnRQcm90b3R5cGUucXVlcnlTZWxlY3RvckFsbCkge1xuICAgIC8vIGh0dHBzOi8vZG9jcy53ZWJwbGF0Zm9ybS5vcmcvd2lraS9jc3Mvc2VsZWN0b3JzX2FwaS9xdWVyeVNlbGVjdG9yQWxsXG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnQvcXVlcnlTZWxlY3RvckFsbFxuICAgIEVsZW1lbnRQcm90b3R5cGUucXVlcnlTZWxlY3RvckFsbCA9IGZ1bmN0aW9uIChzZWxlY3RvcnMpIHtcbiAgICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5yZXBsYWNlKC8oPikoXFxTKS9nLCAnJDEgJDInKS50cmltKCkgLy8gYWRkIHNwYWNlIGZvciAnPicgc2VsZWN0b3JcblxuICAgICAgLy8gdXNpbmcgcmlnaHQgdG8gbGVmdCBleGVjdXRpb24gPT4gaHR0cHM6Ly9naXRodWIuY29tL2ZiNTUvY3NzLXNlbGVjdCNob3ctZG9lcy1pdC13b3JrXG4gICAgICBjb25zdCBbZGlzY292ZXIsIC4uLmFzY2VuZGluZ3NdID0gZ2V0SW5zdHJ1Y3Rpb25zKHNlbGVjdG9ycylcbiAgICAgIGNvbnN0IHRvdGFsID0gYXNjZW5kaW5ncy5sZW5ndGhcbiAgICAgIHJldHVybiBkaXNjb3Zlcih0aGlzKS5maWx0ZXIoKG5vZGUpID0+IHtcbiAgICAgICAgdmFyIHN0ZXAgPSAwXG4gICAgICAgIHdoaWxlIChzdGVwIDwgdG90YWwpIHtcbiAgICAgICAgICBub2RlID0gYXNjZW5kaW5nc1tzdGVwXShub2RlLCB0aGlzKVxuICAgICAgICAgIGlmICghbm9kZSkgeyAvLyBoaWVyYXJjaHkgZG9lc24ndCBtYXRjaFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICAgIHN0ZXAgKz0gMVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGlmICghRWxlbWVudFByb3RvdHlwZS5jb250YWlucykge1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlL2NvbnRhaW5zXG4gICAgRWxlbWVudFByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICB2YXIgaW5jbHVzaXZlID0gZmFsc2VcbiAgICAgIHRyYXZlcnNlRGVzY2VuZGFudHMoW3RoaXNdLCAoZGVzY2VuZGFudCwgZG9uZSkgPT4ge1xuICAgICAgICBpZiAoZGVzY2VuZGFudCA9PT0gZWxlbWVudCkge1xuICAgICAgICAgIGluY2x1c2l2ZSA9IHRydWVcbiAgICAgICAgICBkb25lKClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIHJldHVybiBpbmNsdXNpdmVcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIFtnZXRJbnN0cnVjdGlvbnMgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IHNlbGVjdG9ycyBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGdldEluc3RydWN0aW9ucyAoc2VsZWN0b3JzKSB7XG4gIHJldHVybiBzZWxlY3RvcnMuc3BsaXQoJyAnKS5yZXZlcnNlKCkubWFwKChzZWxlY3Rvciwgc3RlcCkgPT4ge1xuICAgIGNvbnN0IGRpc2NvdmVyID0gc3RlcCA9PT0gMFxuICAgIGNvbnN0IFt0eXBlLCBwc2V1ZG9dID0gc2VsZWN0b3Iuc3BsaXQoJzonKVxuXG4gICAgdmFyIHZhbGlkYXRlID0gbnVsbFxuICAgIHZhciBpbnN0cnVjdGlvbiA9IG51bGxcblxuICAgIHN3aXRjaCAodHJ1ZSkge1xuXG4gICAgICAvLyBjaGlsZDogJz4nXG4gICAgICBjYXNlIC8+Ly50ZXN0KHR5cGUpOlxuICAgICAgICBpbnN0cnVjdGlvbiA9IGZ1bmN0aW9uIGNoZWNrUGFyZW50IChub2RlKSB7XG4gICAgICAgICAgcmV0dXJuICh2YWxpZGF0ZSkgPT4gdmFsaWRhdGUobm9kZS5wYXJlbnQpICYmIG5vZGUucGFyZW50XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcblxuICAgICAgLy8gY2xhc3M6ICcuJ1xuICAgICAgY2FzZSAvXlxcLi8udGVzdCh0eXBlKTpcbiAgICAgICAgY29uc3QgbmFtZXMgPSB0eXBlLnN1YnN0cigxKS5zcGxpdCgnLicpXG4gICAgICAgIHZhbGlkYXRlID0gKG5vZGUpID0+IHtcbiAgICAgICAgICBjb25zdCBub2RlQ2xhc3NOYW1lID0gbm9kZS5hdHRyaWJzLmNsYXNzXG4gICAgICAgICAgcmV0dXJuIG5vZGVDbGFzc05hbWUgJiYgbmFtZXMuZXZlcnkoKG5hbWUpID0+IG5vZGVDbGFzc05hbWUuaW5kZXhPZihuYW1lKSA+IC0xKVxuICAgICAgICB9XG4gICAgICAgIGluc3RydWN0aW9uID0gZnVuY3Rpb24gY2hlY2tDbGFzcyAobm9kZSwgcm9vdCkge1xuICAgICAgICAgIGlmIChkaXNjb3Zlcikge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShuYW1lcy5qb2luKCcgJykpXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAodHlwZW9mIG5vZGUgPT09ICdmdW5jdGlvbicpID8gbm9kZSh2YWxpZGF0ZSkgOiBnZXRBbmNlc3Rvcihub2RlLCByb290LCB2YWxpZGF0ZSlcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuXG4gICAgICAvLyBhdHRyaWJ1dGU6ICdba2V5PVwidmFsdWVcIl0nXG4gICAgICBjYXNlIC9eXFxbLy50ZXN0KHR5cGUpOlxuICAgICAgICBjb25zdCBbYXR0cmlidXRlS2V5LCBhdHRyaWJ1dGVWYWx1ZV0gPSB0eXBlLnJlcGxhY2UoL1xcW3xcXF18XCIvZywgJycpLnNwbGl0KCc9JylcbiAgICAgICAgdmFsaWRhdGUgPSAobm9kZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGhhc0F0dHJpYnV0ZSA9IE9iamVjdC5rZXlzKG5vZGUuYXR0cmlicykuaW5kZXhPZihhdHRyaWJ1dGVLZXkpID4gLTFcbiAgICAgICAgICBpZiAoaGFzQXR0cmlidXRlKSB7IC8vIHJlZ2FyZCBvcHRpb25hbCBhdHRyaWJ1dGVWYWx1ZVxuICAgICAgICAgICAgaWYgKCFhdHRyaWJ1dGVWYWx1ZSB8fCAobm9kZS5hdHRyaWJzW2F0dHJpYnV0ZUtleV0gPT09IGF0dHJpYnV0ZVZhbHVlKSkge1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICBpbnN0cnVjdGlvbiA9IGZ1bmN0aW9uIGNoZWNrQXR0cmlidXRlIChub2RlLCByb290KSB7XG4gICAgICAgICAgaWYgKGRpc2NvdmVyKSB7XG4gICAgICAgICAgICBjb25zdCBOb2RlTGlzdCA9IFtdXG4gICAgICAgICAgICB0cmF2ZXJzZURlc2NlbmRhbnRzKFtub2RlXSwgKGRlc2NlbmRhbnQpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHZhbGlkYXRlKGRlc2NlbmRhbnQpKSB7XG4gICAgICAgICAgICAgICAgTm9kZUxpc3QucHVzaChkZXNjZW5kYW50KVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuIE5vZGVMaXN0XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAodHlwZW9mIG5vZGUgPT09ICdmdW5jdGlvbicpID8gbm9kZSh2YWxpZGF0ZSkgOiBnZXRBbmNlc3Rvcihub2RlLCByb290LCB2YWxpZGF0ZSlcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuXG4gICAgICAvLyBpZDogJyMnXG4gICAgICBjYXNlIC9eIy8udGVzdCh0eXBlKTpcbiAgICAgICAgY29uc3QgaWQgPSB0eXBlLnN1YnN0cigxKVxuICAgICAgICB2YWxpZGF0ZSA9IChub2RlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIG5vZGUuYXR0cmlicy5pZCA9PT0gaWRcbiAgICAgICAgfVxuICAgICAgICBpbnN0cnVjdGlvbiA9IGZ1bmN0aW9uIGNoZWNrSWQgKG5vZGUsIHJvb3QpIHtcbiAgICAgICAgICBpZiAoZGlzY292ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IE5vZGVMaXN0ID0gW11cbiAgICAgICAgICAgIHRyYXZlcnNlRGVzY2VuZGFudHMoW25vZGVdLCAoZGVzY2VuZGFudCwgZG9uZSkgPT4ge1xuICAgICAgICAgICAgICBpZiAodmFsaWRhdGUoZGVzY2VuZGFudCkpIHtcbiAgICAgICAgICAgICAgICBOb2RlTGlzdC5wdXNoKGRlc2NlbmRhbnQpXG4gICAgICAgICAgICAgICAgZG9uZSgpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICByZXR1cm4gTm9kZUxpc3RcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICh0eXBlb2Ygbm9kZSA9PT0gJ2Z1bmN0aW9uJykgPyBub2RlKHZhbGlkYXRlKSA6IGdldEFuY2VzdG9yKG5vZGUsIHJvb3QsIHZhbGlkYXRlKVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG5cbiAgICAgIC8vIHVuaXZlcnNhbDogJyonXG4gICAgICBjYXNlIC9cXCovLnRlc3QodHlwZSk6XG4gICAgICAgIHZhbGlkYXRlID0gKG5vZGUpID0+IHRydWVcbiAgICAgICAgaW5zdHJ1Y3Rpb24gPSBmdW5jdGlvbiBjaGVja1VuaXZlcnNhbCAobm9kZSwgcm9vdCkge1xuICAgICAgICAgIGlmIChkaXNjb3Zlcikge1xuICAgICAgICAgICAgY29uc3QgTm9kZUxpc3QgPSBbXVxuICAgICAgICAgICAgdHJhdmVyc2VEZXNjZW5kYW50cyhbbm9kZV0sIChkZXNjZW5kYW50KSA9PiBOb2RlTGlzdC5wdXNoKGRlc2NlbmRhbnQpKVxuICAgICAgICAgICAgcmV0dXJuIE5vZGVMaXN0XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAodHlwZW9mIG5vZGUgPT09ICdmdW5jdGlvbicpID8gbm9kZSh2YWxpZGF0ZSkgOiBnZXRBbmNlc3Rvcihub2RlLCByb290LCB2YWxpZGF0ZSlcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuXG4gICAgICAvLyB0YWc6ICcuLi4nXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB2YWxpZGF0ZSA9IChub2RlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIG5vZGUubmFtZSA9PT0gdHlwZVxuICAgICAgICB9XG4gICAgICAgIGluc3RydWN0aW9uID0gZnVuY3Rpb24gY2hlY2tUYWcgKG5vZGUsIHJvb3QpIHtcbiAgICAgICAgICBpZiAoZGlzY292ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IE5vZGVMaXN0ID0gW11cbiAgICAgICAgICAgIHRyYXZlcnNlRGVzY2VuZGFudHMoW25vZGVdLCAoZGVzY2VuZGFudCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodmFsaWRhdGUoZGVzY2VuZGFudCkpIHtcbiAgICAgICAgICAgICAgICBOb2RlTGlzdC5wdXNoKGRlc2NlbmRhbnQpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICByZXR1cm4gTm9kZUxpc3RcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICh0eXBlb2Ygbm9kZSA9PT0gJ2Z1bmN0aW9uJykgPyBub2RlKHZhbGlkYXRlKSA6IGdldEFuY2VzdG9yKG5vZGUsIHJvb3QsIHZhbGlkYXRlKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFwc2V1ZG8pIHtcbiAgICAgIHJldHVybiBpbnN0cnVjdGlvblxuICAgIH1cblxuICAgIGNvbnN0IHJ1bGUgPSBwc2V1ZG8ubWF0Y2goLy0oY2hpbGR8dHlwZSlcXCgoXFxkKylcXCkkLylcbiAgICBjb25zdCBraW5kID0gcnVsZVsxXVxuICAgIGNvbnN0IGluZGV4ID0gcGFyc2VJbnQocnVsZVsyXSwgMTApIC0gMVxuXG4gICAgY29uc3QgdmFsaWRhdGVQc2V1ZG8gPSAobm9kZSkgPT4ge1xuICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgdmFyIGNvbXBhcmVTZXQgPSBub2RlLnBhcmVudC5jaGlsZFRhZ3NcbiAgICAgICAgaWYgKGtpbmQgPT09ICd0eXBlJykge1xuICAgICAgICAgIGNvbXBhcmVTZXQgPSBjb21wYXJlU2V0LmZpbHRlcih2YWxpZGF0ZSlcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBub2RlSW5kZXggPSBjb21wYXJlU2V0LmZpbmRJbmRleCgoY2hpbGQpID0+IGNoaWxkID09PSBub2RlKVxuICAgICAgICBpZiAobm9kZUluZGV4ID09PSBpbmRleCkge1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBlbmhhbmNlSW5zdHJ1Y3Rpb24gKG5vZGUpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gaW5zdHJ1Y3Rpb24obm9kZSlcbiAgICAgIGlmIChkaXNjb3Zlcikge1xuICAgICAgICByZXR1cm4gbWF0Y2gucmVkdWNlKChOb2RlTGlzdCwgbWF0Y2hlZE5vZGUpID0+IHtcbiAgICAgICAgICBpZiAodmFsaWRhdGVQc2V1ZG8obWF0Y2hlZE5vZGUpKSB7XG4gICAgICAgICAgICBOb2RlTGlzdC5wdXNoKG1hdGNoZWROb2RlKVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gTm9kZUxpc3RcbiAgICAgICAgfSwgW10pXG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsaWRhdGVQc2V1ZG8obWF0Y2gpICYmIG1hdGNoXG4gICAgfVxuICB9KVxufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZSB3YWxraVxuICogQHBhcmFtICB7W3R5cGVdfSBub2RlcyAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge1t0eXBlXX0gaGFuZGxlciBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiB0cmF2ZXJzZURlc2NlbmRhbnRzIChub2RlcywgaGFuZGxlcikge1xuICBub2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgdmFyIHByb2dyZXNzID0gdHJ1ZVxuICAgIGhhbmRsZXIobm9kZSwgKCkgPT4gcHJvZ3Jlc3MgPSBmYWxzZSlcbiAgICBpZiAobm9kZS5jaGlsZFRhZ3MgJiYgcHJvZ3Jlc3MpIHtcbiAgICAgIHRyYXZlcnNlRGVzY2VuZGFudHMobm9kZS5jaGlsZFRhZ3MsIGhhbmRsZXIpXG4gICAgfVxuICB9KVxufVxuXG4vKipcbiAqIFtnZXRBbmNlc3RvciBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge1t0eXBlXX0gbm9kZSAgICAgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7W3R5cGVdfSByb290ICAgICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IHZhbGlkYXRlIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBnZXRBbmNlc3RvciAobm9kZSwgcm9vdCwgdmFsaWRhdGUpIHtcbiAgd2hpbGUgKG5vZGUucGFyZW50KSB7XG4gICAgbm9kZSA9IG5vZGUucGFyZW50XG4gICAgaWYgKHZhbGlkYXRlKG5vZGUpKSB7XG4gICAgICByZXR1cm4gbm9kZVxuICAgIH1cbiAgICBpZiAobm9kZSA9PT0gcm9vdCkge1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
