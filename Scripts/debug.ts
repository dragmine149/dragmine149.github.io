import { page } from "./loader/page";
import { loader, RETURN_TYPE } from "./loader/loader";
import { DragStorage, MiliSeconds } from "./storage";
import { Markdown } from "../Modules/markdown";
import { VIEWING_STATE } from "../Modules/template";
import { modules } from "../Modules/modules";
import { Verbose } from "./verbose.mjs";
import { blog } from "../Blog/blog";
import { capitalise, settings } from "./Settings/settings";
import { customHistory } from "./loader/customHistory";
import * as url_functions from './loader/url_functions';
import { projects } from "../Projects/projects";

console.log("Setting up debug!");

globalThis.debug = {
  page,
  loader: {
    loader, RETURN_TYPE
  },
  storage: {
    DragStorage, MiliSeconds
  },
  Markdown,
  modules: {
    modules, VIEWING_STATE
  },
  Verbose,
  blog: {
    blog
  },
  settings: {
    settings, capitalise
  },
  customHistory,
  url_functions,
  projects,
}
