import React from 'react';


const ModuleMixin = {
    render() {
        return <div className="module"><span>{this.renderModule()}</span></div>;
    }
};

export { ModuleMixin };
