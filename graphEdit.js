// var visualization;
// var forceGraph;
// var initialGraph;

// var graphId;

// var lastNode;
// var lastId;

// var undirectedChecked;
// var nodeMode = true;
// var nodeSelected = false;

// var edgeFormat;

// $(document).ready(function() {
//     graphId = getUrlVar("graphId");
//     var graphIdQueryExtension = "";
//     if(graphId) {
//         graphIdQueryExtension = "&graphId=" + graphId;
//     }
//     initialize(graphId);
// });
// // GET the graph and execute the visualization function on that graph
// function initialize() {
//     sendRequest("get", "visualization/graph/" + graphId + "/outputFormat/JSON/layout/ORGANIC", "",
//         function (response) {
//             initialGraph = JSON.parse(response);
//             console.log(initialGraph);
//             getForceVis();
//         },
//         /* Error handler */
//         function (errorData) {
//             /*
//             * GraphIds request failed
//             */
//             showConnectionErrorMessage("Visualization was not received.", errorData);
//         });
// }
 
// function getForceVis() {

//     var nodes = initialGraph.nodes;
//     var links = initialGraph.links;
//     console.log("vis Links: " + links);

//     if(Object.keys(links) === 0){
//         edgeFormat = {style:0};
//     } else {
//         edgeFormat = JSON.parse(JSON.stringify(links[0]));
//     }
//     const elem = document.getElementById("editForceVisualizationGraphic");

//     // First initialization of the Visualiuation
//     // Setup of the general desing
//     forceGraph = ForceGraph()(elem)
//         .onNodeClick(editNode)
//         .onBackgroundRightClick(addNode)
//         .onLinkClick(removeLink)
//         .backgroundColor("#fafafa")
//         .centerAt(0,0)
//         .graphData(initialGraph)
//         .linkWidth(3)
//         .linkDirectionalArrowLength(3)
//         .linkDirectionalArrowRelPos(1)
//         .d3Force("center", d3.forceCenter().strength(1))
//         .d3Force("charge", d3.forceManyBody()
//                                 .strength(-10)
//                                 .distanceMin(0.5)
//                                 .distanceMax(50)
//                                 )
//     // Set Dimensions and Parameters for the force engine   
//     forceGraph.d3Force("collide", d3.forceCollide(forceGraph.nodeRelSize()))
//         .d3Force("link",d3.forceLink(forceGraph.links).distance(20))

//     forceGraph.width($('.editForceVisualizationContent').width());
//     forceGraph.height($('.editForceVisualizationContent').height());
    
//     // Functions that are executed by events, e.g. left click on a button
//     function addNode(e) {
//         const { nodes, links } = forceGraph.graphData();
//         const id = nodes.length;
//         forceGraph.graphData({
//             nodes: [...nodes, {"color":"rgba(204.0,204.0,255.0,1.0)","name":id,"id":id,"label":""}],
//             links: links
//     });
//     }
//     function editNode(node) {
//         if(nodeMode){
//             let {nodes, links} = forceGraph.graphData();
//             links = links.filter(l => l.source !== node && l.target !== node);
//             nodes.splice(node.id,1);
//             nodes.forEach((n,idx) => {n.id = idx; });
//             forceGraph.graphData({ nodes, links });  
//             console.log(links);

//         // Select node or connect 2 selected nodes
//         // Connect 2 nodes in both directions if undirected box is checked
//         }else {
//             // If no node is selected
//             if(!nodeSelected){
//                 lastNode = node;
//                 lastId = node.id;
//                 node.color = "orange";
//             // if the selected nod e is clicked again, unselect it
//             } else if(lastNode == node){
//                 lastNode.color = "rgba(204.0,204.0,255.0,1.0)";  
//             // Connect two selected nodes with directed edge
//             } else if(!undirectedChecked) {
//                 const{ nodes, links } = forceGraph.graphData();
//                 var containsEdge = false;
//                 var edge = JSON.parse(JSON.stringify(edgeFormat));
//                 edge.target = node;
//                 edge.source = lastNode;
//                 console.log(links);
//                 for(key in links){
//                     if(links[key].source.id == edge.source.id && links[key].target.id == edge.target.id){
//                         containsEdge = true;
//                         break;
//                     }
//                 }
//                 if(!containsEdge){
//                     console.log("ho");
//                     forceGraph.graphData({
//                         nodes: nodes,
//                         links: [...links, edge]
//                     })
//                     lastNode.color = "rgba(204.0,204.0,255.0,1.0)";
//                 } else {
//                     lastNode.color = "rgba(204.0,204.0,255.0,1.0)";
//                     alert("Edge already exists!");
//                 }
                    
//             // Connect two selected nodes with undirected edge
//             } else if(undirectedChecked){
//                 const{ nodes, links } = forceGraph.graphData();
//                 var containsEdge = false;
//                 var secondEdge = JSON.parse(JSON.stringify(edgeFormat));
//                 var edge = JSON.parse(JSON.stringify(edgeFormat));
//                 edge.target = node;
//                 edge.source = lastNode;
//                 secondEdge.source = node;
//                 secondEdge.target = lastNode;

//                 for(key in links){
//                     if((links[key].source.id == edge.source.id && links[key].target.id == edge.target.id)){
//                         containsEdge = true;
//                         break;
//                     }
//                 }
//                 for(key in links){
//                     if((links[key].source.id == secondEdge.source.id && links[key].target.id == secondEdge.target.id)){
//                         containsEdge = true;
//                         break;
//                     }
//                 }
//                 if(!containsEdge){
//                         forceGraph.graphData({
//                         nodes: nodes,
//                         links: [...links, edge, secondEdge]
//                         })
//                         lastNode.color = "rgba(204.0,204.0,255.0,1.0)"; 
//                 } else {
//                     lastNode.color = "rgba(204.0,204.0,255.0,1.0)"; 
//                     alert("Edge already exists!");
//                 }

                    
//             }              
                        
//             nodeSelected = !nodeSelected;
//         }                    
//     }
// }
// // remove edge
// function removeLink(link){
//     if(!nodeMode){
//         let { nodes, links } = forceGraph.graphData();
//         for(key in links){
//             if(link.source.id == links[key].source.id && link.target.id == links[key].target.id){
//                 links.splice(key,1);
//                 if(undirectedChecked){
//                     for(key2 in links){
//                         if(link.source.id == links[key2].target.id && link.target.id == links[key2].source.id){
//                             links.splice(key2,1);
//                             break;
//                         }
//                     }
//                 }
//             }

//         }
//         forceGraph.graphData({ nodes, links });
//     }                
// }

// // remove the node
// function removeNode(node){
//     let {nodes, links} = forceGraph.graphData();
//     links = links.filter(l => l.source !== node && l.target !== node);
//     nodes.splice(node.id,1);
//     nodes.forEach((n,idx) => {n.id = idx;});
//     forceGraph.graphData({ nodes, links });  
// }

// // Button and Checkbox functionalities
// function updateCheckbox(){
//     undirectedChecked = $("#editUndirected").is(":checked");
//     if(undirectedChecked){
//         forceGraph.linkDirectionalArrowLength(0);
//     }else{
//         forceGraph.linkDirectionalArrowLength(3);
//     }
// }
// function reloadGraph(){
//     if (confirm("Reload: Unsaved changes will be lost!") == true) {
//         initialize();
//     }
// }
// function deleteGraph(){
//     if (confirm("Are you sure you want to delete your graph?") == true){
//         let { nodes , links } = forceGraph.graphData();
//         forceGraph.graphData({
//             nodes: [],
//             links: []
//         })
//     }
    
// }
// function saveGraph() {
//     var content = jsonToXml();
//     console.log(content);
//     console.log(graphId);

//     sendRequest("put","update/" + graphId, content,
//     function(response) {
//         showSuccess(response);
//         alert("Graph saved");
//     },
//     function (errorData) {
//         showConnectionErrorMessage("Graph update failed", errorData);
//     });
// }
// function switchMode() {
//     nodeMode = !nodeMode;  
//     if (!nodeMode) {
//         $("#modeBtn").html("Edge Mode");
//     }else {
//         $("#modeBtn").html("Node Mode");
//     }
// }
// // Shortcuts for the Buttons:
// // Switch modes by pressing N
// document.addEventListener('keydown', function(e) {
//     const key = e.code;
//     if(key === "KeyN"){
//         switchMode();
//     }
// })
// // Delete selected node by pressing DELETE
// document.addEventListener('keydown', function(e) {
//     const key = e.key;
//     if(key === "Delete" && nodeSelected){
//         removeNode(lastNode);
//         nodeSelected = false;
//         console.log("pressed delete");
//         }
// })

// // Translate JSON graph format to XML String
// function jsonToXml(){
//     var xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n<key attr.name="number" attr.type="integer" for="node" id="number"/>\n<key attr.name="label" attr.type="string" for="edge" id="label"/>\n<graph edgedefault="directed">'
//     let { nodes, links } = forceGraph.graphData();
//     console.log(links);
//     for(var key in nodes){
//         xmlString += '\n<node id="' + nodes[key].id + '">';
//         xmlString += '\n</node>'
//     }
//     for(var key in links){
//         xmlString += '\n<edge source="' + links[key].source.id + '" target="' + links[key].target.id + '">';
//         xmlString += '\n</edge>'
//     }
//     xmlString += '\n</graph>';
//     xmlString += '\n</graphml>';
//     return xmlString
// }
// function initCollabSession(){
//     const roomNumber = uuidv4();
//     window.location.href = "collaborativeEditing.html?graphId=" + graphId + "&room=" + roomNumber;
// }
