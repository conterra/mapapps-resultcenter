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
import ct_lang from "ct/_lang";
import Filter from "ct/store/Filter";

function updateFilter(filter, model) {
    const sort = ct_lang.chk(model.get("itemSorting"), undefined);
    const start = ct_lang.chk(model.get("startItemIndex"), undefined);
    const count = ct_lang.chk(model.get("itemsPerPage"), undefined);
    filter.setFilter(model.get("filterQuery"), {
        start: start,
        count: count,
        sort: sort,
        preferClientOptions: true
    });
}

export default function (model, store, listenForChanges) {
    store = store || model.get("store");
    if (!store) {
        return undefined;
    }
    const filter = Filter(store);
    const update = function () {
        updateFilter(filter, model);
    };
    update();
    const handles = [];
    if (listenForChanges) {
        handles.push(model.watch("itemSorting", update));
        handles.push(model.watch("startItemIndex", update));
        handles.push(model.watch("itemsPerPage", update));
        handles.push(model.watch("filterQuery", update));
    }
    filter.disconnect = function () {
        for (let i = 0; i < handles.length; ++i) {
            handles[i].remove();
        }
    };
    return filter;
}
