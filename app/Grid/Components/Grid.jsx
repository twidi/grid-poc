/** @jsx React.DOM */
var React = require('react');

var Actions = require('./../Actions.js');
var Store = require('./../Store.js');

var GridMixin = require('./GridMixin.jsx');


/**
 * Grid component
 * @namespace
 * @memberOf module:Grid.Components
 *
 */
var Grid = {
    mixins: [GridMixin],

    /**
     * Update the grid when the given name is the one in props
     */
    updateIfSelf: function (name) {
        if (name != this.props.name) { return; }
        this.forceUpdate();
    },

    /**
     * Called before attaching the component to the dom, to watch changes of the
     * store that impact the component
     */
    componentWillMount: function () {
        Store.on('grid.designMode.*', this.updateIfSelf)
    },

    /**
     * Called before detaching the component from the dom, to stop watching
     * changes of the store that impact the component
     */
    componentWillUnmount: function () {
        Store.off('grid.designMode.*', this.updateIfSelf)
    },

    /**
     * Get the grid from the store with the name in props
     * 
     * @return {XML} The grid to use in this component
     */
    getGrid: function() {
        return Store.getGrid(this.props.name);
    },

    /**
     * Get the design mode status of this component
     *
     * @return {boolean} - True if the grid is in design mode, else False
     */
    designMode: function() {
        return !!this.getGrid().getAttribute('hasPlaceholders');
    },

    /**
     * Enter or exit the design mode of the grid depending of its current status
     */
    toggleDesignMode: function() {
        if (this.designMode()) {
            Actions.exitDesignMode(this.props.name);
        } else {
            Actions.enterDesignMode(this.props.name);
        }
    },

    /**
     * Will render the component
     */
    render: function() {
        return <div>
            <div>Hi! I am a grid named "{this.props.name}". I am {this.designMode()?"in":"NOT in"} design mode</div>
            <button onClick={this.toggleDesignMode}>Change design mode</button>
        </div>
    }

};

module.exports = React.createClass(Grid);
