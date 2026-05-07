import { retrieveCookies } from "./RetrieveCookies";
import { annotationsForUser } from "./ChatSearch";
import { getNetworkAnnotations, getNetworkId } from "./GetUserId";
import {
  createAnnotationItem,
  createAnnotationsDiv,
  createClearCacheButton,
} from "./HTMLGen";
(async function () {
  // Make sure that the userscript has a cached annotations store
  if (typeof GM_getValue("annotations") === "undefined") {
    GM_setValue("annotations", JSON.stringify({}));
  }

  // Cached annotations is a JSON mapping of:
  /*

  {
    userID: {
      messages: {messageID: {moderator: name, text: text, timestamp: time}},
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
    return;
  }

  const annotations = await getNetworkAnnotations(); // Returns a messages dictionary

  const annotationsDiv = createAnnotationsDiv();

  // Create annotation items for each annotation and add to the annotationsDiv
  Object.values(annotations).forEach((annotation) => {
    createAnnotationItem(annotation, annotationsDiv);
  });

  createClearCacheButton();
})();
