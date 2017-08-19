import React from 'react';
import createReactClass from 'create-react-class';


import { ModuleMixin } from './Mixins/Module';


export const Test1 = createReactClass({
    mixins: [
        ModuleMixin
    ],

    renderModule() {
        return `Module.Test1: ${this.props.text}`;
    }
});
