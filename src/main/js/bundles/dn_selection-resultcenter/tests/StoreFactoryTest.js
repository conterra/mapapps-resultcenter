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
import StoreFactory from "../StoreFactory";
import { MemoryStore } from "../MemoryStore";
import CachingStore from "../CachingStore";

describe(sourceId, function () {

    it("MAPAPPS-6093 : expect store without get will be wrapped in InMemoryStore and id property transported", function () {
        const orgStore = {
            idProperty: "id",
            id: "test"
        };
        const newStore = new StoreFactory().createStore({
            result: [{ id: 1 }],
            source: {
                store: orgStore
            }
        });
        assert.strictEqual(newStore.id, "test");
        assert.strictEqual(newStore.masterStore, orgStore);
        assert.isTrue(newStore instanceof MemoryStore);
    });

    it("expect store with get will be wrapped in CachingStore and id property transported", function () {
        const orgStore = {
            idProperty: "id",
            id: "test",
            get() { }
        };
        const newStore = new StoreFactory().createStore({
            result: [{ id: 1 }],
            source: {
                store: orgStore
            }
        });
        assert.strictEqual(newStore.id, "test");
        assert.strictEqual(newStore.masterStore, orgStore);
        assert.isTrue(newStore instanceof CachingStore);
    });

    it("expect store will only be decorated if flag 'decorateWithFilter' is enabled", function () {
        const orgStore = {
            idProperty: "id",
            id: "test",
            get() { }
        };
        const fac = new StoreFactory();
        fac._properties = { decorateWithFilter: true };
        const newStore = fac.createStore({
            result: [{ id: 1 }],
            source: {
                store: orgStore
            }
        });
        assert.strictEqual(newStore.id, "test");
        assert.strictEqual(newStore.masterStore, orgStore);
        // store decorated
        assert.strictEqual(typeof (newStore.setFilter), "function");
    });
});
