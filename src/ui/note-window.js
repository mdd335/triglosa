/* A note said without the reading window, in a small window of its own that
   goes by itself (show_note in the shell): what went wrong where a
   screenshot's text was to be copied or put on a card. The shell hands the
   sentence in before the page runs; the page draws it beside the app's
   symbol and fits the window to it. */

import { fitCardWindow } from "../platform/windows.js";
import { element } from "./elements.js";
import icon from "../../src-tauri/icons/flat.png";

const root = document.getElementById("app");
root.className = "note-window";
const picture = element("img", "note-icon");
picture.src = icon;
picture.alt = "";
const said = element("p", "note-text", String(window.TRIGLOSA_NOTE || ""));
said.setAttribute("role", "status");
root.append(picture, said);

const fit = () => fitCardWindow(Math.ceil(root.getBoundingClientRect().height));
fit();
picture.addEventListener("load", fit);
