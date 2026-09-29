// Honey Chain prototype in-memory seed data
// (extracted byte-identical from the original monolithic server.js)

const seedUsers = [
  { id: 'U002', name: 'Ganesh Pawar', email: 'beekeeper@honeychain.demo', role: 'BEEKEEPER', cluster: 'Satara', status: 'Active', joined: '12 Jan 2026' },
  { id: 'U003', name: 'Ramesh Shinde', email: 'ramesh.shinde@honeychain.demo', role: 'BEEKEEPER', cluster: 'Pune / Solapur', status: 'Active', joined: '18 Jan 2026' },
  { id: 'U004', name: 'Suresh More', email: 'suresh.more@honeychain.demo', role: 'BEEKEEPER', cluster: 'Kolhapur', status: 'Invited', joined: '02 Feb 2026' },
  { id: 'U005', name: 'Dr. Anita Kulkarni', email: 'tester@honeychain.demo', role: 'TESTER', cluster: 'Satara Lab', status: 'Active', joined: '05 Jan 2026' },
  { id: 'U006', name: 'Vikram Deshmukh', email: 'processor@honeychain.demo', role: 'PROCESSOR', cluster: 'Satara Processing Unit', status: 'Active', joined: '08 Jan 2026' },
  { id: 'U007', name: 'Nashik Packing Works', email: 'manufacturer@honeychain.demo', role: 'MANUFACTURER', cluster: 'Nashik', status: 'Active', joined: '14 Jan 2026' },
];

const sampleBeekeepers = [
  {
    id: 'KVIC-BK-101',
    name: 'Rameshwar Verma',
    aadhaar: 'XXXX-XXXX-8912',
    krishiId: 'KRISHI-UP-4402',
    cluster: 'Muzaffarpur Apiary Cluster',
    state: 'Bihar',
    village: 'Kanti',
    boxesAllocated: 10,
    species: 'Apis mellifera (Italian Honey Bee)',
    phone: '+91-98765-43210',
    joinedDate: '2024-03-15',
    verified: true,
    geoZone: { latMin: 25.9, latMax: 26.3, lonMin: 85.1, lonMax: 85.5 }
  },
  {
    id: 'KVIC-BK-102',
    name: 'Sunita Devi',
    aadhaar: 'XXXX-XXXX-6721',
    krishiId: 'KRISHI-WB-9821',
    cluster: 'Sundarbans Mangrove Cluster',
    state: 'West Bengal',
    village: 'Gosaba',
    boxesAllocated: 15,
    species: 'Apis dorsata / Apis cerana indica',
    phone: '+91-98765-88321',
    joinedDate: '2024-05-10',
    verified: true,
    geoZone: { latMin: 21.8, latMax: 22.4, lonMin: 88.5, lonMax: 89.2 }
  },
  {
    id: 'KVIC-BK-103',
    name: 'Baljit Singh',
    aadhaar: 'XXXX-XXXX-3419',
    krishiId: 'KRISHI-PB-2311',
    cluster: 'Hoshiarpur Forest Apiary',
    state: 'Punjab',
    village: 'Mahilpur',
    boxesAllocated: 20,
    species: 'Apis mellifera',
    phone: '+91-98765-11223',
    joinedDate: '2024-01-20',
    verified: true,
    geoZone: { latMin: 31.3, latMax: 31.8, lonMin: 75.8, lonMax: 76.3 }
  }
];

const sampleHives = [
  {
    hiveId: 'HIVE-BOX-01',
    boxNumber: 'KVIC-BOX-8801',
    beekeeperId: 'KVIC-BK-101',
    beekeeperName: 'Rameshwar Verma',
    location: 'Muzaffarpur Litchi Orchard, Bihar',
    coordinates: { lat: 26.1209, lon: 85.3647 },
    floralSource: 'Litchi Blossom',
    installationDate: '2024-04-01',
    queenStatus: 'Active (Mated)',
    colonyHealth: 'EXCELLENT',
    telemetry: {
      internalTemp: 34.8, // Optimal 34 - 36 C
      humidity: 56.2, // Optimal 50 - 65 %
      weightKg: 28.4, // Live weight
      weightDelta24h: '+1.2 kg',
      acousticFreqHz: 235, // Normal buzz: 200-280 Hz (Swarm risk > 450 Hz)
      co2Ppm: 820,
      batteryLevel: 94,
      lastUpdated: new Date().toISOString()
    },
    alerts: []
  },
  {
    hiveId: 'HIVE-BOX-02',
    boxNumber: 'KVIC-BOX-8802',
    beekeeperId: 'KVIC-BK-102',
    beekeeperName: 'Sunita Devi',
    location: 'Sundarbans Forest Buffer, West Bengal',
    coordinates: { lat: 22.1652, lon: 88.8056 },
    floralSource: 'Sundarbans Wild Mangrove (Khalsi)',
    installationDate: '2024-05-15',
    queenStatus: 'Active',
    colonyHealth: 'GOOD',
    telemetry: {
      internalTemp: 35.2,
      humidity: 61.5,
      weightKg: 34.1,
      weightDelta24h: '+1.8 kg',
      acousticFreqHz: 250,
      co2Ppm: 910,
      batteryLevel: 88,
      lastUpdated: new Date().toISOString()
    },
    alerts: []
  },
  {
    hiveId: 'HIVE-BOX-03',
    boxNumber: 'KVIC-BOX-8803',
    beekeeperId: 'KVIC-BK-103',
    beekeeperName: 'Baljit Singh',
    location: 'Hoshiarpur Mustard Fields, Punjab',
    coordinates: { lat: 31.5273, lon: 75.9149 },
    floralSource: 'Organic Mustard & Eucalyptus',
    installationDate: '2024-02-10',
    queenStatus: 'Active (Marked Blue)',
    colonyHealth: 'WARNING',
    telemetry: {
      internalTemp: 37.8, // Slightly high
      humidity: 48.0,
      weightKg: 22.1,
      weightDelta24h: '-0.3 kg',
      acousticFreqHz: 420, // Swarm preparation alert
      co2Ppm: 1050,
      batteryLevel: 79,
      lastUpdated: new Date().toISOString()
    },
    alerts: ['Acoustic frequency surge: Potential Swarming Alert (Pre-Swarm Piping)']
  }
];

const initialBatch = {
  id: 'HONEY-BATCH-2025-001',
  batchId: 'HONEY-BATCH-2025-001',
  batchName: 'Raw Pure Litchi Monofloral Honey',
  hiveId: 'HIVE-BOX-01',
  beekeeper: 'Rameshwar Verma',
  beekeeperId: 'KVIC-BK-101',
  beekeeperName: 'Rameshwar Verma',
  honeyType: 'Raw Pure Litchi Monofloral Honey',
  floralSource: 'Litchi Blossom (Muzaffarpur)',
  harvestDate: '2025-05-10',
  quantity: 45.0,
  quantityKg: 45.0,
  gpsLocation: { lat: 26.1209, lon: 85.3647 },
  extractionMethod: 'Stainless Steel Centrifugal Cold Extraction (Unheated)',
  status: 'CERTIFIED',
  qualityTest: {
    testedAt: '2025-05-12T10:30:00Z',
    labName: 'National Bee Board & FSSAI Accredited Referral Lab',
    moisturePercent: 17.2,
    nmrPurityScore: 99.4,
    hmf: 12.4,
    c4SugarAdulteration: 'NEGATIVE (< 1.0%)',
    c3SugarAdulteration: 'NEGATIVE',
    pollenDominance: '82% Litchi chinensis Pollen grains',
    antibioticResidues: 'NOT DETECTED (0.0 ppm)',
    fssaiCompliance: 'PASSED (FSSAI Reg. 2.8.2 / AGMARK Grade A)'
  },
  processing: { extractionUnit: 'SS Centrifugal Extractor — Unit A', outputQuantity: 43.2, processor: 'Satara Processing Unit' },
  processingSteps: [
    { step: 'Hive Extraction', date: '2025-05-10', notes: 'Unheated manual comb uncapping and centrifugal spin' },
    { step: 'Micro-Mesh Sediment Filtration', date: '2025-05-11', notes: 'Filtered to 200 microns to retain raw pollen' },
    { step: 'N2-Flushed Glass Bottling', date: '2025-05-13', notes: 'Packed in 500g amber glass jars with tamper seal' }
  ],
  packaging: { jarCount: 90, jarWeight: '500g', sealDate: '2025-05-13', packagingType: 'Glass Jar with Tamper-Evident Seal (500g)' },
  smartContractValidations: {
    moistureValidation: 'PASS (17.2% <= 20.0%)',
    geoFenceValidation: 'PASS (Within Approved Bihar Litchi Belt)',
    nmrPurityValidation: 'PASS (99.4% >= 98.0%)',
    adulterationValidation: 'PASS (100% Pure Raw Honey)',
    hmfValidation: 'PASS (12.4 mg/kg < 40 mg/kg)'
  },
  transactions: [
    { date: '2025-05-10T06:00:00.000Z', event: 'Harvest created', actor: 'Beekeeper' },
    { date: '2025-05-11T09:00:00.000Z', event: 'Harvest verified', actor: 'Tester' },
    { date: '2025-05-12T10:30:00.000Z', event: 'Quality test passed', actor: 'Tester' },
    { date: '2025-05-13T08:00:00.000Z', event: 'Processing completed', actor: 'Processor' },
    { date: '2025-05-13T14:00:00.000Z', event: 'Packaged (90 jars)', actor: 'Processor' },
  ]
};

const seedBatches = [
  {
    id: 'HC-MH-2026-00101', hiveId: 'HIVE-BOX-02', beekeeper: 'Sunita Devi', honeyType: 'Raw Pure Mustard Monofloral Honey',
    floralSource: 'Mustard Field (Sundarbans)', harvestDate: '2026-07-15', quantity: 38.5, extractionMethod: 'Stainless Steel Centrifugal Cold Extraction',
    status: 'PACKAGED', qualityTest: { testedAt: '2026-07-17T10:00:00Z', moisturePercent: 16.8, nmrPurityScore: 99.1, hmf: 11.2, c4SugarAdulteration: 'NEGATIVE' },
    processing: { extractionUnit: 'SS Centrifugal Extractor — Unit A', outputQuantity: 37.0 },
    packaging: { jarCount: 74, jarWeight: '500g', sealDate: '2026-07-18' },
    transactions: [
      { date: '2026-07-15T06:00:00.000Z', event: 'Harvest created', actor: 'Beekeeper' },
      { date: '2026-07-16T09:00:00.000Z', event: 'Harvest verified', actor: 'Tester' },
      { date: '2026-07-17T10:00:00.000Z', event: 'Quality test passed', actor: 'Tester' },
      { date: '2026-07-18T08:00:00.000Z', event: 'Packaged (74 jars)', actor: 'Processor' },
    ]
  },
  {
    id: 'HC-MH-2026-00112', hiveId: 'HIVE-BOX-03', beekeeper: 'Ganesh Pawar', honeyType: 'Raw Pure Forest Honey',
    floralSource: 'Mixed Forest (Satara)', harvestDate: '2026-08-02', quantity: 22.0, extractionMethod: 'Manual Crush & Strain',
    status: 'CERTIFIED', qualityTest: { testedAt: '2026-08-04T11:00:00Z', moisturePercent: 18.5, nmrPurityScore: 98.8, hmf: 15.0, c4SugarAdulteration: 'NEGATIVE' },
    transactions: [
      { date: '2026-08-02T06:30:00.000Z', event: 'Harvest created', actor: 'Beekeeper' },
      { date: '2026-08-03T09:00:00.000Z', event: 'Harvest verified', actor: 'Tester' },
      { date: '2026-08-04T11:00:00.000Z', event: 'Quality test passed', actor: 'Tester' },
    ]
  },
  {
    id: 'HC-MH-2026-00118', hiveId: 'HIVE-BOX-05', beekeeper: 'Harpreet Singh', honeyType: 'Raw Pure Mustard Monofloral Honey',
    floralSource: 'Mustard Field (Hoshiarpur)', harvestDate: '2026-08-20', quantity: 52.0, extractionMethod: 'Stainless Steel Centrifugal Cold Extraction',
    status: 'PROCESSED', qualityTest: { testedAt: '2026-08-22T10:00:00Z', moisturePercent: 17.0, nmrPurityScore: 99.3, hmf: 10.5, c4SugarAdulteration: 'NEGATIVE' },
    processing: { extractionUnit: 'SS Centrifugal Extractor — Unit B', outputQuantity: 50.5 },
    transactions: [
      { date: '2026-08-20T05:45:00.000Z', event: 'Harvest created', actor: 'Beekeeper' },
      { date: '2026-08-21T09:00:00.000Z', event: 'Harvest verified', actor: 'Tester' },
      { date: '2026-08-22T10:00:00.000Z', event: 'Quality test passed', actor: 'Tester' },
      { date: '2026-08-23T08:00:00.000Z', event: 'Processing completed', actor: 'Processor' },
    ]
  },
  {
    id: 'HC-MH-2026-00125', hiveId: 'HIVE-BOX-04', beekeeper: 'Ravi Kumar', honeyType: 'Raw Pure Eucalyptus Honey',
    floralSource: 'Eucalyptus Grove (Muzaffarpur)', harvestDate: '2026-09-01', quantity: 31.0, extractionMethod: 'Stainless Steel Centrifugal Cold Extraction',
    status: 'HARVEST_CREATED',
    transactions: [
      { date: '2026-09-01T07:00:00.000Z', event: 'Harvest created', actor: 'Beekeeper' },
    ]
  },
  {
    id: 'HC-MH-2026-00130', hiveId: 'HIVE-BOX-01', beekeeper: 'Rameshwar Verma', honeyType: 'Raw Pure Sunflower Honey',
    floralSource: 'Sunflower Belt (Bihar)', harvestDate: '2026-09-10', quantity: 28.5, extractionMethod: 'Stainless Steel Centrifugal Cold Extraction',
    status: 'HARVEST_VERIFIED',
    transactions: [
      { date: '2026-09-10T06:00:00.000Z', event: 'Harvest created', actor: 'Beekeeper' },
      { date: '2026-09-11T09:00:00.000Z', event: 'Harvest verified', actor: 'Tester' },
    ]
  },
];

const qualityStandards = {
  fssai: { label: 'FSSAI', version: '2.8.2', moistureMax: 20.0, nmrPurityMin: 98.0, c4SugarMax: 7.0, hmfMax: 40.0, antibioticMax: 0.0, description: 'Food Safety and Standards Authority of India - Honey Standard' },
  agmark: { label: 'AGMARK Grade A', version: '2024', moistureMax: 20.0, nmrPurityMin: 98.0, c4SugarMax: 5.0, hmfMax: 40.0, antibioticMax: 0.0, description: 'Agricultural Marketing Department - Grade A Honey Certification' },
  nices: { label: 'NICES Organic', version: '2023', moistureMax: 18.0, nmrPurityMin: 99.0, c4SugarMax: 3.0, hmfMax: 30.0, antibioticMax: 0.0, description: 'National Programme for Organic Production - Organic Honey Standard' },
  eu: { label: 'EU Codex', version: 'Codex Alimentarius', moistureMax: 20.0, nmrPurityMin: 98.0, c4SugarMax: 7.0, hmfMax: 40.0, antibioticMax: 0.0, description: 'Codex Alimentarius International Standard for Honey (CXS 12-1981)' },
  internal: { label: 'Internal QC', version: 'HC-2026', moistureMax: 18.0, nmrPurityMin: 99.0, c4SugarMax: 5.0, hmfMax: 35.0, antibioticMax: 0.0, description: 'Honey Chain internal quality control - stricter than FSSAI minimums' },
};

const processingFacility = {
  id: 'PU-MAH-001',
  name: 'Satara Honey Processing Unit',
  type: 'Cold Extraction & Packaging Facility',
  address: 'Plot 12, Agro-Industrial Area, Satara, Maharashtra 415001',
  gps: '17.6866°N, 73.9936°E',
  capacity: '500 kg/day',
  certifications: ['FSSAI License #MH-12345678', 'AGMARK Grade A', 'ISO 22000:2018', 'Organic NPOP (Applied)'],
  equipment: [
    { name: 'Stainless Steel Centrifugal Extractor', capacity: '100 kg/batch', status: 'Operational', lastServiced: '2026-08-15' },
    { name: 'Settling Tank (SS304)', capacity: '200L', status: 'Operational', lastServiced: '2026-08-20' },
    { name: 'Micro-Filter System (200 micron)', capacity: '300 kg/hr', status: 'Operational', lastServiced: '2026-07-30' },
    { name: '自动 Filling & Capping Machine', capacity: '60 jars/min', status: 'Operational', lastServiced: '2026-09-01' },
    { name: 'QR Code Labeling Unit', capacity: '80 labels/min', status: 'Operational', lastServiced: '2026-09-05' },
    { name: 'Cold Storage Room', capacity: '5000 kg', status: 'Active, 18°C', lastServiced: '2026-09-10' },
  ],
  blockchainNode: {
    network: 'Polygon Mainnet',
    nodeEndpoint: 'https://polygon-rpc.com',
    contractAddress: '0x7a3B...4f2E',
    lastSync: new Date().toISOString(),
    blocksAnchored: 10,
  },
  operators: [
    { name: 'Suresh Patil', role: 'Plant Manager', badge: 'PU-OPS-001' },
    { name: 'Anita Jadhav', role: 'Quality Controller', badge: 'PU-OPS-002' },
    { name: 'Vikram Deshmukh', role: 'Machine Operator', badge: 'PU-OPS-003' },
  ],
};

module.exports = { seedUsers, sampleBeekeepers, sampleHives, initialBatch, seedBatches, qualityStandards, processingFacility };
