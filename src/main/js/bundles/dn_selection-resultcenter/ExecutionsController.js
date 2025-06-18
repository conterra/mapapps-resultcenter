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
import Vue from "apprt-vue/Vue";
import VueDijit from "apprt-vue/VueDijit";
import ExecutionsPane from "./ExecutionsPane.vue";

const _bundleContext = Symbol("_bundleContext");
const _paneWidget = Symbol("_paneWidget");
const _paneModel = Symbol("_paneModel");
const _paneServiceRegistration = Symbol("_serviceRegistration");
const _executionTotalChangeHandles = Symbol("_handles");
const _dataSourceChangeHandle = Symbol("_dataSourceChangeHandle");
const _executionsChangeHandel = Symbol("_executionsChangeHandel");
const _dataChangeHandle = Symbol("_dataChangeHandle");

export default class ExecutionsController {

    activate(componentContext) {
        this[_bundleContext] = componentContext.getBundleContext();
        this[_executionTotalChangeHandles] = [];

        // property used together with resultcenter/TriggerShowResultCenter
        Object.defineProperty(this.dataModel, "isMultiSelection", {
            configurable: true,
            get: () => !!this[_paneServiceRegistration]
        });

        const vm = this[_paneModel] = new Vue(ExecutionsPane);
        vm.i18n = this._i18n.get();
        vm.showFilterButton = this._properties.showFilterButton;
        this[_paneWidget] = VueDijit(vm);

        this._handleSelect();
        this._handleClearAll();
        this._handleCancel();

        this[_executionsChangeHandel] = this._handleExecutionsChange();
        this[_dataSourceChangeHandle] = this._handleDatasourceChange();
    }

    deactivate() {
        // reset property
        this[_executionsChangeHandel].remove();
        this[_dataSourceChangeHandle].remove();
        const handles = this[_executionTotalChangeHandles];
        handles && handles.forEach((h) => h.remove());
        this[_executionTotalChangeHandles] = [];
        this._unregisterPane();
    }

    _handleExecutionsChange() {
        return this.executionsModel.watch("executions", ({ value }) => {
            if (!value || value.length < 1) {
                this._unregisterPane();
                return;
            }
            this[_paneModel].executions = this._extractViewProperties(value);
            this._selectFirstExecution(value);
            if (!this[_paneServiceRegistration]) {
                this._registerPane();
            }
        });
    }

    _extractViewProperties(executions) {
        return executions.map(execution => {
            const executionViewProperties = {
                id: execution.source.id,
                title: execution.source.title,
                state: "pending",
                count: 0
            };
            execution.waitForExecution().then(() => {
                if (execution.error) {
                    executionViewProperties.state = "failed";
                    executionViewProperties.errorMessage = execution.error.message;
                } else {
                    executionViewProperties.state = "finished";
                    executionViewProperties.count = execution.total;
                }
            });

            const handles = this[_executionTotalChangeHandles];
            handles && handles.forEach((h) => h.remove());
            this[_executionTotalChangeHandles] = [];
            this[_executionTotalChangeHandles].push(execution.watch("total", ({ value }) => {
                executionViewProperties.count = value;
            }));
            return executionViewProperties;
        });
    }

    _selectFirstExecution(executions) {
        let isFirstFinishedExecution = false;
        const firstExec = executions[0];
        if (firstExec) {
            const store = this._storeFactory.createStore(firstExec);
            store.isExecutionsPaneSelection = true;
            this.dataModel.setDatasource(store);
        }
        executions.forEach(execution => {
            if (execution.executed) {
                isFirstFinishedExecution = this._processFinished(execution, isFirstFinishedExecution);
                return;
            }
            execution.waitForExecution().then(() => {
                isFirstFinishedExecution = this._processFinished(execution, isFirstFinishedExecution);
            });
        });
    }

    _handleSelect() {
        this[_paneModel].$on('select', (id) => {
            this._setActiveId(id);
        });
    }

    _handleClearAll() {
        this[_paneModel].$on('clear', () => {
            this.dataModel.setDatasource();
            this.executionsModel.reset();
        });
    }

    _handleCancel() {
        this[_paneModel].$on('abort', () => {
            this.executionsModel.abortAll();
        });
    }

    _handleDatasourceChange() {
        return this.dataModel.on("datasource-changed", ({ datasource }) => {
            if (this[_paneServiceRegistration] && datasource && !datasource.isExecutionsPaneSelection) {
                this._unregisterPane();
                this.executionsModel.reset();
            }
        });
    }

    _processFinished(execution, isFirstFinishedExecution) {
        if (!isFirstFinishedExecution && execution.result?.total > 0) {
            this._setActiveId(execution.source.id);
            isFirstFinishedExecution = true;
        }
        return isFirstFinishedExecution;
    }

    _setActiveId(selectedExecutionId) {
        this[_paneModel].selectedExecutionId = selectedExecutionId;
        if (this[_dataChangeHandle]) {
            const handle = this[_dataChangeHandle];
            this[_dataChangeHandle] = undefined;
            handle.remove();
        }
        const execution = this.executionsModel.executions.find(({ source: { id } }) => id === selectedExecutionId);
        const store = this._storeFactory.createStore(execution);
        store.isExecutionsPaneSelection = true;
        this.dataModel.setDatasource(store);

        this[_dataChangeHandle] = this.dataModel.on("data-changed", (evt) => {
            if (evt.deleted) {
                const idProperty = evt.itemContext.idProperty;
                evt.items.forEach((toDelete) => {
                    const index = execution.result.findIndex((item) => item[idProperty] === toDelete);
                    if (index > -1) {
                        execution.result.splice(index, 1);
                    }
                });
                const executionInView = this[_paneModel].executions.find(({ id }) => id === execution.source.id);
                executionInView.count = execution.result.length;
            }
        });
    }

    _registerPane() {
        const widget = this[_paneWidget];
        // with new search reset the initial filter state
        widget.set("filteredView", !!this._properties.filterByDefault);
        this[_paneServiceRegistration] = this[_bundleContext].registerService(
            ["resultcenter.DataViewLeftPaneWidget"],
            widget,
            { design: "sidebar" }
        );
        this._showResultCenter(true);
    }

    _unregisterPane() {
        if (!this[_paneServiceRegistration]) {
            return;
        }
        this[_paneServiceRegistration].unregister();
        this[_paneServiceRegistration] = null;
        this._showResultCenter(false);
    }

    _showResultCenter(show) {
        this.resultcenterToggleTool.set("active", show);
        this.resultcenterToggleTool.set("visibility", show);
    }
}
