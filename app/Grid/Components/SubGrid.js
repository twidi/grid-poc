import React from 'react';
import createReactClass from 'create-react-class';

import { GridMixin } from './Mixins/Grid';
import { NodeMixin } from './Mixins/Node';


/**
 * SubGrid component, a grid inside a cell, composed of rows
 * @namespace
 * @memberOf module:Grid.Components
 * @summary The SubGrid component, inside a cell
 * @mixes module:Grid.Components.Mixins.NodeMixin
 * @mixes module:Grid.Components.Mixins.GridMixin
 */
let SubGrid = {
    mixins: [
        NodeMixin,
        GridMixin
    ],

    /**
     * Render the component mainly by calling renderRows
     */
    render() {
        return this.renderGrid({}, {});
    }
};

SubGrid = createReactClass(SubGrid);

export { SubGrid };
