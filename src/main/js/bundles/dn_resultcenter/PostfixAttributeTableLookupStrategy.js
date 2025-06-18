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
import SymbolTableLookupStrategy from "graphics/SymbolTableLookupStrategy";

export default declare([SymbolTableLookupStrategy], {
    selectedPostfix: "-selected",
    highlightedPostfix: "-highlighted",
    lookup: function (geometry, attributes) {
        const selectedPostfix = this.selectedPostfix;
        const highlightedPostfix = this.highlightedPostfix;
        let geomType = geometry.type;
        let symbol;
        if (attributes) {
            let attrVal = attributes[this.lookupAttributeName];
            if (attrVal) {
                if (attributes.selected) {
                    attrVal = attrVal + selectedPostfix;
                }
                if (attributes.focus) {
                    attrVal = attrVal + highlightedPostfix;
                }
                symbol = this._lookupByAttrValue(attrVal);
            } else {
                if (attributes.selected) {
                    geomType = geomType + selectedPostfix;
                }
                if (attributes.focus) {
                    geomType = geomType + highlightedPostfix;
                }
                symbol = this._lookupByGeomType(geomType);
            }
        }
        return symbol || this.inherited(arguments);
    }
});
