/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	!function(){"use strict";jQuery.sap.require({modName:"com.zespri.awct.core.Controller",type:"controller"}),jQuery.sap.require("com.zespri.awct.control.SearchHelpInput"),jQuery.sap.require("com.zespri.awct.util.CommonHelper"),jQuery.sap.require("com.zespri.awct.util.I18NHelper"),jQuery.sap.require("com.zespri.awct.util.ModelHelper"),jQuery.sap.require("com.zespri.awct.util.NotificationHelper"),com.zespri.awct.core.Controller.extend("com.zespri.awct.collab.view.SearchForm",{onInit:function(){this._aSearchInputIDs=["supplierIDInput","shipmentIDInput","destinationPortInput","deliveryNumberInput","containerIDInput","loadPortInput","shipmentNameInput","shipmentTypeInput","marketAccessAreaInput","marketerInput","daysFromLoadInput","brandInput","stackInput","packStyleInput","sizeInput","labelInput"],this._oSearchHelpDialog=null,this._bUserAuthorized=!1;var a=this;this.getRouter().attachRoutePatternMatched(function(b){return"Collaboration/SearchForm"!==b.getParameter("name")||a._bUserAuthorized?void 0:void com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper.getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"))})},onBeforeRendering:function(){if(com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP)||com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)){this._bUserAuthorized=!0;var a=this.byId("shipmentIDInput");this._getCustomDataForKey(a,"filter").setValue(JSON.stringify({path:"Season",operator:"EQ",value1:sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason}))}else this.byId("pageSearchForm")&&this.byId("pageSearchForm").destroy(),this._bUserAuthorized=!1},_getCustomDataForKey:function(a,b){var c=a.getCustomData();if(c.length)for(var d=0;d<c.length;d++)if(c[d].getKey()===b)return c[d];return""},_getFilterString:function(){var a=this,b=this.getView(),c=[];jQuery.each(this._aSearchInputIDs,function(d,e){var f=b.byId(e);if(f.getValue()){var g=a._getCustomDataForKey(f,"label").getValue()+" ("+f.getValue()+")";c.push(g)}});var d=this.byId("fruitGroupInput");if(d.getValue()){var e=this._parseFruitGroupString(d.getValue());if(e.Variety){var f=a._getCustomDataForKey(d,"varietyLabel").getValue()+" ("+e.Variety+")";c.push(f)}if(e.Class){var g=a._getCustomDataForKey(d,"classLabel").getValue()+" ("+e.Class+")";c.push(g)}if(e.GrowingMethod){var h=a._getCustomDataForKey(d,"growingMethodLabel").getValue()+" ("+e.GrowingMethod+")";c.push(h)}}var i=this.byId("searchLoadFromDateInput");if(i.getValue()){var j=a._getCustomDataForKey(i,"label").getValue()+" ("+i.getValue()+")";c.push(j)}var k=this.byId("searchLoadToDateInput");if(k.getValue()){var l=a._getCustomDataForKey(k,"label").getValue()+" ("+k.getValue()+")";c.push(l)}var m=this.byId("searchShortageGreaterThan");if(m.getValue()){var n=a._getCustomDataForKey(m,"label").getValue()+" ("+m.getValue()+")";c.push(n)}var o=this.byId("searchSurplusGreaterThan");if(o.getValue()){var p=a._getCustomDataForKey(o,"label").getValue()+" ("+o.getValue()+")";c.push(p)}var q=this.byId("showDemandLinesChekBox"),r="";r=com.zespri.awct.util.I18NHelper.getText(q.getSelected()?"TXT_GENERIC_YES":"TXT_COLLABORATION_SEARCH_FORM_SHOW_DEMAND_LINES_NO");var s=a._getCustomDataForKey(q,"label").getValue()+" ("+r+")";return c.push(s),c.join(", ")},bindTableSelectDialog:function(a){var b=this.getView(),c=this,d=c._getCustomDataForKey(a,"completeFilterKey").getValue(),e=c._getCustomDataForKey(a,"entitySet").getValue(),f=c._getCustomDataForKey(a,"filterKey").getValue(),g=c._getCustomDataForKey(a,"filter").getValue();sap.ui.core.Fragment.byId("searchFormDialog","searchFieldLabel").setText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_SEARCH_FORM_VALUE_HELP_DIALOG_ALL_LABEL"));var h=function(b){c._oSearchHelpDialog.setGrowingThreshold(b.getData().results.length),c._oSearchHelpDialog.setModel(b);var d={path:"/results",factory:function(a,b){var c=b.getProperty(f);return new sap.m.ColumnListItem({cells:[new sap.m.Text({text:c})]})}};c._oSearchHelpDialog.bindItems(d);for(var e=a.getValue().split(", "),g=0;g<e.length;g++)for(var h=0;h<c._oSearchHelpDialog.getItems().length;h++)e[g]&&e[g]===c._oSearchHelpDialog.getItems()[h].getCells()[0].getText()&&c._oSearchHelpDialog.getItems()[h].setSelected(!0);c._oSearchHelpDialog._dialog.setBusy(!1)};switch(this._oSearchHelpDialog.destroyItems(),this._oSearchHelpDialog.open(),this._oSearchHelpDialog._dialog.setBusy(!0),this._oSearchHelpDialog._dialog.setBusyIndicatorDelay(0),d){case"SupplierID":var i=b.getModel("currentUserDetails").getProperty("/UserID");com.zespri.awct.util.ModelHelper.getJSONModelForRead(e,{urlParameters:{$select:"SupplierID",$filter:"UserID eq '"+i+"'"}},h,function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a),c._oSearchHelpDialog._dialog.setBusy(!1),c._oSearchHelpDialog._dialog.close()});break;case"ShipmentID":com.zespri.awct.util.ModelHelper.getJSONModelForRead(e,{urlParameters:{$select:f,$filter:"Season eq '"+sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason+"'"}},h,function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a),c._oSearchHelpDialog._dialog.setBusy(!1),c._oSearchHelpDialog._dialog.close()});break;case"ShipmentName":case"ShipmentType":com.zespri.awct.util.ModelHelper.getJSONModelForRead(e,{urlParameters:{Season:"'"+sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason+"'"}},h,function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a),c._oSearchHelpDialog._dialog.setBusy(!1),c._oSearchHelpDialog._dialog.close()});break;case"DestinationPort":var j=b.byId("shipmentIDInput"),k=[];c._getCustomDataForKey(j,"filterValue")&&(k=c._getCustomDataForKey(j,"filterValue").getValue());var l="PortType eq 'D'";if(1===k.length)l=l+" and ShipmentID eq '"+k[0]+"'";else if(k.length>1){for(var m=[],n=0;n<k.length;n++)m[n]="ShipmentID eq '"+k[n]+"'";l=l+" and ("+m.join(" or ")+")"}com.zespri.awct.util.ModelHelper.getJSONModelForRead(e,{urlParameters:{$select:f,$filter:l}},h,function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a),c._oSearchHelpDialog._dialog.setBusy(!1),c._oSearchHelpDialog._dialog.close()});break;case"DeliveryID":var o=b.byId("shipmentIDInput"),p=[];c._getCustomDataForKey(o,"filterValue")&&(p=c._getCustomDataForKey(o,"filterValue").getValue());var q="";if(1===p.length)q="ShipmentID eq '"+p[0]+"'";else if(p.length>1){aDeliveryFilterString=[];for(var r=0;r<p.length;r++)aDeliveryFilterString[r]="ShipmentID eq '"+p[r]+"'";q=q+" and ("+aDeliveryFilterString.join(" or ")+")"}com.zespri.awct.util.ModelHelper.getJSONModelForRead(e,{urlParameters:{$select:f,$filter:q}},h,function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a),c._oSearchHelpDialog._dialog.setBusy(!1),c._oSearchHelpDialog._dialog.close()});break;case"ContainerID":var s=[],t=b.byId("shipmentIDInput"),u=[],v=b.byId("destinationPortInput"),w=[],x=b.byId("deliveryNumberInput"),y="",z=[];if(c._getCustomDataForKey(t,"filterValue")&&(s=c._getCustomDataForKey(t,"filterValue").getValue()),c._getCustomDataForKey(v,"filterValue")&&(u=c._getCustomDataForKey(v,"filterValue").getValue()),c._getCustomDataForKey(x,"filterValue")&&(w=c._getCustomDataForKey(x,"filterValue").getValue()),c._getCustomDataForKey(t,"filterValue")){var A="";if(1===s.length)A="ShipmentID eq '"+s[0]+"'";else if(s.length>1){for(var B=[],C=0;C<s.length;C++)B.push("ShipmentID eq '"+s[C]+"'");A="("+B.join(" or ")+")"}z.push(A)}if(c._getCustomDataForKey(v,"filterValue")){var D="";if(1===u.length)D="PortID eq '"+u[0]+"'";else if(u.length>1){for(var E=[],F=0;F<u.length;F++)E.push("PortID eq '"+u[F]+"'");D="("+E.join(" or ")+")"}z.push(D)}if(c._getCustomDataForKey(x,"filterValue")){var G="";if(1===w.length)G="DeliveryID eq '"+w[0]+"'";else if(w.length>1){for(var H=[],I=0;I<w.length;I++)H.push("DeliveryID eq '"+w[I]+"'");G="("+aMultipleDeliveryNumberString.join(" or ")+")"}z.push(G)}y=z.join(" and "),com.zespri.awct.util.ModelHelper.getJSONModelForRead(e,{urlParameters:{$filter:y}},h,function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a),c._oSearchHelpDialog._dialog.setBusy(!1),c._oSearchHelpDialog._dialog.close()});break;default:var J="";if(g){var K=JSON.parse(g);J=K.path+" "+K.operator+" '"+K.value1+"'"}com.zespri.awct.util.ModelHelper.getJSONModelForRead(e,{urlParameters:{$filter:J}},h,function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a),c._oSearchHelpDialog._dialog.setBusy(!1),c._oSearchHelpDialog._dialog.close()})}},handleValueHelpPress:function(a){this._oSearchInputField=a.getSource(),this._oSearchHelpDialog||(this._oSearchHelpDialog=new sap.ui.xmlfragment("searchFormDialog","com.zespri.awct.collab.fragment.SearchFieldSelectionDialog",this),this.getView().addDependent(this._oSearchHelpDialog)),this._oSearchHelpDialog.setTitle(this._getCustomDataForKey(this._oSearchInputField,"label").getValue()),com.zespri.awct.util.CommonHelper.manageNoDataText(this._oSearchHelpDialog._table),this.bindTableSelectDialog(this._oSearchInputField)},handleValueHelpDialogSearch:function(a){var b=a.getParameter("value"),c=this.getView().getController()._getCustomDataForKey(this._oSearchInputField,"filterKey").getValue(),d=new sap.ui.model.Filter(c,sap.ui.model.FilterOperator.Contains,b),e=a.getSource().getBinding("items");e.filter([d])},handleValueHelpDialogOKPress:function(a){var b=this._getCustomDataForKey(this._oSearchInputField,"filterKey").getValue(),c=a.getParameter("selectedContexts"),d=c.map(function(a){return a.getProperty(b)});this._oSearchInputField.setValue(d.join(", ")),this._getCustomDataForKey(this._oSearchInputField,"filterValue")&&this._oSearchInputField.removeCustomData(this._getCustomDataForKey(this._oSearchInputField,"filterValue")),d.length>0&&this._oSearchInputField.addCustomData(new sap.ui.core.CustomData({key:"filterValue",value:d}));var e=this.getView().byId("destinationPortInput"),f=this.getView().byId("deliveryNumberInput"),g=this.getView().byId("containerIDInput");this._oSearchInputField.getId()===this.createId("shipmentIDInput")?(e.setValue(""),this._getCustomDataForKey(e,"filterValue")&&e.removeCustomData(this._getCustomDataForKey(e,"filterValue")),f.setValue(""),this._getCustomDataForKey(f,"filterValue")&&f.removeCustomData(this._getCustomDataForKey(f,"filterValue")),g.setValue(""),this._getCustomDataForKey(g,"filterValue")&&g.removeCustomData(this._getCustomDataForKey(g,"filterValue"))):this._oSearchInputField.getId()===this.createId("deliveryNumberInput")?(g.setValue(""),this._getCustomDataForKey(g,"filterValue")&&g.removeCustomData(this._getCustomDataForKey(g,"filterValue"))):this._oSearchInputField.getId()===this.createId("destinationPortInput")&&(g.setValue(""),this._getCustomDataForKey(g,"filterValue")&&g.removeCustomData(this._getCustomDataForKey(g,"filterValue")))},handleNumberInputValueChanged:function(a){if(this._oSearchInputField=a.getSource(),this._oSearchInputField.setValueState(sap.ui.core.ValueState.None),this._getCustomDataForKey(this._oSearchInputField,"filterValue")&&this._oSearchInputField.removeCustomData(this._getCustomDataForKey(this._oSearchInputField,"filterValue")),this._oSearchInputField.getValue()){var b=this._oSearchInputField.getValue();isNaN(b)||Math.round(b)!==parseFloat(b)?(this._oSearchInputField.setValueState(sap.ui.core.ValueState.Error),this._oSearchInputField.setValueStateText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_SEARCH_FORM_INPUT_VALUE_STATE_TEXT"))):this._oSearchInputField.addCustomData(new sap.ui.core.CustomData({key:"filterValue",value:[parseInt(this._oSearchInputField.getValue(),10)]}))}},_getExternalFormatValue:function(a){var b=a.substring(0,4),c=a.substring(4,6),d=a.substring(6,8);return b+"-"+c+"-"+d},handleFilterPress:function(){jQuery.device.is.desktop?this._applyFilter():(this.byId("continueButton").focus(),window.setTimeout(this._applyFilter.bind(this),0))},_applyFilter:function(){var a=[],b=0;if(this.byId("fruitGroupInput").setValueState(sap.ui.core.ValueState.None),"None"!==this.getView().byId("daysFromLoadInput").getValueState()||"None"!==this.getView().byId("searchShortageGreaterThan").getValueState()||"None"!==this.getView().byId("searchSurplusGreaterThan").getValueState())com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_SEARCH_FORM_TOAST_FILTER_ERROR_MESSAGE"));else{for(;b<this._aSearchInputIDs.length;){var c=this.getView().byId(this._aSearchInputIDs[b]),d=[],e=this._getCustomDataForKey(c,"completeFilterKey").getValue();if(this._getCustomDataForKey(c,"filterValue")){var f=this._getCustomDataForKey(c,"filterValue").getValue();for(var g in f){var h=new sap.ui.model.Filter(e,"EQ",f[g]);d.push(h)}var i=new sap.ui.model.Filter(d,!1);a.push(i)}b+=1}var j=this.byId("fruitGroupInput");if(j.getValue()){var k=this._parseFruitGroupString(j.getValue());if(k.Variety){var l=new sap.ui.model.Filter("Characteristic/Variety","EQ",k.Variety);a.push(l)}if(k.Class){var m=new sap.ui.model.Filter("Characteristic/Class","EQ",k.Class);a.push(m)}if(k.GrowingMethod){var n=new sap.ui.model.Filter("Characteristic/GrowingMethod","EQ",k.GrowingMethod);a.push(n)}}var o=this.getView().byId("searchShortageGreaterThan");if(o.getValue()){var p=new sap.ui.model.Filter(this._getCustomDataForKey(o,"completeFilterKey").getValue(),"GT",o.getValue());a.push(p)}var q=this.getView().byId("searchSurplusGreaterThan");if(q.getValue()){var r=new sap.ui.model.Filter(this._getCustomDataForKey(q,"completeFilterKey").getValue(),"GT",q.getValue());a.push(r)}var s=this.getView().byId("searchLoadFromDateInput");if(s.getValue()){var t=new sap.ui.model.Filter(this._getCustomDataForKey(s,"completeFilterKey").getValue(),"EQ",this._getExternalFormatValue(s.getYyyymmdd()));a.push(t)}var u=this.getView().byId("searchLoadToDateInput");if(u.getValue()){var v=new sap.ui.model.Filter(this._getCustomDataForKey(u,"completeFilterKey").getValue(),"EQ",this._getExternalFormatValue(u.getYyyymmdd()));a.push(v)}var w=this.getView().byId("showDemandLinesChekBox"),x;if(!w.getSelected()){var y=new sap.ui.model.Filter("RecordType","EQ","A");x=y,a.push(x)}var z=new sap.ui.model.Filter(a,!0);z.aFilters.length||(z=null);var A=com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_SUPPLIERORDERS_FILTER_TOOLBAR_TEXT")+this._getFilterString(),B=this._getDownloadFilterString();this.getRouter().navTo("Collaboration/SupplierOrders",{customData:{searchFormFilterObject:z,searchFormFilterString:A,downloadFilterString:B}})}},handleFilterResetPress:function(){var a=this.getView();jQuery.each(this._aSearchInputIDs,function(b,c){var d=a.byId(c);d.setValue(""),a.getController()._getCustomDataForKey(d,"filterValue")&&d.removeCustomData(a.getController()._getCustomDataForKey(d,"filterValue"))}),this.byId("fruitGroupInput").setValue(""),this.byId("searchShortageGreaterThan").setValue(""),this.byId("searchSurplusGreaterThan").setValue(""),this.byId("searchLoadFromDateInput").setValue(""),this.byId("searchLoadToDateInput").setValue(""),this.byId("showDemandLinesChekBox").setSelected(!0)},_parseFruitGroupString:function(a){var b=a.substring(0,2).toUpperCase();b||(b=null);var c=a.substring(2,3).toUpperCase();c||(c=null);var d=a.substring(3,5).toUpperCase();d||(d=null);var e={};return e.Variety=b,e.Class=c,e.GrowingMethod=d,e},_getDownloadFilterString:function(){for(var a=0,b=[],c=this.getView().byId("searchLoadFromDateInput"),d=this.getView().byId("searchLoadToDateInput"),e=this.byId("fruitGroupInput"),f=this.byId("searchShortageGreaterThan"),g=this.byId("searchSurplusGreaterThan"),h=this.getView().byId("showDemandLinesChekBox");a<this._aSearchInputIDs.length;){var i=this.getView().byId(this._aSearchInputIDs[a]),j=[],k="";if(this._getCustomDataForKey(i,"completeFilterKey")&&(k=this._getCustomDataForKey(i,"completeFilterKey").getValue()),this._getCustomDataForKey(i,"filterValue")){var l=this._getCustomDataForKey(i,"filterValue").getValue();for(var m in l){var n;n="DaysFromLoad"===k?k+" eq "+l[m]:k+" eq '"+l[m]+"'",j.push(n)}var o="("+j.join(" or ")+")";b.push(o)}a+=1}if(e.getValue()){var p=this._parseFruitGroupString(e.getValue());if(p.Variety){var q="(Characteristic/Variety eq '"+p.Variety+"')";b.push(q)}if(p.Class){var r="(Characteristic/Class eq '"+p.Class+"')";b.push(r)}if(p.GrowingMethod){var s="(Characteristic/GrowingMethod eq '"+p.GrowingMethod+"')";b.push(s)}}if(c.getValue()){var t="("+this._getCustomDataForKey(c,"completeFilterKey").getValue()+" eq datetime'"+this._getExternalFormatValue(c.getYyyymmdd())+"T00:00:00')";b.push(t)}if(d.getValue()){var u="("+this._getCustomDataForKey(d,"completeFilterKey").getValue()+" eq datetime'"+this._getExternalFormatValue(d.getYyyymmdd())+"T00:00:00')";b.push(u)}if(f.getValue()){var v="("+this._getCustomDataForKey(f,"completeFilterKey").getValue()+" gt "+f.getValue()+")";b.push(v)}if(g.getValue()){var w="("+this._getCustomDataForKey(g,"completeFilterKey").getValue()+" gt "+g.getValue()+")";b.push(w)}if(!h.getSelected()){var x="(RecordType eq '"+com.zespri.awct.util.Enums.AllocationLineRecordType.SupplierOrderLine+"')";b.push(x)}return b.join(" and ")}})}();