/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	!function(){"use strict";jQuery.sap.require({modName:"com.zespri.awct.core.Controller",type:"controller"}),jQuery.sap.require("com.zespri.awct.util.CommonHelper"),jQuery.sap.require("com.zespri.awct.util.Enums"),jQuery.sap.require("com.zespri.awct.util.I18NHelper"),jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper"),jQuery.sap.require("com.zespri.awct.util.ModelHelper"),jQuery.sap.require("com.zespri.awct.util.NotificationHelper"),com.zespri.awct.core.Controller.extend("com.zespri.awct.collab.view.TradeOpportunities",{onInit:function(){this._oSettingsDialog=null,this._oStatusFilter=null,this._oDefaultStatusFilter={},this._oTabBar=null,this._oTradeOpportunitiesTable=null,this._mSortParams=null,this._bUserAuthorized=!1,this._oTabBar=this.byId("tabBarTrade");var a=this.byId("facetFilterListStatus"),b=new sap.ui.model.json.JSONModel({values:[{TradeStatusKey:com.zespri.awct.util.Enums.TradeStatus.Initiated,TradeStatusValue:com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_INITIATED")},{TradeStatusKey:com.zespri.awct.util.Enums.TradeStatus.Accepted,TradeStatusValue:com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_ACCEPTED")},{TradeStatusKey:com.zespri.awct.util.Enums.TradeStatus.Rejected,TradeStatusValue:com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_REJECTED")},{TradeStatusKey:com.zespri.awct.util.Enums.TradeStatus.Expired,TradeStatusValue:com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_EXPIRED")},{TradeStatusKey:com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted,TradeStatusValue:com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_PARTIALLY_ACCEPTED")},{TradeStatusKey:com.zespri.awct.util.Enums.TradeStatus.Cancelled,TradeStatusValue:com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_CANCELLED")}]});a.setModel(b),a.bindItems({path:"/values",template:a.getBindingInfo("items")?a.getBindingInfo("items").template:a.getItems()[0].clone()}),this._oDefaultStatusFilter[com.zespri.awct.util.Enums.TradeStatus.Initiated]=com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_INITIATED"),this._oDefaultStatusFilter[com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted]=com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_PARTIALLY_ACCEPTED"),a.setSelectedKeys(this._oDefaultStatusFilter);var c=this,d=this.byId("facetFilterTrades");com.zespri.awct.util.CommonHelper.manageFacetFilterState(this.byId("tradeOpportunitiesInboundTradeTable"),d),com.zespri.awct.util.CommonHelper.manageFacetFilterState(this.byId("tradeOpportunitiesOutboundTradeTable"),d),com.zespri.awct.util.CommonHelper.manageFacetFilterState(this.byId("tradeOpportunitiesOpenTradeTable"),d),com.zespri.awct.util.CommonHelper.manageNoDataText(this.byId("tradeOpportunitiesInboundTradeTable")),com.zespri.awct.util.CommonHelper.manageNoDataText(this.byId("tradeOpportunitiesOutboundTradeTable")),com.zespri.awct.util.CommonHelper.manageNoDataText(this.byId("tradeOpportunitiesOpenTradeTable")),this.getRouter().attachRoutePatternMatched(function(b){if("Collaboration/TradeOpportunities"===b.getParameter("name"))if(this._bUserAuthorized){if(b.getParameter("arguments").customData){var d=b.getParameter("arguments").customData.filters,e=d.Status,f=d.Type,g={};switch(e){case com.zespri.awct.util.Enums.TradeStatus.Initiated:g[com.zespri.awct.util.Enums.TradeStatus.Initiated]=com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_INITIATED");break;case com.zespri.awct.util.Enums.TradeStatus.Accepted:g[com.zespri.awct.util.Enums.TradeStatus.Accepted]=com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_ACCEPTED");break;case com.zespri.awct.util.Enums.TradeStatus.Rejected:g[com.zespri.awct.util.Enums.TradeStatus.Rejected]=com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_REJECTED");break;case com.zespri.awct.util.Enums.TradeStatus.Expired:g[com.zespri.awct.util.Enums.TradeStatus.Expired]=com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_EXPIRED");break;case com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted:g[com.zespri.awct.util.Enums.TradeStatus.Cancelled]=com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_PARTIALLY_ACCEPTED");break;case com.zespri.awct.util.Enums.TradeStatus.Cancelled:g[com.zespri.awct.util.Enums.TradeStatus.Cancelled]=com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_CANCELLED")}a.setSelectedKeys(g),c._oTabBar.setSelectedKey(f)}switch(c._oTabBar.getSelectedKey()){case"I":c._oTradeOpportunitiesTable=c.byId("tradeOpportunitiesInboundTradeTable");break;case"O":c._oTradeOpportunitiesTable=c.byId("tradeOpportunitiesOutboundTradeTable");break;case"OP":c._oTradeOpportunitiesTable=c.byId("tradeOpportunitiesOpenTradeTable")}c._applyFilter()}else com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper.getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"))},this)},onBeforeRendering:function(){com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP)?this._bUserAuthorized=!0:(this.byId("pageTradeOpportunities")&&this.byId("pageTradeOpportunities").destroy(),this._bUserAuthorized=!1)},handleFacetFilterReset:function(){for(var a=this.byId("facetFilterTrades"),b=a.getLists(),c=0;c<b.length;c++)b[c].setSelectedKeys();var d=this.byId("facetFilterListStatus");d.setSelectedKeys(this._oDefaultStatusFilter),this._applyFilter()},handleListClose:function(){var a=this.byId("facetFilterTrades");a.getFiltersModifiedAfterListOpen()&&this._applyFilter()},_applyFilter:function(){var a=this.byId("facetFilterTrades"),b=a.getLists().filter(function(a){return a.getActive()&&a.getSelectedItems().length>0});this._oStatusFilter=b.length>0?new sap.ui.model.Filter(b.map(function(a){return new sap.ui.model.Filter(a.getSelectedItems().map(function(b){return new sap.ui.model.Filter(a.getKey(),"EQ",b.getKey())}),!1)}),!0):null;var c=this._oTabBar.getSelectedKey(),d=null,e=new sap.ui.model.Filter("Type","EQ",c);switch(d=this._oStatusFilter&&e?new sap.ui.model.Filter([this._oStatusFilter,e],!0):e?e:this._oStatusFilter,this.byId("tabBarTrade").getSelectedKey()){case"I":this._oTradeOpportunitiesTable=this.byId("tradeOpportunitiesInboundTradeTable");break;case"O":this._oTradeOpportunitiesTable=this.byId("tradeOpportunitiesOutboundTradeTable");break;case"OP":this._oTradeOpportunitiesTable=this.byId("tradeOpportunitiesOpenTradeTable")}var f={path:"/TradeSet",factory:jQuery.proxy(this._createTradeOpportunitiesTableRow,this),filters:[d]};if(this._mSortParams&&this._mSortParams.sortItem){var g=this._mSortParams.sortItem.getKey(),h=this._mSortParams.sortDescending;f.sorter=new sap.ui.model.Sorter(g,h)}this._oTradeOpportunitiesTable.bindAggregation("items",f)},handleIconTabBarSelect:function(){this._applyFilter()},_getCountforTrades:function(){var a=this.byId("tabInbound"),b=this.byId("tabOutbound"),c=this.byId("tabOpen");sap.ui.getCore().getRootComponent().getModel().read("/GetCountForTrade",{success:function(d){a.setCount(d.GetCountForTrade.InboundTradeCount),b.setCount(d.GetCountForTrade.OutboundTradeCount),c.setCount(d.GetCountForTrade.OpenTradeCount)},error:function(a){com.zespri.awct.util.NotificationHelper.handleErrorMessage(a)}})},handleItemPress:function(a){var b=a.getSource().getSelectedItem().getBindingContextPath();this.getRouter().navTo("Collaboration/TradeOpportunitiesDetails",{contextPath:b.substr(1)})},handleTableSettingsDialogButtonPress:function(){this._oSettingsDialog||(this._oSettingsDialog=sap.ui.xmlfragment("com.zespri.awct.collab.fragment.TradeOpportunitiesSettingsDialog",this),this.getView().addDependent(this._oSettingsDialog)),this._oSettingsDialog.open()},handleTableSettingsDialogClose:function(a){var b=this._oTradeOpportunitiesTable.getBinding("items"),c=null;a?(c=a.getParameters(),this._mSortParams=c):c=this._mSortParams;var d=[];if(c.sortItem){var e=c.sortItem.getKey(),f=c.sortDescending;d.push(new sap.ui.model.Sorter(e,f))}b.sort(d)},formatStatusText:function(a){return a===com.zespri.awct.util.Enums.TradeStatus.Initiated?com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_INITIATED"):a===com.zespri.awct.util.Enums.TradeStatus.Accepted?com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_ACCEPTED"):a===com.zespri.awct.util.Enums.TradeStatus.Rejected?com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_REJECTED"):a===com.zespri.awct.util.Enums.TradeStatus.Expired?com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_EXPIRED"):a===com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted?com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_PARTIALLY_ACCEPTED"):a===com.zespri.awct.util.Enums.TradeStatus.Cancelled?com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_CANCELLED"):void 0},formatStatusState:function(a){return a===com.zespri.awct.util.Enums.TradeStatus.Initiated?sap.ui.core.ValueState.None:a===com.zespri.awct.util.Enums.TradeStatus.Accepted?sap.ui.core.ValueState.Success:a===com.zespri.awct.util.Enums.TradeStatus.Rejected?sap.ui.core.ValueState.Error:a===com.zespri.awct.util.Enums.TradeStatus.Expired?sap.ui.core.ValueState.Warning:a===com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted?sap.ui.core.ValueState.None:a===com.zespri.awct.util.Enums.TradeStatus.Cancelled?sap.ui.core.ValueState.Error:void 0},_createTradeOpportunitiesTableRow:function(){var a=null;switch(this.byId("tabBarTrade").getSelectedKey()){case com.zespri.awct.util.Enums.TradeType.Inbound:a=new sap.ui.xmlfragment("TradeOpportunitiesInboundTradeTableRow","com.zespri.awct.collab.fragment.TradeOpportunitiesInboundTradeTableRowTemplate",this);break;case com.zespri.awct.util.Enums.TradeType.Outbound:a=new sap.ui.xmlfragment("TradeOpportunitiesOutboundTradeTableRow","com.zespri.awct.collab.fragment.TradeOpportunitiesOutboundTradeTableRowTemplate",this);break;case com.zespri.awct.util.Enums.TradeType.Open:a=new sap.ui.xmlfragment("TradeOpportunitiesOpenTradeTableRow","com.zespri.awct.collab.fragment.TradeOpportunitiesOpenTradeTableRowTemplate",this)}return a},formatParentTradeIDVisibility:function(a){var b=parseInt(a,10);return b?!0:!1}})}();