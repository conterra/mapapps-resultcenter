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
import ct_lang from "ct/_lang";
import Connect from "ct/_Connect";

/**
 * COPYRIGHT 2013-2016 con terra GmbH Germany
 */
export default declare([Connect], {
    // This rule processes such rule properties;
    ruleProperties: [
        "minimumItemsInResultcenter",
        "minimumSelectedItemsInResultcenter",
        "maximumSelectedItemsInResultcenter",
        "deletableInResultcenter",
        "storeSupportsGeometryInResultcenter",
        "datasourceIdInResultcenter",
        "resultcenterHasDatasource"
    ],
    // Injected Stateful
    ruleContextState: null,
    /**
     * @constructs
     */
    constructor: function () {
    },
    activate: function () {
        this.connect(this.resultcenterDataModel, "onSelectionChanged", "_onSelectionChanged");
        this.connect(this.resultcenterDataModel, "onDatasourceChanged", "_onDatasourceChanged");
    },
    _onDatasourceChanged: function (event) {
        const context = this.toolRuleContext;
        context.set("resultcenterItemsDeletable", this._isDeletable());
        context.set("resultcenterDatasource", event.datasource);
        ct_when(this._hasGeometry(), function (supportsGeometry) {
            context.set("resultcenterStoreSupportsGeometry", supportsGeometry);
        }, this);
    },
    _onSelectionChanged: function () {
        this.toolRuleContext.set("selectedItems", this._getSelectedItems());
    },
    deactivate: function () {
        this.disconnect();
    },
    /**
     * Method is called by the ToolRule Manager.
     */
    isRuleFulfilled: function (tool, context, toolRuleDef) {
        const results = [];
        this.toolRuleResultcenterHasDatasource(context, toolRuleDef, results);
        this.toolFulfillsSelectedStore(context, toolRuleDef, results);
        this.toolRuleMatchesMinNumberOfItems(context, toolRuleDef, results);
        this.toolRuleMatchesMinNumberOfItemsSelected(context, toolRuleDef, results);
        this.toolRuleMatchesMaxNumberOfItemsSelected(context, toolRuleDef, results);
        this.toolRuleDeletable(context, toolRuleDef, results);
        this.toolRuleSupportsGeometry(context, toolRuleDef, results);
        return results;
    },
    toolFulfillsSelectedStore: function (context, toolRuleDef, results) {
        const datasourceIds = toolRuleDef.datasourceIdInResultcenter;
        if (datasourceIds === undefined) {
            return;
        }
        const resultcenterDatasource = context.get("resultcenterDatasource");
        if (!resultcenterDatasource) {
            results.push(false);
            return;
        }
        results.push(datasourceIds.includes(resultcenterDatasource.id));
    },
    toolRuleSupportsGeometry: function (context, toolRuleDef, results) {
        const storeSupportsGeometryInResultcenter = toolRuleDef.storeSupportsGeometryInResultcenter;
        if (storeSupportsGeometryInResultcenter === undefined) {
            return;
        }
        results.push(context.resultcenterStoreSupportsGeometry === storeSupportsGeometryInResultcenter);
    },
    toolRuleDeletable: function (context, toolRuleDef, results) {
        const deletable = toolRuleDef.deletableInResultcenter;
        if (deletable === undefined) {
            return;
        }
        results.push(context.resultcenterItemsDeletable === deletable);
    },
    toolRuleResultcenterHasDatasource: function (context, toolRuleDef, results) {
        const resultcenterHasDatasource = toolRuleDef.resultcenterHasDatasource;
        if (resultcenterHasDatasource === undefined) {
            return;
        }
        results.push(!!context.resultcenterDatasource === resultcenterHasDatasource);
    },
    toolRuleMatchesMinNumberOfItems: function (context, toolRuleDef, results) {
        const minimumItemsInResultcenter = toolRuleDef.minimumItemsInResultcenter;
        if (minimumItemsInResultcenter === undefined || !context.resultcenterDatasource) {
            return;
        }
        results.push(context.resultcenterDatasource.idList.length >= minimumItemsInResultcenter);
    },
    toolRuleMatchesMinNumberOfItemsSelected: function (context, toolRuleDef, results) {
        const minimumSelectedItemsInResultcenter = toolRuleDef.minimumSelectedItemsInResultcenter;
        if (minimumSelectedItemsInResultcenter === undefined) {
            return;
        }
        const selectedItems = context.selectedItems || [];
        results.push(selectedItems.length >= minimumSelectedItemsInResultcenter);
    },
    toolRuleMatchesMaxNumberOfItemsSelected: function (context, toolRuleDef, results) {
        const maximumSelectedItemsInResultcenter = toolRuleDef.maximumSelectedItemsInResultcenter;
        if (maximumSelectedItemsInResultcenter === undefined) {
            return;
        }
        const selectedItems = context.selectedItems || [];
        results.push(selectedItems.length <= maximumSelectedItemsInResultcenter);
    },
    _isDeletable: function () {
        return this.resultcenterDataModel.isDeletableDataSource();
    },
    _hasGeometry: function () {
        return ct_when(this.resultcenterDataModel.getMetadata(), function (metadata) {
            return ct_lang.chk(metadata.supportsGeometry, true);
        }, this);
    },
    _getSelectedItems: function () {
        const dataModel = this.resultcenterDataModel;
        if (!dataModel) {
            return;
        }
        const deferred = dataModel.getSelected();
        return ct_when(deferred, function (itemIDs) {
            return itemIDs;
        }, function () {
            return undefined;
        }, this);
    }
});
