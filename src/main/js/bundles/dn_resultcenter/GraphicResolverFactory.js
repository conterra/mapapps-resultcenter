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
import { fromJSON } from "esri/symbols/support/jsonUtils";
import PostfixAttributeTableLookupStrategy from "./PostfixAttributeTableLookupStrategy";
import ct_url from "ct/_url";

class GraphicResolverFactory {

    #defaultResolver;
    activate() {
        this.symbolLookup = this._generateSymbolsLookUp(this._properties.symbolLookup);
        this._defaultSymbolLookup = this._generateSymbolsLookUp(this._properties._defaultSymbolLookup);
        this.#defaultResolver = this.buildDefaultResolver();
    }
    deactivate() {
        this.#defaultResolver = undefined;
        this._defaultSymbolLookup = undefined;
        this.symbolLookup = undefined;
    }

    /** Used by FeatureMapVisualizer to lookup symbols */
    resolveSymbol(geometry, attributes, context) {
        return this.#defaultResolver.resolve(geometry, attributes, context);
    }

    buildDefaultResolver() {
        const symbolLookupConfig = this.symbolLookup || {};
        const defaultLookupConfig = this._defaultSymbolLookup;

        const lookupTable = symbolLookupConfig.lookupTable || {};
        const defaultLookupTable = defaultLookupConfig._defaultLookupTable;

        const symbolLookupStrategy = new PostfixAttributeTableLookupStrategy();
        const mixedLookupTable = Object.assign({}, defaultLookupTable, lookupTable);
        replaceResourceUrls(mixedLookupTable);
        const attributeNames = symbolLookupConfig.lookupAttributeName
            || defaultLookupConfig._defaultLookupAttributeName;
        symbolLookupStrategy.lookupAttributeName = attributeNames;
        symbolLookupStrategy.lookupTable = mixedLookupTable;
        return {
            resolve(geometry, attributes, context) {
                return symbolLookupStrategy.lookup(geometry, attributes, context);
            }
        };
    }

    _generateSymbolsLookUp(symbolLookup) {
        for (const lookup in symbolLookup.lookupTable) {
            const symbol = symbolLookup.lookupTable[lookup];
            symbolLookup.lookupTable[lookup] = fromJSON(symbol);
        }
        return symbolLookup;
    }
}

function replaceResourceUrls(lookupTable) {
    for (const lookupEntry in lookupTable) {
        const url = lookupTable[lookupEntry].url;
        if (url) {
            lookupTable[lookupEntry].url = ct_url.resourceURL(url, "resultcenter");
        }
    }
    return lookupTable;
}

export default GraphicResolverFactory;
