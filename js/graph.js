// IGNORE THIS
//
// const width = window.innerWidth;
// const height = window.innerHeight;
//
// const data = {
//     nodes: [
//         { id: "Physics", group: 1 },
//         { id: "Math", group: 1 },
//         { id: "Calculus", group: 2 },
//         { id: "Mechanics", group: 2 },
//         { id: "Astronomy", group: 3 }
//     ],
//     links: [
//         { source: "Physics", target: "Math" },
//         { source: "Calculus", target: "Math" },
//         { source: "Mechanics", target: "Physics" },
//         { source: "Astronomy", target: "Physics" }
//     ]
// };
//
// const svg = d3.select("#graph")
//     .attr("width", width / 2  )
//     .attr("height", height / 2)
//     .call(d3.zoom().on("zoom", (event) => {
//         container.attr("transform", event.transform);
//     }));
//
// const container = svg.append("g");
//
// // Force Simulation setup
// const simulation = d3.forceSimulation(data.nodes)
//     .force("link", d3.forceLink(data.links).id(d => d.id).distance(100))
//     .force("charge", d3.forceManyBody().strength(-200)) // Repulsion
//     .force("center", d3.forceCenter(width / 2, height / 2));
//
// // Links
// const link = container.append("g")
//     .attr("class", "links")
//     .selectAll("line")
//     .data(data.links)
//     .enter().append("line")
//     .attr("class", "link");
//
//
// // Nodes
// const node = container.append("g")
//     .attr("class", "nodes")
//     .selectAll("circle")
//     .data(data.nodes)
//     .enter().append("circle")
//     .attr("class", "node")
//     .attr("r", 8)
//     .attr("fill", d => d3.schemeCategory10[d.group])
//     .call(d3.drag()
//         .on("start", dragstarted)
//         .on("drag", dragged)
//         .on("end", dragended));
//
// // Labels
// const label = container.append("g")
//     .selectAll("text")
//     .data(data.nodes)
//     .enter().append("text")
//     .text(d => d.id)
//     .attr("dx", 12)
//     .attr("dy", 4);
//
// simulation.on("tick", () => {
//     link.attr("x1", d => d.source.x)
//         .attr("y1", d => d.source.y)
//         .attr("x2", d => d.target.x)
//         .attr("y2", d => d.target.y);
//
//     node.attr("cx", d => d.x)
//         .attr("cy", d => d.y);
//
//     label.attr("x", d => d.x)
//         .attr("y", d => d.y);
// });
//
// // Dragging behavior
// function dragstarted(event, d) {
//     if (!event.active) simulation.alphaTarget(0.3).restart();
//     d.fx = d.x; d.fy = d.y;
// }
// function dragged(event, d) {
//     d.fx = event.x; d.fy = event.y;
// }
// function dragended(event, d) {
//     if (!event.active) simulation.alphaTarget(0);
//     d.fx = null; d.fy = null;
// }