import { annotationsForUser } from "./ChatSearch";

// Adapted from https://raw.githubusercontent.com/Glorfindel83/SE-Userscripts/master/add-network-profile-link/add-network-profile-link.user.js
export async function getNetworkId() {
  // Quick assertion to ensure that the network id can be accessed
  if (
    typeof StackExchange === "undefined" ||
    typeof StackExchange.ready !== "function"
  ) {
    return;
  }

  return new Promise((resolve) =>
    StackExchange.ready(() => resolve(StackExchange.user?.options?.accountId))
  );
}

export async function getNetworkAnnotations() {
  const networkID = await getNetworkId();

  // This updates the stored annotations with any new annotations, but needs to be written back
  const annotations = await annotationsForUser(
    networkID,
    1,
    JSON.parse(GM_getValue("annotations"))
  );
  GM_setValue("annotations", JSON.stringify(annotations));

  const userAnnotations = annotations[networkID].messages;
  return [networkID, userAnnotations];
}
