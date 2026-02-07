const TransactionType = {
  ADS: 'ADS',
  POSICIONAMIENTO: 'POSICIONAMIENTO',
  PAY_TO_UNLOCK: 'PAY_TO_UNLOCK',
  STORAGE_RENT: 'STORAGE_RENT',
  STORAGE_FEE: 'STORAGE_FEE',
  SUBSCRIPTION: 'SUBSCRIPTION',
  SWAP: 'SWAP'
} as const

type TransactionType = (typeof TransactionType)[keyof typeof TransactionType]

export { TransactionType }
export type { TransactionType }
