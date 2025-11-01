import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const EnhancedBPlusTreeVisualizer = ({ tree }) =>
{
  const svgRef = useRef();
  const [hoveredNode, setHoveredNode] = useState(null);

  console.log("Rendering BPlusTreeVisualizer with tree:", tree);
  
  useEffect(() =>
  {
    if (!tree || !tree.root) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1200;
    const height = 700;
    const dx = 100;
    const dy = 150;

    // Create hierarchy
    const hierarchy = d3.hierarchy(tree.root, (node) =>
    {
      // Only include children if they exist and have valid keys/pointers
      if (node.children)
      {
        return node.children.filter(child => 
          child && child.keys && child.keys.length > 0 && 
          (child.pointers || child.children)
        );
      }
      return null;
    });
    const layout = d3.tree().nodeSize([dx, dy]);
    layout(hierarchy);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, 60)`);

    // Calculate node widths based on content
    // Fixed width for each key block
    const KEY_BLOCK_WIDTH = 60;
    const POINTER_GAP = 10;
    
    const getNodeWidth = (node) =>
    {
      // Total width is number of keys * block width + gaps between them
      return node.keys.length * KEY_BLOCK_WIDTH + (node.keys.length - 1) * POINTER_GAP;
    };

    const levelMap = {};
    hierarchy.each(d => {
      if (!levelMap[d.depth]) levelMap[d.depth] = [];
      levelMap[d.depth].push(d);
    });

    Object.values(levelMap).forEach(nodesAtLevel =>
    {
      let currentX = 0;
      nodesAtLevel.forEach(node => {
        const nodeWidth = getNodeWidth(node.data);
        node.x = currentX + nodeWidth / 2;
        currentX += nodeWidth + 30; // 30px gap between nodes
      });

      const totalWidth = currentX - 30;
      const offset = -totalWidth / 2;
      nodesAtLevel.forEach(node => {
        node.x += offset;
      });
    });

    // --- LINKS with direct pointer lines
    const links = g.selectAll(".link")
      .data(hierarchy.links())
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#64748b")
      .attr("stroke-width", 2)
      .attr("d", (d) => {
        const sourceNode = d.source;
        const targetNode = d.target;
        
        // Find the index of this child among its siblings
        const childIndex = sourceNode.children.indexOf(targetNode);
        const numChildren = sourceNode.children.length;
        
        // Calculate source point based on child's position
        const sourceWidth = getNodeWidth(sourceNode.data);
        const segmentWidth = sourceWidth / numChildren;
        const sourceX = sourceNode.x - sourceWidth/2 + (childIndex + 0.5) * segmentWidth;
        const sourceY = sourceNode.y + 25;

        // Calculate target point
        const targetWidth = getNodeWidth(targetNode.data);
        const targetX = targetNode.x;
        const targetY = targetNode.y - 25;

        // Create a gentle curve
        const midY = (sourceY + targetY) / 2;
        
        return `
          M${sourceX},${sourceY}
          C${sourceX},${midY}
           ${targetX},${midY}
           ${targetX},${targetY}
        `;
      })
      .attr("opacity", 0)
      .attr("stroke-dasharray", function()
      {
        return this.getTotalLength();
      })
      .attr("stroke-dashoffset", function()
      {
        return this.getTotalLength();
      });

    // Animate links
    links
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr("opacity", 0.6)
      .attr("stroke-dashoffset", 0);

    // --- NODES
    const nodes = g
      .selectAll(".node")
      .data(hierarchy.descendants())
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer");

    // Node background with gradient
    const defs = svg.append("defs");
    
    // Gradient for leaf nodes
    const leafGradient = defs.append("linearGradient")
      .attr("id", "leafGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    leafGradient.append("stop")
      .attr("offset", "0%")
      .attr("style", "stop-color:#bb04afff;stop-opacity:1");
    leafGradient.append("stop")
      .attr("offset", "100%")
      .attr("style", "stop-color:#a00396;stop-opacity:1");

    // Gradient for internal nodes
    const internalGradient = defs.append("linearGradient")
      .attr("id", "internalGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    internalGradient.append("stop")
      .attr("offset", "0%")
      .attr("style", "stop-color:#5aadabff;stop-opacity:1");
    internalGradient.append("stop")
      .attr("offset", "100%")
      .attr("style", "stop-color:#4d9493;stop-opacity:1");

    // Create individual blocks for each key
    nodes.each(function(d)
    {
      const node = d3.select(this);
      const numKeys = d.data.keys.length;
      const isLeaf = d.data.pointers;
      const baseX = -getNodeWidth(d.data) / 2;

      // Create blocks for each key
      d.data.keys.forEach((key, i) =>
      {
        const blockX = baseX + i * (KEY_BLOCK_WIDTH + POINTER_GAP);
        
        // Add the block rectangle
        node.append("rect")
          .attr("class", "key-block")
          .attr("x", blockX)
          .attr("y", -25)
          .attr("width", KEY_BLOCK_WIDTH)
          .attr("height", 50)
          .attr("rx", 0) // Remove rounded corners
          .attr("fill", isLeaf ? "url(#leafGradient)" : "url(#internalGradient)")
          .attr("stroke", isLeaf ? "#960391" : "#4d9493")
          .attr("stroke-width", 2)
          .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.15))")
          .attr("opacity", 0)
          .transition()
          .delay(i * 100)
          .duration(600)
          .ease(d3.easeBackOut)
          .attr("opacity", 1);

        // Add key text
        node.append("text")
          .attr("x", blockX + KEY_BLOCK_WIDTH/2)
          .attr("y", 0)
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .style("fill", "white")
          .style("font-weight", "700")
          .style("font-size", "15px")
          .style("text-shadow", "0 1px 2px rgba(0,0,0,0.3)")
          .text(key)
          .attr("opacity", 0)
          .transition()
          .delay(i * 100 + 200)
          .duration(400)
          .attr("opacity", 1);

        // Add connecting lines between blocks in the same node
        if (i < numKeys - 1)
        {
          node.append("line")
            .attr("x1", blockX + KEY_BLOCK_WIDTH)
            .attr("y1", 0)
            .attr("x2", blockX + KEY_BLOCK_WIDTH + POINTER_GAP)
            .attr("y2", 0)
            .attr("stroke", isLeaf ? "#960391" : "#4d9493")
            .attr("stroke-width", 2)
            .attr("opacity", 0)
            .transition()
            .delay(i * 100 + 300)
            .duration(400)
            .attr("opacity", 1);
        }
      });
    });

    // Add node type badge
    nodes
      .append("circle")
      .attr("cx", (d) => -getNodeWidth(d.data) / 2 - 20) // Move badge to left of first block
      .attr("cy", 0)
      .attr("r", 8)
      .attr("fill", "rgba(255,255,255,0.3)")
      .attr("opacity", 0)
      .transition()
      .delay((_, i) => i * 80 + 300)
      .duration(400)
      .attr("opacity", 1);

    nodes
      .append("text")
      .attr("x", (d) => -getNodeWidth(d.data) / 2 - 20) // Move badge text to match circle
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("fill", "white")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .text((d) => d.data.pointers ? "L" : "I")
      .attr("opacity", 0)
      .transition()
      .delay((_, i) => i * 80 + 300)
      .duration(400)
      .attr("opacity", 1);

    // Add key count indicator
    nodes
      .append("text")
      .attr("x", (d) => getNodeWidth(d.data) / 2 - 18)
      .attr("y", -25 + 12)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("fill", "rgba(255,255,255,0.7)")
      .style("font-size", "10px")
      .style("font-weight", "600")
      .text((d) => `${d.data.keys.length}`)
      .attr("opacity", 0)
      .transition()
      .delay((_, i) => i * 80 + 400)
      .duration(400)
      .attr("opacity", 1);

    // Hover effects
    nodes
      .on("mouseover", function(event, d)
      {
        d3.select(this).select(".node-rect")
          .transition()
          .duration(200)
          .attr("stroke-width", 3)
          .style("filter", "drop-shadow(0 6px 12px rgba(0,0,0,0.25))");
        
        setHoveredNode(d);
      })
      .on("mouseout", function()
      {
        d3.select(this).select(".node-rect")
          .transition()
          .duration(200)
          .attr("stroke-width", 2)
          .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.15))");
        
        setHoveredNode(null);
      });

    // Level indicators
    const levels = {};
    hierarchy.descendants().forEach(d =>
    {
      if (!levels[d.depth]) levels[d.depth] = [];
      levels[d.depth].push(d);
    });

    Object.entries(levels).forEach(([depth, nodesAtLevel]) =>
    {
      const minX = Math.min(...nodesAtLevel.map(n => n.x));
      const maxX = Math.max(...nodesAtLevel.map(n => n.x));
      const avgY = nodesAtLevel[0].y;

      g.append("text")
        .attr("x", minX - 80)
        .attr("y", avgY)
        .attr("text-anchor", "end")
        .style("fill", "#64748b")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .text(depth === "0" ? "ROOT" : `LEVEL ${depth}`)
        .attr("opacity", 0)
        .transition()
        .delay(800)
        .duration(400)
        .attr("opacity", 0.7);
    });

    // Title with animation
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-weight", "800")
      .style("font-size", "24px")
      .style("fill", "#1e293b")
      .text("🌳 B+ Tree Structure")
      .attr("opacity", 0)
      .transition()
      .duration(800)
      .attr("opacity", 1);

    // Tree info
    const info = svg.append("g")
      .attr("transform", `translate(${width - 180}, 20)`);

    const infoBox = [
      { label: "Internal Order", value: tree.orderInternal },
      { label: "Leaf Order", value: tree.orderLeaf },
      { label: "Total Levels", value: Object.keys(levels).length }
    ];

    infoBox.forEach((item, i) =>
    {
      const g = info.append("g")
        .attr("transform", `translate(0, ${i * 25})`);
      
      g.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .style("font-size", "11px")
        .style("fill", "#64748b")
        .style("font-weight", "600")
        .text(`${item.label}:`)
        .attr("opacity", 0)
        .transition()
        .delay(1000 + i * 100)
        .duration(400)
        .attr("opacity", 1);
      
      g.append("text")
        .attr("x", 100)
        .attr("y", 0)
        .attr("text-anchor", "end")
        .style("font-size", "11px")
        .style("fill", "#1e293b")
        .style("font-weight", "700")
        .text(item.value)
        .attr("opacity", 0)
        .transition()
        .delay(1000 + i * 100)
        .duration(400)
        .attr("opacity", 1);
    });

  }, [tree]);

  return (
    <div style={{ marginTop: "2rem", textAlign: "center", position: "relative" }}>
      <svg ref={svgRef} width="1200" height="700" style={{ background: "#f8fafc", borderRadius: "12px" }} />
      
      {hoveredNode && (
        <div style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontSize: "13px",
          maxWidth: "250px"
        }}>
          <div style={{ fontWeight: "700", marginBottom: "8px", color: "#1e293b" }}>
            {hoveredNode.data.pointers ? "🍃 Leaf Node" : "🔷 Internal Node"}
          </div>
          <div style={{ color: "#64748b", marginBottom: "4px" }}>
            <strong>Keys:</strong> [{hoveredNode.data.keys.join(", ")}]
          </div>
          <div style={{ color: "#64748b", marginBottom: "4px" }}>
            <strong>Count:</strong> {hoveredNode.data.keys.length}
          </div>
          {hoveredNode.data.pointers && (
            <div style={{ color: "#64748b", fontSize: "11px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e2e8f0" }}>
              💡 Leaf nodes store actual data pointers
            </div>
          )}
        </div>
      )}
      
      <div style={{ 
        marginTop: "16px", 
        fontSize: "12px", 
        color: "#64748b",
        display: "flex",
        justifyContent: "center",
        gap: "24px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "20px", height: "20px", background: "#5aadabff", borderRadius: "4px" }}></div>
          <span>Internal Nodes (I)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "20px", height: "20px", background: "#bb04afff", borderRadius: "4px" }}></div>
          <span>Leaf Nodes (L)</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBPlusTreeVisualizer;