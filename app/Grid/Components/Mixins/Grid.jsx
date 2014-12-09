/** @jsx React.DOM */
var _ = require('lodash');
var React = require('react/addons');  // react + addons

var Store = require('../../Store.js');


/**
 * A mixin to use for MainGrid and Grid components
 * @mixin
 * @memberOf module:Grid.Components.Mixins
 * @summary A mixin to use for MainGrid and Grid components
 */
var Grid = {

    /**
     * Get all the rows of the grid
     * @return {array} - An array of XML grid rows
     */
    getRows: function() {
        return _.toArray(this.props.node.querySelectorAll(':scope > content > rows'));
    },

    /**
     * Render each row as {@link module:Grid.Components.Row Row} components
     */
    renderRows: function() {
        var Row = require('../Row.jsx');

        return _.map(this.getRows(), function(row){
            return <Row node={row} key={Store.getNodeId(row)}/>;
        }, this);
    }

};

module.exports = Grid;
