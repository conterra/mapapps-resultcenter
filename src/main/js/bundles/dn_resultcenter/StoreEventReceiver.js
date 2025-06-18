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
import declare from "dojo/_base/declare";

/**
 * @fileOverview This class receives store events and sends the results to the data model.
 */
const getProperty = function (event, prop) {
    return event[prop] || event.getProperty && event.getProperty(prop);
};
export default declare([], {
    receive: function (event) {
        const store = getProperty(event, "store");
        if (store) {
            this._dataModel.setDatasource(store);
        }
    },
    // Called during editing
    _onEditEvent: function (event) {
        const model = this._dataModel;
        const store = model.datasource;
        if (!store) {
            return;
        }
        const isUpdate = getProperty(event, "isUpdate");
        const isDelete = getProperty(event, "isDelete");
        const isCreate = getProperty(event, "isCreate");
        const graphic = getProperty(event, "graphic");
        const editInfo = getProperty(event, "editInfo");
        // Hack for caching selection store invalidate cache
        const id = graphic && editInfo && editInfo.esriLayer ? graphic.attributes[editInfo.esriLayer.objectIdField]
            : undefined;
        if (id !== undefined && typeof store.invalidate === "function") {
            // Test is more a dummy which should help that we don't invalidate items in the wrong store
            const idCheck = store.getIdentity(graphic.attributes);
            if (id === idCheck) {
                store.invalidate(id);
            }
        }
        // Force table refresh
        model.fireDataChanged({
            updated: isUpdate,
            deleted: isDelete,
            added: isCreate
        });
    }
});
