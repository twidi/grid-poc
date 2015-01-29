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
        var grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="Test grid" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module"><content component="Module.Test1" text="test 1-1"/></cell>' +
                        '<cell type="grid">' +
                            '<content>' +
                                '<row>' +
                                    '<cell type="module"><content component="Module.Test2" text="test 2-1"/></cell>' +
                                '</row>' +
                                '<row>' +
                                    '<cell type="module"><content component="Module.Test1" text="test 1-2"/></cell>' +
                                '</row>' +
                            '</content>' +
                        '</cell>' +
                    '</row>' +
                    '<row>' +
                        '<cell type="module"><content component="Module.Test1" text="test 1-3"/></cell>' +
                        '<cell type="module"><content component="Module.Test2" text="test 2-2"/></cell>' +
                        '<cell type="module"><content component="Module.Test2" text="test 2-3"/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>');

        Manipulator.setIds(grid);
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
