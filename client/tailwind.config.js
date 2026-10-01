/** Material You Green, versi minimalis dengan light + dark mode (token = CSS variable) */
const v = (n) => `rgb(var(--c-${n}) / <alpha-value>)`;
const names = ['primary', 'on-primary', 'primary-container', 'on-primary-container', 'secondary-container',
  'on-secondary-container', 'tertiary', 'tertiary-container', 'surface', 'surface-container',
  'surface-container-high', 'surface-variant', 'outline', 'on-surface', 'on-surface-variant', 'error', 'error-container'];

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: Object.fromEntries(names.map((n) => [n, v(n)])),
      fontFamily: { sans: ['"DM Sans"', 'system-ui', 'sans-serif'], display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'] },
      borderRadius: { m3: '20px', m3xl: '36px' },
    },
  },
  plugins: [],
};
