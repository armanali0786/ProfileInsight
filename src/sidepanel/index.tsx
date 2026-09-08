import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter as Router } from "react-router-dom";
import "../assets/css/tailwind.css";
import SidePanel from "./sidepanel";

function init() {
    const appContainer = document.querySelector("body");
    // document.body.appendChild(appContainer);
    document.body.classList.add('bodyMain');

    if (!appContainer) {
        throw new Error("Cannot find appContainer");
    }

    const root = createRoot(appContainer);
    root.render(<Router><SidePanel /></Router>);
}

init()