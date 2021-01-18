import * as React from "react";
import { useFilePickerResults } from "./gapi";
import "./App.css";

const { REACT_APP_GCP_CLIENT_ID: CLIENT_ID, REACT_APP_GCP_DRIVE_PICKER_API_KEY: API_KEY, REACT_APP_GCP_PROJECT_ID: APP_ID } = process.env;

export default function App() {
  const [results, openPicker] = useFilePickerResults();

  return (
    <div className="App">
      <h1>Google Drive File Picker</h1>
      <h2>
        Before You begin Edit the <code>.env</code> File
      </h2>
      <button onClick={openPicker}>
        <img
          alt="google drive"
          src="https://fonts.gstatic.com/s/i/productlogos/drive_2020q4/v8/web-64dp/logo_drive_2020q4_color_2x_web_64dp.png"
        />
      </button>
      <br />
      <br />
      <br />
      <h2>Enviroment Variables</h2>
      <code style={{ whiteSpace: 'break-spaces' }}>
        {JSON.stringify({ CLIENT_ID, API_KEY, APP_ID }, null, '\t')}
      </code>
      <div>
        {
          results.map(({ base64, mimeType }) => {
            if (mimeType === 'application/pdf') {
              return <object data={base64} type={mimeType} width="100%" />;
            } else {
              return <img src={base64} />;
            }
          })
        }
      </div>
    </div>
  )
};
