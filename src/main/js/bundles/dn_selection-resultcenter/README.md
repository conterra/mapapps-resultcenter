# selection-resultcenter

This bundles provides an extension to the user interface of the [resultcenter](#bundle=dn_resultcenter@/README.md) to display and interact with multiple query results from the `SpatialSearchService` of the [selection-services](#bundle=selection-services@/README.md) bundle.

## Usage

No configuration is required.
Default values are applied.

After a selection is made, an `ExecutionsPane` is injected into the `DataViewLeftPaneWidget` of the resultcenter bundle to display the results.
If the selection is made on multiple data sources/stores, multiple result sets are displayed in the provided user interface and the user can browse through them.

## Constraints

The properties `autoOpen`, `autoClose`, and `hideToolOnEmpty` of the [resultcenter](#bundle=dn_resultcenter@/README.md) bundle are ignored when using this bundle.

## Configuration reference

The following code sample shows the configurable properties and its default values:

```json
"selection-resultcenter": {
    "Config": {
        "showFilterButton": true,
        "filterByDefault": true
    }
}
```

| Property           | Type    | Description                                                                                                                          |
| ------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `showFilterButton` | Boolean | To always hide the filter button, set this property to `false`.                                                                      |
| `filterByDefault`  | Boolean | To display all selected layers/topics after a selection, including the ones that have no result items, set this property to `false`. |
