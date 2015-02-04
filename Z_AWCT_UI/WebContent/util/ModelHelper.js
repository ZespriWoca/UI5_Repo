(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.util.ModelHelper");

    /**
     * @classdesc This helper class provides static methods that can be used throughout the application whenever a specific model manipulation is required.
     * @class
     * @name com.zespri.awct.util.ModelHelper
     */
    com.zespri.awct.util.ModelHelper = {};

    /**
     * Triggers an OData read using the supplied parameters, and asynchronously returns a JSONModel filled with the server's response by invoking the
     * success callback with the filled JSONModel instance as a parameter. Assumes that the root component has an associated ODataModel
     * 
     * @param {String}
     *            sPath The first parameter to the ODataModel.read method {@link sap.ui.model.odata.ODataModel#read}
     * @param {Object}
     *            mParameters The second parameter to the ODataModel.read method. Only <i>mParameters.context</i> and <i>mParameters.urlParameters</i>
     *            should be passed. If there are no parameters to supply, an empty object still needs to be passed.
     *            {@link sap.ui.model.odata.ODataModel#read}
     * @param {Function}
     *            fnSuccess The callback to be executed once the data has been retrieved from the server. The callback receives a JSONModel filled
     *            with data from the backend as a parameter.
     * @param {Function}
     *            fnError The callback to be executed if the server returns an error. Error details will be passed to the callback as parameter.
     * @static
     * @memberOf com.zespri.awct.util.ModelHelper
     */
    com.zespri.awct.util.ModelHelper.getJSONModelForRead = function(sPath, mParameters, fnSuccess, fnError) {
        // Basic assertions
        jQuery.sap.assert(fnSuccess != null, "Parameter fnSuccess is mandatory, but wasn't provided.");
        jQuery.sap.assert(typeof (fnSuccess) === "function", "Parameter fnSuccess should be a function, but isn't.");

        // Prepare a success handler for the OData read
        var fnReadSuccess = function(oData) {
            // If read is on a single entity, there won't be a 'results' node. Let's add a 'result' node. This makes it easier to bind to this model.
            var oJSONData = {};
            var oJSONModel = new sap.ui.model.json.JSONModel();

            // Minor transformations
            if (!oData.results) {
                oJSONData.result = oData;
            } else {
                oJSONData = oData;

                // Default size limit is 100 (used for list bindings)
                oJSONModel.setSizeLimit(oData.results.length);
            }

            oJSONModel.setData(oJSONData);
            fnSuccess(oJSONModel);
        };

        // Prepare an error handler for the OData read
        var fnReadError = function(oError) {
            if (fnError && (typeof fnError === "function")) {
                fnError(oError);
            }
        };

        // Prepare the mReadParams object for the OData read.
        var mReadParams = {};
        if (mParameters) {
            if (mParameters.context) {
                mReadParams.context = mParameters.context;
            }
            if (mParameters.urlParameters) {
                mReadParams.urlParameters = mParameters.urlParameters;
            }
        }
        mReadParams.success = fnReadSuccess;
        mReadParams.error = fnReadError;

        // Trigger the read
        sap.ui.getCore().getRootComponent().getModel().read(sPath, mReadParams);
    };
})();
