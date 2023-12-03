import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,css,md,mdx,html,json,scss}"],
  daisyui: {
    themes: [
      {
        // Creating a custom theme starting by spreading the built-in theme
        bonfire: {
          ...require("daisyui/src/theming/themes")["luxury"],
        },
      },
    ],
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
}

export default config
