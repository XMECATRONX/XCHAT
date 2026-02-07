export const TOKENOMICS = {
  FUNDADORES: { percent: 8, amount: 80_000_000, label: 'Fundadores (Tú)', strategy: 'Vesting Soberano (1 año bloqueo + 24 meses goteo)' },
  PRIVATE_STRATEGIC: { percent: 15, amount: 150_000_000, label: 'Private & Strategic', strategy: 'Capital semilla y socios de alto nivel' },
  STAKING_REWARDS: { percent: 20, amount: 200_000_000, label: 'Staking / Rewards', strategy: 'Goteo elástico para holders leales' },
  USER_REWARDS: { percent: 5, amount: 50_000_000, label: 'User Rewards', strategy: 'Goteo elástico (Lluvias y Rueda de la Fortuna)' },
  MARKETING_PARTNERS: { percent: 10, amount: 100_000_000, label: 'Marketing & Partners', strategy: 'Inner Circle (goteo 10 años)' },
  LIQUIDEZ: { percent: 15, amount: 150_000_000, label: 'Liquidez (CEX+DEX)', strategy: 'Garantía de comercio y estabilidad de precio' },
  ECOSISTEMA: { percent: 20, amount: 200_000_000, label: 'Ecosistema Fund', strategy: 'I+D, Servidores y nuevas funciones de la app' },
  TREASURY_LEGAL: { percent: 7, amount: 70_000_000, label: 'Treasury/Legal/Risk', strategy: 'El Escudo Titanium para blindaje legal total' }
};

export const PROTOCOLO_X_PULSE = {
  HALVING_STYLE: 'BTC-ELASTIC',
  TOTAL_SUPPLY: 1_000_000_000,
  TICKER: 'XT'
};

type ElasticEmissionInput = {
  ledgerBalance: number;
  totalSupply?: number;
  baseEmission?: number;
  minEmission?: number;
};

export const calculateElasticEmission = ({
  ledgerBalance,
  totalSupply = PROTOCOLO_X_PULSE.TOTAL_SUPPLY,
  baseEmission = 50_000_000,
  minEmission = 1
}: ElasticEmissionInput) => {
  const safeSupply = totalSupply > 0 ? totalSupply : 1;
  const clampedBalance = Math.min(Math.max(ledgerBalance, 0), safeSupply);

  if (clampedBalance <= 0) return baseEmission;
  if (clampedBalance >= safeSupply) return minEmission;

  const remainingFraction = 1 - clampedBalance / safeSupply;
  const halvings = Math.max(0, Math.floor(Math.log2(1 / remainingFraction)));
  const emission = baseEmission / Math.pow(2, halvings);

  return Math.max(emission, minEmission);
};
