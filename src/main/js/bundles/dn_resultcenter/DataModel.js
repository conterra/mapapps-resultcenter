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
import deprecate from "apprt-core/deprecate";
import ct_equal from "ct/_equal";
import ct_lang from "ct/_lang";
import ct_when from "ct/_when";
import DeferredWatcher from "ct/DeferredWatcher";
import Promise from "apprt-core/Promise";
import { SyncWritableInMemoryStore } from "store-api/InMemoryStore";
import Filter from "ct/store/Filter";
import Lookup from "ct/store/Lookup";
import NamedQueries from "ct/store/NamedQueries";
import declare from "dojo/_base/declare";
import d_aspect from "dojo/aspect";
import Evented from "dojo/Evented";
import QueryResults from "dojo/store/util/QueryResults";
import createTask from "apprt-core/AsyncTask";

const internalItemDeletionState = {
    selected: false,
    focus: false
};

export default declare([Evented], {
    // For clear identification
    isDataModel: true,
    /**
     * dojo.store.api.Store (must have support for ComplexQueries)
     */
    datasource: undefined,
    /**
     * A datasource view, searching directly on the datasource, but returning items with selected/focused state.
     */
    internalStateDatasource: undefined,
    /**
     * This is the complex query set by a user via the (result center) ui.
     * The datamodel implements self the store interface and uses this filter as default.
     * @deprecated this contains only the view query since 3.1.5!
     */
    datasourceFilterQuery: {},
    /**
     * A datasource with access only to data limited by the datasource filter.
     * This is the datasource which is internally accessed via the store methods provided by the datamodel.
     */
    filteredDatasource: undefined,
    /**
     * Internal additional state flags for datasource items.
     */
    _internalItemState: undefined,
    /**
     * Used to watch the query state.
     */
    _deferredWatcher: undefined,
    /**
     * Should the focus events are delayed, to reduce to often fired focus event.
     */
    delayFocusEvent: 100,
    /**
     * An object to combine multiple filter queries
     */
    namedQueries: undefined,

    constructor: function () {
        this._deferredWatcher = new DeferredWatcher({
            onStart: (event) => this.onUpdateStart(event),
            onEnd: (event) => this.onUpdateEnd(event)
        });
        this._internalItemState = new SyncWritableInMemoryStore({ idProperty: "id" });
        this.namedQueries = new NamedQueries();
    },
    deactivate: function () {
        this.setDatasource();
    },
    // The dojo.store.api.Store interface:
    get: function (id, options) {
        const fd = this.filteredDatasource;
        if (!fd || id === undefined || id === null) {
            return;
        }
        return fd.get(id, options);
    },
    // The dojo.store.api.Store interface:
    getIdentity: function (object) {
        const fd = this.filteredDatasource;
        return fd && fd.getIdentity(object);
    },
    // The dojo.store.api.Store interface:
    query: function (query, options) {
        const fd = this.filteredDatasource;
        if (!fd) {
            return QueryResults([]);
        }
        if (Array.isArray(query)) {
            const ids = query;
            query = {};
            query[this.idProperty] = { $in: ids };
        }
        return fd.query(query, options);
    },
    getIdList: function () {
        deprecate("DataModel.getIdList", "use a normal query expression to fetch all unfiltered ids from the store");
        const ds = this.datasource;
        if (!ds) {
            return [];
        }
        const fields = {};
        const idProperty = this.idProperty;
        fields[idProperty] = 1;
        return ct_when(ds.query({}, { fields: fields }), function (results) {
            return results.map((item) => item[idProperty]);
        });
    },
    // The dojo.store.api.Store interface:
    getMetadata: function () {
        const fd = this.filteredDatasource;
        return fd && fd.getMetadata() || { fields: [{ name: "id" }] };
    },
    isDeletableDataSource: function () {
        const fd = this.filteredDatasource;
        return !!(fd && fd.remove);
    },
    remove: function (ids) {
        const isDeletableDataSource = this.isDeletableDataSource();
        if (!isDeletableDataSource) {
            return;
        }
        if (ids === undefined || ids === null) {
            return undefined;
        }
        if (!(Array.isArray(ids))) {
            ids = [ids];
        }
        const fd = this.filteredDatasource;
        const idsToDeSelect = [];
        let clearFocus = false;
        const deleteTasks = ids.map((id) => {
            const currentState = this.getInternalState(id);
            if (currentState) {
                if (currentState.selected) {
                    idsToDeSelect.push(id);
                }
                if (currentState.focus) {
                    clearFocus = true;
                }
            }
            const remove = (featureId) => {
                const removeResult = fd.remove(featureId);
                this._updateInternalState(featureId, internalItemDeletionState);
                return (removeResult?.then ? removeResult : Promise.resolve(removeResult));
            };
            return () => remove(id);
        });
        if (clearFocus) {
            this.clearFocus();
        }
        if (idsToDeSelect.length) {
            this.setSelected(idsToDeSelect, false);
        }

        const fireDeleted = () => {
            const evt = {
                source: this,
                items: ids,
                itemContext: this.getItemContext(),
                deleted: true,
                change: "deletion"
            };
            this.onDataChanged(evt);
        };
        return Promise.all(deleteTasks.map(t => t()))
            .then(fireDeleted, (e) => {
                fireDeleted();
                throw e;
            });
    },
    removeByIds: function (ids) {
        return this.remove(ids);
    },
    queryById: function (ids, options) {
        if (ids === undefined) {
            return QueryResults([]);
        }
        if (!(Array.isArray(ids))) {
            ids = [ids];
        }
        return this.query(ids, options);
    },
    /**
     * Updates the external datasource.
     * @param datasource the datasource
     */
    setDatasource: function (datasource) {
        this.setSelected();
        this.clearFocus();
        const idProperty = this.idProperty = datasource && datasource.idProperty || "id";
        const internalItemState = this._internalItemState = new SyncWritableInMemoryStore({ idProperty: idProperty });
        this.datasource = datasource;
        // Clean aspects
        this._connectWatcher();
        delete this.filteredDatasource;
        delete this.internalStateDatasource;
        delete this.queryEngine;
        delete this.datasourceFilterQuery;
        // Reset filters
        this.namedQueries.clear();
        if (datasource) {
            const internalDataSource = this.internalStateDatasource = Lookup(datasource, internalItemState);
            this._connectWatcher(internalDataSource);
            const fd = this.filteredDatasource = Filter(internalDataSource);
            this.queryEngine = fd.queryEngine;
        }
        this.onDatasourceChanged({
            source: this,
            datasource: datasource,
            filteredDatasource: this.filteredDatasource
        });
        this.onDatasourceFilterChanged({
            source: this,
            query: undefined,
            queries: this.namedQueries,
            filterChange: true
        });
    },
    setDatasourceFilter: function (query) {
        deprecate("DataModel.setDatasourceFilter", "use DataModel.addNamedQuery instead!");
        // This updates only the view model filter
        this.setNamedQuery({
            name: "viewModelFilter",
            query: query
        });
    },
    setNamedQuery: function (namedQuery) {
        const namedQueries = this.namedQueries;
        const oldQuery = namedQueries.get(namedQuery);
        if (ct_equal.equals(oldQuery, namedQuery, true)) {
            // Nothing to update
            return;
        }
        namedQueries.set(namedQuery);
        this._updateDatasourceFilter();
    },
    removeNamedQuery: function (namedQuery) {
        const namedQueries = this.namedQueries;
        namedQueries.remove(namedQuery);
        this._updateDatasourceFilter();
    },
    _updateDatasourceFilter: function () {
        const namedQueries = this.namedQueries;
        const fd = this.filteredDatasource;
        if (fd) {
            fd.setFilter(namedQueries.toCombinedQuery());
        }
        let viewQuery = namedQueries.get("viewModelFilter");
        viewQuery = viewQuery && viewQuery.query;
        this.datasourceFilterQuery = viewQuery;
        this.onDatasourceFilterChanged({
            source: this,
            query: viewQuery,
            queries: namedQueries,
            filterChange: true
        });
    },
    getInternalState(id) {
        const state = this._internalItemState.get(id);
        return state ? { focus: state.focus ?? false, selected: state.selected ?? false } : undefined;
    },
    getSelected: function () {
        const internalItemState = this._internalItemState;
        return ct_when(internalItemState.query({ selected: true }), function (items) {
            return items.map((item) => internalItemState.getIdentity(item));
        });
    },
    setSelected: function (ids, selected, extendSelection) {
        ids = ids || [];
        if (!(Array.isArray(ids))) {
            ids = [ids];
        }
        selected = ct_lang.chk(selected, true);
        const currentSelectedIds = this.getSelected();
        return ct_when(currentSelectedIds, function (currentSelectedIds) {
            const idsToSelect = new Set();
            const idsToDeSelect = new Set();
            let allSelectedIds = new Set();
            if (selected && extendSelection) {
                allSelectedIds = new Set(currentSelectedIds);
                ids.forEach((id) => {
                    if (!allSelectedIds.has(id)) {
                        allSelectedIds.add(id);
                        idsToSelect.add(id);
                    }
                });
            } else if (selected) {
                ids.forEach((id) => {
                    if (!allSelectedIds.has(id)) {
                        allSelectedIds.add(id);
                        if (currentSelectedIds.indexOf(id) < 0) {
                            idsToSelect.add(id);
                        }
                    }
                });
                currentSelectedIds.forEach((id) => {
                    if (!allSelectedIds.has(id)) {
                        idsToDeSelect.add(id);
                    }
                });
            } else {
                // Unselected
                allSelectedIds = new Set(currentSelectedIds);
                ids.forEach((id) => {
                    if (allSelectedIds.has(id)) {
                        allSelectedIds.delete(id);
                        idsToDeSelect.add(id);
                    }
                });
            }
            idsToDeSelect.forEach((id) => {
                this._updateInternalState(id, { selected: false });
            });
            idsToSelect.forEach((id) => {
                this._updateInternalState(id, { selected: true });
            });

            const allSelectedIdsArray = Array.from(allSelectedIds);
            const idsToSelectArray = Array.from(idsToSelect);
            const idsToDeSelectArray = Array.from(idsToDeSelect);
            if (idsToDeSelect.size || idsToSelect.size) {
                this.onSelectionChanged({
                    source: this,
                    selection: true,
                    items: allSelectedIdsArray,
                    oldItems: currentSelectedIds,
                    selectedItems: idsToSelectArray,
                    deselectedItems: idsToDeSelectArray,
                    itemContext: this.getItemContext()
                });
            }
            return idsToSelectArray;
        }, this);
    },
    selectAll: function () {
        return this.select({});
    },
    unselect: function () {
        return this.setSelected();
    },
    select: function (query, extendSelection) {
        const fd = this.filteredDatasource;
        return ct_when(fd.query(query), function (items) {
            return this.setSelected(items.map((item) => fd.getIdentity(item)), true, extendSelection);
        }, this);
    },
    getFocused: function () {
        const internalItemState = this._internalItemState;
        return ct_when(internalItemState.query({ focus: true }), function (items) {
            const item = items[0];
            return item ? internalItemState.getIdentity(item) : undefined;
        });
    },
    clearFocus: function () {
        return this.setFocused();
    },
    setFocused: function (newFocusId) {
        const updateFocusTask =
            this._updateFocusTask || (this._updateFocusTask = createTask(this._updateFocus.bind(this)));
        return updateFocusTask.delay(this.delayFocusEvent, newFocusId);
    },
    _updateFocus: function (newFocusId) {
        return ct_when(this.getFocused(), function (oldFocusId) {
            if (newFocusId === oldFocusId) {
                return newFocusId;
            }
            if (oldFocusId !== undefined) {
                this._updateInternalState(oldFocusId, { focus: false });
            }
            if (newFocusId !== undefined) {
                this._updateInternalState(newFocusId, { focus: true });
            }
            const evt = {
                source: this,
                item: newFocusId || oldFocusId,
                oldItem: oldFocusId,
                itemContext: this.getItemContext(),
                focused: !((newFocusId || oldFocusId) === oldFocusId),
                focus: true
            };
            this.onFocusChanged(evt);
            return newFocusId;
        }, this);
    },
    /**
     * This method gets the current item context.
     * Currently this is used in the ContentViewerCommand and FeatureVisualizer to transport the datasource ids of the
     * content.
     */
    getItemContext: function () {
        const fd = this.filteredDatasource;
        return {
            storeId: fd && fd.id,
            idProperty: this.idProperty
        };
    },
    /**
     * Helper method for external code to inform the datamodel and all listeners about changes in the source store.
     */
    fireDataChanged: function (evt) {
        evt = evt || {};
        evt.change = evt.change || "data";
        this.onDataChanged(Object.assign({ source: this }, evt));
    },
    /**
     * @event is thrown if a new datasource is set.
     * @param event the event
     */
    onDatasourceChanged: function (event) {
        event.change = "datasource";
        this.emit("datasource-changed", event);
        this.onDataChanged(event);
    },
    /**
     * @event Is thrown if a new datasource filter is set.
     * @param event the event
     */
    onDatasourceFilterChanged: function (event) {
        event.change = "datasource-filter";
        this.emit("datasource-filter-changed", event);
        this.onDataChanged(event);
    },
    /**
     * @event Thrown when one or more data rows have been selected.
     */
    onSelectionChanged: function (event) {
        event.change = "selection";
        this.emit("selection-changed", event);
        this.onDataChanged(event);
    },
    /**
     * @event Thrown when the focus item changes.
     */
    onFocusChanged: function (event) {
        event.change = "focus";
        this.emit("focus-changed", event);
        this.onDataChanged(event);
    },
    /**
     * @event called if internal state changes occur (selected, focused, removed, filterchange)
     */
    onDataChanged: function (event) {
        this.emit("data-changed", event);
    },
    /**
     * When ever a new query is started
     */
    onUpdateStart: function (event) {
        this.emit("update-start", event);
    },
    /**
     * When ever a query finishes
     */
    onUpdateEnd: function (event) {
        this.emit("update-end", event);
    },
    _updateInternalState: function (id, newState) {
        if (ct_lang.isEmpty(id)) {
            // No change
            return false;
        }
        const internalItemState = this._internalItemState;
        const item = internalItemState.get(id);
        return ct_when(item, function (item) {
            if (item) {
                if (this._itemStateEqual(item, newState)) {
                    return false;
                }
                Object.assign(item, newState);
                if (this._canBeDeleted(item)) {
                    internalItemState.remove(id);
                } else {
                    internalItemState.put(item);
                }
                return true;
            } else {
                if (this._canBeDeleted(newState)) {
                    return false;
                }
                item = Object.assign({}, newState);
                item[internalItemState.idProperty] = id;
                internalItemState.add(item);
                return true;
            }
        }, this);
    },
    _canBeDeleted: function (item) {
        return this._itemStateEqual(item, internalItemDeletionState);
    },
    _itemStateEqual: function (item, newState) {
        let match = true;
        ct_lang.forEachOwnProp(newState, function (value, name) {
            match &= !item[name] === !value;
        });
        return match;
    },
    _connectWatcher: function (store) {
        const watcher = this._deferredWatcher;
        (watcher.___aspects || []).forEach((a) => {
            a.remove();
        });
        watcher.___aspects = [];
        if (store) {
            const watcherAspect = function (r) {
                watcher.watch(r);
                return r;
            };
            watcher.___aspects = [
                d_aspect.after(store, "get", watcherAspect),
                d_aspect.after(store, "query", watcherAspect)
            ];
        }
    }
});
