import { sendMessage } from "./ChatSearch";

// CSS styles for annotation elements
const annotationStyles = {
  item: `
    background-color: #f8f8f8;
    border-left: 3px solid #6c757d;
    padding: 1em;
    margin-bottom: 1em;
    border-radius: 2px;
    font-size: 0.95em;
    line-height: 1.5;
  `,
  content: `
    margin-bottom: 0.75em;
    color: #333;
  `,
  meta: `
    font-size: 0.85em;
    color: #666;
    margin-bottom: 0.5em;
  `,
  buttonContainer: `
    display: flex;
    gap: 0.5em;
    margin-top: 0.75em;
  `,
  button: `
    padding: 0.4em 0.8em;
    border: 1px solid #d0d0d0;
    background-color: #fff;
    color: #333;
    border-radius: 2px;
    cursor: pointer;
    font-size: 0.9em;
    transition: all 0.2s ease;
  `,
  buttonHover: `
    background-color: #f0f0f0;
    border-color: #999;
  `,
  deleteButton: `
    padding: 0.4em 0.8em;
    border: 1px solid #d0d0d0;
    background-color: #fff;
    color: #c92a2a;
    border-radius: 2px;
    cursor: pointer;
    font-size: 0.9em;
    transition: all 0.2s ease;
  `,
  deleteButtonHover: `
    background-color: #ffe5e5;
    border-color: #c92a2a;
  `,
  textarea: `
    width: 100%;
    padding: 0.75em;
    border: 1px solid #d0d0d0;
    border-radius: 2px;
    font-family: inherit;
    font-size: 0.95em;
    resize: vertical;
    box-sizing: border-box;
  `,
};

export function createAnnotationItem(networkID, messageID, annotation, div) {
  const item = document.createElement("div");
  item.style.cssText = annotationStyles.item;

  // {moderator} annotated user at {timestamp}: {message}
  // Note: Timestamp may sometimes be a Date object and sometimes be a string depending on whether it's freshly loaded from the cache or just created, so we need to handle both cases
  // If it's a String, it's a Date object that has been written as a Z encoded string, so we need to parse it back into a Date object before formatting it for display
  const timestamp =
    annotation.timestamp instanceof Date
      ? annotation.timestamp.toLocaleString()
      : new Date(annotation.timestamp).toLocaleString();

  const meta = document.createElement("div");
  meta.style.cssText = annotationStyles.meta;
  meta.textContent = `${annotation.moderator} at ${timestamp}`;

  const content = document.createElement("div");
  content.style.cssText = annotationStyles.content;
  content.textContent = annotation.text;

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = annotationStyles.buttonContainer;

  const editButton = document.createElement("button");
  editButton.textContent = "Edit";
  editButton.style.cssText = annotationStyles.button;
  editButton.addEventListener("mouseenter", () => {
    editButton.style.cssText =
      annotationStyles.button + annotationStyles.buttonHover;
  });
  editButton.addEventListener("mouseleave", () => {
    editButton.style.cssText = annotationStyles.button;
  });

  editButton.addEventListener("click", () => {
    // Switch to edit mode, replacing the content with a textarea and a save button
    const textarea = document.createElement("textarea");
    textarea.value = annotation.text;
    textarea.style.cssText = annotationStyles.textarea;
    textarea.style.height = "5em";

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.style.cssText = annotationStyles.button;
    saveButton.style.marginTop = "0.5em";
    saveButton.addEventListener("mouseenter", () => {
      saveButton.style.cssText =
        annotationStyles.button +
        annotationStyles.buttonHover +
        "margin-top: 0.5em;";
    });
    saveButton.addEventListener("mouseleave", () => {
      saveButton.style.cssText = annotationStyles.button + "margin-top: 0.5em;";
    });

    const cancelEditButton = document.createElement("button");
    cancelEditButton.textContent = "Cancel";
    cancelEditButton.style.cssText =
      annotationStyles.button + "margin-top: 0.5em; margin-left: 0.5em;";
    cancelEditButton.addEventListener("mouseenter", () => {
      cancelEditButton.style.cssText =
        annotationStyles.button +
        annotationStyles.buttonHover +
        "margin-top: 0.5em; margin-left: 0.5em;";
    });
    cancelEditButton.addEventListener("mouseleave", () => {
      cancelEditButton.style.cssText =
        annotationStyles.button + "margin-top: 0.5em; margin-left: 0.5em;";
    });

    saveButton.addEventListener("click", () => {
      // Send an edit command to the chat with the new annotation text
      const command = `AN${networkID} EDIT(${messageID}): ${textarea.value}`;
      sendMessage(command, GM_getValue("fkey"));

      // Update the item and switch back to view mode
      annotation.text = textarea.value;
      content.textContent = annotation.text;
      textarea.remove();
      saveButton.remove();
      cancelEditButton.remove();
      buttonContainer.style.display = "flex";
    });

    cancelEditButton.addEventListener("click", () => {
      // Cancel editing, remove textarea, saveButton, and cancelEditButton
      textarea.remove();
      saveButton.remove();
      cancelEditButton.remove();
      buttonContainer.style.display = "flex";
    });

    // Create a button group container for save and cancel buttons
    const editButtonContainer = document.createElement("div");
    editButtonContainer.style.cssText = annotationStyles.buttonContainer;
    editButtonContainer.appendChild(saveButton);
    editButtonContainer.appendChild(cancelEditButton);

    // Hide buttons and show textarea
    buttonContainer.style.display = "none";
    item.appendChild(textarea);
    item.appendChild(editButtonContainer);
  });

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.style.cssText = annotationStyles.deleteButton;
  deleteButton.addEventListener("mouseenter", () => {
    deleteButton.style.cssText =
      annotationStyles.deleteButton + annotationStyles.deleteButtonHover;
  });
  deleteButton.addEventListener("mouseleave", () => {
    deleteButton.style.cssText = annotationStyles.deleteButton;
  });

  deleteButton.addEventListener("click", () => {
    // Confirm the deletion with the user, getting an optional reason for the deletion
    const reason = prompt(
      "Are you sure you want to delete this annotation? This action cannot be undone. You can optionally provide a reason for the deletion:"
    );

    if (reason !== null) {
      // Send a delete command to the chat with the annotation ID
      const command = `AN${networkID} UNDO(${messageID}): ${
        reason || "<no reason provided>"
      }`;
      sendMessage(command, GM_getValue("fkey"));
      // Remove the item from the DOM immediately
      item.remove();
    }
  });

  div.appendChild(item);
  item.appendChild(meta);
  item.appendChild(content);
  item.appendChild(buttonContainer);
  buttonContainer.appendChild(editButton);
  buttonContainer.appendChild(deleteButton);
}

export function createClearCacheButton(networkID) {
  const userIDRegex = /\/users\/(\d+)\//g.exec(document.location);
  if (!userIDRegex) return;

  const userID = userIDRegex[1];
  const moderatorLinkElement = $("a[data-se-mod-button-id=" + userID + "]");
  if (!moderatorLinkElement.length) return;

  const button = document.createElement("button");
  button.textContent = "Clear Annotation Cache for This User";
  button.style.cssText = `
    padding: 0.4em 0.8em;
    border: 1px solid #d0d0d0;
    background-color: #fff;
    color: #333;
    border-radius: 2px;
    cursor: pointer;
    font-size: 0.9em;
    margin-left: 0.5em;
    transition: all 0.2s ease;
  `;
  button.addEventListener("mouseenter", () => {
    button.style.backgroundColor = "#f0f0f0";
    button.style.borderColor = "#999";
  });
  button.addEventListener("mouseleave", () => {
    button.style.backgroundColor = "#fff";
    button.style.borderColor = "#d0d0d0";
  });
  button.addEventListener("click", (e) => {
    e.preventDefault();
    if (
      confirm(
        "Are you sure you want to clear the annotation cache for this user?"
      )
    ) {
      const annotations = JSON.parse(GM_getValue("annotations"));
      if (annotations[networkID]) {
        delete annotations[networkID];
        GM_setValue("annotations", JSON.stringify(annotations));
        alert(
          "Annotation cache cleared for this user. Please refresh the page to see the changes."
        );
      } else {
        alert("No annotation cache found for this user.");
      }
    }
  });

  moderatorLinkElement.after(button);
}

export function createAnnotationsDiv() {
  const targetDiv = document.querySelector(".js-user-header");
  const annotationsDiv = document.createElement("div");
  annotationsDiv.id = "se-annotations";
  annotationsDiv.style.cssText = `
    background-color: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 3px;
    margin-top: 2em;
    margin-bottom: 2em;
    padding: 0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  `;

  const title = document.createElement("h2");
  title.textContent = "Profile Annotations";
  title.style.cssText = `
    color: #222;
    padding: 1em 1em 0.5em 1em;
    margin: 0;
    font-size: 1.2em;
    font-weight: 600;
    border-bottom: 1px solid #f0f0f0;
  `;
  annotationsDiv.appendChild(title);

  // Add padding container for annotations
  const contentContainer = document.createElement("div");
  contentContainer.style.cssText = `
    padding: 1em;
  `;
  annotationsDiv.appendChild(contentContainer);

  // Replace the direct children access with the container
  const originalAppendChild = annotationsDiv.appendChild.bind(annotationsDiv);
  annotationsDiv.appendChild = function (child) {
    if (
      child !== title &&
      child !== contentContainer &&
      child.tagName !== "DIV"
    ) {
      contentContainer.appendChild(child);
    } else if (child !== title && child !== contentContainer) {
      contentContainer.appendChild(child);
    }
    return child;
  };
  annotationsDiv._contentContainer = contentContainer;

  targetDiv.after(annotationsDiv);

  return annotationsDiv;
}

export function createAnnotationButton(networkID, annotationsDiv) {
  const button = document.createElement("button");
  button.textContent = "+ Add";
  button.style.cssText = `
    padding: 0.4em 0.8em;
    border: 1px solid #d0d0d0;
    background-color: #fff;
    color: #333;
    border-radius: 2px;
    cursor: pointer;
    font-size: 0.9em;
    margin-left: auto;
    transition: all 0.2s ease;
  `;
  button.addEventListener("mouseenter", () => {
    button.style.backgroundColor = "#f0f0f0";
    button.style.borderColor = "#999";
  });
  button.addEventListener("mouseleave", () => {
    button.style.backgroundColor = "#fff";
    button.style.borderColor = "#d0d0d0";
  });

  button.addEventListener("click", () => {
    // Put a textarea and a submit button below the user header for adding a new annotation
    const textarea = document.createElement("textarea");
    textarea.style.cssText = `
      width: 100%;
      padding: 0.75em;
      border: 1px solid #d0d0d0;
      border-radius: 2px;
      font-family: inherit;
      font-size: 0.95em;
      resize: vertical;
      box-sizing: border-box;
      height: 5em;
    `;
    textarea.placeholder = "Enter annotation text here...";

    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";
    submitButton.style.cssText = `
      padding: 0.4em 0.8em;
      border: 1px solid #d0d0d0;
      background-color: #fff;
      color: #333;
      border-radius: 2px;
      cursor: pointer;
      font-size: 0.9em;
      margin-top: 0.5em;
      transition: all 0.2s ease;
    `;
    submitButton.addEventListener("mouseenter", () => {
      submitButton.style.backgroundColor = "#f0f0f0";
      submitButton.style.borderColor = "#999";
    });
    submitButton.addEventListener("mouseleave", () => {
      submitButton.style.backgroundColor = "#fff";
      submitButton.style.borderColor = "#d0d0d0";
    });

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.style.cssText = `
      padding: 0.4em 0.8em;
      border: 1px solid #d0d0d0;
      background-color: #fff;
      color: #333;
      border-radius: 2px;
      cursor: pointer;
      font-size: 0.9em;
      margin-top: 0.5em;
      margin-left: 0.5em;
      transition: all 0.2s ease;
    `;
    cancelButton.addEventListener("mouseenter", () => {
      cancelButton.style.backgroundColor = "#f0f0f0";
      cancelButton.style.borderColor = "#999";
    });
    cancelButton.addEventListener("mouseleave", () => {
      cancelButton.style.backgroundColor = "#fff";
      cancelButton.style.borderColor = "#d0d0d0";
    });
    cancelButton.addEventListener("click", () => {
      // Remove the textarea, submit button, and cancel button
      textarea.remove();
      submitButton.remove();
      cancelButton.remove();
      button.style.display = "block";
    });

    submitButton.addEventListener("click", async function () {
      if (textarea.value.trim()) {
        const command = `AN${networkID}: ${textarea.value}`;
        const newID = await sendMessage(command, GM_getValue("fkey"));

        // Remove the textarea, submit button, and cancel button after submitting the annotation
        textarea.remove();
        submitButton.remove();
        cancelButton.remove();
        button.style.display = "block";

        // Add the new annotation to the annotationsDiv immediately
        const container = annotationsDiv._contentContainer || annotationsDiv;
        const newAnnotation = {
          text: textarea.value,
          timestamp: new Date(),
          moderator: "You",
          commandID: newID,
        };
        createAnnotationItem(networkID, newID, newAnnotation, container);
      }
    });

    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
      display: flex;
      gap: 0.5em;
      margin-top: 0.5em;
    `;
    buttonContainer.appendChild(submitButton);
    buttonContainer.appendChild(cancelButton);

    const container = annotationsDiv._contentContainer || annotationsDiv;
    container.appendChild(textarea);
    container.appendChild(buttonContainer);
    button.style.display = "none";
  });

  const titleElement = annotationsDiv.querySelector("h2");
  titleElement.style.cssText = `
    display: flex;
    align-items: center;
    color: #222;
    padding: 1em 1em 0.5em 1em;
    margin: 0;
    font-size: 1.2em;
    font-weight: 600;
    border-bottom: 1px solid #f0f0f0;
  `;
  titleElement.appendChild(button);
}
