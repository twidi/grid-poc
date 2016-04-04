
import React from 'react';

import flux from 'flux-react';

import { Actions } from './Grid/Actions';
import { Manipulator } from './Grid/Manipulator';
import { Store } from './Grid/Store';

import { MainGrid } from './Grid/Components/MainGrid';

export const App = React.createClass({
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
