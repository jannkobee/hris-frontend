import { reactive, ref } from "vue";

/**
 * Makes an element draggable by mousedown-ing on a "handle" (e.g. a dialog's
 * title bar) and dragging it around. Position is tracked as an (x, y) pixel
 * offset from wherever the element was originally laid out (e.g. centered by
 * v-dialog), so the caller just applies `transform: translate(x, y)`.
 *
 * @param disabled - returns true when dragging should be prevented (e.g. while fullscreen)
 */
export function useDraggable(disabled: () => boolean = () => false) {
  const offset = reactive({ x: 0, y: 0 });
  const dragging = ref(false);

  let start = { mouseX: 0, mouseY: 0, offsetX: 0, offsetY: 0 };

  const onMouseMove = (event: MouseEvent) => {
    if (!dragging.value) return;

    offset.x = start.offsetX + (event.clientX - start.mouseX);
    offset.y = start.offsetY + (event.clientY - start.mouseY);
  };

  const stopDragging = () => {
    dragging.value = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", stopDragging);
  };

  const onMouseDown = (event: MouseEvent) => {
    if (disabled()) return;

    // Don't hijack clicks on interactive elements within the handle
    // (buttons, chips, links, inputs, etc).
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, .v-chip")) return;

    event.preventDefault();
    dragging.value = true;
    start = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopDragging);
  };

  const reset = () => {
    offset.x = 0;
    offset.y = 0;
    stopDragging();
  };

  return { offset, dragging, onMouseDown, reset };
}
