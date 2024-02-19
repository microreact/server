import { createTheme } from "@mui/material/styles";

const theme = {
  background: {
    main: "#ffffff",
    highlight: "#f8f9fa",
    hover: "#e8eaed",
    disabled: "rgba(0, 0, 0, 0.24)",
  },
  text: {
    primary: "rgba(0, 0, 0, 0.87)",
    secondary: "rgba(0, 0, 0, 0.54)",
    disabled: "rgba(0, 0, 0, 0.38)",
    hint: "rgba(0, 0, 0, 0.38)",
  },
  primary: {
    light: "#9bb7bf",
    main: "#3c7383",
    dark: "#024756",
    contrast: "#fff",
  },
  secondary: {
    light: "#e998d8",
    main: "#b668a6",
    dark: "#853a77",
    contrast: "#000000",
  },
  fonts: {
    headline: `"Space Grotesk", "Helvetica", "Arial", sans-serif`,
    body: `"Work Sans", "Helvetica", "Arial", sans-serif`,
  },
};

export const themeStyle = {
  "--primary-light": theme.primary.light,
  "--primary-main": theme.primary.main,
  "--primary-dark": theme.primary.dark,
  "--primary-contrast": theme.primary.contrast,
  "--secondary-main": theme.secondary.main,
  "--secondary-contrast": theme.secondary.contrast,
  "--text-primary": theme.text.primary,
  "--text-secondary": theme.text.secondary,
  "--text-disabled": theme.text.disabled,
  "--text-hint": theme.text.hint,
  "--background-main": theme.background.main,
  "--background-highlight": theme.background.highlight,
  "--background-hover": theme.background.hover,
  "--background-disabled": theme.background.disabled,
  "--headline-font": theme.fonts.headline,
};

// Create a theme instance.
const muiTheme = createTheme({
  palette: {
    text: {
      primary: theme.text.primary,
      secondary: theme.text.secondary,
      disabled: theme.text.disabled,
      hint: theme.text.hint,
    },
    primary: {
      light: theme.primary.light,
      main: theme.primary.main,
      dark: theme.primary.dark,
      contrastText: theme.primary.contrast,
    },
    secondary: {
      light: theme.secondary.light,
      main: theme.secondary.main,
      dark: theme.secondary.dark,
      contrastText: theme.secondary.contrast,
    },
    background: {
      paper: theme.background.main,
      default: theme.background.main,
    },
  },
  typography: {
    fontFamily: theme.fonts.body,
    h1: { fontFamily: theme.fonts.headline },
    h2: { fontFamily: theme.fonts.headline },
    h3: { fontFamily: theme.fonts.headline },
    h4: { fontFamily: theme.fonts.headline },
    h5: { fontFamily: theme.fonts.headline },
    h6: { fontFamily: theme.fonts.headline },
    subtitle1: { fontFamily: theme.fonts.headline },
    subtitle2: { fontFamily: theme.fonts.headline },
  },
});

export default muiTheme;
