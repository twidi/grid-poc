import createReactClass from 'create-react-class';


import { ModuleMixin } from './Mixins/Module';


const Test2 = createReactClass({
    mixins: [
        ModuleMixin
    ],

    renderModule() {
        return `Module.Test2: ${this.props.text}`;
    }
});

export { Test2 };
