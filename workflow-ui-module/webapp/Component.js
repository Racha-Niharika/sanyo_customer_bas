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

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */
        init: function () {
          // call the base component's init function
          UIComponent.prototype.init.apply(this, arguments);

          // set the device model
          this.setModel(models.createDeviceModel(), "device");

          // Check if running in workflow context
          var componentData = this.getComponentData();
          if (componentData && componentData.startupParameters) {
            // Running in My Inbox context
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
            // Running standalone for testing - create mock context model
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
          // set the task model
          var startupParameters = this.getComponentData().startupParameters;
          this.setModel(startupParameters.taskModel, "task");

          // set the task context model
          var taskContextModel = new JSONModel(
            this._getTaskInstancesBaseURL() + "/context"
          );
          this.setModel(taskContextModel, "context");
        },

        _getTaskInstancesBaseURL: function () {
          return (
            this._getWorkflowRuntimeBaseURL() +
            "/task-instances/" +
            this.getTaskInstanceID()
          );
        },

        _getWorkflowRuntimeBaseURL: function () {
          // Use the correct API path that goes through xs-app.json routing
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
          // Get all context data
          var contextData = this.getModel("context").getData();
          
          // Set the approved status
          contextData.approved = approvalStatus;
          
          // Update the model with the approval status
          this.getModel("context").setData(contextData);
          
          // Complete the task with all form data
          this._patchTaskInstance();
          this._refreshTaskList();
        },

        _patchTaskInstance: function () {
          var contextData = this.getModel("context").getData();
          
          var data = {
            status: "COMPLETED",
            context: contextData
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
