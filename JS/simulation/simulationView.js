
$(document).ready(function(){

    $("#simulationContainer").html(writeSimulationForm());

    switchGameParameters($("#gameSelect").val());
    switchDynamicParameters($("#dynamicSelect").val());

    $("#gameSelect").change(function(){
        switchGameParameters($("#gameSelect").val());
    });
    $("#dynamicSelect").change(function() {
        switchDynamicParameters($("#dynamicSelect").val());
    });

    $( "#target" ).submit(function( event ) {

            event.preventDefault();

             var content = JSON.stringify($('form').serializeObject());

                sendRequest("post", "simulation", content,
                /* Response handler */
                function(response) {
              //window.location.href = 'index.html';
              },
                /* Error handler */
              function(errorData) {
                 //window.location.href = 'index.html';
                /*
                * GraphIds request failed
                */
                //showConnectionErrorMessage("Benchmark request failed.");
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

        if(input === "Prisoner's Dilemma") {
            $( "#gameGroup" ).html(writeFormInput("inputDC", "payoffValues", "Temptation") + writeFormInput("inputCC", "payoffValues", "Reward")
            + writeFormInput("inputDD", "payoffValues", "Punishment") + writeFormInput("inputCD", "payoffValues", "Sucker"));
        }
        if(input === "Snow Drift Game") {
            $( "#gameGroup" ).html(writeFormInput("inputDC", "payoffValues", "Temptation") + writeFormInput("inputCC", "payoffValues", "Mutual Cooperation")
            + writeFormInput("inputCD", "payoffValues", "Chicken") + writeFormInput("inputDD", "payoffValues", "Mutual Defection"));
        }
        if(input === "Donation Game") {
            $( "#gameGroup" ).html(writeFormInput("inputDC", "payoffValues", "Benefit") + writeFormInput("inputCC", "payoffValues", "Cost"));
        }
   };


function switchDynamicParameters (input) {
         if(input === "Imitation") {
             $( "#dynamicGroup" ).html("");
         }
         if(input === "Replicator") {
             $( "#dynamicGroup" ).html(writeFormInput("inputDynamicValue", "dynamicValue", "Value"));
       }
   };


function writeSimulationForm() {
  var form = '\
    <form id="target">\
        <div class="form-group">\
            <label for="inputNetwork" class="control-label">Network</label>\
            <input type="text" class="form-control" name="graphId" id="inputNetwork" placeholder="Network">\
        </div>\
        <div class="form-group">\
            <label for="inputGame" class="control-label">Game</label>\
            <select class="form-control" id="gameSelect">\
                <option>Prisoner\'s Dilemma</option>\
                <option>Snow Drift Game</option>\
                <option>Donation Game</option>\
            </select>\
        </div>\
        <div id="gameGroup" class="col-md-11 col-md-offset-1">\
        </div>\
        <div class="form-group">\
            <label for="dynamicSelect" class="control-label">Dynamic</label>\
            <select class="form-control" name="dynamic" id="dynamicSelect">\
                <option>Replicator</option>\
                <option>Imitation</option>\
            </select>\
        </div>\
        <div id="dynamicGroup" class="col-md-11 col-md-offset-1">\
        </div>\
    <div class="form-group">\
     <label for="inputIterations" class="control-label">Iterations</label>\
       <input type="number" min="1" max="200" class="form-control" name="iterations" id="inputIterations" placeholder="1">\
    </div>\
    <div class="form-group">\
       <button type="submit" class="btn btn-default">Simulate</button>\
    </div>\
    </form>\
';
return form;
}


function writeFormInput(id, name, label) {
        return '<div class="form-group">\
          <label for="' + id + '" class=" control-label">' + label + '</label>\
            <input type="number" step="any" class="form-control" name="' + name + '" id="' + id + '" placeholder="0">\
        </div>'
  }
