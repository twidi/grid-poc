import React from 'react';


export const ModuleMixin = {
    render() {
        return <div className="module"><span>{this.renderModule()}</span></div>;
    }
};
