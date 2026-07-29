import { reactive, ref, type Ref } from "vue";

export interface ResizableBounds {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

const defaultBounds: ResizableBounds = {
  minWidth: 320,
  minHeight: 320,
  maxWidth: Infinity,
  maxHeight: Infinity,
};

/**
 * Makes an element resizable by mousedown-ing on a "handle" (e.g. a small
 * grip in the corner) and dragging it.
 *
 * Unlike the native CSS `resize` property, this tracks size in reactive
 * state driven through Vue, so it:
 *  - stays in sync with anything else animating the element (like a drag
 *    offset), instead of fighting it via two separate positioning systems
 *  - isn't at the mercy of ancestor flexbox rules such as
 *    `align-items: stretch`, which silently overrides a native-resized
 *    height on every relayout (this is why native resize only "worked
 *    horizontally" before)
 *
 * `size.width` / `size.height` are `null` until the user actually grabs the
 * handle, so the element stays naturally auto-sized (via your existing CSS)
 * up until that point — only once resizing starts do we pin it to an
 * explicit pixel size.
 *
 * @param elRef - ref to the resizable element, used to read its current
 *   rendered size the first time the user grabs the handle
 * @param bounds - min/max clamps (defaults are generous)
 * @param disabled - returns true when resizing should be prevented (e.g. while fullscreen)
 */
export function useResizable(
  elRef: Ref<HTMLElement | null>,
  bounds: Partial<ResizableBounds> = {},
  disabled: () => boolean = () => false,
) {
  const limits: ResizableBounds = { ...defaultBounds, ...bounds };
  const size = reactive<{ width: number | null; height: number | null }>({
    width: null,
    height: null,
  });
  const resizing = ref(false);

  let start = { mouseX: 0, mouseY: 0, width: 0, height: 0 };

  const clampWidth = (w: number) =>
    Math.min(limits.maxWidth, Math.max(limits.minWidth, w));
  const clampHeight = (h: number) =>
    Math.min(limits.maxHeight, Math.max(limits.minHeight, h));

  const onMouseMove = (event: MouseEvent) => {
    if (!resizing.value) return;

    size.width = clampWidth(start.width + (event.clientX - start.mouseX));
    size.height = clampHeight(start.height + (event.clientY - start.mouseY));
  };

  const stopResizing = () => {
    resizing.value = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", stopResizing);
  };

  const onMouseDown = (event: MouseEvent) => {
    if (disabled()) return;

    event.preventDefault();
    event.stopPropagation();

    // Capture the element's *current* rendered size on first grab, so we
    // start resizing from wherever it actually is (not a guessed default).
    const rect = elRef.value?.getBoundingClientRect();
    const currentWidth = size.width ?? rect?.width ?? limits.minWidth;
    const currentHeight = size.height ?? rect?.height ?? limits.minHeight;

    resizing.value = true;
    start = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      width: currentWidth,
      height: currentHeight,
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopResizing);
  };

  const reset = () => {
    size.width = null;
    size.height = null;
    stopResizing();
  };

  return { size, resizing, onMouseDown, reset };
}
