/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	!function(){"use strict";jQuery.sap.require({modName:"com.zespri.awct.core.Controller",type:"controller"}),jQuery.sap.require("com.zespri.awct.util.CommonHelper"),jQuery.sap.require("com.zespri.awct.util.I18NHelper"),jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper"),jQuery.sap.require("com.zespri.awct.util.ModelHelper"),jQuery.sap.require("com.zespri.awct.util.NotificationHelper"),com.zespri.awct.core.Controller.extend("com.zespri.awct.collab.view.PrintOrders",{_FileType:{PDF:"PDF"},_BusinessAction:{DOWNLOAD:"Download"},_ReportCode:{PRINT_ORDER:"ZPRO"},onInit:function(){this._bUserAuthorized=!1,this._oSearchInputField=null,this._oBusyDialog=new sap.m.BusyDialog;var a=this;this.getRouter().attachRoutePatternMatched(function(b){return"Collaboration/PrintOrders"!==b.getParameter("name")||a._bUserAuthorized?void 0:void com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper.getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"))})},onBeforeRendering:function(){if(com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP)){this._bUserAuthorized=!0;var a=this.byId("selectSeason"),b=this;this._oSearchHelpDialog=null,this._oSearchInputField=null,this._setViewBusy(!0),com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet",{urlParameters:{$filter:"Scenario eq 'SEASON'"}},function(c){a.setModel(c),a.bindItems({path:"/results",template:a.getBindingInfo("items")?a.getBindingInfo("items").template:a.getItems()[0].clone()}),b._setViewBusy(!1)},function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a),b._setViewBusy(!1)})}else this.byId("pagePrintOrders")&&this.byId("pagePrintOrders").destroy(),this._bUserAuthorized=!1},handleValueHelpPress:function(a){this._oSearchInputField=a.getSource(),this._oSearchHelpDialog||(this._oSearchHelpDialog=new sap.ui.xmlfragment("printOrdersFormDialog","com.zespri.awct.collab.fragment.SearchFieldSelectionDialog",this),this.getView().addDependent(this._oSearchHelpDialog));var b=this._getCustomDataForKey(this._oSearchInputField,"label").getValue();this._oSearchHelpDialog.setTitle(b),sap.ui.core.Fragment.byId("printOrdersFormDialog","searchFieldLabel").setText(b),this._oSearchHelpDialog.setMultiSelect(!1),com.zespri.awct.util.CommonHelper.manageNoDataText(this._oSearchHelpDialog._table),this.bindTableSelectDialog(this._oSearchInputField)},bindTableSelectDialog:function(a){var b=this,c=b._getCustomDataForKey(a,"bindingKey").getValue(),d=function(d){b._oSearchHelpDialog.setGrowingThreshold(d.getData().results.length),b._oSearchHelpDialog.setModel(d);var e={path:"/results",factory:function(a,b){var d=b.getProperty(c);return new sap.m.ColumnListItem({cells:[new sap.m.Text({text:d})]})}};b._oSearchHelpDialog.bindItems(e);for(var f=a.getValue(),g=0;g<b._oSearchHelpDialog.getItems().length;g++)f===b._oSearchHelpDialog.getItems()[g].getCells()[0].getText()&&b._oSearchHelpDialog.getItems()[g].setSelected(!0);b._oSearchHelpDialog._dialog.setBusy(!1)},e=this._getCustomDataForKey(a,"valueHelpKey").getValue();switch(this._oSearchHelpDialog.destroyItems(),this._oSearchHelpDialog.open(),this._oSearchHelpDialog._dialog.setBusy(!0),this._oSearchHelpDialog._dialog.setBusyIndicatorDelay(0),e){case"ShipmentNumber":var f=this.byId("selectSeason");com.zespri.awct.util.ModelHelper.getJSONModelForRead("/ShipmentSet",{urlParameters:{$select:"ShipmentID",$filter:"Season eq '"+f.getSelectedKey()+"'"}},d,function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a),b._oSearchHelpDialog._dialog.setBusy(!1)});break;case"Delivery":var g=this.byId("selectShipmentNumber"),h=[];b._getCustomDataForKey(g,"selectedValue")&&(h=b._getCustomDataForKey(g,"selectedValue").getValue());var i="";if(1===h.length)i="ShipmentID eq '"+h[0]+"'";else if(h.length>1){for(var j=[],k=0;k<h.length;k++)j[k]="ShipmentID eq '"+h[k]+"'";i=i+" and ("+j.join(" or ")+")"}com.zespri.awct.util.ModelHelper.getJSONModelForRead("/DeliveryHeaderSet",{urlParameters:{$select:"DeliveryHeaderID",$filter:i}},d,function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a),b._oSearchHelpDialog._dialog.setBusy(!1)})}},handleValueHelpDialogOKPress:function(a){var b=this,c=this._getCustomDataForKey(this._oSearchInputField,"bindingKey").getValue(),d=a.getParameter("selectedContexts")[0].getProperty(c);this._oSearchInputField.setValueState(sap.ui.core.ValueState.None),this._oSearchInputField.setValue(d),this._getCustomDataForKey(this._oSearchInputField,"selectedValue")&&this._oSearchInputField.removeCustomData(this._getCustomDataForKey(this._oSearchInputField,"selectedValue")),d&&this._oSearchInputField.addCustomData(new sap.ui.core.CustomData({key:"selectedValue",value:[d]}));var e=this.byId("selectDelivery"),f=this.byId("selectSupplier");if(this._oSearchInputField.getId()===this.createId("selectShipmentNumber")&&(e.setValue(""),this._getCustomDataForKey(e,"selectedValue")&&e.removeCustomData(this._getCustomDataForKey(e,"selectedValue"))),this._oSearchInputField.getId()===this.createId("selectDelivery")||this._oSearchInputField.getId()===this.createId("selectShipmentNumber")){var g=e.getValue();g||(g="");var h=this.byId("selectShipmentNumber").getValue();h||(h=""),b._setViewBusy(!0),com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GetSuppliersForPrintOrder",{urlParameters:{DeliveryID:"'"+g+"'",ShipmentID:"'"+h+"'"}},function(a){f.setModel(a),f.bindItems({path:"/results",factory:function(a,b){var c=b.getProperty("Supplier");return new sap.ui.core.Item({key:c,text:c})}}),f.setEnabled(!0),b._setViewBusy(!1)},function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a),b._setViewBusy(!1)})}},handleValueHelpDialogSearch:function(a){var b=a.getParameter("value"),c=this._getCustomDataForKey(this._oSearchInputField,"bindingKey").getValue(),d=new sap.ui.model.Filter(c,sap.ui.model.FilterOperator.Contains,b),e=a.getSource().getBinding("items");e.filter([d])},_getFormData:function(){var a={};return a.Season="'"+this.byId("selectSeason").getSelectedItem().getKey()+"'",a.ShipmentID=this._getCustomDataForKey(this.byId("selectShipmentNumber"),"selectedValue")?"'"+this._getCustomDataForKey(this.byId("selectShipmentNumber"),"selectedValue").getValue()[0]+"'":null,a.DeliveryID=this._getCustomDataForKey(this.byId("selectDelivery"),"selectedValue")?"'"+this._getCustomDataForKey(this.byId("selectDelivery"),"selectedValue").getValue()[0]+"'":null,a.SupplierID=this.byId("selectSupplier").getSelectedItem()?"'"+this.byId("selectSupplier").getSelectedItem().getKey()+"'":null,a},handleDownloadPress:function(){var a=[],b=["selectSeason","selectShipmentNumber","selectDelivery","selectSupplier"],c=0,d=!1,e=this.byId("selectDelivery"),f=this._getFormData();if((f.ShipmentID||f.DeliveryID)&&f.Season&&f.SupplierID||(d=!0),d)com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_PRINT_ORDERS_DOWNLOAD_ERROR_TOAST_MESSAGE"));else{for(e.setValueState(sap.ui.core.ValueState.None);c<b.length;){var g=this.getView().byId(b[c]),h=[];if("selectSupplier"===b[c]&&this.byId("selectSupplier").getSelectedItem()){var i="(Supplier eq '"+this.byId("selectSupplier").getSelectedItem().getKey()+"')";a.push(i)}else if("selectSeason"===b[c]&&this.byId("selectSeason").getSelectedItem()){var j="(Season eq '"+this.byId("selectSeason").getSelectedItem().getKey()+"')";a.push(j)}else{var k="";if(this._getCustomDataForKey(g,"downloadKey")&&(k=this._getCustomDataForKey(g,"downloadKey").getValue()),this._getCustomDataForKey(g,"selectedValue")){var l=this._getCustomDataForKey(g,"selectedValue").getValue();for(var m in l){var n=k+" eq '"+l[m]+"'";h.push(n)}var o="("+h.join(" or ")+")";a.push(o)}}c+=1}a.push("(ReportCode eq '"+this._ReportCode.PRINT_ORDER+"')");var p=a.join(" and "),q=this.getView().getModel();q.setHeaders({BusinessAction:this._BusinessAction.DOWNLOAD,FileType:this._FileType.PDF}),this._oBusyDialog.open();var r=this;com.zespri.awct.util.ModelHelper.getJSONModelForRead("/ReportSet",{urlParameters:{$filter:p}},function(a){q.setHeaders(null),r._oBusyDialog.close();var b=a.getData().results[0].FileGuid;return 0!==parseInt(b,10)||isNaN(b)?(com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_PRINT_ORDERS_STARTING_DOWNLOAD_TOAST_MESSAGE")),void(window.location.href=window.location.protocol+"//"+window.location.host+"/sap/opu/odata/sap/Z_AWCT_SRV/FileDownloadSet('"+b+"')/$value")):void com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper.getText("TXT_GENERIC_DOWNLOAD_NO_MATCHING_RESULTS_FOUND_MESSAGE"))},function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a),q.setHeaders(null),r._oBusyDialog.close()})}},handleRFIAllPress:function(){this.byId("selectDelivery").setValueState(sap.ui.core.ValueState.None);var a=this._getFormData();a.DeliveryID="''",a.ShipmentID="''";var b=this;this._setViewBusy(!0),com.zespri.awct.util.ModelHelper.getJSONModelForRead("/SendRFI",{urlParameters:a},function(){b._setViewBusy(!1),com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_PRINT_ORDERS_RFI_SUCCESS_TOAST_MESSAGE"))},function(a){b._setViewBusy(!1),com.zespri.awct.util.NotificationHelper.handleErrorMessage(a)})},handleRFIPress:function(){var a=!1,b=this.byId("selectDelivery");b.setValueState(sap.ui.core.ValueState.None);var c=this._getFormData();if(c.ShipmentID||(c.ShipmentID="''"),c.SupplierID&&c.Season||(a=!0),c.DeliveryID||(b.setValueState(sap.ui.core.ValueState.Error),b.setValueStateText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_PRINT_ORDERS_DELIVERY_NOT_SELECTED_ERROR_MESSAGE")),a=!0),a)com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_PRINT_ORDERS_DOWNLOAD_ERROR_TOAST_MESSAGE"));else{b.setValueState(sap.ui.core.ValueState.None);var d=this;this._setViewBusy(!0),com.zespri.awct.util.ModelHelper.getJSONModelForRead("/SendRFI",{urlParameters:c},function(){d._setViewBusy(!1),com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_PRINT_ORDERS_RFI_SUCCESS_TOAST_MESSAGE"))},function(a){d._setViewBusy(!1),com.zespri.awct.util.NotificationHelper.handleErrorMessage(a)})}},_getCustomDataForKey:function(a,b){var c=a.getCustomData();if(c.length)for(var d=0;d<c.length;d++)if(c[d].getKey()===b)return c[d];return""},_setViewBusy:function(a){this.getView().setBusy(a),this.byId("pagePrintOrders").getFooter()&&this.byId("pagePrintOrders").getFooter().setBusy(a)},handleFilterResetPress:function(){var a=this;jQuery.each(["selectShipmentNumber","selectDelivery"],function(b,c){var d=a.byId(c);d.setValue(""),a._getCustomDataForKey(a.byId(c),"selectedValue")&&d.removeCustomData(a._getCustomDataForKey(a.byId(c),"selectedValue"))});var b=this.byId("selectSupplier");b.destroyItems(),b.setEnabled(!1);var c=this.byId("selectSeason");c.setSelectedKey(c.getItems()[0])}})}();