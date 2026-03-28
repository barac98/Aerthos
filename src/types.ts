export type Tier = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export interface PowerCore {
  id: string;
  tier: Tier;
  level: number;
  bonusDmg: number;
}

export type RaceCategory = 'Luminary' | 'Shadow';
export type ParagonRole = 'DMG' | 'SPD' | 'SUP' | 'TNK';

export type ParagonRace = 
  | 'Human' | 'Elf' | 'Dwarf' | 'Giant' | 'Faekin' // Luminary
  | 'Vampire' | 'Dark Elf' | 'Obsidian-Hearted' | 'Stone-Skin' | 'Chimera'; // Shadow

export interface Relic {
  id: string;
  name: string;
  type: 'ATK' | 'SPD' | 'EXP' | 'GOLD';
  multiplier: number;
}

export interface Paragon {
  id: string;
  race: ParagonRace;
  role: ParagonRole;
  level: number;
  exp: number;
  expToNext: number;
  relics: (Relic | null)[]; // 3 slots
}

export interface SunderTree {
  luminary: {
    strike: number; // Global ATK
    ancestry: number; // Global EXP
  };
  shadow: {
    haste: number; // Global Speed
    thirst: number; // % Max HP DMG
  };
}

export interface CelestialAltar {
  auraOfAmbition: number;
  primordialInsight: number;
  sunderSync: number;
  vesselCapacity: number;
  essenceSiphon: number;
  sunderStrike: number;
  celestialMight: number;
  astralHaste: number;
  divineLuck: number;
  eternalVigor: number;
  cosmicReach: number;
  voidResilience: number;
}

export type CelestialAltarUpgrade = keyof CelestialAltar;

export interface GameState {
  floor: number;
  maxFloor: number;
  currentRunMaxFloor: number;
  gold: number;
  essenceFragments: number;
  team: (Paragon | null)[];
  sunderTree: SunderTree;
  celestialAltar: CelestialAltar;
  celestialAltarSlots: CelestialAltarUpgrade[];
  totalAltarUpgrades: number;
  inventory: PowerCore[];
  towerAscent: number; // in meters
  playerLevel: number;
  playerExp: number;
  hasReset: boolean;
  totalResets: number;
  totalInfusions: number;
  stats?: {
    lastLogin: number;
  };
}

export const PARAGON_DATA: Record<ParagonRace, { category: RaceCategory; role: ParagonRole; description: string; baseCost: number }> = {
  'Human': { category: 'Luminary', role: 'DMG', description: 'Crit: 10% chance for 2x DMG', baseCost: 100 },
  'Elf': { category: 'Luminary', role: 'SPD', description: 'Speed: +15% Attack Speed', baseCost: 250 },
  'Dwarf': { category: 'Luminary', role: 'SUP', description: 'Gold: +20% Gold Find', baseCost: 500 },
  'Giant': { category: 'Luminary', role: 'TNK', description: 'Flat DMG: +25 Base DMG', baseCost: 1000 },
  'Faekin': { category: 'Luminary', role: 'SUP', description: 'EXP: +20% EXP Gain', baseCost: 2500 },
  'Vampire': { category: 'Shadow', role: 'DMG', description: 'Life-Thirst: 1% Max HP DMG', baseCost: 5000 },
  'Dark Elf': { category: 'Shadow', role: 'SPD', description: 'Shadow Step: +20% Speed', baseCost: 7500 },
  'Obsidian-Hearted': { category: 'Shadow', role: 'SUP', description: 'Item Find: +25% Luck', baseCost: 10000 },
  'Stone-Skin': { category: 'Shadow', role: 'TNK', description: 'Aura of Dread: +30% Total DMG', baseCost: 25000 },
  'Chimera': { category: 'Shadow', role: 'DMG', description: 'Primal Rage: +5% DMG per Level', baseCost: 50000 },
};

export const TIER_COLORS: Record<Tier, string> = {
  Common: 'text-gray-400',
  Uncommon: 'text-green-400',
  Rare: 'text-blue-400',
  Epic: 'text-purple-400',
  Legendary: 'text-orange-400',
  Mythic: 'text-red-500',
};

export const TIER_CHANCES: Record<Tier, number> = {
  Common: 0.6,
  Uncommon: 0.25,
  Rare: 0.1,
  Epic: 0.04,
  Legendary: 0.009,
  Mythic: 0.001,
};

export const SUNDER_TREE_COSTS = {
  luminary: {
    strike: (level: number) => Math.floor(100 * Math.pow(1.3, level)),
    ancestry: (level: number) => Math.floor(150 * Math.pow(1.3, level)),
  },
  shadow: {
    haste: (level: number) => Math.floor(100 * Math.pow(1.3, level)),
    thirst: (level: number) => Math.floor(200 * Math.pow(1.3, level)),
  }
};

export const CELESTIAL_ALTAR_COST = (totalUpgrades: number) => Math.floor(1 * Math.pow(1.6, totalUpgrades));

export const SLOT_UNLOCKS = [1, 1, 1, 150, 300]; // Slot 1-3 active/summon, 4-5 locked
