/** @jsx React.DOM */
var _ = require('lodash');
var React = require('react/addons');  // react + addons
var cx = React.addons.classSet;

var Store = require('../../Store.js');


/**
 * A mixin to use for MainGrid and Grid components
 * @mixin
 * @memberOf module:Grid.Components.Mixins
 * @summary A mixin to use for MainGrid and Grid components
 */
var Grid = {

    /**
     * Tell if the grid is "main grid"
     *
     * @return {Boolean} - true if a "main grid", false for a subgrid
     */
    isMainGrid: function() {
        return this.getType() == 'mainGrid';
    },

    /**
     * Get all the rows of the grid
     *
     * @return {array} - An array of XML grid rows, including resizers
     */
    getRows: function() {
        return _.toArray(this.state.node.querySelectorAll(':scope > content > row, :scope > content > resizer'));
    },

    /**
     * Return a list of all the rows, including resizers, rendered
     *
     * @return {module:Grid.Components.Row[]} - An array of {@link module:Grid.Components.Row Row} components
     */
    renderRows: function() {
        var Resizer = require('../Resizer.jsx');
        var Row = require('../Row.jsx');

        return _.map(this.getRows(), function(row){
            var type = row.tagName;
            if (type == 'row') {
                return <Row node={row} key={Store.getNodeId(row)}/>;
            } else if (type == 'resizer') {
                return <Resizer node={row} key={Store.getNodeId(row)}/>;
            }
        }, this);
    },

    /**
     * Return the classes to use when rendering the current grid
     *
     * @return {React.addons.classSet}
     *
     * One or more of these classes:
     *
     * - `grid`: in all cases
     * - `grid-main`: if it's the main grid
     * - `grid-last-level-with-placeholders`: if the grid does not contain any sub grid,
     *                                        and we have placeholders (only if it's not the main grid)
     */
    getGridClasses: function() {
        var classes = {
            'grid': true,
            'grid-main': this.isMainGrid(),
            'grid-last-level-with-placeholders': !this.isMainGrid()
                                              && !Store.containsSubGrid(this.state.node)
                                              && Store.hasPlaceholders(this.getGridName()),
        };
        return cx(classes);
    },

    /**
     * Return the inline styles to use when rendering the current grid
     *
     * @return {Object} - An object including styles
     *
     * One or more of these styles:
     *
     * - `flexGrow`: the relative size of the grid as defined in the grid if this is not a main grid, only a subgrid
     */
    getGridStyle: function() {
        var style = {};
        if (!this.isMainGrid()) {
            style.flexGrow = Store.getRelativeSize(this.state.node);
        }
        return style;
    },

    /**
     * Render the grid component
     *
     * @returns {div} - A div with classes defined by `getGridClasses`, containing
     * rows, including resizers, returned by `renderRows`
     */
    renderGrid: function() {
        return <div className={this.getGridClasses()} style={this.getGridStyle()}>{this.renderRows()}</div>
    },

};

module.exports = Grid;
