(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['on'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('on'));
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
        root['keys'] = factory(root.on);
    }
}(this, function (on) {
        
        'use strict';

        function keys (listNode, options) {

            options = options || {};

            // TODO options:
            // search an option and/or a function?
            // space select an option?
            // add aria

            var
                controller = {
                    setSelected: function (node) {
                        highlight(select(node));
                        on.fire(listNode, 'key-select', {value: selected});
                    },
                    getSelected: function () {
                        return selected;
                    },
                    destroy: function () {
                        select();
                        highlight();
                        this.handles.forEach(function (h) { h.remove(); });
                        if(observer) {
                            observer.disconnect();
                        }
                    }
                },
                tableMode = listNode.localName === 'table',
                canSelectNone = options.canSelectNone !== undefined ? options.canSelectNone : true,
                shift = false,
                meta = false,
                observer,
                searchString = '',
                searchStringTimer,
                searchStringTime = options.searchTime || 1000,
                // children is a live NodeList, so the reference will update if nodes are added or removed
                children = tableMode ? listNode.querySelectorAll('td') : listNode.children,
                selected = select(getSelected(children, options.noDefault)),
                highlighted = highlight(fromArray(selected)),
                nodeType = (highlighted || children[0]).localName;

            function highlight (node) {
                node = fromArray(node);
                if(highlighted){
                    highlighted.removeAttribute('highlighted');
                }
                if(node) {
                    highlighted = node;
                    highlighted.setAttribute('highlighted', 'true');
                }
                return highlighted;
            }

            function select (node) {
                if(options.multiple){
                    if(selected){
                        if(!shift && !meta) {
                            selected.forEach(function (sel) {
                                sel.removeAttribute('selected');
                            });

                            if (node) {
                                selected = [node];
                                node.setAttribute('selected', 'true');
                            }
                        }
                        else if(shift && node){
                            selected = findShiftNodes(children, selected, node);
                        }
                        else if(meta && node){

                            if(!selected){
                                selected = [node];
                            }else{
                                selected.push(node);
                            }
                            node.setAttribute('selected', 'true');
                        }
                    }else{
                        selected = [node];
                    }

                }else{
                	if(selected){
                        selected.removeAttribute('selected');
                    }
                    if(node) {
                        selected = node;
                        selected.setAttribute('selected', 'true');
                    }
                }
                return selected;
            }

            on.fire(listNode, 'key-highlight', {value: highlighted});
            on.fire(listNode, 'key-select', {value: highlighted});

            controller.handles = [
                on(listNode, 'mouseover', nodeType, function (e, node) {
                    highlight(node);
                    on.fire(listNode, 'key-highlight', {value: highlighted});
                }),
                on(listNode, 'mouseout', function (e) {
                    highlight(null);
                    on.fire(listNode, 'key-highlight', {value: null});
                }),
                on(listNode, 'blur', function (e) {
                    highlight(null);
                    on.fire(listNode, 'key-highlight', {value: null});
                }),
                on(listNode, 'click', nodeType, function (e, node) {
                    highlight(node);
                    select(node);
                    on.fire(listNode, 'key-select', {value: selected});
                }),
                on(document, 'keyup', function (e) {
                    if (e.defaultPrevented) { return; }
                    shift = false;
                    meta = false;
                }),
                on(document, 'keydown', function (e) {
                    if (e.defaultPrevented) { return; }
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
                    if (e.defaultPrevented) { return; }

                    switch (e.key) {
                        case 'Enter':
                            select(highlighted);
                            on.fire(listNode, 'key-select', {value: selected});
                            break;
                        case 'Escape':
                            if(canSelectNone) {
                                select(null);
                            }
                            break;

                        case 'ArrowDown':
                            if(tableMode){
                                console.log('table!');
                                highlight(getCell(children, highlighted || selected, 'down'));
                                on.fire(listNode, 'key-highlight', {value: highlighted});
                                break;
                            }
                        case 'ArrowRight':
                            highlight(getNode(children, highlighted || selected, 'down'));
                            on.fire(listNode, 'key-highlight', {value: highlighted});
                            break;
                        case 'ArrowUp':
                            if(tableMode){
                                console.log('table!');
                                highlight(getCell(children, highlighted || selected, 'up'));
                                on.fire(listNode, 'key-highlight', {value: highlighted});
                                break;
                            }
                        case 'ArrowLeft':
                            highlight(getNode(children, highlighted || selected, 'up'));
                            on.fire(listNode, 'key-highlight', {value: highlighted});
                            break;
                        default:
                            // the event is not handled
                            if(on.isAlphaNumeric(e.key)){
                                if(e.key == 'r' && meta){
                                    return true;
                                }
                                searchString += e.key;
                                var searchNode = searchHtmlContent(children, searchString);
                                if(searchNode){
                                    highlight(select(searchNode));
                                }

                                clearTimeout(searchStringTimer);
                                searchStringTimer = setTimeout(function () {
                                    searchString = '';
                                }, searchStringTime);

                                break;
                            }
                            return;
                    }


                    e.preventDefault();
                    return false;
                })
            ];

            if(options.roles){
                addRoles(listNode);
                if(typeof MutationObserver !== 'undefined') {
                    observer = new MutationObserver(function (mutations) {
                        mutations.forEach(function (event) {
                            if(event.addedNodes.length){
                                addRoles(listNode);
                            }
                        });
                    });
                    observer.observe(listNode, {childList: true});
                }
            }

            return controller;
        }

    function isSelected(node){
        if(!node){
            return false;
        }
        return node.selected || node.hasAttribute('selected');
    }

    function getSelected(children, noDefault){
        for(var i = 0; i < children.length; i++){
            if(isSelected(children[i])){
                return children[i];
            }
        }
        return noDefault ? null : children[0];
    }

    function getNext(children, index){
        var
            norecurse = children.length + 2,
            node = children[index];
        while(node){
            index++;
            if(index > children.length - 1){
                index = -1;
            }else if(children[index] && !children[index].parentNode.disabled){
                node = children[index];
                break;
            }
            if(norecurse-- < 0){
                console.log('RECURSE');
                break;
            }
        }
        return node;
    }

    function getPrev(children, index){
        var
            norecurse = children.length + 2,
            node = children[index];
        while(node){
            index--;
            if(index < 0){
                index = children.length;
            }else if(children[index] && !children[index].parentNode.disabled){
                node = children[index];
                break;
            }
            if(norecurse-- < 0){
                console.log('RECURSE');
                break;
            }
        }
        return node;
    }

    function getNode(children, highlighted, dir){
        var i;
        for(i = 0; i < children.length; i++){
            if(children[i] === highlighted){
                break;
            }
        }
        if(dir === 'down'){
            return getNext(children, i);
        }else if(dir === 'up'){
            return getPrev(children, i);
        }
    }

    function getCell(children, highlighted, dir){
        var
            cellIndex = getIndex(highlighted),
            row = highlighted.parentNode,
            rowIndex = getIndex(row),
            rowAmount = row.parentNode.rows.length;

        if(dir === 'down'){
            if(rowIndex + 1 < rowAmount){
                return row.parentNode.rows[rowIndex + 1].cells[cellIndex];
            }
            return row.parentNode.rows[0].cells[cellIndex];
        }else if(dir === 'up'){
            if(rowIndex > 0){
                return row.parentNode.rows[rowIndex - 1].cells[cellIndex];
            }
            return row.parentNode.rows[rowAmount-1].cells[cellIndex];
        }
    }

    function getIndex (el) {
        var i, p = el.parentNode;
        for(i = 0 ; i < p.children.length; i++){
            if(p.children[i] === el){
                return i;
            }
        }
        return null;
    }

    function searchHtmlContent (children, str) {
        for(var i = 0; i < children.length; i++){
            if(children[i].innerHTML.indexOf(str) === 0){
                return children[i];
            }
        }
        return null;
    }

    function findShiftNodes (children, selected, node) {
        var i, a, b, c, lastNode = selected[selected.length-1], newIndex, lastIndex, selection = [];
        selected.forEach(function (sel) {
            sel.removeAttribute('selected');
        });
        for(i = 0; i < children.length; i++){
            c = children[i];
            if(c === node){
                newIndex = i;
            }else if(c === lastNode ){
                lastIndex = i;
            }
        }
        if(newIndex < lastIndex){
            a = newIndex;
            b = lastIndex;
        }else{
            b = newIndex;
            a = lastIndex;
        }

        while (a <= b) {
            children[a].setAttribute('selected', '');
            selection.push(children[a]);
            a++;
        }
        return selection;
    }

    function addRoles(node){
        // https://www.w3.org/TR/wai-aria/roles#listbox
        for(var i = 0; i < node.children.length; i++){
            node.children[i].setAttribute('role', 'listitem');
        }
        node.setAttribute('role', 'listbox');
    }

    function fromArray (thing) {
        return Array.isArray(thing) ? thing[0] : thing;
    }

    return keys;

}));
