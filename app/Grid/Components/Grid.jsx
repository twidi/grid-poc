/** @jsx React.DOM */
var React = require('react');

var Actions = require('./../Actions.js');
var Store = require('./../Store.js');


/**
 * Grid component
 * @namespace
 * @memberOf module:Grid.Components
 *
 */
var Grid = {
    /**
     * When the component is created, set the gridName in the state based on the
     * grid from the props
     */
    getInitialState: function() {
        return {
            gridName: this.props.grid.getAttribute('name'),
        }
    },

    /**
     * When the component props are updated, set the gridName in the state based
     * on the grid from the new props
     */
    componentWillReceiveProps: function(nextProps) {
        this.setState({
            gridName: nextProps.grid.getAttribute('name'),
        });
    },

    /**
     * Update the grid when the given name is the one in props
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
    designMode: function() {
        return !!this.props.grid.getAttribute('hasPlaceholders');
    },

    /**
     * Enter or exit the design mode of the grid depending of its current status
     */
    toggleDesignMode: function() {
        if (this.designMode()) {
            Actions.exitDesignMode(this.state.gridName);
        } else {
            Actions.enterDesignMode(this.state.gridName);
        }
    },

    /**
     * Will render the component
     */
    render: function() {
        return <div>
            <div>Hi! I am a grid named "{this.state.gridName}". I am {this.designMode()?"in":"NOT in"} design mode</div>
            <button onClick={this.toggleDesignMode}>Change design mode</button>
        </div>
    }

};

module.exports = React.createClass(Grid);
