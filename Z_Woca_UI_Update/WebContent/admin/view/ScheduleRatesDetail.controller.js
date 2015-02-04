/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	!function(){"use strict";jQuery.sap.require({modName:"com.zespri.awct.core.Controller",type:"controller"}),jQuery.sap.require("com.zespri.awct.util.CommonHelper"),jQuery.sap.require("com.zespri.awct.util.I18NHelper"),jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper"),jQuery.sap.require("com.zespri.awct.util.ModelHelper"),jQuery.sap.require("com.zespri.awct.util.NotificationHelper"),jQuery.sap.require("com.zespri.awct.util.TableRowActionsExtension"),jQuery.sap.require("sap.ui.commons.layout.HorizontalLayout"),com.zespri.awct.core.Controller.extend("com.zespri.awct.admin.view.ScheduleRatesDetail",{onInit:function(){this._oActionSheet=null,this._oScheduleRateContext=null,this._oAddScheduleLineDialog=null,this._oRowActionsExtension=null,this._sContextPath=null,this._bUserAuthorized=!1;var a=this,b=this.getView(),c=this.byId("scheduleLineTable");com.zespri.awct.util.CommonHelper.manageNoDataText(c),this._oRowActionsExtension=new com.zespri.awct.util.TableRowActionsExtension({table:c,actionsContent:this._getTableRowActionsContent()}),this.getRouter().attachOnBeforeNavigationWithUnsavedChanges(this.handleNavigationWithUnsavedChanges,this),this.getRouter().attachRoutePatternMatched(function(c){if("Administration/ScheduleRatesDetail"===c.getParameter("name")){if(!a._bUserAuthorized)return void com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper.getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));this._sContextPath=c.getParameter("arguments").contextPath,a.byId("scheduleRateSaveButton").setEnabled(!1),com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,com.zespri.awct.util.Enums.AuthorizationObject.Administration,com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM)&&(a.byId("addScheduleRates").setVisible(!0),a.byId("scheduleRateSaveButton").setVisible(!0),a.byId("rowActionsButton")&&a.byId("rowActionsButton").setVisible(!0),a.byId("textScheduleName").setEnabled(!0),a.byId("textDeliveryPallet").setEnabled(!0)),this._oScheduleRateContext=new sap.ui.model.Context(b.getModel(),"/"+this._sContextPath);var d=this._oScheduleRateContext.getProperty("ScheduleName"),e=!1;d?a._setFormData(this._sContextPath,e):(e=!0,a._setViewBusy(!0),this._readScheduleDetails(this._sContextPath,e))}},this)},onBeforeRendering:function(){com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,com.zespri.awct.util.Enums.AuthorizationObject.Administration,com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM)?this._bUserAuthorized=!0:(this.byId("pageScheduleRatesDetail")&&this.byId("pageScheduleRatesDetail").destroy(),this._bUserAuthorized=!1)},_getTableRowActionsContent:function(){var a=sap.ui.getCore().getRootComponent().getModel("i18n");return new sap.ui.commons.layout.HorizontalLayout({content:[new sap.m.Button({icon:"sap-icon://sys-minus",tooltip:"{i18n>TXT_ADMIN_SCHEDULE_LINE_ACTION_TOOLTIP_DELETE}",press:[this.handleScheduleLineDelete,this]})]}).setModel(a,"i18n")},handleScheduleLineDelete:function(){var a=this,b=sap.ui.getCore().getRootComponent().getModel();this._oRowActionsExtension.hideRowActions(),this._oSelectedRowContext=this.getView().byId("scheduleLineTable").getSelectedItem().getBindingContext();var c=this._oSelectedRowContext.getPath();if(this._oScheduleRateContext.getModel()!==b){var d=this._oSelectedRowContext.getPath(),e=this._oSelectedRowContext.getObject(d),f=e.__metadata.uri,g=f.split("/");g.length&&(c="/"+g[g.length-1])}var h=com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_SCHEDULE_LINE_ACTION_CONFIRM_DELETE"),i=function(){var b=com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_SCHEDULE_LINE_ACTION_DELETE_SUCCESS");com.zespri.awct.util.NotificationHelper.showSuccessToast(b),a._readScheduleDetails(a._sContextPath,!0),a.setHasUnsavedChanges(!1),a._setViewBusy(!1)},j=function(b){com.zespri.awct.util.NotificationHelper.handleErrorMessage(b),a._setViewBusy(!1)},k=function(){a._setViewBusy(!0),b.remove(c,{success:i,error:j})};com.zespri.awct.util.NotificationHelper.showConfirmDialog(h,$.proxy(k,this))},handleRowActionsPress:function(a){this._oRowActionsExtension.showRowActions(a.getSource().getBindingContext())},_readScheduleDetails:function(a,b){var c=this,d=function(d){c._oScheduleRateContext=new sap.ui.model.Context(d,"/result"),c._setFormData(a,b),c._setViewBusy(!1)},e=function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a)};com.zespri.awct.util.ModelHelper.getJSONModelForRead(a,{urlParameters:{$expand:"ScheduleLineSet"}},d,e)},_setFormData:function(a,b){this.getView().setModel(this._oScheduleRateContext.getModel()).setBindingContext(this._oScheduleRateContext);var c=this._oScheduleRateContext.getProperty("ScheduleType"),d=this.byId("textDeliveryPallet");d.setSelectedKey(c);var e=this.byId("scheduleLineTable"),f="";f=b?"ScheduleLineSet/results":"/"+a+"/ScheduleLineSet",e.bindItems({path:f,template:e.getBindingInfo("items")?e.getBindingInfo("items").template:e.getItems()[0].clone()})},handleAddScheduleLinePress:function(){this._oAddScheduleLineDialog||(this._oAddScheduleLineDialog=sap.ui.xmlfragment("AddScheduleLineFragement","com.zespri.awct.admin.fragment.AddScheduleLineDialog",this),this.getView().addDependent(this._oAddScheduleLineDialog));var a=sap.ui.core.Fragment.byId("AddScheduleLineFragement","daysFromLoadingInput"),b=sap.ui.core.Fragment.byId("AddScheduleLineFragement","standardRateInput"),c=sap.ui.core.Fragment.byId("AddScheduleLineFragement","shortNoticeRateInput"),d=sap.ui.core.Fragment.byId("AddScheduleLineFragement","currencyInput");a.setValue(""),b.setValue(""),c.setValue(""),d.setValue(""),this._getCustomDataForKey(d,"currency")&&d.removeCustomData(this._getCustomDataForKey(d,"currency")),a.setValueState(sap.ui.core.ValueState.None),b.setValueState(sap.ui.core.ValueState.None),c.setValueState(sap.ui.core.ValueState.None),d.setValueState(sap.ui.core.ValueState.None),this._oAddScheduleLineDialog.open()},handleCurrencyValueHelpPress:function(a){var b=a.getSource();this._oCurrencyDialog||(this._oCurrencyDialog=new sap.ui.xmlfragment("currencyDialog","com.zespri.awct.admin.fragment.SearchFieldSelectionDialog",this),this.getView().addDependent(this._oCurrencyDialog)),this._oCurrencyDialog.setMultiSelect(!1),this._oCurrencyDialog.setTitle(com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_SCHEDULE_LINE_CURRENCY_DIALOG_TITLE")),sap.ui.core.Fragment.byId("currencyDialog","searchFieldLabel").setVisible(!1),this._bindCurrency(b),this._oCurrencyDialog.open()},_bindCurrency:function(a){var b=this;this._oCurrencyDialog.destroyItems(),this._oCurrencyDialog._dialog.setBusy(!0),this._oCurrencyDialog._dialog.setBusyIndicatorDelay(0),com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet",{urlParameters:{$filter:"Scenario eq 'CURRENCY'"}},function(c){b._oCurrencyDialog.setModel(c),b._oCurrencyDialog.bindItems({path:"/results",factory:function(a,b){var c=b.getProperty("Key")+" - "+b.getProperty("Value");return new sap.m.ColumnListItem({cells:[new sap.m.Text({text:c})]})}}),b._oCurrencyDialog.setGrowingThreshold(c.getData().results.length);for(var d=a.getValue(),e=0;e<b._oCurrencyDialog.getItems().length;e++)d===b._oCurrencyDialog.getItems()[e].getCells()[0].getText()&&b._oCurrencyDialog.getItems()[e].setSelected(!0);b._oCurrencyDialog._dialog.setBusy(!1)},function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a),b._oCurrencyDialog._dialog.setBusy(!1),b._oCurrencyDialog._dialog.close()})},handleValueHelpDialogSearch:function(a){var b=a.getParameter("value"),c="Key",d=new sap.ui.model.Filter(c,sap.ui.model.FilterOperator.Contains,b),e=a.getSource().getBinding("items");e.filter([d])},handleValueHelpDialogOKPress:function(a){var b=a.getParameter("selectedContexts")[0],c=sap.ui.core.Fragment.byId("AddScheduleLineFragement","currencyInput");c.setValue(b.getProperty("Key")+" - "+b.getProperty("Value")),this._getCustomDataForKey(c,"currency")&&c.removeCustomData(this._getCustomDataForKey(c,"currency")),c.addCustomData(new sap.ui.core.CustomData({key:"currency",value:b.getProperty("Key")})),c.setValueState(sap.ui.core.ValueState.None)},handleAddScheduleLineDialogClosePress:function(){this._oAddScheduleLineDialog.close()},_getContextPath:function(){var a=sap.ui.getCore().getRootComponent().getModel(),b=this._oScheduleRateContext.getPath().substr(1);if(this._oScheduleRateContext.getModel()!==a){var c=this._oScheduleRateContext.getModel().getData().result,d=c.__metadata.uri,e=d.split("/");e.length&&(b=e[e.length-1])}return b},_getScheduleLineDialogFormData:function(){var a=sap.ui.core.Fragment.byId("AddScheduleLineFragement","daysFromLoadingInput"),b=sap.ui.core.Fragment.byId("AddScheduleLineFragement","standardRateInput"),c=sap.ui.core.Fragment.byId("AddScheduleLineFragement","shortNoticeRateInput"),d=sap.ui.core.Fragment.byId("AddScheduleLineFragement","currencyInput"),e=a.getValue(),f=parseInt(e,10),g=b.getValue(),h=c.getValue(),i=this._getCustomDataForKey(d,"currency"),j=!1;if(isNaN(e)||Math.round(e)!==parseFloat(e)||Math.round(e)<0?(a.setValueState(sap.ui.core.ValueState.Error),a.setValueStateText(com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_SCHEDULE_LINE_DIALOG_DAYS_FROM_LOADING_ERROR_VALUE_STATE_TEXT")),j=!0):a.setValueState(sap.ui.core.ValueState.None),!g||isNaN(g)?(b.setValueState(sap.ui.core.ValueState.Error),b.setValueStateText(com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_SCHEDULE_LINE_DIALOG_STANDARD_RATE_ERROR_VALUE_STATE_TEXT")),j=!0):b.setValueState(sap.ui.core.ValueState.None),!h||isNaN(h)?(c.setValueState(sap.ui.core.ValueState.Error),c.setValueStateText(com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_SCHEDULE_LINE_DIALOG_SHORT_NOTICE_RATE_ERROR_VALUE_STATE_TEXT")),j=!0):c.setValueState(sap.ui.core.ValueState.None),i?d.setValueState(sap.ui.core.ValueState.None):(d.setValueState(sap.ui.core.ValueState.Error),d.setValueStateText(com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_SCHEDULE_LINE_DIALOG_CURRENCY_ERROR_VALUE_STATE_TEXT")),j=!0),j)return null;var k={};return k.ScheduleName=this._oScheduleRateContext.getProperty("ScheduleName"),k.DaysFromLoading=f,k.StandardRate=g,k.ShortNoticeRate=h,k.Currency=i.getValue(),k},handleAddScheduleLineDialogSavePress:function(){var a=this,b=sap.ui.getCore().getRootComponent().getModel(),c=this._getContextPath(),d=this._getScheduleLineDialogFormData();if(d){var e=function(){var b=com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_ADD_SCHEDULE_LINE_DIALOG_SAVE_SUCCESS");com.zespri.awct.util.NotificationHelper.showSuccessToast(b),a.setHasUnsavedChanges(!1),a._oAddScheduleLineDialog.setBusy(!1),a._oAddScheduleLineDialog.close(),a._refreshScheduleLines(c)},f=function(b){com.zespri.awct.util.NotificationHelper.handleErrorMessage(b),a._oAddScheduleLineDialog.setBusy(!1)};this._oAddScheduleLineDialog.setBusy(!0),b.create("/ScheduleLineSet",d,{success:e,error:f,async:!0})}},_getFormData:function(){var a=this.byId("textScheduleName"),b=this.byId("textDeliveryPallet"),c=a.getValue(),d=b.getSelectedKey(),e=!1;if(c?a.setValueState(sap.ui.core.ValueState.None):(a.setValueState(sap.ui.core.ValueState.Error),a.setValueStateText(com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_SCHEDULE_RATE_DIALOG_SCHEDULE_NAME_ERROR_VALUE_STATE_TEXT")),e=!0),e)return null;var f={};return f.ScheduleName=c,f.ScheduleType=d,f},handleScheduleRateDetailSavePress:function(){var a=this,b=sap.ui.getCore().getRootComponent().getModel(),c=this._getContextPath(),d=this._getFormData();if(d){var e=function(){var b=com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_SCHEDULE_RATE_SAVE_SUCCESS");com.zespri.awct.util.NotificationHelper.showSuccessToast(b),a.setHasUnsavedChanges(!1),a._setViewBusy(!1)},f=function(b){com.zespri.awct.util.NotificationHelper.handleErrorMessage(b),a._setViewBusy(!1)};this._setViewBusy(!0),b.update(c,d,{success:e,error:f,merge:!0})}},handleScheduleRateDetailCancelPress:function(){this.getRouter().navBack()},handleNavigationWithUnsavedChanges:function(a){var b=a.getParameter("fnAllowNavigation"),c=this,d=function(){c.setHasUnsavedChanges(!1),b()},e=com.zespri.awct.util.I18NHelper.getText("TXT_GENERIC_NAVIGATION_DATA_LOSS_MESSAGE");com.zespri.awct.util.NotificationHelper.showConfirmDialog(e,d)},handleInputChange:function(){this.setHasUnsavedChanges(!0),this.byId("scheduleRateSaveButton").setEnabled(!0)},_setViewBusy:function(a){this.getView().setBusy(a),this.byId("pageScheduleRatesDetail").getFooter()&&this.byId("pageScheduleRatesDetail").getFooter().setBusy(a)},_refreshScheduleLines:function(a){var b=sap.ui.getCore().getRootComponent().getModel(),c=this.byId("scheduleLineTable");this._oScheduleRateContext.getModel()!==b?(this._setViewBusy(!0),this._readScheduleDetails(a,!0)):c.getBinding("items").refresh()},_getCustomDataForKey:function(a,b){var c=a.getCustomData();if(c.length)for(var d=0;d<c.length;d++)if(c[d].getKey()===b)return c[d];return""},handleScheduleRateActionSheetOpen:function(a){var b=a.getSource();this._oActionSheet||(this._oActionSheet=sap.ui.xmlfragment("scheduleDetailsActionSheetFragment","com.zespri.awct.admin.fragment.ScheduleDetailsActionSheet",this),this.getView().addDependent(this._oActionSheet)),this._oActionSheet.isOpen()?this._oActionSheet.close():this._oActionSheet.openBy(b)},handleNavToRatesView:function(a){var b=a.getSource(),c=sap.ui.core.Fragment.byId("scheduleDetailsActionSheetFragment","viewTimeBasedRatesButton"),d=sap.ui.core.Fragment.byId("scheduleDetailsActionSheetFragment","viewExceptionBasedRatesButton"),e=this._oScheduleRateContext.getProperty("ScheduleName");if(b===c)this.getRouter().navTo("Administration/TimeBasedRateMaintenance",{customData:{ScheduleName:e}});else{if(b!==d)return;this.getRouter().navTo("Administration/ExceptionRateMaintenance",{customData:{ScheduleName:e}})}}})}();