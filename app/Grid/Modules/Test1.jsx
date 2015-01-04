/** @jsx React.DOM */
var React = require('react/addons');  // react + addons

var ModuleMixin = require('./Mixins/Module.jsx');


var Test1 = {
    mixins: [
        ModuleMixin,
    ],

    renderModule: function() {
        return 'Module.Test1: ' + this.props.text;
    }
};

module.exports = Test1 = React.createClass(Test1);

