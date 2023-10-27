/* eslint-disable react/jsx-no-target-blank */
import React from "react";

import publicRuntimeConfig from "../utils/public-runtime-config";
import CustomShowcaseProjectGrid from "./CustomShowcaseProjectGrid";

import ShowcaseCard from "./ShowcaseCard.react";

export default function Showcase() {
  if (publicRuntimeConfig.customShowcase) {
    return (
      <CustomShowcaseProjectGrid />
    );
  }

  return (
    <div className="mr-showcase-grid">
      <ShowcaseCard
        title={<React.Fragment>Tracing the spread of carbapenem-resistant <i>Klebsiella pneumoniae</i></React.Fragment>}
        linkUrl="/project/EuSCAPE_Kp"
        imageUrl="images/showcase/euscape-cover.png"
        subTitle="David S et al. 2019."
        supportingText={<React.Fragment>Epidemic of carbapenem-resistant <i>Klebsiella pneumoniae</i> in Europe is driven by nosocomial spread. Nature Microbiology 2058-5276. (doi:10.1038/s41564-019-0492-8)</React.Fragment>}
        supportingLink="https://www.nature.com/articles/s41564-019-0492-8"
      />

      <ShowcaseCard
        title={<React.Fragment>SARS-CoV-2 in the UK</React.Fragment>}
        // linkUrl="https://microreact.org/project/qYq92faghSBX7fMBDN4A2a-cog-uk-global-tree"
        linkUrl="https://microreact.org/project/eDRh8N1gx66onGUvPAsQik-uk-sars-cov-2-2020-02-052022-02-11/"
        imageUrl="images/showcase/cogconsortium-uk.png"
        subTitle="COG-UK Consortium"
        supportingText={<React.Fragment>Continuous evaluation of the lineages circulating in the UK<br/>(updated weekly)</React.Fragment>}
        supportingLink="https://www.cogconsortium.uk/data/"
        externalLink
      />

      <ShowcaseCard
        title={<React.Fragment><i>Streptococcus pneumoniae</i> PMEN2</React.Fragment>}
        linkUrl="/project/N1TRn11L"
        imageUrl="images/showcase/cover1.png"
        subTitle="Croucher NJ et al. 2014."
        supportingText="Variable recombination dynamics during the emergence, transmission and 'disarming' of a multidrug-resistant pneumococcal clone. BMC Biology 12:49"
        supportingLink="http://www.ncbi.nlm.nih.gov/pubmed/24957517"
      />

      <ShowcaseCard
        title={<React.Fragment>Global Distribution of SARS-CoV-2</React.Fragment>}
        // linkUrl="https://microreact.org/project/tKgkqrqapvGa5RLL2azabp/0cc63c25"
        linkUrl="/project/6Y5GvktuhqgRRDwRQ7cUze-global-sars-cov-2-2019-12-242022-02-11/"
        imageUrl="images/showcase/cogconsortium-global.png"
        subTitle="COG-UK Consortium"
        supportingText={<React.Fragment>Continuous evaluation of the lineages circulating around the globe.<br/>(updated weekly)</React.Fragment>}
        supportingLink="https://www.cogconsortium.uk/data/"
        externalLink
      />

      <ShowcaseCard
        title="West African Ebola epidemic (2013-2016)"
        linkUrl="/project/west-african-ebola-epidemic?tt=rc"
        imageUrl="images/showcase/west-african-ebola-epidemic.png"
        subTitle="Dudas G. et al. 2017."
        supportingText="Virus genomes reveal factors that spread and sustained the Ebola epidemic. Nature. 2017 Apr 20;544(7650):309-315. (doi:10.1038/nature22040)."
        supportingLink="https://pubmed.ncbi.nlm.nih.gov/28405027/"
      />
      <ShowcaseCard
        title="Zika virus in the Americas"
        linkUrl="/project/zika-virus?tt=rc"
        imageUrl="images/showcase/zika-virus.png"
        subTitle="Rodrigues Faria, N. et al. 2016."
        supportingText="Zika virus in the Americas: Early epidemiological and genetic findings. Science 352(6283):345-9."
        supportingLink="http://science.sciencemag.org/content/352/6283/345.article-info"
      />
      <ShowcaseCard
        title="Y-chromosome Human Phylogeny"
        linkUrl="/project/NyqrhlsB"
        imageUrl="images/showcase/cover4.png"
        subTitle="Hallast P. et al. 2015."
        supportingText="The Y-chromosome tree bursts into leaf: 13,000 high-confidence SNPs covering the majority of known clades. Mol Biol Evol 32(3):661"
        supportingLink="http://www.ncbi.nlm.nih.gov/pubmed/25468874"
      />
      <ShowcaseCard
        title={<i>Vibrio cholerae</i>}
        linkUrl="/project/EkKAhxoB"
        imageUrl="images/showcase/cover3.png"
        subTitle="Mutreja A. et al. 2011."
        supportingText="Evidence for several waves of global transmission in the seventh cholera pandemic. Nature 477:462"
        supportingLink="http://www.ncbi.nlm.nih.gov/pubmed/21866102"
      />
      <ShowcaseCard
        title={<React.Fragment><i>Staphylococcus aureus</i> ST239</React.Fragment>}
        linkUrl="/project/NJ-zAij8"
        imageUrl="images/showcase/staphylococcus_aureus.png"
        subTitle="Harris S. et al. 2010."
        supportingText="Evolution of MRSA during hospital transmission and intercontinental spread."
        supportingLink="http://www.ncbi.nlm.nih.gov/pubmed/20093474"
      />
      {/* <ShowcaseCard
        title={<React.Fragment><i>Klebsiella</i> - NCBI</React.Fragment>}
        linkUrl="/project/ncbi-klebsiella?tl=0"
        imageUrl="images/showcase/ncbi-klebsiella.png"
        subTitle="National Center for Biotechnology Information"
        supportingText="Klebsiella genomes from the NCBI Pathogen Detection project."
        supportingLink="ftp://ftp.ncbi.nlm.nih.gov/pathogen/Results/Klebsiella/latest_kmer"
      /> */}
      <ShowcaseCard
        title={<i>Yersinia enterocolitica</i>}
        linkUrl="/project/EJv0OVQd"
        imageUrl="images/showcase/yersinia-enterocolitica.png"
        subTitle="Reuter S. et al. 2015."
        supportingText="Directional gene flow and ecological separation in Yersinia enterocolitica. M Gen 1(3): doi:10.1099/mgen.0.000030."
        supportingLink="http://mgen.microbiologyresearch.org/content/journal/mgen/10.1099/mgen.0.000030"
      />
      <ShowcaseCard
        title={<React.Fragment><i>Salmonella</i> Typhi</React.Fragment>}
        linkUrl="/project/styphi"
        imageUrl="images/showcase/cover2.png"
        subTitle="Wong V. et al. 2015."
        supportingText={
          <React.Fragment>
            Phylogeographical analysis of the dominant multidrug-resistant H58 clade
            of <i>Salmonella</i> Typhi identifies inter- and intra-continental transmission events.
            Nature Genetics 47(6):632
          </React.Fragment>
        }
        supportingLink="http://www.ncbi.nlm.nih.gov/pubmed/25961941"
      />
    </div>
  );
}
