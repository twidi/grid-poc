import React from 'react';

import { GridMixin } from './Mixins/Grid';
import { NodeMixin } from './Mixins/Node';


/**
 * SubGrid component, a grid inside a cell, composed of rows
 * @namespace
 * @memberOf module:Grid.Components
 * @summary The SubGrid component, inside a cell
 * @mixes module:Grid.Components.Mixins.Node
 * @mixes module:Grid.Components.Mixins.Grid
 */

export const SubGrid = React.createClass({
    mixins: [
        NodeMixin,
        GridMixin
    ],

    /**
     * Render the component mainly by calling renderRows
     */
    render() {
        return this.renderGrid();
    }
});
