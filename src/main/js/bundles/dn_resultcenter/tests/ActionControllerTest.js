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
import ActionController from "../ActionController";

describe(sourceId, function() {
    it("expect popups can be opened for itemId 0 (MAPAPPS-5680)", function() {
        let observedItemId;

        const ctl = new ActionController();
        ctl.openPopup = true;
        ctl.controller = {
            openPopup(itemId) {
                assert.strictEqual(observedItemId, undefined);
                observedItemId = itemId;
            },
            zoomToItem() { },
            centerItem() { }
        };
        ctl.handleOnItemClicked({ itemId: 0 });

        assert.strictEqual(observedItemId, 0);
    });

    it("expect invalid events are ignored", function() {
        const ctl = new ActionController();
        ctl.openPopup = true;
        ctl.controller = {
            openPopup() {
                throw new Error("Must not be called.");
            },
            zoomToItem() {
                throw new Error("Must not be called.");
            },
            centerItem() {
                throw new Error("Must not be called.");
            }
        };

        const events = [null, undefined, {}, { itemId: undefined }, { itemId: null }];
        events.forEach(event => {
            ctl.handleOnItemClicked(event);
        });
    });
});
