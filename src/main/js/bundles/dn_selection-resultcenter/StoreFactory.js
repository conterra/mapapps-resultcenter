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
import { MemoryStore } from "./MemoryStore";
import CachingStore from "./CachingStore";
import Filter from "ct/store/Filter";

function processSelectionResult(result, store, parameters) {
    const maxServerFeaturesLimit = parameters.maxServerFeaturesLimit;
    let resultStore;
    const idProperty = store.idProperty;
    const idList = result ? result.map(item => item[idProperty]) : [];
    if (!idList.length) {
        // if empty create memory store
        return createFullItemResultStore(idList, result, store);
    }
    if (parameters.decorateWithFilter) {
        resultStore = createDecoratedStore(idList, store);
    } else if (store.get) { // Check if store has a get-method, i.e. it can retrieve single features by ID
        resultStore = createResultReferenceStore(idList, store, maxServerFeaturesLimit);
    } else {
        resultStore = createFullItemResultStore(idList, result, store);
    }
    return resultStore;
}

function createResultReferenceStore(idList, masterStore, maxServerFeaturesLimit) {
    return new CachingStore({
        id: masterStore.id,
        masterStore: masterStore,
        idList: idList,
        maxFeaturesLimit: maxServerFeaturesLimit
    });
}

function createFullItemResultStore(idList, result, masterStore) {
    return new MemoryStore({
        id: masterStore.id,
        masterStore: masterStore,
        data: result,
        idProperty: masterStore.idProperty,
        idList: idList
    });
}

function createDecoratedStore(idList, masterStore) {
    const query = {};
    query[masterStore.idProperty] = { $in: idList };
    const decoratedStore = Filter(masterStore, query);
    decoratedStore.masterStore = masterStore,
    decoratedStore.idList = idList;
    //decoratedStore.initialQuery = initialQuery;
    decoratedStore.id = masterStore.id;
    return decoratedStore;
}

export default function () {
    return {
        createStore(execution) {
            const properties = this._properties || {};

            // TODO?: parameters, initial query, ...
            const result = execution.result;
            const store = execution.source.store;

            return processSelectionResult(result, store, Object.assign({
                maxServerFeaturesLimit: 1000
            }, properties));
        }
    };
}
