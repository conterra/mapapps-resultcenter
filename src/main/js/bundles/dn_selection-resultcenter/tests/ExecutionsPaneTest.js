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
import Vue from "apprt-vue/Vue";
import Vuetify from "vuetify";
import ExecutionsPane from "../ExecutionsPane.vue";

Vue.use(Vuetify);

const mountVueComponent = function(results, showFilterButton=true ) {
    const vue = new Vue(ExecutionsPane);
    vue.executions = results;
    vue.showFilterButton = showFilterButton;
    vue.i18n = {
        ui: {
            abortExecutions: "Abort queries",
            deleteExecutions: "Clear results",
            defaultErrorMessage: "Selection failed"
        }
    };
    vue.$mount();
    return vue;
};

describe(sourceId, function() {
    it("expect execution labels text is displayed correctly", () => {
        const vue = mountVueComponent([
            {
                id: "trees",
                title: "Trees",
                state: "pending"
            }, {
                id: "lines",
                title: "Lines",
                state: "pending"
            }
        ]);
        const titles = vue.$el.getElementsByClassName("v-list__tile__title");
        assert.equal(titles[0].textContent, "Trees");
        assert.equal(titles[1].textContent, "Lines");
    });

    it("expect execution icons are displayed correctly", () => {
        const vue = mountVueComponent([
            {
                id: "trees",
                title: "Trees",
                state: "pending"
            }, {
                id: "lines",
                title: "Lines",
                state: "failed"
            }
        ]);
        const listTiles = vue.$el.getElementsByClassName("v-list__tile");
        assert.equal(listTiles[0].getElementsByClassName("v-progress-circular").length, 1);
        assert.equal(listTiles[0].getElementsByClassName("icon-sign-warning").length, 0);
        assert.equal(listTiles[1].getElementsByClassName("v-progress-circular").length, 0);
        assert.equal(listTiles[1].getElementsByClassName("icon-sign-warning").length, 1);
    });

    it("expect filter button is hidden when no execution failed ", () => {
        const vue = mountVueComponent([{
            id: "lines",
            title: "Lines",
            state: "finished",
            count:"2"
        }]);
        const footer = vue.$el.getElementsByClassName("ct-executions-pane__footer");
        assert.equal(footer[0].getElementsByClassName("v-tooltip").length, 0);
    });

    it("expect filter button is hidden although no finished execution is available", () => {
        const vue = mountVueComponent([{
            id: "lines",
            title: "Lines",
            state: "failed"
        }], false);
        const footer = vue.$el.getElementsByClassName("ct-executions-pane__footer");
        assert.equal(footer[0].getElementsByClassName("v-tooltip").length, 0);
    });

    it("expect filter button is displayed when any execution is failed", () => {
        const vue = mountVueComponent([{
            id: "lines",
            title: "Lines",
            state: "failed"
        }]);
        const footer = vue.$el.getElementsByClassName("ct-executions-pane__footer");
        assert.equal(footer[0].getElementsByClassName("v-tooltip").length, 1);
    });
});
