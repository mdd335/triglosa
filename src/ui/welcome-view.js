/* The first steps, drawn: an example of what a reading looks like, where the
   app is found, the two things to set, how to start, on a Mac the permission
   that is optional, and the one question the app asks once. Only what
   somebody who never read the README needs, in the wording of the system
   they are on. Each step that sends the reader to the settings names the page
   it is on.

   `icon` is the address of the app's icon, which the window hands in; `key`
   is the shortcut as its field shows it, empty where none is set;
   `permission` is whether macOS has granted the one for reading text out of
   other programs; `hidden` is whether the reader asked not to see this at
   every start; `example` the example's drawing, built by the window
   (example-view.js); `consent` whether the reader allowed the anonymous
   count. */

import { buttonRow, element, rowButton } from "./elements.js";

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

/* The anonymous count as one box to tick, in the words the settings use for
   it; unticked nothing is counted. */
function consentBox(text, consent, onConsent) {
  const box = element("div", "welcome-consent");
  const line = element("label", "welcome-consent-line");
  const tick = element("input");
  tick.type = "checkbox";
  tick.checked = consent === true;
  tick.addEventListener("change", () => onConsent(tick.checked));
  line.append(tick, element("span", "welcome-consent-name", text.statsSetting));
  box.append(line, element("p", "welcome-consent-body", `${text.statsHint} ${text.welcome.stats.off} ${text.statsThanks}`));
  return box;
}

export function welcomeView({ text, system, icon, key, permission, hidden, example = null, consent = null },
                            { onHide, onSettings, onClose, onReadme, onConsent = () => {} }) {
  const words = text.welcome;
  const sheet = element("div", "welcome-sheet");
  if (icon) {
    const picture = element("img", "welcome-icon");
    picture.src = icon;
    picture.alt = "";
    sheet.append(picture);
  }
  sheet.append(element("h1", null, words.heading));

  /* What it all comes to, before anything is set up: a reading, with the
     line saying what it is first. */
  if (example) sheet.append(element("p", "welcome-example-hint", words.exampleHint), example);

  sheet.append(element("p", "label", words.steps));

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
    step(text.welcomeModel),
    step(start, words.start.title),
  );
  if (copies) steps.append(step(words.permission.body, words.permission.title));

  const consentNode = consentBox(text, consent, onConsent);

  const more = element("p", "welcome-more");
  more.append(...words.more((word) => link(word, onReadme)));

  const hide = element("label", "welcome-hide");
  const box = element("input");
  box.type = "checkbox";
  box.checked = !!hidden;
  box.addEventListener("change", () => onHide(box.checked));
  hide.append(box, element("span", null, words.hide));

  /* The box on a line of its own, the two ways on from here a row under it. */
  const foot = element("div", "welcome-foot");
  foot.append(hide, buttonRow([
    rowButton(words.settings, "settings", () => onSettings()),
    rowButton(words.close, "close", () => onClose()),
  ]));

  sheet.append(steps, consentNode, more, foot);
  return sheet;
}
