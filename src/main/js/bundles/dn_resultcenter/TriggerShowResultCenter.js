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
import ct_when from "ct/_when";
import BaseCommand from "./BaseCommand";

/**
 * @fileOverview contains code to show the result center if new items existing.
 */
export default declare([BaseCommand], {
    /**
     * The tool to activate on update
     */
    tool: null,
    handleOnUpdate: function (evt) {
        const dataModel = this._dataModel;
        if (dataModel.isMultiSelection) {
            // open/close controlled outside
            return;
        }

        const props = this._properties;
        const tool = this.tool;
        const store = evt.source;
        const newDataAvailableMsg = this._i18n.get().ui.newDataAvailable;

        const result = store.datasource ? this._retrieveStoreItems(store) : { total: 0 };
        ct_when(result.total, (total) => {

            if (dataModel.isMultiSelection) {
                // open/close controlled outside
                return;
            }

            // todo check if result is a QueryResult, otherwise the test here is wrong!
            if (total > 0) {
                if (props.showToolOnData) {
                    tool.set("visibility", true);
                }
                if (props.autoOpen) {
                    tool.set("active", true);
                } else if (!tool.get("active")) {
                    // send info message to tool
                    tool.infoMsg(newDataAvailableMsg);
                }
            } else {
                if (props.autoClose) {
                    tool.set("active", false);
                }
                if (props.hideToolOnEmpty) {
                    tool.set("visibility", false);
                }
            }
        });
    }
});
