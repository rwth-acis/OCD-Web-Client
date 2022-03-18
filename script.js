// browserify script.js -p esmify > bundle.js

import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import CodeMirror from 'codemirror'
import { CodemirrorBinding } from 'y-codemirror'
// import { parser } from 'xml2json'
import convert from 'xml-js'
import 'codemirror/mode/xml/xml.js'
import 'codemirror/addon/edit/closetag.js'
import 'codemirror/addon/edit/closebrackets.js'

// initial parameters
var graphId;
var initialGraph;
var roomNr;
var tutorial;

var autoSave = true;
var timeoutHandle;

// Visualization variables
var forceGraph;
var initialGraph;
var lastNode;
// Is the current client the one that "owns" the graph
var host = false;
// Current states of the buttons
var undirectedChecked;
var nodeMode = true;
var nodeSelected = false;


////////// Handle Buttons /////////////

$("#insertGraph").on('click', function(){
    loadXml();
})
$("#apply").on('click', function(){
    applyChanges();
})
$("#modeBtn").on('click', function(){
    switchMode();
})
$("#editReload").on('click', function(){
    reloadGraph();
})
$("#editDelete").on('click', function(){
    deleteGraph();
})
$("#editSave").on('click', function(){
    saveGraph();
})
$("#download").on('click', function(){
    downloadString(jsonToXml(), "txt", "graph");
})
$("#editUndirected").on('click', function(){
    updateCheckbox();
})
$("#autoApply").on('click', function(){
    autoSave = $("#autoApply").is(":checked");
})
// hide buttons that only the host of the session should see
function hideButtons(){
    $("#editSave").css("display","none");
}
// Either create a room number or get the one from the url
getRoomNr();

// Initialize Y Document and Y text to synchronize editors
const ydoc = new Y.Doc();
const provider = new WebrtcProvider(roomNr , ydoc);
const ytext = ydoc.getText('codemirror');
const editorContainer = document.createElement('div');

//initialize code editor
const editor = CodeMirror(editorContainer, {
    mode: 'xml',
    autoCloseBrackets : true,
    autoCloseTags : true,
    lineNumbers: true
  })
  provider.disconnect();

// detect change and update visualization after 500 ms
editor.on('change', function(cm){
    if(autoSave){
        window.clearTimeout(timeoutHandle);
        timeoutHandle = window.setTimeout(function(){
            applyChanges(false);
        }, 500)
    }
})

window.addEventListener('load', () => {
    graphId = getUrlVar("graphId");

    // Initialize editor and load graph or set standard graph if the user is not the host
    if(typeof graphId === 'undefined'){
        initialGraph = {nodes: [
            {color: 'rgba(204.0,204.0,255.0,1.0)', size: 20, name: "0", id: "0", label: ''},
            {color: 'rgba(204.0,204.0,255.0,1.0)', size: 20, name: "1", id: "1", label: ''},
            {color: 'rgba(204.0,204.0,255.0,1.0)', size: 20, name: "2", id: "2", label: ''}],
            links: [{style: 0,
                 source: "0",
                 target: "1"},
                 {style: 0,
                    source: "1",
                    target: "2"},
                {style: 0,
                    source: "2",
                    target: "0"}
                ]};
        getForceVis();
    } else {
        host = true;
        initialize();
    }
    
    const copyBtn = $('#copyUrl-btn')[0];
    let url =  window.location.origin + window.location.pathname + "?room=" + roomNr;
    $('#copy-url').val(url);
    $(copyBtn).on('click', function(){
        var copyText = $('#copy-url')[0];
        copyText.select();
        navigator.clipboard.writeText(url);
    })
    
    // Set editor size with standard text
    editorContainer.setAttribute('id', 'editor');
    document.body.insertBefore(editorContainer, null)
    editor.setSize("60%","700");
    ytext.insert(0, tutorial);
    // Bind the codemirror editor to yjs
    const binding = new CodemirrorBinding(ytext, editor, provider.awareness)

    // Connection button
    const connectBtn = (document.getElementById('y-connect-btn'))
    connectBtn.addEventListener('click', () => {
      if (provider.shouldConnect) {
        provider.disconnect()
        connectBtn.textContent = 'Connect'
      } else {
          if(!host){
            editor.setValue("");
            editor.clearHistory();
          }
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
        hideButtons();
    }
}

// get random unique room Id
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}
function loadXml(){
    editor.setValue("");
    editor.clearHistory();
    let xml = jsonToXmlL(forceGraph.graphData())
    ytext.insert(0, xml);
}
// Get the Graph visualization and set up visualozation
function initialize() {
    sendRequest("get", "visualization/graph/" + graphId + "/outputFormat/JSON/layout/ORGANIC", "",
        function (response) {
            initialGraph = JSON.parse(response);
            console.log(initialGraph);
            getForceVis();
        },
        /* Error handler */
        function (errorData) {
            /*
            * GraphIds request failed
            */
            showConnectionErrorMessage("Visualization was not received.", errorData);
        });
}
// Translate the xml to a JSON format and look for changes in the graph and apply those

function applyChanges(edgeUpdate=true){
    const { nodes, links } = forceGraph.graphData();

    let updated = xmlToJson(ytext.toString());
    let uNodes = updated.nodes;
    let uLinks = updated.links;
    let delNodes = [];
    console.log(uLinks);
    console.log(links);
    // Remove deleted nodes from the original array
    for(var key in nodes){
        if(!(uNodes.some(e => e.id == nodes[key].id))){
            delNodes.push(nodes[key]);
        }
    }
    for(var key in delNodes){
        deleteNode(delNodes[key]);
    }
    //Check if updated nodes and nodes are the same
    for(var key in uNodes){
        if(!(nodes.some(e => e.id == uNodes[key].id))){
            addNode(parseInt(uNodes[key].id));
        }
    }
    // Update Edges in seperate function to guarantee execution after nodes were created
    updateEdges(uLinks);
    if(edgeUpdate){
        loadXml();
    }
}

// Update Edges in visualization
function updateEdges(uLinks){
    let delLinks = [];
    const { nodes, links } = forceGraph.graphData();
    for(var key in links){
        if(!(uLinks.some(e => (e.source == links[key].source.id) && (e.target == links[key].target.id)))){
            delLinks.push(links[key]);
        }
    }
    for(var key in delLinks){
        var index = links.indexOf(delLinks[key]);
        links.splice(index, 1);
    }
    for(var key in uLinks){
        if(!(links.some(e => (e.source.id == uLinks[key].source) && (e.target.id == uLinks[key].target)))){
            var source = uLinks[key].source;
            var target = uLinks[key].target;
            var src = nodes.find(e => e.id == source);
            var trg = nodes.find(e => e.id == target);

            addEdge(src, trg);
        }
    }
}

// Translation functions to synchronize text and vis. graph editor
// Translate the json graph to a XML-Based version
function jsonToXmlL(json){
    var xmlString = '';
    let nodes = json.nodes;
    let links = json.links;
    for(var key in nodes){
        xmlString += '<node id="' + nodes[key].id + '"/>\n';
    }
    for(var key in links){
        xmlString += '\n<edge source="' + links[key].source.id + '" target="' + links[key].target.id + '"/>';

    }
    return xmlString
}
// Translate JSON graph format to XML String
function jsonToXml(){
    var xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n<key attr.name="number" attr.type="integer" for="node" id="number"/>\n<key attr.name="label" attr.type="string" for="edge" id="label"/>\n<graph edgedefault="directed">'
    let { nodes, links } = forceGraph.graphData();
    for(var key in nodes){
        xmlString += '\n<node id="' + nodes[key].id + '">';
        xmlString += '\n</node>'
    }
    for(var key in links){
        xmlString += '\n<edge source="' + links[key].source.id + '" target="' + links[key].target.id + '">';
        xmlString += '\n</edge>'
    }
    xmlString += '\n</graph>';
    xmlString += '\n</graphml>';
    return xmlString
}
// Translate the XML-Based form to a json graph
/**
 * 
 * @param {xml as a string} xml 
 * @returns a json object that fits the force visualization
 */
function xmlToJson(xml){
    let translation = JSON.parse(convert.xml2json(xml, {compact: true, spaces:2}));
    let tNodes = translation.node;
    let tLinks = translation.edge;
    let nodeIds = [];
    let visualization = {
        nodes: [],
        links: []
    };
    translate:{
        for(var key in tNodes){
            let curId = tNodes[key]._attributes.id;
            if(nodeIds.some(e => e == curId)){
                alert("Error: Id's must be unique: Id " + curId + " used multiple times!");
                break translate;
            } else {
                nodeIds.push(curId);
            }
            
            visualization.nodes.push( {color: 'rgba(204.0,204.0,255.0,1.0)', size: 20, name: key, id: curId, label: ''} );
        }
        for(var key in tLinks){
            let src = tLinks[key]._attributes.source;
            let trg = tLinks[key]._attributes.target;

            // Filter out edges of nodes that no longer exist
            if((nodeIds.some(e => e == src)) && (nodeIds.some(e => e == trg))){
                visualization.links.push( {style: 0, source: src, target: trg} );
            }
        }
        return visualization;
    }
}

function downloadString(text, fileType, fileName) {
    var blob = new Blob([text], { type: fileType });
    var a = document.createElement('a');
    a.download = fileName;
    a.href = URL.createObjectURL(blob);
    a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 1500);
  }

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////// VISUALIZATION /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Initializes the Visualization with all the functionalities and the design
 */
function getForceVis() {
    const elem = document.getElementById("editForceVisualizationGraphic");

    // First initialization of the Visualiuation
    // Setup of the general desing
    forceGraph = ForceGraph()(elem)
        .onNodeClick(editNode)
        .onBackgroundRightClick(addNode)
        .onLinkClick(removeLink)
        .backgroundColor("#fafafa")
        .centerAt(0,0)
        .graphData(initialGraph)
        .linkWidth(3)
        .linkDirectionalArrowLength(3)
        .linkDirectionalArrowRelPos(1)
        .d3Force("center", d3.forceCenter().strength(1))
        .d3Force("charge", d3.forceManyBody()
                                .strength(-10)
                                .distanceMin(0.5)
                                .distanceMax(50)
                                )
    // Set Dimensions and Parameters for the force engine   

    forceGraph.d3Force("collide", d3.forceCollide(forceGraph.nodeRelSize()))
        .d3Force("link",d3.forceLink(forceGraph.links).distance(20))

    forceGraph.width($('.editForceVisualizationContent').width());
    forceGraph.height($('.editForceVisualizationContent').height());
    const { nodes } = forceGraph.graphData();
    for(var n in nodes){
        nodes[n].name = nodes[n].id.toString();
    }
}
// Functions that are executed by events, e.g. left click on a button
function addNode(ident) {
    const { nodes, links } = forceGraph.graphData();
    var id;
    if(typeof ident == "number"){
        id = ident;
    } else {
        id = Math.max.apply(Math, nodes.map(function(o) { return o.id; }))+1;
    }
    forceGraph.graphData({
        nodes: [...nodes, {"color":"rgba(204.0,204.0,255.0,1.0)","name":id,"id":id,"label":""}],
        links: links
    });
    if(!(typeof ident =="number")){
        loadXml();
    }
    
}

// Remove selected edge
function removeLink(link){
    if(!nodeMode){
        let { nodes, links } = forceGraph.graphData();
        // console.log(links);
        console.log(link);
        var index = links.indexOf(link);
        
        // console.log(index);
        if(link == links[index] && index != -1){
            links.splice(index,1);
        }
        
        if(undirectedChecked){
            var revLink = links.find(e => e.source == link.target && e.target == link.source);
            var revIndex = links.indexOf(revLink);
            if(revLink == links[revIndex] && revIndex != -1){
                links.splice(revIndex,1);
            }
        }
        loadXml();
    }             
}
function deleteNode(node){
    let {nodes, links} = forceGraph.graphData();
    links = links.filter(l => l.source !== node && l.target !== node);
    for(var key in nodes){
        if(node.id == nodes[key].id){
            nodes.splice(key, 1);
        }
    }
    // nodes.splice(node.id,1);
    // nodes.forEach((n,idx) => {n.id = idx; });
    forceGraph.graphData({ nodes, links });  
    for(var n in nodes){
        nodes[n].name = nodes[n].id.toString();
    }
}
function addEdge(source, target){
    const{ nodes, links } = forceGraph.graphData();
    var edge = {};
    edge.target = target;
    edge.source = source;
    if(links.some(e => (e.source.id == edge.source.id) && (e.target.id == edge.target.id))){
        alert("Edge already exists!");
    } else {
        forceGraph.graphData({
            nodes: nodes,
            links: [...links, edge]
        })
    }
}
function editNode(node) {
    if(nodeMode){
        deleteNode(node);
    // Select node or connect 2 selected nodes
    // Connect 2 nodes in both directions if undirected box is checked
    } else {
        // If no node is selected
        if(!nodeSelected){
            lastNode = node;
            node.color = "orange";

        // if the selected nod e is clicked again, unselect it
        } else if(lastNode == node){
            lastNode.color = "rgba(204.0,204.0,255.0,1.0)"; 

        // Connect two selected nodes with directed edge
        } else if(!undirectedChecked) {
            addEdge(lastNode, node);
            lastNode.color = "rgba(204.0,204.0,255.0,1.0)";

        // Connect two selected nodes with undirected edge
        } else if(undirectedChecked){
            addEdge(node,lastNode);
            addEdge(lastNode, node);
            lastNode.color = "rgba(204.0,204.0,255.0,1.0)";
        }                    
        nodeSelected = !nodeSelected;
    } 
    loadXml();                    
}


// Button and Checkbox functionalities
function updateCheckbox(){
    undirectedChecked = $("#editUndirected").is(":checked");
    if(undirectedChecked){
        forceGraph.linkDirectionalArrowLength(0);
    }else{
        forceGraph.linkDirectionalArrowLength(3);
    }
}
function reloadGraph(){
    if (confirm("Reload: Unsaved changes will be lost!") == true) {
        initialize();
    }
}
function deleteGraph(){
    if (confirm("Are you sure you want to delete your graph?") == true){
        forceGraph.graphData({
            nodes: [],
            links: []
        })
    }
    
}
function saveGraph() {
    var content = jsonToXml();
    sendRequest("put","update/" + graphId, content,
    function(response) {
        showSuccess(response);
        alert("Graph saved");
    },
    function (errorData) {
        showConnectionErrorMessage("Graph update failed", errorData);
    });
}
function switchMode() {
    nodeMode = !nodeMode;  
    if (!nodeMode) {
        $("#modeBtn").html("Edge Mode");
    }else {
        $("#modeBtn").html("Node Mode");
    }
}


// Ctr+s to save xml
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') {
        let cursorPos = editor.getCursor();
        // Prevent the Save dialog to open
        e.preventDefault();
        // Place your code here
        applyChanges();
        editor.setCursor({line: cursorPos.line, ch: cursorPos.ch});
    }
  });

tutorial = `Welcome to the collaborative graph editor:
Visual Editor:
-Use right click to add nodes and left click to delete them.

-By switching to edge mode (Node Mode button), you can delete edges 
by clicking on them and add edges by selecting 2 nodes

-If you want to undo your changes, you can click on Reload Graph
to get back to the initial graph. Please note that this will reload the graph, 
so it will load the last graph you saved!

-Clicking on the undirected checkbox will enable undirected mode. 
Here the edges are displayed without arrows and adding/deleting edges will affect both directions.

Text Editor:
-Here you can edit the xml-based code of your graph.

-You can add edges by adding a "<node id="id"/>" or "<node id="id"></node>" tag.
Edges need a target and source attribute.

-Auto translate is enabled by default, however, you can disable it to save some RAM.

Collaborative session:
-Copy the invite link and send it to your colleagues. 
They will need a learning layers account to get access.

(The collaborative session is hostet on your browsers, 
make sure you save your progress before closing your browser)

Click on insert graph to begin`;