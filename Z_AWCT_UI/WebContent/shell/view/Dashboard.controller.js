(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });

    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");

    /**
     * @classdesc This Dashboard view controller will be used to create tiles based on the user's role permissions and each time user navigates to this view ,
     * tile will be refreshed . It also handles the navigation to the corresponding views with customData(filters) .
     * 
     * @class
     * @name com.zespri.awct.shell.view.Dashboard
     */
    com.zespri.awct.core.Controller.extend("com.zespri.awct.shell.view.Dashboard",
    /** @lends com.zespri.awct.shell.view.Dashboard */
    {
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it
         * is displayed, to bind event handlers and do other one-time initialization.
         * 
         * @memberOf com.zespri.awct.shell.view.Dashboard
         */
        onInit : function() {
            /* START of instance member initialization */
            // Array to give the Ordering of tiles in TileContainer
            this._aTilesOrder = ["charterShortage", "charterSurplus", "containerShortage", "containerSurplus", "lockedDeliveries", "supplyGTDemand",
                    "inBoundTradeOpportunities", "openTradeOpportunities", "fullfillOrder", "shipmentConfirmationDueTodayCharter",
                    "shipmentConfirmationDueTodayContainer", "shipmentConfirmationDueTomorrowCharter", "shipmentConfirmationDueTomorrowContainer"];
            // Array to store inactive tiles (count = 0)
            this._aInactiveTiles = [];
            // Enum for shipmentType
            this._CharterOrContainer = {
                Charter : "01",
                Container : "02"
            };
            // Array for storing Shipment Confirmation dues which has due date today
            this._aShipmentsDueToday = [];
            // Array for storing Shipment Confirmation dues which has due date tomorrow
            this._aShipmentsDueTomorrow = [];
            // Busy dialog
            this._oBusyDialog = new sap.m.BusyDialog();
            /* END of instance member initialization */

            var oController = this;
            // Open the busy dialog when Dashboard is loaded for the first time
            this._oBusyDialog.open();

            // Check the incoming route .
            this.getRouter().attachRoutePatternMatched(function(oEvent) {
                if (oEvent.getParameter("name") === "/") {
                    // Set the JSON Data to TileContainer
                    oController._resetTileContainerModel();
                }
            });
        },

        /**
         * This method sets the data to the tile container. Based on the tile scenario , JSON object will be created and set it to the tile container.
         * 
         * @private
         * @memberOf com.zespri.awct.shell.view.Dashboard
         */
        _resetTileContainerModel : function() {

            var oController = this;
            var oTileData = {};
            var oModel = this.getView().getModel();

            // BATCH READ
            var fnBatchReadError = function(oError) {
                // Error handler for batch read
                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                oController._oBusyDialog.close();
            };
            var fnBatchReadSuccess = function(oData, oResponse, aErrorResponses) {
                // Success Handler
                var aTileResults = [];

                // Display errors if any
                com.zespri.awct.util.NotificationHelper.handleErrorMessage(aErrorResponses);

                /* "GetTilesCount" Function import call handler */
                if (oData.__batchResponses[0].data) {
                    aTileResults = oData.__batchResponses[0].data.results;
                }

                // Loop through the oData results and form the local JSON based on TileScenario's
                for ( var i = 0; i < aTileResults.length; i++) {
                    // Tile Count
                    var iCount = com.zespri.awct.util.LocaleFormatHelper.formatQuantity(aTileResults[i].Count);
                    // Pallet Quantity
                    var iPalletQuantity = com.zespri.awct.util.LocaleFormatHelper.formatQuantity(aTileResults[i].PalletQuantity);

                    // Tile Scenario's
                    switch (aTileResults[i].TileScenario) {
                        case "01" :
                            // Charter Shortage
                            oTileData.charterShortage = {
                                sId : "charterShortageTile",
                                number : iCount,
                                numberUnit : "",
                                icon : "sap-icon://sys-minus",
                                title : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_CHARTER_SHORTAGE"),
                                infoState : "None",
                                info : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_PALLET_COUNT_TEXT", [iPalletQuantity])
                            };
                            break;
                        case "02" :
                            // Charter Surplus
                            oTileData.charterSurplus = {
                                sId : "charterSurplusTile",
                                number : iCount,
                                numberUnit : "",
                                icon : "sap-icon://sys-add",
                                title : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_CHARTER_SURPLUS"),
                                infoState : "None",
                                info : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_PALLET_COUNT_TEXT", [iPalletQuantity])
                            };
                            break;
                        case "03" :
                            // Container Shortage
                            oTileData.containerShortage = {
                                sId : "containerShortageTile",
                                number : iCount,
                                numberUnit : "",
                                icon : "sap-icon://sys-minus",
                                title : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_CONTAINER_SHORTAGE"),
                                infoState : "None",
                                info : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_PALLET_COUNT_TEXT", [iPalletQuantity])
                            };
                            break;
                        case "04" :
                            // Container Surplus
                            oTileData.containerSurplus = {
                                sId : "containerSurplusTile",
                                number : iCount,
                                numberUnit : "",
                                icon : "sap-icon://sys-add",
                                title : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_CONTAINER_SURPLUS"),
                                infoState : "None",
                                info : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_PALLET_COUNT_TEXT", [iPalletQuantity])
                            };
                            break;
                        case "05" :
                            // Locked Deliveries
                            oTileData.lockedDeliveries = {
                                sId : "lockedDeliveriesTile",
                                number : iCount,
                                numberUnit : "",
                                icon : "sap-icon://locked",
                                title : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_LOCKED_DELIVERIES"),
                                infoState : "None",
                                info : ""
                            };
                            break;
                        case "06" :
                            // Supply > Demand
                            oTileData.supplyGTDemand = {
                                sId : "supplyGTDemandTile",
                                number : iCount,
                                numberUnit : "",
                                icon : "sap-icon://positive",
                                title : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_SUPPLY_GT_DEMAND"),
                                infoState : "None",
                                info : ""
                            };
                            break;
                        case "07" :
                            // inbound Trade Opportunities
                            oTileData.inBoundTradeOpportunities = {
                                sId : "inBoundTradeOpportunitiesTile",
                                number : iCount,
                                numberUnit : "",
                                icon : "sap-icon://arrow-bottom",
                                title : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_INBOUND_TRADE_OPPORTUNITIES"),
                                infoState : "None",
                                info : ""
                            };
                            break;
                        case "09" :
                            // Full Fill Order
                            oTileData.fullfillOrder = {
                                sId : "fullfillOrderTile",
                                number : iCount,
                                numberUnit : "",
                                icon : "sap-icon://activity-2",
                                title : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_FULFILL_ORDER"),
                                infoState : "None",
                                info : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_PALLET_COUNT_TEXT", [iPalletQuantity])
                            };
                            break;
                        case "11" :
                            // Open Trade opportunities
                            oTileData.openTradeOpportunities = {
                                sId : "openTradeOpportunitiesTile",
                                number : iCount,
                                numberUnit : "",
                                icon : "sap-icon://display-more",
                                title : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_OPEN_TRADE_OPPORTUNITIES"),
                                infoState : "None",
                                info : ""
                            };
                            break;

                    }
                }
                /* End of "GetTilesCount" Function import call handler */

                /* Start of "GetShipmentConfirmationDue" function import handler : Shipment Confirmation Due Tiles */
                if (oData.__batchResponses[1]) {
                    // Clear the array of shipmentConfirmation Dues
                    oController._aShipmentsDueTodayCharter = [];
                    oController._aShipmentsDueTomorrowCharter = [];

                    oController._aShipmentsDueTodayContainer = [];
                    oController._aShipmentsDueTomorrowContainer = [];

                    var aShipmentDueResults = [];

                    if (oData.__batchResponses[1].data) {
                        aShipmentDueResults = oData.__batchResponses[1].data.results;
                    }

                    for ( var j = 0; j < aShipmentDueResults.length; j++) {
                        // Shipment Confirmation due today and type = "Charter"
                        if (aShipmentDueResults[j].DueTodayFlag &&
                                aShipmentDueResults[j].CharterOrContainer === oController._CharterOrContainer.Charter) {
                            oController._aShipmentsDueTodayCharter.push(aShipmentDueResults[j].ShipmentID);
                        }
                        // Shipment Confirmation due tomorrow and type = "Charter"
                        if (aShipmentDueResults[j].DueTomorrowFlag &&
                                aShipmentDueResults[j].CharterOrContainer === oController._CharterOrContainer.Charter) {
                            oController._aShipmentsDueTomorrowCharter.push(aShipmentDueResults[j].ShipmentID);
                        }

                        // Shipment Confirmation due today and type = "Container"
                        if (aShipmentDueResults[j].DueTodayFlag &&
                                aShipmentDueResults[j].CharterOrContainer === oController._CharterOrContainer.Container) {
                            oController._aShipmentsDueTodayContainer.push(aShipmentDueResults[j].ShipmentID);
                        }

                        // Shipment Confirmation due tomorrow and type = "Container"
                        if (aShipmentDueResults[j].DueTomorrowFlag &&
                                aShipmentDueResults[j].CharterOrContainer === oController._CharterOrContainer.Container) {
                            oController._aShipmentsDueTomorrowContainer.push(aShipmentDueResults[j].ShipmentID);
                        }
                    }

                    // Add Shipment Confirmation due tiles to the oTileData object
                    // Shipment Confirmation Due Today Charter Tile
                    var iShipmentDueTodayCharterCount = com.zespri.awct.util.LocaleFormatHelper
                            .formatQuantity(oController._aShipmentsDueTodayCharter.length);

                    oTileData.shipmentConfirmationDueTodayCharter = {
                        sId : "shipmentConfirmationDueTodayCharterTile",
                        number : iShipmentDueTodayCharterCount,
                        numberUnit : "",
                        icon : "sap-icon://flag",
                        title : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_SHIPMENT_CONFIRMATIONS_DUE_CHARTER"),
                        infoState : "Warning",
                        info : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_SHIPMENT_CONFIRMATIONS_DUE_TODAY")
                    };

                    // Shipment Confirmation Due Tomorrow Charter Tile
                    var iShipmentDueTomorrowCharterCount = com.zespri.awct.util.LocaleFormatHelper
                            .formatQuantity(oController._aShipmentsDueTomorrowCharter.length);

                    oTileData.shipmentConfirmationDueTomorrowCharter = {
                        sId : "shipmentConfirmationDueTomorrowCharterTile",
                        number : iShipmentDueTomorrowCharterCount,
                        numberUnit : "",
                        icon : "sap-icon://flag",
                        title : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_SHIPMENT_CONFIRMATIONS_DUE_CHARTER"),
                        infoState : "None",
                        info : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_SHIPMENT_CONFIRMATIONS_DUE_TOMORROW")
                    };

                    // Shipment Confirmation Due Today Container Tile
                    var iShipmentDueTodayContainerCount = com.zespri.awct.util.LocaleFormatHelper
                            .formatQuantity(oController._aShipmentsDueTodayContainer.length);

                    oTileData.shipmentConfirmationDueTodayContainer = {
                        sId : "shipmentConfirmationDueTodayContainerTile",
                        number : iShipmentDueTodayContainerCount,
                        numberUnit : "",
                        icon : "sap-icon://flag",
                        title : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_SHIPMENT_CONFIRMATIONS_DUE_CONTAINER"),
                        infoState : "Warning",
                        info : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_SHIPMENT_CONFIRMATIONS_DUE_TODAY")
                    };

                    // Shipment Confirmation Due Tomorrow Container Tile
                    var iShipmentDueTomorrowContainerCount = com.zespri.awct.util.LocaleFormatHelper
                            .formatQuantity(oController._aShipmentsDueTomorrowContainer.length);

                    oTileData.shipmentConfirmationDueTomorrowContainer = {
                        sId : "shipmentConfirmationDueTomorrowContainerTile",
                        number : iShipmentDueTomorrowContainerCount,
                        numberUnit : "",
                        icon : "sap-icon://flag",
                        title : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_SHIPMENT_CONFIRMATIONS_DUE_CONTAINER"),
                        infoState : "None",
                        info : com.zespri.awct.util.I18NHelper.getText("TXT_DASHBOARD_TILE_TITLE_SHIPMENT_CONFIRMATIONS_DUE_TOMORROW")
                    };
                }

                /* End of Shipment Confirmation Due Tiles */

                // Form Inactive Tiles array
                // this._aInactiveTiles
                $.each(oTileData, function(i, oTile) {
                    if (!parseInt(oTile.number, 10)) {
                        var sTileObjectName = oTile.sId.replace("Tile", '');
                        oTileData[sTileObjectName].type = sap.m.StandardTileType.Monitor;
                        oController._aInactiveTiles.push(sTileObjectName);
                    }
                });

                // Once both function import calls are done, remove busy state and add / refresh the tiles
                // Create the JSON Model and set it to the TileContainer
                var oTileContainer = oController.byId("tileContainer");
                var oJSONModel = new sap.ui.model.json.JSONModel();
                oJSONModel.setData(oTileData);
                oTileContainer.setModel(oJSONModel);
                // Add tiles to the TileContainer
                oController._addTilesToContainer();

                // Close Busy Dialog
                oController._oBusyDialog.close();
            };

            // "GetTilesCount" function import call
            var oBatchOperationForGetTiles = oModel.createBatchOperation("GetTilesCount", "GET");
            var aBatchRequest = [oBatchOperationForGetTiles];

            // If the user is SUPPLIER , then add btach request for "GetShipmentConfirmDue"
            if (com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration, com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP)) {
                // "GetShipmentConfirmDue" function import call
                var oBatchOperationForGetShipmentDue = oModel.createBatchOperation("GetShipmentConfirmDue", "GET");
                aBatchRequest.push(oBatchOperationForGetShipmentDue);
            }

            oModel.addBatchReadOperations(aBatchRequest);
            oModel.submitBatch(fnBatchReadSuccess, fnBatchReadError);
            // END OF BATCH READ
        },
        /**
         * This method will create Tiles based on the User role and add it to the tile container
         * 
         * @private
         * @memberOf com.zespri.awct.shell.view.Dashboard
         */
        _addTilesToContainer : function() {
            var oController = this;
            // Make the tiles created flag to "true"
            this._bTileCreated = true;

            // Get the local copy of tiles order array
            var aTilesOrder = this._aTilesOrder.slice();

            // Remove the inactive tiles from order array
            for ( var j = 0; j < this._aInactiveTiles.length; j++) {
                var iIndex = aTilesOrder.indexOf(this._aInactiveTiles[j]);
                if (iIndex > -1) {
                    aTilesOrder.splice(iIndex, 1);
                }
            }

            // Push the inactive tiles to the end of tiles order array
            aTilesOrder = aTilesOrder.concat(this._aInactiveTiles);
            this._aInactiveTiles = [];

            // Get the JSON MODEL
            var oJSONModelData = this.byId("tileContainer").getModel().getData();
            var oTileContainer = this.byId("tileContainer");

            // Destroy the existing tiles
            oTileContainer.destroyTiles();

            // Loop through the tiles order array and add it to the tile container based on user's role
            $.each(aTilesOrder, function(i, sCurrentTileName) {
                var oCurrentTileData = oJSONModelData[sCurrentTileName];
                if (!oJSONModelData[sCurrentTileName]) {
                    return;
                }

                // Add the tile to TILE CONTAINER
                var sTileId = oCurrentTileData.sId;
                var sType = oCurrentTileData.type;
                if (!sType) {
                    sType = sap.m.StandardTileType.None;
                }
                // Create the tile
                var oTile = new sap.m.StandardTile(sTileId, {
                    title : oCurrentTileData.title,
                    number : oCurrentTileData.number,
                    numberUnit : oCurrentTileData.numberUnit,
                    icon : oCurrentTileData.icon,
                    infoState : oCurrentTileData.infoState,
                    info : oCurrentTileData.info,
                    type : sType,
                    press : function(oEvent) {
                        oController.handleTilePress(oEvent);
                    }
                });

                // Add tile to TileContainer
                oTileContainer.addTile(oTile);
            });
        },
        /**
         * Event handler called on press of tile container. Navigates to relevant module screen on click of tile
         * 
         * @param oEvent
         *            {object} event object which contains details of pressed tile
         * @memberOf com.zespri.awct.shell.view.Dashboard
         */
        handleTilePress : function(oEvent) {
            var oController = this;
            var sId = oEvent.getParameter('id');
            var iTileCount = parseInt(oEvent.getSource().getProperty('number'), 10);

            // Charter Shortage
            if (sId === 'charterShortageTile') {

                this.getRouter().navTo("Collaboration/SupplierOrders", {
                    customData : {
                        filters : {
                            Shortage : 0,
                            CharterOrContainer : oController._CharterOrContainer.Charter
                        }
                    }
                });

            }
            // Charter Surplus
            else if (sId === 'charterSurplusTile') {
                this.getRouter().navTo("Collaboration/SupplierOrders", {
                    customData : {
                        filters : {
                            Surplus : 0,
                            CharterOrContainer : oController._CharterOrContainer.Charter
                        }
                    }
                });

            }
            // Container Shortage
            else if (sId === 'containerShortageTile') {
                this.getRouter().navTo("Collaboration/SupplierOrders", {
                    customData : {
                        filters : {
                            Shortage : 0,
                            CharterOrContainer : oController._CharterOrContainer.Container
                        }
                    }
                });

            }
            // Container Surplus
            else if (sId === 'containerSurplusTile') {
                this.getRouter().navTo("Collaboration/SupplierOrders", {
                    customData : {
                        filters : {
                            Surplus : 0,
                            CharterOrContainer : oController._CharterOrContainer.Container
                        }
                    }
                });

            }
            // Locked Deliveries
            else if (sId === 'lockedDeliveriesTile') {
                this.getRouter().navTo("Allocation/DeliveryWorkList", {
                    customData : {
                        filters : {
                            Status : [com.zespri.awct.util.Enums.DeliveryStatus.Locked]
                        }
                    }
                });

            }
            // Supply > Demand
            else if (sId === 'supplyGTDemandTile') {
                this.getRouter().navTo("Allocation/DeliveryWorkList", {
                    customData : {
                        filters : {
                            Status : [com.zespri.awct.util.Enums.DeliveryStatus.Released, com.zespri.awct.util.Enums.DeliveryStatus.Locked],
                            IsSupplyGtDemandFlag : true
                        }
                    }
                });

            }
            // open Trade Opportunities
            else if (sId === 'openTradeOpportunitiesTile') {
                this.getRouter().navTo("Collaboration/TradeOpportunities", {
                    customData : {
                        filters : {
                            Status : com.zespri.awct.util.Enums.TradeStatus.Initiated,
                            Type : com.zespri.awct.util.Enums.TradeType.Open
                        }
                    }
                });

            }
            // Shipment Confirmation Due Today Charter
            else if (sId === 'shipmentConfirmationDueTodayCharterTile') {

                // If the tile count is zero , show toast and do not navigate
                if (iTileCount <= 0) {
                    var sNoDueTodayCharterText = com.zespri.awct.util.I18NHelper
                            .getText("TXT_DASHBOARD_TILE_SHIPMENT_CONFIRMATIONS_DUE_TODAY_INACTIVE_TOAST");
                    com.zespri.awct.util.NotificationHelper.showErrorToast(sNoDueTodayCharterText);
                    return;
                }

                this.getRouter().navTo("Collaboration/SupplierOrders", {
                    customData : {
                        filters : {
                            CharterOrContainer : oController._CharterOrContainer.Charter,
                            ShipmentID : oController._aShipmentsDueTodayCharter
                        }
                    }
                });

            }
            // Shipment Confirmation Due Tomorrow Charter
            else if (sId === 'shipmentConfirmationDueTomorrowCharterTile') {

                // If the tile count is zero , show toast and do not navigate
                if (iTileCount <= 0) {
                    var sNoDueTomorrowCharterText = com.zespri.awct.util.I18NHelper
                            .getText("TXT_DASHBOARD_TILE_SHIPMENT_CONFIRMATIONS_DUE_TOMORROW_INACTIVE_TOAST");
                    com.zespri.awct.util.NotificationHelper.showErrorToast(sNoDueTomorrowCharterText);
                    return;
                }

                this.getRouter().navTo("Collaboration/SupplierOrders", {
                    customData : {
                        filters : {
                            CharterOrContainer : oController._CharterOrContainer.Charter,
                            ShipmentID : oController._aShipmentsDueTomorrowCharter
                        }
                    }
                });

            }
            // Shipment Confirmation Due Today Container
            else if (sId === 'shipmentConfirmationDueTodayContainerTile') {

                // If the tile count is zero , show toast and do not navigate
                if (iTileCount <= 0) {
                    var sNoDueTodayContainerText = com.zespri.awct.util.I18NHelper
                            .getText("TXT_DASHBOARD_TILE_SHIPMENT_CONFIRMATIONS_DUE_TODAY_INACTIVE_TOAST");
                    com.zespri.awct.util.NotificationHelper.showErrorToast(sNoDueTodayContainerText);
                    return;
                }

                this.getRouter().navTo("Collaboration/SupplierOrders", {
                    customData : {
                        filters : {
                            CharterOrContainer : oController._CharterOrContainer.Container,
                            ShipmentID : oController._aShipmentsDueTodayContainer
                        }
                    }
                });

            }
            // Shipment Confirmation Due Tomorrow Container
            else if (sId === 'shipmentConfirmationDueTomorrowContainerTile') {

                // If the tile count is zero , show toast and do not navigate
                if (iTileCount <= 0) {
                    var sNoDueTomorrowContainerText = com.zespri.awct.util.I18NHelper
                            .getText("TXT_DASHBOARD_TILE_SHIPMENT_CONFIRMATIONS_DUE_TOMORROW_INACTIVE_TOAST");
                    com.zespri.awct.util.NotificationHelper.showErrorToast(sNoDueTomorrowContainerText);
                    return;
                }

                this.getRouter().navTo("Collaboration/SupplierOrders", {
                    customData : {
                        filters : {
                            CharterOrContainer : oController._CharterOrContainer.Container,
                            ShipmentID : oController._aShipmentsDueTomorrowContainer
                        }
                    }
                });

            }
            // Full Fill Order
            else if (sId === 'fullfillOrderTile') {
                this.getRouter().navTo("Collaboration/SupplierOrders", {
                    customData : {
                        filters : {
                            RecordType : com.zespri.awct.util.Enums.AllocationLineRecordType.SupplierOrderLine
                        }
                    }
                });

            }
            // In Bound Trade Opportunities
            else if (sId === 'inBoundTradeOpportunitiesTile') {
                this.getRouter().navTo("Collaboration/TradeOpportunities", {
                    customData : {
                        filters : {
                            Status : com.zespri.awct.util.Enums.TradeStatus.Initiated,
                            Type : com.zespri.awct.util.Enums.TradeType.Inbound
                        }
                    }
                });
            }
        }
    });
})();