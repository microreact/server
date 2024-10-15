export async function getServerSideProps(context) {
  return {
    redirect: {
      destination: "/api/auth/signin",
      permanent: false,
    },
  };
}

export default function Signin() {
  return null;
}
