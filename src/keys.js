(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['@clubajax/on'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('@clubajax/on'));
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
        root['keys'] = factory(root.on);
    }
}(this, function (on) {

    'use strict';
    function keys(listNode, options) {

        options = options || {};

        // TODO options:
        // search an option and/or a function?
        // space select an option?

        const
            controller = {
                log: false,
                setSelected: function (node) {
                    console.log('setSel', node);
                    select(node);
                },
                getSelected: function () {
                    return selected;
                },
                remove: function () {
                    this.destroy();
                },
                destroy: function () {
                    console.log('DESTROY');
                    shift = false;
                    meta = false;
                    select();
                    unhighlight();
                    this.handles.forEach(function (h) {h.remove();});

                    if (observer) {
                        observer.disconnect();
                    }
                }
            },
            tableMode = listNode.localName === 'table',
            canSelectNone = options.canSelectNone !== undefined ? options.canSelectNone : true,
            multiple = options.multiple,
            searchStringTime = options.searchTime || 1000,
            // children is a live NodeList, so the reference will update if nodes are added or removed
            children = tableMode ? listNode.querySelectorAll('td') : listNode.children;

        let
            shift = false,
            meta = false,
            multiHandle,
            observer,
            searchString = '',
            searchStringTimer,
            pivotNode,
            selected,
            highlighted;

        selected = select(getSelected(children, options), false, true),
            highlighted = highlight(fromArray(selected), options.defaultToFirst);

        const nodeType = (highlighted || children[0]).localName;

        function unhighlight() {
            if (highlighted) {
                highlighted.removeAttribute('tab-index');
                highlighted.removeAttribute('aria-current');
                highlighted.blur();
            }
        }

        function highlight(node, defaultToFirst) {
            node = fromArray(node);
            unhighlight();
            if (!node) {
                if (!children[0] || !defaultToFirst) {
                    return;
                }
                node = children[0];
            }
            highlighted = node;
            highlighted.setAttribute('tab-index', "-1");
            highlighted.setAttribute('aria-current', "true");
            highlighted.focus();
            on.fire(listNode, 'key-highlight', {value: highlighted}, true);
            return highlighted;
        }

        function select(node, keyboardMode, noNullEvent) {
            // keyboardMode: arrow + meta
            const clearSelection = !shift && !meta; // multiple; // && node && (keyboardMode || shift || meta || Array.isArray(node));
            if (clearSelection && selected) {
                console.log(' *clr');
                toArray(selected).forEach(function (sel) {
                    sel.removeAttribute('aria-selected');
                });
                selected = multiple ? [] : null;
            }
            if (node && multiple) {
                console.log(' --- ', selected);
                selected = toArray(selected);
                console.log(' --- ', selected);
                if (shift && !Array.isArray(node)) {
                    console.log('shift.add', node, 'to', selected);
                    selected = findShiftNodes(children, node, pivotNode);
                    console.log('shift nodes', selected);
                } else if (meta || shift) {
                    selected = [...selected, ...toArray(node)];
                    console.log('meta', selected);
                    selected.forEach(function (sel) {
                        sel.setAttribute('aria-selected', 'true');
                    });
                } else if (Array.isArray(node)) {
                    console.log('mult add');
                    selected = [];
                    node.forEach(function (n) {
                        n.setAttribute('aria-selected', 'true');
                    });
                    selected = selected.concat(node);
                } else if (node) {
                    console.log('single', selected);
                    node.setAttribute('aria-selected', 'true');
                    selected.push(node);
                }
            } else if (node) {
                if (selected) {
                    selected.removeAttribute('aria-selected');
                }
                if (node) {
                    selected = node;
                    selected.setAttribute('aria-selected', 'true');
                }
            }
            if (noNullEvent && !selected) {
                return selected;
            }
            if (multiple && !selected) {
                selected = [];
            }
            on.fire(listNode, 'key-select', {value: selected}, true);

            return selected;
        }

        function scrollTo() {
            if (!highlighted) {
                return;
            }
            let top = highlighted.offsetTop;
            let height = highlighted.offsetHeight;
            let listHeight = listNode.offsetHeight;

            if (top - height < listNode.scrollTop) {
                listNode.scrollTop = top - height;
            } else if (top + height * 2 > listNode.scrollTop + listHeight) {
                listNode.scrollTop = top - listHeight + height * 2;
            }
        }

        controller.handles = [
            on(listNode, 'mousedown', nodeType, function (e, node) {
                listNode.focus();
                highlight(node);
                select(node);
                e.preventDefault();
            }),
            on(listNode, 'mouseup', nodeType, function (e, node) {
                if (!shift && !meta) {
                    pivotNode = node;
                }
            }),
            on(document, 'keyup', function (e) {
                if (e.defaultPrevented) {
                    return;
                }
                shift = Boolean(e.shiftKey);
                meta = false;
            }),
            on(listNode, 'keydown', function (e) {
                if (e.defaultPrevented) {
                    return;
                }
                switch (e.key) {
                    case 'Meta':
                    case 'Control':
                    case 'Command':
                        meta = true;
                        break;
                    case 'Shift':
                        shift = true;
                        break;
                }
            }),
            on(listNode, 'keydown', function (e) {
                if (e.defaultPrevented) {
                    return;
                }
                switch (e.key) {
                    case 'Enter':
                        select(highlighted);
                        pivotNode = highlighted;
                        break;
                    case 'Escape':
                        if (canSelectNone) {
                            select(null);
                        }
                        break;

                    case 'ArrowDown':
                        if (tableMode) {
                            highlight(getCell(children, highlighted || selected, 'down'));
                            break;
                        } else {
                            const node = getNode(children, highlighted || selected, 'down');
                            highlight(node);
                            if (multiple && (shift || meta)) {
                                pivotNode = pivotNode || node;
                                select(node, true);
                            }
                        }
                        scrollTo();
                        e.preventDefault();
                    // fallthrough
                    case 'ArrowRight':
                        if (tableMode) {
                            highlight(getNode(children, highlighted || selected, 'down'));
                        }
                        break;

                    case 'ArrowUp':
                        if (tableMode) {
                            highlight(getCell(children, highlighted || selected, 'up'));
                            e.preventDefault();
                            break;
                        } else {
                            const node = getNode(children, highlighted || selected, 'up');
                            highlight(node);
                            if (multiple && (shift || meta)) {
                                pivotNode = pivotNode || node;
                                select(node, true);
                            }
                        }
                        scrollTo();
                        e.preventDefault();
                    //fallthrough
                    case 'ArrowLeft':
                        if (tableMode) {
                            highlight(getNode(children, highlighted || selected, 'up'));
                        }
                        break;
                    default:
                        // the event is not handled
                        if (on.isAlphaNumeric(e.key)) {
                            if (e.key === 'r' && meta) {
                                return true;
                            }
                            searchString += e.key;
                            let searchNode = searchHtmlContent(children, searchString);
                            if (searchNode) {
                                highlight(select(searchNode));
                                scrollTo();
                            }

                            clearTimeout(searchStringTimer);
                            searchStringTimer = setTimeout(function () {
                                searchString = '';
                            }, searchStringTime);

                            break;
                        }
                        return;
                }
            }),
            on(listNode, 'blur', unhighlight),
            {
                pause: function () {if (controller.log) {console.log('pause');} },
                resume: function () {if (controller.log) {console.log('resume');} },
                remove: function () {if (controller.log) {console.log('remove');} }
            }
        ];

        if (!options.noRoles) {
            addRoles(listNode);
            if (typeof MutationObserver !== 'undefined') {
                observer = new MutationObserver(function (mutations) {
                    mutations.forEach(function (event) {
                        if (event.type === 'childList') {
                            on.fire(listNode, 'key-dom-change', event, true);
                        }
                        if (event.addedNodes.length) {
                            addRoles(listNode);
                        }
                    });
                });
                observer.observe(listNode, {childList: true});
            }
        }

        scrollTo();

        multiHandle = on.makeMultiHandle(controller.handles);
        Object.keys(multiHandle).forEach(function (key) {
            controller[key] = multiHandle[key];
        });

        controller._resume = controller.resume;

        controller.resume = function () {
            scrollTo();
            controller._resume();
        };

        return controller;
    }

    function isSelected(node) {
        if (!node) {
            return false;
        }
        return node.hasAttribute('aria-selected');
    }

    function getSelected(children, options) {
        const mult = [];
        for (let i = 0; i < children.length; i++) {
            if (isSelected(children[i])) {
                if (options.multiple) {
                    mult.push(children[i]);
                } else {
                    return children[i];
                }
            }
        }
        return mult.length ? mult : options.defaultToFirst ? children[0] : null;
    }

    function getNext(children, index) {
        let norecurse = children.length + 2;
        let node = children[index];
        while (node) {
            index++;
            if (index > children.length - 1) {
                index = -1;
            } else if (isElligible(children, index)) {
                node = children[index];
                break;
            }
            if (norecurse-- < 0) {
                console.warn('recurse');
                return getFirstElligible(children);
            }
        }
        return node || children[0];
    }

    function getPrev(children, index) {
        let norecurse = children.length + 2;
        let node = children[index];
        while (node) {
            index--;
            if (index < 0) {
                index = children.length;
            } else if (isElligible(children, index)) {
                node = children[index];
                break;
            }
            if (norecurse-- < 0) {
                console.warn('recurse');
                return getLastElligible(children);
            }
        }
        return node || children[children.length - 1];
    }

    function isVisible(node) {
        return node.style.display !== 'none' && node.offsetHeight && node.offsetWidth;
    }

    function getFirstElligible(children) {
        for (let i = 0; i < children.length; i++) {
            if (isElligible(children, i)) {
                return children[i];
            }
        }
        return null;
    }

    function getLastElligible(children) {
        for (let i = children.length - 1; i >= 0; i--) {
            if (isElligible(children, i)) {
                return children[i];
            }
        }
        return null;
    }

    function isElligible(children, index) {
        return children[index] && !children[index].parentNode.disabled && isVisible(children[index]);
    }

    function getNode(children, highlighted, dir) {
        let index = -1;
        for (let i = 0; i < children.length; i++) {
            if (children[i] === highlighted) {
                index = i;
                break;
            }
        }
        if (dir === 'down') {
            return getNext(children, index);
        } else if (dir === 'up') {
            return getPrev(children, index);
        }
    }

    function getCell(children, highlighted, dir) {
        let
            cellIndex = getIndex(highlighted),
            row = highlighted.parentNode,
            rowIndex = getIndex(row),
            rowAmount = row.parentNode.rows.length;

        if (dir === 'down') {
            if (rowIndex + 1 < rowAmount) {
                return row.parentNode.rows[rowIndex + 1].cells[cellIndex];
            }
            return row.parentNode.rows[0].cells[cellIndex];
        } else if (dir === 'up') {
            if (rowIndex > 0) {
                return row.parentNode.rows[rowIndex - 1].cells[cellIndex];
            }
            return row.parentNode.rows[rowAmount - 1].cells[cellIndex];
        }
    }

    function getIndex(el) {
        let i, p = el.parentNode;
        for (i = 0; i < p.children.length; i++) {
            if (p.children[i] === el) {
                return i;
            }
        }
        return null;
    }

    function searchHtmlContent(children, str) {
        str = str.toLowerCase();
        for (let i = 0; i < children.length; i++) {
            if (children[i].innerHTML.toLowerCase().indexOf(str) === 0) {
                return children[i];
            }
        }
        return null;
    }

    function findShiftNodes(children, node, pivotNode) {
        console.log('findShiftNodes', node, pivotNode);
        const selection = [];
        if (!pivotNode) {
            toArray(node).forEach(function (n) {
                n.setAttribute('aria-selected', 'true');
                selection.push(n);
            });
            return selection;
        }
        const pivotIndex = getIndex(pivotNode);
        const newIndex = getIndex(node);
        let beg, end;
        if (newIndex < pivotIndex) {
            beg = newIndex;
            end = pivotIndex;
        } else {
            beg = pivotIndex;
            end = newIndex;
        }
        toArray(children).forEach(function (child, i) {
            if (i >= beg && i <= end) {
                child.setAttribute('aria-selected', 'true'); 
                selection.push(child);
            } else {
                child.removeAttribute('aria-selected');
            }
        });
        return selection;
    }

    function addRoles(node) {
        // https://www.w3.org/TR/wai-aria/roles#listbox
        for (let i = 0; i < node.children.length; i++) {
            node.children[i].setAttribute('role', 'listitem');
        }
        node.setAttribute('role', 'listbox');
    }

    function fromArray(thing) {
        return Array.isArray(thing) ? thing[0] : thing;
    }

    function toArray(thing) {
        if (!thing) {
            return [];
        }
        if (thing instanceof NodeList || thing instanceof HTMLCollection) {
            return Array.prototype.slice.call(thing);
        }
        return Array.isArray(thing) ? thing : [thing];
    }

    return keys;

}));
