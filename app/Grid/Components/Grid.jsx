/** @jsx React.DOM */
var React = require('react');

var Store = require('./../Store.js');


/**
 * Grid component
 * @namespace
 * @memberOf module:Grid.Components
 *
 */
var Grid = {

    getInitialState: function () {
        return {
            grid: Store.getGrid(this.props.name)
        };
    },

    changeState: function () {
        this.setState({
            grid: Store.getGrid(this.props.name)
        });
    },

    componentWillMount: function () {
        Store.addChangeListener(this.changeState);
    },

    componentWillUnmount: function () {
        Store.removeChangeListener(this.changeState);
    },

    render: function() {
        return <div>Hi! I am a grid named "{this.props.name}"</div>
    }

};

module.exports = React.createClass(Grid);
