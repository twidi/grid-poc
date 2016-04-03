var React = require('react');

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
