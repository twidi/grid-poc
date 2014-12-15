/** @jsx React.DOM */
var _ = require('lodash');
var React = require('react/addons');  // react + addons
var cx = React.addons.classSet;

var Actions = require('../Actions.js');
var Store = require('../Store.js');

var GridMixin = require('./Mixins/Grid.jsx');
var NodeMixin = require('./Mixins/Node.jsx');


/**
 * MainGrid component, composed of rows. Can enter/exit designMode
 * @namespace
 * @memberOf module:Grid.Components
 * @summary The MainGrid component
 * @mixes module:Grid.Components.Mixins.NodeMixin
 * @mixes module:Grid.Components.Mixins.GridMixin
 */

var MainGrid = {
    mixins: [
        NodeMixin,
        GridMixin,
    ],

    /**
     * When the component is created, set the gridName in the state based on the
     * grid from the props
     */
    getInitialState: function() {
        return {
            gridName: this.props.node.getAttribute('name'),
        };
    },

    /**
     * When the component props are updated, set the gridName in the state based
     * on the grid from the new props
     */
    componentWillReceiveProps: function(nextProps) {
        this.setState({
            gridName: nextProps.node.getAttribute('name'),
        });
    },

    /**
     * Update the grid when the given name is the one in props
     * It is called on some events on the store after an update of a grid.
     */
    updateIfSelf: function (name) {
        if (name != this.state.gridName) { return; }
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
     * Get the design mode status of this component
     *
     * @return {boolean} - True if the grid is in design mode, else False
     */
    inDesignMode: function() {
        return !!this.props.node.getAttribute('hasPlaceholders');
    },

    /**
     * Enter or exit the design mode of the grid depending of its current status
     */
    toggleDesignMode: function() {
        if (this.inDesignMode()) {
            Actions.exitDesignMode(this.state.gridName);
        } else {
            Actions.enterDesignMode(this.state.gridName);
        }
    },

    /**
     * Return the classes to use when rendering the container of the current main grid
     *
     * @return {React.addons.classSet}
     *
     * One or more of these classes:
     *
     * - `grid-container`: in all cases
     * - `grid-container-design-mode`: if the grid is in design mode
     */
    getContainerClasses: function() {
        return cx({
            'grid-container': true,
            'grid-container-design-mode': this.inDesignMode(),
        });
    },

    /**
     * Will render the component
     */
    render: function() {
        return <div className={this.getContainerClasses()}>
            <nav className="grid-toolbar">
                <label>{this.state.gridName}</label>
                <button onClick={this.toggleDesignMode}>Change design mode</button>
            </nav>
            {this.renderGrid()}
        </div>;
    }

};

module.exports = MainGrid = React.createClass(MainGrid);
