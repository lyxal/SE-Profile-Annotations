// ==UserScript==
// @name         Annotations
// @version      0.0.0
// @description  Profile annotations for the SE network
// @author       lyxal
// @match        *://*.stackexchange.com/users/*
// @match        *://*.stackoverflow.com/users/*
// @match        *://stackoverflow.com/users/*
// @match        *://superuser.com/users/*
// @match        *://serverfault.com/users/*
// @match        *://askubuntu.com/users/*
// @match        *://stackapps.com/users/*
// @match        *://mathoverflow.net/users/*
// @match        https://chat.stackexchange.com/rooms/163900/*
// @exclude      *://stackexchange.com/users/*
// @exclude      *://chat.stackexchange.com/users/*
// @exclude      *://chat.stackoverflow.com/users/*
// @exclude      *://chat.meta.stackexchange.com/users/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_cookie
// ==/UserScript==
/* globals $:readonly, StackExchange:readonly */

(async function () {
  'use strict';

  async function retrieveCookies() {
    const cookies = await GM.cookie.list();
    const find = (name) => cookies.find((c) => c.name === name)?.value ?? null;
    return {
      acct: find("acct"),
      prov: find("prov"),
    };
  }

  function gmFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: options.method || "GET",
        url: url.toString(),
        headers: options.headers || {},
        data: options.body || null,
        onload: (response) => {
          if (response.status >= 200 && response.status < 300) {
            resolve(response);
          }
          reject(
            new Error(
              `Request failed with status ${response.status}: ${response.statusText}`
            )
          );
        },
      });
    });
  }

  function parseTimestamp(raw) {
    const text = raw.trim();
    const now = new Date();
    const todayUTC = [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()];

    // "hh:mm" — today (UTC)
    if (/^\d{1,2}:\d{2}$/.test(text)) {
      const [h, m] = text.split(":").map(Number);
      return new Date(Date.UTC(...todayUTC, h, m));
    }

    // "yst hh:mm" — yesterday (UTC)
    if (/^yst \d{1,2}:\d{2}$/.test(text)) {
      const [h, m] = text.split(" ")[1].split(":").map(Number);
      return new Date(Date.UTC(todayUTC[0], todayUTC[1], todayUTC[2] - 1, h, m));
    }

    // "Month DD hh:mm" — this year, e.g. "Apr 24 06:11"
    if (/^[A-Za-z]+ \d{1,2} \d{1,2}:\d{2}$/.test(text)) {
      const [month, day, time] = text.split(" ");
      const [h, m] = time.split(":").map(Number);
      return new Date(
        Date.UTC(
          now.getUTCFullYear(),
          new Date(`${month} 1`).getMonth(),
          Number(day),
          h,
          m
        )
      );
    }

    // "Month DD, YYYY hh:mm" — explicit year, e.g. "Dec 22, 2024 03:21"
    if (/^[A-Za-z]+ \d{1,2}, \d{4} \d{1,2}:\d{2}$/.test(text)) {
      const match = text.match(/^(\w+) (\d{1,2}), (\d{4}) (\d{1,2}):(\d{2})$/);
      const [, month, day, year, h, m] = match;
      return new Date(
        Date.UTC(
          Number(year),
          new Date(`${month} 1`).getMonth(),
          Number(day),
          Number(h),
          Number(m)
        )
      );
    }

    console.warn(`Unrecognised timestamp format: "${text}"`);
    return null;
  }
  async function annotationsForUser(
    networkID,
    page = 1,
    annotationDB = {}
  ) {
    const PAGE_SIZE = 100;
    const url = new URL("https://chat.stackexchange.com/search");
    const cachedMessageID = annotationDB[networkID]?.cached ?? -1;

    url.searchParams.set("q", `AN${networkID}`);
    url.searchParams.set("page", page);
    url.searchParams.set("pagesize", PAGE_SIZE);
    url.searchParams.set("room", "163900");

    let response = await gmFetch(url);
    let parser = new DOMParser();
    let doc = parser.parseFromString(response.responseText, "text/html");

    const messages = Array.from(doc.querySelectorAll(".message")).map((msg) => {
      const id = msg.id.replace("message-", "");
      const contentEl = msg.querySelector(".content");
      const text = contentEl ? contentEl.textContent.trim() : "";
      const rawTimestamp =
        msg
          .closest(".monologue")
          ?.querySelector(".timestamp")
          ?.textContent.trim() ?? "";
      const timestamp = parseTimestamp(rawTimestamp);
      const username =
        msg
          .closest(".monologue")
          ?.querySelector(".username a")
          ?.textContent.trim() ?? "";
      const permalink = msg.querySelector("a[name]")?.getAttribute("href") ?? "";

      return { id, username, timestamp, text, permalink };
    });

    const hasMorePages = !!doc.querySelector(".page-numbers.next");

    console.log(
      `Message IDs on page ${page} for user ${networkID}: ${messages
      .map((m) => m.id)
      .join(", ")}`
    ); // Debug log

    // Recursively fetch next page if there are more pages and the last message ID is greater than the cachedMessageID
    if (hasMorePages && messages[messages.length - 1].id > cachedMessageID) {
      const result = await annotationsForUser(
        networkID,
        page + 1,
        cachedMessageID);
      Object.assign(annotationDB, result);
    } else {
      // Output a message if we stopped fetching due to cachedMessageID
      if (hasMorePages) {
        console.log(
          `Stopped fetching more pages for user ${networkID} because the last message ID (${
          messages[messages.length - 1].id
        }) is not greater than the cached message ID (${cachedMessageID}).`
        );
      }
    }

    console.log(
      `Fetched ${messages.length} messages for user ${networkID} on page ${page}.`
    ); // Debug log

    for (const msg of messages) {
      // Skip messages below the cached message ID
      if (msg.id <= cachedMessageID) {
        continue;
      }

      const pattern = /^AN(\d+)(?:\s+(EDIT|UNDO)\((\d+)\))?:\s*(.+)$/;

      const parse = (str) => {
        const [, , command, commandID, text] = str.match(pattern) ?? [];
        return { command, commandID, text };
      };

      let { command, commandID, text } = parse(msg.text);
      if (command === undefined) {
        // New annotation.
        if (!annotationDB[networkID]) {
          annotationDB[networkID] = { messages: {}, cached: -1 };
        }
        annotationDB[networkID].messages[msg.id] = {
          moderator: msg.username,
          text: text,
          timestamp: msg.timestamp,
        };
      } else if (command === "UNDO") {
        // UNDO command - remove the message with ID m from the annotationDB
        if (
          annotationDB[networkID] &&
          annotationDB[networkID].messages[commandID]
        ) {
          delete annotationDB[networkID].messages[commandID];
        }
      } else if (command === "EDIT") {
        // EDIT command - update the message with ID m in the annotationDB to text
        if (
          annotationDB[networkID] &&
          annotationDB[networkID].messages[commandID]
        ) {
          annotationDB[networkID].messages[commandID].text = text;
        }
      }
    }

    // Update cached message ID for this user
    // User is guaranteed to be in the DB because we add them when we see their first annotation message, and the first annotation message ID will always be greater than -1

    if (messages.length > 0) {
      annotationDB[networkID].cached = messages[0].id;
    }

    return annotationDB;
  }

  // Adapted from https://raw.githubusercontent.com/Glorfindel83/SE-Userscripts/master/add-network-profile-link/add-network-profile-link.user.js
  async function getNetworkId() {
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

  async function getNetworkAnnotations() {
    const networkID = await getNetworkId();

    // This updates the stored annotations with any new annotations, but needs to be written back
    const annotations = await annotationsForUser(
      networkID,
      1,
      JSON.parse(GM_getValue("annotations"))
    );
    GM_setValue("annotations", JSON.stringify(annotations));

    const userAnnotations = annotations[networkID].messages;
    return userAnnotations;
  }

  function createAnnotationItem(annotation, div) {
    const item = document.createElement("div");
    item.style.border = "1px solid #ccc";
    item.style.padding = "0.5em";
    item.style.marginBottom = "0.5em";

    // {moderator} annotated user at {timestamp}: {message}
    const timestamp = annotation.timestamp.toLocaleString();
    item.textContent = `${annotation.moderator} annotated user at ${timestamp}: ${annotation.text}`;

    div.appendChild(item);
  }

  function createClearCacheButton() {
    const userIDRegex = /\/users\/(\d+)\//g.exec(document.location);
    if (!userIDRegex) return;

    const userID = userIDRegex[1];
    const moderatorLinkElement = $("a[data-se-mod-button-id=" + userID + "]");
    if (!moderatorLinkElement.length) return;

    const button = document.createElement("a");
    button.textContent = "Clear Annotations Cache";
    button.style.marginLeft = "1em";
    button.href = "#";
    button.addEventListener("click", () => {
      GM_setValue("annotations", JSON.stringify({}));
      alert(
        "Annotations cache cleared. Please refresh the page to see the effect."
      );
    });

    moderatorLinkElement.after(button);
  }

  function createAnnotationsDiv() {
    const targetDiv = document.querySelector(".js-user-header");
    const annotationsDiv = document.createElement("div");
    annotationsDiv.id = "se-annotations";
    annotationsDiv.style.backgroundColor = "#86630b";
    annotationsDiv.style.border = "1px solid #ccc";
    annotationsDiv.style.marginTop = "2em";
    annotationsDiv.style.marginBottom = "2em";

    targetDiv.after(annotationsDiv);
    return annotationsDiv;
  }

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

})();
