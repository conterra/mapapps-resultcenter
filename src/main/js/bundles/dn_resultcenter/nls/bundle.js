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
    root: {
        bundleName: "Result Center",
        bundleDescription: "The central widget for displaying search results.",
        ui: {
            window:{
                title:"Result Center"
            },
            dockTool: {
                title: "Result Center",
                tooltip: ""
            },
            rectangleSelectBtn: {title: "Select Results in Map"},
            selectAllBtn: {title: "Select All"},
            removeAllBtn: {title: "Empty Result Center"},
            removeSelectedBtn: {title: "Remove Selected Features from Result Center"},
            searchStoreTool: {title: "Search a Store"},
            exportTool: {title: "Export"},
            dataView: {
                filter: {
                    menuDefaultLabel: "All",
                    textBoxPlaceHolder: "Filter view"
                },
                pager: {
                    backButtonTooltip: "Previous page",
                    forwardButtonTooltip: "Next page",
                    firstButtonTooltip: "First page",
                    lastButtonTooltip: "Last page",
                    /**
                     * the page label literal (template)
                     */
                    //pageLabelText: "Page ${currentPage} of ${endPage}",
                    pageLabeltext: "Page:",
                    /**
                     * the page size label literal (template)
                     */
                    pageSizeLabelText: "Items ${pageStartItemNumber}-${pageEndItemNumber} of ${itemCount}",
                    zeroResultsText: "No Items."    //pageSizeLabelText: "Items:"
                }
            },
            popupCannotBeDisplayed: "The popup for this item cannot be displayed.",
            newDataAvailable: "New Data Available"
        }
    },
    "de": true
};
