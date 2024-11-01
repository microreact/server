/* eslint-disable class-methods-use-this */

import React from "react";
import Head from "next/head";
import getUser from "cgps-application-server/middleware/get-user";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import sessionUserHook from "cgps-application-server/hooks/session-user";

import AccountPageNav from "../../components/AccountPageNav";
import UiDataHook from "../../components/UiDataHook";
import UiCopyTextfield from "../../components/UiCopyTextfield";
import UiAvatar from "../../components/UiAvatar";
import Styles from "../../styles/account-page.module.css";

import * as DataHooks from "../../utils/data-hooks";

export async function getServerSideProps(context) {
  const user = await getUser(context.req, context.res);
  if (!user) {
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=/my-account/settings`,
        permanent: false,
      },
    };
  }
  return {
    props: {}, // will be passed to the page component as props
  };
}

function ProfileSection() {
  const session = sessionUserHook(true);
  const isLoading = (session === "loading");

  if (isLoading) {
    return (<Skeleton />);
  }

  return (
    <section>
      <p>
        Name: {session.name}
      </p>

      <p>
        Email: {session.email}
      </p>

      <p>
        Account Gravatar (change at <a href="https://gravatar.com/" target="_blank" rel="noreferrer">https://gravatar.com/</a>):
        <UiAvatar email={session.email} />
      </p>

    </section>
  );
}

function ApiSection() {
  return (
    <section className={Styles["api-section"]}>
      <Typography variant="h3">API Access</Typography>

      <UiDataHook
        LoadingView={Skeleton}
        dataHook={DataHooks.userAccessToken}
      >
        {
          ({ data }) => {
            return (
              <UiCopyTextfield
                label="Access Token"
                title="Copy Access Token"
                value={data.token}
              />
            );
          }
        }
      </UiDataHook>
    </section>
  );
}

function DeleteAccountSection() {
  const session = sessionUserHook(true);
  const isLoading = (session === "loading");

  if (isLoading) {
    return (<Skeleton />);
  }

  return (
    <section>
      <Typography variant="h3">Account Deletion</Typography>

      <form
        method="post"
        action={`mailto:support@microreact.org?subject=Account Deletion&body=Please send this request from ${session.email}`}
        encType="text/plain"
      >
        <Button
          color="primary"
          variant="outlined"
          type="submit"
        >
          Request Account Deletion
        </Button>
      </form>
    </section>
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
          <Typography variant="h2">Account Settings</Typography>

          <ProfileSection />

          <ApiSection />

          <DeleteAccountSection />

        </Container>
      </main>
    </div>
  );
}

export default MyProjectsPage;
