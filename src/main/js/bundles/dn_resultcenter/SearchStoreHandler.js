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
// eslint-disable-next-line no-use-before-define
const undef = undefined;

export default function () {
    let activatedTools = {};
    return {
        showData(event) {
            const eventType = getProperty(event, "evtType");
            const tool = getProperty(event, "tool");
            // cancel if togglable tool and click event is recognized
            const togglable = tool.get("togglable");
            if (togglable && eventType === "Click") {
                return;
            }
            const store = getProperty(event, "store");
            if (store) {
                if (togglable) {
                    activatedTools[tool.id] = tool;
                }
                this._dataModel.setDatasource(store);
            }
        },

        clearData(event) {
            this._activeTool = undef;
            const store = getProperty(event, "store");
            const tool = getProperty(event, "tool");
            delete activatedTools[tool.id];
            const dataModel = this._dataModel;
            if (store && dataModel.datasource === store) {
                dataModel.setDatasource();
            }
        },

        handleDataSourceUpdate(event) {
            const dataSource = getProperty(event, "datasource");
            Object.keys(activatedTools).forEach((id) => {
                const activeTool = activatedTools[id];
                if (activeTool && activeTool.store !== dataSource) {
                    activeTool.set("active", false);
                }
            });
        },

        deactivate() {
            activatedTools = undef;
        }
    };
}

function getProperty(event, prop) {
    return event[prop] || event.getProperty && event.getProperty(prop);
}
