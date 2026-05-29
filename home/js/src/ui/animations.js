export function scaleUp(node) {
  const origW = node.data("size");
  const origH = node.data("size");
  node.stop(true, true);
  node.animate(
    { style: { width: origW * 3.0, height: origH * 3.0 } },
    { duration: 200 },
  );
}

export function scaleDown(node) {
  const origW = node.data("size");
  const origH = node.data("size");
  node.stop(true, true);
  node.animate({ style: { width: origW, height: origH } }, { duration: 200 });
}

export function startPulse(cy) {
  cy.nodes('[role = "tutor"]').forEach((node, i) => {
    function beat() {
      node
        .animate(
          { style: { "border-width": 1.6 } },
          { duration: 700, easing: "ease-in-out-sine" },
        )
        .animate(
          { style: { "border-width": 0.8 } },
          {
            duration: 700,
            easing: "ease-in-out-sine",
            complete: () => setTimeout(beat, 2400 + Math.random() * 1800),
          },
        );
    }
    setTimeout(beat, 500 + i * 350);
  });
}
