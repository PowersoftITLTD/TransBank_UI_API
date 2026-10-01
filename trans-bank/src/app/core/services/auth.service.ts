import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import * as CryptoJS from 'crypto-js';
// import { ApiService } from '../api.service';
// import { ToasterService } from '../toaster/toaster.service';
import { Store } from '@ngrx/store';
import { loginSuccess, logout } from '../../store/auth/auth.actions';
import { Router } from '@angular/router';
import { ConfigService } from './config.service';
import { BankDataService } from './bank-data.service';
import { ToasterService } from './toaster.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loggedIn = false;
  // private encryptionKey = 'MAKV2SPBNIBVGFRTGFDERTYUBVDG8765098VFDRT8765BVGFRT99212'; // must match component
  private configutation = inject(ConfigService);


  selectedFileName: string | null | any;
  encryptedFileName: string | null = null;
  fileType: string | null | any;
  // encryptedFile: any
  file: File | any
  private encryptedFile: any

  store = inject(Store);
  private router = inject(Router);
  private config = inject(ConfigService);

  private toaster = inject(ToasterService);

  constructor(private apiService: BankDataService) { }


  //login service
  login(combined: any, username: string, password: string): Observable<boolean> {

    const encryptedData = this.encryptAES_JSON(combined);

    const body = {
      // username: username,
      // password: password
      jsonEncrypt: encryptedData
    };

    return this.apiService.postSecureAPI('Login_PS', body, true).pipe(
      map((res: any) => {
        const loggedIn = res?.status === 'Ok' && res?.message === 'Token generated successfully.';

        const jwtToken = res?.data?.token;
        const userData = res?.data ? res?.data : null;


        if (loggedIn && userData?.token) {
          // Store the token in localStorage
          localStorage.setItem('token', jwtToken);

          const loginData = {
            token: jwtToken,
            ...userData,
          };
          this.store.dispatch(loginSuccess({ authData: loginData }));
        }

        // Return boolean in all cases    
        return loggedIn && userData !== null;
      })
    );
  }

  forgotEmail(email: string) {

    const encrypted_email = this.encryptAES_JSON(email);

    const body = { encryptjosn: encrypted_email };

    return this.apiService.postSecureAPI('ForgetPassword_NT', body, true).pipe(
      map((res: any) => {
        console.log('res Password Reset Successfully: ', res)
        const password_change_successfully = res?.status === 'Ok' && res?.message === 'Password Reset Successfully'

        return password_change_successfully
        // const jwtToken = res?.data?.token;
        // const userData = res?.data ? res?.data : null;
      })
    )

  }

  // logout servuce
  logout() {
    const wasLoggedIn = !!localStorage.getItem('token');
    localStorage.clear();
    sessionStorage.clear();
    localStorage.removeItem('appState');
    this.store.dispatch(logout());
    this.router.navigate(['/login']);
    if (wasLoggedIn) {
      this.toaster.show('success', 'Logged out', 'You have been logged out successfully.');
    }
  }



  // text encryption
  encryptAES(data: any): string {
    console.log('this.config: ', this.config)

    const keyBytes = this.getKeyBytes(this.config.encryptionKey, 32);
    const key = CryptoJS.enc.Utf8.parse(keyBytes);

    // Zero IV (16 bytes of zeros) - Must match C#'s new byte[16]
    const iv = CryptoJS.lib.WordArray.create(new Array(16).fill(0));

    // Encrypt with AES-CBC, PKCS7 padding
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Return Base64 string
    return encrypted.toString();
  }


  // Text decryption
  decryptAES(data: string): string {
    // Key bytes must be derived the same way as in the encryption function
    const keyBytes = this.getKeyBytes(this.config.encryptionKey, 32);
    const key = CryptoJS.enc.Utf8.parse(keyBytes);

    // Zero IV (16 bytes of zeros) - Must match C#'s new byte[16]
    const iv = CryptoJS.lib.WordArray.create(new Array(16).fill(0));

    // Decrypt the ciphertext (which is a Base64 string from encrypted.toString())
    const decrypted = CryptoJS.AES.decrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });


    // Convert the decrypted WordArray to a UTF-8 string
    return decrypted.toString(CryptoJS.enc.Utf8);
  }





  // Encrypt the entire file (including task structure) and return Base64 string
  encryptFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    // Read the file as a binary string (ArrayBuffer)
    const reader = new FileReader();
    reader.onload = () => {
      // The file is loaded, now perform the encryption
      const arrayBuffer = reader.result as ArrayBuffer;

      // Convert the ArrayBuffer to WordArray (from CryptoJS)
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);

      // Encrypt the entire file using AES encryption (including task structure)
      const encrypted = CryptoJS.AES.encrypt(wordArray, 'your-encryption-key').toString();

      // Return the encrypted data as Base64 string
      const encryptedBase64 = this.convertToBase64(encrypted);

      console.log('encryptedBase64L ', encryptedBase64)

      // Send encrypted file data to backend (optional)
      // return this.http.post(this.apiUrl, { encryptedData: encryptedBase64, fileName: file.name });
    };

    // Read the file as binary (ArrayBuffer)
    reader.readAsArrayBuffer(file);

    // Return an observable (for async file operations)
    return new Observable<any>();
  }

  // Convert encrypted data (ciphertext) to Base64
  private convertToBase64(encryptedData: string): string {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encryptedData));
  }



  //object encryption
  // encryptAES_JSON(data: any): string {
  //   // Convert the object to a string first
  //   const stringData = JSON.stringify(data);

  //   const keyBytes = this.getKeyBytes(this.config.encryptionKey, 32);
  //   const key = CryptoJS.enc.Utf8.parse(keyBytes);

  //   // Zero IV (16 bytes of zeros) - Must match C#'s new byte[16]
  //   const iv = CryptoJS.lib.WordArray.create(new Array(16).fill(0));

  //   // Encrypt with AES-CBC, PKCS7 padding
  //   const encrypted = CryptoJS.AES.encrypt(stringData, key, {
  //     iv: iv,
  //     mode: CryptoJS.mode.CBC,
  //     padding: CryptoJS.pad.Pkcs7
  //   });

  //   // Return Base64 string
  //   return encrypted.toString();
  // }


  // Object encryption using AES-CBC (with matching key and IV length as C# example)
  // Object encryption using AES-CBC (with matching key and IV length as C# example)
  // Encrypt an object to Base64


  async encryptObject(obj: any): Promise<string> {
    const key = await this.importKey(this.config.encryptionKey); // Import key using SHA-256
    const json = JSON.stringify(obj); // Convert object to JSON string
    const encoder = new TextEncoder(); // TextEncoder to convert string to bytes
    const plaintextBytes = encoder.encode(json);

    // Generate a random 16-byte IV for encryption
    const iv = window.crypto.getRandomValues(new Uint8Array(16)); // 16-byte random IV

    // Encrypt the data
    const encryptedBytes = await window.crypto.subtle.encrypt(
      {
        name: 'AES-CBC',
        iv: iv
      },
      key,
      plaintextBytes
    );

    // Concatenate the IV and encrypted data (Base64 encode the result)
    const encryptedArray = new Uint8Array(iv.byteLength + encryptedBytes.byteLength);
    encryptedArray.set(iv, 0);  // First, copy the IV
    encryptedArray.set(new Uint8Array(encryptedBytes), iv.byteLength);  // Then, copy the encrypted data

    // Convert the combined data to a Base64 string to send to the backend
    return this.arrayBufferToBase64(encryptedArray.buffer);
  }

  // Convert ArrayBuffer to Base64 string
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    let binaryString = '';

    // Loop over the uint8Array and convert it to a binary string
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }

    // Use btoa to convert the binary string to Base64
    return btoa(binaryString);
  }



  // Import and generate the key from the provided string using SHA-256 hashing
  private async importKey(keyString: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyString);

    const hashedKey = await window.crypto.subtle.digest('SHA-256', keyData);

    return window.crypto.subtle.importKey(
      'raw',
      hashedKey,
      { name: 'AES-CBC' },
      false,
      ['encrypt', 'decrypt']
    );
  }





  async decryptObject(encryptedData: string): Promise<any> {
    try {
      // Import the same key used for encryption
      const key = await this.importKey_decy(this.config.encryptionKey);

      // Convert Base64 string back to ArrayBuffer
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);

      // Extract the IV (first 16 bytes) and encrypted data
      const iv = encryptedBuffer.slice(0, 16);
      const encryptedBytes = encryptedBuffer.slice(16);

      // Decrypt the data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-CBC',
          iv: iv
        },
        key,
        encryptedBytes
      );

      // Convert the decrypted data back to string
      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedBuffer);

      // Parse the JSON string back to object
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }

  // Convert Base64 string to ArrayBuffer
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Key import method (should match your encryption method)
  private async importKey_decy(encryptionKey: string): Promise<CryptoKey> {
    // Convert the encryption key string to ArrayBuffer
    const encoder = new TextEncoder();
    const keyData = encoder.encode(encryptionKey);

    // Create SHA-256 hash of the key
    const hash = await window.crypto.subtle.digest('SHA-256', keyData);

    // Import the hashed key for AES-CBC
    return await window.crypto.subtle.importKey(
      'raw',
      hash,
      {
        name: 'AES-CBC',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );
  }




  // encryptAES_JSON<T>(data: T): string {
  //   const stringData = JSON.stringify(data);  // Convert the object to a string (JSON)

  //   // Base64 encode the JSON string to ensure consistent encoding across platforms
  //   const base64StringData = CryptoJS.enc.Utf8.parse(stringData); // Parse the string to UTF-8 bytes
  //   const encodedBase64String = CryptoJS.enc.Base64.stringify(base64StringData);

  //   // Derive a 32-byte key from the encryption key string (using SHA-256, to match the 32-byte key size)
  //   const keyBytes = this.getKeyBytes_JSON(this.config.encryptionKey, 32);  // Ensure key is 32 bytes
  //   const key = CryptoJS.enc.Utf8.parse(keyBytes);  // Convert the key to a CryptoJS format

  //   // IV (Initialization Vector) - 16 bytes of zeros, same as C# code
  //   const iv = CryptoJS.lib.WordArray.create(new Array(16).fill(0));

  //   // Encrypt with AES-CBC, PKCS7 padding (same as in your original code)
  //   const encrypted = CryptoJS.AES.encrypt(encodedBase64String, key, {
  //     iv: iv,
  //     mode: CryptoJS.mode.CBC,
  //     padding: CryptoJS.pad.Pkcs7,
  //   });

  //   // Return the encrypted result as a Base64 string
  //   return encrypted.toString();
  // }


  encryptAES_JSON(data: any): string {
    // Convert the object to a string first
    const stringData = JSON.stringify(data);

    const keyBytes = this.getKeyBytes(this.config.encryptionKey, 32);
    const key = CryptoJS.enc.Utf8.parse(keyBytes);

    // Zero IV (16 bytes of zeros) - Must match C#'s new byte[16]
    const iv = CryptoJS.lib.WordArray.create(new Array(16).fill(0));

    // Encrypt with AES-CBC, PKCS7 padding
    const encrypted = CryptoJS.AES.encrypt(stringData, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Return Base64 string
    return encrypted.toString();
  }

  // Helper function to derive a key of the specified length
  private getKeyBytes_JSON(keyString: string, length: number): string {
    // Generate a 32-byte key using SHA-256 hashing
    const keyHash = CryptoJS.SHA256(keyString).toString(CryptoJS.enc.Base64);

    // Return the required number of bytes from the hashed key (32 bytes in base64)
    return keyHash.substring(0, length);
  }




  private getKeyBytes(keyString: string, requiredSize: number): string {

    // This mimics the C# GetKey method logic
    // If key is longer than required, truncate it
    if (keyString.length > requiredSize) {
      return keyString.substring(0, requiredSize);
    }

    // If key is shorter than required, pad it (C# might pad differently)
    // For now, just return as is - C# GetKey should handle padding
    return keyString;
  }


  //File encryption

  fileEncryption(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject("No file selected");
        return;
      }

      this.selectedFileName = file.name;
      this.fileType = file.type || 'unknown';

      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;

        // Convert key properly
        const keyBytes = this.getKeyBytes_file(this.config.encryptionKey, 32);
        const key = CryptoJS.enc.Utf8.parse(keyBytes);

        // Create IV (must be 16 bytes for AES)
        const iv = CryptoJS.lib.WordArray.create(new Uint8Array(16)); // Zero IV

        // Convert ArrayBuffer to CryptoJS WordArray
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);

        // Encrypt with explicit parameters
        const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });

        // Get the ciphertext as Base64 string (IMPORTANT: This is what C# expects)
        const encryptedBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
        // console.log('Encrypted Base64:', encryptedBase64);

        // Resolve the promise with the encrypted Base64 string
        resolve(encryptedBase64);
      };

      reader.onerror = () => reject("File reading failed");
      reader.readAsArrayBuffer(file);
    });
  }

  // fileEncryption(event: any) {
  //   const file = event.target.files[0];
  //   if (!file) return;

  //   this.selectedFileName = file.name;
  //   this.fileType = file.type || 'unknown';

  //   const reader = new FileReader();
  //   reader.onload = () => {
  //     const arrayBuffer = reader.result as ArrayBuffer;

  //     // Convert key properly
  //     const keyBytes = this.getKeyBytes_file(this.config.encryptionKey, 32);
  //     const key = CryptoJS.enc.Utf8.parse(keyBytes);

  //     // Create IV (must be 16 bytes for AES)
  //     const iv = CryptoJS.lib.WordArray.create(new Uint8Array(16)); // Zero IV

  //     // Convert ArrayBuffer to CryptoJS WordArray
  //     const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);

  //     // Encrypt with explicit parameters
  //     const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
  //       iv: iv,
  //       mode: CryptoJS.mode.CBC,
  //       padding: CryptoJS.pad.Pkcs7
  //     });

  //     // Get the ciphertext as Base64 string (IMPORTANT: This is what C# expects)
  //     const encryptedBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

  //     console.log('Encrypted Base64:', encryptedBase64);
  //     this.encryptedFile = encryptedBase64;

  //     // Send to backend
  //     // this.sendToBackend(encryptedBase64);
  //   };

  //   reader.readAsArrayBuffer(file);
  // }


  getKeyBytes_file(key: string, length: number): string {
    // Pad or truncate key to desired length
    if (key.length < length) {
      return key.padEnd(length, '0'); // Pad with zeros
    } else if (key.length > length) {
      return key.substring(0, length); // Truncate
    }
    return key;
  }



  // File dcryption
  decryptFile(encryptedFile?: any, file_type?: any, file_name?: any) {
    console.log('file_name: ', file_name, 'fileType: ', file_type);

    if (!encryptedFile) {
      console.error('No file to decrypt');
      //   this.toaster.show('error', 'No file found', 'Please upload file for decrypt')

      return;
    }

    const iv = CryptoJS.lib.WordArray.create(new Array(16).fill(0));


    // Decrypt the file
    const decrypted = CryptoJS.AES.decrypt(encryptedFile, this.config.encryptionKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Convert WordArray back to ArrayBuffer
    const wordArray = decrypted as CryptoJS.lib.WordArray;
    const uint8Array = new Uint8Array(wordArray.sigBytes);

    for (let i = 0; i < wordArray.sigBytes; i++) {
      const byte = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      uint8Array[i] = byte;
    }

    console.log('Decrypted bytes:', uint8Array);

    // Optional: convert back to Blob or download
    const blob = new Blob([uint8Array], { type: file_type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.selectedFileName;
    a.click();
    URL.revokeObjectURL(url);

    // this.toaster.show('success', 'File download successfully', 'File get decrypted')
  }


}
