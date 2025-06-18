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
import number from "dojo/number";
import locale from "dojo/date/locale";
import createDomainUtil from "ct/store/Domains";
import clone from "apprt-core/clone";

/**
 * @fileOverview contains code for common (shared) command functions.
 */
export default class ExportResultsCommand {
    async exportSelected() {
        const properties = this._properties || {};
        const mimetype = properties.mimetype || "text/plain";
        const charset = properties.charset || document.characterSet;
        const filename = properties.filename || "resultcenter.txt";
        const separator = properties.separator || ";";
        const undefinedValue = properties.undefinedValue || "";
        const detectExtraFields = properties.detectExtraFields ?? true;
        let ignoreFields = clone(properties._defaultIgnoreFields) || [];
        const dataModel = this._dataModel;
        const id = dataModel.datasource.id;
        const additionalFields = (properties.ignoreFields || {})[id];
        ignoreFields = ignoreFields.concat(additionalFields);
        const selectedIds = await dataModel.getSelected();
        if (selectedIds.length) {
            const entries = await dataModel.queryById(selectedIds);
            const md = await dataModel.getMetadata();
            const domains = createDomainUtil(md);
            const resultString = this._prepareEntries(
                entries,
                separator,
                undefinedValue,
                ignoreFields,
                md,
                domains,
                properties.exportDomainValues,
                detectExtraFields
            );
            this._fileSaver.save(resultString, filename, mimetype, charset);
        }
    }

    _formatValue(value, type) {
        let val = value;
        // Format fields depending on types
        const properties = this._properties || {};
        const formatOptions = properties.formatOptions || { number: { pattern: "#.####################" } };
        const formatOptionsForType = formatOptions[type] || {};
        if (type === "number") {
            val = number.format(val, formatOptionsForType);
        }
        // Format date
        if (type === "date" || type === "time") {
            const formatOpts = Object.assign(
                {
                    formatLength: "medium",
                    selector: type
                },
                formatOptionsForType
            );
            const date = !(val instanceof Date) ? new Date(val) : val;
            val = val === null || val === undefined || val.length === 0 || isNaN(date.getTime()) ? "" : locale.format(date, formatOpts);
        }
        return String(val);
    }

    _escape(value, separator) {
        /*
         * If a value contains a comma(separator), a newline character or a double quote,
         * then the string must be enclosed in double quotes.
         * E.g: "Newline char in this field \n"
         * A double quote must be escaped with another double quote. E.g: "The double quote character "" is offensive."
         */
        let val = value;
        let surroundingQuotesRequired = false;
        val = val.replace(RegExp(`["\\n\\r${separator}]`, "g"), function (a) {
            if (a === '"') {
                surroundingQuotesRequired = true;
                return '""';
            } else {
                surroundingQuotesRequired = true;
                return a;
            }
        });
        // Escape separator char and line break
        return surroundingQuotesRequired ? `"${val}"` : val;
    }

    // eslint-disable-next-line max-len
    _prepareEntries(
        entries,
        separator,
        undefinedValue,
        ignoreFields,
        metadata,
        domains,
        exportDomainValues,
        detectExtraFields
    ) {
        ignoreFields = ignoreFields ?? [];
        let resultString = "";
        metadata = metadata || {};
        const fields = metadata.fields || [];
        const resolvedFields = this._resolveFields(entries, fields, ignoreFields, detectExtraFields);

        // header
        for (const resolvedField of resolvedFields) {
            resultString += resolvedField.title + separator;
        }
        resultString += "\n";
        // data
        for (const entry of entries) {
            const domainEntry = domains.toDomainValues(entry);
            const valueBag = exportDomainValues ? entry : domainEntry;
            for (const resolvedField of resolvedFields) {
                const fieldName = resolvedField.name;
                let val = valueBag[fieldName] ?? undefinedValue ?? "";

                // Type needs to be set to string in order to have a
                // correct output otherwise it will be formatted as
                // number which results in a null value
                // see MAPAPPS-4756
                // TODO: this is just a quick fix. we should work on
                // the original data not on what the grid sees
                const type =
                    !exportDomainValues && entry[fieldName] !== domainEntry[fieldName] ? "string" : resolvedField.type;
                // Format special types
                val = this._formatValue(val, type);
                // Escape " chars, separator chars and line breaks
                val = this._escape(val, separator);
                resultString += val + separator;
            }
            resultString += "\n";
        }
        return resultString;
    }

    _resolveFields(entries, fields, ignoreFields, detectExtraFields = false) {
        const fieldsToIgnore = new Set(ignoreFields);
        const resolvedFields = fields
            .filter((f) => !fieldsToIgnore.has(f.name))
            .map((f) => {
                return {
                    name: f.name,
                    title: f.title || f.name,
                    type: f.type
                };
            });

        const fieldNames = new Set(resolvedFields.map(f=>f.name));

        // need to iterate over the full entry set to detect all possible field names
        // new fields are appended to end of field list
        if (detectExtraFields) {
            for (const entry of entries) {
                for (const n in entry) {
                    if (typeof entry[n] === "function") {
                        continue;
                    }
                    if (fieldNames.has(n) || fieldsToIgnore.has(n)) {
                        continue;
                    }
                    fieldNames.add(n);
                    resolvedFields.push({
                        name: n,
                        title: n,
                        type: undefined
                    });
                }
            }
        }
        return resolvedFields;
    }
}
