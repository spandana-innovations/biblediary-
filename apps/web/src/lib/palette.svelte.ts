/** Global open-state for the ⌘K command palette. */
export const palette = $state({ open: false });
export const openPalette = () => (palette.open = true);
export const closePalette = () => (palette.open = false);
