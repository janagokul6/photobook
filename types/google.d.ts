declare global {
    interface Window {
        gapi?: {
            load: (api: string, callbackOrConfig: (() => void) | { callback: () => void }) => void;
            auth2?: {
                getAuthInstance: () => {
                    grantOfflineAccess: (options: { scope: string }) => Promise<{ code: string }>;
                };
            };
        };
        google?: {
            picker?: {
                PhotosView: any;
                PickerBuilder: any;
                Action: {
                    PICKED: string;
                    CANCEL: string;
                };
                DocsView?: {
                    ACTION: string;
                    DOCUMENTS: string;
                };
                ViewId?: {
                    PHOTOS: any;
                }
            };
        };
        googlepicker?: {
            PhotosView: any;
            PickerBuilder: any;
            Action: {
                PICKED: string;
                CANCEL: string;
            };
            createPicker: (builder: any, callback: (data: any) => void) => any;
        };
        onApiLoad?: () => void;
    }
}

export { };
