export function buildStyle() {
  return [
    {
      selector: "node",
      style: {
        shape: "ellipse",
        width: "data(size)",
        height: "data(size)",
        "background-color": "data(bgColor)",
        "background-image": "none",
        "background-width": "100%",
        "background-height": "100%",
        "background-clip": "node",
        "background-image-crossorigin": "anonymous",
        label: "",
        "border-width": 0.5,
        "border-color": "data(borderColor)",
        "transition-property": "width, height, border-width, opacity",
        "transition-duration": "180ms",
      },
    },
    { selector: 'node[role = "tutor"]', style: { "border-width": 0.8 } },
    {
      selector: "edge",
      style: {
        width: 1,
        "line-color": "data(color)",
        opacity: 0.35,
        "curve-style": "bezier",
        "target-arrow-shape": "none",
        "transition-property": "opacity, width",
        "transition-duration": "180ms",
      },
    },
    {
      selector: "node.sn-hi",
      style: {
        "border-width": 1.5,
        opacity: 1,
        "background-image": "data(avatar)",
        "background-width": "100%",
        "background-height": "100%",
        "background-clip": "node",
        "z-index": 100,
      },
    },
    { selector: "node.sn-dim", style: { opacity: 0.07 } },
    { selector: "edge.sn-hi", style: { opacity: 0.9, width: 1.5 } },
    { selector: "edge.sn-dim", style: { opacity: 0.02 } },
  ];
}
