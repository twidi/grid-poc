import React from 'react';
import ReactDOM from 'react-dom';


/**
 * A function to enhance via a HOC components that want to attach an external dom node to
 * their react one.
 *
 * @memberOf module:Grid.Components.Hoc
 *
 * @summary A function to enhance components attaching an external dom node to their react one.
 *
 * @param {class} WrappedComponent - The react component to enhance
 * @param {string[]} externalNodesClassNames - CSS classes of dom nodes to attach
 * @param {function} canHoldExternalNodes - A function accepting the `WrappedComponent` returning a bool
 *                                          telling if the component is able to hold external nodes
 * @param {function} getExternalNode - A function accepting the `WrappedComponent` and a class name, returning
 *                                     a node (or nothing) to attach.
 *
 * @return {class} - {@link module:Grid.Components.Hoc.convertToNodesHolder.NodesHolder}
 */
const convertToNodesHolder = (
    WrappedComponent,
    externalNodesClassNames,
    canHoldExternalNodes,
    getExternalNode
) => {
    /**
     * Wrap a component using parameters given to {@link module:Grid.Components.Hoc.convertToNodesHolder}
     *
     * @memberOf module:Grid.Components.Hoc.convertToNodesHolder
     */
    class NodesHolder extends React.Component {

        /**
         * Save arguments passed to `convertToNodesHolder`
         *
         * @param {Object} props - Properties from the wrapped component
         */
        constructor(props) {
            super(props);
            this.externalNodesClassNames = externalNodesClassNames;
            this.canHoldExternalNodes = () => canHoldExternalNodes(this.wrappedRef);
            this.getExternalNode = className => getExternalNode(this.wrappedRef, className);
        }

        /**
         * Will attach some dom nodes to the actual react dom node
         */
        attachExternalNodes() {
            if (!this.canHoldExternalNodes()) {
                return;
            }

            const domNode = ReactDOM.findDOMNode(this.wrappedRef);

            for (let i = 0; i < this.externalNodesClassNames.length; i++) {
                const className = this.externalNodesClassNames[i];
                const externalNode = this.getExternalNode(className);
                if (externalNode) {
                    this.attachExternalNode(externalNode, className, domNode);
                }
            }
        }

        /**
         * Will attach a dom node, forcing the given class name, to the given parent node.
         *
         * If the parentNode if not given, `ReactDOM.findDOMNode(this)` will be used;
         *
         * @param  {Element|Node|XML} domNode - The dom node to add
         * @param  {String} className - The class name to force the dom node to add to have
         * @param  {Element|Node|XML} [parentNode=] - The dom node holding the one to add
         */
        attachExternalNode(domNode, className, parentNode) {
            if (!domNode.classList.contains(className)) {
                domNode.classList.add(className);
            }
            (parentNode || ReactDOM.findDOMNode(this.wrappedRef)).appendChild(domNode);
        }

        /**
         * Will detach some dom nodes from the actual react dom node
         */
        detachExternalNodes() {
            if (!this.canHoldExternalNodes()) {
                return;
            }
            const domNode = ReactDOM.findDOMNode(this.wrappedRef);
            for (let i = this.externalNodesClassNames.length - 1; i >= 0; i--) {
                const className = this.externalNodesClassNames[i];
                const externalNode = domNode.querySelector(`:scope > .${className}`);
                if (externalNode) {
                    this.detachExternalNode(externalNode, domNode);
                }
            }
        }

        /**
         * Will detach a dom node having the given class name, from the given dom node.
         *
         * If the domNode if not given, `ReactDOM.findDOMNode(this)` will be used;
         *
         * @param  {Element|Node|XML} domNode - The dom node to remove
         * @param  {Element|Node|XML} [parentNode=] - The dom node holding the one to remove
         *
         */
        detachExternalNode(domNode, parentNode) {
            (parentNode || ReactDOM.findDOMNode(this)).removeChild(domNode);
        }

        /**
         * Detach external nodes before unmounting the react component
         */
        componentWillUnmount() {
            this.detachExternalNodes();
        }

        /**
         * Attach external nodes after mounting the react component
         */
        componentDidMount() {
            this.attachExternalNodes();
        }

        /**
         * Detach external nodes before updating the react component
         *
         * @param {object} nextProps - New component props used for the update
         * @param {object} nextState - New component state used for the update
         */
        componentWillUpdate(nextProps, nextState) {
            this.detachExternalNodes();
        }

        /**
         * Attach external nodes after updating the react component
         *
         * @param {object} prevProps - Component props before the update
         * @param {object} prevState - Component state before the update
         */
        componentDidUpdate(prevProps, prevState) {
            this.attachExternalNodes();
        }

        /**
         *  Render the wrapped component, saving it as `this.wrappedRef`
         *
         * @returns {Element|Node|XML} - The rendered element
         */
        render() {
            const newProps = {
                ref: (c) => {
                    this.wrappedRef = c;
                }
            };
            return <WrappedComponent {...this.props} {...newProps} />;
        }

    }

    NodesHolder.displayName = 'NodesHolder';

    return NodesHolder;

};

export { convertToNodesHolder };
