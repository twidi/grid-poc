import React from 'react';
import createReactClass from 'create-react-class';


import { ModuleMixin } from './Mixins/Module';


export const Test2 = createReactClass({
    mixins: [
        ModuleMixin
    ],

    renderModule() {
        return `Module.Test2: ${this.props.text}`;
    }
});
