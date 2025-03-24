// Define available primary color options for club websites
export const COLOR_OPTIONS = [
  { id: 'blue', name: 'Blue', value: '#4361EE', textDark: true },
  { id: 'teal', name: 'Teal', value: '#38BFA1', textDark: true },
  { id: 'purple', name: 'Purple', value: '#8338EC', textDark: true },
  { id: 'red', name: 'Red', value: '#EF476F', textDark: true },
  { id: 'orange', name: 'Orange', value: '#FF9F1C', textDark: true },
  { id: 'green', name: 'Green', value: '#38B000', textDark: true },
  { id: 'pink', name: 'Pink', value: '#FF6B6B', textDark: true },
  { id: 'indigo', name: 'Indigo', value: '#3A0CA3', textDark: false },
  { id: 'slate', name: 'Slate', value: '#334155', textDark: false }
];

// Text color options
export const TEXT_COLORS = [
  { id: 'dark', name: 'Dark', value: '#111827' },
  { id: 'light', name: 'Light', value: '#F8FAFC' }
];

// Get color by ID
export const getColorById = (id: string) => {
  return COLOR_OPTIONS.find(color => color.id === id) || COLOR_OPTIONS[0];
};

// Get text color by ID
export const getTextColorById = (id: string) => {
  return TEXT_COLORS.find(color => color.id === id) || TEXT_COLORS[0];
};

// Generate gradient from color
export const generateGradient = (color: string) => {
  // Create a slightly lighter version of the color for gradient
  return `linear-gradient(135deg, ${color}, ${adjustColorBrightness(color, 20)})`;
};

// Adjust color brightness (positive value to lighten, negative to darken)
export const adjustColorBrightness = (hex: string, percent: number) => {
  // Remove the # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust each channel
  r = Math.min(255, Math.max(0, r + Math.floor(percent * 2.55)));
  g = Math.min(255, Math.max(0, g + Math.floor(percent * 2.55)));
  b = Math.min(255, Math.max(0, b + Math.floor(percent * 2.55)));
  
  // Convert back to hex
  return `#${(r | (g << 8) | (b << 16)).toString(16).padStart(6, '0').substring(0, 6)}`;
};

// Default color options
export const DEFAULT_PRIMARY_COLOR = COLOR_OPTIONS[1]; // Teal
export const DEFAULT_TEXT_COLOR = TEXT_COLORS[0]; // Dark 