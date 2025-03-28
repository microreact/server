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
import { SWRConfig } from "swr";

import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/geist";
import "@sweetalert2/theme-material-ui/material-ui.css";
import "microreact-viewer/styles/index.css";

import { muiTheme } from "../utils/theme.js";
import createEmotionCache from "../utils/create-emotion-cache.js";
import DefaultLayout from "../components/default-layout/index.js";

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

const swrGlobalConfig = {
  fetcher: (resource, init) => fetch(resource, init).then((res) => res.json()),
};

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
            <SWRConfig value={swrGlobalConfig}>
              <DefaultLayout>
                <Component {...pageProps} />
              </DefaultLayout>
            </SWRConfig>
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
