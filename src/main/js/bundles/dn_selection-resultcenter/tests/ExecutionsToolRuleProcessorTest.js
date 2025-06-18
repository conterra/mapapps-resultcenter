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
import ExecutionsToolRuleProcessor from "../ExecutionsToolRuleProcessor";
import ToolRuleContext from "toolrules/ToolRuleContext";
import { declare } from "apprt-core/Mutable";
import { waitFor } from "test-utils/waitFor";

const ExecutionsModel = declare({
    executions: {
        value: [],
        required: true
    }
});

let model;
let context;
let processor;

describe(sourceId, function () {
    beforeEach(function () {
        model = new ExecutionsModel();
        context = new ToolRuleContext();

        processor = ExecutionsToolRuleProcessor();
        processor._ruleContextState = context;
        processor._model = model;
    });

    it("expect undefined if SelectionQueryExecutions is missing", function () {
        assert.equal(
            processor.isRuleFulfilled(null, context, {
                multipleExecutionsAvailable: true
            }),
            undefined
        );
    });

    it("expect activate connects query selection model and tool rule state", async function () {
        processor.activate();

        model.set("executions", [{ id: "trees" }]);
        await waitFor(() => assert.isTrue(context.get("multipleExecutionsAvailable")));
    });

    it("expect empty array if specified rules does not contain 'multipleExecutionsAvailable'", function () {
        processor.activate();

        model.set("executions", [{ id: "trees" }]);
        assert.deepEqual(processor.isRuleFulfilled(null, context, { foo: "bar" }), []);
    });

    it("expect false if modes do not match", async function () {
        processor.activate();

        model.set("executions", [{ id: "trees" }]);
        await waitFor(() =>
            assert.isFalse(processor.isRuleFulfilled(null, context, { multipleExecutionsAvailable: false })[0])
        );
    });

    it("expect true if modes match", async function () {
        processor.activate();

        model.set("executions", [{ id: "trees" }]);
        await waitFor(() =>
            assert.isTrue(processor.isRuleFulfilled(null, context, { multipleExecutionsAvailable: true })[0])
        );
    });

    it("expect false if rule used non boolean value", async function () {
        processor.activate();

        model.set("executions", [{ id: "trees" }]);
        await waitFor(() =>
            assert.isFalse(processor.isRuleFulfilled(null, context, { multipleExecutionsAvailable: "foo" })[0])
        );
    });
});
