import _ from 'lodash';
import React from 'react';
import classnames from 'classnames'

import { Actions } from '../Actions';
import { Store } from '../Store';

import { NodeMixin } from './Mixins/Node';
import { Cell } from './Cell';
import { Resizer } from './Resizer';

/**
 * Row component, a row of a grid, composed of cells
 * @namespace
 * @memberOf module:Grid.Components
 * @summary The Row component, a row of a grid
 * @mixes module:Grid.Components.Mixins.Node
 */
export const Row = React.createClass({
    mixins: [
        NodeMixin
    ],

    /**
     * Tell if the row is a placeholder
     *
     * @return {Boolean} - true if a placeholder
     */
    isPlaceholder() {
        return this.state.node.getAttribute('type') == 'placeholder';
    },

    /**
     * Get all the cells of the row
     *
     * @return {array} - An array of XML grid cells, including resizers
     */
    getCells() {
        return _.toArray(this.state.node.querySelectorAll(':scope > cell, :scope > resizer'));
    },

    /**
     * Return a list of all the cells, including resizers, rendered
     *
     * @return {module:Grid.Components.Cell[]} - An array of {@link module:Grid.Components.Cell Cell} components
     */
    renderCells() {
        return _.map(this.getCells(), cell => {
            const type = cell.tagName;
            if (type == 'cell') {
                return <Cell node={cell} key={Store.getNodeId(cell)}/>;
            }
            if (type == 'resizer') {
                return <Resizer node={cell} key={Store.getNodeId(cell)}/>;
            }
        });
    },

    /**
     * Return the classes to use when rendering the current row.
     *
     * @return {string} - A string containing classes
     *
     * One or more of these classes:
     *
     * - `grid-row`: in all cases
     * - `grid-row-placeholder`: if it's a row placeholder
     *
     */
    getRowClasses() {
        return classnames({
            'grid-row': true,
            'grid-row-placeholder': this.isPlaceholder(),
        });
    },

    /**
     * Return the inline styles to use when rendering the current row
     *
     * @return {Object} - An object including styles
     *
     * One or more of these styles:
     *
     * - `flexGrow`: the relative size of the row as defined in the grid if this is not a row placeholder
     */
    getRowStyle() {
        const style = {};
        if (!this.isPlaceholder()) {
            style.flexGrow = Store.getRelativeSize(this.state.node);
        }
        return style;
    },

    /**
     * Render the component
     *
     * @returns {div} - A div with classes defined by `getRowClasses`, containing
     * cells, including resizers, returned by `renderCells`
     */
    render() {
        return <div className={this.getRowClasses()} style={this.getRowStyle()}>{this.renderCells()}</div>
    }

});
