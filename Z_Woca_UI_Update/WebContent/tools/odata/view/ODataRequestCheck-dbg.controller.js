/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });
    jQuery.sap.require("com.zespri.awct.util.CommonHelper");
    jQuery.sap.require("com.zespri.awct.util.CommonFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");

    /**
     * @class
     * @classdesc This controller is used for checking the availability of odata services that are applicable for AWCT and also measuring the
     *            performance of the same
     * @name com.zespri.awct.tools.odata.view.ODataRequestCheck
     */
    com.zespri.awct.core.Controller.extend("com.zespri.awct.tools.odata.view.ODataRequestCheck", /** @lends com.zespri.awct.tools.odata.view.ODataRequestCheck */
    {
        onInit : function() {
            /* START of instance member initialization */
            // Private variable for View Settings Dialog
            this._oDialogViewSettings = null;
            // Private Instance variable for user authorization
            this._bUserAuthorized = false;
            /* END of instance member initialization */

            var oController = this;
            // Checking the routing pattern and if the pattern matches then JSON is called
            oController.getRouter().attachRoutePatternMatched(
                    function(oEvent) {

                        if (oEvent.getParameter("name") === "Tools/OData") {
                            // Check the current user authorizations
                            if (!oController._bUserAuthorized) {
                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                            } else {

                                oController.oJsonRequestTable = {};

                                jQuery.ajax({
                                    url : "tools/odata/ODataRequests.json",
                                    headers : {
                                        "x-csrf-token" : com.zespri.awct.util.CommonHelper.getCSRFToken()
                                    }
                                }).done(
                                        function(data) {
                                            var oJSONOdataRequest = JSON.parse(data.replace(/!!STRDEL!!/gi, ""));

                                            // Setting the JSON model to the view
                                            oController.oJSONOdataRequest = oJSONOdataRequest;
                                            oController.getView().setModel(new sap.ui.model.json.JSONModel(oJSONOdataRequest), "odataRequest");

                                            // Initially displaying all the URL entries in the JSON to the Result Table
                                            var oOdataRequest = oController.oJSONOdataRequest.results[0];
                                            var aJsonRequestTable = [];
                                            var sUrlPath;
                                            // Loop through all the JSON and generating the result JSON containing all the odata request URLs and
                                            // setting
                                            // it to
                                            // the table
                                            for ( var i = 0; i < oOdataRequest.requests.length; i++) {

                                                // Appending sap statistics to the url. If the URL contains '?' then &sap-statistics=true else
                                                // ?sap-statistics=true
                                                if (oOdataRequest.requests[i].url.search("\\?") === -1) {
                                                    sUrlPath = oOdataRequest.requests[i].url + "?sap-statistics=true";
                                                } else {
                                                    sUrlPath = oOdataRequest.requests[i].url + "&sap-statistics=true";
                                                }
                                                aJsonRequestTable[i] = [];
                                                aJsonRequestTable[i].path = sUrlPath;
                                                aJsonRequestTable[i].fullpath = oOdataRequest.baseURL + sUrlPath;
                                                aJsonRequestTable[i].status = -1;
                                                aJsonRequestTable[i].gwtotal = 0;
                                                aJsonRequestTable[i].gwhub = 0;
                                                aJsonRequestTable[i].gwrfcoh = 0;
                                                aJsonRequestTable[i].gwbe = 0;
                                                aJsonRequestTable[i].gwapp = 0;

                                            }

                                            // JSON object
                                            oController.oJsonRequestTable = {
                                                results : aJsonRequestTable
                                            };

                                            // Setting the Table Title with the item count
                                            var iOdataRequestCount = aJsonRequestTable.length;

                                            oController.getView().byId("odataRequestToolTableTitle").setText(
                                                    com.zespri.awct.util.I18NHelper.getText("TXT_ODATAREQUESTCHECK_RESULT_TABLE_TITLE",
                                                            [iOdataRequestCount]));
                                            // Setting the Model
                                            oController.getView().setModel(new sap.ui.model.json.JSONModel(oController.oJsonRequestTable),
                                                    "OdataRequestResultTable");
                                        });
                            }
                        }

                    }, oController);
        },

        /**
         * This method will be called before rendering the View.
         * 
         * @memberOf com.zespri.awct.oDataCheck.view.ODataRequestCheck
         */
        onBeforeRendering : function() {
            // Check User Authorizations
            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                    com.zespri.awct.util.Enums.AuthorizationObject.Administration, com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM)) {
                if (this.byId("pageODataTool")) {
                    this.byId("pageODataTool").destroy();
                }
                this._bUserAuthorized = false;
            } else {
                this._bUserAuthorized = true;
            }
        },

        /**
         * This method will check the input combinations and create the JSON as per the combination and then setting the model to the Table
         * 
         * @memberOf com.zespri.awct.oDataCheck.view.ODataRequestCheck
         * 
         * @param {String}
         *            sDropSelect contains the selected drop item
         * @param {String}
         *            sGroupSelect contains the selected group item
         * @param {Integer}
         *            iStatus contains the status of the odata request
         * @return {Array} aJSONReuestTable is an array containing the values after checking the combination
         */
        // getSelectedTableEntries : function(sDropSelect, sGroupSelect, iStatus) {
        getSelectedTableEntries : function(sGroupSelect, iStatus) {
            var oController = this;
            oController.oJsonRequestTable = {};
            var aJsonRequestTable = [];
            var iJsonCount = 0;
            var sServiceUrl = "";

            // Storing the JSON to a local variable
            var oOdataRequest = this.oJSONOdataRequest.results[0];
            var sUrlPath = "";

            // adjust the URL to include the browser domain and port
            sServiceUrl = location.protocol + "//" + location.host + oOdataRequest.baseURL;

            // Loop through the request array in the JSON to get the URL details
            for ( var i = 0; i < oOdataRequest.requests.length; i++) {

                // Appending sap statistics to the url. If the URL contains '?' then &sap-statistics=true else ?sap-statistics=true
                if (oOdataRequest.requests[i].url.search("\\?") === -1) {
                    sUrlPath = oOdataRequest.requests[i].url + "?sap-statistics=true";
                } else {
                    sUrlPath = oOdataRequest.requests[i].url + "&sap-statistics=true";
                }
                // Check if selected drop is 'ALL'
                // if (sDropSelect === "ALL") {

                // Checking the group
                if (sGroupSelect === "ALL" || oOdataRequest.requests[i].group === sGroupSelect) {

                    aJsonRequestTable[iJsonCount] = [];
                    aJsonRequestTable[iJsonCount].path = sUrlPath;
                    aJsonRequestTable[iJsonCount].fullpath = sServiceUrl + sUrlPath;
                    aJsonRequestTable[iJsonCount].status = iStatus;
                    aJsonRequestTable[iJsonCount].gwtotal = 0;
                    aJsonRequestTable[iJsonCount].gwhub = 0;
                    aJsonRequestTable[iJsonCount].gwrfcoh = 0;
                    aJsonRequestTable[iJsonCount].gwbe = 0;
                    aJsonRequestTable[iJsonCount].gwapp = 0;
                    iJsonCount++;
                }
            }

            // Creating the JSON Object
            oController.oJsonRequestTable = {
                results : aJsonRequestTable
            };

            var iOdataRequestCount = aJsonRequestTable.length;

            oController.getView().byId("odataRequestToolTableTitle").setText(
                    com.zespri.awct.util.I18NHelper.getText("TXT_ODATAREQUESTCHECK_RESULT_TABLE_TITLE", [iOdataRequestCount]));

            // Setting the Model
            oController.getView().setModel(new sap.ui.model.json.JSONModel(oController.oJsonRequestTable), "OdataRequestResultTable");
            return aJsonRequestTable;
        },

        /**
         * Event handled for 'change' in the Select for drop select. This method will get the key of the filter and will set the model to the table
         * 
         * @memberOf com.zespri.awct.oDataCheck.view.ODataRequestCheck
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        // handleOdataRequestDropSelectChange : function(oEvent) {
        // var sDropSelected = oEvent.getParameters().selectedItem.getKey();
        // var sGroupSelected = this.getView().byId("odataRequestToolGroupSelect").getSelectedItem().getKey();
        //
        // // Getting the Table entries for the Selected drop and group with a status set as 'Not Started'(-1)
        // this.getSelectedTableEntries(sDropSelected, sGroupSelected, -1);
        // },
        /**
         * Event handle for 'change' in the Select for group select. This method will get the key of the filter and will set the model to the table
         * 
         * @memberOf com.zespri.awct.oDataCheck.view.ODataRequestCheck
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleOdataRequestGroupSelectChange : function(oEvent) {
            // var sDropSelected = this.getView().byId("odataRequestToolDropSelect").getSelectedItem().getKey();
            var sGroupSelected = oEvent.getParameters().selectedItem.getKey();

            // Getting the Table entries for the Selected drop and group with a status set as 'Not Started'(-1)
            // this.getSelectedTableEntries(sDropSelected, sGroupSelected, -1);
            this.getSelectedTableEntries(sGroupSelected, -1);
        },
        /**
         * Event handle for 'OK' Button press in the view settings dialog. This method will filter the table based on the filter option selected
         * 
         * @memberOf com.zespri.awct.oDataCheck.view.ODataRequestCheck
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleOdataRequestViewSettingDialogOKPress : function(oEvent) {
            // initializing the variables
            var iOdataRequestValue = -2;
            var aOdataRequestFilter = [];
            var mParams = oEvent.getParameters();

            // Filtering the items
            // Checking whether filter exist or not
            if (mParams.filterItems[0]) {

                // Filtering
                var sValue = mParams.filterItems[0].getKey();
                iOdataRequestValue = parseInt(sValue, 10);
                var oOdataRequestFilter = new sap.ui.model.Filter("status", sap.ui.model.FilterOperator.EQ, iOdataRequestValue);
                aOdataRequestFilter.push(oOdataRequestFilter);
            }

            // Getting the item binding of the table
            var oOdataRequestBinding = this.getView().byId("odataRequestToolTable").getBinding("items");

            // Applying the filter
            var oOdataRequestTableItems = oOdataRequestBinding.filter(aOdataRequestFilter);

            // Sorting items
            if (mParams.sortItem) {
                var sPath = mParams.sortItem.getKey();
                var bDescending = mParams.sortDescending;

                // Applying Sort
                oOdataRequestBinding.sort(new sap.ui.model.Sorter(sPath, bDescending));
            }

            // Getting the table entry count
            var iOdataRequestCount = oOdataRequestTableItems.getLength();

            this.getView().byId("odataRequestToolTableTitle").setText(
                    com.zespri.awct.util.I18NHelper.getText("TXT_ODATAREQUESTCHECK_RESULT_TABLE_TITLE", [iOdataRequestCount]));
        },
        /**
         * `Event triggered for 'press' event for the button 'check'. The method will get the Odata request from the ODataRequestCheck.json and check
         * whether the request is success or error
         * 
         * @memberOf com.zespri.awct.oDataCheck.view.ODataRequestCheck
         */
        handleOdataRequestToolCheckPress : function() {
            var oController = this;

            // Selected values for drop and group
            // var sDropSelected = oController.getView().byId("odataRequestToolDropSelect").getSelectedKey();
            var sGroupSelected = oController.getView().byId("odataRequestToolGroupSelect").getSelectedKey();

            // Enable the view settings dialog
            oController.getView().byId("odataRequestViewSettingDialogButton").setEnabled(true);

            // Getting the Table Entries with the status set to 'Pending' (0)
            // var aJsonRequestTable = oController.getSelectedTableEntries(sDropSelected, sGroupSelected, 0);
            var aJsonRequestTable = oController.getSelectedTableEntries(sGroupSelected, 0);

            // Ajax call to check whether the odata request is working or not. If Success then setting the status to 'OK' else status to 'Error'
            jQuery.each(aJsonRequestTable, function(index) {
                var sPath = "";

                if (aJsonRequestTable[index].fullpath.indexOf("?") > -1) {
                    sPath = aJsonRequestTable[index].fullpath + "&x-csrf-token=" + com.zespri.awct.util.CommonHelper.getCSRFToken();
                } else {
                    sPath = aJsonRequestTable[index].fullpath + "?x-csrf-token=" + com.zespri.awct.util.CommonHelper.getCSRFToken();
                }

                $.ajax({
                    url : sPath,
                    type : "GET",
                    success : function(result, status, xhr) {

                        var aStaticsReading = [];

                        // Getting the SAP statistics from the response header
                        var sStatisticsHeader = xhr.getResponseHeader("sapgw-statistics");

                        // Getting the data associated with the model 'OdataRequestResultTable'.
                        var oData = oController.getView().getModel("OdataRequestResultTable").getData();

                        // Setting the status code
                        oController.sSuccessStatusCode = xhr.status;
                        oController.sSuccessStatusText = xhr.statusText;

                        // The following steps are done only if the sap-statistics header exist.
                        if (sStatisticsHeader) {

                            // Parsing the header
                            var sStatisticsTemp = sStatisticsHeader.split("=");
                            for ( var i = 0; i < sStatisticsTemp.length; i++) {

                                var sStatistics = sStatisticsTemp[i].split(",");
                                for ( var j = 0; j < sStatistics.length; j++) {

                                    // If the value is a number then push it to an array
                                    if (sStatistics[j] !== "gwtotal" && sStatistics[j] !== "gwhub" && sStatistics[j] !== "gwrfcoh" &&
                                            sStatistics[j] !== "gwbe" && sStatistics[j] !== "gwapp") {
                                        aStaticsReading.push(sStatistics[j]);
                                    }
                                }

                            }

                            // Create the JSON with the sap-statistics value
                            oData.results[index].gwtotal = parseInt(aStaticsReading[0], 10);
                            oData.results[index].gwhub = parseInt(aStaticsReading[1], 10);
                            oData.results[index].gwrfcoh = parseInt(aStaticsReading[2], 10);
                            oData.results[index].gwbe = parseInt(aStaticsReading[3], 10);
                            oData.results[index].gwapp = parseInt(aStaticsReading[4], 10);
                        }

                        // Setting the status to 'Success' (1)
                        oData.results[index].status = 1;

                        // Setting the Changed Model
                        oController.getView().getModel("OdataRequestResultTable").setData(oData);

                    },
                    error : function(xhr) {

                        // Setting the Status code
                        oController.sErrorStatusCode = xhr.status;
                        oController.sErrorStatusText = xhr.statusText;
                        // Getting the data associated with the model 'OdataRequestResultTable'.
                        var oData = oController.getView().getModel("OdataRequestResultTable").getData();

                        // Setting the status to 'Error' (2)
                        oData.results[index].status = 2;

                        // Setting the changed model
                        oController.getView().getModel("OdataRequestResultTable").setData(oData);

                    }
                });

            });

        },
        /**
         * Event handle for 'press' event of the settings button. This method will open the view settings dialog
         * 
         * @memberOf com.zespri.awct.oDataCheck.view.ODataRequestCheck
         */
        handleOdataRequestViewSettingPress : function() {

            // Checking whether the instance of the view settings dialog exist or not. If not existing then create the dialog
            if (!this._oDialogViewSettings) {
                this._oDialogViewSettings = sap.ui.xmlfragment("com.zespri.awct.tools.odata.fragment.ViewSettingsDialog", this);
                this.getView().addDependent(this._oDialogViewSettings);
            }

            // Opening the dialog
            this._oDialogViewSettings.open();
        },

        /**
         * Formatter for 'text' property for 'status' column. This method will set the status text based on the values
         * 
         * 0 - Pending, 1 - OK, 2 - Error, -1 - Not Started
         * 
         * @memberOf com.zespri.awct.oDataCheck.view.ODataRequestCheck
         * 
         * @param {Integer}
         *            iStatus contains the status information
         */
        formatStatusCodeUpdate : function(iStatus) {

            var sStatus = "Not Started";
            if (iStatus === 1) {
                sStatus = this.sSuccessStatusCode;
            } else if (iStatus === 2) {
                sStatus = this.sErrorStatusCode;
            } else if (iStatus === 0) {
                sStatus = "Pending";
            }
            return sStatus;
        },
        /**
         * Formatter for 'text' property for 'status' column. This method will set the status text based on the values
         * 
         * 0 - Pending, 1 - OK, 2 - Error, -1 - Not Started
         * 
         * @memberOf com.zespri.awct.oDataCheck.view.ODataRequestCheck
         * 
         * @param {Integer}
         *            iStatus contains the status information
         */
        formatStatusTextUpdate : function(iStatus) {
            var sStatus = "";
            if (iStatus === 1) {
                sStatus = this.sSuccessStatusText;
            } else if (iStatus === 2) {
                sStatus = this.sErrorStatusText;
            }
            return sStatus;
        },
        /**
         * Formatter for 'visible' property for 'status' column. This method will set the visibility of the model
         * 
         * 0 - Pending, 1 - OK, 2 - Error, -1 - Not Started
         * 
         * @memberOf com.zespri.awct.oDataCheck.view.ODataRequestCheck
         * 
         * @param {Integer}
         *            iStatus contains the status information
         */
        formatImageVisiblity : function(iStatus) {

            var bLoadingImageVisible = false;
            if (iStatus === 0) {
                bLoadingImageVisible = true;
            }
            return bLoadingImageVisible;
        },
        /**
         * Formatter for 'state' property for 'status' column. This method will set the status state based on the values
         * 
         * 0 - Pending, 1 - OK, 2 - Error, -1 - Not Started
         * 
         * @memberOf com.zespri.awct.oDataCheck.view.ODataRequestCheck
         * 
         * @param {Integer}
         *            iStatus contains the status information
         */
        formatStatusUpdateState : function(iStatus) {
            var sStatus = "None";
            if (iStatus === 1) {
                sStatus = "Success";
            } else if (iStatus === 2) {
                sStatus = "Error";
            }
            return sStatus;
        }
    });

})();