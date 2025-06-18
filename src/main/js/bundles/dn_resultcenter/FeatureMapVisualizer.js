/*
 * Copyright (C) 2025 con terra GmbH (info@conterra.de)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import AsyncTask from "apprt-core/AsyncTask";
import Observers from "apprt-core/Observers";
import RestrictQueriesToView from "./RestrictQueriesToView";
import VisualizationLayerResolver from "./VisualizationLayerResolver";
import delegate from "apprt-core/delegate";
import { createDomainUtil } from "ct/store/Domains";

// Private symbol to attach the original item properties to a highlight instance.
const _itemState = Symbol("_state");

export default class FeatureMapVisualizer {
    #renderCounter = 0;
    #defaultHighlighter;
    #selectionHighlighter;
    #focusHighlighter;

    #highlights;
    #observers;
    #itemIdsToUpdate;
    #ignoreConcurrentUpdates;
    #highlightLayerResolver;
    #selectionLayerResolver;
    #lastRenderState;

    constructor() {
        this.#highlightLayerResolver = new VisualizationLayerResolver("ct-resultcenter", "Result center");
        this.#selectionLayerResolver = new VisualizationLayerResolver(
            "ct-resultcenter-selected",
            "Result center selected"
        );
        this.#highlights = new Map(); // item id in store -> highlight instance
        this.#observers = Observers();
        this.#itemIdsToUpdate = new Map();
        this.#ignoreConcurrentUpdates = true;

        // injected
        this._mapWidgetModel = undefined;
        this._highlighterFactory = undefined;
        this._dataModel = undefined;
        this._dataViewController = undefined;
        this._graphicResolver = undefined;
        this._coordinateTransformer = undefined;
        this._popupTemplateResolver = undefined;
    }

    deactivate() {
        this._destroyHighlighter();
        this.#itemIdsToUpdate.clear();
        this.#observers.clean();
        this.#highlights = undefined;
    }

    async viewChanged() {
        if (!this._mapWidgetModel.view) {
            return;
        }
        const sr = this._mapWidgetModel.spatialReference;
        if (!this.#lastRenderState || !this.#lastRenderState.spatialReference.equals(sr)) {
            this.handleOnDataUpdate();
        }
    }

    async handleOnDataUpdate() {
        const dataModel = this._dataModel;
        this.#observers.clean();
        this.#itemIdsToUpdate.clear();
        const { supportsGeometry } = await dataModel.getMetadata();
        if (dataModel !== this._dataModel) {
            // react only if data model is not replaced
            return;
        }
        if (!supportsGeometry) {
            this._destroyHighlighter();
            return;
        }
        this._updateFeatures();
    }

    // used by open popup service to fast open popup for given graphic
    findGraphicsById(itemId) {
        const highlight = this.#highlights.get(itemId);
        return highlight?.getGraphics() ?? [];
    }

    _updateFeatures() {
        const dataModel = this._dataModel;
        const useDataViewPaging = this._properties.useDataViewPaging;
        const dataViewController = this._dataViewController;
        let renderDataStore = dataModel;
        if (useDataViewPaging && dataViewController) {
            const dataViewModel = dataViewController.dataViewModel;
            renderDataStore = RestrictQueriesToView(dataViewModel, dataModel);
            this.#observers.add(
                dataViewController.on("page-state-change", () => {
                    renderDataStore.filterDirty = true;
                    this._renderStoreItems(renderDataStore);
                })
            );
        }
        this._renderStoreItems(renderDataStore);
        this.#observers.add(
            dataModel.on("data-changed", (evt) => this._triggerPartialUpdateOnDataChange(renderDataStore, evt))
        );
    }

    async _renderStoreItems(store) {
        try {
            this.#itemIdsToUpdate.clear();
            this.#ignoreConcurrentUpdates = true;

            const domains = await this._resolveDomains(store);
            const sr = this._mapWidgetModel.spatialReference;
            this.#lastRenderState = { spatialReference: sr };
            this._removeHighlights();
            let count = 0;
            let total = -1;
            while (count < total || total == -1) {
                const renderId = ++this.#renderCounter;
                const queryResult = store.query({}, toQueryOpts(sr, count));
                if (total == -1) {
                    total = await queryResult.total;
                }
                const results = await queryResult;
                if (renderId !== this.#renderCounter) {
                    // Skip if new update is requested.
                    // Note: ignoreConcurrentUpdates left at true, the other render job will reset it to false.
                    return;
                }
                count += results.length;
                if (!total) {
                    // this happens if the query result is a plain promise without total information
                    // total with zero is also ok to step into this line
                    total = count;
                }
                await this._addHighlights(results, store, domains, sr);
            }
            this.#ignoreConcurrentUpdates = false;
        } catch (e) {
            this.#ignoreConcurrentUpdates = false;
            throw e;
        }
    }

    _triggerPartialUpdateOnDataChange(store, evt) {
        if (this.#ignoreConcurrentUpdates) {
            return;
        }
        const changedItems = this.#itemIdsToUpdate;
        if (evt.item !== undefined) {
            addStateChange(changedItems, evt.item, evt);
        }
        if (evt.oldItem !== undefined) {
            addStateChange(changedItems, evt.oldItem, evt);
        }
        if (evt.items !== undefined) {
            evt.items.forEach((item) => addStateChange(changedItems, item, evt));
        }
        if (evt.oldItems !== undefined) {
            evt.oldItems.forEach((item) => addStateChange(changedItems, item, evt));
        }
        if (changedItems.length === 0) {
            return;
        }
        const sr = this._mapWidgetModel.spatialReference;
        const renderId = ++this.#renderCounter;

        this._updateTask = this._updateTask || AsyncTask(this._applyDataUpdates.bind(this));
        const wait = 100;
        this._updateTask.delay(wait, store, sr, renderId);
    }

    async _applyDataUpdates(store, sr, renderId) {
        if (renderId !== this.#renderCounter) {
            return;
        }
        const changes = Array.from(this.#itemIdsToUpdate.values());
        if (renderId !== this.#renderCounter) {
            return;
        }
        this.#itemIdsToUpdate.clear();
        const idsToFetch = [];
        for (const item of changes) {
            const id = item.id;
            if (item.deleted) {
                this._removeHighlight(id);
                continue;
            }
            const existingHighlight = this.#highlights.get(id);
            if (!existingHighlight) {
                idsToFetch.push(id);
                continue;
            }
            const state = this._dataModel.getInternalState(id) || { selected: false, focus: false };
            const cachedState = existingHighlight[_itemState];
            Object.assign(cachedState.attributes, state);
            this._updateHighlight(
                id,
                cachedState.geometry,
                cachedState.attributes,
                cachedState.context,
                cachedState.popupTemplate
            );
        }
        if (!idsToFetch.length) {
            return;
        }
        // items added
        const domains = await this._resolveDomains(store);
        const query = { [store.idProperty]: { $in: idsToFetch } };
        const results = await store.query(query, toQueryOpts(sr));
        await this._addHighlights(results, store, domains, sr);
    }

    async _addHighlights(features, store, domains, spatialReference) {
        const featuresWithGeometry = features?.filter((feature) => feature.geometry) ?? [];
        if (featuresWithGeometry.length === 0) {
            return;
        }

        const transformedFeatures = await this._transformFeatures(featuresWithGeometry, spatialReference);
        const context = this._getContext(store);
        const { popupTemplate } = await this._popupTemplateResolver.resolvePopupTemplate({
            storeId: context.storeId,
            resolveOnLayer: false
        });

        const idProperty = store.idProperty;
        // render chunked in 100 item steps
        const count = transformedFeatures.length;
        let index = 0;
        // render only 100 items at once
        const chunkSize = 100;
        while (index < count) {
            let i = 0;
            await AsyncTask(() => {
                for (; i < chunkSize && index < count; ++index, ++i) {
                    const feature = transformedFeatures[index];
                    const geometry = feature.geometry;
                    const attributes = getAttributesFromFeature(feature, domains);
                    const itemId = attributes[idProperty];
                    this._updateHighlight(itemId, geometry, attributes, context, popupTemplate);
                }
            }).run();
        }
    }

    _updateHighlight(itemId, geometry, attributes, context, popupTemplate) {
        const highlighter = this._lookupHighlighter(
            attributes.focus ? "focus" : attributes.selected ? "selected" : "default"
        );

        const symbol = this._graphicResolver.resolveSymbol(geometry, attributes, context);
        const highlights = this.#highlights;

        // Ensure that existing highlights are always cleaned up. This should not
        // happen in practice (because of unique ids), but you never know ...
        this._removeHighlight(itemId);

        const highlight = highlighter.highlight({
            geometry,
            attributes,
            symbol,
            context,
            popupTemplate
        });
        // cache for later symbol change of focus/selected
        highlight[_itemState] = {
            attributes,
            geometry,
            context,
            popupTemplate
        };
        highlights.set(itemId, highlight);
    }

    _removeHighlight(itemId) {
        const highlights = this.#highlights;
        const highlight = highlights.get(itemId);
        if (highlight) {
            delete highlight[_itemState];
            highlight.remove();
            highlights.delete(itemId);
        }
    }

    _removeHighlights() {
        this.#defaultHighlighter?.clear();
        this.#focusHighlighter?.clear();
        this.#selectionHighlighter?.clear();
        for (const h of this.#highlights.values()) {
            delete h[_itemState];
        }
        this.#highlights.clear();
    }

    _getContext(store) {
        const itemContext = store.getItemContext();
        itemContext.viewmode = this._mapWidgetModel.viewmode;
        return itemContext;
    }

    _lookupHighlighter(name) {
        switch (name) {
            case "focus":
                return (this.#focusHighlighter = this._createHighlighter(this.#focusHighlighter));
            case "selected":
                return (this.#selectionHighlighter = this._createHighlighter(
                    this.#selectionHighlighter,
                    this.#selectionLayerResolver
                ));
            default:
                return (this.#defaultHighlighter = this._createHighlighter(
                    this.#defaultHighlighter,
                    this.#highlightLayerResolver
                ));
        }
    }

    _createHighlighter(existing, resolver) {
        if (existing) {
            return existing;
        }
        return this._highlighterFactory.forMapWidgetModel(
            this._mapWidgetModel,
            resolver
                ? { graphicsCollectionResolver: (model) => resolver.resolve(model)?.graphics }
                : undefined
        );
    }

    async _resolveDomains(store) {
        const metadata = await store.getMetadata();
        if (!metadata) {
            return undefined;
        }
        return createDomainUtil(metadata);
    }

    async _transformFeatures(features, targetSpatialReference) {
        const transformer = this._coordinateTransformer;
        if (!transformer) {
            return features;
        }
        const geometries = features.map((f) => f.geometry);
        const transformedGeometries = await transformer.transform(geometries, targetSpatialReference);
        return features.map((f, i) => delegate(f, {
            geometry: transformedGeometries[i]
        }));
    }

    _destroyHighlighter() {
        this._removeHighlights();

        this.#focusHighlighter?.destroy();
        this.#focusHighlighter = undefined;
        this.#selectionHighlighter?.destroy();
        this.#selectionHighlighter = undefined;
        this.#defaultHighlighter?.destroy();
        this.#defaultHighlighter = undefined;
        this.#highlightLayerResolver.remove();
        this.#selectionLayerResolver.remove();
    }
}

function getAttributesFromFeature(item, domains) {
    let attributes = {};
    for (const prop in item) {
        const val = item[prop];
        if (prop !== "geometry" && typeof val !== "function") {
            attributes[prop] = val;
        }
    }

    if (domains) {
        attributes = domains.toDomainValues(attributes);
    }
    return attributes;
}

function toQueryOpts(outSR, start = 0) {
    return { geometry: { sr: outSR }, fields: { geometry: true }, start };
}

function addStateChange(changes, id, cause) {
    const newState = {
        id
    };
    if (cause.selection) {
        newState.selection = true;
    }
    if (cause.focus) {
        newState.focus = true;
    }
    if (cause.deleted) {
        newState.deleted = true;
    }
    if (changes.has(id)) {
        Object.assign(changes.get(id), newState);
        return;
    }
    changes.set(id, newState);
}
