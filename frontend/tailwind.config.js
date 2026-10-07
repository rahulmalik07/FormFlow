/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#191919",
        accent: "#4F46E5",
        bg: "#FFFFFF",
        surface: "#F7F7F7",
        border: "#E5E5E5",
      },
    },
  },
  plugins: [],
};