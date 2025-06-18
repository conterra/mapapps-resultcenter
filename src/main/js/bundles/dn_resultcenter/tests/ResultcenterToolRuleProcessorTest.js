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
import ResultcenterToolRuleProcessor from "../ResultcenterToolRuleProcessor";

let toolRuleProcessor;
let results;
describe(sourceId, function() {
    beforeEach(function () {
        toolRuleProcessor = new ResultcenterToolRuleProcessor();
        results = [];
    });

    it("has at least 2 Items", function () {
        const context = {
            resultcenterDatasource: {
                idList: ["2", "12", "123"]
            }
        };
        const toolRuleDef = {minimumItemsInResultcenter: 2};
        toolRuleProcessor.toolRuleMatchesMinNumberOfItems(context, toolRuleDef, results);
        assert.equal(results[0], true);
    });

    it("hasDatasource", function () {
        const context = {
            "resultcenterDatasource": {
                "id": "myTestStore"
            }
        };
        const toolRuleDef = {resultcenterHasDatasource: true};
        toolRuleProcessor.toolRuleResultcenterHasDatasource(context, toolRuleDef, results);
        assert.equal(results[0], true);
    });

    it("has No Datasource", function () {
        const context = {};
        const toolRuleDef = {resultcenterHasDatasource: true};
        toolRuleProcessor.toolRuleResultcenterHasDatasource(context, toolRuleDef, results);
        assert.equal(results[0], false);
    });

    it("selected store fullfilled when datasource matches", function () {
        const context = {
            get() {
                return {
                    "id": "myTestStore"
                };
            }
        };
        const toolRuleDef = {datasourceIdInResultcenter: ["myTestStore"]};
        toolRuleProcessor.toolFulfillsSelectedStore(context, toolRuleDef, results);
        assert.equal(results[0], true);
    });

    it("selected store not fullfilled when datasource does not match", function () {
        const context = {
            get() {
                return {
                    "id": "myTestStore"
                };
            }
        };
        const toolRuleDef = {datasourceIdInResultcenter: ["myTestStoreXXX"]};
        toolRuleProcessor.toolFulfillsSelectedStore(context, toolRuleDef, results);
        assert.equal(results[0], false);
    });

    it("selected store not fullfilled when datasource is undefined", function () {
        const context = {
            get() {
                return undefined;
            }
        };
        const toolRuleDef = {datasourceIdInResultcenter: ["myTestStore"]};
        toolRuleProcessor.toolFulfillsSelectedStore(context, toolRuleDef, results);
        assert.equal(results[0], false);
    });

    describe("minimum selected items", function() {
        it("0", function () {
            const context = {
                selectedItems: [
                    "1",
                    "2"
                ]
            };
            const toolRuleDef = {minimumSelectedItemsInResultcenter: 0};
            toolRuleProcessor.toolRuleMatchesMinNumberOfItemsSelected(context, toolRuleDef, results);
            assert.ok(results[0]);
        });

        it("1", function () {
            const context = {selectedItems: ["1"]};
            const toolRuleDef = {minimumSelectedItemsInResultcenter: 1};
            toolRuleProcessor.toolRuleMatchesMinNumberOfItemsSelected(context, toolRuleDef, results);
            assert.ok(results[0]);
        });

        it("2", function () {
            const context = {
                selectedItems: [
                    "1",
                    "2"
                ]
            };
            const toolRuleDef = {minimumSelectedItemsInResultcenter: 2};
            toolRuleProcessor.toolRuleMatchesMinNumberOfItemsSelected(context, toolRuleDef, results);
            assert.ok(results[0]);
        });

        it("undefined", function () {
            const context = {
                selectedItems: [
                    "1",
                    "2"
                ]
            };
            const toolRuleDef = {};
            toolRuleProcessor.toolRuleMatchesMinNumberOfItemsSelected(context, toolRuleDef, results);
            assert.equal(results.length, 0);
        });

        it("falsy", function () {
            const context = {selectedItems: []};
            const toolRuleDef = {minimumSelectedItemsInResultcenter: 1};
            toolRuleProcessor.toolRuleMatchesMinNumberOfItemsSelected(context, toolRuleDef, results);
            assert.notOk(results[0]);
        });
    });

    describe("maximum selected items", function() {
        it("0", function () {
            const context = {selectedItems: ["1"]};
            const toolRuleDef = {maximumSelectedItemsInResultcenter: 0};
            toolRuleProcessor.toolRuleMatchesMaxNumberOfItemsSelected(context, toolRuleDef, results);
            assert.notOk(results[0]);
        });

        it("1", function () {
            const context = {selectedItems: ["1"]};
            const toolRuleDef = {maximumSelectedItemsInResultcenter: 1};
            toolRuleProcessor.toolRuleMatchesMaxNumberOfItemsSelected(context, toolRuleDef, results);
            assert.ok(results[0]);
        });

        it("1 and 2 selected", function () {
            const context = {
                selectedItems: [
                    "1",
                    "2"
                ]
            };
            const toolRuleDef = {maximumSelectedItemsInResultcenter: 1};
            toolRuleProcessor.toolRuleMatchesMaxNumberOfItemsSelected(context, toolRuleDef, results);
            assert.notOk(results[0]);
        });

        it("undefined", function () {
            const context = {selectedItems: ["1"]};
            const toolRuleDef = {};
            toolRuleProcessor.toolRuleMatchesMaxNumberOfItemsSelected(context, toolRuleDef, results);
            assert.equal(results.length, 0);
        });
    });
});
