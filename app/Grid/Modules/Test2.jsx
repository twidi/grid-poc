var React = require('react/addons');  // react + addons


var Test2 = {
    render: function() {
        return <div>Module.Test2: {this.props.text}</div>
    }
};

module.exports = React.createClass(Test2);

