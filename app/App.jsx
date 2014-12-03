/** @jsx React.DOM */
var React = require('react');

var flux = require('flux-react');

var Actions = require('./Grid/Actions.js');
var Manipulator = require('./Grid/Manipulator.js');
var Store = require('./Grid/Store.js');

var Grid = require('./Grid/Components/Grid.jsx');


var App = React.createClass({
    getInitialState: function () {
        return {
            gridName: null,
        };
    },
    componentWillMount: function () {
        Store.on('grid.add', this.onGridAdded);
    },
    componentWillUnmount: function () {
        Store.off('grid.add', this.onGridAdded);
    },

    onGridAdded: function(gridName) {
        this.setState({
            gridName: gridName
        })
    },

    initGrid: function() {
        var grid = Manipulator.createBaseGrid('Test grid', 5);
        Actions.addGrid(grid);
    },

    render: function() {
        if (this.state.gridName) {
            return <Grid name={this.state.gridName}/>
        } else {
            return <button onClick={this.initGrid}>Initialize the grid</button>
        }
    },

});

module.exports = App;
