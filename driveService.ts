// services/driveService.ts

interface ServiceAccountCreds {
    client_email: string;
    private_key: string;
}

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink: string;
    thumbnailLink?: string;
    createdTime: string;
}

// Helper to convert string to ArrayBuffer
const str2ab = (str: string): ArrayBuffer => {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
};

// Helper to Base64url encode
const base64url = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
};


const createJwt = async (creds: ServiceAccountCreds): Promise<string> => {
    const header = {
        alg: 'RS256',
        typ: 'JWT',
    };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: creds.client_email,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600, // 1 hour expiration
        iat: now,
    };

    const encodedHeader = base64url(str2ab(JSON.stringify(header)));
    const encodedPayload = base64url(str2ab(JSON.stringify(payload)));

    const keyData = atob(creds.private_key.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\n/g, ''));
    const keyBuffer = str2ab(keyData);

    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        keyBuffer,
        {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256',
        },
        true,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        str2ab(`${encodedHeader}.${encodedPayload}`)
    );

    const encodedSignature = base64url(signature);

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
};


const getAccessToken = async (jwt: string): Promise<string> => {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to get access token: ${error.error_description}`);
    }

    const data = await response.json();
    return data.access_token;
};


export const listFilesFromDrive = async (
    creds: ServiceAccountCreds,
    folderId: string
): Promise<DriveFile[]> => {
    
    const jwt = await createJwt(creds);
    const accessToken = await getAccessToken(jwt);
    
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent('files(id, name, mimeType, webViewLink, thumbnailLink, createdTime)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=createdTime desc&pageSize=200`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: { message: 'Failed to list files from Drive.' }}));
        console.error("Drive file list error response:", errorBody);
        throw new Error(errorBody.error?.message || 'Failed to list files.');
    }

    const data = await response.json();
    return data.files || [];
};
