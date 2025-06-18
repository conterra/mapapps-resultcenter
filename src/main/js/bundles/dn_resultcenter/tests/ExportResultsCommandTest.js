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
import { assert } from "chai";

import { sourceId } from "source-info!";
import ExportResultsCommand from "../ExportResultsCommand";
import number from "dojo/number";
import locale from "dojo/date/locale";
import createDomainUtil from "ct/store/Domains";

/* eslint-disable no-unused-vars */

const numberTest = 1.234;
const date = new Date("2014-12-24T12:12:20");
const timeComp = locale.format(date, {
    formatLength: "medium",
    selector: "time"
});
const dateComp = locale.format(date, {
    formatLength: "medium",
    selector: "date"
});

const metadata = {
    fields: [
        {
            name: "name",
            title: "Name"
        },
        {
            name: "id",
            title: "ID"
        },
        {
            name: "type",
            title: "Type"
        },
        {
            name: "title",
            title: "Title"
        }
    ]
};

const separator = ";";
let exportResultsCommand;

describe(sourceId, function () {
    beforeEach(function () {
        exportResultsCommand = new ExportResultsCommand();
    });

    it("expect that entries can be converted to csv", function () {
        const csv = exportResultsCommand._prepareEntries(
            [
                {
                    name: "small_house",
                    id: 1,
                    type: "house",
                    title: "Small House"
                },
                {
                    name: "big_house",
                    id: 2,
                    type: "house",
                    title: "Big House"
                }
            ],
            separator,
            "",
            [],
            metadata,
            createDomainUtil(metadata),
            false
        );
        assert.equal(csv, "Name;ID;Type;Title;\nsmall_house;1;house;Small House;\nbig_house;2;house;Big House;\n");
    });

    it("MAPAPPS-6925 - expect that fields do not dependent on first entry", function () {
        const csv = exportResultsCommand._prepareEntries(
            [
                {
                    name: "small_house",
                    id: 1,
                    type: "house"
                },
                {
                    name: "big_house",
                    id: 2,
                    type: "house",
                    title: "Big House"
                }
            ],
            separator,
            "",
            [],
            metadata,
            createDomainUtil(metadata),
            false,
            false
        );
        assert.equal(csv, "Name;ID;Type;Title;\nsmall_house;1;house;;\nbig_house;2;house;Big House;\n");
    });

    it("expect that fields not in metadata will be detected from all entries, if detectExtraFields is enabled", function () {
        const csv = exportResultsCommand._prepareEntries(
            [
                {
                    name: "small_house",
                    id: 1,
                    type: "house"
                },
                {
                    name: "big_house",
                    id: 2,
                    type: "house",
                    title: "Big House"
                },
                {
                    name: "bigger_house",
                    id: 3,
                    type: "house",
                    title: "Bigger House",
                    withBath: false
                },
                {
                    name: "verybig_house",
                    id: 4,
                    type: "house",
                    title: "Very Big House",
                    withKitchen: true
                }
            ],
            separator,
            "",
            [],
            metadata,
            createDomainUtil(metadata),
            false,
            true
        );
        assert.equal(
            csv,
            "Name;ID;Type;Title;withBath;withKitchen;\nsmall_house;1;house;;;;\nbig_house;2;house;Big House;;;\nbigger_house;3;house;Bigger House;false;;\nverybig_house;4;house;Very Big House;;true;\n"
        );
    });

    it("_formatValue as number", function () {
        const tmp = exportResultsCommand._formatValue(numberTest, "number");
        const numberComp = number.format(numberTest);
        assert.equal(numberComp, tmp);
    });

    it("_formatValue as time", function () {
        const tmp = exportResultsCommand._formatValue(date, "time");
        assert.equal(timeComp, tmp);
    });

    it("_formatValue as date", function () {
        const tmp = exportResultsCommand._formatValue(date, "date");
        assert.equal(dateComp, tmp);
    });

    it("_formatValue as date before 1970", function () {
        const dateBefore1970 = new Date(1969, 6, 21);
        const dateBefore1970Comp = locale.format(dateBefore1970, {
            formatLength: "medium",
            selector: "date"
        });
        const tmp = exportResultsCommand._formatValue(dateBefore1970, "date");
        assert.equal(dateBefore1970Comp, tmp);
    });

    it("_formatValue as empty date", function () {
        let tmp = exportResultsCommand._formatValue(null, "date");
        assert.equal("", tmp, "Empty string expected, but got '" + tmp + "'");
        tmp = exportResultsCommand._formatValue(null, "date");
        assert.equal("", tmp, "Empty string expected, but got '" + tmp + "'");
    });

    it("_formatValue as corrupt date", function () {
        const tmp = exportResultsCommand._formatValue("This is no date...", "date");
        assert.equal("", tmp, "Empty string expected, but got '" + tmp + "'");
    });

    it("_formatValue with properties", function () {
        exportResultsCommand._properties = { formatOptions: { number: { pattern: "0" } } };
        const tmp = exportResultsCommand._formatValue(numberTest, "number");
        assert.equal("1", tmp);
    });

    it("_escape separator", function () {
        const value = separator;
        const tmp = exportResultsCommand._escape(value, separator);
        assert.strictEqual('";"', tmp);
    });

    it("_escape linebreaks", function () {
        const value = "This is my test...\nwith a line break";
        const tmp = exportResultsCommand._escape(value, separator);
        assert.strictEqual('"' + value + '"', tmp);
    });

    it('_escape " chars', function () {
        const value = 'He says: "hello"!';
        const tmp = exportResultsCommand._escape(value, separator);
        assert.strictEqual('"He says: ""hello""!"', tmp);
    });
});
