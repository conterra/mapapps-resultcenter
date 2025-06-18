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
import { AsyncWritableInMemoryStore, SyncWritableInMemoryStore } from "store-api/InMemoryStore";
import DataModel from "../DataModel";

describe(sourceId, function() {
    it("asynchronous store - get", async function() {
        const { dataModel } = setup(true);
        const item = await dataModel.get(1);
        assert.strictEqual("item1", item.name);
    });

    it("asynchronous store - Remove 3 entries", async function() {
        const { dataModel } = setup(true);
        await dataModel.remove([1, 2, 3]);
        const total = await dataModel.query({}).total;
        assert.strictEqual(1, total, "One entry left when three removed.");
    });

    it("asynchronous store - Remove one single entry", async function() {
        const { dataModel } = setup(true);

        await dataModel.remove(2);
        const total = await dataModel.query({}).total;
        assert.strictEqual(3, total, "Three entries left when one removed.");
    });

    it("asynchronous store - Try to remove an entry that is not in the DataModel", async function() {
        const { dataModel } = setup(true);
        await dataModel.remove(6);
        const total = await dataModel.query({}).total;
        assert.strictEqual(4, total, "Still for entries in the DataModel.");
    });

    it("synchronous store - get", function() {
        const { dataModel } = setup(false);
        assert.strictEqual("item1", dataModel.get(1).name);
    });

    it("synchronous store - getIdentity", function() {
        const { dataModel, store } = setup(false);
        const item1 = store.get(1);
        const item2 = store.get(2);
        assert.strictEqual(1, dataModel.getIdentity(item1));
        assert.strictEqual(2, dataModel.getIdentity(item2));
    });

    it("synchronous store - query", function() {
        const { dataModel, store } = setup(false);
        let items = dataModel.query({});
        const expected = store.query({});
        assert.strictEqual(expected.length, items.length);
        assert.strictEqual(expected[0], items[0]);
        assert.strictEqual(expected[1], items[1]);
        dataModel.setDatasourceFilter({ id: 1 });
        items = dataModel.query({});
        assert.strictEqual(1, items.length);
        assert.strictEqual(expected[0], items[0]);
    });

    it("synchronous store - getSelected", function() {
        const { dataModel } = setup(false);
        dataModel.setSelected([
            2,
            3
        ], true);
        let selectedItems = dataModel.getSelected();
        // Order may change
        selectedItems.sort();
        assert.strictEqual(2, selectedItems[0]);
        assert.strictEqual(3, selectedItems[1]);
        dataModel.setSelected([
            1,
            2
        ], true);
        selectedItems = dataModel.getSelected();
        // Order may change
        selectedItems.sort();
        assert.strictEqual(1, selectedItems[0]);
        assert.strictEqual(2, selectedItems[1]);
        assert.strictEqual(2, selectedItems.length);
    });

    it("synchronous store - getSelected with extend selection", function() {
        const { dataModel } = setup(false);
        dataModel.setSelected([1], true);
        const extendSelection = true;
        dataModel.setSelected([
            2,
            3
        ], true, extendSelection);
        const selectedItems = dataModel.getSelected();
        assert.strictEqual(1, selectedItems[0]);
        assert.strictEqual(2, selectedItems[1]);
        assert.strictEqual(3, selectedItems[2]);
        assert.strictEqual(3, selectedItems.length);
    });

    it("synchronous store - unselect", function() {
        const { dataModel } = setup(false);
        dataModel.setSelected([1], true);
        assert.strictEqual(1, dataModel.getSelected().length);
        dataModel.unselect();
        const selectedItems = dataModel.getSelected();
        assert.strictEqual(0, selectedItems.length);
    });

    it("synchronous store - select", function() {
        const { dataModel } = setup(false);
        const extendSelection = true;
        dataModel.select({ id: 3 });
        dataModel.select({ id: 4 }, extendSelection);
        const selectedItems = dataModel.getSelected();
        assert.strictEqual(3, selectedItems[0]);
        assert.strictEqual(4, selectedItems[1]);
        assert.strictEqual(2, selectedItems.length);
    });

    it("synchronous store - remove", async function() {
        const { dataModel } = setup(false);
        dataModel.remove(2);
        assert.strictEqual(3, dataModel.query({}).total);
        dataModel.remove(3);
        assert.strictEqual(2, dataModel.query({}).total);
        dataModel.remove(3);
        assert.strictEqual(2, dataModel.query({}).total);
        dataModel.remove([1, 4]);
        assert.strictEqual(0, dataModel.query({}).total);
    });
});


function setup(async) {
    const data = [
        {
            id: 1,
            name: "item1",
            prime: false
        },
        {
            id: 2,
            name: "item2",
            prime: true
        },
        {
            id: 3,
            name: "item3",
            prime: true
        },
        {
            id: 4,
            name: "item4",
            prime: false
        }
    ];
    let store;
    if (async) {
        store = new AsyncWritableInMemoryStore({ data: data });
    } else {
        store = new SyncWritableInMemoryStore({ data: data });
    }
    const dataModel = new DataModel();
    dataModel.setDatasource(store);
    return {
        dataModel,
        store
    };
}
