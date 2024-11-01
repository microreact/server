export function signin() {
  window.open(
    "/api/auth/signin?callbackUrl=/welcome",
    "Sign in to Microreact",
    "resizable,scrollbars,status,width=600,height=600"
  );
}
