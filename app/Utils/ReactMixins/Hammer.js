/* Taken from npm "react-hammerjs" but using react/addons to have the same react root */

import React from 'react';
import ReactDOM from 'react-dom';

import Hammer from 'hammerjs';


const privateProps = {
    component: true,
    children: true,
    action: true,
    onTap: true,
    onDoubleTap: true,
    onPan: true,
    onSwipe: true,
    onPress: true,
    onPinch: true,
    onRotate: true
};

/**
 * Hammer Component
 * ================
 */

let HammerComponent = {

    displayName: 'Hammer',

    propTypes: {
        component: React.PropTypes.any,
        className: React.PropTypes.string
    },

    getDefaultProps() {
        return {
            component: 'span'
        };
    },

    componentDidMount() {
        this.hammer = new Hammer(ReactDOM.findDOMNode(this));
        if (this.props.action)      this.hammer.on('tap press',     this.props.action);
        if (this.props.onTap)       this.hammer.on('tap',           this.props.onTap);
        if (this.props.onDoubleTap) this.hammer.on('doubletap',     this.props.onDoubleTap);
        if (this.props.onPan)       this.hammer.on('pan',           this.props.onPan);
        if (this.props.onSwipe)     this.hammer.on('swipe',         this.props.onSwipe);
        if (this.props.onPress)     this.hammer.on('press',         this.props.onPress);
        if (this.props.onPinch)     this.hammer.on('pinch',         this.props.onPinch);
        if (this.props.onRotate)    this.hammer.on('rotate',        this.props.onRotate);
    },

    componentWillUnmount() {
        this.hammer.stop();
        this.hammer.destroy();
        this.hammer = null;
    },

    render() {

        const props = {};

        Object.keys(this.props).forEach(function(i) {
            if (!privateProps[i]) {
                props[i] = this.props[i];
            }
        }, this);

        return React.createElement(this.props.component, props, this.props.children);
    }

};


HammerComponent = React.createClass(HammerComponent);

export { HammerComponent };
