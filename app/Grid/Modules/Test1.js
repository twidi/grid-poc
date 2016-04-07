import React from 'react';

import { ModuleMixin } from './Mixins/Module';


export const Test1 = React.createClass({
    mixins: [
        ModuleMixin
    ],

    renderModule() {
        return 'Module.Test1: ' + this.props.text;
    }
});
