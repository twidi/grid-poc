/** @jsx React.DOM */
var React = require('react/addons');  // react + addons

var Store = require('../../Store');


/**
 * A mixin to use for all grid components based on a XML grid node
 *
 * @mixin
 * @memberOf module:Grid.Components.Mixins
 * @summary A mixin to use for all grid components based on a XML grid node
 */
var Node = {

    /**
     * When the component is created, set the node in the state based on the
     * node from the props, to be able to update it later
     *
     * @return {object} - The initial state
     */
    getInitialState: function() {
        return {
            node: this.props.node
        };
    },

    /**
     * When the component props are updated, set the node in the state based
     * on the node from the new props, to be able to update it later
     *
     * @param  {object} nextProps - The new props to be received
     */
    componentWillReceiveProps: function(nextProps) {
        if (nextProps.node != this.props.node) {
            this.setState({
                node: nextProps.node
            });
        }
    },

    /**
     * Get the type of the current XML Grid cell
     * @return {string} - Either "mainGrid", or "placeholder" or nothing for a row,
     * or "grid", "module" or "placeholder" for a cell
     */
    getType: function() {
        return this.state.node.getAttribute('type');
    },

    /**
     * Get the ID of the current node
     *
     * @return {string} - The ID of the node
     */
    getNodeId: function() {
        return Store.getNodeId(this.state.node);
    },

    /**
     * Get the main grid
     *
     * @return {XML} - The main grid the current node belongs to
     */
    getGrid: function() {
        return Store.getMainGrid(this.state.node);
    },

    /**
     * Get the main grid name
     *
     * @return {XML} - The name of the main grid the current node belongs to
     */
    getGridName: function() {
        return Store.getMainGridName(this.state.node);
    },

    /**
     * Get the current design mode step for the main Grid
     *
     * @return {string} - The name of the design mode step
     *
     * @todo: find a way to cache this to avoid calling the getAttribute method every time
     */
    getDesignModeStep: function() {
        return Store.getDesignModeStep(this.getGridName());
    },

    /**
     * Get the design mode status of this component
     *
     * @return {boolean} - True if the grid is in design mode, else False
     */
    isInDesignMode: function() {
        return (this.getDesignModeStep() != 'disabled');
    },
};

module.exports = Node;
