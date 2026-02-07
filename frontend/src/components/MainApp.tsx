'use client'
import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, Radio, PlayCircle, Wallet, MoreVertical, Heart, Share2, Lock, Settings, Phone, Video, Globe, Check, ChevronDown } from 'lucide-react'

const chatList = [
  { id: 1, name: 'Luna Stark', preview: 'Me encantó el pack de anoche! 😍', time: '12:45', unread: 2, avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: 'Marcos Neo', preview: '¿A qué hora empieza el LIVE?', time: '11:20', unread: 0, avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, name: 'Kira Pulse', preview: 'XT enviados, revisa tu wallet.', time: 'Ayer', unread: 1, avatar: 'https://i.pravatar.cc/150?u=3' }
]

const stories = [
  { id: 1, user: 'luna', avatar: 'https://i.pravatar.cc/150?u=1', video: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-1282-large.mp4', paid: true },
  { id: 2, user: 'marcos', avatar: 'https://i.pravatar.cc/150?u=2', video: 'https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-in-a-nightclub-with-neon-lights-41432-large.mp4', paid: false },
  { id: 3, user: 'nova', avatar: 'https://i.pravatar.cc/150?u=3', video: 'https://assets.mixkit.co/videos/preview/mixkit-girl-touching-her-face-in-neon-light-30949-large.mp4', paid: true }
]

const liveRooms = [
  { id: 1, creator: 'Nova Vex', price: 25, viewers: 1240, topic: 'Orbital DJ Set' },
  { id: 2, creator: 'Luna Stark', price: 60, viewers: 860, topic: 'Private Neon Stage' },
  { id: 3, creator: 'Kira Pulse', price: 15, viewers: 540, topic: 'Backstage Q&A' },
  { id: 4, creator: 'Ion Vega', price: 120, viewers: 2200, topic: 'Galaxy Vault Drop' }
]

const launchpadSplits = [
  { label: 'Fundadores (Tú)', percent: 8, strategy: 'Vesting Soberano (1 año bloqueo + 24 meses goteo)' },
  { label: 'Private & Strategic', percent: 15, strategy: 'Capital semilla y socios de alto nivel' },
  { label: 'Staking / Rewards', percent: 20, strategy: 'Goteo elástico para holders leales' },
  { label: 'User Rewards', percent: 5, strategy: 'Goteo elástico (Lluvias y Rueda de la Fortuna)' },
  { label: 'Marketing & Partners', percent: 10, strategy: 'Inner Circle (goteo 10 años)' },
  { label: 'Liquidez (CEX+DEX)', percent: 15, strategy: 'Garantía de comercio y estabilidad de precio' },
  { label: 'Ecosistema Fund', percent: 20, strategy: 'I+D, Servidores y nuevas funciones de la app' },
  { label: 'Treasury/Legal/Risk', percent: 7, strategy: 'El Escudo Titanium para blindaje legal total' }
]

type WatermarkScanResult = {
  found: boolean
  checksumValid: boolean
  payload: {
    buyerId: number
    mediaItemId?: number
    issuedAt?: string
  } | null
  rawPayload?: string
}

const X_TOUCH = {
  vibrate: (pattern: 'success' | 'error' | 'light' = 'light') => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return
    const duration = pattern === 'success' ? 40 : pattern === 'error' ? 80 : 20
    navigator.vibrate(duration)
  }
}

const X_TONE = {
  play: (tone: 'success' | 'error' | 'light' = 'light') => {
    if (typeof window === 'undefined') return
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    try {
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const frequency = tone === 'success' ? 880 : tone === 'error' ? 220 : 440
      osc.frequency.value = frequency
      gain.gain.value = 0.08
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.08)
      osc.onended = () => {
        ctx.close()
      }
    } catch (error) {}
  }
}

export default function MainApp() {
  const [activeTab, setActiveTab] = useState('chats')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isGhostMode, setIsGhostMode] = useState(false)
  const [ghostSearch, setGhostSearch] = useState('')
  const [balance, setBalance] = useState(0)
  const [ledgerEntries, setLedgerEntries] = useState<{ label: string; amount: number }[]>([])
  const [stakeHorizon, setStakeHorizon] = useState(180)
  const [stakeAmount, setStakeAmount] = useState('')
  const [swapAmount, setSwapAmount] = useState('')
  const [adsTier, setAdsTier] = useState<'starter' | 'pro' | 'elite'>('starter')
  const [lotteryPool, setLotteryPool] = useState(320)
  const [lotteryTickets, setLotteryTickets] = useState(0)
  const [fomoSeconds, setFomoSeconds] = useState(12 * 60)
  const [snapshotShieldEnabled, setSnapshotShieldEnabled] = useState(false)
  const [flashSaleSeconds, setFlashSaleSeconds] = useState(30 * 60)
  const [flashSaleActive, setFlashSaleActive] = useState(false)
  const [isProtected, setIsProtected] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isKycOpen, setIsKycOpen] = useState(false)
  const [language, setLanguage] = useState<'ES' | 'EN' | 'PT' | 'FR' | 'DE' | 'IT' | 'ZH' | 'RU' | 'JP' | 'AR'>('ES')
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const [isCreator, setIsCreator] = useState(true)
  const [isLiveOn, setIsLiveOn] = useState(false)
  const [activeLiveRoom, setActiveLiveRoom] = useState<number | null>(null)
  const [isCallOpen, setIsCallOpen] = useState(false)
  const [callType, setCallType] = useState<'call' | 'video'>('call')
  const [callContact, setCallContact] = useState<string | null>(null)
  const [callStatus, setCallStatus] = useState<'ringing' | 'active'>('ringing')
  const [callSeconds, setCallSeconds] = useState(0)
  const [billedMinutes, setBilledMinutes] = useState(0)
  const [watermarkStatus, setWatermarkStatus] = useState<string | null>(null)
  const [watermarkResult, setWatermarkResult] = useState<WatermarkScanResult | null>(null)
  const [watermarkFileName, setWatermarkFileName] = useState<string | null>(null)
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null)
  const [isWatermarkScanning, setIsWatermarkScanning] = useState(false)
  const ghostExitCode = 'XGHOST777'

  const translations = {
    ES: {
      aiCloserChatsUnread: 'AI Closer: responde a',
      aiCloserChatsNew: 'AI Closer: inicia un chat nuevo',
      aiCloserExplore: 'AI Closer: comparte un reel ahora',
      aiCloserLive: 'AI Closer: entra al LIVE destacado',
      aiCloserWallet: 'AI Closer: recarga para desbloquear packs',
      aiCloserAdmin: 'AI Closer: panel oculto activo',
      aiCloserDefault: 'AI Closer: optimiza tu proxima accion',
      admin: 'X-Admin',
      snapshotShield: 'Snapshot Shield',
      active: 'Activo',
      inactive: 'Inactivo',
      verifyToView: 'Verificar para ver +18',
      vaultUpdate: 'Actualizacion del vault: 3 cofres liberados en orbitas bajas.',
      liveControl: 'LIVE Control',
      modeUser: 'Modo Usuario',
      modeCreator: 'Modo Creador',
      creatorConsole: 'Creator Console',
      standby: 'Standby',
      prepareScene: 'Prepara la escena, activa la camara simulada y abre tu sala.',
      goLive: 'Go Live',
      flashSale: 'Flash Sale',
      endLive: 'End Live',
      enterLive: 'Entrar Live',
      exitLive: 'Salir Live',
      liveActions: 'Acciones Live',
      lotteryTerminal: 'Terminal de Loteria',
      weeklyJackpot: 'Jackpot Semanal',
      pool: 'Pool',
      tickets: 'Tickets',
      ticketCost: 'Costo ticket',
      buyTicket: 'Comprar Ticket',
      balanceAvailable: 'Balance Disponible',
      topUp: 'Recargar',
      withdraw: 'Retirar',
      launchpad: 'X-Launchpad',
      privateSale: 'Venta Privada XT',
      privateSaleDescription: 'Acceso anticipado al suministro genesis con curva dinamica, vesting 12 meses y proteccion anti-whale.',
      buyXt: 'Comprar XT',
      legalDocs: 'Legal Docs',
      stakingTerminal: 'Terminal de Staking',
      rewardEst: 'Reward Est.',
      stakeXt: 'Hacer Stake XT',
      swapTerminal: 'Terminal de Swap',
      swapNow: 'Swap Ahora',
      adsManager: 'Gestor de Anuncios',
      adsTierStarter: 'Starter',
      adsTierPro: 'Pro',
      adsTierElite: 'Elite',
      activateBoost: 'Activar Boost',
      ledgerEmpty: 'Sin movimientos',
      ledgerMovement: 'Movimiento',
      settings: 'Ajustes',
      ghostMode: 'Modo Fantasma',
      stealthCamouflage: 'Stealth Camouflage',
      language: 'Idioma',
      languageActive: 'Idioma activo',
      selectLanguage: 'Seleccionar idioma',
      close: 'Cerrar',
      godMode: 'God Mode',
      empireTelemetry: 'Telemetria del Imperio',
      platformBalance: 'Platform Balance',
      systemHealth: 'System Health',
      allSystemsGreen: 'All systems green',
      watermarkScanner: 'Watermark Scanner',
      uploadMedia: 'Upload Media File',
      uploadVerify: 'Upload & Verify',
      fileLabel: 'File',
      scanning: 'Scanning...',
      navChats: 'Chats',
      navExplore: 'Explorar',
      navLive: 'EN VIVO',
      navWallet: 'Wallet',
      fomoLiveNow: 'En vivo ahora',
      fomoTimer: 'FOMO Timer',
      stockMarketTerminal: 'Stock Market Terminal',
      liveFeed: 'Live Feed',
      search: 'Search',
      ticker: 'Ticker',
      marketTape: 'Market Tape',
      liveCam: 'Live Cam',
      viewers: 'Viewers',
      scene: 'Scene',
      nebulaVaultStream: 'Nebula Vault Stream',
      creatorTools: 'Creator Tools',
      liveRoom: 'Live Room',
      entry: 'Entrada',
      streaming: 'Streaming',
      nowLive: 'Now Live',
      gift: 'Gift',
      platformShare: 'Platform',
      creatorShare: 'Creator',
      ledgerTitle: 'Ledger Satoshi SHA-256',
      balanceLabel: 'Balance',
      apyLabel: 'APY',
      lockLabel: 'Lock',
      rateLabel: 'Rate',
      feeLabel: 'Fee',
      netLabel: 'Net',
      swapPair: 'USDT → XT',
      orbitalYield: 'Orbital Yield',
      creatorBoost: 'Creator Boost',
      infrastructureTotal: 'Infrastructure Total',
      adsRevenueTotal: 'Ads Revenue Total',
      withdrawalFees: 'Withdrawal Fees',
      systemLedger: 'Ledger',
      systemStreaming: 'Streaming',
      systemAds: 'Ads',
      systemWithdrawals: 'Withdrawals',
      systemKyc: 'KYC',
      systemWallet: 'Wallet',
      systemInfra: 'Infra',
      systemEdge: 'Edge',
      okStatus: 'OK',
      kycVerification: 'KYC Verification',
      verifyFor: 'Verify for',
      verifyNow: 'Verify Now',
      protectedTitle: 'XCHAT Protected',
      resume: 'Resume',
      videoCall: 'Video Call',
      call: 'Call',
      ringing: 'Ringing',
      incomingConnection: 'Conexion entrante',
      connect: 'Conectar',
      endCall: 'End Call',
      videoRate: '6 XT/min',
      callRate: '3 XT/min',
      selectFileToScan: 'Select a file to scan',
      scanFailed: 'Scan failed',
      noWatermarkDataReturned: 'No watermark data returned',
      noWatermarkDetected: 'No watermark detected',
      watermarkChecksumMismatch: 'Watermark found, checksum mismatch',
      watermarkVerified: 'Watermark verified',
      userId: 'User ID',
      mediaId: 'Media ID',
      issued: 'Issued',
      checksum: 'Checksum',
      notAvailable: 'N/A',
      ok: 'OK',
      bad: 'BAD'
    },
    EN: {
      aiCloserChatsUnread: 'AI Closer: reply to',
      aiCloserChatsNew: 'AI Closer: start a new chat',
      aiCloserExplore: 'AI Closer: share a reel now',
      aiCloserLive: 'AI Closer: join the featured LIVE',
      aiCloserWallet: 'AI Closer: top up to unlock packs',
      aiCloserAdmin: 'AI Closer: hidden panel active',
      aiCloserDefault: 'AI Closer: optimize your next move',
      admin: 'X-Admin',
      snapshotShield: 'Snapshot Shield',
      active: 'Active',
      inactive: 'Inactive',
      verifyToView: 'Verify to view 18+',
      vaultUpdate: 'Vault update: 3 crates unlocked in low orbit.',
      liveControl: 'LIVE Control',
      modeUser: 'User Mode',
      modeCreator: 'Creator Mode',
      creatorConsole: 'Creator Console',
      standby: 'Standby',
      prepareScene: 'Prepare the scene, turn on the simulated camera, and open your room.',
      goLive: 'Go Live',
      flashSale: 'Flash Sale',
      endLive: 'End Live',
      enterLive: 'Enter Live',
      exitLive: 'Exit Live',
      liveActions: 'Live Actions',
      lotteryTerminal: 'Terminale Lotteria',
      weeklyJackpot: 'Weekly Jackpot',
      pool: 'Pool',
      tickets: 'Tickets',
      ticketCost: 'Ticket cost',
      buyTicket: 'Buy Ticket',
      balanceAvailable: 'Available Balance',
      topUp: 'Top Up',
      withdraw: 'Withdraw',
      launchpad: 'X-Launchpad',
      privateSale: 'XT Private Sale',
      privateSaleDescription: 'Early access to the genesis supply with a dynamic curve, 12-month vesting, and anti-whale protection.',
      buyXt: 'Buy XT',
      legalDocs: 'Legal Docs',
      stakingTerminal: 'Terminal de Staking',
      rewardEst: 'Reward Est.',
      stakeXt: 'Fazer Stake XT',
      swapTerminal: 'Terminal de Swap',
      swapNow: 'Swap Agora',
      adsManager: 'Gestor de Anuncios',
      adsTierStarter: 'Starter',
      adsTierPro: 'Pro',
      adsTierElite: 'Elite',
      activateBoost: 'Activate Boost',
      ledgerEmpty: 'No transactions',
      ledgerMovement: 'Movement',
      settings: 'Settings',
      ghostMode: 'Ghost Mode',
      stealthCamouflage: 'Stealth Camouflage',
      language: 'Language',
      languageActive: 'Active language',
      selectLanguage: 'Select language',
      close: 'Close',
      godMode: 'God Mode',
      empireTelemetry: 'Empire Telemetry',
      platformBalance: 'Platform Balance',
      systemHealth: 'System Health',
      allSystemsGreen: 'All systems green',
      watermarkScanner: 'Watermark Scanner',
      uploadMedia: 'Upload Media File',
      uploadVerify: 'Upload & Verify',
      fileLabel: 'File',
      scanning: 'Scanning...',
      navChats: 'Chats',
      navExplore: 'Explore',
      navLive: 'LIVE',
      navWallet: 'Wallet',
      fomoLiveNow: 'Live now',
      fomoTimer: 'FOMO Timer',
      stockMarketTerminal: 'Stock Market Terminal',
      liveFeed: 'Live Feed',
      search: 'Search',
      ticker: 'Ticker',
      marketTape: 'Market Tape',
      liveCam: 'Live Cam',
      viewers: 'Viewers',
      scene: 'Scene',
      nebulaVaultStream: 'Nebula Vault Stream',
      creatorTools: 'Creator Tools',
      liveRoom: 'Live Room',
      entry: 'Entry',
      streaming: 'Streaming',
      nowLive: 'Now Live',
      gift: 'Gift',
      platformShare: 'Platform',
      creatorShare: 'Creator',
      ledgerTitle: 'Ledger Satoshi SHA-256',
      balanceLabel: 'Balance',
      apyLabel: 'APY',
      lockLabel: 'Lock',
      rateLabel: 'Rate',
      feeLabel: 'Fee',
      netLabel: 'Net',
      swapPair: 'USDT → XT',
      orbitalYield: 'Orbital Yield',
      creatorBoost: 'Creator Boost',
      infrastructureTotal: 'Infrastructure Total',
      adsRevenueTotal: 'Ads Revenue Total',
      withdrawalFees: 'Withdrawal Fees',
      systemLedger: 'Ledger',
      systemStreaming: 'Streaming',
      systemAds: 'Ads',
      systemWithdrawals: 'Withdrawals',
      systemKyc: 'KYC',
      systemWallet: 'Wallet',
      systemInfra: 'Infra',
      systemEdge: 'Edge',
      okStatus: 'OK',
      kycVerification: 'KYC Verification',
      verifyFor: 'Verify for',
      verifyNow: 'Verify Now',
      protectedTitle: 'XCHAT Protected',
      resume: 'Resume',
      videoCall: 'Video Call',
      call: 'Call',
      ringing: 'Ringing',
      incomingConnection: 'Incoming connection',
      connect: 'Connect',
      endCall: 'End Call',
      videoRate: '6 XT/min',
      callRate: '3 XT/min',
      selectFileToScan: 'Select a file to scan',
      scanFailed: 'Scan failed',
      noWatermarkDataReturned: 'No watermark data returned',
      noWatermarkDetected: 'No watermark detected',
      watermarkChecksumMismatch: 'Watermark found, checksum mismatch',
      watermarkVerified: 'Watermark verified',
      userId: 'User ID',
      mediaId: 'Media ID',
      issued: 'Issued',
      checksum: 'Checksum',
      notAvailable: 'N/A',
      ok: 'OK',
      bad: 'BAD'
    },
    PT: {
      aiCloserChatsUnread: 'AI Closer: responda a',
      aiCloserChatsNew: 'AI Closer: inicie um novo chat',
      aiCloserExplore: 'AI Closer: compartilhe um reel agora',
      aiCloserLive: 'AI Closer: entre no LIVE em destaque',
      aiCloserWallet: 'AI Closer: recarregue para desbloquear packs',
      aiCloserAdmin: 'AI Closer: painel oculto ativo',
      aiCloserDefault: 'AI Closer: otimize sua proxima acao',
      admin: 'X-Admin',
      snapshotShield: 'Snapshot Shield',
      active: 'Ativo',
      inactive: 'Inativo',
      verifyToView: 'Verificar para ver 18+',
      vaultUpdate: 'Atualizacao do vault: 3 cofres liberados em baixa orbita.',
      liveControl: 'LIVE Control',
      modeUser: 'Modo Usuario',
      modeCreator: 'Modo Criador',
      creatorConsole: 'Creator Console',
      standby: 'Standby',
      prepareScene: 'Prepare a cena, ligue a camera simulada e abra sua sala.',
      goLive: 'Go Live',
      flashSale: 'Flash Sale',
      endLive: 'End Live',
      enterLive: 'Entrar Live',
      exitLive: 'Sair Live',
      liveActions: 'Acoes Live',
      lotteryTerminal: 'Terminal Loteria',
      weeklyJackpot: 'Jackpot Semanal',
      pool: 'Pool',
      tickets: 'Tickets',
      ticketCost: 'Custo do ticket',
      buyTicket: 'Comprar Ticket',
      balanceAvailable: 'Saldo Disponivel',
      topUp: 'Recarregar',
      withdraw: 'Sacar',
      launchpad: 'X-Launchpad',
      privateSale: 'Venda Privada XT',
      privateSaleDescription: 'Acesso antecipado ao fornecimento genesis com curva dinamica, vesting de 12 meses e protecao anti-whale.',
      buyXt: 'Comprar XT',
      legalDocs: 'Legal Docs',
      stakingTerminal: 'Terminale Staking',
      rewardEst: 'Reward Est.',
      stakeXt: 'Metti in stake XT',
      swapTerminal: 'Terminale Swap',
      swapNow: 'Swap Ora',
      adsManager: 'Gestore Annunci',
      adsTierStarter: 'Starter',
      adsTierPro: 'Pro',
      adsTierElite: 'Elite',
      activateBoost: 'Ativar Boost',
      ledgerEmpty: 'Sem movimentos',
      ledgerMovement: 'Movimento',
      settings: 'Configuracoes',
      ghostMode: 'Modo Fantasma',
      stealthCamouflage: 'Stealth Camouflage',
      language: 'Idioma',
      languageActive: 'Idioma ativo',
      selectLanguage: 'Selecionar idioma',
      close: 'Fechar',
      godMode: 'God Mode',
      empireTelemetry: 'Telemetria do Imperio',
      platformBalance: 'Platform Balance',
      systemHealth: 'System Health',
      allSystemsGreen: 'All systems green',
      watermarkScanner: 'Watermark Scanner',
      uploadMedia: 'Upload Media File',
      uploadVerify: 'Upload & Verify',
      fileLabel: 'File',
      scanning: 'Scanning...',
      navChats: 'Chats',
      navExplore: 'Explorar',
      navLive: 'AO VIVO',
      navWallet: 'Wallet',
      fomoLiveNow: 'Ao vivo agora',
      fomoTimer: 'FOMO Timer',
      stockMarketTerminal: 'Stock Market Terminal',
      liveFeed: 'Live Feed',
      search: 'Search',
      ticker: 'Ticker',
      marketTape: 'Market Tape',
      liveCam: 'Live Cam',
      viewers: 'Viewers',
      scene: 'Scene',
      nebulaVaultStream: 'Nebula Vault Stream',
      creatorTools: 'Creator Tools',
      liveRoom: 'Live Room',
      entry: 'Entrada',
      streaming: 'Streaming',
      nowLive: 'Now Live',
      gift: 'Gift',
      platformShare: 'Platform',
      creatorShare: 'Creator',
      ledgerTitle: 'Ledger Satoshi SHA-256',
      balanceLabel: 'Saldo',
      apyLabel: 'APY',
      lockLabel: 'Lock',
      rateLabel: 'Rate',
      feeLabel: 'Fee',
      netLabel: 'Net',
      swapPair: 'USDT → XT',
      orbitalYield: 'Orbital Yield',
      creatorBoost: 'Creator Boost',
      infrastructureTotal: 'Infrastructure Total',
      adsRevenueTotal: 'Ads Revenue Total',
      withdrawalFees: 'Withdrawal Fees',
      systemLedger: 'Ledger',
      systemStreaming: 'Streaming',
      systemAds: 'Ads',
      systemWithdrawals: 'Withdrawals',
      systemKyc: 'KYC',
      systemWallet: 'Wallet',
      systemInfra: 'Infra',
      systemEdge: 'Edge',
      okStatus: 'OK',
      kycVerification: 'KYC Verification',
      verifyFor: 'Verify for',
      verifyNow: 'Verify Now',
      protectedTitle: 'XCHAT Protected',
      resume: 'Resume',
      videoCall: 'Video Call',
      call: 'Call',
      ringing: 'Ringing',
      incomingConnection: 'Conexao entrante',
      connect: 'Conectar',
      endCall: 'End Call',
      videoRate: '6 XT/min',
      callRate: '3 XT/min',
      selectFileToScan: 'Selecione um arquivo para escanear',
      scanFailed: 'Falha no scan',
      noWatermarkDataReturned: 'Nenhum dado de watermark retornado',
      noWatermarkDetected: 'Nenhuma watermark detectada',
      watermarkChecksumMismatch: 'Watermark encontrada, checksum diferente',
      watermarkVerified: 'Watermark verificada',
      userId: 'User ID',
      mediaId: 'Media ID',
      issued: 'Issued',
      checksum: 'Checksum',
      notAvailable: 'N/A',
      ok: 'OK',
      bad: 'BAD'
    },
    FR: {
      aiCloserChatsUnread: 'AI Closer: repondre a',
      aiCloserChatsNew: 'AI Closer: demarrer un nouveau chat',
      aiCloserExplore: 'AI Closer: partager un reel maintenant',
      aiCloserLive: 'AI Closer: rejoindre le LIVE en vedette',
      aiCloserWallet: 'AI Closer: recharger pour debloquer les packs',
      aiCloserAdmin: 'AI Closer: panneau cache actif',
      aiCloserDefault: 'AI Closer: optimiser votre prochaine action',
      admin: 'X-Admin',
      snapshotShield: 'Snapshot Shield',
      active: 'Actif',
      inactive: 'Inactif',
      verifyToView: 'Verifier pour voir 18+',
      vaultUpdate: 'Mise a jour du vault: 3 caisses debloquees en orbite basse.',
      liveControl: 'LIVE Control',
      modeUser: 'Mode Utilisateur',
      modeCreator: 'Mode Createur',
      creatorConsole: 'Creator Console',
      standby: 'Standby',
      prepareScene: 'Preparez la scene, activez la camera simulee et ouvrez votre salle.',
      goLive: 'Go Live',
      flashSale: 'Flash Sale',
      endLive: 'End Live',
      enterLive: 'Entrer Live',
      exitLive: 'Quitter Live',
      liveActions: 'Actions Live',
      lotteryTerminal: 'Terminal Loterie',
      weeklyJackpot: 'Jackpot Hebdo',
      pool: 'Pool',
      tickets: 'Tickets',
      ticketCost: 'Cout du ticket',
      buyTicket: 'Acheter Ticket',
      balanceAvailable: 'Solde Disponible',
      topUp: 'Recharger',
      withdraw: 'Retirer',
      launchpad: 'X-Launchpad',
      privateSale: 'Vente Privee XT',
      privateSaleDescription: 'Acces anticipe a l offre genesis avec courbe dynamique, vesting 12 mois et protection anti-baleine.',
      buyXt: 'Acheter XT',
      legalDocs: 'Legal Docs',
      stakingTerminal: 'Terminal de Staking',
      rewardEst: 'Reward Est.',
      stakeXt: 'Staker XT',
      swapTerminal: 'Terminal de Swap',
      swapNow: 'Swap Maintenant',
      adsManager: 'Gestion Ads',
      adsTierStarter: 'Starter',
      adsTierPro: 'Pro',
      adsTierElite: 'Elite',
      activateBoost: 'Activer Boost',
      ledgerEmpty: 'Aucun mouvement',
      ledgerMovement: 'Mouvement',
      settings: 'Parametres',
      ghostMode: 'Mode Fantome',
      stealthCamouflage: 'Stealth Camouflage',
      language: 'Langue',
      languageActive: 'Langue active',
      selectLanguage: 'Choisir la langue',
      close: 'Fermer',
      godMode: 'God Mode',
      empireTelemetry: 'Telemetrie de l Empire',
      platformBalance: 'Platform Balance',
      systemHealth: 'System Health',
      allSystemsGreen: 'All systems green',
      watermarkScanner: 'Watermark Scanner',
      uploadMedia: 'Upload Media File',
      uploadVerify: 'Upload & Verify',
      fileLabel: 'File',
      scanning: 'Scanning...',
      navChats: 'Chats',
      navExplore: 'Explorer',
      navLive: 'EN DIRECT',
      navWallet: 'Wallet',
      fomoLiveNow: 'En direct maintenant',
      fomoTimer: 'FOMO Timer',
      stockMarketTerminal: 'Stock Market Terminal',
      liveFeed: 'Live Feed',
      search: 'Search',
      ticker: 'Ticker',
      marketTape: 'Market Tape',
      liveCam: 'Live Cam',
      viewers: 'Viewers',
      scene: 'Scene',
      nebulaVaultStream: 'Nebula Vault Stream',
      creatorTools: 'Creator Tools',
      liveRoom: 'Live Room',
      entry: 'Entree',
      streaming: 'Streaming',
      nowLive: 'Now Live',
      gift: 'Gift',
      platformShare: 'Platform',
      creatorShare: 'Creator',
      ledgerTitle: 'Ledger Satoshi SHA-256',
      balanceLabel: 'Solde',
      apyLabel: 'APY',
      lockLabel: 'Lock',
      rateLabel: 'Rate',
      feeLabel: 'Fee',
      netLabel: 'Net',
      swapPair: 'USDT → XT',
      orbitalYield: 'Orbital Yield',
      creatorBoost: 'Creator Boost',
      infrastructureTotal: 'Infrastructure Total',
      adsRevenueTotal: 'Ads Revenue Total',
      withdrawalFees: 'Withdrawal Fees',
      systemLedger: 'Ledger',
      systemStreaming: 'Streaming',
      systemAds: 'Ads',
      systemWithdrawals: 'Withdrawals',
      systemKyc: 'KYC',
      systemWallet: 'Wallet',
      systemInfra: 'Infra',
      systemEdge: 'Edge',
      okStatus: 'OK',
      kycVerification: 'KYC Verification',
      verifyFor: 'Verify for',
      verifyNow: 'Verify Now',
      protectedTitle: 'XCHAT Protected',
      resume: 'Resume',
      videoCall: 'Video Call',
      call: 'Call',
      ringing: 'Ringing',
      incomingConnection: 'Connexion entrante',
      connect: 'Connecter',
      endCall: 'End Call',
      videoRate: '6 XT/min',
      callRate: '3 XT/min',
      selectFileToScan: 'Selectionnez un fichier a scanner',
      scanFailed: 'Scan echoue',
      noWatermarkDataReturned: 'Aucune donnee watermark renvoyee',
      noWatermarkDetected: 'Aucune watermark detectee',
      watermarkChecksumMismatch: 'Watermark trouvee, checksum different',
      watermarkVerified: 'Watermark verifiee',
      userId: 'User ID',
      mediaId: 'Media ID',
      issued: 'Issued',
      checksum: 'Checksum',
      notAvailable: 'N/A',
      ok: 'OK',
      bad: 'BAD'
    },
    DE: {
      aiCloserChatsUnread: 'AI Closer: antworte an',
      aiCloserChatsNew: 'AI Closer: neuen Chat starten',
      aiCloserExplore: 'AI Closer: reel jetzt teilen',
      aiCloserLive: 'AI Closer: dem LIVE-Highlight beitreten',
      aiCloserWallet: 'AI Closer: aufladen, um Packs zu entsperren',
      aiCloserAdmin: 'AI Closer: verstecktes Panel aktiv',
      aiCloserDefault: 'AI Closer: optimiere deinen naechsten Schritt',
      admin: 'X-Admin',
      snapshotShield: 'Snapshot Shield',
      active: 'Aktiv',
      inactive: 'Inaktiv',
      verifyToView: 'Verifizieren, um 18+ zu sehen',
      vaultUpdate: 'Vault-Update: 3 Kisten in niedriger Umlaufbahn freigeschaltet.',
      liveControl: 'LIVE Control',
      modeUser: 'Benutzermodus',
      modeCreator: 'Creator-Modus',
      creatorConsole: 'Creator Console',
      standby: 'Standby',
      prepareScene: 'Bereite die Szene vor, aktiviere die simulierte Kamera und oeffne deinen Raum.',
      goLive: 'Go Live',
      flashSale: 'Flash Sale',
      endLive: 'End Live',
      enterLive: 'Live betreten',
      exitLive: 'Live verlassen',
      liveActions: 'Live-Aktionen',
      lotteryTerminal: 'Lotterie-Terminal',
      weeklyJackpot: 'Wochenjackpot',
      pool: 'Pool',
      tickets: 'Tickets',
      ticketCost: 'Ticketpreis',
      buyTicket: 'Ticket kaufen',
      balanceAvailable: 'Verfuegbarer Saldo',
      topUp: 'Aufladen',
      withdraw: 'Abheben',
      launchpad: 'X-Launchpad',
      privateSale: 'XT Privatverkauf',
      privateSaleDescription: 'Frueher Zugang zum Genesis-Supply mit dynamischer Kurve, 12 Monate Vesting und Anti-Whale-Schutz.',
      buyXt: 'XT kaufen',
      legalDocs: 'Legal Docs',
      stakingTerminal: 'Staking-Terminal',
      rewardEst: 'Reward Est.',
      stakeXt: 'XT staken',
      swapTerminal: 'Swap-Terminal',
      swapNow: 'Jetzt tauschen',
      adsManager: 'Anzeigen-Manager',
      adsTierStarter: 'Starter',
      adsTierPro: 'Pro',
      adsTierElite: 'Elite',
      activateBoost: 'Boost aktivieren',
      ledgerEmpty: 'Keine Bewegungen',
      ledgerMovement: 'Bewegung',
      settings: 'Einstellungen',
      ghostMode: 'Geistermodus',
      stealthCamouflage: 'Stealth Camouflage',
      language: 'Sprache',
      languageActive: 'Aktive Sprache',
      selectLanguage: 'Sprache waehlen',
      close: 'Schliessen',
      godMode: 'God Mode',
      empireTelemetry: 'Imperiums-Telemetrie',
      platformBalance: 'Platform Balance',
      systemHealth: 'System Health',
      allSystemsGreen: 'All systems green',
      watermarkScanner: 'Watermark Scanner',
      uploadMedia: 'Upload Media File',
      uploadVerify: 'Upload & Verify',
      fileLabel: 'File',
      scanning: 'Scanning...',
      navChats: 'Chats',
      navExplore: 'Entdecken',
      navLive: 'LIVE',
      navWallet: 'Wallet',
      fomoLiveNow: 'Jetzt live',
      fomoTimer: 'FOMO Timer',
      stockMarketTerminal: 'Stock Market Terminal',
      liveFeed: 'Live Feed',
      search: 'Search',
      ticker: 'Ticker',
      marketTape: 'Market Tape',
      liveCam: 'Live Cam',
      viewers: 'Viewers',
      scene: 'Scene',
      nebulaVaultStream: 'Nebula Vault Stream',
      creatorTools: 'Creator Tools',
      liveRoom: 'Live Room',
      entry: 'Eintritt',
      streaming: 'Streaming',
      nowLive: 'Now Live',
      gift: 'Gift',
      platformShare: 'Platform',
      creatorShare: 'Creator',
      ledgerTitle: 'Ledger Satoshi SHA-256',
      balanceLabel: 'Saldo',
      apyLabel: 'APY',
      lockLabel: 'Lock',
      rateLabel: 'Rate',
      feeLabel: 'Fee',
      netLabel: 'Net',
      swapPair: 'USDT → XT',
      orbitalYield: 'Orbital Yield',
      creatorBoost: 'Creator Boost',
      infrastructureTotal: 'Infrastructure Total',
      adsRevenueTotal: 'Ads Revenue Total',
      withdrawalFees: 'Withdrawal Fees',
      systemLedger: 'Ledger',
      systemStreaming: 'Streaming',
      systemAds: 'Ads',
      systemWithdrawals: 'Withdrawals',
      systemKyc: 'KYC',
      systemWallet: 'Wallet',
      systemInfra: 'Infra',
      systemEdge: 'Edge',
      okStatus: 'OK',
      kycVerification: 'KYC Verification',
      verifyFor: 'Verify for',
      verifyNow: 'Verify Now',
      protectedTitle: 'XCHAT Protected',
      resume: 'Resume',
      videoCall: 'Video Call',
      call: 'Call',
      ringing: 'Ringing',
      incomingConnection: 'Eingehende Verbindung',
      connect: 'Verbinden',
      endCall: 'End Call',
      videoRate: '6 XT/min',
      callRate: '3 XT/min',
      selectFileToScan: 'Datei zum Scannen auswaehlen',
      scanFailed: 'Scan fehlgeschlagen',
      noWatermarkDataReturned: 'Keine Watermark-Daten erhalten',
      noWatermarkDetected: 'Keine Watermark erkannt',
      watermarkChecksumMismatch: 'Watermark gefunden, checksum ungueltig',
      watermarkVerified: 'Watermark verifiziert',
      userId: 'User ID',
      mediaId: 'Media ID',
      issued: 'Issued',
      checksum: 'Checksum',
      notAvailable: 'N/A',
      ok: 'OK',
      bad: 'BAD'
    },
    IT: {
      aiCloserChatsUnread: 'AI Closer: reply to',
      aiCloserChatsNew: 'AI Closer: start a new chat',
      aiCloserExplore: 'AI Closer: share a reel now',
      aiCloserLive: 'AI Closer: join the featured LIVE',
      aiCloserWallet: 'AI Closer: top up to unlock packs',
      aiCloserAdmin: 'AI Closer: hidden panel active',
      aiCloserDefault: 'AI Closer: optimize your next move',
      admin: 'X-Admin',
      snapshotShield: 'Snapshot Shield',
      active: 'Active',
      inactive: 'Inactive',
      verifyToView: 'Verify to view 18+',
      vaultUpdate: 'Vault update: 3 crates unlocked in low orbit.',
      liveControl: 'LIVE Control',
      modeUser: 'User Mode',
      modeCreator: 'Creator Mode',
      creatorConsole: 'Creator Console',
      standby: 'Standby',
      prepareScene: 'Prepare the scene, turn on the simulated camera, and open your room.',
      goLive: 'Go Live',
      flashSale: 'Flash Sale',
      endLive: 'End Live',
      enterLive: 'Enter Live',
      exitLive: 'Exit Live',
      liveActions: 'Live Actions',
      lotteryTerminal: 'Lottery Terminal',
      weeklyJackpot: 'Weekly Jackpot',
      pool: 'Pool',
      tickets: 'Tickets',
      ticketCost: 'Ticket cost',
      buyTicket: 'Buy Ticket',
      balanceAvailable: 'Available Balance',
      topUp: 'Top Up',
      withdraw: 'Withdraw',
      launchpad: 'X-Launchpad',
      privateSale: 'XT Private Sale',
      privateSaleDescription: 'Early access to the genesis supply with a dynamic curve, 12-month vesting, and anti-whale protection.',
      buyXt: 'Buy XT',
      legalDocs: 'Legal Docs',
      stakingTerminal: 'Терминал стейкинга',
      rewardEst: 'Reward Est.',
      stakeXt: 'Стейк XT',
      swapTerminal: 'Терминал свопа',
      swapNow: 'Сделать своп',
      adsManager: 'Менеджер рекламы',
      adsTierStarter: 'Starter',
      adsTierPro: 'Pro',
      adsTierElite: 'Elite',
      activateBoost: 'Activate Boost',
      ledgerEmpty: 'No transactions',
      ledgerMovement: 'Movement',
      settings: 'Impostazioni',
      ghostMode: 'Modalita Fantasma',
      stealthCamouflage: 'Stealth Camouflage',
      language: 'Lingua',
      languageActive: 'Lingua attiva',
      selectLanguage: 'Seleziona lingua',
      close: 'Chiudi',
      godMode: 'God Mode',
      empireTelemetry: 'Empire Telemetry',
      platformBalance: 'Platform Balance',
      systemHealth: 'System Health',
      allSystemsGreen: 'All systems green',
      watermarkScanner: 'Watermark Scanner',
      uploadMedia: 'Upload Media File',
      uploadVerify: 'Upload & Verify',
      fileLabel: 'File',
      scanning: 'Scanning...',
      navChats: 'Chat',
      navExplore: 'Esplora',
      navLive: 'LIVE',
      navWallet: 'Wallet',
      fomoLiveNow: 'Live now',
      fomoTimer: 'FOMO Timer',
      stockMarketTerminal: 'Stock Market Terminal',
      liveFeed: 'Live Feed',
      search: 'Search',
      ticker: 'Ticker',
      marketTape: 'Market Tape',
      liveCam: 'Live Cam',
      viewers: 'Viewers',
      scene: 'Scene',
      nebulaVaultStream: 'Nebula Vault Stream',
      creatorTools: 'Creator Tools',
      liveRoom: 'Live Room',
      entry: 'Entry',
      streaming: 'Streaming',
      nowLive: 'Now Live',
      gift: 'Gift',
      platformShare: 'Platform',
      creatorShare: 'Creator',
      ledgerTitle: 'Ledger Satoshi SHA-256',
      balanceLabel: 'Balance',
      apyLabel: 'APY',
      lockLabel: 'Lock',
      rateLabel: 'Rate',
      feeLabel: 'Fee',
      netLabel: 'Net',
      swapPair: 'USDT → XT',
      orbitalYield: 'Orbital Yield',
      creatorBoost: 'Creator Boost',
      infrastructureTotal: 'Infrastructure Total',
      adsRevenueTotal: 'Ads Revenue Total',
      withdrawalFees: 'Withdrawal Fees',
      systemLedger: 'Ledger',
      systemStreaming: 'Streaming',
      systemAds: 'Ads',
      systemWithdrawals: 'Withdrawals',
      systemKyc: 'KYC',
      systemWallet: 'Wallet',
      systemInfra: 'Infra',
      systemEdge: 'Edge',
      okStatus: 'OK',
      kycVerification: 'KYC Verification',
      verifyFor: 'Verify for',
      verifyNow: 'Verify Now',
      protectedTitle: 'XCHAT Protected',
      resume: 'Resume',
      videoCall: 'Video Call',
      call: 'Call',
      ringing: 'Ringing',
      incomingConnection: 'Incoming connection',
      connect: 'Connect',
      endCall: 'End Call',
      videoRate: '6 XT/min',
      callRate: '3 XT/min',
      selectFileToScan: 'Select a file to scan',
      scanFailed: 'Scan failed',
      noWatermarkDataReturned: 'No watermark data returned',
      noWatermarkDetected: 'No watermark detected',
      watermarkChecksumMismatch: 'Watermark found, checksum mismatch',
      watermarkVerified: 'Watermark verified',
      userId: 'User ID',
      mediaId: 'Media ID',
      issued: 'Issued',
      checksum: 'Checksum',
      notAvailable: 'N/A',
      ok: 'OK',
      bad: 'BAD'
    },
    RU: {
      aiCloserChatsUnread: 'AI Closer: ответь',
      aiCloserChatsNew: 'AI Closer: начни новый чат',
      aiCloserExplore: 'AI Closer: поделись рилсом сейчас',
      aiCloserLive: 'AI Closer: зайди в избранный LIVE',
      aiCloserWallet: 'AI Closer: пополни, чтобы разблокировать паки',
      aiCloserAdmin: 'AI Closer: скрытая панель активна',
      aiCloserDefault: 'AI Closer: оптимизируй следующий ход',
      admin: 'X-Admin',
      snapshotShield: 'Snapshot Shield',
      active: 'Активно',
      inactive: 'Неактивно',
      verifyToView: 'Подтвердить для просмотра 18+',
      vaultUpdate: 'Обновление vault: 3 ящика открыты на низкой орбите.',
      liveControl: 'LIVE Control',
      modeUser: 'Режим пользователя',
      modeCreator: 'Режим создателя',
      creatorConsole: 'Creator Console',
      standby: 'Standby',
      prepareScene: 'Подготовьте сцену, включите симуляцию камеры и откройте комнату.',
      goLive: 'Go Live',
      flashSale: 'Flash Sale',
      endLive: 'End Live',
      enterLive: 'Войти в Live',
      exitLive: 'Выйти из Live',
      liveActions: 'Действия Live',
      lotteryTerminal: 'Лотерейный терминал',
      weeklyJackpot: 'Еженедельный джекпот',
      pool: 'Пул',
      tickets: 'Билеты',
      ticketCost: 'Цена билета',
      buyTicket: 'Купить билет',
      balanceAvailable: 'Доступный баланс',
      topUp: 'Пополнить',
      withdraw: 'Вывести',
      launchpad: 'X-Launchpad',
      privateSale: 'Приватная продажа XT',
      privateSaleDescription: 'Ранний доступ к genesis supply с динамической кривой, 12-месячным вестингом и анти-кит защитой.',
      buyXt: 'Купить XT',
      legalDocs: 'Legal Docs',
      stakingTerminal: '质押终端',
      rewardEst: 'Reward Est.',
      stakeXt: '质押 XT',
      swapTerminal: '兑换终端',
      swapNow: '立即兑换',
      adsManager: '广告管理',
      adsTierStarter: 'Starter',
      adsTierPro: 'Pro',
      adsTierElite: 'Elite',
      activateBoost: 'Активировать Boost',
      ledgerEmpty: 'Нет движений',
      ledgerMovement: 'Движение',
      settings: 'Настройки',
      ghostMode: 'Режим призрака',
      stealthCamouflage: 'Stealth Camouflage',
      language: 'Язык',
      languageActive: 'Активный язык',
      selectLanguage: 'Выбрать язык',
      close: 'Закрыть',
      godMode: 'God Mode',
      empireTelemetry: 'Телеметрия Империи',
      platformBalance: 'Platform Balance',
      systemHealth: 'System Health',
      allSystemsGreen: 'All systems green',
      watermarkScanner: 'Watermark Scanner',
      uploadMedia: 'Upload Media File',
      uploadVerify: 'Upload & Verify',
      fileLabel: 'File',
      scanning: 'Scanning...',
      navChats: 'Чаты',
      navExplore: 'Обзор',
      navLive: 'LIVE',
      navWallet: 'Wallet',
      fomoLiveNow: 'Сейчас в эфире',
      fomoTimer: 'FOMO Timer',
      stockMarketTerminal: 'Stock Market Terminal',
      liveFeed: 'Live Feed',
      search: 'Search',
      ticker: 'Ticker',
      marketTape: 'Market Tape',
      liveCam: 'Live Cam',
      viewers: 'Viewers',
      scene: 'Scene',
      nebulaVaultStream: 'Nebula Vault Stream',
      creatorTools: 'Creator Tools',
      liveRoom: 'Live Room',
      entry: 'Вход',
      streaming: 'Streaming',
      nowLive: 'Now Live',
      gift: 'Gift',
      platformShare: 'Platform',
      creatorShare: 'Creator',
      ledgerTitle: 'Ledger Satoshi SHA-256',
      balanceLabel: 'Баланс',
      apyLabel: 'APY',
      lockLabel: 'Lock',
      rateLabel: 'Rate',
      feeLabel: 'Fee',
      netLabel: 'Net',
      swapPair: 'USDT → XT',
      orbitalYield: 'Orbital Yield',
      creatorBoost: 'Creator Boost',
      infrastructureTotal: 'Infrastructure Total',
      adsRevenueTotal: 'Ads Revenue Total',
      withdrawalFees: 'Withdrawal Fees',
      systemLedger: 'Ledger',
      systemStreaming: 'Streaming',
      systemAds: 'Ads',
      systemWithdrawals: 'Withdrawals',
      systemKyc: 'KYC',
      systemWallet: 'Wallet',
      systemInfra: 'Infra',
      systemEdge: 'Edge',
      okStatus: 'OK',
      kycVerification: 'KYC Verification',
      verifyFor: 'Verify for',
      verifyNow: 'Verify Now',
      protectedTitle: 'XCHAT Protected',
      resume: 'Resume',
      videoCall: 'Video Call',
      call: 'Call',
      ringing: 'Ringing',
      incomingConnection: 'Входящее соединение',
      connect: 'Подключить',
      endCall: 'End Call',
      videoRate: '6 XT/min',
      callRate: '3 XT/min',
      selectFileToScan: 'Выберите файл для сканирования',
      scanFailed: 'Сканирование не удалось',
      noWatermarkDataReturned: 'Нет данных watermark',
      noWatermarkDetected: 'Watermark не обнаружена',
      watermarkChecksumMismatch: 'Watermark найдена, checksum не совпал',
      watermarkVerified: 'Watermark подтверждена',
      userId: 'User ID',
      mediaId: 'Media ID',
      issued: 'Issued',
      checksum: 'Checksum',
      notAvailable: 'N/A',
      ok: 'OK',
      bad: 'BAD'
    },
    ZH: {
      aiCloserChatsUnread: 'AI Closer: 回复',
      aiCloserChatsNew: 'AI Closer: 开启新聊天',
      aiCloserExplore: 'AI Closer: 现在分享短片',
      aiCloserLive: 'AI Closer: 加入精选 LIVE',
      aiCloserWallet: 'AI Closer: 充值解锁内容包',
      aiCloserAdmin: 'AI Closer: 隐藏面板已启用',
      aiCloserDefault: 'AI Closer: 优化下一步',
      admin: 'X-Admin',
      snapshotShield: 'Snapshot Shield',
      active: '启用',
      inactive: '停用',
      verifyToView: '验证后查看 18+',
      vaultUpdate: 'Vault 更新：3 个箱体在低轨解锁。',
      liveControl: 'LIVE Control',
      modeUser: '用户模式',
      modeCreator: '创作者模式',
      creatorConsole: 'Creator Console',
      standby: 'Standby',
      prepareScene: '准备场景，开启模拟摄像头并打开房间。',
      goLive: 'Go Live',
      flashSale: 'Flash Sale',
      endLive: 'End Live',
      enterLive: '进入 Live',
      exitLive: '退出 Live',
      liveActions: 'Live 操作',
      lotteryTerminal: '抽奖终端',
      weeklyJackpot: '每周大奖',
      pool: 'Pool',
      tickets: 'Tickets',
      ticketCost: '门票成本',
      buyTicket: '购买门票',
      balanceAvailable: '可用余额',
      topUp: '充值',
      withdraw: '提现',
      launchpad: 'X-Launchpad',
      privateSale: 'XT 私募',
      privateSaleDescription: '提前进入创世供应，动态曲线，12 个月归属，反巨鲸保护。',
      buyXt: '购买 XT',
      legalDocs: 'Legal Docs',
      stakingTerminal: 'محطة الستاكينغ',
      rewardEst: 'Reward Est.',
      stakeXt: 'ستاك XT',
      swapTerminal: 'محطة السواب',
      swapNow: 'سواب الآن',
      adsManager: 'مدير الاعلانات',
      adsTierStarter: 'Starter',
      adsTierPro: 'Pro',
      adsTierElite: 'Elite',
      activateBoost: '启动 Boost',
      ledgerEmpty: '无记录',
      ledgerMovement: '记录',
      settings: '设置',
      ghostMode: '幽灵模式',
      stealthCamouflage: 'Stealth Camouflage',
      language: '语言',
      languageActive: '当前语言',
      selectLanguage: '选择语言',
      close: '关闭',
      godMode: 'God Mode',
      empireTelemetry: '帝国遥测',
      platformBalance: 'Platform Balance',
      systemHealth: 'System Health',
      allSystemsGreen: 'All systems green',
      watermarkScanner: 'Watermark Scanner',
      uploadMedia: 'Upload Media File',
      uploadVerify: 'Upload & Verify',
      fileLabel: 'File',
      scanning: 'Scanning...',
      navChats: '聊天',
      navExplore: '探索',
      navLive: '直播',
      navWallet: '钱包',
      fomoLiveNow: '正在直播',
      fomoTimer: 'FOMO 计时',
      stockMarketTerminal: 'Stock Market Terminal',
      liveFeed: 'Live Feed',
      search: 'Search',
      ticker: 'Ticker',
      marketTape: 'Market Tape',
      liveCam: 'Live Cam',
      viewers: 'Viewers',
      scene: 'Scene',
      nebulaVaultStream: 'Nebula Vault Stream',
      creatorTools: 'Creator Tools',
      liveRoom: 'Live Room',
      entry: '入场',
      streaming: 'Streaming',
      nowLive: 'Now Live',
      gift: 'Gift',
      platformShare: 'Platform',
      creatorShare: 'Creator',
      ledgerTitle: 'Ledger Satoshi SHA-256',
      balanceLabel: '余额',
      apyLabel: 'APY',
      lockLabel: 'Lock',
      rateLabel: 'Rate',
      feeLabel: 'Fee',
      netLabel: 'Net',
      swapPair: 'USDT → XT',
      orbitalYield: 'Orbital Yield',
      creatorBoost: 'Creator Boost',
      infrastructureTotal: 'Infrastructure Total',
      adsRevenueTotal: 'Ads Revenue Total',
      withdrawalFees: 'Withdrawal Fees',
      systemLedger: 'Ledger',
      systemStreaming: 'Streaming',
      systemAds: 'Ads',
      systemWithdrawals: 'Withdrawals',
      systemKyc: 'KYC',
      systemWallet: 'Wallet',
      systemInfra: 'Infra',
      systemEdge: 'Edge',
      okStatus: 'OK',
      kycVerification: 'KYC Verification',
      verifyFor: 'Verify for',
      verifyNow: 'Verify Now',
      protectedTitle: 'XCHAT Protected',
      resume: 'Resume',
      videoCall: 'Video Call',
      call: 'Call',
      ringing: 'Ringing',
      incomingConnection: '来电连接',
      connect: '接通',
      endCall: 'End Call',
      videoRate: '6 XT/分钟',
      callRate: '3 XT/分钟',
      selectFileToScan: '请选择要扫描的文件',
      scanFailed: '扫描失败',
      noWatermarkDataReturned: '未返回水印数据',
      noWatermarkDetected: '未检测到水印',
      watermarkChecksumMismatch: '检测到水印，校验失败',
      watermarkVerified: '水印已验证',
      userId: '用户 ID',
      mediaId: '媒体 ID',
      issued: '发行',
      checksum: '校验',
      notAvailable: 'N/A',
      ok: 'OK',
      bad: 'BAD'
    },
    JP: {
      aiCloserChatsUnread: 'AI Closer: 返信',
      aiCloserChatsNew: 'AI Closer: 新しいチャットを開始',
      aiCloserExplore: 'AI Closer: 今すぐリールを共有',
      aiCloserLive: 'AI Closer: 注目LIVEに参加',
      aiCloserWallet: 'AI Closer: チャージしてパックを解除',
      aiCloserAdmin: 'AI Closer: 隠しパネル有効',
      aiCloserDefault: 'AI Closer: 次の一手を最適化',
      admin: 'X-Admin',
      snapshotShield: 'Snapshot Shield',
      active: '有効',
      inactive: '無効',
      verifyToView: '確認して18+を表示',
      vaultUpdate: 'Vault更新: 低軌道で3つのクレートが解放。',
      liveControl: 'LIVE Control',
      modeUser: 'ユーザーモード',
      modeCreator: 'クリエイターモード',
      creatorConsole: 'Creator Console',
      standby: 'Standby',
      prepareScene: 'シーンを準備し、擬似カメラを起動してルームを開いてください。',
      goLive: 'Go Live',
      flashSale: 'Flash Sale',
      endLive: 'End Live',
      enterLive: 'Liveに入る',
      exitLive: 'Liveを退出',
      liveActions: 'Liveアクション',
      lotteryTerminal: '抽選ターミナル',
      weeklyJackpot: '週間ジャックポット',
      pool: 'Pool',
      tickets: 'Tickets',
      ticketCost: 'チケット費用',
      buyTicket: 'チケット購入',
      balanceAvailable: '利用可能残高',
      topUp: 'チャージ',
      withdraw: '出金',
      launchpad: 'X-Launchpad',
      privateSale: 'XT プライベートセール',
      privateSaleDescription: 'ジェネシス供給への先行アクセス、動的カーブ、12か月ベスティング、アンチホエール保護。',
      buyXt: 'XTを購入',
      legalDocs: 'Legal Docs',
      stakingTerminal: 'ステーキング端末',
      rewardEst: 'Reward Est.',
      stakeXt: 'XTをステーク',
      swapTerminal: 'スワップ端末',
      swapNow: '今すぐスワップ',
      adsManager: '広告マネージャー',
      adsTierStarter: 'Starter',
      adsTierPro: 'Pro',
      adsTierElite: 'Elite',
      activateBoost: 'Boostを有効化',
      ledgerEmpty: '履歴なし',
      ledgerMovement: '履歴',
      settings: '設定',
      ghostMode: 'ゴーストモード',
      stealthCamouflage: 'Stealth Camouflage',
      language: '言語',
      languageActive: '現在の言語',
      selectLanguage: '言語を選択',
      close: '閉じる',
      godMode: 'God Mode',
      empireTelemetry: '帝国テレメトリ',
      platformBalance: 'Platform Balance',
      systemHealth: 'System Health',
      allSystemsGreen: 'All systems green',
      watermarkScanner: 'Watermark Scanner',
      uploadMedia: 'Upload Media File',
      uploadVerify: 'Upload & Verify',
      fileLabel: 'File',
      scanning: 'Scanning...',
      navChats: 'チャット',
      navExplore: '探索',
      navLive: 'ライブ',
      navWallet: 'Wallet',
      fomoLiveNow: 'ライブ中',
      fomoTimer: 'FOMO タイマー',
      stockMarketTerminal: 'Stock Market Terminal',
      liveFeed: 'Live Feed',
      search: 'Search',
      ticker: 'Ticker',
      marketTape: 'Market Tape',
      liveCam: 'Live Cam',
      viewers: 'Viewers',
      scene: 'Scene',
      nebulaVaultStream: 'Nebula Vault Stream',
      creatorTools: 'Creator Tools',
      liveRoom: 'Live Room',
      entry: '入場',
      streaming: 'Streaming',
      nowLive: 'Now Live',
      gift: 'Gift',
      platformShare: 'Platform',
      creatorShare: 'Creator',
      ledgerTitle: 'Ledger Satoshi SHA-256',
      balanceLabel: '残高',
      apyLabel: 'APY',
      lockLabel: 'Lock',
      rateLabel: 'Rate',
      feeLabel: 'Fee',
      netLabel: 'Net',
      swapPair: 'USDT → XT',
      orbitalYield: 'Orbital Yield',
      creatorBoost: 'Creator Boost',
      infrastructureTotal: 'Infrastructure Total',
      adsRevenueTotal: 'Ads Revenue Total',
      withdrawalFees: 'Withdrawal Fees',
      systemLedger: 'Ledger',
      systemStreaming: 'Streaming',
      systemAds: 'Ads',
      systemWithdrawals: 'Withdrawals',
      systemKyc: 'KYC',
      systemWallet: 'Wallet',
      systemInfra: 'Infra',
      systemEdge: 'Edge',
      okStatus: 'OK',
      kycVerification: 'KYC Verification',
      verifyFor: 'Verify for',
      verifyNow: 'Verify Now',
      protectedTitle: 'XCHAT Protected',
      resume: 'Resume',
      videoCall: 'Video Call',
      call: 'Call',
      ringing: 'Ringing',
      incomingConnection: '着信接続',
      connect: '接続',
      endCall: 'End Call',
      videoRate: '6 XT/分',
      callRate: '3 XT/分',
      selectFileToScan: 'スキャンするファイルを選択',
      scanFailed: 'スキャン失敗',
      noWatermarkDataReturned: 'ウォーターマークデータがありません',
      noWatermarkDetected: 'ウォーターマーク未検出',
      watermarkChecksumMismatch: 'ウォーターマーク検出、チェックサム不一致',
      watermarkVerified: 'ウォーターマーク確認済み',
      userId: 'ユーザー ID',
      mediaId: 'メディア ID',
      issued: '発行',
      checksum: 'チェックサム',
      notAvailable: 'N/A',
      ok: 'OK',
      bad: 'BAD'
    },
    AR: {
      aiCloserChatsUnread: 'AI Closer: رد على',
      aiCloserChatsNew: 'AI Closer: ابدأ محادثة جديدة',
      aiCloserExplore: 'AI Closer: شارك ريل الآن',
      aiCloserLive: 'AI Closer: ادخل LIVE المميز',
      aiCloserWallet: 'AI Closer: اشحن لفتح الحزم',
      aiCloserAdmin: 'AI Closer: اللوحة المخفية مفعلة',
      aiCloserDefault: 'AI Closer: حسن خطوتك القادمة',
      admin: 'X-Admin',
      snapshotShield: 'Snapshot Shield',
      active: 'نشط',
      inactive: 'غير نشط',
      verifyToView: 'تحقق لعرض 18+',
      vaultUpdate: 'تحديث الـ vault: فتح 3 صناديق في المدار المنخفض.',
      liveControl: 'LIVE Control',
      modeUser: 'وضع المستخدم',
      modeCreator: 'وضع المنشئ',
      creatorConsole: 'Creator Console',
      standby: 'Standby',
      prepareScene: 'جهز المشهد، فعل الكاميرا المحاكية وافتح غرفتك.',
      goLive: 'Go Live',
      flashSale: 'Flash Sale',
      endLive: 'End Live',
      enterLive: 'ادخل Live',
      exitLive: 'اخرج Live',
      liveActions: 'احداث Live',
      lotteryTerminal: 'محطة اليانصيب',
      weeklyJackpot: 'الجائزة الاسبوعية',
      pool: 'Pool',
      tickets: 'Tickets',
      ticketCost: 'تكلفة التذكرة',
      buyTicket: 'شراء تذكرة',
      balanceAvailable: 'الرصيد المتاح',
      topUp: 'اشحن',
      withdraw: 'سحب',
      launchpad: 'X-Launchpad',
      privateSale: 'بيع خاص XT',
      privateSaleDescription: 'وصول مبكر لمخزون genesis مع منحنى ديناميكي، استحقاق 12 شهرا وحماية ضد الحيتان.',
      buyXt: 'شراء XT',
      legalDocs: 'Legal Docs',
      stakingTerminal: 'Staking Terminal',
      rewardEst: 'Reward Est.',
      stakeXt: 'Stake XT',
      swapTerminal: 'Swap Terminal',
      swapNow: 'Swap Now',
      adsManager: 'Ads Manager',
      adsTierStarter: 'Starter',
      adsTierPro: 'Pro',
      adsTierElite: 'Elite',
      activateBoost: 'تفعيل Boost',
      ledgerEmpty: 'لا توجد حركات',
      ledgerMovement: 'حركة',
      settings: 'الاعدادات',
      ghostMode: 'وضع الشبح',
      stealthCamouflage: 'Stealth Camouflage',
      language: 'اللغة',
      languageActive: 'اللغة النشطة',
      selectLanguage: 'اختر اللغة',
      close: 'اغلاق',
      godMode: 'God Mode',
      empireTelemetry: 'قياس امبراطوري',
      platformBalance: 'Platform Balance',
      systemHealth: 'System Health',
      allSystemsGreen: 'All systems green',
      watermarkScanner: 'Watermark Scanner',
      uploadMedia: 'Upload Media File',
      uploadVerify: 'Upload & Verify',
      fileLabel: 'File',
      scanning: 'Scanning...',
      navChats: 'دردشات',
      navExplore: 'استكشاف',
      navLive: 'مباشر',
      navWallet: 'Wallet',
      fomoLiveNow: 'مباشر الان',
      fomoTimer: 'FOMO Timer',
      stockMarketTerminal: 'Stock Market Terminal',
      liveFeed: 'Live Feed',
      search: 'Search',
      ticker: 'Ticker',
      marketTape: 'Market Tape',
      liveCam: 'Live Cam',
      viewers: 'Viewers',
      scene: 'Scene',
      nebulaVaultStream: 'Nebula Vault Stream',
      creatorTools: 'Creator Tools',
      liveRoom: 'Live Room',
      entry: 'الدخول',
      streaming: 'Streaming',
      nowLive: 'Now Live',
      gift: 'Gift',
      platformShare: 'Platform',
      creatorShare: 'Creator',
      ledgerTitle: 'Ledger Satoshi SHA-256',
      balanceLabel: 'الرصيد',
      apyLabel: 'APY',
      lockLabel: 'Lock',
      rateLabel: 'Rate',
      feeLabel: 'Fee',
      netLabel: 'Net',
      swapPair: 'USDT → XT',
      orbitalYield: 'Orbital Yield',
      creatorBoost: 'Creator Boost',
      infrastructureTotal: 'Infrastructure Total',
      adsRevenueTotal: 'Ads Revenue Total',
      withdrawalFees: 'Withdrawal Fees',
      systemLedger: 'Ledger',
      systemStreaming: 'Streaming',
      systemAds: 'Ads',
      systemWithdrawals: 'Withdrawals',
      systemKyc: 'KYC',
      systemWallet: 'Wallet',
      systemInfra: 'Infra',
      systemEdge: 'Edge',
      okStatus: 'OK',
      kycVerification: 'KYC Verification',
      verifyFor: 'Verify for',
      verifyNow: 'Verify Now',
      protectedTitle: 'XCHAT Protected',
      resume: 'Resume',
      videoCall: 'Video Call',
      call: 'Call',
      ringing: 'Ringing',
      incomingConnection: 'اتصال وارد',
      connect: 'اتصال',
      endCall: 'End Call',
      videoRate: '6 XT/دقيقة',
      callRate: '3 XT/دقيقة',
      selectFileToScan: 'اختر ملفا للمسح',
      scanFailed: 'فشل المسح',
      noWatermarkDataReturned: 'لم يتم ارجاع بيانات العلامة المائية',
      noWatermarkDetected: 'لم يتم اكتشاف علامة مائية',
      watermarkChecksumMismatch: 'تم العثور على علامة مائية، فشل التحقق',
      watermarkVerified: 'تم التحقق من العلامة المائية',
      userId: 'معرف المستخدم',
      mediaId: 'معرف الوسيط',
      issued: 'تم الاصدار',
      checksum: 'Checksum',
      notAvailable: 'N/A',
      ok: 'OK',
      bad: 'BAD'
    },
  } as const

  type TranslationKey = keyof typeof translations.ES
  const t = (key: TranslationKey) => translations[language][key]
  const languageOptions = [
    { code: 'ES', label: 'Español', flag: '🇪🇸' },
    { code: 'EN', label: 'English', flag: '🇺🇸' },
    { code: 'PT', label: 'Português', flag: '🇧🇷' },
    { code: 'FR', label: 'Français', flag: '🇫🇷' },
    { code: 'DE', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'IT', label: 'Italiano', flag: '🇮🇹' },
    { code: 'RU', label: 'Русский', flag: '🇷🇺' },
    { code: 'ZH', label: '中文', flag: '🇨🇳' },
    { code: 'JP', label: '日本語', flag: '🇯🇵' },
    { code: 'AR', label: 'العربية', flag: '🇸🇦' }
  ] as const
  const activeLanguageOption = languageOptions.find((option) => option.code === language)

  const fetchBalance = async () => {
    try {
      const r = await fetch('/api/ledger/balance')
      const d = await r.json()
      if (typeof d.balance === 'number') setBalance(d.balance)
    } catch (e) {}
  }

  const fetchLedger = async () => {
    try {
      const r = await fetch('/api/ledger/history')
      const d = await r.json()
      const items = Array.isArray(d?.history)
        ? d.history
        : Array.isArray(d?.transactions)
          ? d.transactions
          : Array.isArray(d)
            ? d
            : []
      const normalized = items.map((item: { label?: string; description?: string; title?: string; type?: string; amount?: number | string }) => {
        const label = item.label ?? item.description ?? item.title ?? item.type ?? t('ledgerMovement')
        const amount = typeof item.amount === 'number' ? item.amount : Number(item.amount ?? 0)
        return { label, amount: Number.isFinite(amount) ? amount : 0 }
      })
      setLedgerEntries(normalized)
    } catch (e) {}
  }

  useEffect(() => {
    fetchBalance()
    fetchLedger()
  }, [])

  const pushLedgerEntry = (label: string, amount: number) => {
    setLedgerEntries((prev) => [{ label, amount }, ...prev].slice(0, 20))
  }

  const applyBalanceChange = (label: string, amount: number) => {
    setBalance((prev) => Number((prev + amount).toFixed(2)))
    pushLedgerEntry(label, amount)
  }

  const aiCloserSuggestion = useMemo(() => {
    if (activeTab === 'chats') {
      const unread = chatList.find(chat => chat.unread > 0)
      return unread ? `${t('aiCloserChatsUnread')} ${unread.name}` : t('aiCloserChatsNew')
    }
    if (activeTab === 'explorar') return t('aiCloserExplore')
    if (activeTab === 'live') return t('aiCloserLive')
    if (activeTab === 'wallet') return t('aiCloserWallet')
    if (activeTab === 'admin') return t('aiCloserAdmin')
    return t('aiCloserDefault')
  }, [activeTab, language])

  useEffect(() => {
    const timer = setInterval(() => {
      setFomoSeconds((prev) => (prev > 0 ? prev - 1 : 0))
      setFlashSaleSeconds((prev) => (flashSaleActive && prev > 0 ? prev - 1 : prev))
    }, 1000)
    return () => clearInterval(timer)
  }, [flashSaleActive])

  useEffect(() => {
    setSnapshotShieldEnabled(activeTab === 'explorar')
  }, [activeTab])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsProtected(true)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.pathname === '/admin') setActiveTab('admin')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isAdminPath = window.location.pathname === '/admin'
    if (activeTab === 'admin' && !isAdminPath) {
      window.history.replaceState(null, '', '/admin')
    }
    if (activeTab !== 'admin' && isAdminPath) {
      window.history.replaceState(null, '', '/')
    }
  }, [activeTab])

  const fomoLabel = useMemo(() => {
    if (fomoSeconds <= 0) return t('fomoLiveNow')
    const minutes = String(Math.floor(fomoSeconds / 60)).padStart(2, '0')
    const seconds = String(fomoSeconds % 60).padStart(2, '0')
    return `${t('fomoTimer')}: ${minutes}:${seconds}`
  }, [fomoSeconds, language])

  const flashLabel = useMemo(() => {
    const minutes = String(Math.floor(flashSaleSeconds / 60)).padStart(2, '0')
    const seconds = String(flashSaleSeconds % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  }, [flashSaleSeconds])

  const stakingOptions = [
    { days: 90, multiplier: 1 },
    { days: 180, multiplier: 1.5 },
    { days: 365, multiplier: 2.5 },
    { days: 730, multiplier: 5 }
  ]
  const selectedStake = stakingOptions.find((option) => option.days === stakeHorizon) ?? stakingOptions[1]
  const baseApy = 12
  const stakingApy = Number((baseApy * selectedStake.multiplier).toFixed(2))
  const stakeAmountValue = Math.max(0, Number(stakeAmount) || 0)
  const estimatedReward = Number(((stakeAmountValue * stakingApy) / 100 * (selectedStake.days / 365)).toFixed(2))

  const swapRate = 10
  const swapInputValue = Math.max(0, Number(swapAmount) || 0)
  const swapFee = Number((swapInputValue * 0.015).toFixed(2))
  const swapNetUsdt = Math.max(0, swapInputValue - swapFee)
  const swapOutput = Number((swapNetUsdt * swapRate).toFixed(2))

  const adsTiers = {
    starter: { labelKey: 'adsTierStarter', cost: 50 },
    pro: { labelKey: 'adsTierPro', cost: 200 },
    elite: { labelKey: 'adsTierElite', cost: 500 }
  } as const
  const selectedAds = adsTiers[adsTier]
  const selectedAdsLabel = t(selectedAds.labelKey)
  const adsPlatformFee = Number((selectedAds.cost * 0.6).toFixed(2))
  const adsCreatorShare = Number((selectedAds.cost - adsPlatformFee).toFixed(2))

  const lotteryTicketCost = 10
  const lotterySplits = [
    { label: 'Jackpot', share: 0.8 },
    { label: 'Runner-Up 1', share: 0.05 },
    { label: 'Runner-Up 2', share: 0.05 },
    { label: 'Runner-Up 3', share: 0.05 },
    { label: 'Runner-Up 4', share: 0.05 }
  ]

  useEffect(() => {
    if (!isCallOpen || callStatus !== 'active') return
    const timer = setInterval(() => {
      setCallSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isCallOpen, callStatus])

  useEffect(() => {
    if (!isCallOpen || callStatus !== 'active') return
    const minutes = Math.floor(callSeconds / 60)
    if (minutes <= billedMinutes) return
    const rate = callType === 'video' ? 6 : 3
    const totalCost = rate * (minutes - billedMinutes)
    if (balance < totalCost) {
      setCallStatus('ringing')
      setIsCallOpen(false)
      return
    }
    applyBalanceChange(`${callType === 'video' ? t('videoCall') : t('call')} ${minutes}m`, -totalCost)
    setBilledMinutes(minutes)
  }, [callSeconds, billedMinutes, balance, callType, callStatus, isCallOpen])

  const openCallModal = (type: 'call' | 'video', name: string) => {
    setCallType(type)
    setCallContact(name)
    setCallStatus('ringing')
    setCallSeconds(0)
    setBilledMinutes(0)
    setIsCallOpen(true)
  }

  const closeCallModal = () => {
    setIsCallOpen(false)
    setCallStatus('ringing')
    setCallSeconds(0)
    setBilledMinutes(0)
  }

  const startCall = () => {
    setCallStatus('active')
  }

  const formatDuration = (seconds: number) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
    const secs = String(seconds % 60).padStart(2, '0')
    return `${mins}:${secs}`
  }

  const encodeArrayBufferToBase64 = (arrayBuffer: ArrayBuffer) => {
    if (typeof window === 'undefined') return ''
    const bytes = new Uint8Array(arrayBuffer)
    const chunkSize = 0x8000
    let binary = ''
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
    }
    return window.btoa(binary)
  }

  const handleWatermarkScan = async (fileOverride?: File | null) => {
    const file = fileOverride ?? watermarkFile
    if (!file) {
      setWatermarkStatus(t('selectFileToScan'))
      return
    }
    setIsWatermarkScanning(true)
    setWatermarkStatus(null)
    setWatermarkResult(null)
    setWatermarkFileName(file.name)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const dataBase64 = encodeArrayBufferToBase64(arrayBuffer)
      const r = await fetch('/api/watermark/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataBase64 })
      })
      if (!r.ok) {
        throw new Error('Scan failed')
      }
      const data = await r.json()
      const result = data?.watermark as WatermarkScanResult | undefined
      if (!result) {
        setWatermarkStatus(t('noWatermarkDataReturned'))
        setWatermarkResult(null)
      } else {
        setWatermarkResult(result)
        if (!result.found) {
          setWatermarkStatus(t('noWatermarkDetected'))
        } else if (!result.checksumValid) {
          setWatermarkStatus(t('watermarkChecksumMismatch'))
        } else {
          setWatermarkStatus(t('watermarkVerified'))
        }
      }
    } catch (error) {
      setWatermarkStatus(t('scanFailed'))
    } finally {
      setIsWatermarkScanning(false)
    }
  }

  const handleWatermarkFileChange = (file: File | null) => {
    setWatermarkFile(file)
    setWatermarkFileName(file?.name ?? null)
    setWatermarkStatus(null)
    setWatermarkResult(null)
  }

  const handleStake = async () => {
    if (stakeAmountValue <= 0 || stakeAmountValue > balance) return
    console.log('sensory:stake_payment', { amount: stakeAmountValue, days: selectedStake.days })
    try {
      const r = await fetch('/api/ledger/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: -stakeAmountValue,
          type: 'STAKE',
          label: `${t('stakeXt')} ${selectedStake.days}d`
        })
      })
      if (!r.ok) {
        throw new Error('Ledger append failed')
      }
      X_TOUCH.vibrate('success')
      X_TONE.play('success')
      setStakeAmount('')
      await fetchBalance()
      await fetchLedger()
    } catch (error) {}
  }

  const handleSwap = async () => {
    if (swapInputValue <= 0) return
    console.log('sensory:swap_payment', { inputUsdt: swapInputValue, outputXt: swapOutput })
    try {
      const r = await fetch('/api/ledger/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: swapOutput,
          type: 'SWAP',
          label: `${t('swapTerminal')} ${t('swapPair')}`,
          metadata: {
            rate: swapRate,
            inputUsdt: swapInputValue,
            feeUsdt: swapFee,
            netUsdt: swapNetUsdt
          }
        })
      })
      if (!r.ok) {
        throw new Error('Ledger append failed')
      }
      X_TOUCH.vibrate('success')
      X_TONE.play('success')
      setSwapAmount('')
      await fetchBalance()
      await fetchLedger()
    } catch (error) {}
  }

  const handlePayAds = async () => {
    if (balance < selectedAds.cost) return
    try {
      const r = await fetch('/api/ledger/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: -selectedAds.cost,
          type: 'ADS',
          label: `${t('activateBoost')} ${selectedAdsLabel}`,
          metadata: {
            tier: selectedAdsLabel,
            platformShare: adsPlatformFee,
            creatorShare: adsCreatorShare
          }
        })
      })
      if (!r.ok) {
        throw new Error('Ledger append failed')
      }
      X_TOUCH.vibrate('success')
      X_TONE.play('success')
      await fetchBalance()
      await fetchLedger()
    } catch (error) {}
  }

  const handleBuyTicket = async () => {
    if (balance < lotteryTicketCost) return
    console.log('sensory:lottery_payment', { ticketCost: lotteryTicketCost })
    try {
      const r = await fetch('/api/ledger/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: -lotteryTicketCost,
          type: 'LOTTERY',
          label: t('buyTicket')
        })
      })
      if (!r.ok) {
        throw new Error('Ledger append failed')
      }
      X_TOUCH.vibrate('success')
      X_TONE.play('success')
      setLotteryTickets((prev) => prev + 1)
      setLotteryPool((prev) => Number((prev + lotteryTicketCost * 0.8).toFixed(2)))
      await fetchBalance()
      await fetchLedger()
    } catch (error) {}
  }

  const handleTopUp = () => {
    console.log('sensory:topup_payment')
    X_TOUCH.vibrate('success')
    X_TONE.play('success')
  }

  const handleBuyXt = () => {
    console.log('sensory:launchpad_payment')
    X_TOUCH.vibrate('success')
    X_TONE.play('success')
  }

  if (isGhostMode) {
    const tickers = [
      { symbol: 'NOVA', price: '118.40', change: '+3.2%' },
      { symbol: 'LUX', price: '52.19', change: '+1.1%' },
      { symbol: 'ION', price: '301.07', change: '+0.8%' },
      { symbol: 'VEX', price: '88.61', change: '+4.9%' },
      { symbol: 'ORB', price: '16.72', change: '+2.4%' },
      { symbol: 'KIRA', price: '205.33', change: '+6.1%' },
      { symbol: 'LYNX', price: '74.09', change: '+1.7%' },
      { symbol: 'NEO', price: '412.55', change: '+0.3%' }
    ]

    return (
      <div className="h-screen w-screen bg-black text-[#00FF66] flex flex-col font-mono">
        <div className="px-4 py-3 border-b border-[#00FF66]/30 flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-[0.4em]">{t('stockMarketTerminal')}</div>
          <div className="text-[10px] uppercase tracking-[0.3em] opacity-70">{t('liveFeed')}</div>
        </div>
        <div className="px-4 py-4 border-b border-[#00FF66]/20">
          <label className="text-[10px] uppercase tracking-[0.3em] opacity-60" htmlFor="ghost-search">
            {t('search')}
          </label>
          <input
            id="ghost-search"
            value={ghostSearch}
            onChange={(event) => {
              const nextValue = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
              setGhostSearch(nextValue)
              if (nextValue === ghostExitCode) {
                setIsGhostMode(false)
                setGhostSearch('')
              }
            }}
            placeholder={t('ticker')}
            className="mt-2 w-full bg-black text-[#00FF66] border border-[#00FF66]/40 rounded-md px-3 py-2 text-sm uppercase tracking-[0.2em] outline-none focus:border-[#00FF66]"
          />
          <div className="text-[10px] uppercase tracking-[0.3em] opacity-40 mt-3">{t('marketTape')}</div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {tickers.map((ticker) => (
            <div key={ticker.symbol} className="flex items-center justify-between border border-[#00FF66]/20 px-3 py-2 rounded-md">
              <div className="text-sm uppercase tracking-[0.3em]">{ticker.symbol}</div>
              <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em]">
                <span>{ticker.price}</span>
                <span className="text-[#00FF66]">{ticker.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-[#0B0D10] text-[#E6E8EB] flex flex-col overflow-hidden font-sans">
      <header className="h-14 flex items-center justify-between px-3 bg-[#0B0D10]/80 backdrop-blur-md border-b border-white/5 shrink-0 z-30 relative">
        <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00F5A0] via-white to-[#00F5A0] tracking-[0.2em]">XCHAT</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-9 px-3 rounded-full border border-[#00F5A0]/30 text-[#00F5A0] bg-[#00F5A0]/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]"
            onClick={() => {
              setIsLanguageMenuOpen(true)
              setIsMenuOpen(false)
            }}
            aria-label={t('selectLanguage')}
          >
            <Globe className="w-4 h-4" />
            <span>{activeLanguageOption?.code ?? language}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>
          <div className="relative">
            <button
              className="w-9 h-9 flex items-center justify-center rounded-full border border-white/5 bg-white/5"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <MoreVertical className="w-5 h-5 opacity-70" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-[#0B0D10]/95 shadow-2xl backdrop-blur-md overflow-hidden">
                <button
                  className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[#00F5A0] hover:bg-white/5"
                  onClick={() => {
                    setActiveTab('admin')
                    setIsMenuOpen(false)
                  }}
                >
                  {t('admin')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative no-scrollbar">
        <div className="px-3 pt-3 text-[10px] font-bold opacity-40 uppercase tracking-[0.2em]">
          {aiCloserSuggestion}
        </div>

        {activeTab === 'chats' && (
          <div className="animate-in fade-in duration-500">
            {chatList.map(chat => (
              <div key={chat.id} className="flex items-center gap-3 px-3 py-4 active:bg-white/5 transition-colors border-b border-[#00F5A0]/10">
                <img src={chat.avatar} className="w-14 h-14 rounded-full object-cover border border-[#00F5A0]/30" alt={chat.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-[15px]">{chat.name}</h3>
                    <span className="text-[11px] opacity-40 uppercase font-bold">{chat.time}</span>
                  </div>
                  <p className="text-[13px] text-white/50 truncate pr-4">{chat.preview}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    className="w-9 h-9 rounded-full border border-[#00F5A0]/30 bg-white/5 flex items-center justify-center"
                    onClick={() => openCallModal('call', chat.name)}
                  >
                    <Phone className="w-4 h-4 text-[#00F5A0]" />
                  </button>
                  <button
                    className="w-9 h-9 rounded-full border border-[#00F5A0]/30 bg-white/5 flex items-center justify-center"
                    onClick={() => openCallModal('video', chat.name)}
                  >
                    <Video className="w-4 h-4 text-[#00F5A0]" />
                  </button>
                </div>
                {chat.unread > 0 && (
                  <div className="bg-[#00F5A0] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-[0_0_10px_#00F5A0]">
                    {chat.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'explorar' && (
          <div className="flex flex-col animate-in fade-in duration-500">
            <div className="flex items-center justify-between px-3 pt-4">
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em]">{t('snapshotShield')}</span>
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em]">
                {snapshotShieldEnabled ? t('active') : t('inactive')}
              </span>
            </div>
            <div className="flex gap-4 px-3 py-4 overflow-x-auto no-scrollbar border-b border-[#00F5A0]/10">
              {stories.map(s => (
                <div key={s.id} className="flex-shrink-0 flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
                  <div
                    className={`w-16 h-16 rounded-full p-[2px] ${
                      s.paid
                        ? 'bg-[#00F5A0] shadow-[0_0_20px_#00F5A0]'
                        : 'bg-white/10'
                    }`}
                  >
                    <div className="w-full h-full rounded-full border border-black overflow-hidden bg-black">
                      <video src={s.video} className="w-full h-full object-cover" muted autoPlay loop />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold opacity-60 uppercase">@{s.user}</span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="aspect-[9/16] bg-[#1A1D22]/90 border-y border-[#00F5A0]/10 flex flex-col justify-end p-6 relative overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                {!isVerified && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center gap-3 bg-black/40 backdrop-blur-sm">
                    <Lock className="w-10 h-10 text-white/80" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white/80">{t('verifyToView')}</span>
                  </div>
                )}
                <div className="relative z-20 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <img src="https://i.pravatar.cc/150?u=4" className="w-10 h-10 rounded-full border border-[#00F5A0]" />
                    <span className="font-bold text-sm shadow-black drop-shadow-md">@ionvega</span>
                  </div>
                  <p className="text-sm opacity-80 shadow-black drop-shadow-md">{t('vaultUpdate')}</p>
                </div>
                <div className="absolute right-4 bottom-24 z-20 flex flex-col gap-6">
                  <Heart className="w-7 h-7 text-white drop-shadow-lg" />
                  <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" />
                  <Share2 className="w-7 h-7 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="flex flex-col gap-6 p-6 text-center animate-in zoom-in-95 duration-500 relative">
            <div className="flex items-center justify-between gap-3 text-left">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-[#00F5A0]">{t('liveControl')}</h2>
                <p className="text-xs text-white/40 uppercase tracking-[0.2em] mt-1">{fomoLabel}</p>
              </div>
              <button
                onClick={() => {
                  setIsCreator((prev) => !prev)
                  setIsLiveOn(false)
                }}
                className="border border-[#00F5A0]/40 text-[#00F5A0] px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em]"
              >
                {isCreator ? t('modeUser') : t('modeCreator')}
              </button>
            </div>

            {isCreator ? (
              <div className="flex flex-col gap-6">
                {!isLiveOn ? (
                  <div className="bg-[#0F1216]/80 border border-[#00F5A0]/20 rounded-2xl p-6 text-left shadow-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#00F5A0]/10 flex items-center justify-center">
                        <Radio className="w-6 h-6 text-[#00F5A0]" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{t('creatorConsole')}</p>
                        <h3 className="text-xl font-black text-white">{t('standby')}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-white/50 mt-4">{t('prepareScene')}</p>
                    <button
                      className="mt-6 w-full bg-[#00F5A0] text-black py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_#00F5A044]"
                      onClick={() => {
                        setIsLiveOn(true)
                        setFlashSaleSeconds(30 * 60)
                        setFlashSaleActive(false)
                      }}
                    >
                      {t('goLive')}
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#0F1216]/90 border border-[#00F5A0]/20 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="relative aspect-[9/16] bg-[radial-gradient(circle_at_top,_rgba(0,245,160,0.2),_transparent_60%)]">
                      <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(255,255,255,0.04),_transparent_60%)]" />
                      <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#00F5A0]">
                        <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" /> {t('liveCam')}
                      </div>
                      <div className="absolute top-4 right-4 bg-black/60 text-white text-[10px] uppercase tracking-[0.2em] font-black px-3 py-1.5 rounded-full">
                        {t('viewers')} 1.4k
                      </div>
                      <div className="absolute bottom-6 left-6 text-left">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">{t('scene')}</p>
                        <h3 className="text-lg font-black text-white">{t('nebulaVaultStream')}</h3>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-3 text-left">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{t('creatorTools')}</p>
                      <button
                        className="w-full bg-[#00F5A0] text-black py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_#00F5A044]"
                        onClick={() => {
                          setFlashSaleActive(true)
                          setFlashSaleSeconds(30 * 60)
                        }}
                      >
                        {t('flashSale')} {flashLabel}
                      </button>
                      <button
                        className="w-full border border-white/10 text-white/70 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em]"
                        onClick={() => {
                          setIsLiveOn(false)
                          setFlashSaleActive(false)
                          setFlashSaleSeconds(30 * 60)
                        }}
                      >
                        {t('endLive')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {activeLiveRoom === null ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {liveRooms.map((room) => (
                      <div key={room.id} className="bg-[#0F1216]/80 border border-[#00F5A0]/15 rounded-2xl p-4 text-left shadow-2xl">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{t('liveRoom')}</p>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00F5A0]">{room.price} XT</span>
                        </div>
                        <h3 className="text-lg font-black text-white mt-2">{room.creator}</h3>
                        <p className="text-sm text-white/50">{room.topic}</p>
                        <div className="flex items-center justify-between mt-4 text-[10px] uppercase tracking-[0.2em] text-white/40">
                          <span>{room.viewers} {t('viewers')}</span>
                          <span>{t('entry')}</span>
                        </div>
                        <button
                          className="mt-4 w-full border border-[#00F5A0]/40 text-[#00F5A0] py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em]"
                          onClick={() => setActiveLiveRoom(room.id)}
                        >
                          {t('enterLive')}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0F1216]/90 border border-[#00F5A0]/20 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="relative aspect-[9/16] bg-[radial-gradient(circle_at_top,_rgba(0,245,160,0.15),_transparent_60%)]">
                      <div className="absolute inset-0 bg-[linear-gradient(160deg,_rgba(255,255,255,0.04),_transparent_60%)]" />
                      <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#00F5A0]">
                        <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" /> {t('streaming')}
                      </div>
                      <div className="absolute top-4 right-4 bg-black/60 text-white text-[10px] uppercase tracking-[0.2em] font-black px-3 py-1.5 rounded-full">
                        {t('viewers')} 986
                      </div>
                      <div className="absolute bottom-6 left-6 text-left">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">{t('nowLive')}</p>
                        <h3 className="text-lg font-black text-white">Ion Vega</h3>
                        <p className="text-xs text-white/50">{t('entry')} 60 XT</p>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-3 text-left">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{t('liveActions')}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[10, 50, 100].map((amount) => (
                          <button
                            key={amount}
                            className="bg-white/5 text-white px-2 py-2 rounded-full border border-white/10 font-black text-[10px] uppercase tracking-widest"
                          >
                            {t('gift')} {amount} XT
                          </button>
                        ))}
                      </div>
                      <button
                        className="w-full border border-white/10 text-white/70 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em]"
                        onClick={() => setActiveLiveRoom(null)}
                      >
                        {t('exitLive')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-[#0F1216]/80 border border-[#00F5A0]/20 rounded-2xl p-4 text-left shadow-2xl">
              <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-2">{t('lotteryTerminal')}</p>
              <h3 className="text-xl font-black text-[#00F5A0] mb-2 uppercase tracking-tight">{t('weeklyJackpot')}</h3>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60 mb-4">
                <span>{t('pool')} {lotteryPool} XT</span>
                <span>{t('tickets')} {lotteryTickets}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] uppercase tracking-[0.2em] text-white/50 mb-4">
                {lotterySplits.map((split) => (
                  <div key={split.label} className="flex items-center justify-between">
                    <span>{split.label}</span>
                    <span>{Math.floor(lotteryPool * split.share)} XT</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/50 mb-4">
                <span>{t('ticketCost')}</span>
                <span>{lotteryTicketCost} XT</span>
              </div>
              <button
                className="w-full bg-[#00F5A0] text-black py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_#00F5A044]"
                onClick={handleBuyTicket}
              >
                {t('buyTicket')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="flex flex-col animate-in slide-in-from-right-4 duration-500">
            <div className="bg-gradient-to-br from-[#1A1D22] to-[#0B0D10] px-3 py-6 border-b border-[#00F5A0]/15 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#00F5A0]/5 rounded-full blur-3xl" />
              <p className="text-xs font-bold opacity-40 uppercase tracking-[0.2em] mb-2">{t('balanceAvailable')}</p>
              <div className="flex items-end gap-2">
                <h2 className="text-5xl font-black text-[#00F5A0]">{balance}</h2>
                <span className="text-sm font-black opacity-40 uppercase tracking-widest mb-2">XT</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-0 border-b border-[#00F5A0]/15">
              <button
                className="bg-[#00F5A0] text-black py-5 font-black text-sm uppercase tracking-widest shadow-[0_0_20px_#00F5A044]"
                onClick={handleTopUp}
              >
                {t('topUp')}
              </button>
              <button
                className="bg-white/5 text-white py-5 border-l border-[#00F5A0]/10 font-black text-sm uppercase tracking-widest"
                onClick={() => {
                  if (!isVerified) setIsKycOpen(true)
                }}
              >
                {t('withdraw')}
              </button>
            </div>

            <div className="bg-[#0F1216]/80 border-b border-[#00F5A0]/15 px-3 py-5 relative overflow-hidden backdrop-blur-md">
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#00F5A0]/10 rounded-full blur-2xl" />
              <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-3">{t('launchpad')}</p>
              <h3 className="text-2xl font-black text-[#00F5A0] mb-2 uppercase tracking-tight">{t('privateSale')}</h3>
              <p className="text-sm text-white/60 mb-5 max-w-sm">{t('privateSaleDescription')}</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {launchpadSplits.map((vault) => (
                  <div key={vault.label} className="bg-black/30 border border-[#00F5A0]/20 rounded-2xl px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">{vault.label}</p>
                    <p className="text-sm font-black text-[#00F5A0]">{vault.percent}%</p>
                    <p className="text-[9px] text-white/50 mt-1 leading-snug">{vault.strategy}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className="bg-[#00F5A0] text-black px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_#00F5A044]"
                  onClick={handleBuyXt}
                >
                  {t('buyXt')}
                </button>
                <a
                  href="/legal"
                  className="border border-[#00F5A0]/60 text-[#00F5A0] px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#00F5A0]/10 transition-colors"
                >
                  {t('legalDocs')}
                </a>
              </div>
            </div>

            <div className="bg-[#0B0D10]/85 border-b border-[#00F5A0]/15 px-3 py-5 relative overflow-hidden backdrop-blur-md">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,245,160,0.08)_1px,transparent_1px)] bg-[length:100%_4px] opacity-40 pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,245,160,0.12)_0%,rgba(0,0,0,0)_45%,rgba(0,245,160,0.1)_100%)] opacity-40 pointer-events-none" />
              <div className="relative">
                <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-2">{t('stakingTerminal')}</p>
                <h3 className="text-xl font-black text-[#00F5A0] mb-3 uppercase tracking-tight">{t('orbitalYield')}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {stakingOptions.map((option) => (
                    <button
                      key={option.days}
                      onClick={() => setStakeHorizon(option.days)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${
                        stakeHorizon === option.days
                          ? 'bg-[#00F5A0] text-black border-[#00F5A0]'
                          : 'border-[#00F5A0]/40 text-[#00F5A0]/70'
                      }`}
                    >
                      {option.days}d {option.multiplier}x
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] mb-3 text-white/60">
                  <span>{t('apyLabel')} {stakingApy}%</span>
                  <span>{t('lockLabel')} {selectedStake.days}D</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="number"
                    min="0"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="XT"
                    className="flex-1 bg-black/30 border border-white/10 rounded-full px-4 py-2 text-sm text-white outline-none"
                  />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">{t('balanceLabel')} {balance} XT</span>
                </div>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/50 mb-4">
                  <span>{t('rewardEst')}</span>
                  <span>{estimatedReward} XT</span>
                </div>
                <button
                  className="bg-[#00F5A0] text-black px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_#00F5A044]"
                  onClick={handleStake}
                >
                  {t('stakeXt')}
                </button>
              </div>
            </div>

            <div className="bg-[#0F1216]/80 border-b border-[#00F5A0]/15 px-3 py-5 relative overflow-hidden backdrop-blur-md">
              <div className="absolute -right-10 -top-10 w-36 h-36 bg-[#00F5A0]/10 rounded-full blur-2xl" />
              <div className="relative">
                <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-2">{t('swapTerminal')}</p>
                <h3 className="text-xl font-black text-[#00F5A0] mb-3 uppercase tracking-tight">{t('swapPair')}</h3>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] mb-3 text-white/60">
                  <span>{t('rateLabel')} 1 USDT = {swapRate} XT</span>
                  <span>{t('feeLabel')} 1.5%</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="number"
                    min="0"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    placeholder="USDT"
                    className="flex-1 bg-black/30 border border-white/10 rounded-full px-4 py-2 text-sm text-white outline-none"
                  />
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">XT {swapOutput}</div>
                </div>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/50 mb-4">
                  <span>{t('feeLabel')} {swapFee} USDT</span>
                  <span>{t('netLabel')} {swapNetUsdt} USDT</span>
                </div>
                <button
                  className="bg-[#00F5A0] text-black px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_#00F5A044]"
                  onClick={handleSwap}
                >
                  {t('swapNow')}
                </button>
              </div>
            </div>

            <div className="bg-[#0B0D10]/85 border-b border-[#00F5A0]/15 px-3 py-5 relative overflow-hidden backdrop-blur-md">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,245,160,0.15),_transparent_65%)] opacity-40 pointer-events-none" />
              <div className="relative">
                <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-2">{t('adsManager')}</p>
                <h3 className="text-xl font-black text-[#00F5A0] mb-3 uppercase tracking-tight">{t('creatorBoost')}</h3>
                <div className="flex gap-2 mb-4">
                  {(['starter', 'pro', 'elite'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setAdsTier(tier)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${
                        adsTier === tier
                          ? 'bg-[#00F5A0] text-black border-[#00F5A0]'
                          : 'border-[#00F5A0]/40 text-[#00F5A0]/70'
                      }`}
                    >
                      {t(adsTiers[tier].labelKey)} {adsTiers[tier].cost}XT
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/50 mb-3">
                  <span>{t('platformShare')} 60%</span>
                  <span>{adsPlatformFee} XT</span>
                </div>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/50 mb-4">
                  <span>{t('creatorShare')} 40%</span>
                  <span>{adsCreatorShare} XT</span>
                </div>
                <button
                  className="bg-[#00F5A0] text-black px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_#00F5A044]"
                  onClick={handlePayAds}
                >
                  {t('activateBoost')}
                </button>
              </div>
            </div>

            <div className="bg-white/5 border-b border-[#00F5A0]/15 px-3 py-5">
              <h3 className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <div className="w-1 h-1 bg-[#00F5A0] rounded-full" /> {t('ledgerTitle')}
              </h3>
              <div className="space-y-6">
                {ledgerEntries.length === 0 && (
                  <div className="text-xs font-bold uppercase opacity-40">{t('ledgerEmpty')}</div>
                )}
                {ledgerEntries.map((entry, index) => {
                  const isCredit = entry.amount >= 0
                  const amountLabel = `${isCredit ? '+' : ''}${entry.amount} XT`
                  return (
                    <div key={`${entry.label}-${index}`} className="flex justify-between items-center opacity-60">
                      <span className="text-xs font-bold uppercase">{entry.label}</span>
                      <span className={`text-xs font-black ${isCredit ? 'text-[#00F5A0]' : 'text-red-400'}`}>{amountLabel}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-[#0F1216]/80 px-3 py-5 border-b border-[#00F5A0]/15 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-[#00F5A0]" />
                <h3 className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">{t('settings')}</h3>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">{t('ghostMode')}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">{t('stealthCamouflage')}</span>
                </div>
                <button
                  className={`w-12 h-6 rounded-full border transition-colors ${
                    isGhostMode ? 'bg-[#00F5A0] border-[#00F5A0]' : 'bg-white/10 border-white/10'
                  }`}
                  onClick={() => {
                    setGhostSearch('')
                    setIsGhostMode((prev) => !prev)
                  }}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-black transition-transform ${
                      isGhostMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">{t('language')}</span>
                <button
                  type="button"
                  className="w-10 h-10 rounded-full border border-[#00F5A0]/40 text-[#00F5A0]/80 flex items-center justify-center"
                  onClick={() => setIsLanguageMenuOpen(true)}
                  aria-label={t('selectLanguage')}
                >
                  <Globe className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                {t('languageActive')}: {activeLanguageOption?.label ?? language}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">{t('godMode')}</p>
                <h2 className="text-2xl font-black text-[#00F5A0]">{t('empireTelemetry')}</h2>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00F5A0]">{t('admin')}</span>
            </div>

            <div className="bg-[#0F1216]/80 border border-[#00F5A0]/20 rounded-2xl p-5 shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">{t('platformBalance')}</p>
              <div className="space-y-3 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                <div className="flex items-center justify-between">
                  <span>{t('infrastructureTotal')}</span>
                  <span className="text-[#00F5A0]">8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('adsRevenueTotal')}</span>
                  <span className="text-[#00F5A0]">60%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('withdrawalFees')}</span>
                  <span className="text-[#00F5A0]">3%</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0F1216]/80 border border-[#00F5A0]/20 rounded-2xl p-5 shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">{t('systemHealth')}</p>
              <div className="grid grid-cols-2 gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                {[
                  { key: 'ledger', label: t('systemLedger') },
                  { key: 'streaming', label: t('systemStreaming') },
                  { key: 'ads', label: t('systemAds') },
                  { key: 'withdrawals', label: t('systemWithdrawals') },
                  { key: 'kyc', label: t('systemKyc') },
                  { key: 'wallet', label: t('systemWallet') },
                  { key: 'infra', label: t('systemInfra') },
                  { key: 'edge', label: t('systemEdge') }
                ].map((system) => (
                  <div key={system.key} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-full px-3 py-2">
                    <span>{system.label}</span>
                    <span className="flex items-center gap-2 text-[#00F5A0]">
                      <span className="w-2 h-2 rounded-full bg-[#00F5A0]" />
                      {t('okStatus')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-[#00F5A0]/70">{t('allSystemsGreen')}</div>
            </div>

            <div className="bg-[#0F1216]/80 border border-[#00F5A0]/20 rounded-2xl p-5 shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">{t('watermarkScanner')}</p>
              <div className="flex flex-col gap-3 text-xs text-white/60">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40" htmlFor="watermark-file">
                  {t('uploadMedia')}
                </label>
                <input
                  id="watermark-file"
                  type="file"
                  className="text-[11px] text-white/70"
                  onChange={(event) => handleWatermarkFileChange(event.target.files?.[0] ?? null)}
                  disabled={isWatermarkScanning}
                />
                <button
                  className="bg-[#00F5A0] text-black px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_#00F5A044] disabled:opacity-60"
                  onClick={() => handleWatermarkScan()}
                  disabled={isWatermarkScanning}
                >
                  {t('uploadVerify')}
                </button>
                {watermarkFileName && (
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                    {t('fileLabel')}: {watermarkFileName}
                  </div>
                )}
                {isWatermarkScanning && (
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#00F5A0]/70">{t('scanning')}</div>
                )}
                {watermarkStatus && (
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#00F5A0]">{watermarkStatus}</div>
                )}
                {watermarkResult?.payload && (
                  <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.2em] text-white/50">
                    <div className="flex items-center justify-between">
                      <span>{t('userId')}</span>
                      <span className="text-[#00F5A0]">{watermarkResult.payload.buyerId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('mediaId')}</span>
                      <span className="text-[#00F5A0]">{watermarkResult.payload.mediaItemId ?? t('notAvailable')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('issued')}</span>
                      <span className="text-[#00F5A0]">{watermarkResult.payload.issuedAt ?? t('notAvailable')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('checksum')}</span>
                      <span className="text-[#00F5A0]">{watermarkResult.checksumValid ? t('ok') : t('bad')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {isKycOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0B0D10] border border-white/10 rounded-[28px] p-6 w-[90%] max-w-sm text-center shadow-2xl">
            <h3 className="text-lg font-black uppercase tracking-widest mb-2">{t('kycVerification')}</h3>
            <p className="text-sm text-white/50 mb-6">{t('verifyFor')} 50 XT</p>
            <button
              className="bg-[#00F5A0] text-black px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_#00F5A044]"
              onClick={async () => {
                const r = await fetch('/api/kyc/verify', { method: 'POST' })
                if (r.ok) {
                  setIsVerified(true)
                  setIsKycOpen(false)
                  fetchBalance()
                  fetchLedger()
                }
              }}
            >
              {t('verifyNow')}
            </button>
          </div>
        </div>
      )}

      {isLanguageMenuOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsLanguageMenuOpen(false)}
        >
          <div
            className="bg-[#0B0D10] border border-white/10 rounded-[28px] p-6 w-[90%] max-w-sm text-left shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00F5A0]" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/70">{t('selectLanguage')}</h3>
              </div>
              <button
                type="button"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40"
                onClick={() => setIsLanguageMenuOpen(false)}
              >
                {t('close')}
              </button>
            </div>
            <div className="space-y-2">
              {languageOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  className={`w-full px-3 py-2 rounded-xl text-left text-[11px] font-bold tracking-[0.15em] flex items-center gap-3 border ${
                    language === option.code
                      ? 'border-[#00F5A0] text-[#00F5A0] bg-[#00F5A0]/10'
                      : 'border-white/10 text-white/70 hover:bg-white/5'
                  }`}
                  onClick={() => {
                    setLanguage(option.code)
                    setIsLanguageMenuOpen(false)
                  }}
                >
                  <span className="text-base">{option.flag}</span>
                  <span className="uppercase">{option.code}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] opacity-60">{option.label}</span>
                  {language === option.code && <Check className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isProtected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg">
          <div className="text-center flex flex-col items-center gap-4">
            <span className="text-2xl font-black uppercase tracking-[0.3em] text-white">{t('protectedTitle')}</span>
            <button
              className="bg-[#00F5A0] text-black px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_#00F5A044]"
              onClick={() => setIsProtected(false)}
            >
              {t('resume')}
            </button>
          </div>
        </div>
      )}

      {isCallOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg">
          <div className="bg-[#0B0D10] border border-white/10 rounded-[28px] p-6 w-[90%] max-w-sm text-center shadow-2xl relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#00F5A0]/10 flex items-center justify-center">
              {callType === 'video' ? (
                <Video className="w-6 h-6 text-[#00F5A0]" />
              ) : (
                <Phone className="w-6 h-6 text-[#00F5A0]" />
              )}
            </div>
            <h3 className="text-lg font-black uppercase tracking-widest mt-6 mb-2">
              {callType === 'video' ? t('videoCall') : t('call')}
            </h3>
            <p className="text-sm text-white/50 mb-4">{callContact}</p>
            {callStatus === 'ringing' ? (
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-full border border-[#00F5A0] flex items-center justify-center animate-pulse">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00F5A0]">{t('ringing')}</span>
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{t('incomingConnection')}</p>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-2xl font-black text-[#00F5A0]">{formatDuration(callSeconds)}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  {callType === 'video' ? t('videoRate') : t('callRate')}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {callStatus === 'ringing' && (
                <button
                  className="bg-[#00F5A0] text-black py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_#00F5A044]"
                  onClick={startCall}
                >
                  {t('connect')}
                </button>
              )}
              <button
                className="border border-white/10 text-white/70 py-3 rounded-full font-black text-xs uppercase tracking-widest"
                onClick={closeCallModal}
              >
                {t('endCall')}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="h-20 bg-[#0B0D10]/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around pb-4 shrink-0 z-30">
        {[ 
          { id: 'chats', icon: MessageCircle, label: t('navChats') },
          { id: 'explorar', icon: PlayCircle, label: t('navExplore') },
          { id: 'live', icon: Radio, label: t('navLive') },
          { id: 'wallet', icon: Wallet, label: t('navWallet') }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-[#00F5A0]' : 'text-white/20'}`}
          >
            <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'drop-shadow-[0_0_8px_#00F5A0]' : ''}`} />
            <span className="text-[9px] font-black tracking-widest uppercase">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
