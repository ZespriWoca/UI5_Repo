/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	!function(){"use strict";jQuery.sap.require({modName:"com.zespri.awct.core.Controller",type:"controller"}),jQuery.sap.require("com.zespri.awct.util.CommonFormatHelper"),jQuery.sap.require("com.zespri.awct.util.Enums"),jQuery.sap.require("com.zespri.awct.util.I18NHelper"),jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper"),jQuery.sap.require("com.zespri.awct.util.ModelHelper"),jQuery.sap.require("com.zespri.awct.util.NotificationHelper"),com.zespri.awct.core.Controller.extend("com.zespri.awct.collab.view.TradeOpportunitiesDetails",{_ApproveStatus:{Accept:"A",Reject:"R"},onInit:function(){this._oTradeOpportuityContext=null,this._oOpenTradeAcceptDialog=null,this._sContextPath=null,this._bUserAuthorized=!1;var a=this,b=this.getView();this.getRouter().attachRoutePatternMatched(function(d){if("Collaboration/TradeOpportunitiesDetails"===d.getParameter("name"))if(this._bUserAuthorized){a._sContextPath=d.getParameter("arguments").contextPath;var e=sap.ui.getCore().getRootComponent().getModel();b.setModel(e),a._oTradeOpportuityContext=new sap.ui.model.Context(b.getModel(),"/"+a._sContextPath);var f=a.byId("batchCharacteristicsTable");com.zespri.awct.util.CommonHelper.manageNoDataText(f);var g=com.zespri.awct.util.I18NHelper.getText("TXT_LIST_LOADING_LABEL");a.byId("deliveryHeaderText").setText(g),a.byId("deliveryHeaderText").setBusy(!0),a.byId("deliveryHeaderText").setBusyIndicatorDelay(0),a.byId("pageTradeOpportunitiesDetails").getFooter().setBusy(!0);var h=a._oTradeOpportuityContext.getProperty("TradeID");if(h)c();else{var i=function(b){a._oTradeOpportuityContext=new sap.ui.model.Context(b,"/result"),c()},j=function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a)};com.zespri.awct.util.ModelHelper.getJSONModelForRead(a._sContextPath,{},i,j)}}else com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper.getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"))},this);var c=function(){a._updateFooterButtonsVisibility(),a.byId("pageTradeOpportunitiesDetails").getFooter().setBusy(!1);var b=a._oTradeOpportuityContext.getModel();a.getView().setModel(b).setBindingContext(a._oTradeOpportuityContext);var c=a._oTradeOpportuityContext.getProperty("Status");c===com.zespri.awct.util.Enums.TradeStatus.Initiated?(a.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_INITIATED")),a.byId("statusObject").setState(sap.ui.core.ValueState.None)):c===com.zespri.awct.util.Enums.TradeStatus.Accepted?(a.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_ACCEPTED")),a.byId("statusObject").setState(sap.ui.core.ValueState.Success)):c===com.zespri.awct.util.Enums.TradeStatus.Rejected?(a.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_REJECTED")),a.byId("statusObject").setState(sap.ui.core.ValueState.Error)):c===com.zespri.awct.util.Enums.TradeStatus.Expired?(a.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_EXPIRED")),a.byId("statusObject").setState(sap.ui.core.ValueState.Warning)):c===com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted?(a.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_PARTIALLY_ACCEPTED")),a.byId("statusObject").setState(sap.ui.core.ValueState.None)):c===com.zespri.awct.util.Enums.TradeStatus.Cancelled&&(a.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_CANCELLED")),a.byId("statusObject").setState(sap.ui.core.ValueState.Error));var d=a._oTradeOpportuityContext.getProperty("DeliveryID"),e=sap.ui.getCore().getRootComponent().getModel(),f=function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a)},g=function(b,c,d){var e=b.__batchResponses[0].data,f=new sap.ui.model.json.JSONModel;f.setData(e);var g=a.byId("batchCharacteristicsTable");g.setModel(f),g.bindItems({path:"/results",template:g.getBindingInfo("items")?g.getBindingInfo("items").template:g.getItems()[0].clone()}),g.setBusy(!1);var h="";b.__batchResponses[1].data&&(h=b.__batchResponses[1].data.TextString),h?a.byId("deliveryHeaderText").setText(h).removeStyleClass("zAwctTextGrayItalics"):a.byId("deliveryHeaderText").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_DETAILS_DELIVERY_HEADER_TEXT_NOT_AVAILABLE")).addStyleClass("zAwctTextGrayItalics"),a.byId("deliveryHeaderText").setBusy(!1),com.zespri.awct.util.NotificationHelper.handleErrorMessage(d)},h=e.createBatchOperation("BatchCharacteristicsSet?%24filter=DeliveryLineID%20eq%20%27"+a._oTradeOpportuityContext.getProperty("DeliveryLineID")+"%27&%24expand=BatchCharacteristicsValueSet","GET"),i=e.createBatchOperation("DeliveryHeaderSet('"+d+"')/Text","GET"),j=[h,i];e.addBatchReadOperations(j),e.submitBatch(g,f)}},onBeforeRendering:function(){com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP)?this._bUserAuthorized=!0:(this.byId("pageTradeOpportunitiesDetails")&&this.byId("pageTradeOpportunitiesDetails").destroy(),this._bUserAuthorized=!1)},_setViewBusy:function(a){this.getView().setBusy(a),this.byId("pageTradeOpportunitiesDetails").getFooter().setBusy(a)},handleAcceptPress:function(){var a=this,b=this._oTradeOpportuityContext.getProperty("TradeID");this._oTradeOpportuityContext.getProperty("Type")===com.zespri.awct.util.Enums.TradeType.Inbound?(this._setViewBusy(!0),sap.ui.getCore().getRootComponent().getModel().read("/ApproveTrade",{urlParameters:{TradeUpdateTime:com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(this._oTradeOpportuityContext.getProperty("TradeUpdateTime")),TargetSupplier:"''",Status:"'"+this._ApproveStatus.Accept+"'",TradeID:"'"+b+"'",AcceptedQuantity:0},success:function(){var b=com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITY_ACCEPT_DELIVERY_SUCCESS");com.zespri.awct.util.NotificationHelper.showSuccessToast(b),com.zespri.awct.util.ModelHelper.getJSONModelForRead(a._sContextPath,{urlParameters:{$select:"Status"}},function(b){var c=b.getProperty("/result").Status;c===com.zespri.awct.util.Enums.TradeStatus.Initiated?(a.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_INITIATED")),a.byId("statusObject").setState(sap.ui.core.ValueState.None)):c===com.zespri.awct.util.Enums.TradeStatus.Accepted?(a.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_ACCEPTED")),a.byId("statusObject").setState(sap.ui.core.ValueState.Success)):c===com.zespri.awct.util.Enums.TradeStatus.Rejected?(a.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_REJECTED")),a.byId("statusObject").setState(sap.ui.core.ValueState.Error)):c===com.zespri.awct.util.Enums.TradeStatus.Expired?(a.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_EXPIRED")),a.byId("statusObject").setState(sap.ui.core.ValueState.Warning)):c===com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted?(a.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_PARTIALLY_ACCEPTED")),a.byId("statusObject").setState(sap.ui.core.ValueState.None)):c===com.zespri.awct.util.Enums.TradeStatus.Cancelled&&(a.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_CANCELLED")),a.byId("statusObject").setState(sap.ui.core.ValueState.Error)),a._setViewBusy(!1),a._oTradeOpportuityContext.getObject().Status=c,a._updateFooterButtonsVisibility()},function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a)})},error:function(b){a._setViewBusy(!1),com.zespri.awct.util.NotificationHelper.handleErrorMessage(b)}})):(this._oOpenTradeAcceptDialog||(this._oOpenTradeAcceptDialog=new sap.ui.xmlfragment("openTradeAcceptDialog","com.zespri.awct.collab.fragment.TradeOpportunitiesOpenTradeAcceptDialog",this),this.getView().addDependent(this._oOpenTradeAcceptDialog)),this._oOpenTradeAcceptDialog.setModel(this.getView().getModel()),sap.ui.core.Fragment.byId("openTradeAcceptDialog","tradeQuantityInput").setValue(""),sap.ui.core.Fragment.byId("openTradeAcceptDialog","tradeQuantityInput").setValueState(sap.ui.core.ValueState.None),this._oOpenTradeAcceptDialog.open(),this._oOpenTradeAcceptDialog.setBusy(!0),com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GetSuppliersForOpenTrade",{urlParameters:{TradeID:"'"+a.getView().getBindingContext().getProperty("TradeID")+"'"}},function(b){var c=sap.ui.core.Fragment.byId("openTradeAcceptDialog","tradeSupplierSelect");c.setModel(b),c.bindItems({path:"/results",template:c.getBindingInfo("items")?c.getBindingInfo("items").template:c.getItems()[0].clone()}),a._oOpenTradeAcceptDialog.setBusy(!1)},function(b){a._oOpenTradeAcceptDialog.setBusy(!1),a._oOpenTradeAcceptDialog.close(),com.zespri.awct.util.NotificationHelper.handleErrorMessage(b)}))},handleRejectPress:function(){var a=this,b=this._oTradeOpportuityContext.getProperty("TradeID");this._setViewBusy(!0),sap.ui.getCore().getRootComponent().getModel().read("/ApproveTrade",{urlParameters:{TradeUpdateTime:com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(this._oTradeOpportuityContext.getProperty("TradeUpdateTime")),TargetSupplier:"''",Status:"'"+this._ApproveStatus.Reject+"'",TradeID:"'"+b+"'",AcceptedQuantity:0},success:function(){var b=com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITY_REJECT_DELIVERY_SUCCESS");com.zespri.awct.util.NotificationHelper.showSuccessToast(b),com.zespri.awct.util.ModelHelper.getJSONModelForRead(a._sContextPath,{urlParameters:{$select:"Status"}},jQuery.proxy(a._updateTradeStatus,a),function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a)})},error:function(b){a._setViewBusy(!1),com.zespri.awct.util.NotificationHelper.handleErrorMessage(b)}})},_updateTradeStatus:function(a){var b=a.getProperty("/result").Status;b===com.zespri.awct.util.Enums.TradeStatus.Initiated?(this.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_INITIATED")),this.byId("statusObject").setState(sap.ui.core.ValueState.None)):b===com.zespri.awct.util.Enums.TradeStatus.Accepted?(this.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_ACCEPTED")),this.byId("statusObject").setState(sap.ui.core.ValueState.Success)):b===com.zespri.awct.util.Enums.TradeStatus.Rejected?(this.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_REJECTED")),this.byId("statusObject").setState(sap.ui.core.ValueState.Error)):b===com.zespri.awct.util.Enums.TradeStatus.Expired?(this.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_EXPIRED")),this.byId("statusObject").setState(sap.ui.core.ValueState.Warning)):b===com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted?(this.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_PARTIALLY_ACCEPTED")),this.byId("statusObject").setState(sap.ui.core.ValueState.None)):b===com.zespri.awct.util.Enums.TradeStatus.Cancelled&&(this.byId("statusObject").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_CANCELLED")),this.byId("statusObject").setState(sap.ui.core.ValueState.Error)),this._setViewBusy(!1),this._oTradeOpportuityContext.getObject().Status=b,this._updateFooterButtonsVisibility()},handleAcceptContinuePress:function(){var a=this,b=this._oTradeOpportuityContext.getProperty("TradeID"),c=sap.ui.core.Fragment.byId("openTradeAcceptDialog","tradeSupplierSelect").getSelectedKey(),d=sap.ui.core.Fragment.byId("openTradeAcceptDialog","tradeQuantityInput").getValue();isNaN(d)||Math.round(d)!==parseFloat(d)||parseInt(d,10)<=0||parseInt(d,10)>parseInt(this._oTradeOpportuityContext.getProperty("PendingQuantity"),10)?(sap.ui.core.Fragment.byId("openTradeAcceptDialog","tradeQuantityInput").setValueState(sap.ui.core.ValueState.Error),sap.ui.core.Fragment.byId("openTradeAcceptDialog","tradeQuantityInput").setValueStateText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITY_ACCEPTDIALOG_QUANTITY_ERROR_VALUESTATETEXT"))):(sap.ui.core.Fragment.byId("openTradeAcceptDialog","tradeQuantityInput").setValueState(sap.ui.core.ValueState.None),this._oOpenTradeAcceptDialog.setBusy(!0),this._setViewBusy(!0),sap.ui.getCore().getRootComponent().getModel().read("/ApproveTrade",{urlParameters:{TradeUpdateTime:com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(this._oTradeOpportuityContext.getProperty("TradeUpdateTime")),TargetSupplier:"'"+c+"'",Status:"'"+this._ApproveStatus.Accept+"'",TradeID:"'"+b+"'",AcceptedQuantity:parseInt(d,10)},success:function(){a._oOpenTradeAcceptDialog.close();var b=com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITY_ACCEPT_DELIVERY_SUCCESS");com.zespri.awct.util.NotificationHelper.showSuccessToast(b),com.zespri.awct.util.ModelHelper.getJSONModelForRead(a._sContextPath,{urlParameters:{$select:"Status"}},jQuery.proxy(a._updateOpenTradeStatus,a),function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a)})},error:function(b){a._oOpenTradeAcceptDialog.setBusy(!1),a._setViewBusy(!1),com.zespri.awct.util.NotificationHelper.handleErrorMessage(b)}}))},_updateOpenTradeStatus:function(a){this._updateTradeStatus(a),this.getRouter().navBack()},handleAcceptCancelPress:function(){this._oOpenTradeAcceptDialog.close()},_updateFooterButtonsVisibility:function(){var a=this.byId("pageTradeOpportunitiesDetails");a.getShowFooter()||a.setShowFooter(!0);var b=this.getView().byId("tradeAcceptButton"),c=this.getView().byId("tradeRejectButton"),d=this.getView().byId("tradeDetailCancelButton"),e=this._oTradeOpportuityContext.getProperty("Type"),f=this._oTradeOpportuityContext.getProperty("Status");b.setVisible(e!==com.zespri.awct.util.Enums.TradeType.Inbound&&e!==com.zespri.awct.util.Enums.TradeType.Open||f!==com.zespri.awct.util.Enums.TradeStatus.Initiated&&f!==com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted||!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP)?!1:!0),c.setVisible(e===com.zespri.awct.util.Enums.TradeType.Inbound&&f===com.zespri.awct.util.Enums.TradeStatus.Initiated&&com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP)?!0:!1),d.setVisible(e!==com.zespri.awct.util.Enums.TradeType.Outbound||f!==com.zespri.awct.util.Enums.TradeStatus.Initiated&&f!==com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted||!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP)?!1:!0),b.getVisible()||c.getVisible()||d.getVisible()||a.setShowFooter(!1)},formatBatchCharacteristicsValuesText:function(a){var b=function(a){return a.Value};return a?a.results.map(b).join(", "):void 0},formatExcludeIncludeText:function(a){return a===com.zespri.awct.util.Enums.ViewBCOperation.Exclude?com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_BATCHCHARACTERISTICS_EXCLUDE"):a===com.zespri.awct.util.Enums.ViewBCOperation.Include?com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_BATCHCHARACTERISTICS_INCLUDE"):""},handleCancelPress:function(){var a=this,b=this._oTradeOpportuityContext.getProperty("TradeID");a._setViewBusy(!0),this.getView().getModel().read("/CancelTrade",{urlParameters:{TradeID:"'"+b+"'",TradeUpdateTime:com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(this._oTradeOpportuityContext.getProperty("TradeUpdateTime"))},success:function(){var b=com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITY_CANCEL_DELIVERY_SUCCESS");com.zespri.awct.util.NotificationHelper.showSuccessToast(b),com.zespri.awct.util.ModelHelper.getJSONModelForRead(a._sContextPath,{urlParameters:{$select:"Status"}},jQuery.proxy(a._updateTradeStatus,a),function(b){com.zespri.awct.util.NotificationHelper.handleErrorMessage(b),a._setViewBusy(!1)})},error:function(b){com.zespri.awct.util.NotificationHelper.handleErrorMessage(b),a._setViewBusy(!1)}})}})}();