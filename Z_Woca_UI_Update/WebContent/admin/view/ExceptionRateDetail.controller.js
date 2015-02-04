/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	!function(){"use strict";jQuery.sap.require({modName:"com.zespri.awct.core.Controller",type:"controller"}),jQuery.sap.require("com.zespri.awct.util.Constants"),jQuery.sap.require("com.zespri.awct.util.Enums"),jQuery.sap.require("com.zespri.awct.util.I18NHelper"),jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper"),jQuery.sap.require("com.zespri.awct.util.ModelHelper"),jQuery.sap.require("com.zespri.awct.util.NotificationHelper"),com.zespri.awct.core.Controller.extend("com.zespri.awct.admin.view.ExceptionRateDetail",{onInit:function(){this._sViewStatus=null,this._oExceptionRateContext=null,this._bUserAuthorized=!1;var a=this;this.getRouter().attachRoutePatternMatched(function(b){if("Administration/ExceptionRateDetail"===b.getParameter("name")){if(a._bUserAuthorized){var c=b.getParameter("arguments").contextPath;a._sViewStatus=b.getParameter("arguments").viewMode,a.byId("saveExceptionRateButton").setEnabled(!1),a._initializeView(c)}else com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper.getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));a.getRouter().attachOnBeforeNavigationWithUnsavedChanges(this.handleNavigationWithUnsavedChanges,this)}else a.getRouter().detachOnBeforeNavigationWithUnsavedChanges(this.handleNavigationWithUnsavedChanges,this)},this)},onBeforeRendering:function(){com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,com.zespri.awct.util.Enums.AuthorizationObject.Administration,com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM)?this._bUserAuthorized=!0:(this.byId("pageExceptionRateDetail")&&this.byId("pageExceptionRateDetail").destroy(),this._bUserAuthorized=!1)},_disableForm:function(){this.byId("selectVariety").setEnabled(!1),this.byId("selectClass").setEnabled(!1),this.byId("selectGrowingMethod").setEnabled(!1),this.byId("selectPackStyle").setEnabled(!1),this.byId("selectDeliveryID").setEnabled(!1),this.byId("selectShipmentType").setEnabled(!1),this.byId("selectChargeCode").setEnabled(!1),this.byId("selectSchedule").setEnabled(!1),this.byId("selectPriority").setEnabled(!1),this.byId("selectSize").setEnabled(!1),this.byId("switchShortNotice").setEnabled(!1),this.byId("switchActiveFlag").setEnabled(!1),this.byId("selectShipmentNumber").setEnabled(!1)},_clearForm:function(){var a=this.byId("selectVariety"),b=this.byId("selectClass"),c=this.byId("selectGrowingMethod"),d=this.byId("selectPackStyle"),e=this.byId("selectDeliveryID"),f=this.byId("selectShipmentType"),g=this.byId("selectChargeCode"),h=this.byId("selectSchedule"),i=this.byId("selectPriority"),j=this.byId("selectSize"),k=this.byId("switchShortNotice"),l=this.byId("switchActiveFlag"),m=this.byId("selectShipmentNumber");a.setSelectedKey(""),b.setSelectedKey(""),c.setSelectedKey(""),d.setSelectedKey(""),e.setSelectedKey(""),f.setSelectedKey(""),g.setSelectedKey(""),h.setSelectedKey(""),i.setSelectedKey("10"),j.setSelectedKey(""),m.setSelectedKey(""),k.setState(!1),l.setState(!0)},_setSelectedItem:function(a,b){var c=this._oExceptionRateContext.getProperty(b),d=this.byId(a);d.setSelectedKey(c)},setFormData:function(a){var b=this,c={selectVariety:"Characteristic/Variety",selectClass:"Characteristic/Class",selectGrowingMethod:"Characteristic/GrowingMethod",selectPackStyle:"Characteristic/PackStyle",selectSize:"Characteristic/Size",selectDeliveryID:"DeliveryID",selectShipmentType:"ShipmentType",selectChargeCode:"ChargeCode",selectSchedule:"ScheduleName",selectPriority:"Priority",selectShipmentNumber:"ShipmentID"},d=b._oExceptionRateContext.getProperty("ShipmentID");if(d){var e=this.byId("selectDeliveryID"),f="ShipmentID eq '"+d+"'";com.zespri.awct.util.ModelHelper.getJSONModelForRead("/DeliveryHeaderSet",{urlParameters:{$select:"DeliveryHeaderID",$orderby:"DeliveryHeaderID",$filter:f}},function(b){var c={Key:"",Value:""};b.oData.results.unshift(c),b.setSizeLimit(b.oData.results.length),b.setProperty("/DeliveryNumbers",b.oData.results),e.setModel(b,"domainValues");var d={path:"domainValues>/DeliveryNumbers",template:e.getBindingInfo("items")?e.getBindingInfo("items").template:e.getItems()[0].clone()};e.bindItems(d),a.resolve()},function(b){com.zespri.awct.util.NotificationHelper.handleErrorMessage(b),a.resolve()})}else a.resolve();$.each(c,function(a,c){b._setSelectedItem(a,c)});var g=this.byId("switchShortNotice"),h=this._oExceptionRateContext.getProperty("ShortNoticeFlag");g.setState(h);var i=this.byId("switchActiveFlag"),j=this._oExceptionRateContext.getProperty("Active");i.setState(j)},_getContextPath:function(){var a=this.getView().getModel(),b=this._oExceptionRateContext.getPath().substr(1);if(this._oExceptionRateContext.getModel()!==a){var c=this._oExceptionRateContext.getModel().getData().result,d=c.__metadata.uri,e=d.split("/");e.length&&(b=e[e.length-1])}return b},handleSavePress:function(){var a=this,b=this.getView().getModel(),c=function(){var b=com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_EXCEPTION_RATES_SAVE_SUCCESS");com.zespri.awct.util.NotificationHelper.showSuccessToast(b),a.setHasUnsavedChanges(!1),a.getView().setBusy(!1),a.byId("saveExceptionRateButton").setEnabled(!1),a.getRouter().navTo("Administration/ExceptionRateMaintenance",{customData:{noTableRefresh:!0}})},d=function(b){com.zespri.awct.util.NotificationHelper.handleErrorMessage(b),a.getView().setBusy(!1)},e=this.byId("selectDeliveryID"),f=this.byId("selectShipmentNumber"),g=this.byId("selectChargeCode"),h=this.byId("selectSchedule"),i=this.byId("selectPriority");if(g.getSelectedItem().getKey()&&(e.getSelectedItem().getKey()||f.getSelectedKey())&&h.getSelectedItem().getKey()&&i.getSelectedItem().getKey()){var j=this.getFormData();if(this.getView().setBusy(!0),this._sViewStatus===com.zespri.awct.util.Enums.ViewMode.Add)b.create("/ExceptionRateSet",j,{success:c,error:d,async:!0});else{var k=this._getContextPath();b.update(k,j,{success:c,error:d,merge:!0})}}else com.zespri.awct.util.NotificationHelper.showErrorDialog(com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_EXCEPTION_RATES_DETAILS_MANDATORY_FIELDS_ERROR_MESSAGE"))},handleDeletePress:function(){var a=this,b=this._getContextPath(),c=com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_EXCEPTION_RATES_CONFIRM_DELETE"),d=function(){var b=com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_EXCEPTION_RATES_DELETE_SUCCESS");com.zespri.awct.util.NotificationHelper.showSuccessToast(b),a.setHasUnsavedChanges(!1),a.getView().setBusy(!1),a.getRouter().navBack()},e=function(b){com.zespri.awct.util.NotificationHelper.handleErrorMessage(b),a.getView().setBusy(!1)},f=function(){var c=this.getView().getModel();a.getView().setBusy(!0),c.remove(b,{success:d,error:e})};com.zespri.awct.util.NotificationHelper.showConfirmDialog(c,$.proxy(f,this))},getFormData:function(){var a=this.byId("selectVariety"),b=this.byId("selectClass"),c=this.byId("selectGrowingMethod"),d=this.byId("selectPackStyle"),e=this.byId("selectDeliveryID"),f=this.byId("selectSize"),g=this.byId("selectShipmentType"),h=this.byId("selectChargeCode"),i=this.byId("selectSchedule"),j=this.byId("selectPriority"),k=this.byId("selectShipmentNumber"),l=this.byId("switchShortNotice"),m=this.byId("switchActiveFlag"),n={Characteristic:{}};return n.Characteristic.Variety=a.getSelectedItem().getKey(),n.Characteristic.Class=b.getSelectedItem().getKey(),n.Characteristic.GrowingMethod=c.getSelectedItem().getKey(),n.Characteristic.Size=f.getSelectedItem().getKey(),n.Characteristic.PackStyle=d.getSelectedItem().getKey(),n.DeliveryID=e.getSelectedItem().getKey(),n.ShipmentType=g.getSelectedItem().getKey(),n.ChargeCode=h.getSelectedItem().getKey(),n.ScheduleName=i.getSelectedItem().getKey(),n.Priority=parseInt(j.getSelectedItem().getKey(),10),n.ShipmentID=k.getSelectedItem().getKey(),n.ShortNoticeFlag=l.getState(),n.Active=m.getState(),n.Season=sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason,n},handleCancelPress:function(){this.getRouter().navBack()},handleNavigationWithUnsavedChanges:function(a){var b=a.getParameter("fnAllowNavigation"),c=this,d=function(){c.setHasUnsavedChanges(!1),b()},e=com.zespri.awct.util.I18NHelper.getText("TXT_GENERIC_NAVIGATION_DATA_LOSS_MESSAGE");com.zespri.awct.util.NotificationHelper.showConfirmDialog(e,d)},handleInputChange:function(a){var b=this;if(this.setHasUnsavedChanges(!0),this.byId("saveExceptionRateButton").setEnabled(!0),a.getSource()===this.byId("selectShipmentNumber")){this.getView().setBusy(!0);var c=this.byId("selectDeliveryID"),d={};if(this.byId("selectShipmentNumber").getSelectedKey()){var e="ShipmentID eq '"+this.byId("selectShipmentNumber").getSelectedKey()+"'";d={$select:"DeliveryHeaderID",$orderby:"DeliveryHeaderID",$filter:e}}else d={$select:"DeliveryHeaderID",$orderby:"DeliveryHeaderID"};com.zespri.awct.util.ModelHelper.getJSONModelForRead("/DeliveryHeaderSet",{urlParameters:d},function(a){var d={Key:"",Value:""};a.oData.results.unshift(d),a.setProperty("/DeliveryNumbers",a.oData.results),a.setSizeLimit(a.oData.results.length),c.setModel(a,"domainValues");var e={path:"domainValues>/DeliveryNumbers",template:c.getBindingInfo("items")?c.getBindingInfo("items").template:c.getItems()[0].clone()};c.bindItems(e),b.getView().setBusy(!1)},function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a),b.getView().setBusy(!1)})}},_initializeView:function(a){var b=$.Deferred(),c=b.promise();this.getView().setBusy(!0);var d=this,e=function(e,f,g){var h=f.data.__batchResponses,i=new sap.ui.model.json.JSONModel;i.setSizeLimit(com.zespri.awct.util.Constants.C_ODATA_MODEL_SIZE_LIMIT);var j={Key:"",Value:""};h[0].data.results.unshift(j),h[1].data.results.unshift(j),h[2].data.results.unshift(j),h[3].data.results.unshift(j),h[4].data.results.unshift(j),h[5].data.results.unshift(j),h[6].data.results.unshift({ShipmentTypeID:""}),h[7].data.results.unshift(j),h[8].data.results.unshift(j),h[9].data.results.unshift(j),i.setProperty("/Varieties",h[0].data.results),i.setProperty("/Classes",h[1].data.results),i.setProperty("/GrowingMethods",h[2].data.results),i.setProperty("/PackStyles",h[3].data.results),i.setProperty("/Sizes",h[4].data.results),i.setProperty("/DeliveryNumbers",h[5].data.results),i.setProperty("/ShipmentTypes",h[6].data.results),i.setProperty("/Schedules",h[7].data.results),i.setProperty("/ChargeCodes",h[8].data.results),i.setProperty("/ShipmentNumbers",h[9].data.results),d.getView().setModel(i,"domainValues"),d.byId("selectDeliveryID").setModel(i,"domainValues"),com.zespri.awct.util.NotificationHelper.handleErrorMessage(g),b.resolve();var k=$.Deferred(),l=k.promise();if(d._sViewStatus===com.zespri.awct.util.Enums.ViewMode.Add)d.getView().byId("pageExceptionRateDetail").setTitle(com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_EXCEPTION_RATES_DETAIL_PAGE_TITLE_ADD")),d.byId("deleteExceptionRateButton").setVisible(!1),d._clearForm(),k.resolve();else{d.getView().byId("pageExceptionRateDetail").setTitle(com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_EXCEPTION_RATES_DETAIL_PAGE_TITLE")),d.byId("deleteExceptionRateButton").setVisible(!0),d._oExceptionRateContext=new sap.ui.model.Context(d.getView().getModel(),"/"+a);var m=d._oExceptionRateContext.getProperty("ExceptionRateID");if(m)d.setFormData(k);else{var n=function(a){d._oExceptionRateContext=new sap.ui.model.Context(a,"/result"),d.setFormData(k)},o=function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a)};com.zespri.awct.util.ModelHelper.getJSONModelForRead(a,{},n,o)}}$.when(c,l).done(function(){d.getView().setBusy(!1)})},f=function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a)},g=this.getView().getModel(),h=sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason,i=g.createBatchOperation("GenericSearchSet?$filter=Scenario%20eq%20%27VARIETY%27","GET"),j=g.createBatchOperation("GenericSearchSet?$filter=Scenario%20eq%20%27CLASS%27","GET"),k=g.createBatchOperation("GenericSearchSet?$filter=Scenario%20eq%20%27GROWING_METHOD%27","GET"),l=g.createBatchOperation("GenericSearchSet?$filter=Scenario%20eq%20%27PACK_STYLE%27","GET"),m=g.createBatchOperation("GenericSearchSet?$filter=Scenario%20eq%20%27SIZE%27","GET"),n=g.createBatchOperation("DeliveryHeaderSet?$select=DeliveryHeaderID&$orderby=DeliveryHeaderID","GET"),o=g.createBatchOperation("GetShipmentTypesForDifotis?Season=%27"+h+"%27","GET"),p=g.createBatchOperation("ScheduleSet","GET"),q=g.createBatchOperation("GenericSearchSet?$filter=Scenario%20eq%20%27CHARGECODE%27","GET"),r=g.createBatchOperation("ShipmentSet?$select=ShipmentID&$orderby=ShipmentID&$filter=Season%20eq%20%27"+h+"%27","GET"),s=[i,j,k,l,m,n,o,p,q,r];g.addBatchReadOperations(s),g.submitBatch(e,f)},formatSelectItems:function(a,b){return a||b?a+" - "+b:""}})}();