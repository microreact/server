/* eslint-disable class-methods-use-this */

import React from "react";
import Head from "next/head";
import getUser from "cgps-application-server/middleware/get-user";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import sessionUserHook from "cgps-application-server/hooks/session-user";

import AccountPageNav from "../../components/AccountPageNav";
import AccountProjectGrid from "../../components/AccountProjectGrid";
import Styles from "../../styles/account-page.module.css";

import * as DataHooks from "../../utils/data-hooks";

export async function getServerSideProps(context) {
  const user = await getUser(context.req, context.res);
  if (!user) {
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${context.req.url}`,
        permanent: false,
      },
    };
  }
  return {
    props: {}, // will be passed to the page component as props
  };
}

const emptyIcon = (<StarOutlineOutlinedIcon />);

function PageTitle() {
  const session = sessionUserHook(true);
  const isLoading = (session === "loading");

  return (
    <Typography variant="h2">
      {
        isLoading ? <Skeleton /> : `Projects starred by ${session.name} (${session.email})`
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
        <title>Starred projects</title>
      </Head>

      <AccountPageNav />

      <main>
        <Container maxWidth="lg">
          <PageTitle />

          <AccountProjectGrid
            apiEndpoint={DataHooks.userProjectsHook}
            filter={(doc) => !doc.binned && doc.starred}
            emptyMessage="No Starred Projects"
            emptyIcon={emptyIcon}
          />
        </Container>
      </main>
    </div>
  );
}

export default MyProjectsPage;
