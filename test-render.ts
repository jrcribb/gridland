import { createCliRenderer, createRoot } from "./packages/bun/src/index.ts";
import React from "react";
function App() {
  return React.createElement("box", { border: true, padding: 1 },
    React.createElement("text", null, "Hello")
  );
}
const renderer = await createCliRenderer({ exitOnCtrlC: true });
createRoot(renderer).render(React.createElement(App));
setTimeout(() => { renderer.destroy(); process.exit(0); }, 2000);
