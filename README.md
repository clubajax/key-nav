`#key-nav

Make a list of items keyboard navigable, using arrow, enter, escape and search keys

## Description

`key-nav` attaches to a DOM node and makes it keyboard-navigable. It adds state attributes to nodes so they can be styled 
at your discretion with CSS.

Lists ( such as `ul - li`) or tables can be navigated. If alphanumeric characters are pressed, the children are 
searched.

The children are a live NodeList, so any references will update if nodes are added or removed.

## To Install

    npm install @clubajax/key-nav --save
    
key-nav has a dependency on [clubajax/on](https://github.com/clubajax/on).

## Support

`key-nav` uses ES5 (not ES6), so it is compatible with all browsers, IE11 and above.

This library uses UMD, so it should work in any framework.

## Changes

As of version 2, key-nav is a11y. 
 * Instead of a `.highlighted` class, the node is focused, adding: `tab-index=-1` and `aria-current="true"`.
 * Instead of, the attribute `selected="true"`, it is now: `aria-selected="true"`;

## Usage

Including `key-nav` in your code will return a `keys` function.

```jsx harmony
var controller = keys(listNode, options);
```

`key-nav` will automatically determine if the `listNode` is a list or a table.

The controller can be paused or destroyed:
```jsx harmony
controller.pause();
controller.resume();
controller.remove();
```

It also has a few dynamic controls:
```jsx harmony
controller.setSelected(child);
var selectedChild = controller.getSelected();
```

The following attributes are added to children, depending upon their state:

 * `aria-current` - The child has enter a mouseover state, or has been navigated to with an Arrow key.
 * `aria-selected` - The child has been clicked upon, or ha been selected with the Enter key. 

The following custom events are fired from the listNode:

 * `key-highlight` - The child has enter a mouseover state, or has been navigated to with an Arrow key.
 * `key-select` - The child has been clicked upon, or has been selected with the Enter key. 

## Options

The following options are available:

 * `canSelectNone` - Allows no selection. Defaults to first child.
 * `defaultToFirst` - First child is selected on init. Defaults to no selection at start
 * `multiple` - Allows multiple select with Shift or Control/Command. Defaults to single select.
 * `searchTime` - The time before an alphanumeric search is executed. Defaults to 1000ms.
 * `noRoles` - This will prevent the default, which is to automatically add Aria roles to the list node and its children.

## Events

The following (custom) events are emitted:

 * `key-select` - Emits on selection.
 * `key-highlight` - Emits on selection.
 * `key-dom-change` - Emits on add or remove of a list item.

### `key-select`

    {
        detail:{
            value: HTMLElement
        }
    }

if `multiple` is true:

    {
        detail:{
            value: [HTMLElement, HTMLElement]
        }
    }

If no selection, the value is `null`.

### `key-highlight`

    {
        detail:{
            value: HTMLElement
        }
    }

### `key-dom-change`
The MutationEvent is passed:

    {
        detail:{
            addedNodes: NodeList [],
            removedNodes: NodeList [li],
            attributeName: null,
            attributeNamespace: null,
            nextSibling: null,
            oldValue: null,
            previousSibling: li,
            target: ol#list,
            type: "childList"
        }
    }

## License

This uses the [MIT license](./LICENSE). Feel free to use, and redistribute at will.`
