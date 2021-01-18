//@ts-nocheck

const { REACT_APP_GCP_CLIENT_ID: CLIENT_ID, REACT_APP_GCP_DRIVE_PICKER_API_KEY: API_KEY, REACT_APP_GCP_PROJECT_ID: APP_ID } = process.env;

// Scope to use to access user's Drive items.
const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly'
];

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

const MIME_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "application/pdf"
];

class Gapi {
    loading: boolean = false;
    ready: boolean = false;
    private accessToken?: string;
    constructor() {
        this.load();
    }
    private async load() {
        this.loading = true;
        await new Promise((resolve, reject) => {
            window.addEventListener('load', () => {
                const script = document.createElement('script');
                script.type = "text/javascript";
                script.async = true;
                script.src = `https://apis.google.com/js/api.js`;
                script.onload = async () => {
                    try {
                        await Promise.all([
                            new Promise((resolve, reject) => gapi.load('client:auth2', { callback: resolve, error: reject })),
                            gapi.load('picker', '1')
                        ]);
                        await gapi.client.load('drive', 'v3');
                        await gapi.client.init({
                            immediate: false,
                            ux_mode: 'redirect',
                            apiKey: API_KEY,
                            clientId: CLIENT_ID,
                            discoveryDocs: DISCOVERY_DOCS,
                            scope: SCOPES.join(' ')
                        });
                        resolve(true);
                    } catch (error) {
                        reject(error)
                    }
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        });
        this.loading = false;
        this.ready = true;
    }
    async signIn() {
        await new Promise((res) => {
            const initialSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
            if (initialSignedIn) {
                // the user is already signed in
                res(true);
            } else {
                // watch the event
                gapi.auth2.getAuthInstance().isSignedIn.listen((signedIn) => {
                    if (signedIn) {
                        res(true);
                    }
                });
                gapi.auth2.getAuthInstance().signIn();
            }
        });
        this.accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
    }
    signOut() {
        return gapi.auth2.getAuthInstance().signOut();
    }
    /**
     * @returns https://developers.google.com/picker/docs/results
     */
    openDriveFilePicker() {
        return new Promise<{ id: string, url: string, mimeType: string, base64: string }[]>(async (resolve, reject) => {
            if (!this.ready) reject("gapi not ready");
            if (!this.accessToken) {
                try {
                    await this.signIn();
                } catch (error) {
                    reject(error);
                }
            }
            const view = new google.picker.View(google.picker.ViewId.DOCS);//new google.picker.DocsView();
            view.setMimeTypes(MIME_TYPES.join(','));
            /*
            const view = new google.picker.DocsView();
            view.setEnableDrives(true);
            view.setIncludeFolders(true);
            */
            const picker = new google.picker.PickerBuilder()
                .enableFeature(google.picker.Feature.NAV_HIDDEN)
                .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
                .enableFeature(google.picker.Feature.SUPPORT_DRIVES)
                .setAppId(APP_ID)
                .setOAuthToken(this.accessToken)
                .setOrigin(window.location.protocol + '//' + window.location.host)
                .addView(view)
                //.addView(new google.picker.DocsUploadView())
                .setCallback(async (data: { action: string, docs: { id: string, url: string, mimeType: string }[] }) => {
                    if (data.action === google.picker.Action.PICKED) {
                        const files = await Promise.all(data.docs.map(async (file) => {
                            const base64 = await this.downloadFile(file.id, file.mimeType);
                            return { ...file, base64 };
                        }));
                        resolve(files);
                    }
                })
                .build();
            picker.setVisible(true);
        });
    }

    async downloadFile(fileId: string, mimeType: string) {
        const res = await gapi.client.drive.files.get({
            fileId,
            alt: 'media'
        });
        const base64 = 'data:' + mimeType + ';base64,' + Buffer.from(res.body, 'binary').toString('base64');
        return base64;
    }

}

const gapiClient = new Gapi();
export default gapiClient;

export async function openFilePickerAndDisplayResults() {
    const res = await gapiClient.openDriveFilePicker();
    res.forEach(({ base64, mimeType }) => {
        if (mimeType === 'application/pdf') {
            const img = document.createElement('object');
            img.data = base64;
            img.type = mimeType;
            img.width = '100%';
            img.height = '100%';
            document.body.appendChild(img);
        } else {
            const img = document.createElement('img');
            img.src = base64;
            document.body.appendChild(img);
        }
    })
}