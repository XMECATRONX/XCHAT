import { createHash } from 'crypto'

const WATERMARK_MAGIC = 'XCHATWM1'

export interface WatermarkPayload {
  buyerId: number
  mediaItemId?: number
  issuedAt?: string
}

export interface WatermarkExtraction {
  found: boolean
  checksumValid: boolean
  payload: WatermarkPayload | null
  rawPayload?: string
}

function buildPayload(payload: WatermarkPayload): string {
  return JSON.stringify({
    buyerId: payload.buyerId,
    mediaItemId: payload.mediaItemId ?? null,
    issuedAt: payload.issuedAt ?? new Date().toISOString()
  })
}

function checksum(payload: string): string {
  return createHash('sha256').update(payload).digest('hex').slice(0, 16)
}

/**
 * Append a small metadata trailer to the media bytes.
 * Most media decoders ignore trailing bytes, keeping the watermark invisible.
 */
export function applyInvisibleWatermark(
  data: ArrayBuffer | Uint8Array,
  payload: WatermarkPayload
): Uint8Array {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer)
  const payloadString = buildPayload(payload)
  const marker = `\n${WATERMARK_MAGIC}:${checksum(payloadString)}:`
  const trailer = Buffer.from(`${marker}${payloadString}`, 'utf8')
  return Buffer.concat([buffer, trailer])
}

export function buildWatermarkPayload(
  buyerId: number,
  mediaItemId?: number
): WatermarkPayload {
  return { buyerId, mediaItemId }
}

export function extractInvisibleWatermark(buffer: Buffer): WatermarkPayload | null {
  const marker = `\n${WATERMARK_MAGIC}:`
  const content = buffer.toString('utf8')
  const markerIndex = content.lastIndexOf(marker)
  if (markerIndex === -1) return null

  const markerPayload = content.slice(markerIndex + marker.length)
  const checksumIndex = markerPayload.indexOf(':')
  if (checksumIndex === -1) return null

  const expectedChecksum = markerPayload.slice(0, checksumIndex)
  const payloadString = markerPayload.slice(checksumIndex + 1)
  if (!payloadString || checksum(payloadString) !== expectedChecksum) return null

  try {
    return JSON.parse(payloadString) as WatermarkPayload
  } catch (error) {
    return null
  }
}

export function extractWatermark(
  data: ArrayBuffer | Uint8Array
): WatermarkExtraction {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer)
  const marker = `\n${WATERMARK_MAGIC}:`
  const content = buffer.toString('utf8')
  const markerIndex = content.lastIndexOf(marker)
  if (markerIndex === -1) {
    return { found: false, checksumValid: false, payload: null }
  }

  const markerPayload = content.slice(markerIndex + marker.length)
  const checksumIndex = markerPayload.indexOf(':')
  if (checksumIndex === -1) {
    return { found: true, checksumValid: false, payload: null }
  }

  const expectedChecksum = markerPayload.slice(0, checksumIndex)
  const payloadString = markerPayload.slice(checksumIndex + 1)
  if (!payloadString) {
    return { found: true, checksumValid: false, payload: null }
  }

  let payload: WatermarkPayload | null = null
  try {
    payload = JSON.parse(payloadString) as WatermarkPayload
  } catch (error) {
    payload = null
  }

  const checksumValid = checksum(payloadString) === expectedChecksum
  return {
    found: true,
    checksumValid,
    payload,
    rawPayload: payloadString
  }
}
