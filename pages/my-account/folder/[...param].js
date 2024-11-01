/* eslint-disable class-methods-use-this */

import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import getUser from "cgps-application-server/middleware/get-user";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

import AccountPageNav from "../../../components/AccountPageNav";
import AccountProjectGrid from "../../../components/AccountProjectGrid";
import Styles from "../../../styles/account-page.module.css";

import * as DataHooks from "../../../utils/data-hooks";

export async function getServerSideProps(context) {
  const user = await getUser(context.req, context.res);
  if (!user) {
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=/my-account/`,
        permanent: false,
      },
    };
  }
  return {
    props: {}, // will be passed to the page component as props
  };
}

function FolderProjectsPage() {
  const router = useRouter();

  if (router?.query?.param) {
    const { param } = router.query;
    const [ folderId, folderName ] = param;
    return (
      <div
        className={Styles.page}
      >
        <Head>
          <title>{folderName}</title>
        </Head>

        <AccountPageNav />

        <main>
          <Container maxWidth="lg">
            <Typography variant="h2">
              {folderName}
            </Typography>

            <AccountProjectGrid
              apiEndpoint={DataHooks.userProjectsHook}
              filter={(doc) => !doc.binned && doc.folder === folderId}
              emptyMessage="No Projects in this folder"
            />
          </Container>
        </main>
      </div>
    );
  }
  else {
    return null;
  }
}

export default FolderProjectsPage;
