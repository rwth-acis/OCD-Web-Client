let clusterNodes = new Map()

/* Delete graph button handler */
function closeDatabaseInfo() {
    document.getElementById("DatabaseItemList").hidden = true
    document.getElementById("DatabaseItemList").removeChild(document.getElementById("dbList"))
    document.getElementById("DatabaseItemListCrumb").innerHTML = "";
}

function toggleClusterForces(elemId, doCluster) {
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
        forceGraph.d3Force('link')
            .strength(function (link) {})
            .distance(function (link) {})
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

function clusterContext(elem, nesting) {
    let jsonGraphParsed = JSON.parse(jsonGraph)
    let jsonGraphNodes = jsonGraphParsed["nodes"]
    let jsonGraphEdges = jsonGraphParsed["links"]

    let operator = makeTextXmlConform(elem.innerText)

    if(currentClusteringString === null || currentClusteringString !== nesting+operator) {
        //let elementsList = document.getElementsByClassName("nodeClusterButton")
        //for (const checkBoxElementKey in elementsList) {
        //    elementsList[checkBoxElementKey].checked = false
        //}
        //elementsList = null
        //elem.checked = true

        currentClusteringString = nesting+operator
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
                toggleClusterForces(true, elem)
                applyClusterLayout();
                //applyClusterRadialLayout(); //TODO:Fix so that this works. Otherwise the clusters at least exist I guess
            },
            function (errorData) {
                showErrorMessage("Error while trying to cluster the graph:", errorData)
            }, "text");
    }
    else {
        currentClusteringString = null
        forceGraph.graphData({nodes: jsonGraphNodes, links: jsonGraphEdges})
        toggleClusterForces(false, elem)
    }
}

function isGeqLeqComparable(object) {
    return !isNaN(parseFloat(object)) || !isNaN(Date.parse(object)) || (object === "true" || object === "false" || typeof object === "boolean");
}

function insertJsonAsList(elemId, keyNesting, displayMode) {
    keyNesting = keyNesting.split(":::")
    if (keyNesting[0] === "") {
        keyNesting.pop()
    }


    //console.log("ELEMID: " + elemId, "keyNESTING: " + keyNesting)
    if(document.getElementById("dbList") != null) {
        document.getElementById(elemId).removeChild(document.getElementById("dbList"))
    }

    document.getElementById(elemId).insertAdjacentHTML("beforeend", "<ul id='dbList' class='list-group list-group-flush' style='overflow-y:scroll'></ul>")
    document.getElementById("DatabaseItemListCrumb").innerHTML = "";
    document.getElementById("DatabaseItemListCrumb").insertAdjacentHTML("beforeend",
        "<li class=\"breadcrumb-item active hoverCrumb\" aria-current=\"page\" onclick='insertJsonAsList(\"DatabaseItemList\", \"\", \"\")'><b>" + nodeName + "</b></li>")

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
                "<li class=\"breadcrumb-item active hoverCrumb\" aria-current=\"page\" onclick='insertJsonAsList(\"DatabaseItemList\", \"" + makeTextXmlConform(keyNesting.slice(0,nestingKey+1).join(":::")) + "\", \"" + displayMode + "\")'><b>" + keyNesting[adjustedNestingKey] + "</b></li>")
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
                    onClickString = "insertJsonAsList(\"" + elemId + "\",\"" + makeTextXmlConform(nextKeyNesting.join(":::")) + "\",\"" + displayMode + "\")"
                } else {
                    keyName = unfoldedObject[key]
                    onClickString = ""
                }

                document.getElementById("dbList").insertAdjacentHTML("beforeend",
                    "<li class='list-group-item' style='text-align: left'>" +
                    "<p class='jsonListExpandable' style='width: 48%; float: left; overflow-wrap: break-word;' onclick='" + onClickString + "'><b>" + key + "</b></p>" +
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
                        "<button class='nodeClusterButton row btn' onclick='" + onClickString + "'><b>==</b></button>" +
                        (isGeqLeqComparable(unfoldedObject[key]) ? "<button class='nodeClusterButton row btn' style='clear: left; vertical-align: middle' onclick='" + onClickString + "'><b>&gt;&lt;</b></input>" : "") +
                        "</div>" +
                        "</li>")
                }
                else {
                    let nextKeyNesting = keyNesting.slice()
                    nextKeyNesting.push(key)
                    //console.log("nextKeyNesting: " + nextKeyNesting)
                    document.getElementById("dbList").insertAdjacentHTML("beforeend",
                        "<li class='list-group-item' style='text-align: left'>" +
                        "<p class='jsonListExpandable' style='width: 48%; float: left; overflow-wrap: break-word;' onclick='insertJsonAsList(\"" + elemId + "\",\"" + makeTextXmlConform(nextKeyNesting.join(":::")) + "\",\"" + displayMode + "\")'><b>" + key + "</b></p>" +
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
                        "<button class='nodeClusterButton row btn' onclick='" + onClickString + "'><b>==</b></button>" +
                        (isGeqLeqComparable(unfoldedObject[key]["value"]) ? "<button class='nodeClusterButton row btn' style='clear: left; vertical-align: middle' onclick='" + onClickString + "'><b>&gt;&lt;</b></input>" : "") +
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
                                "<button class='nodeClusterButton row btn' onclick='" + onClickString + "'><b>==</b></button>" +
                                (isGeqLeqComparable(unfoldedObject[key]["qualifiers"][qualifierKey]) ? "<button class='nodeClusterButton row btn' style='clear: left; vertical-align: middle' onclick='" + onClickString + "'><b>&gt;&lt;</b></input>" : "") +
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
                        "<button class='nodeClusterButton row btn' onclick='" + onClickString + "'><b>==</b></button>" +
                        (isGeqLeqComparable(unfoldedObject[key]) ? "<button class='nodeClusterButton row btn' style='clear: left; vertical-align: middle' onclick='" + onClickString + "'><b>&gt;&lt;</b></input>" : "") +
                        "</div>" +
                        "</li>")
                }
            }
        }
    }
}

function openNodeInfo(nodeName, jsonResponse) {
    databaseJson = jsonResponse;
    //Object.keys(databaseJson)[0] works too
    document.getElementById("DatabaseItemList").hidden = false

    insertJsonAsList("DatabaseItemList", "", "")
}

function getNodeInfo(node) {
    sendRequest("get", "nodes/" + node.key + "/graphs/" + graphId, "",
        /* Response handler */
        function(response) {
            //console.log(response)
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