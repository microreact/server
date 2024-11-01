/* eslint-disable class-methods-use-this */

import React from "react";
import Head from "next/head";
import getUser from "cgps-application-server/middleware/get-user";
import sessionUserHook from "cgps-application-server/hooks/session-user";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";

import AccountPageNav from "../../components/AccountPageNav";
import AccountProjectGrid from "../../components/AccountProjectGrid";
import Styles from "../../styles/account-page.module.css";

import * as DataHooks from "../../utils/data-hooks";

export async function getServerSideProps(context) {
  const user = await getUser(context.req, context.res);
  if (!user) {
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=/my-account`,
        permanent: false,
      },
    };
  }
  return {
    props: {}, // will be passed to the page component as props
  };
}

// const loginStyle = {
//   "position": "fixed",
//   "top": "0",
//   "bottom": "0",
//   "left": "0",
//   "right": "0",
//   "background-color": "white",
//   "display": "flex",
//   "justify-content": "center",
//   "align-items": "center",
//   "z-index": "10000",
// };

function PageTitle() {
  const user = sessionUserHook(true);
  return (
    <Typography variant="h2">
      {
        (user === "loading") ? <Skeleton /> : `Projects created by ${user.name} (${user.email})`
      }
    </Typography>
  );
}

function MyProjectsPage() {
  return (
    <div
      className={Styles.page}
    >
      <Head>
        <title>My Projects</title>
      </Head>

      <AccountPageNav />

      <main>
        <Container maxWidth="lg">
          <PageTitle />

          <AccountProjectGrid
            apiEndpoint={DataHooks.userProjectsHook}
            filter={(doc) => !doc.binned}
            emptyMessage="No Projects"
          />
        </Container>
      </main>
    </div>
  );
}

export default MyProjectsPage;
