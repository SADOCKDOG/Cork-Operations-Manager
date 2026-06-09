import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const SYNC_FILE_NAME = 'cork_manager_v7_sync.json';

class DriveManager {
    private _accessToken: string | null = null;

    async init() {
        GoogleAuth.initialize({
            clientId: '186318731165-2vbt730ihgdejrgq19ut71gom7lucvc6.apps.googleusercontent.com',
            scopes: ['https://www.googleapis.com/auth/drive.appdata', 'email', 'profile'],
            grantOfflineAccess: true,
        });
    }

    async login() {
        const user = await GoogleAuth.signIn();
        this._accessToken = user.authentication.accessToken;
        return user;
    }

    async logout() {
        await GoogleAuth.signOut();
        this._accessToken = null;
    }

    private async _getHeaders() {
        if (!this._accessToken) {
            await this.login();
        }
        return {
            'Authorization': `Bearer ${this._accessToken}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Busca el archivo de sincronización en appDataFolder
     */
    async findSyncFile(): Promise<string | null> {
        const headers = await this._getHeaders();
        const response = await fetch(`${DRIVE_API_URL}/files?spaces=appDataFolder&q=name='${SYNC_FILE_NAME}'`, { headers });
        const data = await response.json();

        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }
        return null;
    }

    /**
     * Descarga el contenido del archivo
     */
    async downloadFile(fileId: string): Promise<any> {
        const headers = await this._getHeaders();
        const response = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, { headers });
        if (!response.ok) throw new Error('Error descargando archivo de Drive');
        return response.json();
    }

    /**
     * Sube o actualiza el archivo en Drive
     */
    async uploadFile(content: any): Promise<void> {
        const fileId = await this.findSyncFile();
        if (!this._accessToken) await this.login();

        const metadata = {
            name: SYNC_FILE_NAME,
            parents: ['appDataFolder']
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([JSON.stringify(content)], { type: 'application/json' }));

        let url = DRIVE_UPLOAD_URL + '?uploadType=multipart';
        let method = 'POST';

        if (fileId) {
            url = `${DRIVE_UPLOAD_URL}/${fileId}?uploadType=multipart`;
            method = 'PATCH';
        }

        const response = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${this._accessToken}` },
            body: form
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('[Drive] Error subiendo archivo:', error);
            throw new Error('Error subiendo archivo a Drive');
        }
    }
}

export const Drive = new DriveManager();
export default Drive;
