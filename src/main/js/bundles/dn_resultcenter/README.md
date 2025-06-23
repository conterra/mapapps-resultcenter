# dn_resultcenter

The Result Center bundle is a set of components used to display and visualize content returned as a result of a search request, such as geographic features or tabular data.

By default, the Result Center is located in a dock window at the bottom of the screen.
When the Result Center DataModel is filled with new data the features are rendered on the map and a button is displayed in the bottom bar.
By clicking that button the Result Center window is opened and the results are displayed in a table.
Clicking a row in the table centers the map at the corresponding feature and opens an info window with additional information.
Select items by clicking the checkbox. Selected items can be exported e.g. with the report tool ([reporttool bundle](#bundle=reportool@/README.md)).

## Usage

No configuration is needed. Default values are applied.

The following widget can be registered in a template by calling its widget role:

| Widget Role    | Component | Description                 |
| -------------- | --------- | --------------------------- |
| `resultCenter` | DataView  | Displays the result center. |

### Search Features

Type a text into the search text box to search for features.
You can specify on which table column to search by selecting it in the drop-down box to the right.

### Deleting Features

To delete all feature use the "remove all features" tool.
You can also remove selected features by using the "remove selected" tool.

## Configuration Reference

### Tools

| Tool ID                  | Component               | Description                                                                         |
| ------------------------ | ----------------------- | ----------------------------------------------------------------------------------- |
| `resultcenterToggleTool` | ResultCenterTogglerTool | Opens the Result Center.                                                            |
| `removeAllTool`          | RemoveAllTool           | A tool that uses the ClearResultsCommand to remove all item from the Result Center. |
| `removeSelectedTool`     | RemoveSelectedTool      | Removes the selected items from the Result Center.                                  |
| `searchStoreTool`        | SearchStoreTool         | See following description.                                                          |
| `exportTool`             | ExportTool              | Exports the selected elements, using the filesaver bundle.                          |

*SearchStoreTool*

| Property  | Type   | Mandatory | Description                                                 |
| --------- | ------ | --------- | ----------------------------------------------------------- |
| `id`      | String | yes       | ID of the new tool.                                         |
| `storeId` | String | yes       | ID of the store which should be put into the result center. |
| `title`   | String | yes       | Tool title.                                                 |
| `tooltip` | String | yes       | Tool tooltip                                                |

This is a component factory component and requires the array syntax in the `app.json` file.
```json
"resultcenter": {
  "SearchStoreTool": [{
    "id": "searchCountrys",
    "title": "Search Countries",
    "storeId": "Country"
  }]
}
```

### Action Controller

The ActionController focuses the map on certain features in the data model.

| Property            | Type    | Mandatory | Default | Description                                                       |
| ------------------- | ------- | --------- | ------- | ----------------------------------------------------------------- |
| `zoomToFeatures`    | Boolean | no        | false   | Zooms the map so that all features in the data model are visible. |
| `zoomToSelected`    | Boolean | no        | false   | Zooms the map to the selected features.                           |
| `centerSelected`    | Boolean | no        | false   | Centers the map on the selected features.                         |
| `zoomAfterDeletion` | Boolean | no        | false   | Zooms to the remaining features                                   |
| `zoomToClicked`     | Boolean | no        | false   | Zooms to clicked feature.                                         |
| `centerClicked`     | Boolean | no        | true    | Centers the map in the current clicked feature.                   |
| `openPopup`         | Boolean | no        | true    | When available, a popup is opened on item-click.                  |

Code sample for `app.json` file:

```json
"resultcenter": {
  "ActionController": {
    "zoomToFeatures": false,
    "zoomToSelected": false,
    "centerSelected": false,
    "zoomAfterDeletion": false,
    "zoomToClicked" : false,
    "centerClicked": true,
    "openPopup": true
  }
}
```

### Trigger Show Result Center Command

| Property          | Type    | Mandatory | Default | Description                                                     |
| ----------------- | ------- | --------- | ------- | --------------------------------------------------------------- |
| `showToolOnData`  | Boolean | no        | true    | Shows the result center tool if data is available.              |
| `autoOpen`        | Boolean | no        | true    | Opens the result center window, if data is available.           |
| `hideToolOnEmpty` | Boolean | no        | true    | Hides the result tool if no data is available.                  |
| `autoClose`       | Boolean | no        | true    | Closes the result center automatically if no data is available. |

Code sample for `app.json` file:

```json
"resultcenter": {
  "TriggerShowResultCenterCommand": {
    "showToolOnData": true,
    "autoOpen": false,
    "hideToolOnEmpty": true,
    "autoClose": true
  }
}
```

### Graphic Resolver Factory

Transports the configuration of symbols.
For possible symbols see [ArcGIS Rest API](https://developers.arcgis.com/documentation/common-data-types/symbol-objects.htm).

Four different presentation states are possible:

| State                    | Postfix               |
| ------------------------ | --------------------- |
| NORMAL                   | NONE                  |
| highlighted              | -highlighted          |
| selected                 | -selected             |
| selected and highlighted | -selected-highlighted |

The following code sample for the `app.json` file shows the default symbology, which can be overwritten partially:

```json
"resultcenter": {
    "GraphicResolverFactory": {
        "symbolLookup": {
            "lookupAttributeName": "type",
            "lookupTable": {
                "point": {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": [0,255,255,64],
                    "size": 16,
                    "outline": {
                        "color": [0,255,255,255],
                        "width": 2
                    }
                },
                "point-highlighted": {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": [0,255,255,64],
                    "size": 16,
                    "outline": {
                        "color": [255,0,0,255],
                        "width": 2
                    }
                },
                "point-selected": {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": [0,255,0,64],
                    "size": 16,
                    "outline": {
                        "color": [0,255,0,255],
                        "width": 2
                    }
                },
                "point-selected-highlighted": {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": [0,255,0,64],
                    "size": 16,
                    "outline": {
                        "color": [255,0,0,255],
                        "width": 2
                    }
                },
                "polyline": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    "color": [0,255,255,255],
                    "width": 1.3
                },
                "polyline-highlighted": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    "color": [255,0,0,255],
                    "width": 1.3
                },
                "polyline-selected": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    "color": [0,255,0,255],
                    "width": 3
                },
                "polyline-selected-highlighted": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    "color": [255,0,0,255],
                    "width": 1.3
                },
                "polygon": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [0,255,255,64],
                    "outline": {
                        "color": [0,255,255,255],
                        "width": 2
                    }
                },
                "polygon-highlighted": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [0,255,255,64],
                    "outline": {
                        "color": [255,0,0,255],
                        "width": 2
                    }
                },
                "polygon-selected": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [0,255,0,64],
                    "outline": {
                        "color": [0,255,0,255],
                        "width": 2
                    }
                },
                "polygon-selected-highlighted": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [0,255,0,64],
                    "outline": {
                        "color": [255,0,0,255],
                        "width": 2
                    }
                }
            }
        }
    }
}
```

### Export Results Command

Command that is used to prepare the result center content to allow a CSV export.

| Property             | Type    | Mandatory | Default                              | Description                                                                                   |
| -------------------- | ------- | --------- | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `mimetype`           | String  | no        | `"text/csv"`                         | MIME-type of exported file                                                                    |
| `filename`           | String  | no        | `"graphics.txt"`                     | Name of exported file                                                                         |
| `separator`          | String  | no        | `","`                                | Separator character                                                                           |
| `undefinedValue`     | String  | no        | `""`                                 | Character to be set if item has no value                                                      |
| `ignoreFields`       | Object  | no        | `{"infoservice" : ["data","point"]}` | Mapping of store ID and additional fields to ignore                                           |
| `detectExtraFields`  | Boolean | no        | `false`                              | When true extra fields are detected based on the information available in the items to export |
| `exportDomainValues` | Boolean | no        | `false`                              | If true the values for a domain instead of the name is exported                               |

Code sample for `app.json` file:

```json
"resultcenter": {
    "ExportResultsCommand": {
        "mimetype" : "text/csv",
        "filename" : "resultcenter.csv",
        "separator" : ";",
        "undefinedValue"  : "",
        // additional field mappings for each store to ignore (format: <store_id> : [fields])
        "ignoreFields" : {
            "infoservice" : ["data","point"]
        },
        "exportDomainValues": false
    }
}
```

### Result Center Tool Rule Processor

The ResultcenterToolRuleProcessor allows to define rules for the number of selected items in the result center table.

| Property                              | Type    | Description                                                                                                              |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `minimumSelectedItemsInResultcenter`  | Integer | Rule matches if the number of selected resultcenter items is at least the value of `minimumSelectedItemsInResultcenter`. |
| `maximumSelectedItemsInResultcenter`  | Integer | Rule matches if the number of selected resultcenter items is at most the value of `maximumSelectedItemsInResultcenter`.  |
| `deletableInResultcenter`             | Boolean | Rule matches if the data source of the result center allows deleting items.                                              |
| `storeSupportsGeometryInResultcenter` | Boolean | Rule matches if store supports geometries.                                                                               |
| `datasourceIdInResultcenter`          | Array   | Rule matches if the ID of the current data source is defined in array `datasourceIdInResultcenter`.                      |
| `minimumItemsInResultcenter`          | Integer | Rule matches if the amount of items in resultcenter is larger.                                                           |
| `resultcenterHasDatasource`           | Boolean | Rule matches if ResultCenter has no data source.                                                                         |

As an example, the following tool is available when the number of selected result center items is between 1 and 20:

```json
{
    "name": "ToolWithToolRules",
    "impl": "ct/tools/Tool",
    "provides": "ct.tools.Tool",
    "propertiesConstructor": true,
    "properties": {
        "id": "toolWithToolRules",
        "toolRole": "resultcenter",
        "rules": {
            "minimumSelectedItemsInResultcenter": 1,
            "maximumSelectedItemsInResultcenter": 20
        }
    }
}
```

### Feature Map Visualizer

The feature visualizer component renders features from the data model to the map.

| Property            | Type    | Mandatory | Default | Description                                                                                                                                                                       |
| ------------------- | ------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useDataViewPaging` | Boolean | no        | false   | If the DataView component is enabled the FeatureVisualizer component connects to the DataViewController and only shows those icons that are visible on the current DataView page. |

### DataView

A component that provides different views on the features in the data model (such as tabular or icon based views). It contains a search box and a paging mechanism.

| Property            | Type    | Mandatory | Default | Description                                                                                                                                                       |
| ------------------- | ------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `showFilter`        | Boolean | no        | true    | Whether the search box should be displayed.                                                                                                                       |
| `filterDuringKeyUp` | Boolean | no        | true    | Whether a search should already be performed while the user types the search .                                                                                    |
| `showPager`         | Boolean | no        | true    | Whether the pager to navigate through the single DataView pages should be displayed.                                                                              |
| `showViewButtons`   | Boolean | no        | true    | Enables the buttons to switch between different views (such as table or icon view)                                                                                |
| `itemsPerPage`      | Integer | no        | 25      | The number of items displayed on one page in the DataView.                                                                                                        |
| `domainAware`       | Boolean | no        | true    | Ensures that the DataView uses a resolving mechanism for domains/subtypes (of a feature service). Instead of raw subtype codes, the resolved values are rendered. |

Code Sample for `app.json` file:

```json
"resultcenter": {
    "DataView": {
        "_i18nPath": "ui.dataView",
        "showFilter": true,
        "filterDuringKeyUp": true,
        "showPager": true,
        "showViewButtons": false,
        "itemsPerPage": 25
    }
}
```
