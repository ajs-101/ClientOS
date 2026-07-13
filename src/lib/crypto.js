import CryptoJS from "crypto-js";

const PASSPHRASE = import.meta.env.VITE_CRED_PASSPHRASE;

export function encryptField(plainText) {
  return CryptoJS.AES.encrypt(plainText, PASSPHRASE).toString();
}

export function decryptField(cipherText) {
  const bytes = CryptoJS.AES.decrypt(cipherText, PASSPHRASE);
  return bytes.toString(CryptoJS.enc.Utf8);
}