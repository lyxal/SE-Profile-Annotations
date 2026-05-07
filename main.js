import { retrieveCookies } from "./RetrieveCookies";
import { annotationsForUser } from "./ChatSearch";
import { getNetworkAnnotations, getNetworkId } from "./GetUserId";
import {
  createAnnotationButton,
  createAnnotationItem,
  createAnnotationsDiv,
  createClearCacheButton,
} from "./HTMLGen";
(async function () {
  const version = GM_info?.version ?? "";
  const isBeta = /b\d+|beta/i.test(version);

  if (!isBeta) {
    // Silent termination in case this script is accidentally installed from the stable userscripts site, since the stable version of the script doesn't have any functionality and relies on the beta version to populate the cache.
    return;
  }

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

  // Check that acct, prov, and fkey are set.
  // If not, open the chat page in a new tab to retrieve them, then return early so that the user can refresh after the values have been set.
  const acct = GM_getValue("acct");
  const prov = GM_getValue("prov");
  const fkey = GM_getValue("fkey");

  if (!acct || !prov || !fkey) {
    // Do the installation process for the user automatically.
    alert(
      "[NETWORK WIDE ANNOTATIONS] Setting things up - opening the chat page to retrieve the required cookies and fkey for network-wide annotations. Once done, please refresh this page."
    );
    window.open("https://chat.stackexchange.com/rooms/163900", "_blank");
    return;
  }

  const [networkID, annotations] = await getNetworkAnnotations(); // Returns a messages dictionary

  console.log(`Loaded annotations for user ${networkID}:`, annotations);

  const annotationsDiv = createAnnotationsDiv();

  // Create annotation items for each annotation and add to the annotationsDiv
  // Pass in both messageID and the annotation data for that message so that the edit and delete buttons can reference the message ID when sending commands to the chat
  Object.entries(annotations).forEach(([messageID, annotation]) => {
    createAnnotationItem(networkID, messageID, annotation, annotationsDiv);
  });

  createAnnotationButton(networkID, annotationsDiv);
  createClearCacheButton(networkID);
})();
