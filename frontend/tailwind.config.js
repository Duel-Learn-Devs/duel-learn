/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Nunito'],
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
],
}

