(function (define) {
    define(['on'], function (on) {
        
        'use strict';

        function keys (listNode, options) {

            options = options || {};

            // TODO options:
            // search an option?
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
                observer,
                searchString = '',
                searchStringTimer,
                searchStringTime = options.searchTime || 1000,
                // children is a live NodeList, so the reference will update if nodes are added or removed
                children = listNode.children,
                selected = select(getSelected(children)),
                highlighted = highlight(selected),
                nodeType = highlighted.localName;

            function highlight (node) {
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
                if(selected){
                    selected.removeAttribute('selected');
                }
                if(node) {
                    selected = node;
                    selected.setAttribute('selected', 'true');
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
                on(listNode, 'keydown', function (e) {
                    if (e.defaultPrevented) { return; }

                    switch (e.key) {
                        case 'Enter':
                            select(highlighted);
                            on.fire(listNode, 'key-select', {value: selected});
                            break;
                        case 'Escape':
                            // consult options?
                            console.log('esc');
                            break;
                        case 'ArrowRight':
                        case 'ArrowDown':
                            highlight(getNode(children, highlighted || selected, 'down'));
                            on.fire(listNode, 'key-highlight', {value: highlighted});
                            break;
                        case 'ArrowLeft':
                        case 'ArrowUp':
                            highlight(getNode(children, highlighted || selected, 'up'));
                            on.fire(listNode, 'key-highlight', {value: highlighted});
                            break;
                        default:
                            // the event is not handled
                            if(on.isAlphaNumeric(e.key)){
                                searchString += e.key;
                                var searchNode = searchHtmlContent(children, searchString);
                                if(searchNode){
                                    highlight(select(searchNode));
                                }
                                break;
                            }
                            return;
                    }

                    clearTimeout(searchStringTimer);
                    searchStringTimer = setTimeout(function () {
                        searchString = '';
                    }, searchStringTime);
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
            return node.selected || node.getAttribute('selected');
        }

        function getSelected(children){
            for(var i = 0; i < children.length; i++){
                if(isSelected(children[i])){
                    return children[i];
                }
            }
            return children[0];
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

        function searchHtmlContent (children, str) {
            for(var i = 0; i < children.length; i++){
                if(children[i].innerHTML.indexOf(str) === 0){
                    return children[i];
                }
            }
            return null;
        }

        function addRoles(node){
            // https://www.w3.org/TR/wai-aria/roles#listbox
            for(var i = 0; i < node.children.length; i++){
                node.children[i].setAttribute('role', 'listitem');
            }
            node.setAttribute('role', 'listbox');
        }

        if (typeof customLoader === 'function') {
            customLoader(keys, 'keys');
        }
        else if(typeof define === 'function' && define.amd){
            return keys;
        }
        else if (typeof module !== 'undefined') {
            module.exports = keys;
        }
        else if (typeof window !== 'undefined') {
            window.keys = keys;
        }
    });
}(
    typeof define == 'function' && define.amd ? define : function (ids, factory) {
        var deps = ids.map(function (id) { return typeof require == 'function' ? require(id) : window[id]; });
        typeof module !== 'undefined' ? module.exports = factory.apply(null, deps) : factory.apply(null, deps);
    }
));