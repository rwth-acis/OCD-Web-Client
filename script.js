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

var lastGraph;

var change;
var beforeChange;
// Visualization variables
var forceGraph;
var initialGraph;
var lastNode;
var edgeFormat;
// Is the current client the one that "owns" the graph
var host = false;
// Current states of the buttons
var undirectedChecked;
var nodeMode = true;
var nodeSelected = false;


////////// Handle Buttons /////////////

$("#insertGraph").on('click', function(){
    let force = true;
    loadXml(force);
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
$("#editUndirected").on('click', function(){
    updateCheckbox();
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
    lineNumbers: true,
  })
// const editorContainer = $('<div id="editor"/>');
// editor.on('beforeChange', function(e){
//     console.log(e.getValue());
// })

window.addEventListener('load', () => {
    graphId = getUrlVar("graphId");
    if(typeof graphId === 'undefined'){
        initialGraph = {nodes: [{color: 'rgba(204.0,204.0,255.0,1.0)', size: 20, name: 0, id: 0, label: ''}], links: []};
        getForceVis();
    } else {
        host = true;
        initialize();
    }
    
    // getXmlGraph();
    const copyBtn = $('#copyUrl-btn')[0];
    let url =  window.location.origin + window.location.pathname + "?room=" + roomNr;
    $('#copy-url').val(url);
    $(copyBtn).on('click', function(){
        var copyText = $('#copy-url')[0];
        copyText.select();
        navigator.clipboard.writeText(url);
    })
    editorContainer.setAttribute('id', 'editor');
    document.body.insertBefore(editorContainer, null)

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
        hideButtons();
    }
}

// get random unique room Id
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}
function loadXml(force){
    editor.setValue("");
    editor.clearHistory();
    let xml = jsonToXmlL(forceGraph.graphData(), force)
    console.log(xml);
    ytext.insert(0, xml);
}
// Get the Graph visualization and set up visualozation
function initialize() {
    sendRequest("get", "visualization/graph/" + graphId + "/outputFormat/JSON/layout/ORGANIC", "",
        function (response) {
            initialGraph = JSON.parse(response);
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
function applyChanges(){
    lastGraph = JSON.parse(JSON.stringify(forceGraph.graphData()));
    let lastNodes = lastGraph.nodes;
    let lastLinks = lastGraph.links;
    let updated = xmlToJson(ytext.toString());
    let nodes = updated.nodes;
    let links = updated.links;
    console.log("ln: " + JSON.stringify(lastNodes));
    console.log("n: " + JSON.stringify(nodes));
    forceGraph.graphData({
        nodes: nodes,
        links: links
    });
    loadXml(false);
    

    if(!host){
        edgeFormat = JSON.parse(JSON.stringify(links[0]));
    }
}

// Translation functions to synchronize text and vis. graph editor
// Translate the json graph to a XML-Based version

function jsonToXmlL(json, force){
    var xmlString = '';
    let nodes = json.nodes;
    let links = json.links;
    console.log(nodes);
    console.log(links);
    for(var key in nodes){
        xmlString += '<node id="' + nodes[key].id + '"/>\n';
    }
    for(var key in links){
        if(force){
            xmlString += '\n<edge source="' + links[key].source.id + '" target="' + links[key].target.id + '"/>';
        } else {
            xmlString += '\n<edge source="' + links[key].source + '" target="' + links[key].target + '"/>';
        }
        
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
    let nodes = translation.node;
    let links = translation.edge;
    let nodeIds = [];
    let visualization = {
        nodes: [],
        links: []
    };
    for(var key in nodes){
        let curId = nodes[key]._attributes.id;
        nodeIds.push(curId);
        visualization.nodes.push( {color: 'rgba(204.0,204.0,255.0,1.0)', size: 20, name: key, id: curId, label: ''} );
    }
    for(var key in links){
        let src = links[key]._attributes.source;
        let trg = links[key]._attributes.target;
        console.log(nodeIds.some(e => e == src));

        // Filter out edges of nodes that no longer exist
        if((nodeIds.some(e => e == src)) && (nodeIds.some(e => e == trg))){
            visualization.links.push( {style: 0, source: src, target: trg} );
        }
    }
    return visualization;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////// VISUALIZATION /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Initializes the Visualization with all the functionalities and the design
 */
function getForceVis() {
    var links = initialGraph.links;

    if(host) {
        edgeFormat = JSON.parse(JSON.stringify(links[0]));
    }

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
}
// Functions that are executed by events, e.g. left click on a button
function addNode() {
    const { nodes, links } = forceGraph.graphData();
    const id = nodes.length;
    forceGraph.graphData({
        nodes: [...nodes, {"color":"rgba(204.0,204.0,255.0,1.0)","name":id,"id":id,"label":""}],
        links: links
    });
    loadXml(true);
}

// remove edge
function removeLink(link){
    if(!nodeMode){
        let { nodes, links } = forceGraph.graphData();
        for(var key in links){
            if(link.source.id == links[key].source.id && link.target.id == links[key].target.id){
                links.splice(key,1);
                if(undirectedChecked){
                    for(var key2 in links){
                        if(link.source.id == links[key2].target.id && link.target.id == links[key2].source.id){
                            links.splice(key2,1);
                            break;
                        }
                    }
                }
            }

        }
        forceGraph.graphData({ nodes, links });
        loadXml(true); 
    }             
}

function editNode(node) {
    if(nodeMode){
        let {nodes, links} = forceGraph.graphData();
        links = links.filter(l => l.source !== node && l.target !== node);
        nodes.splice(node.id,1);
        // nodes.forEach((n,idx) => {n.id = idx; });
        forceGraph.graphData({ nodes, links });  
        loadXml(true); 
    // Select node or connect 2 selected nodes
    // Connect 2 nodes in both directions if undirected box is checked
    }else {
        // If no node is selected
        if(!nodeSelected){
            lastNode = node;
            node.color = "orange";
        // if the selected nod e is clicked again, unselect it
        } else if(lastNode == node){
            lastNode.color = "rgba(204.0,204.0,255.0,1.0)";  
        // Connect two selected nodes with directed edge
        } else if(!undirectedChecked) {
            const{ nodes, links } = forceGraph.graphData();
            var containsEdge = false;
            var edge = JSON.parse(JSON.stringify(edgeFormat));
            edge.target = node;
            edge.source = lastNode;
            for(key in links){
                if(links[key].source.id == edge.source.id && links[key].target.id == edge.target.id){
                    containsEdge = true;
                    break;
                }
            }
            if(!containsEdge){
                forceGraph.graphData({
                    nodes: nodes,
                    links: [...links, edge]
                })
                lastNode.color = "rgba(204.0,204.0,255.0,1.0)";
            } else {
                lastNode.color = "rgba(204.0,204.0,255.0,1.0)";
                alert("Edge already exists!");
            }
            loadXml(true);     
        // Connect two selected nodes with undirected edge
        } else if(undirectedChecked){
            const{ nodes, links } = forceGraph.graphData();
            var containsEdge = false;
            var secondEdge = JSON.parse(JSON.stringify(edgeFormat));
            var edge = JSON.parse(JSON.stringify(edgeFormat));
            edge.target = node;
            edge.source = lastNode;
            secondEdge.source = node;
            secondEdge.target = lastNode;
            for(var key in links){
                if((links[key].source.id == edge.source.id && links[key].target.id == edge.target.id)){
                    containsEdge = true;
                    break;
                }
            }
            for(var key in links){
                if((links[key].source.id == secondEdge.source.id && links[key].target.id == secondEdge.target.id)){
                    containsEdge = true;
                    break;
                }
            }
            if(!containsEdge){
                    forceGraph.graphData({
                    nodes: nodes,
                    links: [...links, edge, secondEdge]
                    })
                    lastNode.color = "rgba(204.0,204.0,255.0,1.0)"; 
            } else {
                lastNode.color = "rgba(204.0,204.0,255.0,1.0)"; 
                alert("Edge already exists!");
            }   
            loadXml(true);  
        }                        
        nodeSelected = !nodeSelected;
    }                    
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
        let { nodes , links } = forceGraph.graphData();
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
        console.log('CTRL + S');
        applyChanges();
        editor.setCursor({line: cursorPos.line, ch: cursorPos.ch});
    }
  });