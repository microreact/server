/* eslint-disable react/jsx-no-target-blank */
import React from "react";
import Head from "next/head";

import Showcase from "../components/Showcase";
import UiVimeoPlayer from "../components/UiVimeoPlayer";

import defaultStyles from "../components/default-layout/index.module.css";

export async function getServerSideProps(context) {
  return { props: {} };
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

      <footer className={defaultStyles["mr-footer"]}>
        <p className={defaultStyles["mr-footer-credits"]}>
          Microreact is developed and maintained by the&nbsp;
          <a href="https://www.pathogensurveillance.net/">
            Centre for Genomic Pathogen Surveillance
          </a>
          < hr />
          <a href="https://docs.microreact.org/about-microreact/privacy-and-terms#personal-data-and-your-responsibilities">
            Privacy Policy
          </a>
          <a href="https://docs.microreact.org/">
            Documentation
          </a>
          <a href="https://docs.microreact.org/feedback/contact">
            Contact Us
          </a>
        </p>
        <br />
        <p>
          <span>Funded by </span>
          <img
            src="/images/logos/wellcome-white.png"
            className={defaultStyles["mr-footer-logo-square"]}
          />
        </p>
        <p>
          <span>Developed at </span>
          <img src="/images/logos/bdi-white.png" className={defaultStyles["mr-footer-logo-square"]} />
          <img src="/images/logos/sanger.svg" className={defaultStyles["mr-footer-logo"]} />
        </p>
        <p>
          <a
            href="https://www.pathogensurveillance.net"
            target="_blank"
          >
            <img
              src="/images/logos/cgps-long-white.svg"
              className={defaultStyles["mr-footer-logo-cgps"]}
            />
          </a>
        </p>
        {/*
        <p className={defaultStyles["cgps-copyright"]}>
          © 2018 Centre for Genomic Pathogen Surveillance
        </p>
        */}
      </footer>

    </div>
  );
}
