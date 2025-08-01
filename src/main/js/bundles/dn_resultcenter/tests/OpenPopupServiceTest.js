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
import { assert } from "chai";

import { sourceId } from "source-info!";
import Point from "@arcgis/core/geometry/Point";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import OpenPopupService from "../OpenPopupService";

const WEBMERCATOR_WKID = 102100;

/* eslint-disable max-len */
/* eslint-disable no-useless-escape */
describe(sourceId, function() {
    it("expect that nothing happens if no store is provided", async function() {
        const service = createService();
        await service.openPopup("someItemId", {
            store: undefined
        });
        const openPopupArgs = service.$popup_open;
        assert.isUndefined(openPopupArgs);
    });

    it("expect that nothing happens when no popup template found", async function() {
        const service = createService();
        const store = createStoreMock();
        await service.openPopup("someItemId", {
            store
        });
        const openPopupArgs = service.$popup_open;
        assert.isUndefined(openPopupArgs);
    });

    it(
        "expect that error is thrown when feature can not be retrieved for a given item id, and message can be customized",
        function() {
            const popupTemplate = { title: "test" };
            const service = createService({ popupCannotBeDisplayedMsg: "${itemId} ${storeId} ${error}" }, popupTemplate);
            return service.openPopup("throw", {
                store: createStoreMock()
            }).then(() => {
                throw new Error("error expected!");
            }, (e) => {
                assert.equal(e.message, "throw storeMock Error: not found!");
            });
        }
    );

    it("expect that view.popup.open is called when popupTemplate is found and item could be fetched", async function() {
        const popupTemplate = { title: "test" };
        const service = createService(undefined, popupTemplate);
        await service.openPopup("line4", {
            store: createStoreMock()
        });
        const openPopupArgs = service.$popup_open;
        assert(openPopupArgs);
        const feature = openPopupArgs.features[0];
        assert.deepEqual(feature.attributes, { objectid: "line4" });
    });

    it("expect that popup SRS equals map SRS (initially the same)", function() {
        const popupTemplate = { title: "test" };
        const service = createService({}, popupTemplate, WEBMERCATOR_WKID);
        service._coordinateTransformer = createCoordinateTransformerMock();
        return service.openPopup("point4", {
            store: createGeometryStore()
        }).then(() => {
            const openPopupArgs = service.$popup_open;
            assert(openPopupArgs);
            const feature = openPopupArgs.features[0];
            const geometry = feature.geometry;
            assert.equal(geometry.spatialReference.wkid, WEBMERCATOR_WKID);
        });
    });

    it("expect that popup SRS equals map SRS (initially different)", function() {
        const popupTemplate = { title: "test" };
        const service = createService({}, popupTemplate, 25833);
        service._coordinateTransformer = createCoordinateTransformerMock();
        return service.openPopup("point4", {
            store: createGeometryStore()
        }).then(() => {
            const openPopupArgs = service.$popup_open;
            assert(openPopupArgs);
            const feature = openPopupArgs.features[0];
            const geometry = feature.geometry;
            assert.equal(geometry.spatialReference.wkid, 25833);
        });
    });
});

function createService(opts, popupTemplate, srs) {
    const service = new OpenPopupService(opts);
    service._mapWidgetModel = {
        spatialReference: new SpatialReference({ wkid: srs }),
        map: createMapMock(),
        view: {
            popup: {
                open(args) {
                    service.$popup_open = args;
                },
                close() {
                    service.$close = true;
                }
            }
        }
    };
    service._coordinateTransformer = {
        transform(geometry) {
            return geometry;
        }
    };
    service._popupTemplateResolver = {
        resolvePopupTemplate() {
            return {
                popupTemplate
            };
        }
    };
    return service;
}

function createMapMock() {
    return {};
}

function createStoreMock() {
    return {
        id: "storeMock",
        async get(id) {
            if (id === "throw") {
                throw new Error("not found!");
            }
            return { objectid: id, geometry: new Point() };
        }
    };
}

function createGeometryStore() {
    return {
        id: "pointStore",
        layerId: "pointLayer",
        idProperty: "objectid",
        get(id) {
            if (id === "point4") {
                // eslint-disable-next-line max-len
                return { objectid: "point4", geometry: new Point({ x: 847804, y: 6792243, spatialReference: WEBMERCATOR_WKID }) };
            }
            return undefined;
        }
    };
}

function createCoordinateTransformerMock() {
    const transformer = {
        transform(geometry, srs) {
            if (geometry.spatialReference.wkid !== srs) {
                geometry.spatialReference = new SpatialReference({ wkid: srs });
            }
            return Promise.resolve(geometry);
        }
    };
    return transformer;
}
