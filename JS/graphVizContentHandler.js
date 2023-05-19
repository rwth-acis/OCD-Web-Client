let clusterNodes = new Map()

/* Delete graph button handler */
function closeDatabaseInfo() {
    document.getElementById("DatabaseItemList").hidden = true
    document.getElementById("DatabaseItemList").removeChild(document.getElementById("dbList"))
    document.getElementById("DatabaseItemListCrumb").innerHTML = "";
}

function toggleClusterForces(doCluster) {
    if (doCluster) {
        forceGraph.d3Force('link')
            .strength(function (link) {
                if (link["source"].key === "CLUSTER_CENTER_NODE") {
                    return 2
                }
                if (clusterNodes.get(link["source"].key) !== undefined) {
                    return clusterNodes.get(link["target"].key) !== undefined ? 0.7 : 1
                    //return link["target"]["name"] === "1" ? 5 : 1 / Math.min(count(link.source), count(link.target)); //link["isClusterLink"] !== undefined ? 30 : 0.1
                }
                return 0
            })
            .distance(function (link) {
                if (link["source"].key === "CLUSTER_CENTER_NODE") {
                    return 10 + clusterNodes.size * 5
                }
                if (clusterNodes.get(link["source"].key) !== undefined) {
                    return clusterNodes.get(link["target"].key) !== undefined ? (2 * Math.PI * clusterNodes.size * 8) / clusterNodes.size : 5
                }
                return 30
            })
    }
    else {
        forceGraph.linkVisibility(() => true)

        //forceGraph.d3Force('link')
        //    .strength(function (link) {})
        //    .distance(function (link) {})

    }
}

function makeTextXmlConform(text) {
    text = text
        .replaceAll(/"/g,"&quot;")
        .replaceAll(/'/g,"&apos;")
        .replaceAll("&","&amp;")
        .replaceAll(">","&gt;")
        .replaceAll("<","&lt;")

    return text
}

let currentClusteringString = null
let currentClusterButton = null

function clusterContext(elem, nesting) {
    let jsonGraphParsed = JSON.parse(jsonGraph)
    let jsonGraphNodes = jsonGraphParsed["nodes"]
    let jsonGraphEdges = jsonGraphParsed["links"]

    let operator = makeTextXmlConform(elem.innerText)
    currentClusterButton = elem

    if(currentClusteringString === null) {// || currentClusteringString !== nesting+operator) {
        //let elementsList = document.getElementsByClassName("nodeClusterButton")
        //for (const checkBoxElementKey in elementsList) {
        //    elementsList[checkBoxElementKey].checked = false
        //}
        //elementsList = null
        //elem.checked = true



        currentClusteringString = nesting
        const regex = /:::NESTING_INDEX[^:::]+:::/ig;
        nesting = nesting.replaceAll(regex, ":::")
        nesting = makeTextXmlConform(nesting)

        let nestingList = nesting.split(":::")

        let content = getParameterXmlFromList([["attributeValue", nestingList[nestingList.length - 1]], ["attributeKeyNesting", nestingList.slice(0, -1).join(":::")], ["operator", operator]])

        //content = getParameterXmlFromList([["attributeValue", ""], ["attributeKeyNesting", ""], ["operator", ""]])

        //TODO: Fix request error (even though it still works)
        sendRequest("post", "clusterings/graphs/" + graphId + "?clusterOutputFormat=BY_ATTRIBUTE&content=", content,
            function (response) {
                response = response.slice(response.indexOf("{"), response.length)
                let responseJson = JSON.parse(response)
                let clusterList = responseJson["clusters"]

                //Add a center node to stabilize cluster layout
                jsonGraphNodes.push({
                    "color": "rgba(1,1,1,1)",
                    "size": "1",
                    "name": "CLUSTER_CENTER_NODE",
                    "id": "CLUSTER_CENTER_NODE",
                    "label": "CLUSTER_CENTER_NODE",
                    "key": "CLUSTER_CENTER_NODE"
                });
                for (const clusterKey in clusterList) {
                    let clusterNode = {
                        "color": "rgba(1,1,1,1)",
                        "val": 0.1,
                        "name": clusterList[clusterKey],
                        "id": clusterList[clusterKey],
                        "label": clusterList[clusterKey],
                        "key": clusterList[clusterKey]
                    }
                    jsonGraphNodes.push(clusterNode);
                    clusterNodes.set(clusterList[clusterKey], "");

                    //Add edge from center node
                    jsonGraphEdges.push(
                        {
                            "style": 0,
                            "source": "CLUSTER_CENTER_NODE",
                            "target": clusterList[clusterKey],
                            "isClusterLink": true
                        });
                    if (parseInt(clusterKey) <= clusterList.length - 1 && parseInt(clusterKey) !== 0) {
                        jsonGraphEdges.push(
                            {
                                "style": 0,
                                "source": clusterList[parseInt(clusterKey) - 1],
                                "target": clusterList[clusterKey],
                                "isClusterLink": true
                            });
                        if (parseInt(clusterKey) === clusterList.length - 1) {
                            jsonGraphEdges.push(
                                {
                                    "style": 0,
                                    "source": clusterList[clusterKey],
                                    "target": clusterList[0],
                                    "isClusterLink": true
                                });
                        }
                    }
                }
                let nodeClusterMappings = responseJson["cluster_nodes"]
                for (const nodeKey in jsonGraphNodes) {
                    if (clusterNodes.get(jsonGraphNodes[nodeKey].key) === undefined && jsonGraphNodes[nodeKey].key !== "CLUSTER_CENTER_NODE") {
                        jsonGraphEdges.push(
                            {
                                "style": 0,
                                "source": nodeClusterMappings[jsonGraphNodes[nodeKey].key],
                                "target": jsonGraphNodes[nodeKey].id,
                                "isClusterLink": true
                            });
                    }
                }

                forceGraph.graphData({nodes: jsonGraphNodes, links: jsonGraphEdges})
                toggleClusterForces(true)
                applyClusterLayout();
                //applyClusterRadialLayout(); //TODO:Fix so that this works. Otherwise the clusters at least exist I guess

                document.getElementById("nodeClusterUndoButtonContainer").insertAdjacentHTML("beforeend",
                    "<div style='float: right;'>" +
                    "<span class=\"d-inline-block\" tabindex=\"0\" data-bs-toggle=\"tooltip\" title=\"Undo clustering\">" +
                    "<button id='nodeClusterUndoButton' class='nodeClusterUndoButton row btn' onclick='undoClustering()'><b>" + elem.innerText + "</b></button>" +
                    "</span>" +
                    "</div>")
            },
            function (errorData) {
                showErrorMessage("Error while trying to cluster the graph:", errorData)
            }, "text");
    }
    else {
        undoClustering()
    }
}

function resetClusterButtons() {
    if (currentClusterButton !== null) {
        document.getElementById("nodeClusterUndoButtonContainer").innerHTML = "";
        currentClusterButton = null
        currentClusteringString = null
    }
}

function undoClustering() {
    let jsonGraphParsed = JSON.parse(jsonGraph)
    let jsonGraphNodes = jsonGraphParsed["nodes"]
    let jsonGraphEdges = jsonGraphParsed["links"]
    //forceGraph.graphData(jsonGraphParsed) //TODO: make this work for more performant graphs
    toggleClusterForces(false)
    resetClusterButtons();
    forceGraph._destructor();
    buildGraph()
}

function isGeqLeqComparable(object) {
    return !isNaN(parseFloat(object)) || !isNaN(Date.parse(object)) || (object === "true" || object === "false" || typeof object === "boolean");
}

function insertJsonAsList(elemId, nodeName, keyNesting, displayMode) {
    keyNesting = keyNesting.split(":::")
    if (keyNesting[0] === "") {
        keyNesting.pop()
    }


    if(document.getElementById("dbList") != null) {
        document.getElementById(elemId).removeChild(document.getElementById("dbList"))
    }

    document.getElementById(elemId).insertAdjacentHTML("beforeend", "<ul id='dbList' class='list-group list-group-flush'></ul>")
    document.getElementById("DatabaseItemListCrumb").innerHTML = "";
    document.getElementById("DatabaseItemListCrumb").insertAdjacentHTML("beforeend",
        "<li class=\"breadcrumb-item active hoverCrumb\" aria-current=\"page\" onclick='insertJsonAsList(\"DatabaseItemList\", \"" + nodeName + "\", \"\", \"\")'><b>" + nodeName + "</b></li>")

    var unfoldedObject = databaseJson

    let adjustedNestingKey = "";
    if(keyNesting.length !== 0) {
        for (const nestingKey in keyNesting) {
            adjustedNestingKey = nestingKey.startsWith("NESTING_INDEX") ? nestingKey.slice(13) : nestingKey

            unfoldedObject = unfoldedObject[keyNesting[adjustedNestingKey]]
            if(keyNesting[adjustedNestingKey] === "wikidata_object") {
                displayMode = "wikidata"
            }

            document.getElementById("DatabaseItemListCrumb").insertAdjacentHTML("beforeend",
                "<li class=\"breadcrumb-item active hoverCrumb\" aria-current=\"page\" onclick='insertJsonAsList(\"DatabaseItemList\", \"" + nodeName + "\", \"" + makeTextXmlConform(keyNesting.slice(0,nestingKey+1).join(":::")) + "\", \"" + displayMode + "\")'><b>" + keyNesting[adjustedNestingKey] + "</b></li>")
        }
    }

    if(displayMode === "" || keyNesting[keyNesting.length-1] === "wikidata_object") {
        if (typeof unfoldedObject !== "object") {
            document.getElementById("dbList").insertAdjacentHTML("beforeend",
                "<li class='list-group-item' style='text-align: left'>" +
                "<p style='width: 48%; float: left; overflow-wrap: break-word;'><b>" + unfoldedObject + "</b></p>" +
                "</li>")
        } else if (Array.isArray(unfoldedObject)) {
            for (var key in unfoldedObject) {
                var nextKeyNesting = keyNesting
                nextKeyNesting.push("NESTING_INDEX" + key)
                var keyName
                var onClickString
                if (typeof unfoldedObject[key] === "object") { //Account for wikidata here
                    keyName = key;
                    onClickString = "insertJsonAsList(\"" + elemId + "\", \"" + nodeName + "\", \"" + makeTextXmlConform(nextKeyNesting.join(":::")) + "\",\"" + displayMode + "\")"
                } else {
                    keyName = unfoldedObject[key]
                    onClickString = ""
                }

                document.getElementById("dbList").insertAdjacentHTML("beforeend",
                    "<li class='list-group-item jsonListExpandable' style='text-align: left' onclick='" + onClickString + "'>" +
                    "<p class='' style='width: 48%; float: left; overflow-wrap: break-word;' ><b>" + key + "</b></p>" +
                    "</li>")
            }
        } else {
            for (var key in unfoldedObject) {
                if(typeof unfoldedObject[key] !== "object") { //Must be a simple value then
                    let nextKeyNesting = keyNesting.slice()
                    nextKeyNesting.push(key)
                    nextKeyNesting.push(unfoldedObject[key])
                    const onClickString = "clusterContext(this,\"" + makeTextXmlConform(nextKeyNesting.join(":::")) +"\")"
                    document.getElementById("dbList").insertAdjacentHTML("beforeend",
                        "<li class='list-group-item' style='text-align: left; height:fit-content' onmouseenter='this.querySelector(\".clusterButtons\").hidden = false' onmouseleave='this.querySelector(\".clusterButtons\").hidden = true'>" +
                        "<div style='width: 95%; float: left'>" +
                        "<p style='width: 46%; float: left; overflow-wrap: break-word;'><b>" + key + "</b></p>" +
                        "<p style='width: 46%; float: right; height:fit-content; overflow-wrap: break-word;'> " + unfoldedObject[key] + "</p>" +
                        "</div>" +
                        "<div hidden style='width: auto; float: right; height: inherit' class='clusterButtons'>" +
                        "<span class=\"d-inline-block\" tabindex=\"0\" data-bs-toggle=\"tooltip\" title=\"Cluster nodes by this attribute\">" +
                        "<button class='nodeClusterButton row btn' onclick='" + onClickString + "'><b>==</b></button>" +
                        "</span>" +
                        (isGeqLeqComparable(unfoldedObject[key]) ? "<span class=\"d-inline-block\" tabindex=\"0\" data-bs-toggle=\"tooltip\" title=\"Cluster nodes by being smaller/greater than this attribute\">" + "<button class='nodeClusterButton row btn' style='clear: left; vertical-align: middle' onclick='" + onClickString + "'><b>&gt;&lt;</b></button>" + "</span>": "") +
                        "</div>" +
                        "</li>")
                }
                else {
                    let nextKeyNesting = keyNesting.slice()
                    nextKeyNesting.push(key)
                    document.getElementById("dbList").insertAdjacentHTML("beforeend",
                        "<li class='list-group-item jsonListExpandable' style='text-align: left' onclick='insertJsonAsList(\"" + elemId + "\", \"" + nodeName + "\", \"" + makeTextXmlConform(nextKeyNesting.join(":::")) + "\",\"" + displayMode + "\")'>" +
                        "<p class='' style='width: 48%; float: left; overflow-wrap: break-word;' ><b>" + key + "</b></p>" +
                        "</li>")
                }
            }
        }
    }
    else if (displayMode === "wikidata") {
        if (typeof unfoldedObject !== "object") { //Likely not needed with wikidata
            document.getElementById("dbList").insertAdjacentHTML("beforeend",
                "<li class='list-group-item' style='text-align: left'>" +
                "<p style='width: 48%; float: left; overflow-wrap: break-word;'><b>" + unfoldedObject + "</b></p>" +
                "</li>")
        } else if (Array.isArray(unfoldedObject)) {
            for (const key in unfoldedObject) {
                let nextKeyNesting = keyNesting.slice()
                nextKeyNesting.push("NESTING_INDEX" + key)
                let keyName
                let onClickString

                if(typeof unfoldedObject[key] === "object") {
                    keyName = key;
                    nextKeyNesting.push(unfoldedObject[key]["value"])
                    onClickString = "clusterContext(this,\"" + makeTextXmlConform(nextKeyNesting.join(":::")) +"\")"

                    document.getElementById("dbList").insertAdjacentHTML("beforeend",
                        "<li class='list-group-item' style='text-align: left; height:fit-content' onmouseenter='this.querySelector(\".clusterButtons\").hidden = false' onmouseleave='this.querySelector(\".clusterButtons\").hidden = true'>" +
                        "<div style='width: 80%; float: left'>" +
                        "<p style='width: 100%; float: left; overflow-wrap: break-word;'><b><u>" + (parseInt(key)+1) + ": " + unfoldedObject[key]["value"] + "</u></b></p>" +
                        "</div>" +
                        "<div hidden style='width: auto; float: right; margin-right: 15px; height: inherit' class='clusterButtons'>" +
                        "<span class=\"d-inline-block\" tabindex=\"0\" data-bs-toggle=\"tooltip\" title=\"Cluster nodes by this attribute\">" +
                        "<button class='nodeClusterButton row btn' onclick='" + onClickString + "'><b>==</b></button>" +
                        "</span>" +
                        (isGeqLeqComparable(unfoldedObject[key]["value"]) ? "<span class=\"d-inline-block\" tabindex=\"0\" data-bs-toggle=\"tooltip\" title=\"Cluster nodes by being smaller/greater than this attribute\">" + "<button class='nodeClusterButton row btn' style='clear: left; vertical-align: middle' onclick='" + onClickString + "'><b>&gt;&lt;</b></button>" + "</span>": "") +
                        "</div>" +
                        "</li>")

                    if (unfoldedObject[key]["qualifiers"] !== undefined) {
                        let qualifierListId = "dbListQualifiers" + nextKeyNesting + key
                        document.getElementById("dbList").insertAdjacentHTML("beforeend", "<ul id='" + qualifierListId + "' class='list-group list-group-flush' style='margin-left:20px'></ul>")

                        for (const qualifierKey in unfoldedObject[key]["qualifiers"]) {
                            let qualifierKeyNesting = nextKeyNesting.slice()
                            qualifierKeyNesting.push(qualifierKey)
                            qualifierKeyNesting.push(unfoldedObject[key]["qualifiers"][qualifierKey])
                            onClickString = "clusterContext(this,\"" + makeTextXmlConform(qualifierKeyNesting.join(":::")) +"\")"
                            document.getElementById(qualifierListId).insertAdjacentHTML("beforeend",
                                "<li class='list-group-item' style='text-align: left; height:fit-content' onmouseenter='this.querySelector(\".clusterButtons\").hidden = false' onmouseleave='this.querySelector(\".clusterButtons\").hidden = true'>" +
                                "<div style='width: 95%; float: left'>" +
                                "<p style='width: 48%; float: left; overflow-wrap: break-word;'><b>" + qualifierKey + "</b></p>" +
                                "<p style='width: 48%; float: right; overflow-wrap: break-word;'> " + unfoldedObject[key]["qualifiers"][qualifierKey] + "</p>" +
                                "</div>" +
                                "<div hidden style='width: auto; float: right; height: inherit' class='clusterButtons'>" +
                                "<span class=\"d-inline-block\" tabindex=\"0\" data-bs-toggle=\"tooltip\" title=\"Cluster nodes by this attribute\">" +
                                "<button class='nodeClusterButton row btn' onclick='" + onClickString + "'><b>==</b></button>" +
                                "</span>" +
                                (isGeqLeqComparable(unfoldedObject[key]["qualifiers"][qualifierKey]) ? "<span class=\"d-inline-block\" tabindex=\"0\" data-bs-toggle=\"tooltip\" title=\"Cluster nodes by being smaller/greater than this attribute\">" + "<button class='nodeClusterButton row btn' style='clear: left; vertical-align: middle' onclick='" + onClickString + "'><b>&gt;&lt;</b></button>" + "</span>": "") +
                                "</div>" +
                                "</li>")
                        }
                    }
                } else {
                    keyName = unfoldedObject[key]

                    nextKeyNesting.push(unfoldedObject[key])
                    onClickString = "clusterContext(this,\"" + makeTextXmlConform(nextKeyNesting.join(":::")) +"\")"

                    document.getElementById("dbList").insertAdjacentHTML("beforeend",
                        "<li class='list-group-item' style='text-align: left; height:fit-content' onmouseenter='this.querySelector(\".clusterButtons\").hidden = false' onmouseleave='this.querySelector(\".clusterButtons\").hidden = true'>" +
                        "<div style='width: 95%; float: left'>" +
                        "<p style='width: 48%; float: left; overflow-wrap: break-word;'><b>" + (parseInt(key)+1) + ":</b></p>" +
                        "<p style='width: 48%; float: right; overflow-wrap: break-word;'> " + unfoldedObject[key] + "</p>" +
                        "</div>" +
                        "<div hidden style='width: auto; float: right; height: inherit' class='clusterButtons'>" +
                        "<span class=\"d-inline-block\" tabindex=\"0\" data-bs-toggle=\"tooltip\" title=\"Cluster nodes by this attribute\">" +
                        "<button class='nodeClusterButton row btn' onclick='" + onClickString + "'><b>==</b></button>" +
                        "</span>" +
                        (isGeqLeqComparable(unfoldedObject[key]) ? "<span class=\"d-inline-block\" tabindex=\"0\" data-bs-toggle=\"tooltip\" title=\"Cluster nodes by being smaller/greater than this attribute\">" + "<button class='nodeClusterButton row btn' style='clear: left; vertical-align: middle' onclick='" + onClickString + "'><b>&gt;&lt;</b></button>" + "</span>": "") +
                        "</div>" +
                        "</li>")
                }
            }
        }
    }
}

function openNodeInfo(nodeName, jsonResponse) {
    nodeName = nodeName.replace("\n","") // Remove linebreak that was added for some reason
    databaseJson = jsonResponse;
    //Object.keys(databaseJson)[0] works too
    document.getElementById("DatabaseItemList").hidden = false

    insertJsonAsList("DatabaseItemList", nodeName, "", "")
}

function getNodeInfo(node) {
    sendRequest("get", "nodes/" + node.key + "/graphs/" + graphId, "",
        /* Response handler */
        function(response) {
            openNodeInfo(node.name, (JSON.parse(response).extraInfo))
        },
        /* Error handler */
        function(errorData) {
            /*
             * Request failed
             */
            showConnectionErrorMessage("Could not get Node Info", errorData);
        });
}

function applyClusterRadialLayout() { //TODO: Make this work
    forceGraph.d3Force('radial', d3.forceRadial()
        .strength(() => 0.1)
        .radius(() => 1)
    )

    forceGraph.zoomToFit()
}

function createNode2DCanvasObject(node, ctx, globalScale) {
    const label = node.name;
    const fontSize = 12/globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillText(label, node.x, node.y);
}

function createNode3DTHREEObject(node) {
    const nodeEl = document.createElement('div');
    nodeEl.textContent = node.name;
    nodeEl.style.color = "#ffffff";//node.color;
    nodeEl.className = 'node-label';
    return new THREE.CSS2DObject(nodeEl);
}

function createLink2DCanvasObject(link, ctx, globalScale) {
    const start = link.source;
    const end = link.target;

    if (start === end) return //Dont show self-edge weights

    // ignore unbound links
    if (typeof start !== 'object' || typeof end !== 'object') return;

    // calculate label positioning
    const textPos = Object.assign(...['x', 'y'].map(c => ({
        [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
    })));

    const relLink = {x: end.x - start.x, y: end.y - start.y};

    //const maxTextLength = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) - LABEL_NODE_MARGIN * 2;

    let textAngle = Math.atan2(relLink.y, relLink.x);
    // maintain label vertical orientation for legibility
    if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
    if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);

    const label = link.weight;

    // estimate fontSize to fit in link length
    ctx.font = '1px Sans-Serif';
    const fontSize = 10/globalScale//Math.min(12, maxTextLength / ctx.measureText(label).width);
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

    // draw text label (with background rect)
    ctx.save();
    ctx.translate(textPos.x, textPos.y);
    ctx.rotate(textAngle);


    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillText(label, 0, 0);
    //ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    //ctx.fillRect(-bckgDimensions[0] / 2, -bckgDimensions[1] / 2, ...bckgDimensions);
    ctx.restore();
}

function createLink3DTHREEObject(link) {
    // extend link with text sprite
    const sprite = new SpriteText(`${link.weight}`);
    sprite.textHeight = 6;
    sprite.color = '#ffffff'
    //sprite.color = 'rgba(255,255,255,0)'
    return sprite;
}

function updateLink3DTHREEObjectPosition(sprite, { start, end }) {
    // Position sprite
    const middlePos = Object.assign(...['x', 'y', 'z'].map(c => ({
        [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
    })));
    //sprite.color = '#ffffff'
    sprite.visible = true;
    Object.assign(sprite.position, middlePos);
}

var degree = new Map();

function buildGraphNormal() {
    let graph = JSON.parse(jsonGraph);
    degree = new Map();
    let outgoingNeighbours = new Map();
    let styles = []
    for (let node of graph.nodes) {
        degree[node.id] = 0;
        outgoingNeighbours[node.id] = [];
    }
    for (let edge of graph.links) {
        degree[edge.source] += 1;
        outgoingNeighbours[edge.source].push(edge.target);
        styles.push(edge.style);
    }

    if (have3D === false) {
        forceGraph = ForceGraph()
        (document.getElementById('forceVisualizationGraphic'))
            .nodeCanvasObjectMode( () => 'after')
            .backgroundColor("#fafafa")
            .graphData(graph)
            .nodeId('id')
            .nodeLabel((node) => haveNodeNames !== true ? node.name : "")
            .onNodeHover(node => {
                if (node != null) {
                    nodeName = node.name;
                }
            })
            .onNodeClick((node, event) => {
                if (!event.target.matches('.dropDownOpenButton') && !event.target.matches('.dataBaseDropDownContentForm') && !event.target.matches('.nodeSearchForm') && !event.target.matches('.nodeSearchButton')
                    && !event.target.matches('.toolsDropDownDots')  && event.target.className !== 'tool-dot' && !event.target.matches('.saveJsonForm') && !event.target.matches('.displayButton')){
                    getNodeInfo(node);
                }
            })
            .onNodeRightClick(node => {
                highlightNodes.clear();
                highlightLinks.clear();
                if (node !== rightClickNode) {
                    if (node) {
                        highlightNodes.add(node.id);
                        outgoingNeighbours[node.id].forEach(neighbor => highlightNodes.add(neighbor));
                        graph.links.forEach(link => {
                            if (link.source.id === node.id) {
                                highlightLinks.add(link)
                            }
                        });
                    }
                    rightClickNode = node;
                } else {
                    rightClickNode = null;
                }
                rightClickLink = null;
            })
            .nodeVal(function (node) {
                return Math.log(degree[node.id] + 1)
            } /*<= 14 ? degree[node.id] : 14}*/)
            .nodeColor(function (node) {
                if(clusterNodes.get(node.key) !== undefined) {
                    return "#030303";
                }
                if (highlightNodes.has(node.id)) {
                    return ((node === rightClickNode) ? '#f54a06' : '#fd970d');
                } else {
                    return '#3183ba';
                }
            })
            .nodeCanvasObject((node, ctx, globalScale) => {
                if(haveNodeNames === true) {
                    return createNode2DCanvasObject(node,ctx,globalScale);
                }
            })
            .linkSource('source')
            .onLinkRightClick(link => {
                highlightNodes.clear();
                highlightLinks.clear();
                if (link !== rightClickLink) {
                    if (link) {
                        highlightLinks.add(link);
                        highlightNodes.add(link.source.id);
                        highlightNodes.add(link.target.id);
                    }
                    rightClickLink = link;
                    rightClickNode = null;
                } else {
                    rightClickLink = null;
                    rightClickNode = null;
                }
            })
            .linkLineDash(function (link) {
                if (styles[link.index] === 1) {
                    return [10, 10]
                } else if (styles[link.index] === 2) {
                    return [5, 5]
                }
            })
            .linkWidth(link => highlightLinks.has(link) ? 2.5 : 1.5)
            .linkColor(link => {
                if(haveEdgeWeights) {
                    if(link.weight > 0) {
                        return "rgba(145,217,65,0.6)"
                    }
                    else {
                        return "rgba(255,107,107,0.6)"
                    }
                }
                else {
                    return highlightLinks.has(link) ? "rgba(145,217,65,0.6)" : "rgba(219,219,219,0.85)"
                }
            })
            .linkDirectionalArrowLength(5)
            .linkDirectionalArrowRelPos(1)
            .linkTarget('target')
            .linkLabel((link) => haveEdgeWeights === true ? link.weight : "")
            .linkCanvasObjectMode(() => 'after')
            .linkCanvasObject((link, ctx, globalScale) => {
                if (haveEdgeWeights) {
                    return createLink2DCanvasObject(link,ctx,globalScale)
                }
            })
            .cooldownTicks(200);

    } else {
        forceGraph = ForceGraph3D({
            extraRenderers: [new THREE.CSS2DRenderer()]
        })
        (document.getElementById('forceVisualizationGraphic'))
            .graphData(graph)
            .nodeId('id')
            .nodeLabel((node) => haveNodeNames !== true ? node.name : "")
            .onNodeHover(node => {
                if (node != null) {
                    nodeName = node.name;
                }
            })
            .onNodeClick((node, event) => {
                if (!event.target.matches('.dropDownOpenButton') && !event.target.matches('.dataBaseDropDownContentForm') && !event.target.matches('.nodeSearchForm') && !event.target.matches('.nodeSearchButton')
                    && !event.target.matches('.toolsDropDownDots')  && event.target.className !== 'tool-dot' && !event.target.matches('.saveJsonForm') && !event.target.matches('.displayButton')){
                    getNodeInfo(node);
                }
            })
            .onNodeRightClick(node => {
                highlightNodes.clear();
                highlightLinks.clear();
                if (node !== rightClickNode) {
                    if (node) {
                        highlightNodes.add(node.id);
                        outgoingNeighbours[node.id].forEach(neighbor => highlightNodes.add(neighbor));
                        graph.links.forEach(link => {
                            if (link.source.id === node.id) {
                                highlightLinks.add(link)
                            }
                        });
                    }
                    rightClickNode = node;
                    rightClickLink = null;
                } else {
                    rightClickNode = null;
                    rightClickLink = null;
                }

                updateHighlight();
            })
            .nodeColor(function (node) {
                if (highlightNodes.has(node.id)) {
                    return ((node === rightClickNode) ? '#f53e06' : '#f5fd0d');
                } else {
                    return '#3183ba';
                }
            })
            .nodeOpacity(haveNodeNames === true ? .5 : 1)
            .nodeVal(function (node) {
                return Math.log(degree[node.id] + 1)
            })
            .nodeThreeObject(node => {
                if(haveNodeNames === true) {
                    return createNode3DTHREEObject(node)
                }
            })
            .nodeThreeObjectExtend(true)
            .linkSource('source')
            .onLinkRightClick(link => {
                highlightNodes.clear();
                highlightLinks.clear();
                if (link !== rightClickLink) {
                    if (link) {
                        highlightLinks.add(link);
                        highlightNodes.add(link.source.id);
                        highlightNodes.add(link.target.id);
                    }
                    rightClickLink = link;
                    rightClickNode = null;
                } else {
                    rightClickLink = null;
                    rightClickNode = null;
                }

                updateHighlight();
            })
            .linkOpacity(0.35)
            .linkColor(link => {
                if(haveEdgeWeights) {
                    if(link.weight > 0) {
                        return "rgba(145,217,65,0.85)"
                    }
                    else {
                        return "rgba(255,107,107,0.85)"
                    }
                }
                else {
                    return highlightLinks.has(link) ? "rgba(126,234,10,0.85)" : "#dedede"
                }
            })
            .linkWidth(link => highlightLinks.has(link) ? 2 : 0)
            .linkDirectionalArrowLength(4)
            .linkDirectionalArrowRelPos(1)
            .linkTarget('target')
            .linkLabel((link) => haveEdgeWeights !== true ? link.weight : "")
            .linkThreeObject(link => {
                return createLink3DTHREEObject(link);
            })
            .linkThreeObjectExtend(true)
            .linkPositionUpdate((sprite, { start, end }) => {
                sprite.visible = haveEdgeWeights;
                if (haveEdgeWeights) {
                    return updateLink3DTHREEObjectPosition(sprite, {start, end});
                }


            })
            .cooldownTicks(800);

        function updateHighlight() {
            // trigger update of highlighted objects in scene
            forceGraph
                .nodeColor(forceGraph.nodeColor())
                .linkColor(forceGraph.linkColor())
                .linkWidth(forceGraph.linkWidth());
        }
    }

    forceGraph.width($('.forceVisualizationContent').width());
    forceGraph.height($('.forceVisualizationContent').height());
}

/* Builds a force graph from json data */
function buildGraphCover() {
    var graph = JSON.parse(jsonGraph);
    var sizes = new Map();
    var colors = new Map();
    degree = new Map();
    for (let node of graph.nodes) {
        sizes[node.id] = node.size;
        colors[node.id] = node.color;
        degree[node.id] = 0;
    }
    for (let edge of graph.links) {
        degree[edge.source] += 1;
    }

    if (have3D === false) {
        forceGraph = ForceGraph()
        (document.getElementById('forceVisualizationGraphic'))
            .nodeCanvasObjectMode( () => 'after')
            .backgroundColor("#fafafa")
            .graphData(graph)
            .nodeId('id')
            .nodeLabel((node) => haveNodeNames !== true ? node.name : "")
            .onNodeHover(node => {
                if (node != null) {
                    nodeName = node.name;
                }
            })
            .onNodeClick((node, event) => {
                if (!event.target.matches('.dropDownOpenButton') && !event.target.matches('.dataBaseDropDownContentForm') && !event.target.matches('.nodeSearchForm') && !event.target.matches('.nodeSearchButton')
                    && !event.target.matches('.toolsDropDownDots')  && event.target.className !== 'tool-dot' && !event.target.matches('.saveJsonForm') && !event.target.matches('.displayButton')){
                    getNodeInfo(node);
                }
            })
            .nodeVal(function (node) {
                return Math.log(degree[node.id] + 1)//return sizes[node.id] - 19
            })
            .nodeColor(function (node) {
                return colors[node.id];
            })
            .nodeCanvasObject((node, ctx, globalScale) => {
                if(haveNodeNames === true) {
                    return createNode2DCanvasObject(node,ctx,globalScale);
                }
            })
            .onNodeDragEnd(node => {
                node.fx = node.x;
                node.fy = node.y;
            })
            .onNodeRightClick(node => {
                //TODO: Seem a bit slow after restoring, check original forces/velocity
                node.fx = null;
                node.fy = null;
            })
            .linkSource('source')
            .onLinkRightClick(link => {
                if (link !== rightClickLink) {
                    rightClickLink = link;
                } else {
                    rightClickLink = null;
                }
            })
            .linkWidth(link => link === rightClickLink ? 2.5 : 1.5)
            .linkColor(link => {
                if(haveEdgeWeights) {
                    if(link.weight > 0) {
                        return "rgba(145,217,65,0.6)"
                    }
                    else {
                        return "rgba(255,107,107,0.6)"
                    }
                }
                else {
                    return highlightLinks.has(link) ? "rgba(145,217,65,0.6)" : "rgba(219,219,219,0.85)"
                }
            })
            .linkDirectionalArrowLength(5)
            .linkDirectionalArrowRelPos(1)
            .linkTarget('target')
            .linkLabel((link) => haveEdgeWeights !== true ? link.weight : "")
            .linkCanvasObjectMode(() => 'after')
            .linkCanvasObject((link, ctx, globalScale) => {
                if (haveEdgeWeights) {
                    return createLink2DCanvasObject(link,ctx,globalScale)
                }
            })
            .cooldownTicks(200);
    } else {
        forceGraph = ForceGraph3D({
            extraRenderers: [new THREE.CSS2DRenderer()]
        })
        (document.getElementById('forceVisualizationGraphic'))
            .graphData(graph)
            .nodeId('id')
            .nodeLabel((node) => haveNodeNames !== true ? node.name : "")
            .onNodeHover(node => {
                if (node != null) {
                    nodeName = node.name;
                }
            })
            .onNodeClick((node, event) => {
                if (!event.target.matches('.dropDownOpenButton') && !event.target.matches('.dataBaseDropDownContentForm') && !event.target.matches('.nodeSearchForm') && !event.target.matches('.nodeSearchButton')
                    && !event.target.matches('.toolsDropDownDots')  && event.target.className !== 'tool-dot' && !event.target.matches('.saveJsonForm') && !event.target.matches('.displayButton')){
                    getNodeInfo(node);
                }
            })
            .nodeVal(function (node) {
                return Math.log(degree[node.id] + 1)//return sizes[node.id] - 19 > 0 ? sizes[node.id] - 19 : 1;
            })
            .nodeThreeObject(node => {
                if(haveNodeNames === true) {
                    return createNode3DTHREEObject(node)
                }
            })
            .nodeThreeObjectExtend(true)
            .nodeColor(function (node) {
                return colors[node.id];
            })
            .nodeOpacity(haveNodeNames === true ? .5 : 1)
            .onNodeDragEnd(node => {
                node.fx = node.x;
                node.fy = node.y;
                node.fz = node.z;
            })
            .onNodeRightClick(node => {
                //TODO: Seem a bit slow after restoring, check original forces/velocity
                node.fx = null;
                node.fy = null;
                node.fz = null;
            })
            .linkSource('source')
            .onLinkRightClick(link => {
                if (link !== rightClickLink) {
                    rightClickLink = link;
                } else {
                    rightClickLink = null;
                }
                forceGraph
                    .linkColor(forceGraph.linkColor())
                    .linkWidth(forceGraph.linkWidth())
            })
            .linkOpacity(0.35)
            .linkColor(link => {
                if(haveEdgeWeights) {
                    if(link.weight > 0) {
                        return "rgba(145,217,65,0.85)"
                    }
                    else {
                        return "rgba(255,107,107,0.85)"
                    }
                }
                else {
                    return highlightLinks.has(link) ? "rgba(126,234,10,0.85)" : "#dedede"
                }
            })
            .linkWidth(link => link === rightClickLink ? 2 : 0)
            .linkDirectionalArrowLength(4)
            .linkDirectionalArrowRelPos(1)
            .linkTarget('target')
            .linkLabel((link) => haveEdgeWeights !== true ? link.weight : "")
            .linkThreeObjectExtend(true)
            .linkThreeObject(link => {
                return createLink3DTHREEObject(link);
            })
            .linkPositionUpdate((sprite, { start, end }) => {
                sprite.visible = haveEdgeWeights;
                if (haveEdgeWeights) {
                    return updateLink3DTHREEObjectPosition(sprite, {start, end});
                }
            })
            .cooldownTicks(200);
    }

    forceGraph.width($('.forceVisualizationContent').width());
    forceGraph.height($('.forceVisualizationContent').height());
}

function buildGraphCentrality() {
    let graph = JSON.parse(jsonGraph);
    let sizes = new Map();
    let colors = new Map();
    degree = new Map()
    nodeSizeMin = Number.MAX_VALUE;
    for (let node of graph.nodes) {
        sizes[node.id] = node.size;
        if (node.size < nodeSizeMin) {
            nodeSizeMin = node.size;
        }

        colors[node.id] = node.color;
        degree[node.id] = 0;
    }
    for (let edge of graph.links) {
        degree[edge.source] += 1;
    }

    if (have3D === false) {
        forceGraph = ForceGraph()
        (document.getElementById('forceVisualizationGraphic'))
            .nodeCanvasObjectMode( () => 'after')
            .backgroundColor("#fafafa")
            .graphData(graph)
            .nodeId('id')
            .nodeLabel((node) => haveNodeNames !== true ? node.name : "")
            .onNodeHover(node => {
                if (node != null) {
                    nodeName = node.name;
                }
            })
            .onNodeClick((node, event) => {
                if (!event.target.matches('.dropDownOpenButton') && !event.target.matches('.dataBaseDropDownContentForm') && !event.target.matches('.nodeSearchForm') && !event.target.matches('.nodeSearchButton')
                    && !event.target.matches('.toolsDropDownDots')  && event.target.className !== 'tool-dot' && !event.target.matches('.saveJsonForm') && !event.target.matches('.displayButton')){
                    getNodeInfo(node);
                }
            })
            .nodeVal(function (node) {
                if (centralityVizType === "NODE_SIZE") {
                    return sizes[node.id] - nodeSizeMin + 1;
                } else {
                    return 2;
                }
            })
            .nodeColor(function (node) {
                if (centralityVizType !== "NODE_SIZE") {
                    return colors[node.id];
                } else {
                    return '#3183ba';
                }
            })
            .nodeCanvasObject((node, ctx, globalScale) => {
                if(haveNodeNames === true) {
                    return createNode2DCanvasObject(node,ctx,globalScale);
                }
            })
            .onNodeDragEnd(node => {
                node.fx = node.x;
                node.fy = node.y;
            })
            .onNodeRightClick(node => {
                //TODO: Seem a bit slow after restoring, check original forces/velocity
                node.fx = null;
                node.fy = null;
            })
            .linkSource('source')
            .onLinkRightClick(link => {
                if (link !== rightClickLink) {
                    rightClickLink = link;
                } else {
                    rightClickLink = null;
                }
            })
            .linkWidth(link => link === rightClickLink ? 2.5 : 1.5)
            .linkColor(link => {
                if(haveEdgeWeights) {
                    if(link.weight > 0) {
                        return "rgba(145,217,65,0.6)"
                    }
                    else {
                        return "rgba(255,107,107,0.6)"
                    }
                }
                else {
                    return highlightLinks.has(link) ? "rgba(145,217,65,0.6)" : "rgba(219,219,219,0.85)"
                }
            })
            .linkDirectionalArrowLength(5)
            .linkDirectionalArrowRelPos(1)
            .linkTarget('target')
            .linkLabel((link) => haveEdgeWeights !== true ? link.weight : "")
            .linkCanvasObjectMode(() => 'after')
            .linkCanvasObject((link, ctx, globalScale) => {
                if (haveEdgeWeights) {
                    return createLink2DCanvasObject(link,ctx,globalScale)
                }
            })
            .cooldownTicks(200);
    } else {
        forceGraph = ForceGraph3D({
            extraRenderers: [new THREE.CSS2DRenderer()]
        })
        (document.getElementById('forceVisualizationGraphic'))
            .graphData(graph)
            .nodeId('id')
            .nodeLabel((node) => haveNodeNames !== true ? node.name : "")
            .onNodeHover(node => {
                if (node != null) {
                    nodeName = node.name;
                }
            })
            .onNodeClick((node, event) => {
                if (!event.target.matches('.dropDownOpenButton') && !event.target.matches('.dataBaseDropDownContentForm') && !event.target.matches('.nodeSearchForm') && !event.target.matches('.nodeSearchButton')
                    && !event.target.matches('.toolsDropDownDots')  && event.target.className !== 'tool-dot' && !event.target.matches('.saveJsonForm') && !event.target.matches('.displayButton')){
                    getNodeInfo(node);
                }
            })
            .nodeVal(function (node) {
                if (centralityVizType === "NODE_SIZE") {
                    return node.size - nodeSizeMin + 1;
                } else {
                    return 2;
                }
            })
            .nodeThreeObject(node => {
                if(haveNodeNames === true) {
                    return createNode3DTHREEObject(node)
                }
            })
            .nodeThreeObjectExtend(true)
            .nodeColor(function (node) {
                if (centralityVizType !== "NODE_SIZE") {
                    return colors[node.id];
                } else {
                    return '#3183ba';
                }
            })
            .nodeOpacity(haveNodeNames === true ? .5 : 1)
            .onNodeDragEnd(node => {
                node.fx = node.x;
                node.fy = node.y;
                node.fz = node.z;
            })
            .onNodeRightClick(node => {
                //TODO: Seem a bit slow after restoring, check original forces/velocity
                node.fx = null;
                node.fy = null;
                node.fz = null;
            })
            .linkSource('source')
            .onLinkRightClick(link => {
                if (link !== rightClickLink) {
                    rightClickLink = link;
                } else {
                    rightClickLink = null;
                }
                forceGraph
                    .linkColor(forceGraph.linkColor())
                    .linkWidth(forceGraph.linkWidth())
            })
            .linkOpacity(0.35)
            .linkColor(link => {
                if(haveEdgeWeights) {
                    if(link.weight > 0) {
                        return "rgba(145,217,65,0.85)"
                    }
                    else {
                        return "rgba(255,107,107,0.85)"
                    }
                }
                else {
                    return highlightLinks.has(link) ? "rgba(126,234,10,0.85)" : "#dedede"
                }
            })
            .linkWidth(link => link === rightClickLink ? 2 : 0)
            .linkDirectionalArrowLength(4)
            .linkDirectionalArrowRelPos(1)
            .linkTarget('target')
            .linkLabel((link) => haveEdgeWeights !== true ? link.weight : "")
            .linkThreeObjectExtend(true)
            .linkThreeObject(link => {
                return createLink3DTHREEObject(link);
            })
            .linkPositionUpdate((sprite, { start, end }) => {
                sprite.visible = haveEdgeWeights;
                if (haveEdgeWeights) {
                    return updateLink3DTHREEObjectPosition(sprite, {start, end});
                }
            })
            .cooldownTicks(200);
    }

    forceGraph.width($('.forceVisualizationContent').width());
    forceGraph.height($('.forceVisualizationContent').height());
}

function applyClusterLayoutNormal() {
    if(!have3D) {
        forceGraph
            .nodeCanvasObject((node, ctx, globalScale) => {
                if (clusterNodes.get(node.key) !== undefined) {
                    const fontSize = 15 / globalScale;
                    ctx.font = `bold ${fontSize}px Sans-Serif`;
                    let label = node.label
                    if (node.label.length >= 50) {//Reduce length of node label to make cluster names less giant
                        label = node.label.slice(0, 70) + "..."
                    }

                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = node.color;
                    ctx.fillText(label, node.x, node.y);

                    node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
                }
                else if (haveNodeNames === true && node.key !== "CLUSTER_CENTER_NODE") {
                    return createNode2DCanvasObject(node,ctx,globalScale);
                }
            })
            .nodeVal(function (node) {
                if (node.key === "CLUSTER_CENTER_NODE") { //TODO: Change where the center node positions are set.
                    node.x = 0
                    node.y = 0
                    node.z = 0
                    //return 0.0000001
                    return 0.0001
                }
                if (clusterNodes.get(node.key) !== undefined) {
                    return 0.0001
                }
            })
            .linkVisibility(function (link) {
                if (link.source.key === "CLUSTER_CENTER_NODE" || clusterNodes.get(link["source"].key) !== undefined) {
                    return false
                }
            }); //Update the graph
    }
    else {
        forceGraph
            .nodeThreeObject(node => {
                if(clusterNodes.get(node.key) !== undefined) {
                    const nodeEl = document.createElement('div');
                    if (node.label.length >= 50) {//Reduce length of node label to make cluster names less giant
                        label = node.label.slice(0, 70) + "..."
                    }
                    nodeEl.textContent = node.label;
                    nodeEl.style.color = "#e3c302";//node.color;
                    nodeEl.style.fontWeight = "bold";
                    nodeEl.className = 'node-label';
                    return new THREE.CSS2DObject(nodeEl);
                }
                else if(haveNodeNames === true && node.key !== "CLUSTER_CENTER_NODE") {
                    return createNode3DTHREEObject(node)
                }
            })
            .nodeVal(function (node) {
                if (node.key === "CLUSTER_CENTER_NODE") { //TODO: Change where the center node positions are set.
                    node.x = 0
                    node.y = 0
                    node.z = 0
                    //return 0.0000001
                    return 0.0001
                }
                if (clusterNodes.get(node.key) !== undefined) {
                    return 0.0001
                }
            })
            .linkVisibility(function (link) {
                if (link.source.key === "CLUSTER_CENTER_NODE" || clusterNodes.get(link["source"].key) !== undefined) {
                    //return false
                }
            }); //Update the graph
    }
}

function applyClusterLayoutCover() {
    if(!have3D) {
        forceGraph
            .nodeCanvasObject((node, ctx, globalScale) => {
                if (clusterNodes.get(node.key) !== undefined) {
                    const fontSize = 15 / globalScale;
                    ctx.font = `bold ${fontSize}px Sans-Serif`;
                    let label = node.label
                    if (node.label.length >= 50) {//Reduce length of node label to make cluster names less giant
                        label = node.label.slice(0, 70) + "..."
                    }

                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = node.color;
                    ctx.fillText(label, node.x, node.y);

                    node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
                }
                else if (haveNodeNames === true && node.key !== "CLUSTER_CENTER_NODE") {
                    return createNode2DCanvasObject(node,ctx,globalScale);
                }
            })
            .nodeVal(function (node) {
                if (node.key === "CLUSTER_CENTER_NODE") { //TODO: Change where the center node positions are set.
                    node.x = 0
                    node.y = 0
                    node.z = 0
                    //return 0.0000001
                    return 0.0001
                }
                if (clusterNodes.get(node.key) !== undefined) {
                    return 0.0001
                }
                else {
                    return Math.log(degree[node.id] + 1)//return node.size - 19 > 0 ? node.size - 19 : 1;
                }
            })
            .linkVisibility(function (link) {
                if (link.source.key === "CLUSTER_CENTER_NODE" || clusterNodes.get(link["source"].key) !== undefined) {
                    return false
                }
            }); //Update the graph
    }
    else {
        forceGraph
            .nodeThreeObject(node => {
                if(clusterNodes.get(node.key) !== undefined) {
                    const nodeEl = document.createElement('div');
                    if (node.label.length >= 50) {//Reduce length of node label to make cluster names less giant
                        label = node.label.slice(0, 70) + "..."
                    }
                    nodeEl.textContent = node.label;
                    nodeEl.style.color = "#e3c302";//node.color;
                    nodeEl.style.fontWeight = "bold";
                    nodeEl.className = 'node-label';
                    return new THREE.CSS2DObject(nodeEl);
                }
                else if(haveNodeNames === true && node.key !== "CLUSTER_CENTER_NODE") {
                    return createNode3DTHREEObject(node)
                }
            })
            .nodeVal(function (node) {
                if (node.key === "CLUSTER_CENTER_NODE") { //TODO: Change where the center node positions are set.
                    node.x = 0
                    node.y = 0
                    node.z = 0
                    //return 0.0000001
                    return 0.0001
                }
                if (clusterNodes.get(node.key) !== undefined) {
                    return 0.0001
                }
                else {
                    return Math.log(degree[node.id] + 1)//return node.size - 19 > 0 ? node.size - 19 : 1;
                }
            })
            .linkVisibility(function (link) {
                if (link.source.key === "CLUSTER_CENTER_NODE" || clusterNodes.get(link["source"].key) !== undefined) {
                    return false
                }
            }); //Update the graph
    }
}

function applyClusterLayoutCentrality() {
    if(!have3D) {
        forceGraph
            .nodeCanvasObject((node, ctx, globalScale) => {
                if (clusterNodes.get(node.key) !== undefined) {
                    const fontSize = 15 / globalScale;
                    ctx.font = `bold ${fontSize}px Sans-Serif`;
                    let label = node.label
                    if (node.label.length >= 50) {//Reduce length of node label to make cluster names less giant
                        label = node.label.slice(0, 70) + "..."
                    }

                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = node.color;
                    ctx.fillText(label, node.x, node.y);

                    node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
                }
                else if (haveNodeNames === true && node.key !== "CLUSTER_CENTER_NODE") {
                    return createNode2DCanvasObject(node,ctx,globalScale);
                }
            })
            .nodeVal(function (node) {
                if (node.key === "CLUSTER_CENTER_NODE") { //TODO: Change where the center node positions are set.
                    node.x = 0
                    node.y = 0
                    node.z = 0
                    //return 0.0000001
                    return 0.0001
                }
                if (clusterNodes.get(node.key) !== undefined) {
                    return 0.0001
                }
                else {
                    if (centralityVizType === "NODE_SIZE") {
                        return node.size - nodeSizeMin + 1;
                    } else {
                        return 2;
                    }
                }
            })
            .linkVisibility(function (link) {
                if (link.source.key === "CLUSTER_CENTER_NODE" || clusterNodes.get(link["source"].key) !== undefined) {
                    return false
                }
            }); //Update the graph
    }
    else {
        forceGraph
            .nodeThreeObject(node => {
                if(clusterNodes.get(node.key) !== undefined) {
                    const nodeEl = document.createElement('div');
                    if (node.label.length >= 50) {//Reduce length of node label to make cluster names less giant
                        label = node.label.slice(0, 70) + "..."
                    }
                    nodeEl.textContent = node.label;
                    nodeEl.style.color = "#e3c302";//node.color;
                    nodeEl.style.fontWeight = "bold";
                    nodeEl.className = 'node-label';
                    return new THREE.CSS2DObject(nodeEl);
                }
                else if(haveNodeNames === true && node.key !== "CLUSTER_CENTER_NODE") {
                    return createNode3DTHREEObject(node)
                }
            })
            .nodeVal(function (node) {
                if (node.key === "CLUSTER_CENTER_NODE") { //TODO: Change where the center node positions are set.
                    node.x = 0
                    node.y = 0
                    node.z = 0
                    //return 0.0000001
                    return 0.0001
                }
                if (clusterNodes.get(node.key) !== undefined) {
                    return 0.0001
                }
                else {
                    if (centralityVizType === "NODE_SIZE") {
                        return sizes[node.id] - nodeSizeMin + 1;
                    } else {
                        return 2;
                    }
                }
            })
            .linkVisibility(function (link) {
                if (link.source.key === "CLUSTER_CENTER_NODE" || clusterNodes.get(link["source"].key) !== undefined) {
                    //return false
                }
            }); //Update the graph
    }
}

let centralityVizTypeNames = undefined;
/* Function to get possible visualization types for centralities */
function getCentralityVisualizationTypeNames(callback) {
    sendRequest("get", "visualization/centralityVisualizationTypes/names", "",
        /* Response handler */
        function (response) {
            centralityVizTypeNames = response;
            if (typeof callback !== 'undefined') {
                callback();
            }
        },
        /* Error handler */
        function (errorData) {
            /*
             * Visualization type name request failed
             */
            showConnectionErrorMessage("Visualization type names were not received.", errorData);
        });
}


function NodeNameDisplayHandler () {
    haveNodeNames = !haveNodeNames;
    if(have3D === true) {
        forceGraph
            .nodeOpacity(haveNodeNames === true ? .5 : 1)
            .nodeThreeObject(forceGraph.nodeThreeObject())
    }
}


function EdgeWeightDisplayHandler () {
    haveEdgeWeights = !haveEdgeWeights;
    if(have3D === true) {
        forceGraph
            .linkColor(forceGraph.linkColor())
    }
}