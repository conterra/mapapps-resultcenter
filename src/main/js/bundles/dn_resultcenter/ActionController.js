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
import Stateful from "ct/Stateful";

export default declare([Stateful], {
    controller: null,
    zoomToFeatures: false,
    zoomToSelected: false,
    centerSelected: true,
    centerClicked: true,
    zoomToClicked: false,
    zoomAfterDeletion: false,
    openPopup: true,

    constructor() {
    },
    handleDataSourceUpdate() {
        if (this.zoomToFeatures) {
            this.controller.zoomToAll();
        }
    },
    handleOnSelectionChanged() {
        if (this.zoomToSelected) {
            this.controller.zoomToSelection();
        } else if (this.centerSelected) {
            this.controller.centerSelection();
        }
    },
    handleOnDataChanged(evt) {
        if (evt.deleted && this.zoomAfterDeletion) {
            this.controller.zoomToAll();
        }
    },
    handleOnItemClicked(evt) {
        const itemId = evt?.itemId;
        if (itemId === null || itemId === undefined) {
            return;
        }

        if (this.zoomToClicked) {
            this.controller.zoomToItem(itemId);
        } else if (this.centerClicked) {
            this.controller.centerItem(itemId);
        }
        if (this.openPopup) {
            this.controller.openPopup(itemId);
        }
    }
});
