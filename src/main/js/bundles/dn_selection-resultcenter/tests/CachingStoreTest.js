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
/* eslint-disable max-len */
import { assert } from "chai";

import { sourceId } from "source-info!";
import CachingStore from "../CachingStore";
import { AsyncInMemoryStore } from "store-api/InMemoryStore";
import QueryResults from "store-api/QueryResults";
import Point from "@arcgis/core/geometry/Point";
import Extent from "@arcgis/core/geometry/Extent";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";

const WEBMERCATOR = new SpatialReference({ wkid: 3857 });

describe(sourceId, function() {
    it("expect error during construction if no 'masterStore' is given", function() {
        assert.throws(() => {
            new CachingStore({
                masterStore: undefined,
                idList: []
            });
        }, /CachingStore: No master store defined!/);
    });

    it("expect error during construction if no 'idList' is given", function() {
        assert.throws(() => {
            new CachingStore({
                masterStore: {},
                idList: undefined
            });
        }, /CachingStore: No IDs defined!/);
    });

    it("expect caching store will reduce query results to given id list", function() {
        const cache = create({
            idList: ["b"]
        });
        return cache.query().then((results) => {
            assert.strictEqual(results.length, 1);
            assert.strictEqual(results.total, 1);
            assert.strictEqual(results[0].id, "b");
        });
    });

    it("expect caching store will reduce get to given id list and will not forward to master store", function() {
        const cache = create({
            idList: ["b"]
        });
        return cache.get("a").then(() => {
            assert.fail("should throw an error");
        }, (e) => {
            assert.strictEqual(e.message, "item not found");
            // store not requested
            assert.isTrue(!cache.masterStore.$lastGet);
        });
    });

    it("expect caching store will forward get to master store if not already cached", function() {
        const cache = create({
            idList: ["b"]
        });
        return cache.get("b").then((item) => {
            assert.strictEqual(item.id, "b");
            // store requested
            assert.isTrue(!!cache.masterStore.$lastGet);
        });
    });

    it("expect a query fills the cache and afterwards queries are executed in memory", async function() {
        const cache = create({});
        // a query populates the attribute cache
        await cache.query({ id: "a" });

        // reset query state on master store
        cache.masterStore.$lastQuery = undefined;
        const results = await cache.query({ id: { $in: ["a", "c"] } });
        assert.strictEqual(results.length, 2);
        assert.strictEqual(results.total, 2);
        assert.deepEqual(results.map(i => i.id), ["a", "c"]);
        assert.isTrue(!cache.masterStore.$lastQuery);
    });

    it("expect that geometries are not fetched from masterStore if not requested as field", async function() {
        const cache = create({});
        const results = await cache.query({ id: "a" });
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].geometry, undefined);
    });

    it("expect that geometries are fetched from masterStore if requested as field", async function() {
        const cache = create({});
        const results = await cache.query({ id: "a" }, { fields: { geometry: true } });
        assert.strictEqual(results.length, 1);
        assert.isTrue(!!results[0].geometry);
    });

    it(
        "expect that geometries are added to the cache for missing result items if not yet fetched from masterStore, no other attributes are fetched",
        async function() {
            const cache = create({});
            // a query populates the attribute cache
            await cache.query({ id: "a" });

            const results = await cache.query({ id: "c" }, { fields: { geometry: true } });
            assert.strictEqual(results.length, 1);
            assert.isTrue(!!results[0].geometry);
            assert.deepEqual(cache.masterStore.$lastQuery.query, { id: { '$in': ['c'] } });
            assert.deepEqual(cache.masterStore.$lastQuery.options.fields, { geometry: true, id: true });
        }
    );

    it("expect that if not all geometries are fetched then spatial query is forwarded to master store", async function() {
        const cache = create({});
        // a query populates the attribute cache
        await cache.query({ id: "a" });

        const spatialQuery = {
            geometry: {
                "$intersects": new Extent({
                    xmin: 35,
                    xmax: 55,
                    ymin: 35,
                    ymax: 55,
                    spatialReference: WEBMERCATOR
                })
            }
        };

        const results = await cache.query(spatialQuery);
        assert.strictEqual(results.length, 2);
        assert.isTrue(!results[0].geometry);
        assert.deepEqual(results.map(i => i.id), ["a", "b"]);
        assert.deepEqual(cache.masterStore.$lastQuery.query, { $and: [{ id: { '$in': ["a", "b", "c"] } }, spatialQuery] });
        assert.deepEqual(cache.masterStore.$lastQuery.options.fields, { id: true });
    });

    it("expect that missing geometries are requested if spatial query is used and geometries are required", async function() {
        const cache = create({});
        // a query populates the attribute cache
        await cache.query({ id: "a" });

        const spatialQuery = {
            geometry: {
                "$intersects": new Extent({
                    xmin: 35,
                    xmax: 55,
                    ymin: 35,
                    ymax: 55,
                    spatialReference: WEBMERCATOR
                })
            }
        };

        const results = await cache.query(spatialQuery, { fields: { geometry: true } });
        assert.strictEqual(results.length, 2);
        assert.isTrue(!!results[0].geometry);
        assert.deepEqual(results.map(i => i.id), ["a", "b"]);
        assert.deepEqual(cache.masterStore.$lastQuery.query, { id: { '$in': ["a", "b"] } });
        assert.deepEqual(cache.masterStore.$lastQuery.options.fields, { geometry: true, id: true });
    });
});

function create(opts) {
    if (!opts.masterStore) {
        opts.masterStore = createAsyncMemoryStore();
    }
    if (!opts.idList) {
        opts.idList = ["a", "b", "c"];
    }
    return new CachingStore(opts);
}

function createAsyncMemoryStore() {
    return new AsyncInMemoryStoreSpy({
        idProperty: "id",
        data: [{
            id: "a",
            title: "A",
            geometry: new Point({
                x: 40,
                y: 40,
                spatialReference: WEBMERCATOR
            })
        }, {
            id: "b",
            title: "B",
            geometry: new Point({
                x: 50,
                y: 50,
                spatialReference: WEBMERCATOR
            })
        }, {
            id: "c",
            title: "C",
            geometry: new Point({
                x: 60,
                y: 60,
                spatialReference: WEBMERCATOR
            })
        }],
        metadata: {
            fields: [
                { name: "id", type: "string", identifier: true },
                { name: "title", type: "string" },
                { name: "geometry", type: "geometry" }]
        }
    });
}

class AsyncInMemoryStoreSpy extends AsyncInMemoryStore {
    constructor(opts) {
        super(opts);
    }
    async query(query = {}, options = {}) {
        this.$lastQuery = { query, options };
        let results = await super.query(query, options);
        const includeGeometries = options?.fields?.geometry;
        if (!includeGeometries) {
            results = results.map(item => {
                item = Object.assign({}, item);
                delete item.geometry;
                return item;
            });
        }
        return QueryResults.wrapPromise(results);
    }
    async get(id, options = {}) {
        this.$lastGet = { id, options };
        return await super.get(id, options);
    }
}
