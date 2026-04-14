// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#fbf7f2",
          100: "#f3eadc",
          300: "#e6d6b8",
        },
        olive: {
          50: "#f3f6f0",
          100: "#dfe8d7",
          700: "#556b2f",
          800: "#3f4f20",
          900: "#2b3a14",
        },
        terra: {
          50: "#fff6f2",
          100: "#f7e6df",
          600: "#b85a3c",
        },
      },
      fontFamily: {
        // This adds 'font-montserrat' utility class
        montserrat: ["Montserrat", "sans-serif"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        marquee: "marquee 8s linear infinite",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"), // <-- added plugin
  ],
};
