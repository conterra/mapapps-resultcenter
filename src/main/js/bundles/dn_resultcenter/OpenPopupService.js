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
import replace from "apprt-core/string-replace";
import Graphic from "@arcgis/core/Graphic";
import DomainAware from "ct/store/DomainAware";

export default function OpenPopupService(opts) {
    opts = opts || {};
    const domainAware = !!opts.domainAware;
    const popupCannotBeDisplayedMessage = opts.popupCannotBeDisplayedMsg
        || "Error while opening popup for item '${itemId}' in store '${storeId}'!";

    function toDomainAwareStore(store) {
        //TODO: is this still required?
        if (domainAware) {
            return new DomainAware(store);
        } else {
            return store;
        }
    }

    return {
        async openPopup(itemId, options) {
            const mapWidgetModel = this._mapWidgetModel;
            closeCurrentPopup(mapWidgetModel);

            if (!mapWidgetModel || !mapWidgetModel.map) {
                return;
            }

            const visualizer = this._visualizer;
            const vGraphic = visualizer?.findGraphicsById(itemId)[0];

            if (vGraphic?.popupTemplate) {
                // if popup template is available via visualizer we reuse it
                // NOTE: the visualizer uses the _popupTemplateResolver, too,
                // but does not register a popup if the store is associated with a layer
                // to prevent duplicated popups.
                // This shortcut helps only if the store has an own popupTemplate
                // MAPAPPS-5667: do not clone "vGraphic" otherwise non "Accessor Data", like customActions are lost
                openPopupForGraphic(mapWidgetModel, vGraphic);
                return;
            }

            let store = options.store;
            if (!store) {
                return;
            }

            const { popupTemplate, layer } =
                await this._popupTemplateResolver.resolvePopupTemplate({ store, mapWidgetModel });
            if (!popupTemplate) {
                return;
            }

            store = toDomainAwareStore(store);
            const mapSRS = mapWidgetModel.spatialReference;
            const coordinateTransformer = this._coordinateTransformer;

            try {
                await Promise.resolve(); // Force async, same behaviour as prior to refactoring.
                const item = await fetchItem(store, itemId, mapSRS);
                await showPopup({
                    mapWidgetModel,
                    popupTemplate,
                    store,
                    layer,
                    coordinateTransformer,
                    mapSRS
                }, item);
            } catch (error) {
                logError(this._logService, store.id, popupCannotBeDisplayedMessage, itemId, error);
            }
        }
    };
}

async function fetchItem(store, itemId, mapSRS) {
    const item = await store.get(itemId, {
        geometry: { sr: mapSRS },
        fields: { geometry: true }
    });
    if (!item) {
        throw new Error(`Item with id '${itemId}' not found!`);
    }
    return item;
}

async function showPopup({ mapWidgetModel, mapSRS, coordinateTransformer, popupTemplate, layer }, item) {
    if (!item) {
        return;
    }
    if (!mapWidgetModel.view) {
        return;
    }
    const attributes = Object.assign({}, item);
    let geom = attributes.geometry;
    if (!geom) {
        return;
    }
    delete attributes.geometry;

    const geomSRS = geom?.spatialReference;
    if (mapSRS && geomSRS && !mapSRS.equals(geomSRS)) {
        geom = await coordinateTransformer.transform(geom, mapSRS.wkid);
    }

    const graphic = new Graphic({
        popupTemplate: popupTemplate,
        attributes: attributes,
        geometry: geom
    });
    // prevent layer.graphicChanged event if layer is available
    graphic.layer = layer;
    openPopupForGraphic(mapWidgetModel, graphic);
}

function logError(logService, storeId, messageTemplate, itemId, error) {
    const msg = replace(messageTemplate, { error, itemId, storeId });
    logService?.error(msg, error);
    throw new Error(msg);
}

function openPopupForGraphic(model, graphic) {
    if (!graphic) {
        return;
    }
    model?.view?.popup?.open({
        features: [graphic],
        updateLocationEnabled: true
    });
}

function closeCurrentPopup(model) {
    model?.view?.popup?.close();
}
