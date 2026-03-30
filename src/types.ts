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
  attackCount?: number; // Track attacks for special effects
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

export const PARAGON_DATA: Record<ParagonRace, { category: RaceCategory; role: ParagonRole; description: string; lore: string; baseCost: number; asset: string }> = {
  'Human': { 
    category: 'Luminary', 
    role: 'DMG', 
    description: 'Ambition: +0.02 Flat DMG per Floor Height', 
    lore: 'A survivor of the first Sundering, carrying a blade forged from the last shard of the Human Kingdom’s throne.',
    baseCost: 100,
    asset: 'kaelen_card.png'
  },
  'Elf': { 
    category: 'Luminary', 
    role: 'SPD', 
    description: 'Rapid Crit: +10% Crit Chance. +2% Crit DMG per Floor', 
    lore: 'She moves through the rifts like a ghost, using the dark magic of the Sundered Realm to strike faster than light.',
    baseCost: 250,
    asset: 'elara.png'
  },
  'Dwarf': { category: 'Luminary', role: 'SUP', description: 'Gold: +20% Gold Find', lore: 'Master of the deep forges, his greed is only matched by his skill.', baseCost: 500, asset: 'dwarf.png' },
  'Giant': { 
    category: 'Luminary', 
    role: 'TNK', 
    description: 'Mountain Crush: 0.5x Speed, 3x DMG. 10th Hit: 10x AoE DMG', 
    lore: 'A lumbering mountain of stone, Oghul doesn\'t fight; he simply exists, and the Tower crumbles around him.',
    baseCost: 1000,
    asset: 'oghul.png'
  },
  'Faekin': { category: 'Luminary', role: 'SUP', description: 'EXP: +20% EXP Gain', lore: 'Ethereal beings that feed on the memories of the tower.', baseCost: 2500, asset: 'faekin.png' },
  'Vampire': { 
    category: 'Shadow', 
    role: 'DMG', 
    description: 'Life-Thirst: 0.5% Max HP DMG. 2x vs Bosses', 
    lore: 'Once a noble, Mor\'Goth\'s spell turned his ambition into an eternal hunger that feeds on the Tower\'s monsters.',
    baseCost: 5000,
    asset: 'silas_card.png'
  },
  'Dark Elf': { category: 'Shadow', role: 'SPD', description: 'Shadow Step: +20% Speed', lore: 'Exiled from the light, they embrace the cold embrace of the void.', baseCost: 7500, asset: 'dark_elf.png' },
  'Obsidian-Hearted': { category: 'Shadow', role: 'SUP', description: 'Item Find: +25% Luck', lore: 'Beings made of the very stone that forms the Spire.', baseCost: 10000, asset: 'obsidian.png' },
  'Stone-Skin': { category: 'Shadow', role: 'TNK', description: 'Aura of Dread: +30% Total DMG', lore: 'Their skin is as hard as the foundations of Aerthos.', baseCost: 25000, asset: 'stone_skin.png' },
  'Chimera': { category: 'Shadow', role: 'DMG', description: 'Primal Rage: +5% DMG per Level', lore: 'A fusion of a thousand beasts, driven by pure instinct.', baseCost: 50000, asset: 'chimera.png' },
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
