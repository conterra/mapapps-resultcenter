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
import GraphicsLayer from "esri/layers/GraphicsLayer";
/**
 * Helper of FeatureMapVisualizer to ensure that graphics rendered to special layer.
 */
export default class VisualizationLayerResolver {

    #targetLayer;

    constructor(layerId, layerTitle) {
        this.layerId = layerId;
        this.layerTitle = layerTitle;
    }

    resolve(mapWidgetModel) {
        const targetSrs = mapWidgetModel.spatialReference;
        let layer = this.#targetLayer;
        const sameSrs = layer?.spatialReference?.equals(targetSrs);
        if (layer && sameSrs) {
            return layer;
        }
        this.remove();
        const map = mapWidgetModel.map;
        layer = new GraphicsLayer({
            id: this.layerId,
            title: this.layerTitle,
            listMode: "hide",
            spatialReference: targetSrs
        });
        map.add(layer);
        this.#targetLayer = layer;
        return layer;
    }
    remove() {
        const layer = this.#targetLayer;
        layer?.parent?.layers.remove(layer);
        this.#targetLayer = undefined;
    }
}
