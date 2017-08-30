import React from 'react';

/**
 * Base of al modules of the grid system.
 *
 * Modules must implement the `renderModule` method to render the module (it
 * will be in a div with the class `module`)
 *
 * @memberOf module:Grid.Modules.Bases
 *
 */
class Module extends React.Component {
    render() {
        return <div className="module">{this.renderModule()}</div>;
    }
}


export { Module };
