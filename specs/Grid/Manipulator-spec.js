var Manipulator = require('./../../app/Grid/Manipulator.js');
var _ = require('lodash');

describe("Manipulator", function() {

  it("should convert Json to Xml and vice-versa", function() {
    var j = {
        _param1: 1,
        _param2: 2,
        child: {
            _childParam: 3,
            subChild: {
                _subChildParam: 4
            }
        },
        childs: [
            {
                _childs1Param: 5
            },
            {
                _childs2Param: 6
            },
            {
                _childs3Param: 7,
                subChild: {
                    _subChildParam: 8
                }
            }
        ]
    };

    var s = Manipulator.JSONGridToXMLString(j);
    expect(s).toEqual(
        '<grid param1="1" param2="2">' +
            '<child childParam="3">' +
                '<subChild subChildParam="4"/>' +
            '</child>' +
            '<childs childs1Param="5"/>' +
            '<childs childs2Param="6"/>' +
            '<childs childs3Param="7">' +
                '<subChild subChildParam="8"/>' +
            '</childs>' +
        '</grid>'
    );

    var x = Manipulator.JSONGridToXML(j);
    expect(x.childNodes.length).toEqual(1);

    var root = x.documentElement;

    expect(root.attributes.length).toEqual(2);
    expect(root.attributes[0].name).toEqual('param1');
    expect(root.attributes[0].value).toEqual('1');
    expect(root.attributes[1].name).toEqual('param2');
    expect(root.attributes[1].value).toEqual('2');

    expect(root.childNodes.length).toEqual(4);

    var child = root.childNodes[0];
    expect(child.tagName).toEqual('child');
    expect(child.attributes.length).toEqual(1);
    expect(child.attributes[0].name).toEqual('childParam');
    expect(child.attributes[0].value).toEqual('3');
    expect(child.childNodes.length).toEqual(1);

    var subChild = child.childNodes[0];
    expect(subChild.tagName).toEqual('subChild');
    expect(subChild.attributes.length).toEqual(1);
    expect(subChild.attributes[0].name).toEqual('subChildParam');
    expect(subChild.attributes[0].value).toEqual('4');
    expect(subChild.childNodes.length).toEqual(0);

    child = root.childNodes[1];
    expect(child.tagName).toEqual('childs');
    expect(child.attributes.length).toEqual(1);
    expect(child.attributes[0].name).toEqual('childs1Param');
    expect(child.attributes[0].value).toEqual('5');
    expect(child.childNodes.length).toEqual(0);

    child = root.childNodes[2];
    expect(child.tagName).toEqual('childs');
    expect(child.attributes.length).toEqual(1);
    expect(child.attributes[0].name).toEqual('childs2Param');
    expect(child.attributes[0].value).toEqual('6');
    expect(child.childNodes.length).toEqual(0);

    child = root.childNodes[3];
    expect(child.tagName).toEqual('childs');
    expect(child.attributes.length).toEqual(1);
    expect(child.attributes[0].name).toEqual('childs3Param');
    expect(child.attributes[0].value).toEqual('7');
    expect(child.childNodes.length).toEqual(1);

    subChild = child.childNodes[0];
    expect(subChild.tagName).toEqual('subChild');
    expect(subChild.attributes.length).toEqual(1);
    expect(subChild.attributes[0].name).toEqual('subChildParam');
    expect(subChild.attributes[0].value).toEqual('8');
    expect(subChild.childNodes.length).toEqual(0);

    var j2 = Manipulator.XMLGridToJSON(x);
    expect(_.isEqual(j2, j)).toEqual(true);

  });

  it("should create a new grid", function() {
    var grid = Manipulator.createBaseGrid('foo', 5);
    var expected = {
        name: 'foo',
        space: '5px',
        rows: []
    };
    expect(_.isEqual(grid, expected)).toEqual(true);
  });

  it("should add a row", function() {
    var grid = Manipulator.createBaseGrid('foo', 5);

    // with an empty rows list
    Manipulator.addRow(grid);
    var expected = {
        name: 'foo',
        space: '5px',
        rows: [{}]
    };
    expect(_.isEqual(grid, expected)).toEqual(true);

    // with a rows list with one row
    Manipulator.addRow(grid);
    var expected = {
        name: 'foo',
        space: '5px',
        rows: [{}, {}]
    };
    expect(_.isEqual(grid, expected)).toEqual(true);

    // without the "rows" key, and check that row is returned by reference
    delete grid.rows;
    var row = Manipulator.addRow(grid);
    row.foo = 'bar'

    var expected = {
        name: 'foo',
        space: '5px',
        rows: [{foo: 'bar'}]
    };
    expect(_.isEqual(grid, expected)).toEqual(true);
  });

  it("should add a cell", function() {
    var grid = Manipulator.createBaseGrid('foo', 5);
    var row = Manipulator.addRow(grid);

    // without the "cells" key
    Manipulator.addCell(row, 'grid');
    var expected = {
        cells: [
            {type: 'grid', content: {}}
        ]
    };
    expect(_.isEqual(row, expected)).toEqual(true);

    // with a cells list with one cell
    Manipulator.addCell(row, 'module');
    var expected = {
        cells: [
            {type: 'grid', content: {}},
            {type: 'module', content: {}}
        ]
    };
    expect(_.isEqual(row, expected)).toEqual(true);

    // without the "rows" key, and check that row is returned by reference
    delete row.cells;
    var cell = Manipulator.addCell(row, 'grid');
    cell.content.foo = 'bar';

    var expected = {
        cells: [
            {type: 'grid', content: {foo: 'bar'}}
        ]
    };
    expect(_.isEqual(row, expected)).toEqual(true);
  });

  it("should create a full grid", function() {
    var grid = Manipulator.createBaseGrid('foo', 5);
    var row1 = Manipulator.addRow(grid);
        var cell1 = Manipulator.addCell(row1, 'grid');
            var row2 = Manipulator.addRow(cell1.content);
                Manipulator.addCell(row2, 'module').content.path = 'path.to.module1';
                Manipulator.addCell(row2, 'module').content.path = 'path.to.module2';
            var row3 = Manipulator.addRow(cell1.content);
                Manipulator.addCell(row3, 'module').content.path = 'path.to.module3';
                var cell2 = Manipulator.addCell(row3, 'grid');
                    var row4 = Manipulator.addRow(cell2.content);
                        Manipulator.addCell(row4, 'module').content.path = 'path.to.module4';
        var cell3 = Manipulator.addCell(row1, 'grid');

    var expected = {
        name:"foo",
        space:"5px",
        rows:[
            {
                cells:[
                    {
                        type:"grid",
                        content:{
                            rows:[
                                {
                                    cells: [
                                        {
                                            type:"module",
                                            content: {path: "path.to.module1"}
                                        },
                                        {
                                            type:"module",
                                            content: {path: "path.to.module2"}
                                        }
                                    ]
                                },
                                {
                                    cells:[
                                        {
                                            type:"module",
                                            content: {path: "path.to.module3"}
                                        },
                                        {
                                            type:"grid",
                                            content:{
                                                rows:[
                                                    {
                                                        cells:[
                                                            {
                                                                type:"module",
                                                                content: {path: "path.to.module4"}
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        type:"grid",
                        content:{}
                    }
                ]
            }
        ]
    };

    expect(_.isEqual(grid, expected)).toEqual(true);
  });

});