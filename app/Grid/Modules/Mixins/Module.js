var React = require('react');
var stringify = require('json-stable-stringify');


var ModuleMixin = {

    render: function() {
        return <div className="module"><span>{this.renderModule()}</span></div>;
    }

};


module.exports = ModuleMixin;
