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
     * @return {array} - An array of XML grid rows
     */
    getRows: function() {
        return _.toArray(this.state.node.querySelectorAll(':scope > content > row'));
    },

    /**
     * Return a list of all the rows, rendered
     *
     * @return {module:Grid.Components.Row[]} - An array of {@link module:Grid.Components.Row Row} components
     */
    renderRows: function() {
        var Row = require('../Row.jsx');

        return _.map(this.getRows(), function(row){
            return <Row node={row} key={Store.getNodeId(row)}/>;
        }, this);
    },

    /**
     * Return the classes to use when rendering the current subgrid
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
     * Render the grid component
     *
     * @returns {div} - A div with classes defined by `getGridClasses`, containing
     * rows returned by `renderRows`
     */
    renderGrid: function() {
        return <div className={this.getGridClasses()}>{this.renderRows()}</div>
    },

};

module.exports = Grid;
