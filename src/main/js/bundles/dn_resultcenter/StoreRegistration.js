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

export default declare([], {
    _checkDatasourceRegistration: function (event) {
        this._unregister();
        const datasource = event.datasource;
        if (!datasource?.id) {
            return;
        }
        const datasourceId = datasource.id;
        const bundleContext = this._componentContext.getBundleContext();
        const references = bundleContext.getServiceReferences("ct.api.Store", "(id=" + datasourceId + ")");
        if (!references.length) {
            // Register store
            this._registration = bundleContext.registerService(["ct.api.Store"], datasource, {id: datasourceId});
        }
    },
    _unregister: function () {
        const registration = this._registration;
        if (registration) {
            registration.unregister();
            this._registration = null;
        }
    },
    deactivate: function () {
        this._unregister();
    }
});
