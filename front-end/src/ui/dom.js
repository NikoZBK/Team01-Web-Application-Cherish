/**
 * Builds a DOM element. Children are appended as nodes or text, never parsed
 * as HTML, so text written by users cannot inject markup.
 *
 *   h("button", { class: "primary", onclick: save }, "Save")
 */
export function h(tag, props, ...children) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(props ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (name.startsWith("on")) element.addEventListener(name.slice(2), value);
    else if (name === "class") element.className = value;
    else if (name === "style") element.style.cssText = value;
    else if (name in element && !name.includes("-")) element[name] = value;
    else element.setAttribute(name, value === true ? "" : value);
  }
  element.append(...children.flat(Infinity).filter((child) => child !== null && child !== undefined && child !== false));
  return element;
}

/** Replaces everything inside `parent`. */
export function mount(parent, ...children) {
  parent.replaceChildren(...children.flat(Infinity).filter(Boolean));
}

let toastTimer;

/** Shows a short message at the bottom of the screen. */
export function toast(message, kind = "info") {
  let region = document.getElementById("toast");
  if (!region) {
    region = h("div", { id: "toast", role: "status", "aria-live": "polite" });
    document.body.append(region);
  }
  region.textContent = message;
  region.className = `show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (region.className = ""), 3500);
}

/** Like `h`, for SVG elements; every prop is set as an attribute. */
export function svg(tag, attributes, ...children) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [name, value] of Object.entries(attributes ?? {})) element.setAttribute(name, value);
  element.append(...children.flat(Infinity).filter(Boolean));
  return element;
}
