
$(document).ready(function(){

    $("#simulationContainer").html(writeSimulationForm("Simulate"));

    switchGameParameters($("#gameSelect").val());
    switchDynamicParameters($("#dynamicSelect").val());

    $("#gameSelect").change(function(){
        switchGameParameters($("#gameSelect").val());
    });
    $("#dynamicSelect").change(function() {
        switchDynamicParameters($("#dynamicSelect").val());
    });
    $("#conditionSelect").change(function() {
        switchConditionParameters($("#conditionSelect").val());
    });

    $( "#target" ).submit(function( event ) {

            event.preventDefault();
            $("#runningSimulationCollapsable").find(".collapsableCollapseBtn").click();

             var jsonObject = ($("#target").serializeObject());
             jsonObject.graphId = graphId;
             var content = JSON.stringify(jsonObject);


             console.log(content);
              showInfo("simulation in progress");

                buttonSubmitStart("runSimulationBtn");

                sendJsonRequest("post", "simulation", content,
                /* Response handler */
                function(response) {
                    showSuccess("simulation done");
                    //console.log("test");
              },
                /* Error handler */
              function(errorData) {
                  buttonSubmitEnd("runSimulationBtn");
                  showWarning(errorData);
              }, "application/json");
    });


});

$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};


function switchGameParameters (input) {

          $( "#gameParamRows" ).html("");

        if(input === "Prisoner's Dilemma") {
            $( "#gameParamRows" ).html(writeFormInput("inputDC", "payoffDC", "Temptation") + writeFormInput("inputCC", "payoffCC", "Reward")
            + writeFormInput("inputDD", "payoffDD", "Punishment") + writeFormInput("inputCD", "payoffCD", "Sucker"));
        }
        if(input === "Snow Drift Game") {
            $( "#gameParamRows" ).html(writeFormInput("inputDC", "payoffDC", "Temptation") + writeFormInput("inputCC", "payoffCC", "Mutual Cooperation")
            + writeFormInput("inputCD", "payoffCD", "Chicken") + writeFormInput("inputDD", "payoffDD", "Mutual Defection"));
        }
        if(input === "Prisoner's Dilemma - Cost Variant") {
            $( "#gameParamRows" ).html(writeFormInput("inputDC", "benefit", "Benefit") + writeFormInput("inputCC", "cost", "Cost"));
        }
   };


function switchDynamicParameters (input) {

        $( "#dynamicParamRows" ).html("");

         if(input === "Replicator") {
             $( "#dynamicParamRows" ).html(writeFormInput("inputDynamicValue", "dynamicValue", "Value"));
         }
   };

   function switchConditionParameters (input) {

        $( "#conditionParamRows" ).html("");

        if(input === "Stationary State" || input === "STATIONARY_STATE") {
          $( "#breakParamRows" ).html(''
          + writeParameterRow("inputMinIterations", "mitIterations", "minIterations", 100)
          + writeParameterRow("inputMaxIterations", "maxIterations", "maxIterations", 1000)
          + writeParameterRow("inputWindow", "timeWindow", "timeWindow", 100));
        }

        if(input === "Fixed Iterations" || input === "FIXED_ITERATIONS") {
          $( "#breakParamRows" ).html(''
          + writeParameterRow("inputMaxIterations", "maxIterations", "maxIterations", 40));
        }
    };


function writeSimulationForm(submit) {
  return '<form id="target" class="">\
            <div class="form-group row">\
              <label for="inputName" class="col-sm-2 col-form-label">Name</label>\
              <div class="col-sm-10">\
                <input type="text" class="form-control" name="name" id="inputName" placeholder="">\
              </div>\
            </div>\
          <div class="form-group row">\
            <label for="inputIterations" class="col-sm-2 col-form-label control-label">Iterations</label>\
            <div class="col-sm-10">\
              <input type="number" min="1" max="400" class="form-control" name="iterations" id="inputIterations" placeholder="10">\
            </div>\
          </div>\
          <div class="form-group row">\
            <label for="inputGame" class="col-sm-2 col-form-label">Game</label>\
            <div class="col-sm-10">\
              <select class="form-control custom-select" id="gameSelect">\
                <option>SELECT</option>\
                <option>Prisoner\'s Dilemma</option>\
                <option>Snow Drift Game</option>\
              </select>\
            </div>\
          </div>\
          <div class="col-sm-10" id="gameParamRows">\
          </div>\
          <div class="form-group row">\
            <label for="dynamicSelect" class="col-sm-2 control-label">Dynamic</label>\
            <div class="col-sm-10">\
              <select class="form-control custom-select" name="dynamic" id="dynamicSelect">\
                 <option>SELECT</option>\
                 <option>Replicator</option>\
                 <option>Imitation</option>\
                 <option>Moran</option>\
                 <option>Win-Stay Lose-Shift</option>\
              </select>\
            </div>\
          </div>\
          <div class="col-sm-10" id="dynamicParamRows">\
          </div>\
    <div class="form-group row">\
        <label for="inputGame" class="col-sm-2 control-label">BreakCondition</label>\
        <div class="col-sm-10">\
        <select class="form-control custom-select" name="condition" id="conditionSelect">\
           <option>SELECT</option>\
           <option>Fixed Iterations</option>\
           <option>Stationary State</option>\
        </select>\
        </div>\
    </div>\
    <div class="col-sm-10" id="breakParamRows">\
    </div>\
    <div class="form-group">\
       <button id="runSimulationBtn" type="submit" class="btn btn-primary">\
       <span class="submitText">' + submit + '</span>\
      <span class="submitSpinner spinner-border spinner-border-sm" role="status" aria-hidden="true" hidden></span>\
    </div>\
    </form>';
  }

function writeParameterRow(id, name, label, placeholder) {
    var paramRow = '<div class="form-group row">'
    + '<label class="col-sm-5 col-form-label">' + label  +'</label>'
    + '<div class="col-sm-7">'
    + '<input type="text" class="form-control" id="'+ id + '"name="' +name +'" placeholder="' + placeholder + '">'
    + '</div></div>'
    return paramRow;
}

function writeFormInput(id, name, label) {
        return writeParameterRow(id, name, label, "0");
  }
