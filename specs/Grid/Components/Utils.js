import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

import { Actions } from '../../../app/Grid/Actions';
import { Manipulator } from '../../../app/Grid/Manipulator';
import { Store } from '../../../app/Grid/Store';

import { Row } from '../../../app/Grid/Components/Row';
import { SubGrid } from '../../../app/Grid/Components/SubGrid';
import { ModulesCache } from '../../../app/Grid/Components/ModulesCache';

export const componentUtils = {
    _componentsCache: [],

    makeTestGrid() {
        var testGrid = Manipulator.XMLStringToXMLGrid(
            '<grid name="Test grid" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module"><content component="Module.Test1" text="test 1-1"/></cell>' +
                        '<cell type="grid">' +
                            '<content>' +
                                '<row>' +
                                    '<cell type="module"><content component="Module.Test2" text="test 2-1"/></cell>' +
                                '</row>' +
                                '<row>' +
                                    '<cell type="module"><content component="Module.Test1" text="test 1-2"/></cell>' +
                                '</row>' +
                            '</content>' +
                        '</cell>' +
                    '</row>' +
                    '<row>' +
                        '<cell type="module"><content component="Module.Test1" text="test 1-3"/></cell>' +
                        '<cell type="module"><content component="Module.Test2" text="test 2-2"/></cell>' +
                        '<cell type="module"><content component="Module.Test2" text="test 2-3"/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>');

        Actions.addGrid(testGrid);
        Manipulator.setIds(testGrid);

        return Store.getGrid('Test grid');
    },

    countRows(component) {
        try {
            return TestUtils.scryRenderedComponentsWithType(component, Row).length;
        } catch (e) {
            return 0;
        }
    },
    countSubGrids(component) {
        try {
            return TestUtils.scryRenderedComponentsWithType(component, SubGrid).length;
        } catch (e) {
            return 0;
        }
    },
    countModules(component) {
        try {
            return TestUtils.scryRenderedDOMComponentsWithClass(component, 'grid-cell-module').length;
        } catch (e) {
            return 0;
        }
    },
    countRowPlaceholders(component) {
        try {
            return TestUtils.scryRenderedDOMComponentsWithClass(component, 'grid-row-placeholder').length;
        } catch (e) {
            return 0;
        }
    },
    countCellPlaceholders(component) {
        try {
            return TestUtils.scryRenderedDOMComponentsWithClass(component, 'grid-cell-placeholder').length;
        } catch (e) {
            return 0;
        }
    },
    countResizers(component) {
        try {
            return TestUtils.scryRenderedDOMComponentsWithClass(component, 'grid-resizer').length;
        } catch (e) {
            return 0;
        }
    },
    countVerticalResizers(component) {
        try {
            return TestUtils.scryRenderedDOMComponentsWithClass(component, 'grid-resizer-vertical').length;
        } catch (e) {
            return 0;
        }
    },
    countHorizontalResizers(component) {
        try {
            return TestUtils.scryRenderedDOMComponentsWithClass(component, 'grid-resizer-horizontal').length;
        } catch (e) {
            return 0;
        }
    },

    clearModulesCache() {
        ModulesCache._cache = {};
    },

    getTextContent(component) {
        return ReactDOM.findDOMNode(component).textContent;
    },

    renderIntoDocument(element) {
        var component = TestUtils.renderIntoDocument(element);
        this._componentsCache.push(component);
        return component;
    },

    unmountComponent(component) {
        // used in unmountAllComponents, it's a copy of the same function in
        // jasmine-react, but we cannot use it as it seems that we have in this
        // case many React instances that doesn't share mounted components
        if (component.isMounted()) {
            return ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
        } else {
            return false;
        }
    },

    unmountAllComponents() {
        for (var i = this._componentsCache.length - 1; i >= 0; i--) {
            var component = this._componentsCache[i];
            try {
                this.unmountComponent(component);
            } catch (e) {
                console.log('Unable to unmount component', component, e);
            }
        }
        this._componentsCache = [];
    },

    simulateDragEvent(domNode, eventName, setDataFunction) {
        TestUtils.Simulate[eventName](domNode, {dataTransfer: {setData: setDataFunction || function() {} }});
    },

};
