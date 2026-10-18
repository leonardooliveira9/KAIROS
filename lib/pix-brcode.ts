// Gera um "PIX Copia e Cola" estático (BR Code / EMV) com valor e identificador do pedido.
// Usado quando não há ABACATEPAY_API_KEY: o cliente paga direto na chave PIX da loja
// e o pedido é confirmado manualmente no painel.

function tlv(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`
}

function sanitize(value: string, max: number) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .slice(0, max)
}

function crc16(payload: string) {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

export function buildStaticPix(opts: {
  key: string
  amount: number
  merchantName: string
  merchantCity: string
  txid: string
}) {
  const payload =
    tlv("00", "01") +
    tlv("26", tlv("00", "br.gov.bcb.pix") + tlv("01", opts.key)) +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", opts.amount.toFixed(2)) +
    tlv("58", "BR") +
    tlv("59", sanitize(opts.merchantName, 25)) +
    tlv("60", sanitize(opts.merchantCity, 15)) +
    tlv("62", tlv("05", opts.txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***")) +
    "6304"
  return payload + crc16(payload)
}
