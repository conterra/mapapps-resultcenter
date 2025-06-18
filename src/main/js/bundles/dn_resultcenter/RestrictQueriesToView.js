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
import ct_when from "ct/_when";
import DataViewStore from "./DataViewStore";
import Filter from "ct/store/Filter";
import delegate from "apprt-core/delegate";
import QueryResults from "dojo/store/util/QueryResults";

let idQueryCounter = 1;

function RestrictQueriesToView(dataViewModel, masterStore) {
    const filteredMaster = Filter(masterStore);
    return delegate(masterStore, {
        filterDirty: true,
        query: function (query, opts) {
            //NOTE: this may lead to multiple id requests if queries are executed fast
            if (this.filterDirty) {
                const state = idQueryCounter++;
                const idProperty = masterStore.idProperty;
                const pagedViewFilter = DataViewStore(dataViewModel, masterStore, false);
                const fields = {};
                fields[idProperty] = true;
                const items = pagedViewFilter.query({}, {fields: fields});
                return QueryResults(ct_when(items, function (items) {
                    const idQuery = {};
                    idQuery[idProperty] = {
                        $in: items.map((item) => item[idProperty])
                    };
                    let filter;
                    if (state + 1 === idQueryCounter) {
                        filteredMaster.setFilter(idQuery);
                        filter = filteredMaster;
                        this.filterDirty = false;
                    } else {
                        filter = Filter(masterStore, idQuery);
                    }
                    return filter.query(query, opts);
                }, this));
            }
            return filteredMaster.query(query, opts);
        }
    });
}

export default RestrictQueriesToView;
