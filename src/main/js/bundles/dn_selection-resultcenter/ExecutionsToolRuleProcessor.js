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
function SelectionExecutionsToolRuleProcessor() {
    return {
        ruleProperties: ["multipleExecutionsAvailable"],
        activate() {
            const executions = this._model.get("executions");
            this._ruleContextState.set("multipleExecutionsAvailable", executions && !!executions.length);
            this.modelWatch = this._model.watch("executions", ({value}) => {
                this._ruleContextState.set("multipleExecutionsAvailable", value && !!value.length);
            });
        },
        isRuleFulfilled(tool, ctx, rules) {
            const targetMode = rules.multipleExecutionsAvailable;
            if (targetMode === undefined) {
                // nothing to process
                return [];
            }
            const mode = ctx.get("multipleExecutionsAvailable");
            if (mode === undefined) {
                return undefined;
            }
            return [mode === targetMode];
        },
        deactivate() {
            this.modelWatch.remove();
        }
    };
}

export default SelectionExecutionsToolRuleProcessor;
