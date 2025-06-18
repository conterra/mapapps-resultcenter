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
import FeatureMapVisualizer from "../FeatureMapVisualizer";
import { waitFor } from "test-utils/waitFor";
import QueryResults from "store-api/QueryResults";
import Promise from "apprt-core/Promise";
import SpatialReference from "esri/geometry/SpatialReference";

describe(sourceId, function () {
    it("expect that all items of data model are fetched on data source update", async function () {
        const v = createVisualizer();
        v.handleOnDataUpdate();

        await waitFor(() => {
            assert.equal(v.$spy_highlights.length, 1);
            assert.equal(v.$spy_highlights[0].$opts.attributes.id, "test-1");
        });
    });

    it("expect that popup template is resolved for store", async function () {
        const v = createVisualizer();
        v.handleOnDataUpdate();
        await waitFor(() => {
            assert.equal(v.$spy_highlights.length, 1);
            assert.equal(v.$spy_highlights[0].$opts.popupTemplate.title, "Test");
        });
    });

    it("expect that visualizer resolves domain values for store (MAPAPPS-5712)", async function () {
        const v = createVisualizer();
        v.handleOnDataUpdate();
        await waitFor(() => {
            assert.equal(v.$spy_highlights.length, 1);
        });

        const opts = v.$spy_highlights[0].$opts;
        assert.strictEqual(opts.attributes.domainValue, "C");
    });

    it("expect that visualizer can handle QueryResults which are plain promises", async function () {
        const v = createVisualizer();

        // no total
        v._dataModel.query = async () => [
            {
                id: "test-1",
                name: "test",
                geometry: {
                    type: "point"
                }
            }
        ];
        v.handleOnDataUpdate();

        await waitFor(() => {
            assert.strictEqual(v.$spy_highlights.length, 1);
            assert.strictEqual(v.$spy_highlights[0].$opts.attributes.id, "test-1");
        });
    });

    it("expect that visualizer can handle features without geometries", async function () {
        const v = createVisualizer();

        // no total
        v._dataModel.query = async () => [
            {
                id: "test-1",
                name: "test",
                geometry: {
                    type: "point"
                }
            },
            {
                id: "test-2",
                name: "should not be rendered"
            }
        ];
        v.handleOnDataUpdate();

        await waitFor(() => {
            assert.strictEqual(v.$spy_highlights.length, 1);
            assert.strictEqual(v.$spy_highlights[0].$opts.attributes.id, "test-1");
        });
    });

    it("expect that visualizer supports paginated results", async function () {
        const v = createVisualizer();
        v._dataModel.query = (complexQuery, queryOptions) => {
            if (queryOptions.start == 0) {
                const page1 = [
                    {
                        id: "test-1",
                        name: "test",
                        geometry: {
                            type: "point"
                        }
                    }
                ];
                page1.total = 2;
                return QueryResults.wrapPromise(Promise.resolve(page1));
            }
            if (queryOptions.start == 1) {
                const page2 = [
                    {
                        id: "test-2",
                        name: "test 2",
                        geometry: {
                            type: "point"
                        }
                    }
                ];
                page2.total = 2;
                return QueryResults.wrapPromise(Promise.resolve(page2));
            }
            throw new Error("unexpected request of visualizer");
        };
        v.handleOnDataUpdate();
        await waitFor(() => {
            assert.equal(v.$spy_highlights.length, 2);
            assert.equal(v.$spy_highlights[0].$opts.attributes.id, "test-1");
            assert.equal(v.$spy_highlights[1].$opts.attributes.id, "test-2");
        });
    });

    it("expect that visualizer triggers re-rendering if spatialReference switches on view", async function () {
        const v = createVisualizer();
        v.handleOnDataUpdate();
        await waitFor(() => {
            assert.equal(v.$spy_lastQuery.options.geometry.sr.wkid, 4326);
        });
        v.$spy_lastQuery = undefined;
        // change srs
        v._mapWidgetModel.spatialReference = new SpatialReference({ wkid: 25833 });
        // dummy view required
        v._mapWidgetModel.view = {};
        // invoke view change
        v.viewChanged();

        await waitFor(() => {
            // now store should be queried for new features in correct target SRS
            assert.equal(v.$spy_lastQuery.options.geometry.sr.wkid, 25833);
        });
    });

    // eslint-disable-next-line max-len
    it("expect that visualizer is not trigger a re-rendering if view is not available on map widget model", async function () {
        const v = createVisualizer();
        v.handleOnDataUpdate();
        await waitFor(() => {
            assert.equal(v.$spy_lastQuery.options.geometry.sr.wkid, 4326);
        });
        v.$spy_lastQuery = undefined;
        // simulate srs change
        v._mapWidgetModel.spatialReference = new SpatialReference({ wkid: 25833 });
        // do not provide a view
        v._mapWidgetModel.view = undefined;
        // invoke view change
        v.viewChanged();

        try {
            await waitFor(
                () => {
                    // nothing fetched/rendered
                    assert.isDefined(v.$spy_lastQuery);
                },
                { timeout: 30 }
            );
            assert.fail("should not have been called");
        } catch (_e) {
            // ignore
        }
    });

    it("expect that visualizer uses coordinate transformer to transform the geometries", async function () {
        const v = createVisualizer();

        v._coordinateTransformer = {
            transform(geometries, targetSRS) {
                v.$targetSRS = targetSRS;
                return geometries;
            }
        };
        v.handleOnDataUpdate();
        await waitFor(() => {
            // transform was called
            assert.equal(v.$targetSRS.wkid, 4326);
        });
    });
});

function createVisualizer() {
    const v = new FeatureMapVisualizer();
    // inject mocks
    v._properties = { useDataViewPaging: false };
    // injected
    v._mapWidgetModel = {
        spatialReference: new SpatialReference({
            wkid: 4326
        })
    };
    v._highlighterFactory = {
        forMapWidgetModel() {
            v.$spy_highlights = [];
            return {
                clear() {
                    v.$spy_highlights = [];
                },
                highlight(opts) {
                    const h = {
                        $opts: opts,
                        remove() {
                            const i = v.$spy_highlights.indexOf(h);
                            if (i > -1) {
                                v.$spy_highlights.splice(i, 1);
                            }
                        }
                    };
                    v.$spy_highlights.push(h);
                    return h;
                },
                destroy() {
                    v.$spy_highlights = [];
                }
            };
        }
    };
    v._dataModel = {
        id: "test",
        idProperty: "id",
        query(complexQuery, queryOptions) {
            v.$spy_lastQuery = {
                query: complexQuery,
                options: queryOptions
            };
            return QueryResults.wrapPromise(
                Promise.resolve([
                    {
                        id: "test-1",
                        name: "test",
                        domainValue: 2, // B
                        geometry: {
                            type: "point"
                        }
                    }
                ])
            );
        },
        getFocused() {
            return [];
        },
        on() {
            return {
                remove() {}
            };
        },
        async getMetadata() {
            return {
                supportsGeometry: true,
                fields: [
                    {
                        name: "domainValue",
                        type: "esriFieldTypeSmallInteger",
                        alias: "domainValue",
                        domain: {
                            type: "codedValue",
                            name: "domainValue",
                            codedValues: [
                                {
                                    name: "C",
                                    code: 2
                                },
                                {
                                    name: "B",
                                    code: 1
                                },
                                {
                                    name: "A",
                                    code: 0
                                }
                            ],
                            mergePolicy: "esriMPTDefaultValue",
                            splitPolicy: "esriSPTDefaultValue"
                        },
                        editable: true,
                        nullable: true
                    }
                ]
            };
        },
        getItemContext() {
            return {
                storeId: this.id
            };
        }
    };
    v._popupTemplateResolver = {
        resolvePopupTemplate() {
            return { popupTemplate: { title: "Test" } };
        }
    };
    v._dataViewController = {
        on() {
            return {
                remove() {}
            };
        }
    };
    v._graphicResolver = {
        resolveSymbol() {
            return {};
        }
    };
    return v;
}
