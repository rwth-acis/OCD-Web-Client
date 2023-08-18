function simulate(){

    // Select the HTML element with the id "descriptiveVisualization" inside the body
    var descriptiveVisualization = d3.select("body").select("#descriptiveVisualization");

    // Set width and height based on the available screen size
    const width = 0.75 * screen.availWidth;
    const height = 0.75 * screen.availHeight;

    // Create the operation box inside the "descriptiveVisualization" element
    var currentOperationBox = descriptiveVisualization.append("box")
        .attr("class", "div")
        .attr("id", "currentOperationBox");
    currentOperationBox.append("p")
        .attr("id", "operationBoxTitle");
    currentOperationBox.append("ul")
        .attr("id", "operationList");

    // Create the active color box inside the "descriptiveVisualization" element
    var activeColorBox = descriptiveVisualization.append("box")
        .attr("class", "div")
        .attr("id", "activeColorBox");
    activeColorBox.append("p")
        .attr("id", "colorBoxTitle");
    activeColorBox.append("ul")
        .attr("id", "colorList");

    const operationList = document.getElementById("operationList");

    document.getElementById("colorBoxTitle").innerHTML = "Active Colors:";

    const colorList = document.getElementById("colorList");
    colorList.style.listStyleType = "none";


    var currentNodeColors = [];
    var currentEdgeColors = [];
    // Function to set the colors of nodes and edges for a given iteration
    function setCurrentColors(iteration) {
        var nodeColors = [];
        var edgeColors = [];

        // Iterate through each node/edge in the graph data and extract the color for the given iteration
        graphData.nodes.forEach((node) => {
            nodeColors.push("rgb(" + node.rgbValue[iteration] +")");
        });
        graphData.edges.forEach((edge) => {
            edgeColors.push("rgb(" + edge.rgbValue[iteration] +")");
        });

        currentNodeColors = nodeColors;
        currentEdgeColors = edgeColors;
    }


    // Function to count the occurrences of a specific color in a given list of colors
    function countColor(color, currentColors) {
        var count = 0;
        for(var i = 0; i < currentColors.length; i++){
            if(currentColors[i] == color){
                count += 1;
            }
        }
        return count;
    }


    var activeNodeColors = [];
    var activeEdgeColors = [];
    // Function to set the active colors for a given iteration
    function setActiveColors(iteration) {
        // Call the function to update the current node and edge colors based on the given iteration
        setCurrentColors(iteration);
        var nodeColors = [];
        var edgeColors = [];

        // Iterate through the current node colors
        for(var i = 0; i < currentNodeColors.length; i++){
            // Check if the color is not already in the nodeColors list
            if(!nodeColors.includes(currentNodeColors[i])){
                // Add the unique color to the nodeColors list
                nodeColors.push(currentNodeColors[i]);
            }
        }

        // Iterate through the current edge colors
        for(var i = 0; i < currentEdgeColors.length; i++){
            // Check if the color is not already in the edgeColors list
            if(!edgeColors.includes(currentEdgeColors[i])){
                // Add the unique color to the edgeColors list
                edgeColors.push(currentEdgeColors[i]);
            }
        }

        activeNodeColors = nodeColors;
        activeEdgeColors = edgeColors;
    }


    // Function to update colors in the active color box based on the colors for a given iteration
    function setColorsToBox(iteration) {
        // Remove the active colors of the last iteration for nodes and edges
        for (var i = 0; i < activeNodeColors.length; i++) {
            if (document.getElementById("node color " + i)) {
                var element = document.getElementById("node color " + i);
                element.remove();
            }
        }
        for (var i = 0; i < activeEdgeColors.length; i++) {
            if (document.getElementById("edge color " + i)) {
                var element = document.getElementById("edge color " + i);
                element.remove();
            }
        }

        // Call the function to update the active node and edge colors
        setActiveColors(iteration);

        // Update the box with the new active node colors
        for (var i = 0; i < activeNodeColors.length; i++) {
            color = activeNodeColors[i];
            const colorItem = document.createElement("li");
            colorItem.id = "node color " + i;
            
            // Check if the color is not white or gray
            if (color != "rgb(255,255,255)" && color != "rgb(220,220,220)") {
                count = countColor(color, currentNodeColors);

                // Construct an element to display the color and its count
                colorItem.innerHTML += '<span style="display: inline-block; width: 20px; height: 20px; background-color:' + color +'; border-radius: 50%; margin-left: 5px; border: 1px solid black;"></span> ' + count;
                if (count > 1) {
                    colorItem.innerHTML += ' nodes';
                } else {
                    colorItem.innerHTML += ' node';
                }

                // Append the node color element to the colorList
                colorList.appendChild(colorItem);
            }
        }

        // Update the box with the new active edge colors
        for (var i = 0; i < activeEdgeColors.length; i++) {
            color = activeEdgeColors[i];
            const colorItem = document.createElement("li");
            colorItem.id = "edge color " + i;

            // Check if the color is not black or gray
            if (color != "rgb(0,0,0)" && color != "rgb(220,220,220)") {
                count = countColor(color, currentEdgeColors);

                // Construct an element to display the color and its count
                colorItem.innerHTML += '<span style="display: inline-block; width: 20px; height: 20px; background-color:' + color +'; border-radius: 50%; margin-left: 5px; border: 1px solid black;"></span> ' + count;
                if (count > 1) {
                    colorItem.innerHTML += ' edges';
                } else {
                    colorItem.innerHTML += ' edge';
                }

                // Append the edge color element to the colorList
                colorList.appendChild(colorItem);
            }
        }
    }


    var iterations = 0;
    var elements = graphData.nodes.length;
    graphData.nodes.forEach((node) => {
        iterations = node.numValue.length;
        if (node.id < elements){
            elements = node.id;
        }
    });

    graphData.nodes.forEach((node) => {
        node.id -= elements;
    });

    graphData.edges.forEach((edge) => {
        edge.source -= elements;
        edge.target -= elements;
    });


    // Select the SVG element with the id "graph"
    var svg = d3.select("#graph");

    // Create a force simulation for node positioning and interaction
    var simulation = d3.forceSimulation(graphData.nodes)
        .force("charge", d3.forceManyBody().strength(-150))  
        .force("link", d3.forceLink(graphData.edges).distance(105))  
        .force("center", d3.forceCenter(width/2, height/2)) 
        .on("tick", ticked); 

    // Create a group for edges 
    var edge = svg.append("g")
        .selectAll("link")
        .data(graphData.edges)
        .enter().append("line")
        .attr("class", "link");  

    // Create a group for edge string values  
    var edgeStringValue = svg.append("g")
        .selectAll("text")
        .data(graphData.edges)
        .enter().append("text")
        .attr("font-size", 8);  

    // Create a group for edge numerical values 
    var edgeNumValue = svg.append("g")
        .selectAll("text")
        .data(graphData.edges)
        .enter().append("text")
        .attr("font-size", 8);  

    // Create a group for nodes  
    var node = svg.append("g")
        .selectAll("circle")
        .data(graphData.nodes)
        .enter().append("circle")
        .attr("r", function(d){ return 10 + (2 * d.degree); }) // Set the radius of the circles based on the node degree
        .attr("id", function(d){ return "node" + d.id; }) 
        .attr('stroke', 'black') 
        .attr('stroke-width', 1) 
        .call(drag()); // Drag behavior for the circle elements

    // Create a group for node IDs  
    var nodeID = svg.append("g")
        .selectAll("text")
        .data(graphData.nodes)
        .enter().append("text")
        .text(function(d) { return d.id + elements; })  
        .attr("id", function(d){ return "nodeID " + d.id; })  
        .attr("font-size", 8) 
        .attr("dx", 0) 
        .attr("dy", 0) 
        .attr("fill", function(d) { return "rgb(0, 0, 0)"; }) 
        .call(drag()); // Drag behavior for the ID elements

    // Create a group for node string values  
    var nodeStringValue = svg.append("g")
        .selectAll("text")
        .data(graphData.nodes)
        .enter().append("text")
        .attr("id", function(d){ return "nodeStringValue " + d.id; })  
        .attr("font-size", 8)  
        .attr("dx", 0)  
        .attr("dy", 0);  

    // Create a group for node numerical values  
    var nodeNumValue = svg.append("g")
        .selectAll("text")
        .data(graphData.nodes)
        .enter().append("text")
        .attr("id", function(d){ return "nodeNumValue " + d.id; })  
        .attr("font-size", 8) 
        .attr("dx", 0)  
        .attr("dy", 0);  

    // Create a group for node labels
    var nodeLabelGroup = svg.append("g")
        .selectAll("circle") 
        .data(graphData.nodes) 
        .enter().append("g")  
        .attr('id', function(d) { return "labelGroup" + d.id; })  
        .style("opacity", 0) // Set initial opacity to 0 (hidden)
        .call(drag()); // Drag behavior for the label groups

    // Append a rectangle to each label group for background
    var nodeLabelRect = nodeLabelGroup.append("rect")
        .attr('dx', 0)
        .attr('dy', 0) 
        .attr("fill", "white") 
        .attr("stroke", "black") 
        .attr("stroke-width", 1) 
        .attr('rx', 3)
        .attr('ry', 3)
        .attr("fill", function(d) { return "rgb(220,220,220)"; }) // Set background color to gray
        .attr('id', function(d) { return "labelGroup" + d.id; }); 

    // Append a text element to each label group 
    var nodeLabel = nodeLabelGroup.append("text")
        .attr("font-size", 8) 
        .attr('dx', 0) 
        .attr('dy', 0) 
        .attr('id', function(d) { return "labelGroup" + d.id; }); 

    // Create tspans within the label text for multi-line labels
    nodeLabel.selectAll("tspan")
        .data(function(d) { return d.label.split('\n'); }) 
        .enter().append("tspan") 
        .attr("dx", function(_, i) { return i === 0 ? 0 : -50; }) 
        .attr("dy", function(_, i) { return i === 0 ? "0" : "1.2em"; }) 
        .text(function(d) { return d; }); 

    // Define interaction behavior for the label groups
    nodeLabelGroup.each(function(d) {
        d3.select(this)
            .on("mouseover", function() {
                d3.select(this).style("opacity", 1); // Change opacity on mouseover
            })
            .on("mouseout", function() {
                d3.select(this).style("opacity", 0); // Change opacity back on mouseout
            });
    });


    // Create a zoom behavior using D3's zoom functionality
    var zoom = d3.zoom()
        .scaleExtent([0.05, 10]) // Set the range of allowable zoom levels
        .on("zoom", zoomed);  


    // Function to handle zoom events
    function zoomed(e) {
        // Apply the zoom transform to various visual elements using their 'transform' attribute
        edge.attr('transform', e.transform);  
        edgeStringValue.attr('transform', e.transform);  
        edgeNumValue.attr('transform', e.transform);  
        node.attr('transform', e.transform); 
        nodeID.attr('transform', e.transform);  
        nodeStringValue.attr('transform', e.transform);  
        nodeNumValue.attr('transform', e.transform);  
        nodeLabelGroup.attr('transform', e.transform);  
    }


    // Attach the zoom behavior to the SVG container
    svg.call(zoom);

    // Initialize a variable to track the current iteration
    let currentIteration = -1;

    // Call the function to display the next visualization step
    nextImage();


    // Function to render graph elements based on a given iteration
    function renderGraph(iteration, nodes, edges) {
        // Update edge elements with color based on rgbValue of the given iteration
        edge.data(edges)
            .style("stroke", function(d) { return "rgb(" + d.rgbValue[iteration] + ")"; });

        // Update edge string value elements
        edgeStringValue.data(edges)
            .attr("width", function(d) { var len = d.stringValue[iteration].length; return len; })
            .attr("height", 8)
            .text(function(d){ return d.stringValue[iteration]; })
            .attr("fill", function(d) { return "rgb(" + d.rgbValue[iteration] + ")"; });

        // Update edge numerical value elements
        edgeNumValue.data(edges)
            .attr("width", function(d) {
                if (d.numValue[iteration] == 4.9E-324) { return 0; }
                else {
                    var str = d.numValue[iteration].toString();
                    return str.length;
                }
            })
            .attr("height", 8)
            .text(function(d) {
                if (d.numValue[iteration] == 4.9E-324) { return ""; }
                else { return d.numValue[iteration]; }
            })
            .attr("fill", function(d) {
                if (d.numValue[iteration] == 4.9E-324) {
                    return "rgb(255,255,255)";
                } else {
                    var col = "";
                    if (d.numValue[iteration] == null) {
                        col = "rgb(255,255,255)";
                    } else {
                        col = "rgb(" + d.rgbValue[iteration] + ")";
                    }
                    return col;
                }
            });

        // Update node elements with color based on rgbValue of the given iteration
        node.data(nodes)
            .attr("fill", function(d) { return "rgb(" + d.rgbValue[iteration] + ")"; });

        // Update node string value elements
        nodeStringValue.data(nodes)
            .attr("width", function(d) { var len = d.stringValue[iteration].length; return 4 * len; })
            .attr("height", 8)
            .text(function(d) { return d.stringValue[iteration]; })
            .attr("fill", function(d) {
                var col = "";
                if (d.stringValue[iteration] == "") {
                    col = "rgb(255,255,255)";
                }
                if (d.stringValue[iteration] != "" && d.rgbValue[iteration][0] + d.rgbValue[iteration][1] + d.rgbValue[iteration][2] == 765) {
                    col = "rgb(0,0,0)";
                } else {
                    col = "rgb(" + d.rgbValue[iteration] + ")";
                }
                return col;
            });

        // Update node numerical value elements
        nodeNumValue.data(nodes)
            .attr("width", function(d) {
                if (d.numValue[iteration] == 4.9E-324) { return; }
                else {
                    var n = 0;
                    var temp = 1;
                    while (temp <= d.numValue[iteration]) {
                        temp *= 10;
                        n += 1;
                    };
                    if (d.numValue[iteration] == 0) { n = 1 };
                    return 4 * n;
                }
            })
            .attr("height", 8)
            .text(function(d) {
                if (d.numValue[iteration] == 4.9E-324) { return; }
                else { return d.numValue[iteration]; }
            })
            .attr("fill", function(d) {
                if (d.numValue[iteration] == 4.9E-324) { return; }
                else {
                    var col = "";
                    if (d.numValue[iteration] == null) {
                        col = "rgb(255,255,255)";
                    }
                    if (d.numValue[iteration] != null && d.rgbValue[iteration][0] + d.rgbValue[iteration][1] + d.rgbValue[iteration][2] == 765) {
                        col = "rgb(0,0,0)";
                    } else {
                        col = "rgb(" + d.rgbValue[iteration] + ")";
                    }
                    return col;
                }
            });

        // Update node label rectangle elements with width and height based on label length
        nodeLabelRect
            .attr("width", function(d) {
                if (d.label.length < 10) {
                    return 6 * d.label.length;
                } else {
                    return 5 * d.label.length;
                }
            })
            .attr("height", 15);

        // Update node label text elements with width and height based on label length
        nodeLabel
            .attr("width", function(d) {
                if (d.label.length < 10) {
                    return 6 * d.label.length;
                } else {
                    return 5 * d.label.length;
                }
            })
            .attr("height", 15);

        simulation.on("tick", ticked);
    }


    // Function to update the positions of various graph elements during simulation ticks
    function ticked() {
        // Update edge line positions
        edge.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        // Update edge string value positions
        edgeStringValue.attr("x", function(d) { return (d.source.x + d.target.x) / 2; })
            .attr("y", function(d) { return ((d.source.y + d.target.y) / 2) - 4; });

        // Update edge numerical value positions
        edgeNumValue.attr("x", function(d) { return ((d.source.x + d.target.x) / 2); })
            .attr("y", function(d) { return ((d.source.y + d.target.y) / 2) + 8; });

        // Update node positions
        node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        // Update node ID positions
        nodeID.attr("x", function(d) {
                var n = 0;
                var temp = 1;
                while (temp <= d.id + elements) {
                    temp *= 10;
                    n += 1;
                };
                if (d.id + elements == 0) {
                    n = 1;
                };
                return (d.x - 2 * n);
            })
            .attr("y", function(d) { return d.y + 2; });

        // Update node string value positions
        nodeStringValue.attr("x", function(d) { return d.x + (2 * d.degree) + 11; })
            .attr("y", function(d) { return d.y - 2; });

        // Update node numerical value positions
        nodeNumValue.attr("x", function(d) { return d.x + (2 * d.degree) + 11; })
            .attr("y", function(d) { return d.y + 6; });

        // Update node label rectangle positions
        nodeLabelRect.attr("x", function(d) { return d.x - 10; })
            .attr("y", function(d) { return d.y - 10; });

        // Update node label text positions
        nodeLabel.attr("x", function(d) { return d.x - 6; })
            .attr("y", function(d) { return d.y; });
    }


    // Function that defines drag behavior for nodes in the graph
    function drag() {
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();  
            d.fx = d.x; 
            d.fy = d.y; 
        } 

        function dragged(event, d) {
            d.fx = event.x; 
            d.fy = event.y; 
        } 

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);  
            d.fx = null; 
            d.fy = null; 
        }

        // Return a D3 drag behavior with defined start, drag, and end events
        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }


    // Function to render LaTeX equations by adding MathJax formatting
    function renderLaTeX(equation) {
        // Split the equation into parts using '$' as a delimiter
        const parts = equation.split(/(\$.*?\$)/);
        var result = "";
        
        // Process each part of the equation
        for(var i = 0; i < parts.length; i++) {
            if (parts[i].includes("$")) {
                parts[i] = parts[i].replace(/\$/g, ""); // Remove all '$' symbols
                parts[i] = "\\(" + parts[i] + "\\)"; // Wrap equation in MathJax formatting
                result += parts[i]; // Append the formatted part to the result
            } else {
                result += parts[i]; // If no LaTeX formatting needed
            }
        }
        
        // Queue the rendering of LaTeX equations with MathJax and return the result
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, result]);
        return "<p>" + result + "</p>"; // Wrap the result in a paragraph tag
    }


    /*----------------------------Play, Stop etc. buttons--------------------------------*/


    // Get references to HTML button elements for controlling the image slideshow
    const playButton = document.getElementById("playButton");
    const stopButton = document.getElementById("stopButton");
    const nextButton = document.getElementById("nextButton");
    const prevButton = document.getElementById("prevButton");


    // Event listener for the "Play" button
    playButton.addEventListener("click", function() {
        nextImage(); // Display the next image
        slideshowInterval = setInterval(nextImage, 5000); // Start a interval to automatically switch to the next image every 5000 milliseconds
    });

    // Event listener for the "Stop" button
    stopButton.addEventListener("click", function() {
        clearInterval(slideshowInterval); // Clear the interval to stop the automatic slideshow
    });

    // Event listener for the "Next" button
    nextButton.addEventListener("click", function() {
        clearInterval(slideshowInterval); // Clear the interval to stop the automatic slideshow
        nextImage(); // Display the next image
        clearInterval(slideshowInterval); // Clear the interval again to ensure no multiple intervals are active
    });

    // Event listener for the "Previous" button
    prevButton.addEventListener("click", function() {
        clearInterval(slideshowInterval); // Clear the interval to stop the automatic slideshow
        prevImage(); // Display the previous image
        clearInterval(slideshowInterval); // Clear the interval again to ensure no multiple intervals are active
    });


    // Set an initial interval to automatically switch to the next image every 5000 milliseconds
    let slideshowInterval = setInterval(nextImage, 5000);


    // Function to reset the opacity of all elements to 1 (fully visible)
    function resetOpacity() {
        edge.style("opacity", 1);
        edgeStringValue.style("opacity", 1);
        edgeNumValue.style("opacity", 1);
        node.style("opacity", 1);
        nodeID.style("opacity", 1);
        nodeStringValue.style("opacity", 1);
        nodeNumValue.style("opacity", 1);
    }
    

    // Function to set opacity of elements based on clicked colors
    function setOpacity(iteration) {
        resetOpacity(); // Reset the opacity of all elements to 1
        
        // Get all span elements within the color list
        const colorListItems = document.querySelectorAll("#colorList span");
        var allClickedColors = []; 

        // Iterate through each color item in the color list
        colorListItems.forEach((colorItem) => {
            colorItem.addEventListener("click", function() {
                var clickedColor = colorItem.style.backgroundColor; // Get the clicked color
                
                // Toggle the border width based on whether the color is clicked or not
                if (allClickedColors.includes(clickedColor)) {
                    this.style.borderWidth = "1px";
                    allClickedColors = allClickedColors.filter((color) => color !== clickedColor);
                } else {
                    this.style.borderWidth = "2px";
                    allClickedColors.push(clickedColor);
                }
                
                // Set opacity of nodes based on the clicked colors
                node.style("opacity", function(d) {
                    var color = "rgb(" + d.rgbValue[iteration][0] + ", " + d.rgbValue[iteration][1] + ", " + d.rgbValue[iteration][2] + ")";
                    if (allClickedColors.includes(color)) {
                        return 1;
                    } else {
                        return 0;
                    }
                }); 
                nodeID.style("opacity", function(d) { return d3.select("#node" + d.id).style("opacity"); });
                nodeStringValue.style("opacity", function(d) {
                    var color = "rgb(" + d.rgbValue[iteration][0] + ", " + d.rgbValue[iteration][1] + ", " + d.rgbValue[iteration][2] + ")";
                    if (allClickedColors.includes(color)) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
                nodeNumValue.style("opacity", function(d) {
                    var color = "rgb(" + d.rgbValue[iteration][0] + ", " + d.rgbValue[iteration][1] + ", " + d.rgbValue[iteration][2] + ")";
                    if (allClickedColors.includes(color)) {
                        return 1;
                    } else {
                        return 0;
                    }
                });

                // Set opacity of edges based on clicked colors
                edge.style("opacity", function(d) {
                    // Get source, target, and edge colors
                    var sourceColor = "rgb(" + d.source.rgbValue[iteration][0] + ", " + d.source.rgbValue[iteration][1] + ", " + d.source.rgbValue[iteration][2] + ")";
                    var targetColor = "rgb(" + d.target.rgbValue[iteration][0] + ", " + d.target.rgbValue[iteration][1] + ", " + d.source.rgbValue[iteration][2] + ")";
                    var edgeColor = "rgb(" + d.rgbValue[iteration][0] + ", " + d.rgbValue[iteration][1] + ", " + d.rgbValue[iteration][2] + ")";
                    if (allClickedColors.includes(edgeColor)) {
                        var s = document.getElementById("node" + d.source.id);
                        var t = document.getElementById("node" + d.target.id);
                        s.style.opacity = 1;
                        t.style.opacity = 1;

                        var s_nodeID = document.getElementById("nodeID " + d.source.id);
                        var t_nodeID = document.getElementById("nodeID " + d.target.id);
                        s_nodeID.style.opacity = 1;
                        t_nodeID.style.opacity = 1;

                        var s_nodeStringValue = document.getElementById("nodeStringValue " + d.source.id);
                        var t_nodeStringValue = document.getElementById("nodeStringValue " + d.target.id);
                        s_nodeStringValue.style.opacity = 1;
                        t_nodeStringValue.style.opacity = 1;

                        var s_nodeNumValue = document.getElementById("nodeNumValue " + d.source.id);
                        var t_nodeNumValue = document.getElementById("nodeNumValue " + d.target.id);
                        s_nodeNumValue.style.opacity = 1;
                        t_nodeNumValue.style.opacity = 1;

                        return 1;
                    }
                    if (allClickedColors.includes(sourceColor) && allClickedColors.includes(targetColor)) {
                        return 1;  
                    }
                    else {
                        return 0; 
                    }
                });
                edgeStringValue.style("opacity", function(d) {
                    var sourceColor = "rgb(" + d.source.rgbValue[iteration][0] + ", " + d.source.rgbValue[iteration][1] + ", " + d.source.rgbValue[iteration][2] + ")";
                    var targetColor = "rgb(" + d.target.rgbValue[iteration][0] + ", " + d.target.rgbValue[iteration][1] + ", " + d.source.rgbValue[iteration][2] + ")";
                    var edgeColor = "rgb(" + d.rgbValue[iteration][0] + ", " + d.rgbValue[iteration][1] + ", " + d.rgbValue[iteration][2] + ")";
                    if (allClickedColors.includes(edgeColor)) {
                        var s = document.getElementById("node" + d.source.id);
                        var t = document.getElementById("node" + d.target.id);
                        s.style.opacity = 1;
                        t.style.opacity = 1;
                        return 1;
                    }
                    if (allClickedColors.includes(sourceColor) && allClickedColors.includes(targetColor)) {
                        return 1; 
                    }
                    else {
                        return 0; 
                    }
                  });
                edgeNumValue.style("opacity", function(d) {
                    var sourceColor = "rgb(" + d.source.rgbValue[iteration][0] + ", " + d.source.rgbValue[iteration][1] + ", " + d.source.rgbValue[iteration][2] + ")";
                    var targetColor = "rgb(" + d.target.rgbValue[iteration][0] + ", " + d.target.rgbValue[iteration][1] + ", " + d.source.rgbValue[iteration][2] + ")";
                    var edgeColor = "rgb(" + d.rgbValue[iteration][0] + ", " + d.rgbValue[iteration][1] + ", " + d.rgbValue[iteration][2] + ")";
                    if (allClickedColors.includes(edgeColor)) {
                        var s = document.getElementById("node" + d.source.id);
                        var t = document.getElementById("node" + d.target.id);
                        s.style.opacity = 1;
                        t.style.opacity = 1;
                        return 1;
                    }
                    if (allClickedColors.includes(sourceColor) && allClickedColors.includes(targetColor)) {
                        return 1; 
                    }
                    else {
                        return 0; 
                    }
                  }); 

                // Reset opacity values to 1 if no colors are clicked
                if (allClickedColors.length === 0) {
                    resetOpacity();
                }
            });
        });
    }


    // Function to display the next operation in the sequence
    function nextImage() {
        if (currentIteration < iterations - 1) {
            currentIteration++;
            
            // Update active color box and opacity for the current iteration
            setColorsToBox(currentIteration);
            setOpacity(currentIteration);
            
            // Update the title of the operation box
            document.getElementById("operationBoxTitle").innerHTML = "Current Operation " + currentIteration + ":";
            
            // Check if the operation item for the current iteration exists
            if (!document.getElementById("iteration" + currentIteration)) {
                // Create an operation item for the iteration
                const operationItem = document.createElement("li");
                operationItem.id = "iteration" + currentIteration;
                operationItem.innerHTML = renderLaTeX(graphData.shortDescription[currentIteration]);
                operationList.appendChild(operationItem);

                // Create and append a popup for detailed description
                var popup = document.createElement("div");
                popup.style.maxWidth = "55%";
                popup.id = "description" + currentIteration;
                popup.style.display = "none";
                popup.style.position = "absolute";
                popup.style.backgroundColor = "#dadada";
                popup.style.border = "2px solid black";
                popup.style.borderRadius = "5px";
                popup.style.padding = "5px";
                popup.innerHTML = renderLaTeX(graphData.detailedDescription[currentIteration]);
                document.body.appendChild(popup);

                // Add an event listener to the operation item to show/hide the corresponding popup
                var text = document.getElementById(operationItem.id);
                text.addEventListener("click", function(event) {
                    hidePopups();
                    var rect = text.getBoundingClientRect();
                    popup.style.left = rect.left + "px";
                    popup.style.top = rect.bottom + "px"; 
                    if (popup.style.display === "block") {
                        popup.style.display = "none";
                    } else {
                        popup.style.display = "block";
                    }
                });

                // Add an event listener to the popup itself to hide it when clicked
                popup.addEventListener("click", function(event) {
                    popup.style.display = "none";
                    event.stopPropagation();
                });
            }
            
            // Update the graph visualization for the current iteration
            renderGraph(currentIteration, graphData.nodes, graphData.edges);
        }
    }


    // Function to hide all popups
    function hidePopups() {
        for (var i = 0; i < graphData.shortDescription.length; i++) {
            var popup = document.getElementById("description" + i);
            if (popup) {
                popup.style.display = "none";
            }
        }
    }


    // Function to display the previous operation in the sequence
    function prevImage() {
        if (0 < currentIteration) {
            currentIteration--;
            
            // Update active color box and opacity for the current iteration 
            setColorsToBox(currentIteration);
            setOpacity(currentIteration);
            
            // Update the title of the operation box
            document.getElementById("operationBoxTitle").innerHTML = "Current Operation " + currentIteration + ":";
            
            // Check if the operation item for the next iteration exists and remove it 
            if (document.getElementById("iteration" + (currentIteration + 1))) {
                var element = document.getElementById("iteration" + (currentIteration + 1));
                var description = document.getElementById("description" + (currentIteration + 1));
                element.remove();
                description.remove();
            }
            
            // Update the graph visualization for the current iteration
            renderGraph(currentIteration, graphData.nodes, graphData.edges);
        }
    }


}