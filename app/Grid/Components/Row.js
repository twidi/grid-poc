import _ from 'lodash';
import React from 'react';
import classnames from 'classnames';

import { Store } from '../Data';
import { GridNode } from './Bases';
import { Cell, Resizer } from './';


/**
 * Row component, a row of a grid, composed of cells
 *
 * @memberOf module:Grid.Components
 *
 * @summary The Row component, a row of a grid
 *
 * @extends module:Grid.Components.Bases.GridNode
 */
class Row extends GridNode {

    /**
     * Tell if the row is a placeholder
     *
     * @return {Boolean} - true if a placeholder
     */
    isPlaceholder() {
        return this.state.node.getAttribute('type') === 'placeholder';
    }

    /**
     * Get all the cells of the row
     *
     * @return {Array} - An array of XML grid cells, including resizers if not in one-screen mode
     */
    getCells() {
        let selector = ':scope > cell';
        if (!this.isInOneScreenMode()) {
            selector += ', :scope > resizer';
        }
        return _.toArray(this.state.node.querySelectorAll(selector));
    }

    /**
     * Return a list of all the cells, including resizers, rendered
     *
     * @return {module:Grid.Components.Cell[]} - An array of {@link module:Grid.Components.Cell} components
     */
    renderCells() {
        return _.map(this.getCells(), (cell) => {
            const type = cell.tagName;
            if (type === 'cell') {
                return <Cell node={cell} key={Store.getNodeId(cell)} />;
            }
            if (type === 'resizer') {
                return <Resizer node={cell} key={Store.getNodeId(cell)} />;
            }
        });
    }

    /**
     * Return the classes to use when rendering the current row.
     *
     * @return {String} - A string containing classes
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
            'grid-row-placeholder': this.isPlaceholder()
        });
    }

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
    }

    /**
     * Render the component
     *
     * @returns {Element|Node|XML} - A div with classes defined by `getRowClasses`, containing
     * cells, including resizers, returned by `renderCells`
     */
    render() {
        return <div className={this.getRowClasses()} style={this.getRowStyle()}>{this.renderCells()}</div>;
    }

}

Row.displayName = 'Row';


export { Row };
