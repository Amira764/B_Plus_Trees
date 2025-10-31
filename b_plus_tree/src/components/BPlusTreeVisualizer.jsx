import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

/**
 * Enhanced B+ Tree Visualizer with better animations and clarity
 */
const EnhancedBPlusTreeVisualizer = ({ tree }) => {
  const svgRef = useRef();
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    if (!tree || !tree.root) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1200;
    const height = 700;
    const dx = 100;
    const dy = 150;

    // Create hierarchy
    const hierarchy = d3.hierarchy(tree.root, (node) =>
      node.children ? node.children : null
    );
    const layout = d3.tree().nodeSize([dx, dy]);
    layout(hierarchy);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, 60)`);

    // Calculate node widths based on content
    const getNodeWidth = (node) => {
      const keysText = node.keys.join(", ");
      return Math.max(80, 40 + keysText.length * 8);
    };

    // --- LINKS with curved paths and animations
    const links = g.selectAll(".link")
      .data(hierarchy.links())
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#64748b")
      .attr("stroke-width", 2.5)
      .attr("d", (d) => {
        const sourceY = d.source.y + 25;
        const targetY = d.target.y - 25;
        const midY = (sourceY + targetY) / 2;
        
        return `
          M${d.source.x},${sourceY}
          C${d.source.x},${midY}
           ${d.target.x},${midY}
           ${d.target.x},${targetY}
        `;
      })
      .attr("opacity", 0)
      .attr("stroke-dasharray", function() {
        return this.getTotalLength();
      })
      .attr("stroke-dashoffset", function() {
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
      .attr("style", "stop-color:#10b981;stop-opacity:1");
    leafGradient.append("stop")
      .attr("offset", "100%")
      .attr("style", "stop-color:#059669;stop-opacity:1");

    // Gradient for internal nodes
    const internalGradient = defs.append("linearGradient")
      .attr("id", "internalGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    internalGradient.append("stop")
      .attr("offset", "0%")
      .attr("style", "stop-color:#3b82f6;stop-opacity:1");
    internalGradient.append("stop")
      .attr("offset", "100%")
      .attr("style", "stop-color:#2563eb;stop-opacity:1");

    // Add rectangles with animations
    nodes
      .append("rect")
      .attr("class", "node-rect")
      .attr("rx", 12)
      .attr("x", (d) => -getNodeWidth(d.data) / 2)
      .attr("y", -25)
      .attr("width", (d) => getNodeWidth(d.data))
      .attr("height", 50)
      .attr("fill", (d) => d.data.pointers ? "url(#leafGradient)" : "url(#internalGradient)")
      .attr("stroke", (d) => d.data.pointers ? "#065f46" : "#1e40af")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.15))")
      .attr("opacity", 0)
      .attr("transform", "scale(0)")
      .transition()
      .delay((_, i) => i * 80)
      .duration(600)
      .ease(d3.easeBackOut)
      .attr("opacity", 1)
      .attr("transform", "scale(1)");

    // Add node type badge
    nodes
      .append("circle")
      .attr("cx", (d) => -getNodeWidth(d.data) / 2 + 15)
      .attr("cy", -25 + 12)
      .attr("r", 8)
      .attr("fill", "rgba(255,255,255,0.3)")
      .attr("opacity", 0)
      .transition()
      .delay((_, i) => i * 80 + 300)
      .duration(400)
      .attr("opacity", 1);

    nodes
      .append("text")
      .attr("x", (d) => -getNodeWidth(d.data) / 2 + 15)
      .attr("y", -25 + 12)
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

    // Add keys text
    nodes
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("fill", "white")
      .style("font-weight", "700")
      .style("font-size", "15px")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.3)")
      .text((d) => d.data.keys.join(", ") || "[]")
      .attr("opacity", 0)
      .transition()
      .delay((_, i) => i * 80 + 200)
      .duration(600)
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
      .on("mouseover", function(event, d) {
        d3.select(this).select(".node-rect")
          .transition()
          .duration(200)
          .attr("stroke-width", 3)
          .style("filter", "drop-shadow(0 6px 12px rgba(0,0,0,0.25))");
        
        setHoveredNode(d);
      })
      .on("mouseout", function() {
        d3.select(this).select(".node-rect")
          .transition()
          .duration(200)
          .attr("stroke-width", 2)
          .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.15))");
        
        setHoveredNode(null);
      });

    // Level indicators
    const levels = {};
    hierarchy.descendants().forEach(d => {
      if (!levels[d.depth]) levels[d.depth] = [];
      levels[d.depth].push(d);
    });

    Object.entries(levels).forEach(([depth, nodesAtLevel]) => {
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

    infoBox.forEach((item, i) => {
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
          <div style={{ width: "20px", height: "20px", background: "linear-gradient(to bottom, #3b82f6, #2563eb)", borderRadius: "4px" }}></div>
          <span>Internal Nodes (I)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "20px", height: "20px", background: "linear-gradient(to bottom, #10b981, #059669)", borderRadius: "4px" }}></div>
          <span>Leaf Nodes (L)</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBPlusTreeVisualizer;