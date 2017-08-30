import React from 'react';
import { Module } from './Bases';


class Test2 extends Module {
    renderModule() {
        return <span>Modules.Test2: {this.props.text}</span>;
    }
}

export { Test2 };
