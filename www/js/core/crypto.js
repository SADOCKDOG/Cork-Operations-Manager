/**
 * crypto.js - Funciones para encriptar y desencriptar backups JSON con AES-GCM
 */

export const Crypto = {
    // Convierte un string a Uint8Array
    _strToAb(str) {
        return new TextEncoder().encode(str);
    },

    // Deriva una clave AES-GCM de 256 bits a partir de una contraseña y un salt
    async _deriveKey(password, salt) {
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            this._strToAb(password),
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );
        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    },

    // Convierte un ArrayBuffer a cadena Base64
    _abToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    },

    // Convierte Base64 a Uint8Array
    _base64ToAb(base64) {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    },

    async encrypt(textData, password) {
        try {
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const key = await this._deriveKey(password, salt);

            const encryptedContent = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                key,
                this._strToAb(textData)
            );

            // Juntamos todo en un solo array: [salt(16)] + [iv(12)] + [encryptedContent]
            const encryptedBytes = new Uint8Array(encryptedContent);
            const bundle = new Uint8Array(salt.length + iv.length + encryptedBytes.length);
            bundle.set(salt, 0);
            bundle.set(iv, salt.length);
            bundle.set(encryptedBytes, salt.length + iv.length);

            return this._abToBase64(bundle.buffer);
        } catch (e) {
            console.error("Error cifrando:", e);
            throw new Error("No se pudo cifrar el archivo de seguridad.");
        }
    },

    async decrypt(base64Data, password) {
        try {
            const bundle = this._base64ToAb(base64Data);
            const salt = bundle.slice(0, 16);
            const iv = bundle.slice(16, 28);
            const data = bundle.slice(28);

            const key = await this._deriveKey(password, salt);
            const decryptedContent = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                data
            );

            return new TextDecoder().decode(decryptedContent);
        } catch (e) {
            console.error("Error descifrando:", e);
            throw new Error("Contraseña incorrecta o archivo corrupto.");
        }
    }
};
