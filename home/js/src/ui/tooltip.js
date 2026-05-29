export function showTooltip(tooltip, node, containerRect) {
  const pos = node.renderedPosition();
  const data = node.data();
  tooltip.querySelector(".nt-avatar").style.backgroundImage =
    `url("${data.avatar}")`;
  tooltip.querySelector(".nt-avatar").style.backgroundColor = data.bgColor;
  const roleEl = tooltip.querySelector(".nt-role");
  roleEl.textContent = data.role.charAt(0).toUpperCase() + data.role.slice(1);
  roleEl.className = `nt-role nt-role--${data.role}`;
  tooltip.querySelector(".nt-detail").textContent = data.detail || "";
  tooltip.hidden = false;
  positionTooltip(tooltip, pos, containerRect);

  const nameEl = tooltip.querySelector(".nt-name");
  if (data.avatarLoaded) {
    nameEl.classList.remove("nt-name--skeleton");
    nameEl.textContent = data.name;
  } else {
    nameEl.classList.add("nt-name--skeleton");
    nameEl.textContent = "";
  }
}

function positionTooltip(tooltip, pos, rect) {
  const tw = 220,
    th = 80;
  let x = rect.left + pos.x + 52;
  let y = rect.top + pos.y - 24;
  if (x + tw > window.innerWidth - 12) x = rect.left + pos.x - tw - 14;
  if (y + th > window.innerHeight - 12) y = window.innerHeight - th - 12;
  tooltip.style.left = Math.max(8, x) + "px";
  tooltip.style.top = Math.max(8, y) + "px";
}
