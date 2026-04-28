// CRACO config — wires Tailwind + Autoprefixer into Create React App's build
// without ejecting. Used by `craco start` and `craco build`.
module.exports = {
  style: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')],
    },
  },
};
