import "../styles/showcase.css";
import "../styles/viewer.css";
import "../styles/feedback.css";

import * as React from "react";
import PropTypes from "prop-types";
import Head from "next/head";
import { SessionProvider as AuthSessionProvider } from "next-auth/react";
import { SnackbarProvider } from "notistack";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { CacheProvider } from "@emotion/react";

import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/work-sans/400.css";
import "@fontsource/work-sans/700.css";

import "@sweetalert2/theme-material-ui/material-ui.css";
import "microreact-viewer/styles/index.css";

import muiTheme from "../utils/theme";
import createEmotionCache from "../utils/create-emotion-cache";
import DefaultLayout from "../components/default-layout";

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export default function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache } = props;
  const { session, ...pageProps } = props.pageProps;

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>

      <ThemeProvider theme={muiTheme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />

        <AuthSessionProvider session={session}>
          <SnackbarProvider>
            <DefaultLayout>
              <Component {...pageProps} />
            </DefaultLayout>
          </SnackbarProvider>
        </AuthSessionProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  emotionCache: PropTypes.object,
  pageProps: PropTypes.object.isRequired,
};
