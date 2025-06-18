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
import ct_when from "ct/_when";
import ct_geometry from "ct/mapping/geometry";

function DataModelMapController() {
    return {
        dataModel: null,
        mapWidgetModel: null,
        constructor() {
        },
        zoomToAll() {
            this.zoomToItems({});
        },
        zoomToSelection() {
            const d = this.dataModel;
            const s = d.getSelected();
            ct_when(s, "zoomToItems", this);
        },
        _getGeometryOpts() {
            const { extent, view } = this.mapWidgetModel;
            // NPE on destroyed view (2D/3D)
            const offset = view ? Math.floor(extent.width / view.width) : 0;
            return {
                fields: { geometry: true },
                geometry: {
                    sr: this.mapWidgetModel.spatialReference,
                    maxAllowableOffset: offset
                }
            };
        },
        zoomToItems(idsOrQuery) {
            const mapWidgetModel = this.mapWidgetModel;
            const {
                defaultZoomScale = 5000
            } = this._properties || {};
            const opts = this._getGeometryOpts();
            this._withItems(idsOrQuery, (items, extent) => {
                if (items.length && extent) {
                    if (extent.height === 0 && extent.width === 0) {
                        mapWidgetModel.view.goTo({
                            target: extent,
                            scale: defaultZoomScale
                        });
                    } else {
                        mapWidgetModel.extent = extent;
                    }
                }
            }, this, opts);
        },
        zoomToItem(id) {
            if (id !== undefined && id !== null) {
                this.zoomToItems([id]);
            }
        },
        centerSelection() {
            const dataModel = this.dataModel;
            const selectedItems = dataModel.getSelected();
            ct_when(selectedItems, "centerItems", this);
        },
        centerItems(idsOrQuery) {
            const opts = this._getGeometryOpts();
            this._withItems(idsOrQuery, function (items, extent) {
                if (items.length && extent) {
                    this.mapWidgetModel.center = extent.center;
                }
            }, this, opts);
        },
        centerItem(id) {
            if (id !== undefined && id !== null) {
                this.centerItems([id]);
            }
        },
        openPopup(itemId) {
            if (!this.popupService) {
                return;
            }
            const itemContext = this.dataModel.getItemContext();
            const context = Object.assign({}, itemContext);
            context.store = this.dataModel.datasource;
            this.popupService.openPopup(itemId, context);
        },
        _withItems(idsOrQuery, cb, scope, options) {
            if (idsOrQuery === undefined || idsOrQuery === null) {
                return;
            }
            const dataModel = this.dataModel;
            const isArray = Array.isArray(idsOrQuery);
            if (isArray && !idsOrQuery.length) {
                return;
            }
            ct_when(isArray ? dataModel.queryById(idsOrQuery, options) : dataModel.query(idsOrQuery, options),
                function (items) {
                    const itemsWithGeometry = items.filter((item) => !!item.geometry);
                    let extent;
                    if (itemsWithGeometry.length) {
                        extent = ct_geometry.calcExtent(itemsWithGeometry.map((item) => item.geometry));
                    }
                    cb.call(scope || this, items, extent);
                }, this);
        }
    };
}

export default DataModelMapController;
