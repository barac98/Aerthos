/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sword, 
  Zap, 
  Coins, 
  ChevronUp, 
  FlaskConical, 
  Package, 
  RotateCcw, 
  Trophy,
  User,
  Users,
  Lock,
  Backpack,
  Star,
  Info,
  Shield,
  Sparkles,
  Flame,
  Eye,
  Anchor,
  TrendingUp,
  Target,
  Heart,
  Activity,
  Dna,
  History,
  X,
  AlertTriangle,
  Settings,
  Plus,
} from 'lucide-react';
import { cn } from './lib/utils';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { 
  GameState, 
  Paragon, 
  ParagonRace, 
  SunderTree,
  CelestialAltar,
  CelestialAltarUpgrade,
  PowerCore, 
  Tier, 
  TIER_COLORS, 
  TIER_CHANCES, 
  SUNDER_TREE_COSTS,
  CELESTIAL_ALTAR_COST,
  PARAGON_DATA,
  SLOT_UNLOCKS
} from './types';

const TICK_RATE = 1000; // 1 tick per second
const BASE_EXP_REWARD = 10;
const BASE_GOLD_REWARD = 5;

const ALTAR_UPGRADES: CelestialAltarUpgrade[] = [
  'auraOfAmbition',
  'primordialInsight',
  'sunderSync',
  'vesselCapacity',
  'essenceSiphon',
  'sunderStrike',
  'celestialMight',
  'astralHaste',
  'divineLuck',
  'eternalVigor',
  'cosmicReach',
  'voidResilience'
];

const ALTAR_NODE_DATA: Record<CelestialAltarUpgrade, { name: string; icon: any; color: string; desc: string; rarity: 'Common' | 'Rare' | 'Legendary'; image: string }> = {
  auraOfAmbition: { 
    name: 'Aura of Ambition', 
    icon: Coins, 
    color: 'text-yellow-600', 
    desc: '+25% Gold', 
    rarity: 'Legendary',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAplsuBbuZ6Yu1vQXJFIt5GyZqK6FHnT7FT546Arv6XdYuwwA-RJN0LC1mHAoRAuIwiVY-hXALtULNmcOrvs7WoppFMNOqb4rH5MBvM3Z8hq1FuEgueyS2TqA4H4tt7DZiKy6dbE0Te40x97k7HRiAG94T7qf2R9wD90fBJG3bTI0QPYe52ksKJxvtJBcYwCQJ4f2WFcKe5FDW1mN0n477gSK2KOrH4kUomr2fEjuElrFlWYXxcytvsYn9mwAIQfmxKBz9Pcsi52sg'
  },
  primordialInsight: { 
    name: 'Primordial Insight', 
    icon: Eye, 
    color: 'text-blue-600', 
    desc: '+20% EXP', 
    rarity: 'Rare',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgdEufyLbP2gzfu5nW1xkfi1dag7zSVKse99_XHJbXTYTdW7OInwOt4-mCAMIEPr_En52K64-fhT6jVRpIYOARdRDT3ucOUvbc6EtNRHZBE35R-BPhbTc_0wjixg9lTRv3MpPjiJUwtrKx8iOzvYGMQZEfPNvjCbXPoNwsw--wMR8jS93-mdNYg9Hsm0_jxiPuLaN0_HLhAZM4snTHWIf-ciK95tdohzcCoJZ_j3sBnJ8EgSiDuOxUBx4b4WWw1WwNitx271U-i84'
  },
  sunderSync: { 
    name: 'Sunder-Sync', 
    icon: Zap, 
    color: 'text-cyan-600', 
    desc: '1.05x Efficiency', 
    rarity: 'Rare',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2gh3MtMawHMER2O9Z3s5dwNFlXcj-2tR8epcvQP01lf5MFCXnASEj8dWOXKAJ9TaCA2pPQi-_NzLeGSR46mH8MSEP2dOTyNXQmJQIhy2rAzgecsq6fLkYFCWSk4p_p6TPFJkJTsfMdMgtwsJaNCEy4PBKjw5dl3srz6NvNB47RNjajMaoySG7Rig9yGm1sgLf_dEx8A4-uOSTR4V0Zl3wQX3io4CLGDU3548nW2aeX7aojU0coIZ-SJzD-P9LVTiZvNyAJlhK34c'
  },
  vesselCapacity: { 
    name: 'Vessel Capacity', 
    icon: Anchor, 
    color: 'text-indigo-600', 
    desc: '-2 Floor Req', 
    rarity: 'Common',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgdEufyLbP2gzfu5nW1xkfi1dag7zSVKse99_XHJbXTYTdW7OInwOt4-mCAMIEPr_En52K64-fhT6jVRpIYOARdRDT3ucOUvbc6EtNRHZBE35R-BPhbTc_0wjixg9lTRv3MpPjiJUwtrKx8iOzvYGMQZEfPNvjCbXPoNwsw--wMR8jS93-mdNYg9Hsm0_jxiPuLaN0_HLhAZM4snTHWIf-ciK95tdohzcCoJZ_j3sBnJ8EgSiDuOxUBx4b4WWw1WwNitx271U-i84'
  },
  essenceSiphon: { 
    name: 'Essence Siphon', 
    icon: TrendingUp, 
    color: 'text-emerald-600', 
    desc: '+10% Fragments', 
    rarity: 'Rare',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2gh3MtMawHMER2O9Z3s5dwNFlXcj-2tR8epcvQP01lf5MFCXnASEj8dWOXKAJ9TaCA2pPQi-_NzLeGSR46mH8MSEP2dOTyNXQmJQIhy2rAzgecsq6fLkYFCWSk4p_p6TPFJkJTsfMdMgtwsJaNCEy4PBKjw5dl3srz6NvNB47RNjajMaoySG7Rig9yGm1sgLf_dEx8A4-uOSTR4V0Zl3wQX3io4CLGDU3548nW2aeX7aojU0coIZ-SJzD-P9LVTiZvNyAJlhK34c'
  },
  sunderStrike: { 
    name: 'Sunder-Strike', 
    icon: Target, 
    color: 'text-red-600', 
    desc: '+1% Crit', 
    rarity: 'Rare',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2gh3MtMawHMER2O9Z3s5dwNFlXcj-2tR8epcvQP01lf5MFCXnASEj8dWOXKAJ9TaCA2pPQi-_NzLeGSR46mH8MSEP2dOTyNXQmJQIhy2rAzgecsq6fLkYFCWSk4p_p6TPFJkJTsfMdMgtwsJaNCEy4PBKjw5dl3srz6NvNB47RNjajMaoySG7Rig9yGm1sgLf_dEx8A4-uOSTR4V0Zl3wQX3io4CLGDU3548nW2aeX7aojU0coIZ-SJzD-P9LVTiZvNyAJlhK34c'
  },
  celestialMight: { 
    name: 'Celestial Might', 
    icon: Sword, 
    color: 'text-orange-600', 
    desc: '+15% Damage', 
    rarity: 'Legendary',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAplsuBbuZ6Yu1vQXJFIt5GyZqK6FHnT7FT546Arv6XdYuwwA-RJN0LC1mHAoRAuIwiVY-hXALtULNmcOrvs7WoppFMNOqb4rH5MBvM3Z8hq1FuEgueyS2TqA4H4tt7DZiKy6dbE0Te40x97k7HRiAG94T7qf2R9wD90fBJG3bTI0QPYe52ksKJxvtJBcYwCQJ4f2WFcKe5FDW1mN0n477gSK2KOrH4kUomr2fEjuElrFlWYXxcytvsYn9mwAIQfmxKBz9Pcsi52sg'
  },
  astralHaste: { 
    name: 'Astral Haste', 
    icon: Activity, 
    color: 'text-purple-600', 
    desc: '+10% Speed', 
    rarity: 'Rare',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2gh3MtMawHMER2O9Z3s5dwNFlXcj-2tR8epcvQP01lf5MFCXnASEj8dWOXKAJ9TaCA2pPQi-_NzLeGSR46mH8MSEP2dOTyNXQmJQIhy2rAzgecsq6fLkYFCWSk4p_p6TPFJkJTsfMdMgtwsJaNCEy4PBKjw5dl3srz6NvNB47RNjajMaoySG7Rig9yGm1sgLf_dEx8A4-uOSTR4V0Zl3wQX3io4CLGDU3548nW2aeX7aojU0coIZ-SJzD-P9LVTiZvNyAJlhK34c'
  },
  divineLuck: { 
    name: 'Divine Luck', 
    icon: Sparkles, 
    color: 'text-pink-600', 
    desc: '+15% Luck', 
    rarity: 'Rare',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2gh3MtMawHMER2O9Z3s5dwNFlXcj-2tR8epcvQP01lf5MFCXnASEj8dWOXKAJ9TaCA2pPQi-_NzLeGSR46mH8MSEP2dOTyNXQmJQIhy2rAzgecsq6fLkYFCWSk4p_p6TPFJkJTsfMdMgtwsJaNCEy4PBKjw5dl3srz6NvNB47RNjajMaoySG7Rig9yGm1sgLf_dEx8A4-uOSTR4V0Zl3wQX3io4CLGDU3548nW2aeX7aojU0coIZ-SJzD-P9LVTiZvNyAJlhK34c'
  },
  eternalVigor: { 
    name: 'Eternal Vigor', 
    icon: Heart, 
    color: 'text-rose-600', 
    desc: '+20% HP', 
    rarity: 'Common',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyt4BXrkxBqFS4oXO3zuXdkZEB22nzlU4FejwHEWAXjlDjNOQzueXG6uSmx3SAynA30KY3T1KZcl8_oKt73H_R8AoW461qw_024UlCBB-fcQ1cwO9_WuhcoGyZbTxftJDMgiMAy53KquIiicBVE4uWNz6k2faRMz12V4g3RdMWOtpuij30CfGbyrQVl33ZgnMKhUyIU5U5Y9L-xKU0qQrEMXBW7Pcdpe8EpUlaxwb0h9C0QGkcyZCcUHlvKdhVDZPMVTMVGftSHmQ'
  },
  cosmicReach: { 
    name: 'Cosmic Reach', 
    icon: Flame, 
    color: 'text-amber-600', 
    desc: '+50 Flat DMG', 
    rarity: 'Common',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyt4BXrkxBqFS4oXO3zuXdkZEB22nzlU4FejwHEWAXjlDjNOQzueXG6uSmx3SAynA30KY3T1KZcl8_oKt73H_R8AoW461qw_024UlCBB-fcQ1cwO9_WuhcoGyZbTxftJDMgiMAy53KquIiicBVE4uWNz6k2faRMz12V4g3RdMWOtpuij30CfGbyrQVl33ZgnMKhUyIU5U5Y9L-xKU0qQrEMXBW7Pcdpe8EpUlaxwb0h9C0QGkcyZCcUHlvKdhVDZPMVTMVGftSHmQ'
  },
  voidResilience: { 
    name: 'Void Resilience', 
    icon: Shield, 
    color: 'text-slate-600', 
    desc: '+2% Reduction', 
    rarity: 'Common',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDij79vM2a62YsyT3nIxfGfv3fCE6r9ho7mXUpf8wm-3NPoA2n24WazIqgzWkyC4jn8D7YbsTpTVdwRbctwUTwlbP2zRzsSnk4Bz-MiAtYNjt_qpFZ8_w-1SEAzTCWh59vIiol-qXhcwDjZ7xaLr8e22NSibwtRl0DgYCTyTEOIuJoZIRUYRull0SUfWdo3TNg0kr8eThRiaTrwcYUG3sFne1OlKw8unydBh1kBOsnoUJEfM3wRA7OdbXDgsfGws5QDJCeaKekvRQk'
  },
};

const ALTAR_POSITIONS = [
  'top-0 left-1/2 -translate-x-1/2',
  'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  'top-1/2 left-0 -translate-y-1/2',
  'top-1/2 right-0 -translate-y-1/2',
  'bottom-0 left-1/2 -translate-x-1/2'
];

export default function App() {
  // --- Auth State ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offlineGains, setOfflineGains] = useState<{ gold: number; timeAway: number } | null>(null);

  // --- Game State ---
  const [state, setState] = useState<GameState>(() => {
    const defaultState: GameState = {
      floor: 1,
      maxFloor: 1,
      currentRunMaxFloor: 1,
      gold: 0,
      essenceFragments: 0,
      team: [
        { id: 'aris', race: 'Human', role: 'DMG', level: 1, exp: 0, expToNext: 100, relics: [null, null, null] },
        { id: 'elowen', race: 'Elf', role: 'SPD', level: 1, exp: 0, expToNext: 100, relics: [null, null, null] },
        null, null, null
      ],
      sunderTree: {
        luminary: { strike: 0, ancestry: 0 },
        shadow: { haste: 0, thirst: 0 }
      },
      celestialAltar: {
        auraOfAmbition: 0,
        primordialInsight: 0,
        sunderSync: 0,
        vesselCapacity: 0,
        essenceSiphon: 0,
        sunderStrike: 0,
        celestialMight: 0,
        astralHaste: 0,
        divineLuck: 0,
        eternalVigor: 0,
        cosmicReach: 0,
        voidResilience: 0,
      },
      celestialAltarSlots: [], // Will be populated below
      totalAltarUpgrades: 0,
      inventory: [],
      towerAscent: 0,
      playerLevel: 1,
      playerExp: 0,
      hasReset: false,
      totalResets: 0,
      totalInfusions: 0,
    };
    // Initial slots
    defaultState.celestialAltarSlots = Array(5).fill(null).map(() => ALTAR_UPGRADES[Math.floor(Math.random() * ALTAR_UPGRADES.length)]);

    const saved = localStorage.getItem('creature-tower-save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: if old prestigeOrbs exist, convert to essenceFragments
        if (parsed.prestigeOrbs !== undefined && parsed.essenceFragments === undefined) {
          parsed.essenceFragments = parsed.prestigeOrbs;
        }
        // Migration: if old globalUpgrades exist, convert to sunderTree
        if (parsed.globalUpgrades !== undefined && parsed.sunderTree === undefined) {
          parsed.sunderTree = {
            might: parsed.globalUpgrades.atk || 0,
            haste: parsed.globalUpgrades.speed || 0,
            luck: parsed.globalUpgrades.luck || 0
          };
        }
        // Migration: if old dmgSlot/supportSlot exist, convert to team
        if (parsed.team === undefined && (parsed.dmgSlot || parsed.supportSlot)) {
          const mapOldToNew = (oldType: string): ParagonRace => {
            if (oldType === 'Warrior') return 'Human';
            if (oldType === 'Slayer') return 'Vampire';
            if (oldType === 'Merchant') return 'Dwarf';
            if (oldType === 'Bard') return 'Elf';
            return 'Human'; // Default fallback
          };

          parsed.team = [
            parsed.dmgSlot ? { ...parsed.dmgSlot, race: mapOldToNew(parsed.dmgSlot.type), id: 'dmg' } : null,
            parsed.supportSlot ? { ...parsed.supportSlot, race: mapOldToNew(parsed.supportSlot.type), id: 'support' } : null,
            null, null, null
          ];
        }

        // Migration for Celestial Altar
        const oldAltar = parsed.celestialAltar || {};
        const newAltar = { ...defaultState.celestialAltar };
        if (oldAltar.eternalAmbition !== undefined) newAltar.auraOfAmbition = oldAltar.eternalAmbition;
        if (oldAltar.vesselAttunement !== undefined) newAltar.vesselCapacity = oldAltar.vesselAttunement;
        if (oldAltar.essenceHarvest !== undefined) newAltar.essenceSiphon = oldAltar.essenceHarvest;
        
        // Sanitize slots to ensure they only contain valid keys
        const sanitizedSlots = (parsed.celestialAltarSlots || defaultState.celestialAltarSlots).map((slot: any) => 
          ALTAR_UPGRADES.includes(slot) ? slot : ALTAR_UPGRADES[Math.floor(Math.random() * ALTAR_UPGRADES.length)]
        );

        // Calculate total upgrades if not present
        let totalUpgrades = parsed.totalAltarUpgrades;
        if (totalUpgrades === undefined) {
          totalUpgrades = Object.values(newAltar).reduce((a, b) => (a as number) + (b as number), 0) as number;
        }

        return { 
          ...defaultState, 
          ...parsed,
          sunderTree: {
            ...defaultState.sunderTree,
            ...(parsed.sunderTree || {})
          },
          celestialAltar: {
            ...newAltar,
            ...(parsed.celestialAltar || {})
          },
          celestialAltarSlots: sanitizedSlots,
          totalAltarUpgrades: totalUpgrades,
          currentRunMaxFloor: parsed.currentRunMaxFloor || parsed.maxFloor || 1,
          team: (parsed.team || defaultState.team).map((p: any) => {
            if (!p) return null;
            const race = p.race as ParagonRace;
            const data = PARAGON_DATA[race];
            if (!data) return null; // Remove invalid races
            return {
              ...p,
              role: p.role || data.role,
              relics: p.relics || [null, null, null]
            };
          }),
          inventory: parsed.inventory || defaultState.inventory
        };
      } catch (e) {
        console.error("Failed to parse save:", e);
        return defaultState;
      }
    }
    return defaultState;
  });

  const [enemyHP, setEnemyHP] = useState(0);
  const [enemyMaxHP, setEnemyMaxHP] = useState(0);
  const [activeTab, setActiveTab] = useState<'team' | 'sunder-tree' | 'altar' | 'lore'>('team');
  const [combatLog, setCombatLog] = useState<{ id: number; text: string; type: 'dmg' | 'gold' | 'loot' }[]>([]);
  const [floatingGold, setFloatingGold] = useState<{ id: number; amount: number; x: number; y: number }[]>([]);
  const [attackProgress, setAttackProgress] = useState(0);
  const [showHardResetConfirm, setShowHardResetConfirm] = useState(false);
  const [showLegacyModal, setShowLegacyModal] = useState(false);
  const [isAltarFlipping, setIsAltarFlipping] = useState<number | null>(null);
  
  const logIdRef = useRef(0);
  const lastSaveRef = useRef(0);

  // --- Auth & Firestore ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      
      if (firebaseUser) {
        // Load from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const lastLogin = data.stats?.lastLogin || Date.now();
          const now = Date.now();
          const timeAway = (now - lastLogin) / 1000; // seconds

          // Calculate Offline Gains
          if (timeAway > 60) { // At least 1 minute away
            // We need to estimate GoldPerMin from the saved state
            // For simplicity, we'll calculate it from the loaded stats
            // This is a bit tricky since teamStats is a derived value
            // We'll use a simplified version for offline gains
            const goldPerSec = 5; // Base
            const gains = Math.floor(timeAway * (goldPerSec * 0.5));
            setOfflineGains({ gold: gains, timeAway });
            
            setState(prev => ({
              ...prev,
              ...data,
              gold: (data.gold || 0) + gains
            }));
          } else {
            setState(prev => ({ ...prev, ...data }));
          }
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const saveToFirestore = useCallback(async (currentState: GameState) => {
    if (!user) return;
    const now = Date.now();
    if (now - lastSaveRef.current < 5000) return; // Throttle 5s
    
    lastSaveRef.current = now;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...currentState,
        stats: {
          ...currentState.stats,
          lastLogin: now
        }
      }, { merge: true });
    } catch (e) {
      console.error("Failed to save to Firestore:", e);
    }
  }, [user]);

  useEffect(() => {
    if (user && !loading) {
      saveToFirestore(state);
    }
  }, [state, user, loading, saveToFirestore]);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('creature-tower-save', JSON.stringify(state));
  }, [state]);

  // --- Initialization ---
  useEffect(() => {
    spawnEnemy(state.floor);
  }, []); // Spawn enemy on mount

  // --- Derived Stats ---
  const prestigeMultiplier = useMemo(() => {
    const base = 1 + (state.essenceFragments * 0.15);
    const siphon = 1 + ((state.celestialAltar?.essenceSiphon || 0) * 0.1);
    return base * siphon;
  }, [state.essenceFragments, state.celestialAltar?.essenceSiphon]);
  
  const coreBonus = useMemo(() => {
    return state.inventory.reduce((acc, core) => acc + core.bonusDmg, 0);
  }, [state.inventory]);

  const altarSyncMult = useMemo(() => Math.pow(1.05, state.celestialAltar?.sunderSync || 0), [state.celestialAltar?.sunderSync]);

  const globalAtkMult = useMemo(() => 1 + ((state.sunderTree?.luminary?.strike || 0) * 0.1 * altarSyncMult), [state.sunderTree?.luminary?.strike, altarSyncMult]);
  const globalSpeedMult = useMemo(() => 1 + ((state.sunderTree?.shadow?.haste || 0) * 0.05 * altarSyncMult), [state.sunderTree?.shadow?.haste, altarSyncMult]);
  const globalExpMult = useMemo(() => 1 + ((state.sunderTree?.luminary?.ancestry || 0) * 0.1 * altarSyncMult), [state.sunderTree?.luminary?.ancestry, altarSyncMult]);
  const globalHpDmgMult = useMemo(() => (state.sunderTree?.shadow?.thirst || 0) * 0.005 * altarSyncMult, [state.sunderTree?.shadow?.thirst, altarSyncMult]);

  const teamStats = useMemo(() => {
    let totalAtk = 0;
    let totalSpeed = 0;
    let totalHpPercent = globalHpDmgMult;
    let totalGoldMult = 1 + ((state.celestialAltar?.auraOfAmbition || 0) * 0.25);
    let totalExpMult = globalExpMult * (1 + ((state.celestialAltar?.primordialInsight || 0) * 0.20));
    let totalLuckMult = (1 + ((state.celestialAltar?.divineLuck || 0) * 0.15));
    let activeParagons = 0;

    const vesselReduction = (state.celestialAltar?.vesselCapacity || 0) * 2;
    const celestialDmgMult = 1 + ((state.celestialAltar?.celestialMight || 0) * 0.15);
    const astralSpeedMult = 1 + ((state.celestialAltar?.astralHaste || 0) * 0.10);
    const cosmicFlatDmg = (state.celestialAltar?.cosmicReach || 0) * 50;

    state.team.forEach((paragon, index) => {
      const requiredFloor = Math.max(1, SLOT_UNLOCKS[index] - vesselReduction);
      if (!paragon || state.floor < requiredFloor) return;
      activeParagons++;
      
      const data = PARAGON_DATA[paragon.race];
      if (!data) return;

      // Relic Multipliers
      const relicAtkMult = 1 + (paragon.relics.filter(r => r?.type === 'ATK').length * 0.2);
      const relicSpdMult = 1 + (paragon.relics.filter(r => r?.type === 'SPD').length * 0.1);
      const relicExpMult = 1 + (paragon.relics.filter(r => r?.type === 'EXP').length * 0.15);
      const relicGoldMult = 1 + (paragon.relics.filter(r => r?.type === 'GOLD').length * 0.15);

      let baseAtk = (10 + (paragon.level * 2)) * relicAtkMult;
      let baseSpeed = 1 * relicSpdMult;
      
      totalExpMult += (relicExpMult - 1);
      totalGoldMult += (relicGoldMult - 1);
      
      // Race Specifics
      if (paragon.race === 'Elf') baseSpeed *= 1.15;
      if (paragon.race === 'Giant') baseAtk += 25;
      if (paragon.race === 'Dwarf') totalGoldMult += 0.2;
      if (paragon.race === 'Faekin') totalExpMult += 0.2;
      if (paragon.race === 'Vampire') totalHpPercent += 0.01;
      if (paragon.race === 'Dark Elf') baseSpeed *= 1.2;
      if (paragon.race === 'Obsidian-Hearted') totalLuckMult *= 1.25;
      if (paragon.race === 'Stone-Skin') baseAtk *= 1.3;
      if (paragon.race === 'Chimera') baseAtk *= (1 + (paragon.level * 0.05));

      totalAtk += baseAtk;
      totalSpeed += baseSpeed;
    });

    const avgSpeed = activeParagons > 0 ? (totalSpeed / activeParagons) : 1;

    return {
      atk: (totalAtk + coreBonus + cosmicFlatDmg) * globalAtkMult * prestigeMultiplier * celestialDmgMult,
      speed: avgSpeed * globalSpeedMult * astralSpeedMult,
      hpPercent: totalHpPercent * (1 + ((state.celestialAltar?.eternalVigor || 0) * 0.2)),
      goldMult: totalGoldMult,
      expMult: totalExpMult,
      luckMult: totalLuckMult,
      critChance: (state.celestialAltar?.sunderStrike || 0) * 0.01,
      dmgReduction: Math.min(0.8, (state.celestialAltar?.voidResilience || 0) * 0.02),
      teamDps: (totalAtk + coreBonus + cosmicFlatDmg) * globalAtkMult * prestigeMultiplier * celestialDmgMult * (avgSpeed * globalSpeedMult * astralSpeedMult) * (1 + (state.totalInfusions * 0.05))
    };
  }, [state.team, state.floor, globalAtkMult, globalSpeedMult, globalExpMult, globalHpDmgMult, coreBonus, prestigeMultiplier, state.celestialAltar, state.totalInfusions]);

  const towerLore = useMemo(() => {
    if (state.floor <= 100) return { name: 'Human Kingdom', color: 'from-green-900/20' };
    if (state.floor <= 200) return { name: 'Subterranean Cities', color: 'from-blue-900/20' };
    return { name: 'Shadow Realm', color: 'from-purple-900/20' };
  }, [state.floor]);

  // --- Combat Logic ---
  const spawnEnemy = useCallback((floor: number) => {
    const isBoss = floor % 10 === 0;
    const hp = Math.max(50, Math.floor(50 * Math.pow(1.18, floor) * (isBoss ? 5 : 1)));
    setEnemyHP(hp);
    setEnemyMaxHP(hp);
  }, []);

  const addLog = useCallback((text: string, type: 'dmg' | 'gold' | 'loot') => {
    const id = ++logIdRef.current;
    setCombatLog(prev => [{ id, text, type }, ...prev].slice(0, 5));
  }, []);

  const handleEnemyDefeat = useCallback(() => {
    const isBoss = state.floor % 10 === 0;
    const expReward = Math.floor(BASE_EXP_REWARD * Math.pow(1.1, state.floor) * teamStats.expMult);
    const goldReward = Math.floor(BASE_GOLD_REWARD * Math.pow(1.15, state.floor) * teamStats.goldMult);
    
    // Floating gold animation
    const goldId = Date.now();
    setFloatingGold(prev => [...prev, { id: goldId, amount: goldReward, x: 50 + (Math.random() * 20 - 10), y: 50 + (Math.random() * 20 - 10) }]);
    setTimeout(() => {
      setFloatingGold(prev => prev.filter(g => g.id !== goldId));
    }, 1000);

    addLog(`Defeated enemy! +${goldReward} Gold, +${expReward} EXP`, 'gold');

    // Loot chance
    const lootChance = 0.1 * teamStats.luckMult;
    if (Math.random() < lootChance) {
      const rand = Math.random();
      let cumulative = 0;
      let selectedTier: Tier = 'Common';
      for (const [tier, chance] of Object.entries(TIER_CHANCES)) {
        cumulative += chance;
        if (rand < cumulative) {
          selectedTier = tier as Tier;
          break;
        }
      }
      
      const bonus = Math.floor(state.floor * (Object.keys(TIER_CHANCES).indexOf(selectedTier) + 1));
      const newCore: PowerCore = {
        id: Math.random().toString(36).substr(2, 9),
        tier: selectedTier,
        level: 1,
        bonusDmg: bonus
      };
      
      setState(prev => ({
        ...prev,
        inventory: [...prev.inventory, newCore]
      }));
      addLog(`Dropped ${selectedTier} Power Core!`, 'loot');
    }

    // Relic Drop Logic
    if (Math.random() < 0.05) { // 5% chance
      const relicTypes = ['ATK', 'SPD', 'EXP', 'GOLD'];
      const type = relicTypes[Math.floor(Math.random() * relicTypes.length)];
      
      setState(prev => {
        const newTeam = [...prev.team];
        let equipped = false;
        
        // Try to find an empty slot in any paragon
        for (let i = 0; i < newTeam.length; i++) {
          const p = newTeam[i];
          if (!p) continue;
          const emptyIndex = p.relics.findIndex(r => r === null);
          if (emptyIndex !== -1) {
            const updatedRelics = [...p.relics];
            updatedRelics[emptyIndex] = { 
              id: Math.random().toString(36).substr(2, 9),
              name: `${type} Rune`,
              type: type as 'ATK' | 'SPD' | 'EXP' | 'GOLD',
              multiplier: 1.2 
            };
            newTeam[i] = { ...p, relics: updatedRelics };
            equipped = true;
            break;
          }
        }
        
        if (equipped) {
          addLog(`[RELIC] Found a ${type} Rune!`, 'loot');
        }
        
        return { ...prev, team: newTeam };
      });
    }

    setState(prev => {
      const updatedTeam = prev.team.map((paragon, index) => {
        const vesselReduction = (prev.celestialAltar?.vesselAttunement || 0) * 2;
        const requiredFloor = Math.max(1, SLOT_UNLOCKS[index] - vesselReduction);
        if (!paragon || prev.floor < requiredFloor) return paragon;
        let { level, exp, expToNext } = paragon;
        exp += expReward;
        while (exp >= expToNext) {
          exp -= expToNext;
          level++;
          expToNext = Math.max(100, Math.floor(expToNext * 1.2));
        }
        return { ...paragon, level, exp, expToNext };
      });

      const nextFloor = prev.floor + 1;
      let nextPlayerExp = prev.playerExp + 10;
      let nextPlayerLevel = prev.playerLevel;
      if (nextPlayerExp >= 100) {
        nextPlayerExp -= 100;
        nextPlayerLevel++;
      }

      return {
        ...prev,
        floor: nextFloor,
        maxFloor: Math.max(prev.maxFloor, nextFloor),
        currentRunMaxFloor: Math.max(prev.currentRunMaxFloor, nextFloor),
        gold: prev.gold + goldReward,
        team: updatedTeam,
        towerAscent: prev.towerAscent + 100,
        playerExp: nextPlayerExp,
        playerLevel: nextPlayerLevel
      };
    });

    spawnEnemy(state.floor + 1);
  }, [state.floor, teamStats, spawnEnemy, addLog]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!authReady || loading) return;
      
      // Attack!
      let damage = teamStats.teamDps + (enemyMaxHP * teamStats.hpPercent);
      
      // Crit Logic
      const critChance = teamStats.critChance || 0;
      const hasHuman = state.team.some(p => p?.race === 'Human');
      const finalCritChance = hasHuman ? critChance + 0.1 : critChance;
      
      if (Math.random() < finalCritChance) {
        damage *= 2;
        addLog("CRITICAL HIT!", 'dmg');
      }

      if (isNaN(damage) || damage < 0) damage = 1;

      setEnemyHP(curr => {
        const remaining = curr - damage;
        if (remaining <= 0) {
          handleEnemyDefeat();
          return 0;
        }
        return remaining;
      });
    }, TICK_RATE);

    return () => clearInterval(interval);
  }, [teamStats, enemyMaxHP, handleEnemyDefeat, state.team, addLog, authReady, loading]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Login failed:", e);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const infuseGold = () => {
    if (state.gold > 0) {
      setState(prev => ({
        ...prev,
        totalInfusions: prev.totalInfusions + 1,
        gold: 0
      }));
      addLog("Gold infused into the Sunder-Tree!", 'loot');
    }
  };

  // --- Actions ---
  const summonParagon = (slotIndex: number) => {
    const races: ParagonRace[] = Object.keys(PARAGON_DATA) as ParagonRace[];
    const randomRace = races[Math.floor(Math.random() * races.length)];
    const data = PARAGON_DATA[randomRace];
    
    if (state.gold >= data.baseCost) {
      setState(prev => {
        const newTeam = [...prev.team];
        newTeam[slotIndex] = {
          id: Math.random().toString(36).substr(2, 9),
          race: randomRace,
          role: data.role,
          level: 1,
          exp: 0,
          expToNext: 100,
          relics: [null, null, null]
        };
        return {
          ...prev,
          gold: prev.gold - data.baseCost,
          team: newTeam
        };
      });
      addLog(`Summoned ${randomRace} Paragon!`, 'loot');
    }
  };

  const upgradeSunder = (branch: 'luminary' | 'shadow', type: string) => {
    if (!state.sunderTree) return;
    const currentLevel = (state.sunderTree as any)[branch][type];
    const cost = (SUNDER_TREE_COSTS as any)[branch][type](currentLevel);
    if (state.gold >= cost) {
      setState(prev => ({
        ...prev,
        gold: prev.gold - cost,
        sunderTree: {
          ...prev.sunderTree,
          [branch]: {
            ...(prev.sunderTree as any)[branch],
            [type]: currentLevel + 1
          }
        }
      }));
    }
  };

  const recruitParagon = (slotIndex: number, race: ParagonRace) => {
    const data = PARAGON_DATA[race];
    if (!data) return;
    if (state.gold >= data.baseCost) {
      setState(prev => {
        const newTeam = [...prev.team];
        newTeam[slotIndex] = {
          id: Math.random().toString(36).substr(2, 9),
          race,
          role: data.role,
          level: 1,
          exp: 0,
          expToNext: 100,
          relics: [null, null, null]
        };
        return {
          ...prev,
          gold: prev.gold - data.baseCost,
          team: newTeam
        };
      });
      addLog(`Recruited ${race} Paragon!`, 'loot');
    }
  };

  const fuseCores = () => {
    if (state.inventory.length < 3) return;
    // Simple fusion: take top 3, make 1 better one
    const sorted = [...state.inventory].sort((a, b) => b.bonusDmg - a.bonusDmg);
    const used = sorted.slice(0, 3);
    const remaining = sorted.slice(3);
    
    const avgBonus = used.reduce((a, b) => a + b.bonusDmg, 0) / 3;
    const newBonus = Math.floor(avgBonus * 1.5) + 5;
    
    const newCore: PowerCore = {
      id: Math.random().toString(36).substr(2, 9),
      tier: 'Epic', // Simple logic for now
      level: 1,
      bonusDmg: newBonus
    };

    setState(prev => ({
      ...prev,
      inventory: [newCore, ...remaining]
    }));
  };

  const upgradeCelestialAltar = (type: CelestialAltarUpgrade, slotIndex: number) => {
    if (!state.celestialAltar) return;
    const cost = CELESTIAL_ALTAR_COST(state.totalAltarUpgrades);
    if (state.essenceFragments >= cost) {
      setIsAltarFlipping(slotIndex);
      setTimeout(() => {
        setState(prev => {
          const newSlots = [...prev.celestialAltarSlots];
          newSlots[slotIndex] = ALTAR_UPGRADES[Math.floor(Math.random() * ALTAR_UPGRADES.length)];
          return {
            ...prev,
            essenceFragments: prev.essenceFragments - cost,
            totalAltarUpgrades: prev.totalAltarUpgrades + 1,
            celestialAltar: {
              ...prev.celestialAltar,
              [type]: prev.celestialAltar[type] + 1
            },
            celestialAltarSlots: newSlots
          };
        });
        setIsAltarFlipping(null);
      }, 600);
    }
  };

  const performSundering = () => {
    setState(prev => {
      const harvestBonus = 1 + ((prev.celestialAltar?.essenceSiphon || 0) * 0.1);
      const fragments = Math.floor((prev.currentRunMaxFloor / 10) * harvestBonus);
      return {
        ...prev,
        floor: 1,
        currentRunMaxFloor: 1,
        essenceFragments: prev.essenceFragments + fragments,
        gold: 0,
        team: prev.team.map(p => p ? { ...p, level: 1, exp: 0, expToNext: 100 } : null),
        sunderTree: {
          luminary: { strike: 0, ancestry: 0 },
          shadow: { haste: 0, thirst: 0 }
        },
        inventory: prev.inventory,
        towerAscent: 0,
        hasReset: true,
        totalResets: (prev.totalResets || 0) + 1
      };
    });
    spawnEnemy(1);
    setActiveTab('team');
  };

  const hardReset = async () => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete all progress?")) return;
    localStorage.removeItem('creature-tower-save');
    if (user) {
      await setDoc(doc(db, 'users', user.uid), {});
    }
    window.location.reload();
  };

  if (!authReady || (loading && !user)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-serif tracking-widest animate-pulse">INITIALIZING AERTHOS...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-7xl font-serif text-white tracking-[0.3em] uppercase">Aerthos</h1>
          <p className="text-[#c5a059] font-black tracking-[0.5em] uppercase text-xs">The Spire of Eternal Sundering</p>
        </div>
        <button 
          onClick={login}
          className="px-12 py-4 bg-[#1a1a1e] border border-[#c5a059]/40 text-[#c5a059] font-black uppercase tracking-[0.3em] hover:bg-[#c5a059]/10 transition-all rounded-sm shadow-[0_0_30px_rgba(197,160,89,0.1)]"
        >
          Begin Your Ascent
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-orange-500/30">
      <AnimatePresence>
        {offlineGains && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-8"
          >
            <div className="max-w-md w-full bg-[#0a0a0c] border border-[#c5a059]/40 p-12 text-center space-y-8 shadow-[0_0_50px_rgba(197,160,89,0.1)]">
              <div className="space-y-2">
                <h2 className="text-4xl font-serif text-white uppercase tracking-widest">Welcome Back</h2>
                <p className="text-[10px] font-black text-[#c5a059] uppercase tracking-[0.4em]">Your Paragons have been busy</p>
              </div>
              
              <div className="py-8 border-y border-white/5 space-y-4">
                <div className="text-5xl font-black text-white">+{offlineGains.gold.toLocaleString()}</div>
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Gold Earned while away</div>
                <div className="text-xs text-neutral-400 italic font-serif">
                  Time Away: {Math.floor(offlineGains.timeAway / 60)}m {Math.floor(offlineGains.timeAway % 60)}s
                </div>
              </div>

              <button 
                onClick={() => setOfflineGains(null)}
                className="w-full py-4 bg-[#c5a059] text-black font-black uppercase tracking-[0.3em] hover:bg-[#d4b069] transition-all rounded-sm"
              >
                Claim Rewards
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-12">
        <div className="flex items-center gap-12">
          <div className="text-2xl font-serif tracking-[0.2em] text-white uppercase">
            Aerthos Endless
          </div>
          
          <div className="bg-[#1a1a1e] border border-[#c5a059]/40 rounded-sm px-6 py-2 flex items-center gap-3 shadow-[inset_0_0_10px_rgba(197,160,89,0.1)]">
            <div className="w-4 h-4 rounded-full bg-[#c5a059] flex items-center justify-center">
              <ChevronUp className="w-3 h-3 text-black" />
            </div>
            <span className="text-xs font-black tracking-[0.3em] text-white uppercase">
              Floor {state.floor}: Obsidian Spire
            </span>
            <div className="w-5 h-5 rounded-full border border-[#c5a059]/50 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-6 bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-sm flex items-center justify-center">
              <Coins className="w-4 h-4 text-[#c5a059]" />
            </div>
            <span className="text-sm font-black text-white font-mono">{(state.gold / 1000).toFixed(1)}K</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-6 bg-[#8fb8ff]/10 border border-[#8fb8ff]/30 rounded-sm flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#8fb8ff]" />
            </div>
            <span className="text-sm font-black text-white font-mono">{state.playerExp * 8.5}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-6 bg-[#a855f7]/10 border border-[#a855f7]/30 rounded-sm flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#a855f7]" />
            </div>
            <span className="text-sm font-black text-white font-mono">{state.essenceFragments}</span>
          </div>
          <button 
            onClick={logout}
            className="p-2 hover:bg-white/5 rounded transition-colors"
            title="Logout"
          >
            <RotateCcw className="w-5 h-5 text-neutral-400" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded transition-colors">
            <Settings className="w-5 h-5 text-neutral-400" />
          </button>
        </div>
      </header>

      <main className="fixed inset-0 top-24 bottom-24 overflow-hidden px-8">
        {/* Team View (Combat Screen) */}
        {activeTab === 'team' && (
          <div className="grid grid-cols-[320px_1fr_320px] gap-8 h-full py-8">
            {/* Left Column: Team Slots */}
            <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
              {state.team.map((paragon, i) => {
                const vesselReduction = (state.celestialAltar?.vesselCapacity || 0) * 2;
                const requiredFloor = SLOT_UNLOCKS[i] === 1 ? 1 : SLOT_UNLOCKS[i] - vesselReduction;
                const isUnlocked = state.floor >= requiredFloor;
                
                if (!isUnlocked) {
                  return (
                    <div key={i} className="h-32 bg-[#0a0a0c]/40 border border-white/5 rounded-lg flex items-center justify-center">
                      <Lock className="w-6 h-6 text-neutral-800" />
                    </div>
                  );
                }

                if (!paragon) {
                  return (
                    <button 
                      key={i}
                      onClick={() => summonParagon(i)}
                      className="h-32 bg-[#0a0a0c]/20 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center gap-2 group hover:bg-white/5 transition-all"
                    >
                      <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-white/40">
                        <Plus className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300" />
                      </div>
                      <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Summon Paragon</span>
                    </button>
                  );
                }

                return (
                  <div key={i} className="h-32 bg-[#0a0a0c]/60 border border-white/10 rounded-lg p-4 flex gap-4 group hover:border-[#c5a059]/30 transition-all relative overflow-hidden">
                    <div className="w-24 h-24 bg-neutral-900 border border-white/5 rounded-md overflow-hidden flex-shrink-0">
                      <img 
                        src={`https://picsum.photos/seed/${paragon.race}${paragon.id}/200/200`} 
                        alt={paragon.race} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="text-[10px] font-black text-white uppercase tracking-wider mb-1">
                        {paragon.id === 'aris' ? 'Aris Thorne' : paragon.id === 'elowen' ? 'Elowen Starsight' : paragon.race} ({PARAGON_DATA[paragon.race]?.category} {paragon.race} - {paragon.role})
                      </div>
                      <div className="space-y-1.5 mb-2">
                        <div className="h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            className="h-full bg-[#8fb8ff] shadow-[0_0_8px_rgba(143,184,255,0.4)]"
                            initial={false}
                            animate={{ width: `${(paragon.exp / paragon.expToNext) * 100}%` }}
                          />
                        </div>
                        <div className="h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            className="h-full bg-[#a855f7] shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                            initial={false}
                            animate={{ width: '40%' }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {[0, 1, 2].map(ri => (
                          <div key={ri} className="w-6 h-6 rounded-full border border-white/10 bg-black/40 flex items-center justify-center">
                            {paragon.relics[ri] ? (
                              <div className="w-3 h-3 rounded-full bg-neutral-400" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-white/5" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Center Column: Combat Area */}
            <div className="relative flex items-center justify-center">
              {/* Slash Line */}
              <div className="absolute w-[80%] h-[1px] bg-[#c5a059]/20 rotate-[-35deg] shadow-[0_0_20px_rgba(197,160,89,0.1)]" />
              
              {/* Floating Numbers */}
              <div className="flex flex-col items-center gap-12 z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-serif italic text-[#c5a059] drop-shadow-[0_0_10px_rgba(197,160,89,0.3)]"
                >
                  -1,420
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-serif italic text-[#a855f7] drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                >
                  +45 MP
                </motion.div>
              </div>

              {/* Bottom Panels */}
              <div className="absolute bottom-0 left-0 right-0 grid grid-cols-4 gap-4 px-4">
                <div className="bg-[#0a0a0c]/90 border border-white/5 p-6 rounded-sm shadow-2xl">
                  <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Combo Meter</div>
                  <div className="text-3xl font-black text-[#c5a059] font-mono">X14.5</div>
                </div>
                <div className="bg-[#0a0a0c]/90 border border-white/5 p-6 rounded-sm shadow-2xl">
                  <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Soul Yield</div>
                  <div className="text-3xl font-black text-[#8fb8ff] font-mono">2.4K/min</div>
                </div>
                <div className="bg-[#0a0a0c]/90 border border-white/5 p-6 rounded-sm shadow-2xl">
                  <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Team DPS</div>
                  <div className="text-3xl font-black text-white font-mono">1.2M</div>
                </div>
                <div className="bg-[#0a0a0c]/90 border border-white/5 p-6 rounded-sm shadow-2xl">
                  <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Tower Ascent</div>
                  <div className="text-3xl font-black text-white font-mono">14.2%</div>
                </div>
              </div>
            </div>

            {/* Right Column: Enemy Display */}
            <div className="flex flex-col items-center justify-center relative">
              <div className="w-full space-y-8">
                {/* Enemy HP Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end px-2">
                    <div className="text-2xl font-black text-white tracking-tighter uppercase">The Void-Stalker</div>
                    <div className="text-xs font-black text-red-500 uppercase">LVL 42</div>
                  </div>
                  <div className="h-4 bg-black/60 border border-white/10 rounded-full overflow-hidden relative">
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-red-900 to-red-600"
                      initial={{ width: "100%" }}
                      animate={{ width: "65%" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-widest">
                      1.4M / 2.2M
                    </div>
                  </div>
                </div>

                {/* Enemy Visual */}
                <div className="aspect-[3/4] bg-neutral-900/50 border border-white/5 rounded-sm relative overflow-hidden group">
                  <img 
                    src="https://picsum.photos/seed/voidstalker/400/600" 
                    alt="Enemy"
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  
                  {/* Action Buttons Overlay */}
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                    <button className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center group hover:bg-red-600/40 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                      <Sword className="w-8 h-8 text-red-500" />
                    </button>
                    <button className="w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center group hover:bg-purple-600/40 transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                      <Sparkles className="w-8 h-8 text-purple-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sunder-Tree Tab */}
        {activeTab === 'sunder-tree' && (
          <div className="flex flex-col h-[calc(100vh-12rem)]">
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
              {/* Background nebula effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-black via-[#1a1a1e] to-black" />
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-transparent to-transparent" />
              
              {/* Central Beam */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-32 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent blur-2xl" />
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-white/20 blur-[2px]" />
              
              {/* Runes in beam */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col justify-around py-20 pointer-events-none opacity-40">
                {['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ'].map((rune, i) => (
                  <span key={i} className="text-white font-serif text-2xl">{rune}</span>
                ))}
              </div>

              {/* Connecting Lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                <line x1="40%" y1="30%" x2="65%" y2="55%" stroke="white" strokeWidth="1" />
                <line x1="65%" y1="55%" x2="45%" y2="75%" stroke="white" strokeWidth="1" />
                <line x1="40%" y1="25%" x2="60%" y2="50%" stroke="white" strokeWidth="1" />
                <line x1="60%" y1="50%" x2="35%" y2="75%" stroke="white" strokeWidth="1" />
              </svg>

              <div className="relative z-10 w-full max-w-6xl grid grid-cols-2 h-full">
                {/* Luminary Might (Left) */}
                <div className="relative flex flex-col items-center justify-center">
                  <h2 className="absolute top-10 left-10 text-4xl font-serif tracking-[0.2em] text-white opacity-80 uppercase">Luminary Might</h2>
                  
                  <div className="relative w-full h-full">
                    {/* Locked Node */}
                    <div className="absolute top-[15%] left-[20%] flex flex-col items-center opacity-40">
                      <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[8px] font-black text-white/40 uppercase mt-2">Locked</span>
                    </div>

                    {/* Strike Node */}
                    <div className="absolute top-[30%] left-[40%] flex flex-col items-center">
                      <button
                        onClick={() => upgradeSunder('luminary', 'strike')}
                        className="w-20 h-20 rounded-full bg-[#1a1a1e] border-2 border-white/20 flex flex-col items-center justify-center group hover:border-[#8fb8ff] transition-all relative"
                      >
                        <Sword className="w-8 h-8 text-white mb-1" />
                        <span className="text-[8px] font-bold text-white/60">LVL {state.sunderTree.luminary.strike} ∞</span>
                        <div className="absolute -bottom-8 whitespace-nowrap text-[10px] font-black tracking-widest text-white/40 uppercase">Luminary Strike</div>
                      </button>
                    </div>

                    {/* Ambition Node (Large) */}
                    <div className="absolute top-[55%] left-[65%] flex flex-col items-center">
                      <div className="w-32 h-32 rounded-full bg-[#1a1a1e] border-4 border-white/40 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        <Sparkles className="w-12 h-12 text-white mb-2" />
                        <span className="text-xs font-black text-white uppercase tracking-widest">Aura of Ambition</span>
                        <span className="text-[10px] font-bold text-[#c5a059]">MAXED</span>
                      </div>
                    </div>

                    {/* Ancestry Node */}
                    <div className="absolute top-[75%] left-[45%] flex flex-col items-center">
                      <button
                        onClick={() => upgradeSunder('luminary', 'ancestry')}
                        className="w-16 h-16 rounded-full bg-[#1a1a1e] border-2 border-white/20 flex flex-col items-center justify-center group hover:border-[#8fb8ff] transition-all relative"
                      >
                        <History className="w-6 h-6 text-white mb-1" />
                        <span className="text-[8px] font-bold text-white/60">LVL {state.sunderTree.luminary.ancestry} ∞</span>
                        <div className="absolute -bottom-8 whitespace-nowrap text-[10px] font-black tracking-widest text-white/40 uppercase">Elven Ancestry</div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Shadow Haste (Right) */}
                <div className="relative flex flex-col items-center justify-center">
                  <h2 className="absolute top-10 right-10 text-4xl font-serif tracking-[0.2em] text-white opacity-80 uppercase">Shadow Haste</h2>
                  
                  <div className="relative w-full h-full">
                    {/* Echo Node (Diamond) */}
                    <div className="absolute top-[25%] right-[40%] flex flex-col items-center">
                      <button
                        onClick={() => upgradeSunder('shadow', 'haste')}
                        className="w-20 h-20 rotate-45 bg-[#1a1a1e] border-2 border-white/20 flex flex-col items-center justify-center group hover:border-[#a855f7] transition-all relative"
                      >
                        <div className="-rotate-45 flex flex-col items-center">
                          <RotateCcw className="w-8 h-8 text-white mb-1" />
                          <span className="text-[8px] font-bold text-white/60">LVL 105 ∞</span>
                        </div>
                        <div className="absolute -bottom-12 -rotate-45 whitespace-nowrap text-[10px] font-black tracking-widest text-white/40 uppercase">Shadow Echo</div>
                      </button>
                    </div>

                    {/* Step Node (Large Diamond) */}
                    <div className="absolute top-[50%] right-[60%] flex flex-col items-center">
                      <div className="w-32 h-32 rotate-45 bg-[#1a1a1e] border-4 border-white/40 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                        <div className="-rotate-45 flex flex-col items-center">
                          <Zap className="w-12 h-12 text-white mb-2" />
                          <span className="text-xs font-black text-white uppercase tracking-widest text-center">Shadow-Step Haste</span>
                          <span className="text-[10px] font-bold text-white/60">LVL {state.sunderTree.shadow.haste} ∞</span>
                        </div>
                      </div>
                    </div>

                    {/* Thirst Node (Diamond) */}
                    <div className="absolute top-[75%] right-[35%] flex flex-col items-center">
                      <button
                        onClick={() => upgradeSunder('shadow', 'thirst')}
                        className="w-16 h-16 rotate-45 bg-[#1a1a1e] border-2 border-white/20 flex flex-col items-center justify-center group hover:border-[#a855f7] transition-all relative"
                      >
                        <div className="-rotate-45 flex flex-col items-center">
                          <Flame className="w-6 h-6 text-white mb-1" />
                        </div>
                        <div className="absolute -bottom-12 -rotate-45 whitespace-nowrap text-[10px] font-black tracking-widest text-white/40 uppercase">Vampiric Thirst</div>
                      </button>
                    </div>

                    {/* Locked Node (Diamond) */}
                    <div className="absolute top-[85%] right-[15%] flex flex-col items-center opacity-40">
                      <div className="w-12 h-12 rotate-45 border border-white/20 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-white -rotate-45" />
                      </div>
                      <span className="text-[8px] font-black text-white/40 uppercase mt-4">Locked</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Panel */}
            <div className="bg-[#0a0a0c]/90 border-t border-white/5 p-10 flex items-center justify-between px-20">
              <div>
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Available Gold</div>
                <div className="text-5xl font-black text-white tracking-tight">Unallocated Gold: {state.gold.toLocaleString()}</div>
              </div>
              <button 
                onClick={infuseGold}
                className="px-16 py-5 bg-[#1a1a1e] border border-cyan-500/40 text-cyan-500 font-black text-xl uppercase tracking-[0.3em] hover:bg-cyan-500/10 transition-all rounded-sm shadow-[0_0_30px_rgba(6,182,212,0.1)]"
              >
                Infuse Gold
              </button>
            </div>
          </div>
        )}

        {/* Celestial Altar Tab */}
        {activeTab === 'altar' && (
          <div className="relative h-full altar-gradient flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Background Essence Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-1/4 left-1/4 w-32 h-32 floating-essence" 
              />
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 6, repeat: Infinity }}
                className="absolute bottom-1/3 right-1/4 w-48 h-48 floating-essence" 
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center">
              <div className="text-center mb-12">
                <h1 className="font-headline text-5xl text-white uppercase tracking-[0.2em] mb-2 drop-shadow-[0_0_15px_rgba(152,203,255,0.3)]">
                  Celestial Altar
                </h1>
                <p className="font-body text-secondary tracking-[0.3em] uppercase text-xs">
                  The Alchemist's Sunder-Blessing
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 w-full px-4 mb-16">
                {state.celestialAltarSlots.map((upgrade, i) => {
                  const data = ALTAR_NODE_DATA[upgrade];
                  const level = state.celestialAltar[upgrade];
                  const cost = CELESTIAL_ALTAR_COST(state.totalAltarUpgrades);
                  const Icon = data.icon;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "group relative aspect-[2/3] bg-surface-container-low border transition-all duration-500 hover:-translate-y-4 flex flex-col",
                        data.rarity === 'Legendary' ? "legendary-border-pulse border-secondary/20 hover:shadow-[0_20px_50px_rgba(216,197,147,0.2)]" : 
                        data.rarity === 'Rare' ? "rare-border-glow border-cyan-500/20 hover:shadow-[0_20px_50px_rgba(0,163,255,0.15)]" :
                        "border-white/10 hover:shadow-[0_20px_50px_rgba(255,255,255,0.05)]"
                      )}
                    >
                      {data.rarity === 'Legendary' && (
                        <div className="absolute inset-0 border-[4px] border-secondary/10 pointer-events-none" />
                      )}
                      
                      <div className="flex-grow flex flex-col p-4 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-tighter",
                            data.rarity === 'Legendary' ? "text-secondary" : 
                            data.rarity === 'Rare' ? "text-cyan-500" : "text-neutral-400"
                          )}>
                            {data.rarity}
                          </span>
                          <Icon className={cn(
                            "w-4 h-4",
                            data.rarity === 'Legendary' ? "text-secondary" : 
                            data.rarity === 'Rare' ? "text-cyan-500" : "text-neutral-400"
                          )} />
                        </div>

                        <div className="flex-grow flex items-center justify-center mb-4 relative">
                          {data.rarity === 'Legendary' && (
                            <div className="absolute inset-0 bg-secondary/5 blur-2xl rounded-full" />
                          )}
                          <img 
                            src={data.image} 
                            alt={data.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover mix-blend-lighten opacity-60 group-hover:opacity-100 transition-opacity"
                          />
                        </div>

                        <div className="text-center">
                          <h3 className="font-headline text-lg text-white leading-tight mb-1">{data.name}</h3>
                          <div className={cn(
                            "h-px w-12 mx-auto mb-2",
                            data.rarity === 'Legendary' ? "bg-secondary/30" : 
                            data.rarity === 'Rare' ? "bg-cyan-500/30" : "bg-white/10"
                          )} />
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                            {data.desc} Lvl {level.toString().padStart(2, '0')}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <button 
                          onClick={() => upgradeCelestialAltar(upgrade, i)}
                          disabled={state.essenceFragments < cost}
                          className="w-full py-2 px-1 bg-[#1a1a1e] hover:bg-neutral-800 border border-cyan-500/20 flex flex-col items-center justify-center gap-0.5 group/btn transition-colors shadow-sm hover:shadow-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant group-hover/btn:text-cyan-500 transition-colors">
                            Enhance
                          </span>
                          <span className="text-[11px] font-bold text-cyan-500 drop-shadow-[0_0_5px_rgba(0,163,255,0.4)]">
                            {cost} Frag
                          </span>
                        </button>
                      </div>
                      
                      <div className={cn(
                        "absolute -inset-px border opacity-0 group-hover:opacity-100 transition-opacity",
                        data.rarity === 'Legendary' ? "border-secondary/40" : 
                        data.rarity === 'Rare' ? "border-cyan-500/40" : "border-white/20"
                      )} />
                    </motion.div>
                  );
                })}
              </div>

              <div className="relative group mt-8">
                <div className="absolute -inset-4 bg-cyan-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {!state.hasReset && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-2 bg-neutral-900 text-secondary text-[10px] uppercase tracking-widest rounded shadow-2xl border border-secondary/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    Access Granted After 1st Sundering Reset
                  </div>
                )}

                <button 
                  onClick={() => setShowLegacyModal(true)}
                  className="relative bg-[#2D1B10] border-2 border-[#5C3A21] px-10 py-5 flex items-center gap-6 shadow-2xl transition-transform active:scale-95 group"
                >
                  <div className="relative w-12 h-16 bg-[#3D2616] border-l-4 border-[#1E120A] flex flex-col justify-center items-center">
                    <div className="w-full h-1 bg-[#1E120A]/20 my-1" />
                    <div className="w-full h-1 bg-[#1E120A]/20 my-1" />
                    {!state.hasReset && (
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-6 bg-secondary flex items-center justify-center shadow-lg">
                        <Lock className="w-3 h-3 text-[#241a00]" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-headline text-xl text-secondary uppercase tracking-widest">View Your Legacy</span>
                    <span className="font-body text-[10px] text-secondary/60 uppercase tracking-widest mt-1">Ancient Records Await</span>
                  </div>
                  <History className="w-6 h-6 text-secondary group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lore Tab */}
        {activeTab === 'lore' && (
          <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-12">
            <div className="max-w-4xl mx-auto w-full space-y-12">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 border border-white/10 rounded-full flex items-center justify-center mx-auto bg-neutral-900/50">
                  <History className="w-10 h-10 text-neutral-500" />
                </div>
                <h1 className="text-6xl font-serif tracking-[0.2em] text-white uppercase">Chronicles of Aerthos</h1>
                <p className="text-xs font-black tracking-[0.5em] text-[#c5a059] uppercase">The Spire of Eternal Sundering</p>
              </div>

              <div className="grid gap-8">
                {[
                  { title: 'The Great Sundering', content: 'Before the tower, there was only the void. Aerthos, the first Luminary, sacrificed his essence to build a spire that would bridge the realms.', unlocked: true, date: 'Age of Genesis' },
                  { title: 'The Shadow Rift', content: 'As the tower grew, so did its shadow. A rift formed at the heart of the spire, bleeding darkness into the upper floors.', unlocked: state.maxFloor >= 50, date: 'Age of Eclipse' },
                  { title: 'The Celestial Pact', content: 'The Paragons were chosen to guard the rift, bound by a pact that transcends death and rebirth.', unlocked: state.maxFloor >= 100, date: 'Age of Guardians' },
                  { title: 'The Final Ascent', content: 'Legend says that at the very top, the Sundering can be reversed, but the cost is more than any soul can bear.', unlocked: state.maxFloor >= 200, date: 'Age of Prophecy' },
                ].map((lore, i) => (
                  <div key={i} className={cn(
                    "relative p-10 border transition-all overflow-hidden group",
                    lore.unlocked 
                      ? "bg-[#0a0a0c] border-white/10 hover:border-[#c5a059]/40" 
                      : "bg-black/40 border-white/5 opacity-40 grayscale"
                  )}>
                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/5 to-transparent" />
                    
                    <div className="relative z-10 flex gap-8">
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-2xl font-serif text-neutral-700">0{i + 1}</div>
                        <div className="w-[1px] flex-1 bg-white/5" />
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-2xl font-serif text-white uppercase tracking-widest">{lore.title}</h3>
                          <span className="text-[10px] font-black text-[#c5a059] uppercase tracking-widest">{lore.date}</span>
                        </div>
                        <p className="text-neutral-400 leading-relaxed font-serif text-lg italic">
                          {lore.unlocked ? lore.content : "This entry remains shrouded in mystery. Reach higher floors to unlock."}
                        </p>
                        {!lore.unlocked && (
                          <div className="flex items-center gap-2 text-[10px] font-black text-neutral-600 uppercase tracking-widest">
                            <Lock className="w-3 h-3" />
                            Requires Floor {i === 1 ? 50 : i === 2 ? 100 : 200}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-[#0a0a0c] border-t border-white/5 z-50 flex items-center justify-center gap-20">
        {[
          { id: 'team', label: 'TEAM', icon: Users },
          { id: 'sunder-tree', label: 'SUNDER-TREE', icon: Package },
          { id: 'altar', label: 'ALTAR', icon: Settings },
          { id: 'lore', label: 'LORE', icon: History },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 group relative px-8 h-full transition-all",
              activeTab === tab.id ? "bg-[#1a1a1e]" : "hover:bg-white/5"
            )}
          >
            <tab.icon className={cn(
              "w-6 h-6 transition-all",
              activeTab === tab.id ? "text-white" : "text-neutral-600 group-hover:text-neutral-400"
            )} />
            <span className={cn(
              "text-[10px] font-black tracking-[0.2em] uppercase transition-all",
              activeTab === tab.id ? "text-white" : "text-neutral-600 group-hover:text-neutral-400"
            )}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="nav-active"
                className="absolute top-0 left-0 right-0 h-[2px] bg-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.5)]"
              />
            )}
          </button>
        ))}
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {showHardResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl max-w-md w-full text-center"
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Total Sundering?</h2>
              <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
                This will erase all progress, including Celestial Altar upgrades. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowHardResetConfirm(false)}
                  className="flex-1 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={hardReset}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-900/20"
                >
                  Hard Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showLegacyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                    <History className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Your Legacy</h2>
                    <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">Permanent Celestial Records</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLegacyModal(false)}
                  className="w-10 h-10 bg-neutral-800 hover:bg-neutral-700 rounded-full flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {ALTAR_UPGRADES.map((type) => {
                  const data = ALTAR_NODE_DATA[type];
                  const level = state.celestialAltar[type];
                  if (level === 0) return null;
                  
                  return (
                    <div key={type} className="bg-neutral-800/50 p-4 rounded-2xl border border-neutral-700 flex items-center justify-between group hover:border-yellow-500/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center shadow-inner", data.color)}>
                          <data.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-white uppercase tracking-tight">{data.name}</div>
                          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-tighter">{data.desc}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-yellow-500">LVL {level}</div>
                        <div className="text-[9px] text-neutral-600 font-bold uppercase">Permanent</div>
                      </div>
                    </div>
                  );
                })}
                {state.totalAltarUpgrades === 0 && (
                  <div className="py-20 text-center text-neutral-500 italic text-sm">
                    No legacy recorded yet. Ascend at the Altar to begin.
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-800 flex justify-between items-center">
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                  Total Celestial Levels: {state.totalAltarUpgrades}
                </div>
                <button
                  onClick={() => setShowLegacyModal(false)}
                  className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-black text-xs rounded-xl uppercase tracking-widest transition-all"
                >
                  Close Records
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
