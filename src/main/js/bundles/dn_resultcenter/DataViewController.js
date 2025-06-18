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
import Evented from "dojo/Evented";
import _Connect from "ct/_Connect";
import DataViewModel from "dataview/DataViewModel";

/**
 * @fileOverview a controller of dataModel and dataView
 */
export default declare([Evented], /** @lends resultcenter.DataViewController.prototype*/ {
    /**
     * This is an adapter and controller of the DataView-Widget and the DataModel.
     *
     * @constructs
     * @extends ct._Connect
     */
    constructor: function () {
        this.listeners = new _Connect({defaultConnectScope: this});
    },
    // The injected dataView
    dataView: null,
    // The injected dataModel
    dataModel: null,
    activate: function () {
        const dataModel = this.dataModel;
        this.listeners.connect(dataModel, "onSelectionChanged", "_handleSelectionChangeInDataModel");
        this.listeners.connect(dataModel, "onFocusChanged", "_handleFocusChangeInDataModel");
        this.listeners.connect(dataModel, "onDatasourceChanged", "_handleDataSourceUpdate");
        this.listeners.connect(dataModel, "onDatasourceFilterChanged", "_handleDataSourceFilterUpdate");
        this.listeners.connect(dataModel, "onDataChanged", "_handleDataUpdates");
        const dataView = this.dataView;
        dataView.set("model", this._createViewModel());
    },
    _createViewModel: function () {
        this.listeners.disconnect("viewmodel");
        const dataModel = this.dataModel;
        const filteredStore = dataModel.filteredDatasource;
        if (!filteredStore) {
            return undefined;
        }
        const itemsPerPage = this.dataView.itemsPerPage || this.dataViewModel.itemsPerPage;
        const model = this.dataViewModel = new DataViewModel({
            store: filteredStore,
            selectedIds: dataModel.getSelected(),
            focusId: dataModel.getFocused(),
            itemsPerPage: itemsPerPage
        });
        this.listeners.connectP("viewmodel", model, "selectedIds", "_handleSelectionChangeInView");
        this.listeners.connectP("viewmodel", model, "focusId", "_handleFocusChangeInView");
        this.listeners.connectP("viewmodel", model, "startItemIndex", "_handlePageStateChangeInView");
        this.listeners.connectP("viewmodel", model, "itemsPerPage", "_handlePageStateChangeInView");
        this.listeners.connectP("viewmodel", model, "itemSorting", "_handlePageStateChangeInView");
        this.listeners.connectP("viewmodel", model, "filterQuery", "_handleFilterQueryChangeInView");
        return model;
    },
    _handleDataSourceUpdate: function () {
        const dataView = this.dataView;
        dataView.set("model", this._createViewModel());
    },
    _handleDataSourceFilterUpdate: function (evt) {
        const dataView = this.dataView;
        const m = dataView.get("model");
        if (m) {
            const q = evt.queries.get("viewModelFilter");
            m.set("filterQuery", q && q.query);
            m.fireDataChanged();
        }
    },
    _handleSelectionChangeInDataModel: function () {
        if (this._dataModelSelectedUpdate) {
            return;
        }
        const dataView = this.dataView;
        const model = dataView.get("model");
        const dataModel = this.dataModel;
        if (!model) {
            return;
        }
        this._viewModelSelectedUpdate = true;
        try {
            model.set("selectedIds", dataModel.getSelected());
        } finally {
            this._viewModelSelectedUpdate = false;
        }
    },
    _handleSelectionChangeInView: function (name, oldSelectedIds, newSelectedIds) {
        if (this._viewModelSelectedUpdate) {
            return;
        }
        const dataModel = this.dataModel;
        this._dataModelSelectedUpdate = true;
        try {
            dataModel.setSelected(newSelectedIds);
        } finally {
            this._dataModelSelectedUpdate = false;
        }
    },
    _handleFocusChangeInDataModel: function (evt) {
        if (this._dataModelFocusUpdate) {
            return;
        }
        const itemId = evt.item;
        const focused = evt.focused;
        const model = this.dataView.get("model");
        if (!model) {
            return;
        }
        this._viewModelFocusUpdate = true;
        try {
            model.set("focusId", focused ? itemId : undefined);
        } finally {
            this._viewModelFocusUpdate = false;
        }
    },
    _handleFocusChangeInView: function (name, oldFocusId, newFocusId) {
        if (this._viewModelFocusUpdate) {
            return;
        }
        this._dataModelFocusUpdate = true;
        const dataModel = this.dataModel;
        try {
            dataModel.setFocused(newFocusId);
        } finally {
            this._dataModelFocusUpdate = false;
        }
    },
    _handleDataUpdates: function (evt) {
        if (evt.deleted || evt.added || evt.updated || evt.change === "data") {
            this.dataView.storeContentChanged();
        }
    },
    _handleFilterQueryChangeInView: function (name, oldQuery, newQuery) {
        this.dataModel.setNamedQuery({
            name: "viewModelFilter",
            query: newQuery
        });
        this._handlePageStateChangeInView();
    },
    _handlePageStateChangeInView: function () {
        const model = this.dataView.get("model");
        this.onPageStateChange({
            start: model.get("startItemIndex"),
            count: model.get("itemsPerPage"),
            sort: model.get("itemSorting"),
            query: model.get("filterQuery")
        });
    },
    deactivate: function () {
        this.listeners.disconnect();
    },
    onPageStateChange: function (evt) {
        this.emit("page-state-change", evt);
    }
});
