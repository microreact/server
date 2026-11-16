/* eslint-disable react/jsx-no-target-blank */
import React from "react";
import Head from "next/head";
import CGPSFooter from "cgps-stdlib/ui/cgps-footer/index.js";

import Showcase from "../components/Showcase";
import UiVimeoPlayer from "../components/UiVimeoPlayer";
import publicRuntimeConfig from "../utils/public-runtime-config";

import defaultStyles from "../components/default-layout/index.module.css";

export async function getServerSideProps(context) {
  return { props: {} };
}

function Footer() {
  return (
    <CGPSFooter
      brand="Microreact"
      links={[
        {
          text: "Privacy Policy",
          href: "https://docs.microreact.org/about-microreact/privacy-and-terms#personal-data-and-your-responsibilities",
        },
        {
          text: "Documentation",
          href: "https://docs.microreact.org/",
        },
        {
          text: "Contact Us",
          href: "https://docs.microreact.org/feedback/contact",
        },
      ]}
    />
  );
}

export default function Home() {
  return (
    <div>
      <Head>
        <title>Showcase</title>
      </Head>

      <div className="mr-showcase__intro">

      <h1 className="mr-showcase__title">
        <strong>Open data visualization</strong> and <strong>sharing</strong>{" "}
        for <strong>genomic epidemiology</strong>
      </h1>

      <section className="mr-showcase__video">
        <UiVimeoPlayer
          src="https://player.vimeo.com/video/193252797?autoplay=1&loop=0&color=3C7383&title=0&byline=0&portrait=0"
          thumbnail="images/604876185-76c1626d483a2f8ae8a2128562da33a76a89b8b7396626a2380a8275f14826cb-d.webp"
        />
      </section>

      </div>

      {
        publicRuntimeConfig.showLocalMicroreactBanner && (
          <section className="mr-local-banner">
            <div className="mr-local-banner__content">
              <div className="mr-local-banner__text">
                <h2 className="mr-local-banner__title">
                  Working with sensitive data?
                </h2>
                <p className="mr-local-banner__description">
                  Visualise and explore your projects locally with Microreact Local desktop app
                </p>
              </div>
              <a
                className="mr-local-banner__cta"
                href="https://local.microreact.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Try Microreact Local &rarr;
              </a>
            </div>
          </section>
        )
      }

      <section className="mr-used-by">
        <div className="mr-used-by-content">
          <h2 className="mr-used-by-title">In partnership with</h2>
          <div className="mr-used-by-images">
            <img
              src="images/partners/ukhsa.png"
              alt="UKHSA"
              title="UKHSA"
            />
            {/* <img
              src="images/partners/cdc.png"
              alt="Centers for Disease Control and Prevention"
              title="Centers for Disease Control and Prevention"
            /> */}
            <img
              src="images/partners/ecdc.png"
              alt="European Centre for Disease Prevention and Control"
              title="European Centre for Disease Prevention and Control"
            />
            <img
              src="images/partners/microbiology-society.png"
              alt="Microbiology Society"
              title="Microbiology Society"
            />
            <img
              src="images/partners/niph.svg"
              alt="Norwegian Institute of Public Health"
              title="Norwegian Institute of Public Health"
            />
          </div>
        </div>
      </section>

      <Showcase />

      <Footer />

    </div>
  );
}
