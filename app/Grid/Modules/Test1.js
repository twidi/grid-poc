var React = require('react');

var ModuleMixin = require('./Mixins/Module');


var Test1 = {
    mixins: [
        ModuleMixin,
    ],

    renderModule: function() {
        return 'Module.Test1: ' + this.props.text;
    }
};

module.exports = Test1 = React.createClass(Test1);
