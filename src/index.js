import React from "react";
// import ReactDOM from "react-dom";
import { createRoot } from 'react-dom/client';
import App from "./App"; 
import { installThaiErrorMessages } from "./utils/errorThai";
installThaiErrorMessages(); // error ทุกหน้าเป็นภาษาไทย + บอกสาเหตุ

const container = document.getElementById('root');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<App tab="home" />);