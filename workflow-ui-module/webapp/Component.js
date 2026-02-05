sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "customer/workflowuimodule/model/models",
    "sap/ui/model/json/JSONModel"
  ],
  function (UIComponent, Device, models, JSONModel) {
    "use strict";

    return UIComponent.extend(
      "customer.workflowuimodule.Component",
      {
        metadata: {
          manifest: "json",
        },

        init: function () {
          UIComponent.prototype.init.apply(this, arguments);

          this.setModel(models.createDeviceModel(), "device");

          var componentData = this.getComponentData();
          if (componentData && componentData.startupParameters) {
            this.setTaskModels();

            this.getInboxAPI().addAction(
              {
                action: "APPROVE",
                label: "Approve",
                type: "accept",
              },
              function () {
                this.completeTask(true);
              },
              this
            );

            this.getInboxAPI().addAction(
              {
                action: "REJECT",
                label: "Reject",
                type: "reject",
              },
              function () {
                this.completeTask(false);
              },
              this
            );
          } else {
            var mockContextModel = new JSONModel({
              businesspartner: "",
              businesspartnercategory: "",
              searchterm1: "",
              organizationbpname1: "",
              organizationbpname2: "",
              to_businesspartnerrole: "",
              country: "",
              cityname: "",
              postalcode: "",
              streetname: "",
              district: "",
              housenumber: "",
              language: "",
              region: "",
              emailaddress: "",
              phonenumber: "",
              bptaxtype: "",
              bptaxnumber: "",
              banknumber: "",
              bankaccount: "",
              bankcountrykey: "",
              customeraccountgroup: "",
              companycode: "",
              reconciliationaccount: "",
              paymentterms: "",
              salesorganization: "",
              distributionchannel: "",
              division: "",
              customerpricingprocedure: "",
              salesgroup: "",
              salesoffice: "",
              customerpricegroup: "",
              customergroup: "",
              itemorderprobabilityinpercent: "",
              customeraccountassignmentgroup: "",
              pricelisttype: "",
              shippingcondition: "",
              incotermsclassification: "",
              incotermstransferlocation: "",
              customerpaymentterms: "",
              salesdistrict: "",
              ordercombinationisallowed: false,
              currency: "",
              partnerfunction: "",
              bpcustomernumber: "",
              departurecountry: "",
              customertaxcategory: "",
              customertaxclassification: "",
              createdBy: "",
              rejectReason: "",
              approved: false
            });
            this.setModel(mockContextModel, "context");
          }
        },

        setTaskModels: function () {
          var startupParameters = this.getComponentData().startupParameters;
          this.setModel(startupParameters.taskModel, "task");

          var taskContextModel = new JSONModel(
            this._getTaskInstancesBaseURL() + "/context"
          );
          
          var that = this;
          taskContextModel.attachRequestCompleted(function() {
            // Transform capitalized property names to lowercase
            var data = taskContextModel.getData();
            var transformedData = that._transformToLowercase(data);
            taskContextModel.setData(transformedData);
          });
          
          this.setModel(taskContextModel, "context");
        },

        _transformToLowercase: function(data) {
          if (!data) return {};
          
          var transformed = {};
          for (var key in data) {
            if (data.hasOwnProperty(key)) {
              // Convert first letter to lowercase
              var lowercaseKey = key.charAt(0).toLowerCase() + key.slice(1);
              transformed[lowercaseKey] = data[key];
            }
          }
          return transformed;
        },

        _transformToCapitalized: function(data) {
          if (!data) return {};
          
          var transformed = {};
          for (var key in data) {
            if (data.hasOwnProperty(key)) {
              // Convert first letter to uppercase
              var capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
              transformed[capitalizedKey] = data[key];
            }
          }
          return transformed;
        },

        _getTaskInstancesBaseURL: function () {
          return (
            this._getWorkflowRuntimeBaseURL() +
            "/task-instances/" +
            this.getTaskInstanceID()
          );
        },

        _getWorkflowRuntimeBaseURL: function () {
          return "/api/public/workflow/rest/v1";
        },

        getTaskInstanceID: function () {
          return this.getModel("task").getData().InstanceID;
        },

        getInboxAPI: function () {
          var startupParameters = this.getComponentData().startupParameters;
          return startupParameters.inboxAPI;
        },

        completeTask: function (approvalStatus) {
          var contextData = this.getModel("context").getData();
          
          contextData.approved = approvalStatus;
          
          this.getModel("context").setData(contextData);
          
          this._patchTaskInstance();
          this._refreshTaskList();
        },

        _patchTaskInstance: function () {
          var contextData = this.getModel("context").getData();
          
          // Transform back to capitalized for workflow
          var transformedData = this._transformToCapitalized(contextData);
          
          var data = {
            status: "COMPLETED",
            context: transformedData
          };

          jQuery.ajax({
            url: this._getTaskInstancesBaseURL(),
            method: "PATCH",
            contentType: "application/json",
            async: false,
            data: JSON.stringify(data),
            headers: {
              "X-CSRF-Token": this._fetchToken(),
            },
            success: function(result) {
              console.log("Task completed successfully");
            },
            error: function(xhr, status, error) {
              console.error("Failed to complete task:", error);
              sap.m.MessageBox.error("Failed to complete task: " + error);
            }
          });
        },

        _fetchToken: function () {
          var fetchedToken;

          jQuery.ajax({
            url: this._getWorkflowRuntimeBaseURL() + "/xsrf-token",
            method: "GET",
            async: false,
            headers: {
              "X-CSRF-Token": "Fetch",
            },
            success(result, xhr, data) {
              fetchedToken = data.getResponseHeader("X-CSRF-Token");
            },
          });
          return fetchedToken;
        },

        _refreshTaskList: function () {
          this.getInboxAPI().updateTask("NA", this.getTaskInstanceID());
        },
      }
    );
  }
);
