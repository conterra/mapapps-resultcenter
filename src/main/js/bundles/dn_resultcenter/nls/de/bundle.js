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
export default {
    bundleName: "Ergebniscenter",
    bundleDescription: "Eine Komponente zur Anzeige von Suchergebnissen.",
    ui: {
        window:{
            title:"Ergebniscenter"
        },
        dockTool: {
            title: "Ergebniscenter",
            tooltip: ""
        },
        rectangleSelectBtn: {title: "Ergebnisse in der Karte ausw\u00E4hlen"},
        selectAllBtn: {title: "Alles ausw\u00E4hlen"},
        removeAllBtn: {title: "Ergebniscenter leeren"},
        removeSelectedBtn: {title: "Ausgew\u00E4hlte Elemente aus dem Ergebniscenter entfernen"},
        searchStoreTool: {title: "Daten durchsuchen"},
        exportTool: {title: "Exportieren"},
        dataView: {
            filter: {
                textBoxPlaceHolder: "Anzeige filtern",
                menuDefaultLabel: "Alle"
            },
            pager: {
                backButtonTooltip: "Vorherige Seite",
                forwardButtonTooltip: "N\u00E4chste Seite",
                firstButtonTooltip: "Erste Seite",
                lastButtonTooltip: "Letzte Seite",
                /**
                 * the page lable literal (template)
                 */
                //            pageLabelText: "Seite ${currentPage} von ${endPage}",
                pageLabelText: "Seite:",
                /**
                 * the page size label literal (template)
                 */
                pageSizeLabelText: "Treffer ${pageStartItemNumber}-${pageEndItemNumber} von ${itemCount}",
                zeroResultsText: "Keine Treffer"    //pageSizeLabelText: "Treffer:"
            },
            DGRID: {
                noDataMessage: "Keine Daten.",
                loadingMessage: "Lade Daten..."
            }
        },
        popupCannotBeDisplayed: "F\u00fcr dieses Element kann kein Popup angezeigt werden.",
        newDataAvailable: "Neue Daten sind verf\u00fcgbar"
    }
};
