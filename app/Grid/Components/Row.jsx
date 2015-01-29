/** @jsx React.DOM */
var _ = require('lodash');
var React = require('react/addons');  // react + addons
var cx = React.addons.classSet;

var Actions = require('../Actions.js');
var Store = require('../Store.js');

var NodeMixin = require('./Mixins/Node.jsx');


/**
 * Row component, a row of a grid, composed of cells
 * @namespace
 * @memberOf module:Grid.Components
 * @summary The Row component, a row of a grid
 * @mixes module:Grid.Components.Mixins.Node
 */
var Row = {
    mixins: [
        NodeMixin
    ],

    /**
     * Tell if the row is a placeholder
     *
     * @return {Boolean} - true if a placeholder
     */
    isPlaceholder: function() {
        return this.state.node.getAttribute('type') == 'placeholder';
    },

    /**
     * Get all the cells of the row
     *
     * @return {array} - An array of XML grid cells, including resizers
     */
    getCells: function() {
        return _.toArray(this.state.node.querySelectorAll(':scope > cell, :scope > resizer'));
    },

    /**
     * Return a list of all the cells, including resizers, rendered
     *
     * @return {module:Grid.Components.Cell[]} - An array of {@link module:Grid.Components.Cell Cell} components
     */
    renderCells: function() {
        var Cell = require('./Cell.jsx');
        var Resizer = require('./Resizer.jsx');

        return _.map(this.getCells(), function(cell){
            var type = cell.tagName;
            if (type == 'cell') {
                return <Cell node={cell} key={Store.getNodeId(cell)}/>;
            } else if (type == 'resizer') {
                return <Resizer node={cell} key={Store.getNodeId(cell)}/>;
            }
        }, this);
    },

    /**
     * Return the classes to use when rendering the current row.
     *
     * @return {React.addons.classSet}
     *
     * One or more of these classes:
     *
     * - `grid-row`: in all cases
     * - `grid-row-placeholder`: if it's a row placeholder
     *
     */
    getRowClasses: function() {
        return cx({
            'grid-row': true,
            'grid-row-placeholder': this.isPlaceholder(),
        });
    },

    /**
     * Render the component
     *
     * @returns {div} - A div with classes defined by `getRowClasses`, containing
     * cells, including resizers, returned by `renderCells`
     */
    render: function() {
        return <div className={this.getRowClasses()}>{this.renderCells()}</div>
    }

};

module.exports = Row = React.createClass(Row);
