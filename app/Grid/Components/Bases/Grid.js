import _ from 'lodash';
import React from 'react';
import classnames from 'classnames';

import { Store } from '../../Data';
import { GridNode } from './Node';


/**
 * A base class to use for MainGrid and Grid components
 *
 * @extends module.Grid.Components.Bases.GridNode
 *
 * @memberOf module:Grid.Components.Bases
 *
 * @summary A base class to use for MainGrid and Grid components
 */
class Grid extends GridNode {

    /**
     * Tell if the grid is "main grid"
     *
     * @return {Boolean} - true if a "main grid", false for a subgrid
     */
    isMainGrid() {
        return this.getType() === 'mainGrid';
    }

    /**
     * Get all the rows of the grid
     *
     * @return {Element|Node[]} - An array of XML grid rows, including resizers
     */
    getRows() {
        return _.toArray(this.state.node.querySelectorAll(':scope > content > row, :scope > content > resizer'));
    }

    /**
     * Return a list of all the rows, including resizers, rendered
     *
     * @return {module:Grid.Components.Row[]} - An array of {@link module:Grid.Components.Row} components
     */
    renderRows() {

        /* eslint-disable global-require */
        // use require to manage circular dependencies
        const { Resizer } = require('../Resizer');
        const { Row } = require('../Row');
        /* eslint-enable global-require */

        return _.map(this.getRows(), (row) => {
            const type = row.tagName;
            if (type === 'row') {
                return <Row node={row} key={Store.getNodeId(row)} />;
            } else if (type === 'resizer') {
                return <Resizer node={row} key={Store.getNodeId(row)} />;
            }
        });
    }

    /**
     * Return the classes to use when rendering the current grid
     *
     * @param {object} forcedClasses - Dict of classes that are added after the ones computed in this method.
     *
     * @return {String} - A string containing classes
     *
     * One or more of these classes:
     *
     * - `grid`: in all cases
     * - `grid-main`: if it's the main grid
     * - `grid-last-level-with-placeholders`: if the grid does not contain any sub grid,
     *                                        and we have placeholders (only if it's not the main grid)
     */
    getGridClasses(forcedClasses) {
        const classes = _.merge({
            grid: true,
            'grid-main': this.isMainGrid(),
            'grid-last-level-with-placeholders': !this.isMainGrid()
                                              && !Store.containsSubGrid(this.state.node)
                                              && Store.hasPlaceholders(this.getGridName())
        }, forcedClasses);
        return classnames(classes);
    }

    /**
     * Return the inline styles to use when rendering the current grid
     *
     * @param {object} forcedStyle - Dict of styles that are added after the ones computed in this method.
     *
     * @return {Object} - An object including styles
     *
     * One or more of these styles:
     *
     * - `flexGrow`: the relative size of the grid as defined in the grid if this is not a main grid, only a subgrid
     */
    getGridStyle(forcedStyle) {
        const style = {};
        if (!this.isMainGrid()) {
            style.flexGrow = Store.getRelativeSize(this.state.node);
        }
        return _.merge(style, forcedStyle);
    }

    /**
     * Render the grid component
     *
     * @returns {Element|Node|XML} - A div with classes defined by `getGridClasses`, containing
     * rows, including resizers, returned by `renderRows`
     */
    renderGrid(classes, style) {
        return (
            <div
                className={this.getGridClasses(classes)}
                style={this.getGridStyle(style)}
                key={this.getGridName()}
            >
                {this.renderRows()}
            </div>
        );
    }
}

Grid.displayName = 'Grid';

export { Grid };
