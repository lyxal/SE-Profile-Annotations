import { sendMessage } from "./ChatSearch";

export function createAnnotationItem(networkID, messageID, annotation, div) {
  const item = document.createElement("div");
  item.style.border = "1px solid #ccc";
  item.style.padding = "0.5em";
  item.style.marginBottom = "0.5em";

  // {moderator} annotated user at {timestamp}: {message}
  // Note: Timestamp may sometimes be a Date object and sometimes be a string depending on whether it's freshly loaded from the cache or just created, so we need to handle both cases
  // If it's a String, it's a Date object that has been written as a Z encoded string, so we need to parse it back into a Date object before formatting it for display
  const timestamp =
    annotation.timestamp instanceof Date
      ? annotation.timestamp.toLocaleString()
      : new Date(annotation.timestamp).toLocaleString();
  item.textContent = `${annotation.moderator} annotated user at ${timestamp}: ${annotation.text}`;

  const editButton = document.createElement("button");
  editButton.textContent = "Edit Annotation";
  editButton.style.marginLeft = "1em";

  editButton.addEventListener("click", () => {
    // Switch to edit mode, replacing the text content with a textarea and a save button
    const textarea = document.createElement("textarea");
    textarea.value = annotation.text;
    textarea.style.width = "100%";
    textarea.style.height = "4em";

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.style.marginTop = "0.5em";

    saveButton.addEventListener("click", () => {
      // Send an edit command to the chat with the new annotation text
      const command = `AN${networkID} EDIT(${messageID}): ${textarea.value}`;
      const url =
        "https://chat.stackexchange.com/rooms/163900/network-wide-profile-annotations";
      sendMessage(command, GM_getValue("fkey"));

      // Update the item text content with the new annotation text and switch back to view mode
      annotation.text = textarea.value;
      item.textContent = `${annotation.moderator} annotated user at ${timestamp}: ${annotation.text}`;

      // Re-add the edit and delete buttons
      item.appendChild(editButton);
      item.appendChild(deleteButton);
    });

    // Clear the item and add the textarea and save button
    item.textContent = "";
    item.appendChild(textarea);
    item.appendChild(saveButton);
  });

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete Annotation";
  deleteButton.style.marginLeft = "0.5em";

  deleteButton.addEventListener("click", () => {
    // Confirm the deletion with the user, getting an optional reason for the deletion
    const reason = prompt(
      "Are you sure you want to delete this annotation? This action cannot be undone. You can optionally provide a reason for the deletion:"
    );

    // Send a delete command to the chat with the annotation ID
    const command = `AN${networkID} UNDO(${messageID}): ${
      reason ?? "<no reason provided>"
    }`;
    sendMessage(command, GM_getValue("fkey"));
    // Remove the item from the DOM immediately
    item.remove();
  });

  div.appendChild(item);
  item.appendChild(editButton);
  item.appendChild(deleteButton);
}

export function createClearCacheButton() {
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

export function createAnnotationsDiv() {
  const targetDiv = document.querySelector(".js-user-header");
  const annotationsDiv = document.createElement("div");
  annotationsDiv.id = "se-annotations";
  annotationsDiv.style.backgroundColor = "#86630b";
  annotationsDiv.style.border = "1px solid #ccc";
  annotationsDiv.style.marginTop = "2em";
  annotationsDiv.style.marginBottom = "2em";

  const title = document.createElement("h2");
  title.textContent = "Profile Annotations";
  title.style.color = "#fff";
  title.style.padding = "0.5em";
  annotationsDiv.appendChild(title);

  targetDiv.after(annotationsDiv);

  return annotationsDiv;
}

export function createAnnotationButton(networkID, annotationsDiv) {
  const button = document.createElement("a");
  button.textContent = "Add Annotation";
  button.href = "#";
  button.style.marginLeft = "1em";

  button.addEventListener("click", () => {
    // Put a textarea and a submit button below the user header for adding a new annotation
    const textarea = document.createElement("textarea");
    textarea.style.width = "100%";
    textarea.style.height = "4em";
    textarea.placeholder = "Enter annotation text here...";

    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";
    submitButton.style.marginTop = "0.5em";

    submitButton.addEventListener("click", async function () {
      const command = `AN${networkID}: ${textarea.value}`;
      const url =
        "https://chat.stackexchange.com/rooms/163900/network-wide-profile-annotations";
      const newID = sendMessage(command, GM_getValue("fkey"));

      // Remove the textarea and submit button after submitting the annotation
      textarea.remove();
      submitButton.remove();

      // Add the new annotation to the annotationsDiv immediately
      // We don't have a timestamp or moderator for this annotation yet, so we'll just use placeholders until the page is refreshed and the new annotation is loaded from the cache
      const newAnnotation = {
        text: textarea.value,
        timestamp: new Date(),
        moderator: "You",
        commandID: newID,
      };
      createAnnotationItem(newAnnotation, annotationsDiv, networkID);
    });
    annotationsDiv.appendChild(textarea);
    annotationsDiv.appendChild(submitButton);
  });

  const titleElement = annotationsDiv.querySelector("h2");
  titleElement.appendChild(button);
}
