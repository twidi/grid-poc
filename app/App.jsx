/** @jsx React.DOM */
var React = require('react/addons');  // react + addons

var flux = require('flux-react');

var Actions = require('./Grid/Actions.js');
var Manipulator = require('./Grid/Manipulator.js');
var Store = require('./Grid/Store.js');

var MainGrid = require('./Grid/Components/MainGrid.jsx');


var App = React.createClass({
    getInitialState: function () {
        return {
            gridName: null,
        };
    },

    componentWillUnmount: function () {
        Store.off('grid.add', this.onGridAdded);
    },

    componentDidMount: function() {
        Store.on('grid.add', this.onGridAdded);
        if (!this.state.gridName) {
            this.initGrid();
        }
    },

    onGridAdded: function(gridName) {
        this.setState({
            gridName: gridName
        })
    },

    initGrid: function() {
        // create a base empty grid
        var grid = Manipulator.createBaseGrid('Test grid');
        // with ids
        Manipulator.setIds(grid);
        // and make it usable
        Actions.addGrid(grid);
    },

    getGrid: function() {
        return Store.getGrid(this.state.gridName);
    },

    render: function() {
        if (this.state.gridName) {
            return <MainGrid node={this.getGrid()}/>
        } else {
            return <button onClick={this.initGrid}>Initialize the grid</button>
        }
    },

});

module.exports = App;
