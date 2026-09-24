import { buildBackup, importBackup } from '../db/backup'
import type { BackupFile } from '../types'

const enc = new TextEncoder()
const dec = new TextDecoder()

const SALT_LEN = 16
const IV_LEN = 12

/** 由密码 + 盐派生 AES-GCM 256 密钥。 */
async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** 导出加密备份（AES-GCM + 密码）。 */
export async function exportEncrypted(password: string): Promise<void> {
  const data = await buildBackup(true)
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN))
  const key = await deriveKey(password, salt)
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(data)),
  )

  const payload = new Uint8Array(SALT_LEN + IV_LEN + cipher.byteLength)
  payload.set(salt, 0)
  payload.set(iv, SALT_LEN)
  payload.set(new Uint8Array(cipher), SALT_LEN + IV_LEN)

  const date = new Date().toISOString().slice(0, 10)
  downloadBlob(
    new Blob([payload], { type: 'application/octet-stream' }),
    `cfword-backup-${date}.enc`,
  )
}

/** 解密并导入加密备份。 */
export async function importEncrypted(password: string, file: File): Promise<void> {
  const buf = new Uint8Array(await file.arrayBuffer())
  if (buf.length < SALT_LEN + IV_LEN) throw new Error('加密备份文件损坏')

  const salt = buf.slice(0, SALT_LEN)
  const iv = buf.slice(SALT_LEN, SALT_LEN + IV_LEN)
  const cipher = buf.slice(SALT_LEN + IV_LEN)

  const key = await deriveKey(password, salt)
  let plain: ArrayBuffer
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
  } catch {
    throw new Error('解密失败：密码错误或文件损坏')
  }

  const data = JSON.parse(dec.decode(plain)) as BackupFile
  await importBackup(data)
}