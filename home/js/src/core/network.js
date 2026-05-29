import { buildPeopleList, setProjection } from "../data/people.js";
import { generateLinks, buildEdges } from "../data/links.js";
import { buildStyle } from "../styles/cytoscape.js";
import { showTooltip } from "../ui/tooltip.js";
import { scaleUp, scaleDown, startPulse } from "../ui/animations.js";
import { drawWorldMap } from "../services/mapService.js";

function buildElements(people, links) {
  const nodes = people.map((p) => {
    const avatarLoaded = p.role === "tutor";
    const node = {
      data: {
        id: p.id,
        name: p.name,
        role: p.role,
        detail: p.detail,
        borderColor: p.borderColor,
        size: p.size,
        bgColor: p.bgColor,
        avatar: p.avatarUrl,
        avatarLoaded,
      },
    };
    if (p.position) node.position = p.position;
    return node;
  });
  const edges = buildEdges(links);
  return [...nodes, ...edges];
}

export async function initSocialNetwork({
  containerId,
  tooltipId = "network-tooltip",
  people,
  links,
}) {
  const container = document.getElementById(containerId);
  if (!container || !window.cytoscape) return null;
  const tooltip = document.getElementById(tooltipId);
  let activeTooltipNode = null;

  const { projection, w, h } = await drawWorldMap(container);

  if (projection) {
    setProjection(projection, w, h);
  }

  const resolvedPeople = people ?? buildPeopleList();
  const resolvedLinks = links ?? generateLinks(resolvedPeople);

  const cy = window.cytoscape({
    container,
    elements: buildElements(resolvedPeople, resolvedLinks),
    style: buildStyle(),
    layout: { name: "preset" },
    autoungrabify: true,
    userZoomingEnabled: true,
    userPanningEnabled: true,
    boxSelectionEnabled: false,
    minZoom: 0.25,
    maxZoom: 3.5,
  });

  cy.on("zoom", () => {
    if (cy.zoom() >= 3.5) cy.nodes().addClass("av-visible");
    else cy.nodes().removeClass("av-visible");
  });

  const svgEl = container.querySelector(".world-map-bg");
  if (svgEl) {
    const syncViewport = () => {
      const pan = cy.pan();
      const zoom = cy.zoom();
      svgEl.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
    };
    cy.on("viewport", syncViewport);
    syncViewport();
  }

  cy.one("layoutstop", () => {
    cy.fit(undefined, 30);
    startPulse(cy);
  });

  // Hover handlers
  cy.on("mouseover", "node", (e) => {
    const node = e.target;
    const nbhd = node.closedNeighborhood();
    cy.batch(() => {
      cy.elements().not(nbhd).addClass("sn-dim");
      nbhd.nodes().addClass("sn-hi");
      nbhd.edges().addClass("sn-hi");
    });
    scaleUp(node);
  });

  cy.on("mouseout", "node", (e) => {
    const node = e.target;
    cy.batch(() => cy.elements().removeClass("sn-dim sn-hi"));
    scaleDown(node);
  });

  // Click handlers
  cy.on("tap", "node", (e) => {
    const node = e.target;
    if (tooltip) {
      if (activeTooltipNode && activeTooltipNode.id() === node.id()) {
        tooltip.hidden = true;
        activeTooltipNode = null;
      } else {
        showTooltip(tooltip, node, container.getBoundingClientRect());
        activeTooltipNode = node;
      }
    }
    e.preventDefault();
  });

  cy.on("tap", (e) => {
    if (e.target === cy) {
      if (tooltip) tooltip.hidden = true;
      activeTooltipNode = null;
      cy.animate(
        { fit: { eles: cy.nodes(), padding: 30 } },
        { duration: 400, easing: "ease-out-expo" },
      );
    }
  });

  cy.on("dbltap", "node", (e) => {
    cy.animate(
      { zoom: 2.2, center: { eles: e.target } },
      { duration: 400, easing: "ease-out-expo" },
    );
  });

  return cy;
}
