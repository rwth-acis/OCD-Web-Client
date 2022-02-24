// browserify script.js -p esmify > bundle.js

import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import CodeMirror from 'codemirror'
import { CodemirrorBinding } from 'y-codemirror'
import 'codemirror/mode/xml/xml.js'
import 'codemirror/addon/edit/closetag.js'
import 'codemirror/addon/edit/closebrackets.js'

var graphId;
var graph;

var roomNr;

getRoomNr();

// Initialize Y Document and Y text to synchronize editors
const ydoc = new Y.Doc();
const provider = new WebrtcProvider(roomNr , ydoc);
const ytext = ydoc.getText('codemirror');
const editorContainer = document.createElement('div');
// const editorContainer = $('<div id="editor"/>');


window.addEventListener('load', () => {
    graphId = getUrlVar("graphId");
    getXmlGraph();
    const copyBtn = $('#copyUrl-btn')[0];
    let url =  window.location.origin + window.location.pathname + "?room=" + roomNr;
    console.log(url);
    $('#copy-url').val(url);
    $(copyBtn).on('click', function(){
        var copyText = $('#copy-url')[0];
        copyText.select();
        navigator.clipboard.writeText(url);
    })

    editorContainer.setAttribute('id', 'editor');
    
    document.body.insertBefore(editorContainer, null)
    // $("#xmlEditor").append(editorContainer);
    //initialize code editor
    const editor = CodeMirror(editorContainer, {
      mode: 'xml',
      autoCloseBrackets : true,
      autoCloseTags : true,
      lineNumbers: true
    })
    editor.setSize("60%","700");

    // Bind the codemirror editor to yjs
    const binding = new CodemirrorBinding(ytext, editor, provider.awareness)
    
    
    // Close connection or connect again
    const connectBtn = (document.getElementById('y-connect-btn'))
    connectBtn.addEventListener('click', () => {
      if (provider.shouldConnect) {
        provider.disconnect()
        connectBtn.textContent = 'Connect'
      } else {
        provider.connect()
        connectBtn.textContent = 'Disconnect'
      }
    })
    // @ts-ignore
    window.example = { provider, ydoc, ytext, binding, Y }
  })

function getRoomNr(){
    let urlVar = getUrlVar("room");
    if(typeof urlVar === 'undefined'){
        roomNr = uuidv4();
    } else {
        roomNr = urlVar;
        console.log("NR: " + roomNr);
        hideButtons();
    }
}

function hideButtons(){
    $("#editSave").css("display","none");
    $("#insertGraph").css("display","none");
}

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

// Get graph as GraphML
function getXmlGraph() {
    sendRequest("get", "graphs/" + graphId, "",
        function (response) {
            // getGraph(response);
            graph = response;

        },
        /* Error handler */
        function (errorData) {
            /*
            * GraphIds request failed
            */
            showConnectionErrorMessage("Graph not received", errorData);
    });
}



// Create Buttons to handle the Graph
// $("#insertGraph").css("display","none");
$("#insertGraph").on('click', function(){
    ytext.insert(0, graph);
})

// var saveBtn = $('<input type="button" class="btn btn-primary" id="saveGraph" value="Save your Graph"/>');
// $(".btn-wrapper").append(saveBtn);
// $("#editSave").css("display","none");
// $("#saveGraph").on('click', function(){
//     let content = "'" + ydoc.getText('codemirror').toString() + "'";

//     sendRequest("put","update/" + graphId, content,
//     function(response) {
//         showSuccess(response);
//         alert("Graph saved");
//     },
//     function (errorData) {
//         showConnectionErrorMessage("Graph update failed", errorData);
//     });
// })








