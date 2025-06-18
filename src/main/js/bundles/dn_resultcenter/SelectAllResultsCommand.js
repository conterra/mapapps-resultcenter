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
import ct_lang from "ct/_lang";

/**
 * Base class for select all command of result center.
 */
export default class SelectAllResultsCommand  {
    deactivate() {
        this._selected = null;
    }

    selectAll() {
        const selected = ct_lang.chk(this._selected, false);
        const dataModel = this._dataModel;
        selected ? dataModel.unselect() : dataModel.selectAll();
        this._selected = !selected;
    }

    // MAPAPPS-5697 reset selection when data source changed
    handleDataSourceChanged() {
        this._selected = false;
    }
}
