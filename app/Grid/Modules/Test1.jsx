var React = require('react/addons');  // react + addons


var Test1 = {
    render: function() {
        return <div>Module.Test1: {this.props.text}</div>
    }
};

module.exports = React.createClass(Test1);

