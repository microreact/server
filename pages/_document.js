import * as React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";
import createEmotionServer from "@emotion/server/create-instance";
import muiTheme, { themeStyle } from "../utils/theme";
import createEmotionCache from "../utils/create-emotion-cache";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* PWA primary color */}
          <meta name="theme-color" content={muiTheme.palette.primary.main} />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/react-base-table@1.13.2/styles.css"
          />

          <link
            rel="stylesheet"
            href="https://api.mapbox.com/mapbox-gl-js/v2.10.0/mapbox-gl.css"
          />

          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/flexlayout-react@0.6.10/style/light.css"
          />

          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/@fontsource/work-sans@4.5.12/index.css"
          />
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/@fontsource/work-sans@4.5.12/500.css"
          />
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/@fontsource/space-grotesk@4.5.0/index.css"
          />
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/@fontsource/space-grotesk@4.5.0/500.css"
          />

          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/ag-grid-community@29.2.0/styles/ag-grid.min.css"
          />
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/ag-grid-community@29.2.0/styles/ag-theme-alpine.min.css"
          />

          {/* Inject MUI styles first to match with the prepend: true configuration. */}
          {this.props.emotionStyleTags}
        </Head>
        <body
          style={themeStyle}
        >
          <script
            defer
            src="https://cdnjs.cloudflare.com/ajax/libs/sigma.js/1.2.1/sigma.min.js"
          ></script>
          <script
            defer
            src="https://cdnjs.cloudflare.com/ajax/libs/sigma.js/1.2.1/plugins/sigma.layout.forceAtlas2.min.js"
          ></script>
          <script
            defer
            src="https://cdnjs.cloudflare.com/ajax/libs/sigma.js/1.2.1/plugins/sigma.plugins.dragNodes.min.js"
          ></script>
          <script
            defer
            src="https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.js"
          ></script>
          <script
            defer
            data-domain="microreact.org" src="https://analytics.cgps.dev/js/plausible.js"
          ></script>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with static-site generation (SSG).
MyDocument.getInitialProps = async (ctx) => {
  // Resolution order
  //
  // On the server:
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. document.getInitialProps
  // 4. app.render
  // 5. page.render
  // 6. document.render
  //
  // On the server with error:
  // 1. document.getInitialProps
  // 2. app.render
  // 3. page.render
  // 4. document.render
  //
  // On the client
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. app.render
  // 4. page.render

  const originalRenderPage = ctx.renderPage;

  // You can consider sharing the same Emotion cache between all the SSR requests to speed up performance.
  // However, be aware that it can have global side effects.
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) =>
        function EnhanceApp(props) {
          return <App emotionCache={cache} {...props} />;
        },
    });

  const initialProps = await Document.getInitialProps(ctx);
  // This is important. It prevents Emotion to render invalid HTML.
  // See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(" ")}`}
      key={style.key}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  return {
    ...initialProps,
    emotionStyleTags,
  };
};
