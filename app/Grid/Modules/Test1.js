import createReactClass from 'create-react-class';


import { ModuleMixin } from './Mixins/Module';


const Test1 = createReactClass({
    mixins: [
        ModuleMixin
    ],

    renderModule() {
        return `Module.Test1: ${this.props.text}`;
    }
});

export { Test1 };
