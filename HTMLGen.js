export function createAnnotationItem(annotation, div) {
  const item = document.createElement("div");
  item.style.border = "1px solid #ccc";
  item.style.padding = "0.5em";
  item.style.marginBottom = "0.5em";

  // {moderator} annotated user at {timestamp}: {message}
  const timestamp = annotation.timestamp.toLocaleString();
  item.textContent = `${annotation.moderator} annotated user at ${timestamp}: ${annotation.text}`;

  div.appendChild(item);
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

  targetDiv.after(annotationsDiv);
  return annotationsDiv;
}
