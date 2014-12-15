/** @jsx React.DOM */
var React = require('react/addons');  // react + addons


var Test1 = {
    render: function() {
        return <div>Module.Test1: {this.props.text}</div>
    }
};

module.exports = Test1 = React.createClass(Test1);

