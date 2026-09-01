const allowedTags = new Set([
  "P",
  "BR",
  "STRONG",
  "EM",
  "UL",
  "OL",
  "LI",
  "A",
]);

const dropWithContent = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "TEMPLATE",
  "SVG",
  "MATH",
]);

const safeHref = (value: string): boolean => {
  const href = value.trim();
  if (!href || /[\u0000-\u001f\u007f]/u.test(href)) return false;
  if (href.startsWith("/") || href.startsWith("#")) {
    return !href.startsWith("//");
  }

  try {
    return ["http:", "https:", "mailto:"].includes(new URL(href).protocol);
  } catch {
    return false;
  }
};

const sanitizeChildren = (parent: ParentNode) => {
  Array.from(parent.childNodes).forEach((node) => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.remove();
      return;
    }

    if (!(node instanceof Element)) return;

    if (dropWithContent.has(node.tagName)) {
      node.remove();
      return;
    }

    sanitizeChildren(node);

    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...Array.from(node.childNodes));
      return;
    }

    Array.from(node.attributes).forEach((attribute) => {
      if (
        node.tagName !== "A" ||
        !["href", "title"].includes(attribute.name.toLowerCase())
      ) {
        node.removeAttribute(attribute.name);
      }
    });

    if (
      node.tagName === "A" &&
      node.hasAttribute("href") &&
      !safeHref(node.getAttribute("href") ?? "")
    ) {
      node.removeAttribute("href");
    }
  });
};

export const sanitizeHtml = (html: string): string => {
  if (!html || typeof DOMParser === "undefined") return "";

  const document = new DOMParser().parseFromString(html, "text/html");
  sanitizeChildren(document.body);

  return document.body.innerHTML;
};
