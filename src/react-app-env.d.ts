/// <reference types="react-scripts" />
declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: 'development' | 'production' | 'test'
        REACT_APP_GCP_DRIVE_PICKER_API_KEY: string
        REACT_APP_GCP_CLIENT_ID: string
        REACT_APP_GCP_PROJECT_ID: string
    }
}
interface Window {
    gapi: any
}