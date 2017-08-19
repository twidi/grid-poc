
import React from 'react';
import createReactClass from 'create-react-class';

import { Actions } from './Grid/Actions';
import { Manipulator } from './Grid/Manipulator';
import { Store } from './Grid/Store';

import { MainGrid } from './Grid/Components/MainGrid';

export const App = createReactClass({
    getInitialState() {
        return {
            gridName: null
        };
    },

    componentWillUnmount() {
        Store.off('grid.add', this.onGridAdded);
    },

    componentDidMount() {
        Store.on('grid.add', this.onGridAdded);
        if (!this.state.gridName) {
            this.initGrid();
        }
    },

    onGridAdded(gridName) {
        this.setState({
            gridName
        });
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
            return <MainGrid node={this.getGrid()} />;
        }
        return <button onClick={this.initGrid}>Initialize the grid</button>;
    }

});
