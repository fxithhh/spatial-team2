/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  content: [],
  theme: {
    extend: {
      colors:{
        brand: "#E70362",
        brandhover: "#B0034B",
        linkhover: "#ffcccb"
      }
    },
  },
  plugins: [],
}

