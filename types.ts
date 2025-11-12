import React from 'react';

// FIX: Replaced component logic with actual type definitions.

export enum AuthView {
  Login,
  Signup,
  VerifyEmail,
  ForgotPassword,
  ResetPassword,
  LoggedIn,
}

export type CardRarity = 'Common' | 'Rare' | 'Super Rare' | 'Ultra Rare' | 'Ultimate Rare' | 'Secret Rare' | 'Parallel Rare' | 'Legendary Rare';

export const RARITY_DATA: { name: CardRarity; thaiName: string; color: string }[] = [
    { name: 'Common', thaiName: 'คอมมอน', color: '#94a3b8' },
    { name: 'Rare', thaiName: 'แรร์', color: '#60a5fa' },
    { name: 'Super Rare', thaiName: 'ซูเปอร์แรร์', color: '#a78bfa' },
    { name: 'Ultra Rare', thaiName: 'อัลตร้าแรร์', color: '#f472b6' },
    { name: 'Ultimate Rare', thaiName: 'อัลติเมทแรร์', color: '#ef4444' },
    { name: 'Secret Rare', thaiName: 'ซีเคร็ทแรร์', color: '#eab308' },
    { name: 'Parallel Rare', thaiName: 'พาราเรลแรร์', color: '#2dd4bf' },
    { name: 'Legendary Rare', thaiName: 'เลเจนด์ดารี่แรร์', color: '#FFFFFF' },
];

export const ELEMENTS_DATA = [
    { name: 'Fire', thaiName: 'ไฟ', emoji: '🔥' },
    { name: 'Water', thaiName: 'น้ำ', emoji: '💧' },
    { name: 'Earth', thaiName: 'ดิน', emoji: '🌍' },
    { name: 'Wind', thaiName: 'ลม', emoji: '💨' },
    { name: 'Light', thaiName: 'แสง', emoji: '✨' },
    { name: 'Dark', thaiName: 'มืด', emoji: '💀' },
    { name: 'Thunder', thaiName: 'สายฟ้า', emoji: '⚡' },
    { name: 'Divine', thaiName: 'เทพ', emoji: '😇' },
];

export const TRIBES_DATA: { en: string; th: string }[] = [
    { en: "Human", th: "มนุษย์" },
    { en: "Beast", th: "สัตว์ป่า" },
    { en: "Elf", th: "เอลฟ์" },
    { en: "Orc", th: "ออร์ค" },
    { en: "Undead", th: "อันเดด" },
    { en: "Dragon", th: "มังกร" },
    { en: "Machine", th: "เครื่องจักร" },
    { en: "Elemental", th: "ภูตธาตุ" },
    { en: "Celestial", th: "สวรรค์" },
    { en: "Abyssal", th: "อเวจี" },
    { en: "Fairy", th: "แฟรี่" },
    { en: "Giant", th: "ยักษ์" }
];

export interface CardStats {
    attack: number;
    defense: number;
    speed: number;
    hp: number;
}

export interface Card {
  id: string;
  name: { th: string; en: string };
  rarity: CardRarity;
  season: number;
  cardNumber: number;
  element: string;
  tribe: string;
  description: { th: string; en: string };
  story: { th: string; en: string };
  stats: CardStats;
  frontImage: string;
  backImage: string;
}

export type Language = 'th' | 'en';


export interface SeasonConfig {
    season: number;
    name: string;
    theme: string;
    slots: Record<CardRarity, number>;
}

export const SEASON_CONFIG: SeasonConfig[] = Array.from({ length: 23 }, (_, i) => {
    const themes = [
        "Genesis Era", "Void Breach", "Age of Dragons", "Steampunk Revolution", "Galactic Frontiers",
        "Mythos Reborn", "Cybernetic Uprising", "Elemental Chaos", "The Underworld", "Celestial War",
        "Lost Jungles", "Frozen Wastes", "Desert Empires", "Fairy Tales", "Nightmare Constructs",
        "Sky Islands", "Deep Sea Legends", "Chronomancer's Paradox", "Alchemist's Guild", "The Grand Tournament",
        "Wasteland Wanderers", "Aetherium Shards", "The Final Prophecy"
    ];
    // Total 116 cards per season
    return {
        season: i + 1,
        name: `ซีซั่น ${i + 1}`,
        theme: themes[i] || `Season ${i + 1} Theme`,
        slots: {
            'Common': 50,
            'Rare': 30,
            'Super Rare': 15,
            'Ultra Rare': 10,
            'Ultimate Rare': 5,
            'Secret Rare': 3,
            'Parallel Rare': 2,
            'Legendary Rare': 1,
        },
    };
});

export type View = 'home' | 'collection' | 'slot' | 'pachinko' | 'addCard' | 'addPack' | 'manageCards' | 'manageUsers' | 'pets' | 'luckyDraw' | 'packOpening' | 'shop' | 'market' | 'chat' | 'manageBanners' | 'games' | 'dungeon' | 'news' | 'achievements';

export interface LeaderboardData {
    collectors: { nickname: string; value: number }[];
    richest: { nickname: string; value: number }[];
}

export interface CardPack {
    id: number; // Season number
    name: string;
    description: string;
    cost: number;
    image: string;
}

export interface User {
  id: string;
  nickname: string;
  email: string;
  password?: string;
  isAdmin: boolean;
  coins: number;
  points: number;
  status: 'Active' | 'Banned';
  lastLogin: number;
  ipAddress: string;
  icon?: 'villain' | 'user';
}

export type PetStatus = 'idle' | 'questing' | 'recovering';

export interface PetStats {
    hp: number; sp: number; atk: number; def: number; agi: number; dex: number; luk: number;
}

export interface PetSpeciesData {
    emoji: string;
    speciesName: string;
    description: string;
    baseStats: PetStats;
    growthRates: PetStats;
}

export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    icon: string;
    type: 'consumable' | 'material' | 'equipment';
    value?: number;
    effect?: { type: 'HEAL_HP' | 'HEAL_SP' | 'BUFF_ATK' | 'GAIN_EXP'; value?: number; duration?: number; };
    minLevel?: number;
    maxLevel?: number;
}

export interface StackedInventoryItem {
    item: InventoryItem;
    quantity: number;
}

export interface QuestLogEntry {
    text: string;
    type: 'info' | 'damage' | 'success' | 'fail' | 'combat' | 'trap' | 'discovery';
}

export interface PetData {
    emoji: string;
    name: string;
    species: PetSpeciesData;
    stats: PetStats;
    currentHealth: number;
    currentSp: number;
    level: number;
    exp: number;
    expToNextLevel: number;
    levelUpStatProgress: number;
    status: PetStatus;
    lastUpdated: number;
    questEndTime: number | null;
    questDuration?: number;
    questReward: number | null;
    questPointsReward: number | null;
    questName: string | null;
    questRecommendedLevel: number | null;
    questProgress?: number;
    triggeredCheckpoints?: number[];
    questLog: QuestLogEntry[] | null;
    inventory: (StackedInventoryItem | null)[];
    homeBackground: string; // item id
}

export const EMOJIS = [
    // Faces
    "😀", "😂", "😍", "🤔", "😎", "😢", "😡", 
    // Symbols & Objects
    "👍", "👎", "❤️", "🔥", "⭐", "💎", "💰", "🎁", "🎉", "🚀", "💯", "🧠", "👀",
    // Animals & Creatures
    "👻", "💀", "👽", "👾", "🤖", "🎃", "😺", "🐵", "🦄", "🐸", "🐳",
    // Nature
    "🍀", "🍄", "🌍", "🌞", "🌕", "⚡", "🌊",
    // Food & Items
    "🍔", "🍕", "🎲", "🎸", "🎯", "🏆", "👑", "💡", "💣", "🔑", "🛡️", "⚔️", "🔮",
    // Science
    "🧬", "🔭"
];

export type QuestTheme = 'Forest' | 'Cave' | 'Mountain' | 'Plains' | 'Ruins' | 'Water' | 'Default';

export const PET_QUEST_BACKGROUND_THEMES: { key: QuestTheme, name: string }[] = [
    { key: 'Forest', name: 'ป่า' },
    { key: 'Cave', name: 'ถ้ำ' },
    { key: 'Mountain', name: 'ภูเขา' },
    { key: 'Plains', name: 'ทุ่งหญ้า/ชายหาด' },
    { key: 'Ruins', name: 'ซากปรักหักพัง/สุสาน' },
    { key: 'Water', name: 'แม่น้ำ/หนองน้ำ' },
];

export interface Quest {
    name: string;
    description: string;
    duration: number; // in milliseconds
    reward: number; // coins
    pointsReward: number;
    recommendedLevel: number;
    theme: QuestTheme;
    // Special rewards that have a chance to drop upon quest completion.
    specialRewards?: ('CardPack' | 'CardFragment')[];
}

export interface MarketListing {
  listingId: string;
  sellerNickname: string;
  card?: Card;
  pack?: CardPack;
  price: {
      coins?: number;
      points?: number;
  };
  listedAt: number;
}

export interface ChatMessage {
  id: string;
  nickname: string;
  message: string;
  timestamp: number;
}

export interface UpdatePost {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

export interface AuditLog {
    id: number;
    nickname: string;
    type: 'coin' | 'point';
    amount: number;
    source: string;
    timestamp: number;
}

export interface QuestLogEvent {
    id: number;
    text: string;
    type: 'info' | 'combat' | 'trap' | 'discovery';
    minLevel: number;
    maxLevel: number;
    chance: number; // Percentage
    damage?: {
        min: number;
        max: number;
        type: 'flat' | 'percent';
    };
    statCheck?: {
        stat: 'agi' | 'dex' | 'luk';
        difficulty: number;
        successText: string;
        failureText: string;
        rewardItem?: 'CardFragment';
    };
}

export interface PetBackgroundItem {
    id: string;
    name: string;
    image: string; // base64
}

// --- Dungeon System Types ---
export interface Dungeon {
    id: string;
    name: string;
    levelRange: { min: number; max: number };
    duration: number; // in milliseconds
    description: string;
    theme: QuestTheme;
    rewardTiers: {
        common: { item: string, quantity: number },
        uncommon: { item: string, quantity: number },
        rare: { item: string, quantity: number },
    }
}

export type DungeonLogType = 'info' | 'combat' | 'trap' | 'discovery' | 'damage' | 'success' | 'fail' | 'reward' | 'destroyed';

export interface DungeonLogEntry {
    text: string;
    type: DungeonLogType;
}

export interface DungeonCardState extends Card {
    currentHp: number;
}

export interface DungeonQuestOutcome {
    cardId: string;
    cardName: { th: string; en: string };
    status: 'survived' | 'destroyed';
}

export interface QuestCompletionData {
    dungeonName: string;
    log: DungeonLogEntry[];
    rewards: StackedInventoryItem[];
    outcomes: DungeonQuestOutcome[];
}

export interface ActiveDungeonQuest {
    questId: string;
    dungeon: Dungeon;
    party: DungeonCardState[];
    startTime: number;
    endTime: number;
    log: DungeonLogEntry[];
    rewards: InventoryItem[];
    outcomes: DungeonQuestOutcome[];
    progress: number;
    logColor: string;
}

// --- Achievement System Types ---

export type AchievementCategory = 'collection' | 'pet' | 'dungeon' | 'economy' | 'games' | 'special';

export type AchievementCriteriaType = 
    | 'COLLECT_TOTAL_CARDS'
    | 'COLLECT_SEASON_CARDS'
    | 'COLLECT_RARITY_CARDS'
    | 'PET_LEVEL'
    | 'PET_QUESTS_COMPLETED'
    | 'DUNGEON_QUESTS_COMPLETED'
    | 'DUNGEON_HARDCORE_COMPLETED'
    | 'EARN_TOTAL_COINS'
    | 'EARN_TOTAL_POINTS'
    | 'GAMES_SLOTS_PLAYED'
    | 'GAMES_PACHINKO_PLAYED'
    | 'MARKET_SOLD_ITEMS';

export interface AchievementReward {
    type: 'coins' | 'points' | 'item';
    amount?: number;
    itemId?: string;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    category: AchievementCategory;
    criteria: {
        type: AchievementCriteriaType;
        value: number;
        rarity?: CardRarity;
        season?: number;
    };
    reward: AchievementReward;
    icon: string;
}

export interface UserAchievementProgress {
    [achievementId: string]: {
        progress: number;
        claimed: boolean;
    };
}