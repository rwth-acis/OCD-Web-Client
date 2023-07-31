function simulate(){
    var descriptiveVisualization = d3.select("body").select("#descriptiveVisualization");
    const width = 0.75 * screen.availWidth;
    const height = 0.75 * screen.availHeight;

    var currentOperationBox = descriptiveVisualization.append("box")
        .attr("class", "div")
        .attr("id", "currentOperationBox");
    currentOperationBox.append("p")
        .attr("id", "operationBoxTitle");
    currentOperationBox.append("ul")
        .attr("id", "operationList");

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

    function setCurrentColors(iteration) {
        var nodeColors = [];
        var edgeColors = [];
        graphData.nodes.forEach((node) => {
            nodeColors.push("rgb(" + node.rgbValue[iteration] +")");
        });
        graphData.edges.forEach((edge) => {
            edgeColors.push("rgb(" + edge.rgbValue[iteration] +")");
        });
        currentNodeColors = nodeColors;
        currentEdgeColors = edgeColors;
    }

    function countColor(color, currentColors){
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
    function setActiveColors(iteration){
        setCurrentColors(iteration);
        var nodeColors = [];
        var edgeColors = [];
        for(var i = 0; i < currentNodeColors.length; i++){
            if(!nodeColors.includes(currentNodeColors[i])){
                nodeColors.push(currentNodeColors[i]);
            }
        }
        for(var i = 0; i < currentEdgeColors.length; i++){
            if(!edgeColors.includes(currentEdgeColors[i])){
                edgeColors.push(currentEdgeColors[i]);
            }
        }
        activeNodeColors = nodeColors;
        activeEdgeColors = edgeColors;
    }

    function setColorsToBox(iteration){
        for(var i = 0; i < activeNodeColors.length; i++){
            if (document.getElementById("node color " + i)){
                var element = document.getElementById("node color " + i);
                element.remove();
            }
        }
        for(var i = 0; i < activeEdgeColors.length; i++){
            if (document.getElementById("edge color " + i)){
                var element = document.getElementById("edge color " + i);
                element.remove();
            }
        }
        setActiveColors(iteration);
        for(var i = 0; i < activeNodeColors.length; i++){
            color = activeNodeColors[i];
            const colorItem = document.createElement("li");
            colorItem.id = "node color " + i;
            if(color != "rgb(255,255,255)" && color != "rgb(220,220,220)"){
                count = countColor(color, currentNodeColors);
                colorItem.innerHTML += '<span style="display: inline-block; width: 20px; height: 20px; background-color:' + color +'; border-radius: 50%; margin-left: 5px; border: 1px solid black;"></span> ' + count;
                if(count > 1){
                    colorItem.innerHTML += ' nodes';
                }
                else {
                    colorItem.innerHTML += ' node';
                }
                colorList.appendChild(colorItem);
            }
        }
        for(var i = 0; i < activeEdgeColors.length; i++){
            color = activeEdgeColors[i];
            const colorItem = document.createElement("li");
            colorItem.id = "edge color " + i;
            if(color != "rgb(0,0,0)" && color != "rgb(220,220,220)"){
                count = countColor(color, currentEdgeColors);
                colorItem.innerHTML += '<span style="display: inline-block; width: 20px; height: 20px; background-color:' + color +'; border-radius: 50%; margin-left: 5px; border: 1px solid black;"></span> ' + count;
                if(count > 1){
                    colorItem.innerHTML += ' edges';
                }
                else {
                    colorItem.innerHTML += ' edge';
                }
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

    var svg = d3.select("#graph");

    var simulation = d3.forceSimulation(graphData.nodes)
        .force("charge", d3.forceManyBody().strength(-150))
        .force("link", d3.forceLink(graphData.edges).distance(105))
        .force("center", d3.forceCenter(width/2, height/2))
        .on("tick", ticked);

    var edge = svg.append("g")
        .selectAll("link")
        .data(graphData.edges)
        .enter().append("line")
        .attr("class", "link");

    var edgeStringValue = svg.append("g")
        .selectAll("text")
        .data(graphData.edges)
        .enter().append("text")
        .attr("font-size", 8);

    var edgeNumValue = svg.append("g")
        .selectAll("text")
        .data(graphData.edges)
        .enter().append("text")
        .attr("font-size", 8);

    var node = svg.append("g")
        .selectAll("circle")
        .data(graphData.nodes)
        .enter().append("circle")
        .attr("r", function(d){ return 10 + (2 * d.degree); })
        .attr("id", function(d){ return "node" + d.id; })
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .call(drag());
 
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
        .call(drag());

    var nodeStringValue = svg.append("g")
        .selectAll("text")
        .data(graphData.nodes)
        .enter().append("text")
        .attr("id", function(d){ return "nodeStringValue " + d.id; })
        .attr("font-size", 8)
        .attr("dx", 0)
        .attr("dy", 0);

    var nodeNumValue = svg.append("g")
        .selectAll("text")
        .data(graphData.nodes)
        .enter().append("text")
        .attr("id", function(d){ return "nodeNumValue " + d.id; })
        .attr("font-size", 8)
        .attr("dx", 0)
        .attr("dy", 0);

    var nodeLabelGroup = svg.append("g")
        .selectAll("circle")
        .data(graphData.nodes)
        .enter().append("g")
        .attr('id', function(d) { return "labelGroup" + d.id; })
        .style("opacity", 0)
        .call(drag());

    var nodeLabelRect = nodeLabelGroup.append("rect")
        .attr('dx', 0)
        .attr('dy', 0)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr("fill", function(d) { return "rgb(220,220,220)"; })
        .attr('id', function(d) { return "labelGroup" + d.id; });

    var nodeLabel = nodeLabelGroup.append("text")
        .attr("font-size", 8)
        .attr('dx', 0)
        .attr('dy', 0)
        .attr('id', function(d) { return "labelGroup" + d.id; });

    nodeLabel.selectAll("tspan")
        .data(function(d) { return d.label.split('\n'); })
        .enter().append("tspan")
        .attr("dx", function(_, i) { return i === 0 ? 0 : -50; })
        .attr("dy", function(_, i) { return i === 0 ? "0" : "1.2em"; })
        .text(function(d) { return d; });

    nodeLabelGroup.each(function(d) {
        d3.select(this)
        .on("mouseover", function() {
            d3.select(this).style("opacity", 1);
        })
        .on("mouseout", function() {
            d3.select(this).style("opacity", 0);
        });
    });

    var zoom = d3.zoom()
        .scaleExtent([0.05, 10])
        .on("zoom", zoomed);

    function zoomed(e) {
        edge.attr('transform', e.transform);
        edgeStringValue.attr('transform', e.transform);
        edgeNumValue.attr('transform', e.transform);
        node.attr('transform', e.transform);
        nodeID.attr('transform', e.transform);
        nodeStringValue.attr('transform', e.transform);
        nodeNumValue.attr('transform', e.transform);
        nodeLabelGroup.attr('transform', e.transform);
    }

    svg.call(zoom);
    let currentIteration = -1;
    nextImage();

    // Function to render the graph using d3.js
    function renderGraph(iteration, nodes, edges) {
        edge.data(edges)
            .style("stroke", function(d) { return "rgb(" + d.rgbValue[iteration] + ")"; });

        edgeStringValue.data(edges)
            .attr("width", function(d) { var len = d.stringValue[iteration].length; return len; })
            .attr("height", 8)
            .text(function(d){ return d.stringValue[iteration]; })
            .attr("fill", function(d) { return "rgb(" + d.rgbValue[iteration] + ")"; });

        edgeNumValue.data(edges)
            .attr("width", function(d) { 
                if(d.numValue[iteration] == 4.9E-324){ return 0; } 
                else{ 
                    var str = d.numValue[iteration].toString(); 
                    return str.length; 
                }})
            .attr("height", 8)
            .text(function(d){ 
                if(d.numValue[iteration] == 4.9E-324){ return ""; } 
                else{ return d.numValue[iteration]; } 
            })
            .attr("fill", function(d) { 
                if(d.numValue[iteration] == 4.9E-324){ 
                    return "rgb(255,255,255)"; 
                } 
                else{ 
                    col = ""; 
                    if (d.numValue[iteration] == null){
                        col = "rgb(255,255,255)";
                    } 
                    else {
                        col = "rgb(" + d.rgbValue[iteration] + ")";
                    } 
                    return col; 
                } 
            });

        node.data(nodes)
            .attr("fill", function(d) { return "rgb(" + d.rgbValue[iteration] + ")"; });

        nodeStringValue.data(nodes)
            .attr("width", function(d) { var len = d.stringValue[iteration].length; return 4 * len; })
            .attr("height", 8)
            .text(function(d){ return d.stringValue[iteration]; })
            .attr("fill", function(d) {
                var col = "";
                if (d.stringValue[iteration] == ""){
                    col = "rgb(255,255,255)";
                }
                if (d.stringValue[iteration] != "" && d.rgbValue[iteration][0]+d.rgbValue[iteration][1]+d.rgbValue[iteration][2] == 765){
                    col = "rgb(0,0,0)";
                }
                else {
                    col = "rgb(" + d.rgbValue[iteration] + ")";
                }
                return col;
            });

        nodeNumValue.data(nodes)
            .attr("width", function(d) { 
                if(d.numValue[iteration] == 4.9E-324){ return; } 
                else{ 
                    var n = 0; 
                    var temp = 1; 
                    while(temp <= d.numValue[iteration]){ 
                        temp *= 10; 
                        n += 1;
                    }; 
                    if(d.numValue[iteration] == 0){n = 1}; 
                    return 4 * n; 
                }})
            .attr("height", 8)
            .text(function(d){ 
                if(d.numValue[iteration] == 4.9E-324){ return; } 
                else{ return d.numValue[iteration]; }})
            .attr("fill", function(d) {
                if(d.numValue[iteration] == 4.9E-324){ return; } 
                else {
                    var col = "";
                    if (d.numValue[iteration] == null){
                        col = "rgb(255,255,255)";
                    }
                    if (d.numValue[iteration] != null && d.rgbValue[iteration][0]+d.rgbValue[iteration][1]+d.rgbValue[iteration][2] == 765){
                        col = "rgb(0,0,0)";
                    }
                    else {
                        col = "rgb(" + d.rgbValue[iteration] + ")";
                    }
                    return col;
                }
            });

        nodeLabelRect
            .attr("width", function(d) {  
                if(d.label.length < 10){ 
                    return 6 * d.label.length; 
                } 
                else { 
                    return 5 * d.label.length; 
                }})
            .attr("height", 15);

        nodeLabel
            .attr("width", function(d) { 
                if(d.label.length < 10){ 
                    return 6 * d.label.length; 
                } 
                else { 
                    return 5 * d.label.length; 
                }}) 
            .attr("height", 15);

        simulation.on("tick", ticked);
    }

    function ticked() {
        edge.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        edgeStringValue.attr("x", function(d) { return (d.source.x + d.target.x) / 2; })
            .attr("y", function(d) { return ((d.source.y + d.target.y) / 2) -4; });

        edgeNumValue.attr("x", function(d) { return ((d.source.x + d.target.x) / 2); })
            .attr("y", function(d) { return ((d.source.y + d.target.y) / 2) +8; });

        node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        nodeID.attr("x", function(d) { 
            var n = 0; 
            var temp = 1; 
            while(temp <= d.id + elements){ 
                temp *= 10; 
                n += 1;
            }; 
            if(d.id + elements == 0){
                n = 1;
            }; 
            return (d.x - 2*n); 
        })
            .attr("y", function(d) { return d.y +2; });

        nodeStringValue.attr("x", function(d) { return d.x + (2 * d.degree) +11; })
            .attr("y", function(d) { return d.y -2; });

        nodeNumValue.attr("x", function(d) { return d.x + (2 * d.degree) +11; })
            .attr("y", function(d) { return d.y +6; });

        nodeLabelRect.attr("x", function(d) { return d.x -10; })
            .attr("y", function(d) { return d.y -10; });

        nodeLabel.attr("x", function(d) { return d.x -6; })
            .attr("y", function(d) { return d.y; });
    }

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

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    function renderLaTeX(equation) {
        const parts = equation.split(/(\$.*?\$)/);
        var result = "";
        for(var i = 0; i < parts.length; i++){
            if(parts[i].includes("$")){
                parts[i] = parts[i].replace(/\$/g, ""); // get rid of all $ symbols
                parts[i] = "\\(" + parts[i] + "\\)";
                result += parts[i];
            }
            else{
                result += parts[i];
            }
        }
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, result]);
        return "<p>" + result + "</p>";
    }

    /*----------------------------Play, Stop etc. buttons--------------------------------*/

    const playButton = document.getElementById("playButton");
    const stopButton = document.getElementById("stopButton");
    const nextButton = document.getElementById("nextButton");
    const prevButton = document.getElementById("prevButton");

    playButton.addEventListener("click", function() {
        nextImage();
        slideshowInterval = setInterval(nextImage, 5000);
    });

    stopButton.addEventListener("click", function() {
        clearInterval(slideshowInterval);
    });

    nextButton.addEventListener("click", function() {
        clearInterval(slideshowInterval);
        nextImage();
        clearInterval(slideshowInterval);
    });

    prevButton.addEventListener("click", function() {
        clearInterval(slideshowInterval);
        prevImage();
        clearInterval(slideshowInterval);
    });

    let slideshowInterval = setInterval(nextImage, 5000);

    function resetOpacity() {
        edge.style("opacity", 1);
        edgeStringValue.style("opacity", 1);
        edgeNumValue.style("opacity", 1);
        node.style("opacity", 1);
        nodeID.style("opacity", 1);
        nodeStringValue.style("opacity", 1);
        nodeNumValue.style("opacity", 1);
    }

    function setOpacity(iteration) {
        resetOpacity();
        const colorListItems = document.querySelectorAll("#colorList span");
        var allClickedColors = [];

      colorListItems.forEach((colorItem) => {
        colorItem.addEventListener("click", function() {
          // get the background color of the clicked span element
          var clickedColor = colorItem.style.backgroundColor;
          // check if the clicked color is already in allClickedColors
          if (allClickedColors.includes(clickedColor)) {
            this.style.borderWidth = "1px";
            // remove the clicked color from allClickedColors
            allClickedColors = allClickedColors.filter((color) => color !== clickedColor);
          } else {
            this.style.borderWidth = "2px";
            allClickedColors.push(clickedColor);
          }
          // loop through all nodes in the network and set their opacity based on allClickedColors
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

          // loop through all edges in the network and set their opacity based on allClickedColors
          edge.style("opacity", function(d) {
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

          // if there are no colors clicked, set the opacity values to 1
          if (allClickedColors.length === 0) {
            resetOpacity();
          }
        });
      });
    }

    function nextImage() {
        if (currentIteration < iterations-1) {
            currentIteration++;
            setColorsToBox(currentIteration);
            setOpacity(currentIteration);
            document.getElementById("operationBoxTitle").innerHTML = "Current Operation " + currentIteration + ":";
            if (!document.getElementById("iteration" + currentIteration)){
                const operationItem = document.createElement("li");
                operationItem.id = "iteration" + currentIteration;
                operationItem.innerHTML = renderLaTeX(graphData.shortDescription[currentIteration]);
                operationList.appendChild(operationItem);

                // Create and append popup
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

                var text = document.getElementById(operationItem.id);
                text.addEventListener("click", function(event) {
                  hidePopups();
                  // Show the corresponding popup
                  var rect = text.getBoundingClientRect();
                  popup.style.left = rect.left + "px";
                  popup.style.top = rect.bottom + "px"; 
                  if (popup.style.display === "block") {
                    popup.style.display = "none";
                  } else {
                    popup.style.display = "block";
                  }
                });

                // Event listener for the popup itself to hide it when clicked
                popup.addEventListener("click", function(event) {
                  popup.style.display = "none";
                  event.stopPropagation();
                });
            }
            renderGraph(currentIteration, graphData.nodes, graphData.edges);
        }
    }

    // Function to hide all popups
    function hidePopups() {
        for (var i = 0; i < graphData.shortDescription.length; i++) {
            var popup = document.getElementById("description" + i);
            if(popup) {
                popup.style.display = "none";
            }
        }
    }

    function prevImage() {
        if (0 < currentIteration) {
            currentIteration--;
            setColorsToBox(currentIteration);
            setOpacity(currentIteration);
            document.getElementById("operationBoxTitle").innerHTML = "Current Operation " + currentIteration + ":";
            if (document.getElementById("iteration" + (currentIteration+1))){
                var element = document.getElementById("iteration" + (currentIteration+1));
                var description = document.getElementById("description" + (currentIteration+1));
                element.remove();
                description.remove();
            }
            renderGraph(currentIteration, graphData.nodes, graphData.edges);
        }
    }

}