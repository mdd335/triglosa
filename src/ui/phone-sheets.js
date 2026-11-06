/* Two sheets over the reading that only a phone has: the first steps, which
   a computer shows in a window of its own, and the question whether texts
   may go to the AI model, which App Review asks to be put before the first
   one goes (5.1.2(i)) — once for each address, the answer changed in the
   settings. Each is the settings sheet's shape: a bar with a button, a page
   under it. */

import { loadSettings, saveSettings } from "../platform/store.js";
import { settingsChanged } from "../platform/windows.js";
import { openPhoneSettings } from "../platform/env.js";
import { modelHostOf } from "../settings.js";
import { labels } from "./labels.js";
import { element } from "./elements.js";
import { icon } from "./icons.js";
import { exampleView } from "./example-view.js";

function sheetWith(title, button) {
  const sheet = element("div", "settings-sheet phone-sheet");
  const bar = element("div", "settings-sheet-bar");
  const done = element("button", null, button);
  done.type = "button";
  bar.append(element("span", null, title), done);
  const body = element("div", "phone-sheet-body");
  sheet.append(bar, body);
  return { sheet, body, done };
}

/* What the first steps say on a phone, drawn: what to set up once, then the
   ways a text gets in, the button that translates what was copied first,
   then the example. On a screen this small the steps come first: the example
   is what they lead to. */
export function phoneWelcomeView(text, reader) {
  const words = text.welcomePhone;
  const view = element("div", "phone-welcome");
  view.append(element("h1", null, text.welcome.heading));
  const inline = (name) => {
    const node = element("span", "inline-icon");
    node.append(icon(name));
    return node;
  };
  const list = (kind, lines) => {
    const steps = element(kind, "welcome-steps");
    for (const line of lines) {
      const item = element("li");
      item.append(...[].concat(line));
      steps.append(item);
    }
    return steps;
  };
  view.append(
    element("p", "label", words.setup),
    list("ol", [words.languages, words.model]),
    element("p", "label", words.start),
    list("ul", [words.paste(inline("paste")), words.share, words.plus(inline("add")), words.control]),
    element("p", "welcome-example-hint", words.exampleHint),
    exampleView(text.welcome.example, reader),
  );
  return view;
}

let shown = null;

/* At the first start, and from the settings' "show first steps". Closing
   it is the reader having seen it: it does not come back by itself. */
export async function openWelcomeSheet() {
  if (shown) return;
  const settings = await loadSettings();
  const text = labels(settings.languages[0]);
  const { sheet, body, done } = sheetWith(text.welcome.steps, text.welcomePhone.done);
  body.append(phoneWelcomeView(text, settings.languages[0]));
  done.addEventListener("click", async () => {
    sheet.remove();
    shown = null;
    if ((await loadSettings()).welcome) {
      await saveSettings({ ...(await loadSettings()), welcome: false });
      settingsChanged();
    }
  });
  shown = sheet;
  document.body.append(sheet);
}

/* What to do about iOS asking at every paste, once, after it has asked
   twice: the app cannot see how that is set, only that it took a moment. */
export function offerPasteSetting(settings) {
  const text = labels(settings.languages[0]);
  const { sheet, body, done } = sheetWith(text.pasteSetting, text.pasteLater);
  done.remove();
  const view = element("div", "phone-consent");
  view.append(element("p", null, text.pasteHint));
  const open = element("button", "phone-consent-allow", text.pasteOpen);
  open.addEventListener("click", () => {
    sheet.remove();
    openPhoneSettings();
  });
  const later = element("button", null, text.pasteLater);
  later.addEventListener("click", () => sheet.remove());
  const buttons = element("div", "phone-consent-buttons");
  buttons.append(open, later);
  view.append(buttons);
  body.append(view);
  document.body.append(sheet);
}

/* Whether texts may go to the AI model at the address in use, answered in a
   sheet and kept with the address. Resolves with the answer once it is
   written. */
export function askModelConsent(settings) {
  const host = modelHostOf(settings.endpoint);
  const text = labels(settings.languages[0]);
  const words = text.modelConsent;
  return new Promise((resolve) => {
    const { sheet, body, done } = sheetWith(words.title, words.allow);
    done.remove();
    const view = element("div", "phone-consent");
    view.append(element("p", null, words.body(host)));
    const answer = async (allowed) => {
      await saveSettings({ ...(await loadSettings()), modelConsent: { host, allowed } });
      sheet.remove();
      settingsChanged();
      resolve(allowed);
    };
    const allow = element("button", "phone-consent-allow", words.allow);
    allow.addEventListener("click", () => answer(true));
    const deny = element("button", null, words.deny);
    deny.addEventListener("click", () => answer(false));
    const buttons = element("div", "phone-consent-buttons");
    buttons.append(allow, deny);
    view.append(buttons);
    body.append(view);
    document.body.append(sheet);
  });
}
