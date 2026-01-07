import type { Preview } from "@storybook/react";
import "../src/main.scss"; // Import your global styles
import { withFavoritesContext } from "./decorators/FavoritesDecorator";

const preview: Preview = {
  decorators: [withFavoritesContext],
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#1a1a1a" },
        { name: "marvel", value: "#202020" },
      ],
    },
  },
};

export default preview;
