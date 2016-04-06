import React from 'react';
import stringify from 'json-stable-stringify';


export const ModuleMixin = {
    render() {
        return <div className="module"><span>{this.renderModule()}</span></div>;
    }
};
