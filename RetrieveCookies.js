export async function retrieveCookies() {
  const cookies = await GM.cookie.list();
  const find = (name) => cookies.find((c) => c.name === name)?.value ?? null;
  return {
    acct: find("acct"),
    prov: find("prov"),
  };
}
