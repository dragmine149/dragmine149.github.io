import { modules } from "./modules";
modules.switch_module = async (module: string) => {
  switch (module) {
    case "blog": return await import('../Blog/blog');
    case "projects": return await import('../Projects/projects');
    default: return await import('./empty');
  }
}
modules.modules = {
  "markdown": {
    "js": [
      "Blog/marked/markedLocalTime.js",
      "Blog/marked/markedImprovedImage.js",
      "Blog/marked/markedCenterText.js",
      "Blog/marked/markedLocalLink.js",
      // highlight.js assets required for marked-highlight
      "Assets/highlight/highlight.min.js"
    ],
    "css": [
      "Assets/highlight/styles/tokyo-night-dark.min.css"
    ]
  }
};
