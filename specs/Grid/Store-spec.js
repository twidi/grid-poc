import _ from 'lodash';

import { Actions, Manipulator, Store } from '../../app/Grid/Data';

import { customMatchers } from '../customMatchers';
import { Utils } from '../Utils';


describe('Grid.Data.Store', () => {
    beforeEach(() => {
        jasmine.addMatchers(customMatchers);

        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        Utils.mockUniqueId();
    });

    const createSimpleGrid = () => {
        const grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module"><content/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>');
        Manipulator.setIds(grid);
        Store.__private.addGrid(grid);
        return Store.getGrid('foo');
    };

    it('should raise if a grid is not available', () => {
        expect(() => {
            Store.getGrid('bar');
        }).toThrowError(Store.Exceptions.GridDoesNotExist, 'No grid with the name <bar>');
    });

    it('should return a grid by its name', (done) => {
        const grid = Manipulator.createBaseGrid('foo', 5);
        Actions.addGrid(grid);

        setTimeout(() => {
            const gridEntry = Store.__private.getGridEntry('foo');
            expect(gridEntry.name).toEqual('foo');
            expect(gridEntry.designModeStep).toEqual('disabled');
            expect(gridEntry.focusedModuleCellId).toBe(null);
            expect(gridEntry.history.length).toEqual(1);
            expect(gridEntry.currentHistoryIndex).toEqual(0);
            expect(gridEntry.backups).toEqual({});
            expect(gridEntry.nodes).toEqual({});
            expect(gridEntry.hoveringTimeout).toBe(null);
            expect(gridEntry.resizing).toEqual({});

            done();
        }, 0.01);
    });

    it('should return a node by its id', () => {
        const grid = createSimpleGrid();
        _(_.toArray(grid.querySelectorAll('*')).concat([grid])).forEach((node) => {
            expect(Store.getGridNodeById('foo', node.getAttribute('id'))).toBe(node);
        });

    });

    it('should return the main grid of a node', () => {
        const grid = createSimpleGrid();
        _(grid.querySelectorAll('*')).forEach((node) => {
            expect(Store.getMainGrid(node)).toBe(grid);
        });
        expect(Store.getMainGrid(grid)).toBe(grid);
    });

    it('should return the id attribute of a node', () => {
        const grid = createSimpleGrid();
        _(grid.querySelectorAll('*')).forEach((node) => {
            expect(Store.getNodeId(node)).toBe(node.getAttribute('id'));
        });
        expect(Store.getNodeId(grid)).toBe(grid.getAttribute('id'));
    });

    it('should return the name of the main grid for a node', () => {
        const grid = createSimpleGrid();
        _(grid.querySelectorAll('*')).forEach((node) => {
            expect(Store.getMainGridName(node)).toBe('foo');
        });
        expect(Store.getMainGridName(grid)).toBe('foo');
    });

    it('should return the design mode step for a node', () => {
        createSimpleGrid();
        expect(Store.getDesignModeStep('foo')).toBe('disabled');
    });

    it('should tell if the grid is in dragging mode', () => {
        createSimpleGrid();
        expect(Store.isDragging('foo')).toBe(false);
        // it's in dragging mode if there is a node currently dragged
        Store.__private.grids.foo.nodes.dragging = true;
        expect(Store.isDragging('foo')).toBe(true);
    });

    it('should tell if it\'s the dragging cell', () => {
        const grid = createSimpleGrid();

        const row = grid.querySelector('row');
        const cell = grid.querySelector('cell[type=module]');
        const otherCell = Manipulator.addCell(row, null, 'module');

        expect(Store.isDraggingCell('foo', cell)).toBe(false);

        // it's the content that is saved
        Store.__private.grids.foo.nodes.dragging = cell.querySelector(':scope > content');
        expect(Store.isDraggingCell('foo', cell)).toBe(true);

        // check another cell
        expect(Store.isDraggingCell('foo', otherCell)).toBe(false);
    });

    it('should tell if the grid is in hovering mode', () => {
        createSimpleGrid();
        expect(Store.isHovering('foo')).toBe(false);
        // it's in dragging mode if there is a node currently hovered
        Store.__private.grids.foo.nodes.hovering = true;
        expect(Store.isHovering('foo')).toBe(true);
    });

    it('should tell if it\'s the hovering cell', () => {
        const grid = createSimpleGrid();

        const row = grid.querySelector('row');
        const cell = grid.querySelector('cell[type=module]');
        const otherCell = Manipulator.addCell(row, null, 'module');

        expect(Store.isHoveringPlaceholder('foo', cell)).toBe(false);

        Store.__private.grids.foo.nodes.hovering = cell;
        expect(Store.isHoveringPlaceholder('foo', cell)).toBe(true);

        // check another cell
        expect(Store.isHoveringPlaceholder('foo', otherCell)).toBe(false);
    });

    it('should tell if the grid is in resizing mode', () => {
        createSimpleGrid();
        expect(Store.isResizing('foo')).toBe(false);
        // it's in resizing mode if there is a resizer node currently moved
        Store.__private.grids.foo.nodes.resizing = true;
        expect(Store.isResizing('foo')).toBe(true);
    });

    it('should tell if it\'s the moving resizer', () => {
        const grid = createSimpleGrid();
        // add two rows to have two resizers between them
        Manipulator.addRow(grid);
        Manipulator.addRow(grid);

        Manipulator.addResizers(grid);
        Manipulator.setIds(grid);

        const resizer1 = grid.querySelectorAll('resizer')[0];
        const resizer2 = grid.querySelectorAll('resizer')[1];

        // not marked as moving
        expect(Store.isMovingResizer('foo', resizer1)).toBe(false);

        // mark it as the one moving
        Store.__private.grids.foo.nodes.resizing = resizer1;
        expect(Store.isMovingResizer('foo', resizer1)).toBe(true);

        // check another resizer
        expect(Store.isMovingResizer('foo', resizer2)).toBe(false);
    });

    it('should tell if a grid has a subgrid', () => {
        const grid = Manipulator.createBaseGrid('foo');
        Store.__private.addGrid(grid);
        expect(Store.containsSubGrid(grid)).toBe(false);

        let row = Manipulator.addRow(grid);
        Manipulator.addCell(row, null, 'module');
        expect(Store.containsSubGrid(grid)).toBe(false);

        const subGrid = Manipulator.addCell(row, null, 'grid');
        expect(Store.containsSubGrid(grid)).toBe(true);
        expect(Store.containsSubGrid(subGrid)).toBe(false);

        row = Manipulator.addRow(subGrid);
        Manipulator.addCell(row, null, 'module');
        expect(Store.containsSubGrid(grid)).toBe(true);
        expect(Store.containsSubGrid(subGrid)).toBe(false);

        const subSubGrid = Manipulator.addCell(row, null, 'grid');
        expect(Store.containsSubGrid(grid)).toBe(true);
        expect(Store.containsSubGrid(subGrid)).toBe(true);
        expect(Store.containsSubGrid(subSubGrid)).toBe(false);
    });

    it('should tell if the grid has placeholders', () => {
        const grid = createSimpleGrid();
        expect(Store.hasPlaceholders('foo')).toBe(false);
        Manipulator.addPlaceholders(grid);
        expect(Store.hasPlaceholders('foo')).toBe(true);
    });

    it('should tell if the grid has resizers', () => {
        const grid = createSimpleGrid();
        expect(Store.hasResizers('foo')).toBe(false);
        Manipulator.addResizers(grid);
        expect(Store.hasResizers('foo')).toBe(true);
    });

    it('should get the relative size of a node', () => {
        const grid = createSimpleGrid();
        const row = grid.querySelector('row');

        // not defined, 1 by default
        expect(Store.getRelativeSize(row)).toEqual(1);

        row.setAttribute('relativeSize', 2);
        expect(Store.getRelativeSize(row)).toEqual(2);

        row.setAttribute('relativeSize', 1.234);
        expect(Store.getRelativeSize(row)).toEqual(1.234);
    });

    it('should tell if possible to go through history', () => {
        createSimpleGrid();
        const gridEntry = Store.__private.getGridEntry('foo');

        // only one entry, cannot bo back
        expect(Store.canGoBackInHistory('foo')).toBe(false);
        // neither forward
        expect(Store.canGoForwardInHistory('foo')).toBe(false);

        // add a fake entry
        gridEntry.history.push(null);

        // style at first pos, cannot go back
        expect(Store.canGoBackInHistory('foo')).toBe(false);
        // but can go forward
        expect(Store.canGoForwardInHistory('foo')).toBe(true);

        // go to second entry
        gridEntry.currentHistoryIndex = 1;

        // can now got back
        expect(Store.canGoBackInHistory('foo')).toBe(true);
        // but not forward
        expect(Store.canGoForwardInHistory('foo')).toBe(false);

        // add another fake entry
        gridEntry.history.push(null);
        // can now got back
        expect(Store.canGoBackInHistory('foo')).toBe(true);
        // and forward
        expect(Store.canGoForwardInHistory('foo')).toBe(true);
    });

    it('should tell if its the focused module cell', () => {
        const grid = createSimpleGrid();
        // add another module cell
        Manipulator.addCell(grid.querySelector('row'), null, 'module');
        Manipulator.setIds(grid);

        const moduleCell1 = grid.querySelector('cell[type=module]');
        const moduleCell2 = grid.querySelector('cell ~ cell[type=module]');

        // not focused yet
        expect(Store.isFocusedModuleCell('foo', moduleCell1)).toBe(false);
        expect(Store.isFocusedModuleCell('foo', moduleCell2)).toBe(false);

        // mark the first as the focused one
        Store.__private.grids.foo.focusedModuleCellId = 'cell-4';

        // the first one is focused
        expect(Store.isFocusedModuleCell('foo', moduleCell1)).toBe(true);
        expect(Store.isFocusedModuleCell('foo', moduleCell2)).toBe(false);

        // mark the second as the focused one
        Store.__private.grids.foo.focusedModuleCellId = 'cell-6';

        // the second one is focused
        expect(Store.isFocusedModuleCell('foo', moduleCell1)).toBe(false);
        expect(Store.isFocusedModuleCell('foo', moduleCell2)).toBe(true);
    });

    describe('Private api', () => {

        it('should return a grid entry', () => {
            const grid = createSimpleGrid();

            const entry = Store.__private.getGridEntry('foo');

            expect(entry.name).toBe('foo');
            expect(entry.grid).toBe(grid);
            expect(entry.designModeStep).toEqual('disabled');
            expect(entry.oneScreenMode).toBe(false);
            expect(entry.focusedModuleCellId).toBe(null);
            expect(entry.history.length).toEqual(1);
            expect(entry.currentHistoryIndex).toEqual(0);
            expect(entry.backups).toEqual({});
            expect(entry.nodes).toEqual({});
            expect(entry.hoveringTimeout).toBe(null);
            expect(entry.resizing).toEqual({});

            expect(_.size(entry)).toEqual(11);
        });

        it('should raise if a grid entry is not available', () => {
            expect(() => {
                Store.__private.getGridEntry('bar');
            }).toThrowError(Store.Exceptions.GridDoesNotExist, 'No grid with the name <bar>');
        });

        it('should raise if a asking to change design mode step for a grid that doesn\'t exist', () => {
            expect(() => {
                Store.__private.changeDesignModeStep('foo', 'bar', true);
            }).toThrowError(Store.Exceptions.GridDoesNotExist, 'No grid with the name <foo>');
        });

        it('should raise if a design mode step doesn\'t exist', () => {
            createSimpleGrid();

            expect(() => {
                Store.__private.changeDesignModeStep('foo', 'bar', true);
            }).toThrowError(
                Store.Exceptions.InvalidDesignModeStep,
                'The given design mode step <bar> is not a valid one'
            );

        });

        it('should ignore setting the current design mode step', () => {
            createSimpleGrid();
            ['disabled', 'enabled', 'dragging', 'prehovering', 'hovering'].forEach((step) => {
                Store.__private.setDesignModeStep('foo', step);
                expect(() => {
                    Store.__private.changeDesignModeStep('foo', step, true);
                }).not.toThrowError(Store.Exceptions.InvalidDesignModeStep);
                expect(Store.__private.getDesignModeStep('foo')).toEqual(step);
            });
        });

        it('should allow changing ony allowed design mode steps', () => {
            createSimpleGrid();

            const tests = {
                disabled: {
                    allowed: ['enabled'],
                    denied: ['dragging', 'prehovering', 'hovering']
                },
                enabled: {
                    allowed: ['disabled', 'dragging'],
                    denied: ['prehovering', 'hovering']
                },
                dragging: {
                    allowed: ['enabled', 'prehovering'],
                    denied: ['disabled', 'hovering']
                },
                prehovering: {
                    allowed: ['dragging', 'hovering', 'enabled'],
                    denied: ['disabled']
                },
                hovering: {
                    allowed: ['dragging', 'enabled'],
                    denied: ['disabled', 'prehovering']
                }
            };

            _.each(tests, (rules, initialStep) => {
                // check that setting denied new steps raises an error
                rules.denied.forEach((invalidStep) => {
                    Store.__private.setDesignModeStep('foo', initialStep);

                    expect(() => {
                        Store.__private.changeDesignModeStep('foo', invalidStep, true);
                    }).toThrowError(
                        Store.Exceptions.InvalidDesignModeStep,
                        `The given design mode step <${invalidStep}> is not valid step ` +
                        `to go after the current one which is <${initialStep}>`);

                    // we should still have the same initial step
                    expect(Store.__private.getDesignModeStep('foo')).toEqual(initialStep);
                });

                // check that setting allowed steps does not raise any errors
                rules.allowed.forEach((validStep) => {
                    Store.__private.setDesignModeStep('foo', initialStep);

                    expect(() => {
                        Store.__private.changeDesignModeStep('foo', validStep, true);
                    }).not.toThrowError(Store.Exceptions.InvalidDesignModeStep);

                    // we should have the new step
                    expect(Store.__private.getDesignModeStep('foo')).toEqual(validStep);
                });

            });
        });

        describe('it should add placeholders if missing when changing design mode step', () => {
            // allowed changes that should end with placeholders
            const tests = {
                enabled: ['dragging'],
                dragging: ['prehovering'],
                prehovering: ['dragging'],
                hovering: ['dragging']
            };

            _.each(tests, (steps, initialStep) => {
                steps.forEach((step) => {
                    it(`should add/keep them from ${initialStep} to ${step}`, () => {
                        const grid = createSimpleGrid();

                        spyOn(Manipulator, 'addPlaceholders').and.callThrough();
                        spyOn(Manipulator, 'removePlaceholders').and.callThrough();

                        // test going from `initialStep` asking to not change the grid
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step, true);

                        expect(Manipulator.hasPlaceholders(grid)).toBe(false, 'dontManageGrid=true');
                        expect(Manipulator.addPlaceholders.calls.count()).toEqual(0, 'dontManageGrid=true');
                        expect(Manipulator.removePlaceholders.calls.count()).toEqual(0, 'dontManageGrid=true');

                        // test going from `initialStep` asking to change the grid (the default)
                        Manipulator.addPlaceholders.calls.reset();
                        Manipulator.removePlaceholders.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        expect(Manipulator.hasPlaceholders(grid)).toBe(true, 'dontManageGrid=false');
                        expect(Manipulator.addPlaceholders.calls.count()).toEqual(1, 'dontManageGrid=false');
                        expect(Manipulator.removePlaceholders.calls.count()).toEqual(0, 'dontManageGrid=false');

                        // same check but the grid still have placeholders
                        Manipulator.addPlaceholders.calls.reset();
                        Manipulator.removePlaceholders.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        // nothing changed
                        expect(Manipulator.hasPlaceholders(grid)).toBe(true, 'already have placeholders');
                        expect(Manipulator.addPlaceholders.calls.count()).toEqual(0, 'already have placeholders');
                        expect(Manipulator.removePlaceholders.calls.count()).toEqual(0, 'already have placeholders');
                    });
                });
            });
        });

        describe('it should remove placeholders if present when changing design mode step', () => {
            // allowed changes that should end with no placeholders
            const tests = {
                disabled: ['enabled'],
                enabled: ['disabled', 'resizing'],
                resizing: ['enabled'],
                dragging: ['enabled'],
                prehovering: ['enabled', 'hovering'],
                hovering: ['enabled']
            };

            _.each(tests, (steps, initialStep) => {
                steps.forEach((step) => {
                    it(`should remove/ignore them from ${initialStep} to ${step}`, () => {
                        const grid = createSimpleGrid();
                        Manipulator.addPlaceholders(grid);

                        spyOn(Manipulator, 'addPlaceholders').and.callThrough();
                        spyOn(Manipulator, 'removePlaceholders').and.callThrough();

                        // test going from `initialStep` asking to not change the grid
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step, true);

                        expect(Manipulator.hasPlaceholders(grid)).toBe(true, 'dontManageGrid=true');
                        expect(Manipulator.addPlaceholders.calls.count()).toEqual(0, 'dontManageGrid=true');
                        expect(Manipulator.removePlaceholders.calls.count()).toEqual(0, 'dontManageGrid=true');

                        // test going from `initialStep` asking to change the grid (the default)
                        Manipulator.addPlaceholders.calls.reset();
                        Manipulator.removePlaceholders.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        expect(Manipulator.hasPlaceholders(grid)).toBe(false, 'dontManageGrid=false');
                        expect(Manipulator.addPlaceholders.calls.count()).toEqual(0, 'dontManageGrid=false');
                        expect(Manipulator.removePlaceholders.calls.count()).toEqual(1, 'dontManageGrid=false');

                        // same check but the grid still have placeholders
                        Manipulator.addPlaceholders.calls.reset();
                        Manipulator.removePlaceholders.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        // nothing changed
                        expect(Manipulator.hasPlaceholders(grid)).toBe(
                            false, 'already have no more placeholders');
                        expect(Manipulator.addPlaceholders.calls.count()).toEqual(
                            0, 'already have no more placeholders');
                        expect(Manipulator.removePlaceholders.calls.count()).toEqual(
                            0, 'already have no more placeholders');
                    });
                });
            });
        });

        describe('it should add resizers if missing when changing design mode step', () => {
            // allowed changes that should end with resizers
            const tests = {
                disabled: ['enabled'],
                enabled: ['resizing'],
                resizing: ['enabled'],
                dragging: ['enabled'],
                prehovering: ['enabled'],
                hovering: ['enabled']
            };

            _.each(tests, (steps, initialStep) => {
                steps.forEach((step) => {
                    it(`should add/keep them from ${initialStep} to ${step}`, () => {
                        const grid = createSimpleGrid();

                        spyOn(Manipulator, 'addResizers').and.callThrough();
                        spyOn(Manipulator, 'removeResizers').and.callThrough();

                        // test going from `initialStep` asking to not change the grid
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step, true);

                        expect(Manipulator.hasResizers(grid)).toBe(false, 'dontManageGrid=true');
                        expect(Manipulator.addResizers.calls.count()).toEqual(0, 'dontManageGrid=true');
                        expect(Manipulator.removeResizers.calls.count()).toEqual(0, 'dontManageGrid=true');

                        // test going from `initialStep` asking to change the grid (the default)
                        Manipulator.addResizers.calls.reset();
                        Manipulator.removeResizers.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        expect(Manipulator.hasResizers(grid)).toBe(true, 'dontManageGrid=false');
                        expect(Manipulator.addResizers.calls.count()).toEqual(1, 'dontManageGrid=false');
                        expect(Manipulator.removeResizers.calls.count()).toEqual(0, 'dontManageGrid=false');

                        // same check but the grid still have resizers
                        Manipulator.addResizers.calls.reset();
                        Manipulator.removeResizers.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        // nothing changed
                        expect(Manipulator.hasResizers(grid)).toBe(true, 'already have resizers');
                        expect(Manipulator.addResizers.calls.count()).toEqual(0, 'already have resizers');
                        expect(Manipulator.removeResizers.calls.count()).toEqual(0, 'already have resizers');
                    });
                });
            });
        });

        describe('it should remove resizers if present when changing design mode step', () => {
            // allowed changes that should end with no resizers
            const tests = {
                enabled: ['disabled', 'dragging'],
                dragging: ['prehovering'],
                prehovering: ['dragging', 'hovering'],
                hovering: ['dragging']
            };

            _.each(tests, (steps, initialStep) => {
                steps.forEach((step) => {
                    it(`should remove/ignore them from ${initialStep} to ${step}`, () => {
                        const grid = createSimpleGrid();
                        Manipulator.addResizers(grid);

                        spyOn(Manipulator, 'addResizers').and.callThrough();
                        spyOn(Manipulator, 'removeResizers').and.callThrough();

                        // test going from `initialStep` asking to not change the grid
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step, true);

                        expect(Manipulator.hasResizers(grid)).toBe(true, 'dontManageGrid=true');
                        expect(Manipulator.addResizers.calls.count()).toEqual(0, 'dontManageGrid=true');
                        expect(Manipulator.removeResizers.calls.count()).toEqual(0, 'dontManageGrid=true');

                        // test going from `initialStep` asking to change the grid (the default)
                        Manipulator.addResizers.calls.reset();
                        Manipulator.removeResizers.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        expect(Manipulator.hasResizers(grid)).toBe(false, 'dontManageGrid=false');
                        expect(Manipulator.addResizers.calls.count()).toEqual(0, 'dontManageGrid=false');
                        expect(Manipulator.removeResizers.calls.count()).toEqual(1, 'dontManageGrid=false');

                        // same check but the grid still have resizers
                        Manipulator.addResizers.calls.reset();
                        Manipulator.removeResizers.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        // nothing changed
                        expect(Manipulator.hasResizers(grid)).toBe(false, 'already have no more resizers');
                        expect(Manipulator.addResizers.calls.count()).toEqual(0, 'already have no more resizers');
                        expect(Manipulator.removeResizers.calls.count()).toEqual(0, 'already have no more resizers');
                    });
                });
            });
        });

        it('should set the design step mode', () => {
            // without grid, should raise
            expect(() => {
                Store.__private.setDesignModeStep('bar', 'enabled');
            }).toThrowError(Store.Exceptions.GridDoesNotExist, 'No grid with the name <bar>');

            // create a grid
            createSimpleGrid();

            // test each entry (default mode is "disabled" so we don't start with it)
            ['enabled', 'dragging', 'prehovering', 'hovering', 'disabled'].forEach((step) => {
                Store.__private.setDesignModeStep('foo', step);
                expect(Store.__private.grids.foo.designModeStep).toEqual(step);
            });

        });

        it('should check consistency of grid name and node', () => {

            // bad for non-existent grid
            expect(() => {
                Store.__private.checkConsistency('absent');
            }).toThrowError(Store.Exceptions.GridDoesNotExist, 'No grid with the name <absent>');

            const grid = createSimpleGrid();
            const node = grid.querySelector('cell');

            // ok for grid+node
            expect(() => {
                Store.__private.checkConsistency('foo', node);
            }).not.toThrow();

            // create a new grid, but not yet in the store
            let grid2 = Manipulator.createBaseGrid('bar', 5);
            let node2 = Manipulator.addCell(Manipulator.addRow(grid2), null, 'module');

            expect(() => {
                Store.__private.checkConsistency('bar');
            }).toThrowError(Store.Exceptions.GridDoesNotExist, 'No grid with the name <bar>');
            expect(() => {
                Store.__private.checkConsistency('bar', node2);
            }).toThrowError(Store.Exceptions.GridDoesNotExist, 'No grid with the name <bar>');

            // now add the grid in the store
            Actions.addGrid(grid2);
            grid2 = Store.getGrid('bar');
            node2 = Manipulator.addCell(Manipulator.addRow(grid2), null, 'module');

            // ok for grid2+node2
            expect(() => {
                Store.__private.checkConsistency('bar', node2);
            }).not.toThrow();

            // bad for node not in the grid
            expect(() => {
                Store.__private.checkConsistency('foo', node2);
            }).toThrowError(Store.Exceptions.Inconsistency, 'The given cell is not contained in the grid <foo>');

            // ok for valid grid, and no node
            expect(() => {
                Store.__private.checkConsistency('bar');
            }).not.toThrow();
        });

        it('should backup a grid', () => {
            const grid = createSimpleGrid();

            // save a first backup
            Store.__private.backupGrid('foo', 'first');
            expect(_.size(Store.__private.grids.foo.backups)).toEqual(1);

            // the original grid is backed-up
            expect(Store.__private.grids.foo.backups.first).toBe(grid);
            // the official grid is the clone
            const firstClone = Store.__private.grids.foo.grid;
            expect(Store.getGrid('foo')).toBe(firstClone);
            // both are different objects
            expect(firstClone).not.toBe(grid);
            // check that both grids have the same xml
            expect(firstClone).toEqualXML(grid);

            // we can save another backup
            Store.__private.backupGrid('foo', 'second');
            expect(_.size(Store.__private.grids.foo.backups)).toEqual(2);

            // the original grid is still here
            expect(Store.__private.grids.foo.backups.first).toBe(grid);
            // the first clone is backed-up
            expect(Store.__private.grids.foo.backups.second).toBe(firstClone);
            // the official grid is the second clone
            const secondClone = Store.__private.grids.foo.grid;
            expect(Store.getGrid('foo')).toBe(secondClone);
            // there are all different objects
            expect(secondClone).not.toBe(grid);
            expect(secondClone).not.toBe(firstClone);
            // but they have the same xml
            expect(secondClone).toEqualXML(firstClone);

        });

        it('should restore a grid', () => {

            const grid = createSimpleGrid();

            // make a backup
            Store.__private.backupGrid('foo', 'first');
            let firstClone = Store.__private.grids.foo.grid;

            // do nothing if restoring non-existent backup
            let restored = Store.__private.restoreGrid('foo', 'fake');
            expect(restored).toBe(undefined);
            expect(_.size(Store.__private.grids.foo.backups)).toEqual(1);
            expect(Store.getGrid('foo')).toBe(firstClone);

            // restore backup
            restored = Store.__private.restoreGrid('foo', 'first');

            // the original grid should be the current one
            expect(Store.getGrid('foo')).toBe(grid);
            expect(restored).toBe(grid);

            // we should have no backup left
            expect(_.size(Store.__private.grids.foo.backups)).toEqual(0);

            // make a new first backup
            Store.__private.backupGrid('foo', 'first');
            firstClone = Store.__private.grids.foo.grid;
            // and another
            Store.__private.backupGrid('foo', 'second');

            // first restore
            restored = Store.__private.restoreGrid('foo', 'second');
            expect(_.size(Store.__private.grids.foo.backups)).toEqual(1);

            // the first clone should be the current one
            expect(Store.getGrid('foo')).toBe(firstClone);
            expect(restored).toBe(firstClone);

            // second restore
            restored = Store.__private.restoreGrid('foo', 'first');
            expect(_.size(Store.__private.grids.foo.backups)).toEqual(0);

            // the original grid should be the current one
            expect(Store.getGrid('foo')).toBe(grid);
            expect(restored).toBe(grid);
        });

        it('should clear a backup grid', () => {
            createSimpleGrid();

            // should do nothing if no such backup
            expect(() => {
                Store.__private.clearBackedUpGrid('fake', 'fake');
            }).not.toThrow();
            expect(_.size(Store.__private.grids.foo.backups)).toEqual(0);

            Store.__private.backupGrid('foo', 'first');
            expect(_.size(Store.__private.grids.foo.backups)).toEqual(1);

            Store.__private.clearBackedUpGrid('foo', 'first');
            expect(_.size(Store.__private.grids.foo.backups)).toEqual(0);
        });

        it('should save a node', () => {
            const grid = createSimpleGrid();
            const row = grid.querySelector('row');
            const cell = grid.querySelector('cell[type=module]');

            Store.__private.saveNode('foo', cell, 'my_cell');

            expect(_.size(Store.__private.grids.foo.nodes)).toEqual(1);
            expect(Store.__private.grids.foo.nodes.my_cell).toBe(cell);

            Store.__private.saveNode('foo', row, 'my_row');

            expect(_.size(Store.__private.grids.foo.nodes)).toEqual(2);
            expect(Store.__private.grids.foo.nodes.my_cell).toBe(cell);
            expect(Store.__private.grids.foo.nodes.my_row).toBe(row);

        });

        it('should find a saved node in another grid using its id', () => {
            const grid = createSimpleGrid();
            const row = grid.querySelector('row');
            const cell = grid.querySelector('cell[type=module]');

            // first test without changing the grid
            let clonedRow = Store.__private.getSameNodeInActualGrid('foo', row);
            let clonedCell = Store.__private.getSameNodeInActualGrid('foo', cell);

            expect(clonedRow).not.toBe(undefined);
            expect(clonedRow).toBe(row);

            expect(clonedCell).not.toBe(undefined);
            expect(clonedCell).toBe(cell);

            // make a backup, the main grid is not the initial one
            Store.__private.backupGrid('foo', 'first');

            clonedRow = Store.__private.getSameNodeInActualGrid('foo', row);
            clonedCell = Store.__private.getSameNodeInActualGrid('foo', cell);

            expect(clonedRow).not.toBe(undefined);
            expect(clonedRow).not.toBe(row);
            expect(clonedRow).toEqualXML(row);

            expect(clonedCell).not.toBe(undefined);
            expect(clonedCell).not.toBe(cell);
            expect(clonedCell).toEqualXML(cell);

        });

        it('should get the saved node', () => {
            const grid = createSimpleGrid();
            const row = grid.querySelector('row');
            const cell = grid.querySelector('cell[type=module]');

            Store.__private.saveNode('foo', cell, 'my_cell');
            Store.__private.saveNode('foo', row, 'my_row');

            // get nodes without changing the grid
            let fetchedCell = Store.__private.getSavedNode('foo', 'my_cell');
            expect(fetchedCell).toBe(cell);
            let fetchedRow = Store.__private.getSavedNode('foo', 'my_row');
            expect(fetchedRow).toBe(row);

            // nodes are still saved
            expect(_.size(Store.__private.grids.foo.nodes)).toEqual(2);

            // get an non-existent node
            expect(() => {
                Store.__private.getSavedNode('foo', 'fake');
            }).not.toThrow();

            // nodes are still saved
            expect(_.size(Store.__private.grids.foo.nodes)).toEqual(2);

            // now try with an updated grid
            Store.__private.backupGrid('foo', 'first');

            // but asking to not update the nodes to be one in the actual grid
            fetchedCell = Store.__private.getSavedNode('foo', 'my_cell', true);
            expect(fetchedCell).toBe(cell);
            fetchedRow = Store.__private.getSavedNode('foo', 'my_row', true);
            expect(fetchedRow).toBe(row);

            // now ask to adapt to be the same node in the actual grid
            fetchedCell = Store.__private.getSavedNode('foo', 'my_cell');
            expect(fetchedCell).not.toBe(cell);
            expect(fetchedCell).toEqualXML(cell);
            fetchedRow = Store.__private.getSavedNode('foo', 'my_row');
            expect(fetchedRow).not.toBe(row);
            expect(fetchedRow).toEqualXML(row);

        });

        it('should clear a saved node', () => {
            const grid = createSimpleGrid();
            const row = grid.querySelector('row');
            const cell = grid.querySelector('cell[type=module]');

            Store.__private.saveNode('foo', cell, 'my_cell');
            Store.__private.saveNode('foo', row, 'my_row');

            // clear an non-existent node
            expect(() => {
                Store.__private.clearSavedNode('foo', 'fake');
            }).not.toThrow();
            expect(_.size(Store.__private.grids.foo.nodes)).toEqual(2);

            Store.__private.clearSavedNode('foo', 'my_cell');
            expect(_.size(Store.__private.grids.foo.nodes)).toEqual(1);
            expect(Store.__private.getSavedNode('foo', 'my_cell')).toBe(null);
            expect(Store.__private.getSavedNode('foo', 'my_row')).toBe(row);

            Store.__private.clearSavedNode('foo', 'my_row');
            expect(_.size(Store.__private.grids.foo.nodes)).toEqual(0);
            expect(Store.__private.getSavedNode('foo', 'my_row')).toBe(null);

        });

        it('should set the hovering timeout', (done) => {
            createSimpleGrid();

            spyOn(Store.__private, 'stayHovering').and.callThrough();

            // reduce the delay
            const defaultHoveringDelay = Store.__private.hoveringDelay;
            Store.__private.hoveringDelay = 0.01;

            try {
                Store.__private.setHoveringTimeout('foo');
                expect(Store.__private.grids.foo.hoveringTimeout).not.toBe(null);
            } finally {
                setTimeout(() => {
                    // check if the function were called
                    expect(Store.__private.stayHovering.calls.count()).toEqual(1);
                    // the function should have cleared the timeout
                    expect(Store.__private.grids.foo.hoveringTimeout).toBe(null);
                    done();
                }, 0.02);
                // restore the original delay
                Store.__private.hoveringDelay = defaultHoveringDelay;
            }

        });

        it('should clear the hovering timeout', (done) => {
            createSimpleGrid();

            spyOn(Store.__private, 'stayHovering').and.callThrough();

            // reduce the delay
            const defaultHoveringDelay = Store.__private.hoveringDelay;
            Store.__private.hoveringDelay = 0.01;

            try {
                // set the timeout
                Store.__private.setHoveringTimeout('foo');
                expect(Store.__private.grids.foo.hoveringTimeout).not.toBe(null);
                // but clear it just after
                Store.__private.clearHoveringTimeout('foo');
                // we should not have a timeout set anymore
                expect(Store.__private.grids.foo.hoveringTimeout).toBe(null);
            } finally {
                setTimeout(() => {
                    // check if the function were NOT called
                    expect(Store.__private.stayHovering.calls.count()).toEqual(0);
                    // there should be no timeout set
                    expect(Store.__private.grids.foo.hoveringTimeout).toBe(null);
                    done();
                }, 0.02);
                // restore the original delay
                Store.__private.hoveringDelay = defaultHoveringDelay;
            }


        });

        it('should add an updated grid in the history', () => {
            let grid = createSimpleGrid();
            const gridEntry = Store.__private.getGridEntry('foo');

            // we should have one entry in the history
            expect(gridEntry.history.length).toEqual(1);
            // and we should be at the first/last one
            expect(gridEntry.currentHistoryIndex).toEqual(0);
            // having one row
            expect(gridEntry.history[0].querySelectorAll(':scope > content > row').length).toEqual(1);

            // add a second row to have a different grid
            Manipulator.addRow(grid);
            Manipulator.setIds(grid);

            Store.__private.addCurrentGridToHistory('foo');
            const newGrid = Store.getGrid('foo');

            // we should have two entries now
            expect(gridEntry.history.length).toEqual(2);
            // and we should be at the last one
            expect(gridEntry.currentHistoryIndex).toEqual(1);
            // the last entry should be our updated grid
            expect(gridEntry.history[1]).toBe(grid);
            // having two rows
            expect(gridEntry.history[1].querySelectorAll(':scope > content > row').length).toEqual(2);

            // it should not be the one that was there
            expect(newGrid).not.toBe(grid);
            // but they have the same content
            expect(newGrid).toEqualXML(grid);

            // add third row
            grid = Store.getGrid('foo');
            Manipulator.addRow(grid);
            Manipulator.setIds(grid);

            // add the new grid to the history
            Store.__private.addCurrentGridToHistory('foo');

            // we should have three entries now
            expect(gridEntry.history.length).toEqual(3);
            // and we should be at the last one
            expect(gridEntry.currentHistoryIndex).toEqual(2);
            // which has a grid with 3 rows
            expect(gridEntry.history[2].querySelectorAll(':scope > content > row').length).toEqual(3);

            // go to first entry
            Store.__private.goBackInHistory('foo');
            Store.__private.goBackInHistory('foo');
            gridEntry.currentHistoryIndex = 0;

            // we still have one row in the first entry which didn't change
            expect(gridEntry.history[0].querySelectorAll(':scope > content > row').length).toEqual(1);

            // and still 3 entries in the history
            expect(gridEntry.history.length).toEqual(3);

            // update our grid with 3 more rows
            grid = Store.getGrid('foo');
            Manipulator.addRow(grid);
            Manipulator.addRow(grid);
            Manipulator.addRow(grid);
            Manipulator.setIds(grid);

            // add the new grid to the history
            Store.__private.addCurrentGridToHistory('foo');

            // we should only have two entries in the history, the previous one, and the new one
            // all after the previous one were discarded
            expect(gridEntry.history.length).toEqual(2);
            // and we should be at the last one
            expect(gridEntry.currentHistoryIndex).toEqual(1);
            // the last entry should be our updated grid
            expect(gridEntry.history[1]).toBe(grid);
            // having four rows
            expect(gridEntry.history[1].querySelectorAll(':scope > content > row').length).toEqual(4);
        });

        it('should restore a ready and usable grid from history', () => {
            createSimpleGrid();

            // no placeholders by default
            expect(Store.hasPlaceholders('foo')).toBe(false);
            // no resizers by default
            expect(Store.hasResizers('foo')).toBe(false);

            // restore should add resizers (to be usable in "enabled" design mode)
            Store.__private.restoreFromCurrentHistoryIndex('foo');

            // still no placeholders
            expect(Store.hasPlaceholders('foo')).toBe(false);
            // but we have resizers
            expect(Store.hasResizers('foo')).toBe(true);

            // remove resizers and add placeholders
            Manipulator.removeResizers(Store.getGrid('foo'));
            Manipulator.addPlaceholders(Store.getGrid('foo'));

            // and at it in the history
            Store.__private.addCurrentGridToHistory('foo');

            // should have placeholders
            expect(Store.hasPlaceholders('foo')).toBe(true);
            // and no resizers
            expect(Store.hasResizers('foo')).toBe(false);

            // restore should remove placeholders (to be usable in "enabled" design mode)
            Store.__private.restoreFromCurrentHistoryIndex('foo');

            // no placeholders anymore
            expect(Store.hasPlaceholders('foo')).toBe(false);
            // but we have resizers
            expect(Store.hasResizers('foo')).toBe(true);

        });

        it('should fail when going out of history bound', () => {
            createSimpleGrid();

            // cannot go back
            expect(() => {
                Store.__private.goBackInHistory('foo');
            }).toThrowError(Store.Exceptions.HistoryOutOfBound, 'Cannot go backward in history for grid <foo>');

            // neither forward
            expect(() => {
                Store.__private.goForwardInHistory('foo');
            }).toThrowError(Store.Exceptions.HistoryOutOfBound, 'Cannot go forward in history for grid <foo>');

        });

        it('should get the focused module cell', () => {
            const grid = createSimpleGrid();
            // add another module cell
            Manipulator.addCell(grid.querySelector('row'), null, 'module');
            Manipulator.setIds(grid);

            const moduleCell1 = grid.querySelector('cell[type=module]');
            const moduleCell2 = grid.querySelector('cell ~ cell[type=module]');

            // not focused yet
            expect(Store.__private.getFocusedModuleCell('foo')).toBe(undefined);

            // mark the first as the focused one
            Store.__private.grids.foo.focusedModuleCellId = 'cell-4';

            // the first one is focused
            expect(Store.__private.getFocusedModuleCell('foo')).toBe(moduleCell1);

            // mark the second as the focused one
            Store.__private.grids.foo.focusedModuleCellId = 'cell-6';

            // the second one is focused
            expect(Store.__private.getFocusedModuleCell('foo')).toBe(moduleCell2);
        });

        it('should set the one-screen mode', () => {

            // create a grid
            createSimpleGrid();

            Store.__private.enterOneScreenMode('foo');
            expect(Store.__private.grids.foo.oneScreenMode).toBe(true);

            Store.__private.exitOneScreenMode('foo');
            expect(Store.__private.grids.foo.oneScreenMode).toBe(false);

        });

    });

});
