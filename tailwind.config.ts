import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,css,md,mdx,html,json,scss}"],
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    themes: [
      // "luxury",
      // Creating a custom theme starting by spreading the built-in theme
      {
        bonfire: {
          ...require("daisyui/src/theming/themes")["luxury"],
          "base-content": "#ffa200",
        },
      },
    ],
  },
}

export default config
