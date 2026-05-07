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

  async function annotationsForUser(
    networkID,
    page = 1,
    cachedMessageID = -1,
    annotationDB = {}
  ) {
    const PAGE_SIZE = 100;
    const url = new URL("https://chat.stackexchange.com/search");

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
      const timestamp =
        msg
          .closest(".monologue")
          ?.querySelector(".timestamp")
          ?.textContent.trim() ?? "";
      const username =
        msg
          .closest(".monologue")
          ?.querySelector(".username a")
          ?.textContent.trim() ?? "";
      const permalink = msg.querySelector("a[name]")?.getAttribute("href") ?? "";

      return { id, username, timestamp, text, permalink };
    });

    const hasMorePages = !!doc.querySelector(".page-numbers.next");

    // Recursively fetch next page if there are more pages and the last message ID is greater than the cachedMessageID
    if (hasMorePages && messages[messages.length - 1].id > cachedMessageID) {
      const result = await annotationsForUser(
        networkID,
        page + 1,
        cachedMessageID,
        annotationDB
      );
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
        annotationDB[networkID].messages[msg.id] = text;
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
          annotationDB[networkID].messages[commandID] = text;
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

})();
