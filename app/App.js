
var React = require('react');

var flux = require('flux-react');

var Actions = require('./Grid/Actions');
var Manipulator = require('./Grid/Manipulator');
var Store = require('./Grid/Store');

var MainGrid = require('./Grid/Components/MainGrid');


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

    componentDidMount: function() {
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
