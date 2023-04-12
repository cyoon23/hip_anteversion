import React, { useState } from "react";
import { ClearCanvasButton } from "./ClearCanvasButton";
// import Canvas from "./Canvas";
import Canvas from "./canvas.tsx";

function App() {
    return (
        <>
        {/* <Canvas /> */}
        <Canvas />
        <ClearCanvasButton />
        </>
    );
    }

export default App;
