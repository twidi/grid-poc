import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

import { Cell } from '../../../app/Grid/Components/Cell';
import { Manipulator } from '../../../app/Grid/Manipulator';
import { Resizer } from '../../../app/Grid/Components/Resizer';
import { Row } from '../../../app/Grid/Components/Row';
import { Store } from '../../../app/Grid/Store';

import { Utils } from '../../Utils';
import { componentUtils } from './Utils';


describe('Grid.Components.Row', () => {
    // main grid, and the row to test defined in beforeEach
    let testGrid;
    let gridRow;

    beforeEach((done) => {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        Utils.mockUniqueId();

        // reset the modules cache for every test
        componentUtils.clearModulesCache();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();
        Manipulator.setIds(testGrid);
        gridRow = testGrid.querySelector('row');

        setTimeout(done, 0.01);
    });

    afterEach(() => {
        componentUtils.unmountAllComponents();
    });

    it('should access its main grid', () => {
        const element = React.createElement(Row, { node: gridRow });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getGrid()).toBe(testGrid);
    });

    it('should get its id', () => {
        const element = React.createElement(Row, { node: gridRow });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getNodeId()).toBe(gridRow.getAttribute('id'));
    });

    it('should get the main grid name', () => {
        const element = React.createElement(Row, { node: gridRow });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getGridName()).toEqual('Test grid');
    });

    it('should get the design mode step', () => {
        const element = React.createElement(Row, { node: gridRow });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getDesignModeStep()).toEqual('disabled');

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.getDesignModeStep()).toEqual('enabled');
    });

    it('should know if it\'s in design mode', () => {
        const element = React.createElement(Row, { node: gridRow });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.isInDesignMode()).toBe(false);

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.isInDesignMode()).toBe(true);
    });

    it('should be able to get its grid cells if no resizers', () => {
        const element = React.createElement(Row, { node: gridRow });
        const component = componentUtils.renderIntoDocument(element);
        const cells = component.getCells();
        const expectedCells = _.toArray(gridRow.querySelectorAll(':scope > cell, :scope > resizer'));
        expect(cells).toEqual(expectedCells);
        expect(cells.length).toEqual(2);
        expect(cells[0].tagName).toEqual('cell');
        expect(cells[1].tagName).toEqual('cell');
    });

    it('should be able to get its grid cells with resizers if any', () => {
        Manipulator.addResizers(testGrid);
        Manipulator.setIds(testGrid);

        const element = React.createElement(Row, { node: gridRow });
        const component = componentUtils.renderIntoDocument(element);
        const cells = component.getCells();
        const expectedCells = _.toArray(gridRow.querySelectorAll(':scope > cell, :scope > resizer'));
        expect(cells).toEqual(expectedCells);
        expect(cells.length).toEqual(3);
        expect(cells[0].tagName).toEqual('cell');
        expect(cells[1].tagName).toEqual('resizer');
        expect(cells[2].tagName).toEqual('cell');
    });

    it('should know if it\'s a placeholder or not', () => {
        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);

        gridRow = testGrid.querySelector('row[type=placeholder]');
        let element = React.createElement(Row, { node: gridRow });
        let component = componentUtils.renderIntoDocument(element);
        expect(component.isPlaceholder()).toBe(true);

        gridRow = testGrid.querySelector('row:not([type=placeholder])');
        element = React.createElement(Row, { node: gridRow });
        component = componentUtils.renderIntoDocument(element);
        expect(component.isPlaceholder()).toBe(false);
    });

    it('should render a row', () => {
        const element = React.createElement(Row, { node: gridRow });
        const component = componentUtils.renderIntoDocument(element);
        const domNode = ReactDOM.findDOMNode(component);
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-row')).toBe(true);
        expect(domNode.classList.contains('grid-row-placeholder')).toBe(false);

        // default relative size => flex-grow=1
        expect(domNode.getAttribute('style')).toMatch(/\bflex-grow\s*:\s*1\b/);

        // update the relativeSize to see if it's taken into account
        gridRow.setAttribute('relativeSize', 2);
        component.forceUpdate();
        // new relative size of the node, check the rendered div
        expect(domNode.getAttribute('style')).toMatch(/\bflex-grow\s*:\s*2\b/);
    });

    it('should render a placeholder', () => {
        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);

        const placeholderGridRow = testGrid.querySelector('row[type=placeholder]');
        const element = React.createElement(Row, { node: placeholderGridRow });
        const component = componentUtils.renderIntoDocument(element);
        const domNode = ReactDOM.findDOMNode(component);
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-row')).toBe(true);
        expect(domNode.classList.contains('grid-row-placeholder')).toBe(true);
    });

    it('should be able to render its cells if no resizers', () => {
        const element = React.createElement(Row, { node: gridRow });
        const component = componentUtils.renderIntoDocument(element);
        const cells = component.renderCells();
        expect(cells.length).toEqual(2);
        expect(TestUtils.isElementOfType(cells[0], Cell)).toBe(true);
        expect(TestUtils.isElementOfType(cells[1], Cell)).toBe(true);
    });

    it('should be able to render its cells and resizers if any', () => {
        Manipulator.addResizers(testGrid);
        Manipulator.setIds(testGrid);

        const element = React.createElement(Row, { node: gridRow });
        const component = componentUtils.renderIntoDocument(element);
        const cells = component.renderCells();
        expect(cells.length).toEqual(3);
        expect(TestUtils.isElementOfType(cells[0], Cell)).toBe(true);
        expect(TestUtils.isElementOfType(cells[1], Resizer)).toBe(true);
        expect(TestUtils.isElementOfType(cells[2], Cell)).toBe(true);
    });

    it('should render sub components', () => {
        const element = React.createElement(Row, { node: gridRow });
        const component = componentUtils.renderIntoDocument(element);
        expect(componentUtils.countRows(component)).toEqual(3); // including self
        expect(componentUtils.countModules(component)).toEqual(3);
        expect(componentUtils.countSubGrids(component)).toEqual(1);
    });

});
