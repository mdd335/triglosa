/* The first steps, drawn: where the app is found, the two things to set, how
   to start, and on a Mac the permission that is optional. Only what somebody
   who never read the README needs, in the wording of the system they are on.

   `icon` is the address of the app's icon, which the window hands in; `key`
   is the shortcut as its field shows it, empty where none is set;
   `permission` is whether macOS has granted the one for reading text out of
   other programs; `hidden` is whether the reader asked not to see this at
   every start. */

import { element } from "./elements.js";

function link(word, onClick) {
  const node = element("a", "text-link", word);
  node.href = "#";
  node.addEventListener("click", (event) => {
    event.preventDefault();
    onClick();
  });
  return node;
}

/* The last two open with what they are about: the others are short enough
   to say it themselves. */
function step(body, title) {
  const item = element("li");
  if (title) item.append(title, " ");
  item.append(...[].concat(body));
  return item;
}

export function welcomeView({ text, system, icon, key, permission, hidden }, { onHide, onSettings, onClose, onGuide, onReadme }) {
  const words = text.welcome;
  const sheet = element("div", "welcome-sheet");
  if (icon) {
    const picture = element("img", "welcome-icon");
    picture.src = icon;
    picture.alt = "";
    sheet.append(picture);
  }
  sheet.append(element("h1", null, words.heading), element("p", "label", words.steps));

  /* Without the permission the shortcut reads what was copied, so that is
     what the step says to do. */
  const copies = system !== "windows" && !permission;
  const press = copies ? words.start.copy : words.start.select;
  const start = key
    ? [...press(element("strong", null, key)), " ", words.start.change]
    : [...press(words.start.noKey), " ", words.start.set];

  const steps = element("ol", "welcome-steps");
  steps.append(
    step(text.welcomeFind),
    step(words.languages),
    step(text.welcomeModel((word) => link(word, onGuide))),
    step(start, words.start.title),
  );
  if (copies) steps.append(step(words.permission.body, words.permission.title));

  const more = element("p", "welcome-more");
  more.append(...words.more((word) => link(word, onReadme)));

  const hide = element("label", "welcome-hide");
  const box = element("input");
  box.type = "checkbox";
  box.checked = !!hidden;
  box.addEventListener("change", () => onHide(box.checked));
  hide.append(box, element("span", null, words.hide));

  const settings = element("button", null, words.settings);
  settings.addEventListener("click", onSettings);
  const close = element("button", null, words.close);
  close.addEventListener("click", onClose);
  const foot = element("div", "welcome-foot");
  foot.append(hide, settings, close);

  sheet.append(steps, more, foot);
  return sheet;
}
