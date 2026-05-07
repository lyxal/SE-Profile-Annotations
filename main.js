import { retrieveCookies } from "./RetrieveCookies";
import { annotationsForUser } from "./ChatSearch";
(async function () {
  // Make sure that the userscript has a cached annotations store
  if (typeof GM_getValue("annotations") === "undefined") {
    GM_setValue("annotations", JSON.stringify({}));
  }

  // Cached annotations is a JSON mapping of:
  /*

  {
    userID: {
      messages: {messageID: contents},
      cached: messageID
    }
  }

  */

  if (
    document.location.href.startsWith(
      "https://chat.stackexchange.com/rooms/163900"
    )
  ) {
    let cookies = await retrieveCookies();
    let fkey = document.querySelector('input[name="fkey"]')?.value;

    if (!cookies.acct || !cookies.prov || !fkey) {
      console.error("Required cookies or fkey not found. Aborting.");
      return;
    }

    GM_setValue("acct", cookies.acct);
    GM_setValue("prov", cookies.prov);
    GM_setValue("fkey", fkey);
  }

  console.log(`acct: ${GM_getValue("acct")}`);
  console.log(`prov: ${GM_getValue("prov")}`);
  console.log(`fkey: ${GM_getValue("fkey")}`);

  console.log(await annotationsForUser(67));
})();
