/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope Public
 */

var log, search;

define(['N/log', 'N/search'], function (logModule, searchModule) {
    log = logModule;
    search = searchModule;
    return {
        post: postProcess
    };
});

function postProcess(request) {
    try {
        if ((typeof request.searchID === 'undefined') || (request.searchID === null) || (request.searchID === '')) {
            throw {
                'type': 'error.SavedSearchAPIError',
                'name': 'INVALID_REQUEST',
                'message': 'No searchID was specified.'
            };
        }

        var mySearch = search.load({
            id: request.searchID
        });

        var customFilters = [];
        var defaultFilters = mySearch.filters;
        customFilters = {
            "name": request.searchColumn,
            "operator": search.Operator.IS,
            "values": request.searchValue
        };

        defaultFilters.push(customFilters);
        mySearch.filters = defaultFilters;

        var resultSet = mySearch.run();
        var start = 0;
        var end = 1000;
        var allResults = [];
        var results;

        do {
            results = resultSet.getRange({
                start: start,
                end: end
            });

            allResults = allResults.concat(results);
            start += 1000;
            end += 1000;
        } while (results.length === 1000);

        if (allResults.length === 0) {
            throw {
                'type': 'error.SavedSearchAPIError',
                'name': 'NO_RESULTS_FOUND',
                'message': 'No results found for the given criteria.'
            };
        }

        var resultData = allResults.map(function (result) {
            var columns = result.columns;
            var recordData = {};
            columns.forEach(function (column) {
                recordData[column.name] = result.getValue(column);
            });
            return recordData;
        });

        log.debug({
            title: 'Results Count:',
            details: allResults.length
        });

        return {
            'status': 'success',
            'data': resultData
        };

    } catch (e) {
        log.debug({
            title: 'error',
            details: e
        });
        return {
            'error': {
                'type': e.type,
                'name': e.name,
                'message': e.message
            }
        };
    }
}
