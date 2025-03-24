// Define available font options for club websites
export const FONT_OPTIONS = [
  { 
    id: 'inter', 
    name: 'Inter', 
    className: 'font-sans',
    fallback: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  { 
    id: 'poppins', 
    name: 'Poppins', 
    className: 'font-poppins',
    fallback: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  { 
    id: 'montserrat', 
    name: 'Montserrat', 
    className: 'font-montserrat',
    fallback: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  { 
    id: 'raleway', 
    name: 'Raleway', 
    className: 'font-raleway',
    fallback: "'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  { 
    id: 'playfair', 
    name: 'Playfair Display', 
    className: 'font-playfair',
    fallback: "'Playfair Display', Georgia, serif"
  }
];

// Get font by ID
export const getFontById = (id: string) => {
  return FONT_OPTIONS.find(font => font.id === id) || FONT_OPTIONS[0];
};

// Get font CSS for use in styles
export const getFontCSS = (fontId: string) => {
  const font = getFontById(fontId);
  return font.fallback;
};

// Default font option
export const DEFAULT_FONT = FONT_OPTIONS[0]; 