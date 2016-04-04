import React from 'react';
import stringify from 'json-stable-stringify';


export const ModuleMixin = {
    render: function() {
        return <div className="module"><span>{this.renderModule()}</span></div>;
    }
};
