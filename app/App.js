import React from 'react';

import { Actions, Manipulator } from './Grid/Data';

import { MainGrid } from './Grid/Components';


// create a base empty grid
const gridName = 'Test grid';
const grid = Manipulator.createBaseGrid(gridName);
// with ids
Manipulator.setIds(grid);
// and make it usable
Actions.addGrid(grid);


const App = props => <MainGrid node={grid} />;

export { App };
