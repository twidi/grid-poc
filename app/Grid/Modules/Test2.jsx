var React = require('react/addons');  // react + addons


var Test2 = {
    render: function() {
        return <div>Module.Test2: {this.props.text}</div>
    }
};

module.exports = Test2 = React.createClass(Test2);

