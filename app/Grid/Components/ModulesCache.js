import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import stringify from 'json-stable-stringify';

import { Modules } from '../Modules';
import { ModuleHolder } from './ModuleHolder';

/**
 * This JS module will manage the cache of the module and the module holders,
 * which are react components attached to their own "root", to be attached
 * to other react components via {@link module:Grid.Components.Mixins.NodesHolder NodesHolderMixin}
 *
 * The two react components created by this module are:
 *
 * - modules, to be strictly independant from the grid, so they won't be rendered
 *   on grid changes. They are attached to cells in normal mode, and to modules
 *   holders (see below) in design mode.
 *
 * - {@link module:Grid.Components.ModuleHolder module holder}, that will hold
 *   the modules in design mode, and handle the drag operations
 *
 * @namespace
 *
 * @memberOf module:Grid.Components
 *
 */
export const ModulesCache = {

    /**
     * The class name for the nodes holding the modules react components.
     * @type {String}
     */
    moduleContainerClassName: 'module-container',

    /**
     * The class name for the nodes holding the module holder react components.
     * @type {String}
     */
    holderContainerClassName: 'module-holder-container',

    /**
     * Will keep a reference to all modules (and holders) created, to simply
     * retrieve it when needed.
     *
     * The key is the stringified version of the module attributes.
     *
     * @private
     * @type {Object}
     */
    _cache: {},


    /**
     * Extract attributes from a xml node and return them in an object form
     *
     * (transforms [{name: xx, value:yy}, {name: ww, value:zz}] in {xx: yy, ww: zz})
     *
     * @param  {XMLNode} xmlNode - The xml node from which we want to extract attributes
     * @return {object}  - The object with all attributes
     */
    _extractAttributes(xmlNode) {
        return _.reduce(
            xmlNode.attributes,
            (r, a) => { r[a.name] = a.value; return r; }, {}
        );
    },

    /**
     * Will return from the `_cache` entry, all the needed elements to be used
     * by `getModuleComponent` and `getHolderComponent`.
     *
     * If the entry doesn't exists in the cache, it will be created and saved.
     *
     * The `cell` and `key` parameters are exclusive:
     *
     * - if `cell` is given, it's expected to be called from a {@link module:Grid.Components.Cell Cell}
     *   grid react component, and everything is possible: create the cache entry,
     *   update it if needed (`gridName` and `gridCell` reference), and retrieve
     *   from the cache by computing the key from the content node attributes
     *   (which are used to compute the module attributes)
     *
     * - if `key` is given, the cache entry MUST exist, as it won't be able to
     *   create it. Typically used when not calling it from a  {@link module:Grid.Components.Cell Cell},
     *   when only a reference to the key is available.
     *
     * How it works (assuming a cell, not a key):
     *
     * - get the content node inside the cell
     * - extract all its attributes that will be used as attributes for the module
     * (the `component` attribule will tell which module to create)
     * - compute a key (string) based on these attributes
     * - if the cache is empty, fill it with:
     *   - a react element for the module (not rendered, only created)
     *   - a react element for the module holder (not rendered, only created)
     *   - the name of the current grid
     *   - the actual {@link module:Grid.Components.Cell Cell} using this cache entry
     *   - (grid's name and cell are used to call the {@link module:Grid.Actions Actions},
     * as `startDragging` for example)
     * - if the cache already existed:
     *   - update the grid name and the actual cell using this cache entry
     *
     *
     *
     * @private
     *
     * @return {object} - The cache entry for the given cell/key
     */
    _getFromCache(cell, key) {
        let attributes;

        if (key) {
            // extract atributes from the key if we have it
            attributes = JSON.parse(key);

        } else {
            // compose the key if not given (expect the cell)

            // it's where the module information are
            const contentNode = cell.state.node.querySelector(':scope > content');

            // get all attributes of the content node, to use as props for the
            // module component
            attributes = this._extractAttributes(contentNode);

            // compute the cache key of the module component by using
            key = stringify(attributes);
        }

        if (typeof this._cache[key] === 'undefined') {
            // initialize the cache for this key

            // //// create the module

            // will be something like "Modules.foo"
            const componentPath = attributes.component;

            // Remove the "Modules." part, as they are all hold in the "Modules" module
            const modulePath = componentPath.split('.').splice(1).join('/');

            // create a react *element* for the wanted module, with the content
            // attributes as props
            const moduleElement = React.createElement(Modules[modulePath], attributes);

            // //// create the holder to hold the module in design mode

            // create  a react *element* for the holder
            const holderElement = React.createElement(ModuleHolder, {
                uniqueKey: key,
                gridName: cell.getGridName(),
                gridCell: cell.state.node
            });


            // //// save in cache
            this._cache[key] = {
                // keep grid related data
                gridName: holderElement.props.gridName,
                gridCell: holderElement.props.gridCell,

                // both react elements, to be converted as components later

                // both needed react components
                moduleElement,
                holderElement
            };

        } else {

            // if the cache exists update grid related data
            if (cell) {
                const cache = this._cache[key];
                cache.gridName = cell.getGridName();
                cache.gridCell = cell.state.node;
            }

        }

        // return the whole cached object
        return this._cache[key];

    },

    /**
     * Get a module component based on a cell or a key.
     *
     * It's really a detached dom node in which is rendered a module react component,
     * based on the react element got from the cache (which is constructed if needed)
     *
     * The returned dom node will have the `moduleContainerClassName` value as class name
     *
     * The `cell` and `key` parameters are exclusive
     *
     * @param  {module:Grid.Components.Cell} cell - A cell for which we want the module
     * @param  {string} key - A key for which we want the module. In this case, the module must already exists, after a call to this method or `getHolderComponent` with a cell parameter
     *
     * @return {DomNode} - A dom node holding the module react component
     */
    getModuleComponent(cell, key) {
        const cache = this._getFromCache(cell, key);

        if (typeof cache.moduleComponent === 'undefined') {

            // will hold the rendered module component
            cache.moduleParent = document.createElement('div');
            cache.moduleParent.className = this.moduleContainerClassName;

            // render the module component once for all
            cache.moduleComponent = ReactDOM.render(cache.moduleElement, cache.moduleParent);

        }

        // return the div holding the react component
        return cache.moduleParent;
    },

    /**
     * Compute new props for the given react props, comparing to the cache
     *
     * @param  {object} cache - The cache entry having the more recent props we want
     * @param  {object} source - An object of the react component props
     *
     * @return {object} - Object having the new props
     *
     * @private
     */
    _getNewHolderProps(cache, props) {
        const newProps = {};
        for (const key in props) {
            if (typeof cache[key] === 'undefined') { continue; }
            if (props[key] == cache[key]) { continue; }
            newProps[key] = cache[key];
        }
        return newProps;
    },

    /**
     * Get a module holder component based on a cell or a key.
     *
     * It's really a detached dom node in which is rendered a
     * {@link module:Grid.Components.ModuleHolder ModuleHolder} react
     * component, based on the react element got from the cache (which is
     * constructed if needed)
     *
     * The returned dom node will have the `holderContainerClassName` value as class name
     *
     * The props of the `ModuleHolder` component will be updated from the entry
     * in the cache (that may have been updated recently). If no props are updated,
     * the`forceUpdate` method is called. Each of these two actions will trigger a
     * rerender of the `ModuleHolder` component, to reattach the `module` component
     * if it was used elsewhere.
     *
     * The `cell` and `key` parameters are exclusive
     *
     * @param  {module:Grid.Components.Cell} cell - A cell for which we want the module
     * @param  {string} key - A key for which we want the module. In this case, the module must already exists, after a call to this method or `getHolderComponent` with a cell parameter
     *
     * @return {DomNode} - A dom node holding the
     * {@link module:Grid.Components.ModuleHolder ModuleHolder} react component
     */
    getHolderComponent(cell, key) {
        const cache = this._getFromCache(cell, key);

        if (typeof cache.holderComponent === 'undefined') {
            // the component does not exist in cache, so we create it

            // update element props if needed
            const newProps = this._getNewHolderProps(cache, cache.holderElement.props);
            _.extend(cache.holderElement.props, newProps);

            // will hold the rendered module component
            cache.holderParent = document.createElement('div');
            cache.holderParent.className = this.holderContainerClassName;

            // render the module component once for all
            cache.holderComponent = ReactDOM.render(cache.holderElement, cache.holderParent);

        } else {
            // if the component exists in cache, update its props
            const component = cache.holderComponent;
            const newProps = this._getNewHolderProps(cache, component.props);
            if (_.size(newProps)) {
                // we have new props, so we apply them, the component will be re-rendered
                const element = React.createElement(ModuleHolder, Object.assign({}, component.props, newProps));
                cache.holderComponent = ReactDOM.render(element, cache.holderParent);
            } else {
                // no new props, but ask for a rerender if the the module is not inside the component
                // TODO: for now we always rerender the holder, it needs to change on some cases
                // if (!component.getDOMNode().querySelector(':scope > .' + this.moduleContainerClassName)) {
                component.forceUpdate();
                // }
            }
        }

        return cache.holderParent;
    }

};
