import React from 'react';
import ReactDOM from 'react-dom'

/**
 * A mixin to be used by components that want to attach an external dom node to
 * their react one.
 *
 * Each component using this mixin should provide the two methods below:
 *
 *  - `canHoldExternalNodes`
 *  - `getExternalNode`
 *
 * And a array `externalNodesClassNames`
 *
 * @mixin
 * @memberOf module:Grid.Components.Mixins
 * @summary A mixin to help components attaching an external dom node to their react one.
 */
export const NodesHolderMixin = {

    /**
     * The list of classNames of dom nodes to attach/detach.
     *
     * For each class, the `getExternalNode` method will be called in order, and
     * the returned node will be attached when the react component will be ready.
     *
     * And then, just before an update or unmount of the react component, the
     * `getExternalNode` method will be called for each class, in reverse order,
     * to unmount the nodes if they are not present.
     *
     * @abstract
     *
     * @alias module:Grid.Components.Mixins.NodesHolder.externalNodesClassNames
     *
     * @type {Array}
     */

    //The array to override must not include the prefix `_`
    _externalNodesClassNames: [],

    /**
     * Method to set in the component using this mixin to return if its state allows
     * it to handle external nodes
     *
     * The method to override must not include the prefix `_`
     *
     * @abstract
     *
     * @alias module:Grid.Components.Mixins.NodesHolder.canHoldExternalNode()
     *
     * @return {boolean} - `true` if the component can handle external nodes, or `false` if not
     */

     //The method to override must not include the prefix `_`
    _canHoldExternalNodes: function() {},


    /**
     * Method to set in the component using this mixin to return the node to attach
     * for the given className. The node is supposed to have the given className
     * as one of its CSS classes. If not, it will be added when attached (because
     * it's used to find the node to detach later)
     *
     * If nothing is returned, no node will be attached for this class.
     *
     * @abstract
     *
     * @alias module:Grid.Components.Mixins.NodesHolder.getExternalNode()
     *
     * @return {DomMode|nothing} - The dom node to insert, or nothing
     */

     //The method to override must not include the prefix `_`
    _getExternalNode: function(className) {},

    /**
     * Will attach some dom nodes to the actual react dom node
     *
     * @private
     */
    _attachExternalNodes: function() {
        if (!this.canHoldExternalNodes()) { return; }
        var domNode = ReactDOM.findDOMNode(this);

        for (var i = 0; i < this.externalNodesClassNames.length; i++) {
            var className = this.externalNodesClassNames[i];
            var externalNode = this.getExternalNode(className);
            if (externalNode) {
                this._attachExternalNode(externalNode, className, domNode);
            }
        }
    },

    /**
     * Will attach a dom node, forcing the given class name, to the given parent node.
     *
     * If the parentNode if not given, `ReactDOM.findDOMNode(this)` will be used;
     *
     * @param  {DomNode} domNode - The dom node to add
     * @param  {string} className - The class name to force the dom node to add to have
     * @param  {DomNode} [parentNode] - The dom node holding the one to add
     *
     * @private
     */
    _attachExternalNode: function(domNode, className, parentNode) {
        if (!domNode.classList.contains(className)) {
            domNode.add(className);
        }
        (parentNode || ReactDOM.findDOMNode(this)).appendChild(domNode);
    },

    /**
     * Will detach some dom nodes from the actual react dom node
     *
     * @private
     */
    _detachExternalNodes: function() {
        if (!this.canHoldExternalNodes()) { return; }
        var domNode = ReactDOM.findDOMNode(this);
        for (var i = this.externalNodesClassNames.length - 1; i >= 0; i--) {
            var className = this.externalNodesClassNames[i];
            var externalNode = domNode.querySelector(':scope > .' + className);
            if (externalNode) {
                this._detachExternalNode(externalNode, domNode);
            }
        }
    },


    /**
     * Will detach a dom node having the given class name, from the given dom node.
     *
     * If the domNode if not given, `ReactDOM.findDOMNode(this)` will be used;
     *
     * @param  {string} domNode - The dom node to remove
     * @param  {DomNode} [parentNode] - The dom node holding the one to remove
     *
     * @private
     */
    _detachExternalNode: function(domNode, parentNode) {
        (parentNode || ReactDOM.findDOMNode(this)).removeChild(domNode);
    },

    /**
     * Detach external nodes before unmounting the react component
     */
    componentWillUnmount: function() {
        this._detachExternalNodes();
    },

    /**
     * Attach external nodes after mounting the react component
     */
    componentDidMount: function() {
        this._attachExternalNodes();
    },

    /**
     * Detach external nodes before updating the react component
     */
    componentWillUpdate: function() {
        this._detachExternalNodes();
    },

    /**
     * Attach external nodes after updating the react component
     */
    componentDidUpdate: function() {
        this._attachExternalNodes();
    },

};
