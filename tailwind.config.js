const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      red: colors.red,
      orange: colors.orange,
      yellow: colors.yellow,
      green: colors.green,
      purple: colors.purple,
      pink: colors.pink,
      black: colors.black,
      white: colors.white,

      // PRINCESS CONNECT RARITY COLORS
      'rarity-common': '#88acf0',
      'rarity-copper': '#f7ba9c',
      'rarity-silver': '#deebf7',
      'rarity-gold': '#ffdf73',
      'rarity-purple': '#d67dff',
      'rarity-red': '#f7515a',
      'rarity-green': '#29df7b',
      'rarity-misc': '#a1e9ff',
    },
    extend: {},
  },
  variants: {
    extend: {
      opacity: ['first'],
    }
  },
  plugins: [],
}
