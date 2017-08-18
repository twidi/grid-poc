import React from 'react';

import { ModuleMixin } from './Mixins/Module';


export const Test2 = React.createClass({
    mixins: [
        ModuleMixin
    ],

    renderModule() {
        return `Module.Test2: ${this.props.text}`;
    }
});
