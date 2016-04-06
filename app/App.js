
import React from 'react';

import flux from 'flux-react';

import { Actions } from './Grid/Actions';
import { Manipulator } from './Grid/Manipulator';
import { Store } from './Grid/Store';

import { MainGrid } from './Grid/Components/MainGrid';

export const App = React.createClass({
    getInitialState() {
        return {
            gridName: null,
        };
    },

    componentWillMount() {
        Store.on('grid.add', this.onGridAdded);
    },

    componentWillUnmount() {
        Store.off('grid.add', this.onGridAdded);
    },

    componentDidMount() {
        if (!this.state.gridName) {
            this.initGrid();
        }
    },

    onGridAdded(gridName) {
        this.setState({
            gridName: gridName
        })
    },

    initGrid() {
        // create a base empty grid
        const grid = Manipulator.createBaseGrid('Test grid');
        // with ids
        Manipulator.setIds(grid);
        // and make it usable
        Actions.addGrid(grid);
    },

    getGrid() {
        return Store.getGrid(this.state.gridName);
    },

    render() {
        if (this.state.gridName) {
            return <MainGrid node={this.getGrid()}/>
        } else {
            return <button onClick={this.initGrid}>Initialize the grid</button>
        }
    },

});
