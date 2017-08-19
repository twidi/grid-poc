import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

import { Manipulator } from '../../../app/Grid/Manipulator';

import { Resizer } from '../../../app/Grid/Components/Resizer';
import { Row } from '../../../app/Grid/Components/Row';
import { Store } from '../../../app/Grid/Store';
import { SubGrid } from '../../../app/Grid/Components/SubGrid';

import { Utils } from '../../Utils';
import { componentUtils } from './Utils';


describe('Grid.Components.SubGrid', () => {
    // main grid, and its subgrid defined in beforeEach
    let testGrid;
    let subGrid;

    beforeEach((done) => {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        Utils.mockUniqueId();

        // reset the modules cache for every test
        componentUtils.clearModulesCache();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();
        subGrid = testGrid.querySelector('cell[type=grid]');

        setTimeout(done, 0.01);
    });

    afterEach(() => {
        componentUtils.unmountAllComponents();
    });

    it('should access its main grid', () => {
        const element = React.createElement(SubGrid, { node: subGrid });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getGrid()).toBe(testGrid);
    });

    it('should get its id', () => {
        const element = React.createElement(SubGrid, { node: subGrid });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getNodeId()).toBe(subGrid.getAttribute('id'));
    });

    it('should get the main grid name', () => {
        const element = React.createElement(SubGrid, { node: subGrid });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getGridName()).toEqual('Test grid');
    });

    it('should get the design mode step', () => {
        const element = React.createElement(SubGrid, { node: subGrid });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getDesignModeStep()).toEqual('disabled');

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.getDesignModeStep()).toEqual('enabled');
    });

    it('should know if it\'s in design mode', () => {
        const element = React.createElement(SubGrid, { node: subGrid });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.isInDesignMode()).toBe(false);

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.isInDesignMode()).toBe(true);
    });

    it('should be able to get its grid rows if no resizers', () => {
        const element = React.createElement(SubGrid, { node: subGrid });
        const component = componentUtils.renderIntoDocument(element);
        const rows = component.getRows();
        const expectedRows = _.toArray(subGrid.querySelectorAll(':scope > content > row, :scope > content > resizer'));
        expect(rows).toEqual(expectedRows);
        expect(rows.length).toEqual(2);
        expect(rows[0].tagName).toEqual('row');
        expect(rows[1].tagName).toEqual('row');
    });

    it('should be able to get its grid rows and resizers if any', () => {
        Manipulator.addResizers(testGrid);
        Manipulator.setIds(testGrid);

        const element = React.createElement(SubGrid, { node: subGrid });
        const component = componentUtils.renderIntoDocument(element);
        const rows = component.getRows();
        const expectedRows = _.toArray(subGrid.querySelectorAll(':scope > content > row, :scope > content > resizer'));
        expect(rows).toEqual(expectedRows);
        expect(rows.length).toEqual(3);
        expect(rows[0].tagName).toEqual('row');
        expect(rows[1].tagName).toEqual('resizer');
        expect(rows[2].tagName).toEqual('row');
    });

    it('should be able to render its rows if no resizers', () => {
        const element = React.createElement(SubGrid, { node: subGrid });
        const component = componentUtils.renderIntoDocument(element);
        const rows = component.renderRows();
        expect(rows.length).toEqual(2);
        expect(TestUtils.isElementOfType(rows[0], Row)).toBe(true);
        expect(TestUtils.isElementOfType(rows[1], Row)).toBe(true);
    });

    it('should be able to render its rows and resizers if any', () => {
        Manipulator.addResizers(testGrid);
        Manipulator.setIds(testGrid);

        const element = React.createElement(SubGrid, { node: subGrid });
        const component = componentUtils.renderIntoDocument(element);
        const rows = component.renderRows();
        expect(rows.length).toEqual(3);
        expect(TestUtils.isElementOfType(rows[0], Row)).toBe(true);
        expect(TestUtils.isElementOfType(rows[1], Resizer)).toBe(true);
        expect(TestUtils.isElementOfType(rows[2], Row)).toBe(true);
    });

    it('should render a grid', () => {
        const element = React.createElement(SubGrid, { node: subGrid });
        const component = componentUtils.renderIntoDocument(element);
        const domNode = ReactDOM.findDOMNode(component);
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid')).toBe(true);
        expect(domNode.classList.contains('grid-main')).toBe(false);
        expect(domNode.classList.contains('grid-last-level-with-placeholders')).toBe(false);

        // default relative size => flex-grow=1
        expect(domNode.getAttribute('style')).toMatch(/\bflex-grow\s*:\s*1\b/);

        // update the relativeSize to see if it's taken into account
        subGrid.setAttribute('relativeSize', 2);
        component.forceUpdate();
        // new relative size of the node, check the rendered div
        expect(domNode.getAttribute('style')).toMatch(/\bflex-grow\s*:\s*2\b/);
    });

    it('should have a specific class when its the deepest grid', () => {
        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);

        subGrid = testGrid.querySelector('cell[type=grid] cell[type=grid]');

        const element = React.createElement(SubGrid, { node: subGrid });
        const component = componentUtils.renderIntoDocument(element);
        const domNode = ReactDOM.findDOMNode(component);
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid')).toBe(true);
        expect(domNode.classList.contains('grid-main')).toBe(false);
        expect(domNode.classList.contains('grid-last-level-with-placeholders')).toBe(true);
    });

    it('should render sub components', () => {
        const element = React.createElement(SubGrid, { node: subGrid });
        const component = componentUtils.renderIntoDocument(element);
        expect(componentUtils.countRows(component)).toEqual(2);
        expect(componentUtils.countModules(component)).toEqual(2);
        expect(componentUtils.countSubGrids(component)).toEqual(1);  // self!
    });

});
