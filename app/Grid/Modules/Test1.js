import React from 'react';
import { Module } from './Bases';


class Test1 extends Module {
    renderModule() {
        return <span>Modules.Test1: {this.props.text}</span>;
    }
}

export { Test1 };
