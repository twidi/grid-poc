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
 * @mixes module:Grid.Components.Mixins.Node
 * @mixes module:Grid.Components.Mixins.Grid
 */

var MainGrid = {
    mixins: [
        NodeMixin,
        GridMixin,
    ],

    /**
     * When the component is created, set the gridName in the state based on the
     * grid from the props, to be able to update it later
     */
    getInitialState: function() {
        return {
            // we don't have `this.state.node` yet
            gridName: this.props.node.getAttribute('name'),
        };
    },

    /**
     * When the component props are updated, set the gridName in the state based
     * on the grid from the new props, to be able to update it later
     */
    componentWillReceiveProps: function(nextProps) {
        var newName = nextProps.node.getAttribute('name');
        if (newName != this.state.gridName) {
            this.setState({
                gridName: newName,
            });
        }
    },

    /**
     * Update the grid when the given name is the one in props
     * It is called on some events on the store after an update of a grid.
     */
    updateIfSelf: function (name) {
        if (name != this.state.gridName) { return; }

        var actualGrid = Store.getGrid(this.state.gridName);

        if (actualGrid != this.state.node) {
            this.setState({node: actualGrid});
        } else {
            this.forceUpdate();
        }
    },

    /**
     * Called before attaching the component to the dom, to watch changes of the
     * store that impact the component
     */
    componentWillMount: function () {
        Store.on('grid.designMode.**', this.updateIfSelf)
    },

    /**
     * Called before detaching the component from the dom, to stop watching
     * changes of the store that impact the component
     */
    componentWillUnmount: function () {
        Store.off('grid.designMode.**', this.updateIfSelf)
    },

    /**
     * Enter or exit the design mode of the grid depending of its current status
     */
    toggleDesignMode: function() {
        if (this.isInDesignMode()) {
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
     * - `grid-container-design-mode-step-*`: if the grid is in design mode, depending of the current step
     */
    getContainerClasses: function() {
        var inDesignMode = this.isInDesignMode();
        var classes = {
            'grid-container': true,
            'grid-container-design-mode': inDesignMode,
        };
        classes['grid-container-design-mode-step-' + this.getDesignModeStep()] = inDesignMode;
        return cx(classes);
    },

    /**
     * Will render the component
     */
    render: function() {
        return <div className={this.getContainerClasses()}>
            <nav className="grid-toolbar">
                <label>{this.state.gridName}</label>
                <button onClick={this.toggleDesignMode}>{this.isInDesignMode() ? "Exit" : "Enter"} design mode</button>
            </nav>
            {this.renderGrid()}
        </div>;
    }

};

module.exports = MainGrid = React.createClass(MainGrid);
