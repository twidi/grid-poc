/** @jsx React.DOM */
var React = require('react/addons');  // react + addons

var ModuleMixin = require('./Mixins/Module');


var Test2 = {
    mixins: [
        ModuleMixin,
    ],

    renderModule: function() {
        return 'Module.Test2: ' + this.props.text;
    }
};

module.exports = Test2 = React.createClass(Test2);

