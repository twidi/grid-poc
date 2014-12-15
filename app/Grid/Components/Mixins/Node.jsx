/** @jsx React.DOM */
var React = require('react/addons');  // react + addons

var Store = require('../../Store.js');


/**
 * A mixin to use for all grid components based on a XML grid node
 * @mixin
 * @memberOf module:Grid.Components.Mixins
 * @summary A mixin to use for all grid components based on a XML grid node
 */
var Node = {

    /**
     * Get the type of the current XML Grid cell
     * @return {string} Either "mainGrid", or "placeholder" or nothing for a row,
     * or "grid", "module" or "placeholder" for a cell
     */
    getType: function() {
        return this.props.node.getAttribute('type');
    },

    /**
     * Get the ID of the current node
     *
     * @return {string} The ID of the node
     */
    getNodeId: function() {
        return Store.getNodeId(this.props.node);
    },

    /**
     * Get the main grid
     *
     * @return {XML} The main grid the current node belongs to
     */
    getGrid: function() {
        return Store.getMainGrid(this.props.node);
    },
};

module.exports = Node;
