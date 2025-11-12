import React, { useState, useCallback, useEffect, useRef } from 'react';
import SlotMachine from './SlotMachine';
import CardCollectionView from './CardCollectionView';
import AddCardPackView from './AddCardPackView';
import ManageUsersView from './ManageUsersView';
import PetView from './PetView';
import LuckyDrawView from './LuckyDrawView';
import CardPackOpeningView from './CardPackOpeningView';
import ShopView from './ShopView';
import MarketplaceView from './MarketplaceView';
import ChatView from './ChatView';
import ManageBannersView from './ManageBannersView';
import GamesView from './GamesView';
import PachinkoView from './PachinkoView';
import HomeView from './HomeView';
import DungeonView from './DungeonView';
import NewsView from './NewsView';
import AchievementsView from './AchievementsView';
import { Card, View, SEASON_CONFIG, LeaderboardData, Language, CardPack, PetData, CardRarity, RARITY_DATA, PetBackgroundItem, ActiveDungeonQuest, Dungeon, DungeonCardState, InventoryItem, DungeonLogEntry, QuestCompletionData, DungeonQuestOutcome, UserAchievementProgress, Achievement, StackedInventoryItem } from '../types';
import * as cardService from '../services/cardService';
import * as configService from '../services/configService';
import * as auditService from '../services/auditService';
import * as userService from '../services/userService';
import * as achievementService from '../services/achievementService';
import { DUNGEON_EVENT_DATABASE } from '../services/dungeonEventDatabase';
import { ITEM_DATABASE } from '../services/itemDatabase';
import { ACHIEVEMENT_DATABASE } from '../services/achievementDatabase';


// Base Icons
import { CoinIcon } from './icons/CoinIcon';
import { PointIcon } from './icons/PointIcon';
import { UserIcon } from './icons/UserIcon';
import { AdminIcon } from './icons/AdminIcon';
import AnalogClock from './AnalogClock';
import FreeCoinNotification from './CoinFallAnimation';
import NotificationToast, { NotificationData } from './NotificationToast';

// Menu Icons
import { HomeIcon } from './icons/HomeIcon';
import { NewspaperIcon } from './icons/NewspaperIcon';
import { CollectionIcon } from './icons/CollectionIcon';
import { PackOpeningIcon } from './icons/PackOpeningIcon';
import { ShopIcon } from './icons/ShopIcon';
import { ScaleIcon } from './icons/ScaleIcon';
import { GamepadIcon } from './icons/GamepadIcon';
import { PetIcon } from './icons/PetIcon';
import { LuckyDrawIcon } from './icons/LuckyDrawIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { ManageCardsIcon } from './icons/ManageCardsIcon';
import { AddPackIcon } from './icons/AddPackIcon';
import { ManageUsersIcon } from './icons/ManageUsersIcon';
import { BannerIcon } from './icons/BannerIcon';
import { DungeonIcon } from './icons/DungeonIcon';
import { MedalIcon } from './icons/MedalIcon';


interface LoggedInViewProps {
  nickname: string;
  isAdmin: boolean;
  initialCoins: number;
  initialPoints: number;
  onLogout: () => void;
}

const migrateInventory = (oldInventory: (InventoryItem | null)[]): (StackedInventoryItem | null)[] => {
    const newInventory: (StackedInventoryItem | null)[] = Array(20).fill(null);
    const itemMap = new Map<string, { item: InventoryItem, quantity: number }>();
    for (const oldItem of oldInventory) {
      if (!oldItem) continue;
      const itemTemplate = ITEM_DATABASE.find(dbItem => dbItem.name === oldItem.name); // Use name for mapping old items
      if (!itemTemplate) continue;

      if (itemMap.has(itemTemplate.id)) {
        itemMap.get(itemTemplate.id)!.quantity++;
      } else {
        itemMap.set(itemTemplate.id, { item: itemTemplate, quantity: 1 });
      }
    }
    let i = 0;
    for (const stackedItem of itemMap.values()) {
      if (i < 20) {
        newInventory[i] = stackedItem;
        i++;
      }
    }
    return newInventory;
};

const addItemsToInventory = (currentPet: PetData, itemsToAdd: InventoryItem[]): { updatedPet: PetData, itemsNotAdded: InventoryItem[] } => {
    let newInventory = [...currentPet.inventory];
    const itemsNotAdded: InventoryItem[] = [];

    for (const itemTemplate of itemsToAdd) {
        let itemWasAdded = false;
        // Try to stack
        for (let i = 0; i < newInventory.length; i++) {
            if (newInventory[i] && newInventory[i]!.item.id === itemTemplate.id) {
                newInventory[i]!.quantity++;
                itemWasAdded = true;
                break;
            }
        }
        // Try to find empty slot
        if (!itemWasAdded) {
            const emptySlotIndex = newInventory.findIndex(slot => slot === null);
            if (emptySlotIndex !== -1) {
                newInventory[emptySlotIndex] = { item: itemTemplate, quantity: 1 };
                itemWasAdded = true;
            }
        }
        if (!itemWasAdded) {
            itemsNotAdded.push(itemTemplate);
        }
    }

    return { updatedPet: { ...currentPet, inventory: newInventory }, itemsNotAdded };
};


const getRandomCardByPetStats = (pet: PetData, allCards: Card[]): Card => {
    const baseProbabilities: { rarity: CardRarity, chance: number }[] = [
        { rarity: 'Common', chance: 65 },
        { rarity: 'Rare', chance: 25 },
        { rarity: 'Super Rare', chance: 7 },
        { rarity: 'Ultra Rare', chance: 2.5 },
        { rarity: 'Ultimate Rare', chance: 0.4 },
        { rarity: 'Secret Rare', chance: 0.08 },
        { rarity: 'Parallel Rare', chance: 0.015 },
        { rarity: 'Legendary Rare', chance: 0.005 },
    ];

    const luckBonus = (pet.stats.luk + pet.level) / 20; // e.g., LUK 40 + LVL 10 = 2.5% shift
    
    // Shift probability from Common to better rarities
    const shiftAmount = Math.min(baseProbabilities[0].chance - 10, luckBonus);
    baseProbabilities[0].chance -= shiftAmount;
    
    // Distribute the bonus
    baseProbabilities[1].chance += shiftAmount * 0.5; // Rare
    baseProbabilities[2].chance += shiftAmount * 0.25; // Super Rare
    baseProbabilities[3].chance += shiftAmount * 0.15; // Ultra Rare
    baseProbabilities[4].chance += shiftAmount * 0.06; // Ultimate
    baseProbabilities[5].chance += shiftAmount * 0.02; // Secret
    baseProbabilities[6].chance += shiftAmount * 0.015; // Parallel
    baseProbabilities[7].chance += shiftAmount * 0.005; // Legendary

    const totalChance = baseProbabilities.reduce((sum, p) => sum + p.chance, 0);
    const rand = Math.random() * totalChance;
    let cumulativeChance = 0;
    let chosenRarity: CardRarity = 'Common';

    for (const prob of baseProbabilities) {
        cumulativeChance += prob.chance;
        if (rand <= cumulativeChance) {
            chosenRarity = prob.rarity;
            break;
        }
    }

    const availableCards = allCards.filter(c => c.rarity === chosenRarity);
    if (availableCards.length > 0) {
        return availableCards[Math.floor(Math.random() * availableCards.length)];
    }
    // Fallback to any card if no card of the chosen rarity is found
    return allCards[Math.floor(Math.random() * allCards.length)];
};


const LoggedInView: React.FC<LoggedInViewProps> = ({ nickname, isAdmin, initialCoins, initialPoints, onLogout }) => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [coins, setCoins] = useState(initialCoins);
  const [points, setPoints] = useState(initialPoints);
  const [userPacks, setUserPacks] = useState<number[]>(isAdmin ? [] : [1, 1, 1]); // Season IDs
  const [showFreeCoinNotification, setShowFreeCoinNotification] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const notificationIdCounter = useRef(0);
  
  const [siteConfig, setSiteConfig] = useState<Record<string, string>>({});
  const [petQuestBackgrounds, setPetQuestBackgrounds] = useState<Record<string, string>>({});
  const [petHomeBackgrounds, setPetHomeBackgrounds] = useState<PetBackgroundItem[]>([]);
  const [background1, setBackground1] = useState('');
  const [background2, setBackground2] = useState('');
  const [isBg1Active, setIsBg1Active] = useState(true);

  const [userCardCollection, setUserCardCollection] = useState<Card[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [suspiciousUserCount, setSuspiciousUserCount] = useState(0);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);

  // New states lifted up for shared use
  const [language, setLanguage] = useState<Language>('th');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [pet, setPet] = useState<PetData | null>(null);
  const [activeDungeonQuests, setActiveDungeonQuests] = useState<ActiveDungeonQuest[]>([]);
  
  // Achievement System State
  const [achievementProgress, setAchievementProgress] = useState<UserAchievementProgress>({});
  const [isCheckingAchievements, setIsCheckingAchievements] = useState(false);


  useEffect(() => {
    // Load pet data from localStorage on component mount
    try {
        const savedPetJSON = localStorage.getItem(`pet_v3_${nickname}`);
        if (savedPetJSON) {
            let savedPet = JSON.parse(savedPetJSON);

            // Migration logic for inventory
            if (savedPet.inventory && savedPet.inventory.length > 0 && savedPet.inventory[0] && savedPet.inventory[0].item === undefined) {
                console.log("Migrating old inventory format...");
                savedPet.inventory = migrateInventory(savedPet.inventory);
            } else if (!savedPet.inventory || savedPet.inventory.length !== 20) {
                savedPet.inventory = Array(20).fill(null);
            }

            if (!savedPet.homeBackground) savedPet.homeBackground = 'home_bg_opt_0';
            if (savedPet.ownedBackgrounds) delete savedPet.ownedBackgrounds; // Remove obsolete property

            setPet(savedPet);
        }
        const savedDungeonQuests = localStorage.getItem(`dungeon_quests_v1_${nickname}`);
        if (savedDungeonQuests) {
            setActiveDungeonQuests(JSON.parse(savedDungeonQuests));
        }
    } catch {
        setPet(null);
        setActiveDungeonQuests([]);
    }
  }, [nickname]);
  
  useEffect(() => {
    localStorage.setItem(`dungeon_quests_v1_${nickname}`, JSON.stringify(activeDungeonQuests));
  }, [activeDungeonQuests, nickname]);


  const loadSiteConfig = useCallback(async () => {
    const config = await configService.getConfig();
    setSiteConfig(config);

    const questBgs: Record<string, string> = {};
    const homeBgs: PetBackgroundItem[] = [];
    Object.keys(config).forEach(key => {
        if (key.startsWith('pet_quest_background_')) {
            questBgs[key] = config[key];
        } else if (key === 'pet_home_background_options') {
            try {
                homeBgs.push(...JSON.parse(config[key]));
            } catch {
                console.error("Failed to parse pet home backgrounds config");
            }
        }
    });
    setPetQuestBackgrounds(questBgs);
    setPetHomeBackgrounds(homeBgs);
    
    if (!background1 && !background2) {
      setBackground1(config[`view_${currentView}_background`] || config.view_collection_background);
    }
  }, [currentView, background1, background2]);

  const handleCardsUpdate = useCallback(async () => {
    const allGameCards = await cardService.getAllCards();
    setAllCards(allGameCards);
  }, []);

  useEffect(() => {
    loadSiteConfig();
    const loadInitialData = async () => {
        const [savedCollection, allGameCards, achievements] = await Promise.all([
            cardService.getUserCollection(nickname),
            cardService.getAllCards(),
            achievementService.getAchievementProgress(nickname)
        ]);
        setUserCardCollection(savedCollection);
        setAllCards(allGameCards);
        setAchievementProgress(achievements);
    };
    loadInitialData().catch(console.error);
  }, [nickname, loadSiteConfig]);

  const fetchLeaderboardData = useCallback(async () => {
    try {
        const allUsers = await userService.getUsers();
        const nonAdminUsers = allUsers.filter(user => !user.isAdmin);

        const userStatsPromises = nonAdminUsers.map(async user => {
            const collection = await cardService.getUserCollection(user.nickname);
            return {
                nickname: user.nickname,
                cardCount: collection.length,
                wealth: user.coins + (user.points * 10), // Points are 10x more valuable
            };
        });

        const userStats = await Promise.all(userStatsPromises);

        const topCollectors = [...userStats]
            .sort((a, b) => b.cardCount - a.cardCount)
            .slice(0, 10)
            .map(user => ({ nickname: user.nickname, value: user.cardCount }));
        
        const richestUsers = [...userStats]
            .sort((a, b) => b.wealth - a.wealth)
            .slice(0, 10)
            .map(user => ({ nickname: user.nickname, value: user.wealth }));
        
        setLeaderboardData({
            collectors: topCollectors,
            richest: richestUsers,
        });
    } catch (error) {
        console.error("Failed to fetch leaderboard data:", error);
        setLeaderboardData(null); // Explicitly clear on error
    }
  }, []); // This function has no dependencies on component state, it fetches all data fresh.

  useEffect(() => {
    // This effect handles fetching leaderboard data when the view changes to 'home'.
    if (currentView === 'home') {
      fetchLeaderboardData();
    }
  }, [currentView, fetchLeaderboardData]);
  
  useEffect(() => {
    const newBg = siteConfig[`view_${currentView}_background`] || siteConfig.view_collection_background;
    if (!newBg) return;

    if (isBg1Active) {
        if (newBg !== background1) {
            setBackground2(newBg);
            setIsBg1Active(false);
        }
    } else {
        if (newBg !== background2) {
            setBackground1(newBg);
            setIsBg1Active(true);
        }
    }
  }, [currentView, siteConfig, isBg1Active, background1, background2]);

  useEffect(() => {
    const timer = setInterval(() => {
        setCoins(prev => prev + 10);
        setShowFreeCoinNotification(true);
        auditService.logTransaction(nickname, 'coin', 10, 'Free Coins');
    }, 600000); // 10 minutes

    return () => clearInterval(timer);
  }, [nickname]);
  
  useEffect(() => {
    if (!isAdmin) return;
    const checkSuspiciousUsers = async () => {
        const suspiciousUsers = await auditService.getSuspiciousUsers();
        setSuspiciousUserCount(suspiciousUsers.size);
    };
    checkSuspiciousUsers();
    const interval = setInterval(checkSuspiciousUsers, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isAdmin]);

  const addNotification = useCallback((message: string, type: 'success' | 'info' | 'quest' | 'error', options: { reward?: number } = {}) => {
    const id = notificationIdCounter.current++;
    setNotifications(prev => [...prev, { id, message, type, ...options }]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleSpin = useCallback((cost: number) => {
    setCoins(prev => Math.max(0, prev - cost));
  }, []);

  const handleWinCoins = useCallback((amount: number) => {
      setCoins(prev => prev + amount);
      auditService.logTransaction(nickname, 'coin', amount, 'Slot Machine');
      addNotification(`คุณได้รับ ${amount} เหรียญ!`, 'success');
  }, [addNotification, nickname]);

  const handleWinPoints = useCallback((amount: number) => {
      setPoints(prev => prev + amount);
      auditService.logTransaction(nickname, 'point', amount, 'Slot Machine');
      addNotification(`คุณได้รับ ${amount} แต้ม!`, 'success');
  }, [addNotification, nickname]);
  
  const handlePachinkoWin = useCallback((coinAmount: number, pointAmount: number) => {
      if (coinAmount > 0) {
        setCoins(c => c + coinAmount);
        auditService.logTransaction(nickname, 'coin', coinAmount, 'Pachinko');
      }
      if (pointAmount > 0) {
        setPoints(p => p + pointAmount);
        auditService.logTransaction(nickname, 'point', pointAmount, 'Pachinko');
      }
      if (coinAmount > 0 || pointAmount > 0) {
        addNotification(`คุณได้รับ ${coinAmount > 0 ? `${coinAmount} เหรียญ` : ''}${coinAmount > 0 && pointAmount > 0 ? ' และ ' : ''}${pointAmount > 0 ? `${pointAmount} แต้ม` : ''}!`, 'success');
      }
  }, [addNotification, nickname]);

  const handleWinCards = useCallback(async (wonCards: Card[]) => {
      if (wonCards.length === 0) return;
      const currentCollection = await cardService.getUserCollection(nickname);
      const newCollection = [...currentCollection, ...wonCards];
      await cardService.saveUserCollection(nickname, newCollection);
      setUserCardCollection(newCollection);
      addNotification(`คุณได้รับการ์ดใหม่ ${wonCards.length} ใบ!`, 'success');
  }, [addNotification, nickname]);

  const handleQuestComplete = useCallback((petName: string, questName: string, reward: number, pointsReward: number) => {
    setCoins(prev => prev + reward);
    setPoints(prev => prev + pointsReward);
    auditService.logTransaction(nickname, 'coin', reward, `Pet Quest: ${questName}`);
    auditService.logTransaction(nickname, 'point', pointsReward, `Pet Quest: ${questName}`);
    addNotification(
      `${petName} สำเร็จเควส "${questName}"`,
      'quest',
      { reward }
    );
  }, [addNotification, nickname]);

  const handlePetCareCost = useCallback((cost: number) => {
    setCoins(prev => Math.max(0, prev - cost));
  }, []);

  const handleLuckyDrawPrize = useCallback((type: 'coin' | 'point', amount: number) => {
    if (type === 'coin') {
      setCoins(prev => prev + amount);
      auditService.logTransaction(nickname, 'coin', amount, 'Lucky Draw');
    } else if (type === 'point') {
      setPoints(prev => prev + amount);
       auditService.logTransaction(nickname, 'point', amount, 'Lucky Draw');
    }
  }, [nickname]);

  const handleFindCardPack = useCallback(() => {
    // For simplicity, let's assume pets always find a Season 1 pack
    setUserPacks(prev => [...prev, 1]);
    addNotification('สัตว์เลี้ยงของคุณเจอซองการ์ด!', 'success');
  }, [addNotification]);

  const handlePackOpened = useCallback(async (openedCards: Card[], openedPackSeason: number) => {
    const currentCollection = await cardService.getUserCollection(nickname);
    const newCollection = [...currentCollection, ...openedCards];
    await cardService.saveUserCollection(nickname, newCollection);
    setUserCardCollection(newCollection);

    addNotification(`คุณได้รับการ์ดใหม่ ${openedCards.length} ใบ!`, 'success');
    
    setUserPacks(prevPacks => {
        const indexToRemove = prevPacks.indexOf(openedPackSeason);
        if (indexToRemove > -1) {
            const newPacks = [...prevPacks];
            newPacks.splice(indexToRemove, 1);
            return newPacks;
        }
        return prevPacks;
    });
  }, [addNotification, nickname]);
  
  const handleBuyPack = useCallback((pack: CardPack, quantity: number): boolean => {
    const totalCost = pack.cost * quantity;
    if (coins < totalCost) {
      return false;
    }
    setCoins(prev => prev - totalCost);
    const newPacks = Array(quantity).fill(pack.id);
    setUserPacks(prev => [...prev, ...newPacks]);
    auditService.logTransaction(nickname, 'coin', -totalCost, `Buy ${quantity}x Pack: ${pack.name}`);
    return true;
  }, [coins, nickname]);
  
  const handleCurrencyChange = useCallback((coinChange: number, pointChange: number) => {
    setCoins(prev => prev + coinChange);
    setPoints(prev => prev + pointChange);
  }, []);

  const handleCollectionChange = useCallback((newCollection: Card[]) => {
      setUserCardCollection(newCollection);
  }, []);

  const handlePacksChange = useCallback((newPacks: number[]) => {
      setUserPacks(newPacks);
  }, []);

  const handleRedeemCardFragments = useCallback(() => {
    if (!pet) return;
    
    const newInventory = [...pet.inventory];
    const fragmentStackIndex = newInventory.findIndex(stack => stack?.item.id === 'special_card_fragment');

    if (fragmentStackIndex === -1 || newInventory[fragmentStackIndex]!.quantity < 10) {
        addNotification("มีเศษการ์ดไม่เพียงพอ (ต้องการ 10 ชิ้น)", "error");
        return;
    }

    const fragmentStack = newInventory[fragmentStackIndex]!;
    if (fragmentStack.quantity > 10) {
        fragmentStack.quantity -= 10;
    } else {
        newInventory[fragmentStackIndex] = null;
    }

    const newCard = getRandomCardByPetStats(pet, allCards);
    const newCollection = [...userCardCollection, newCard];
    
    setPet(prevPet => prevPet ? { ...prevPet, inventory: newInventory } : null);
    setUserCardCollection(newCollection);

    cardService.saveUserCollection(nickname, newCollection);

    addNotification(`คุณแลกเศษการ์ดและได้รับการ์ด: ${newCard.name[language]}!`, "success");
    auditService.logTransaction(nickname, 'point', 0, 'Redeem Card Fragments'); // Log the event
}, [pet, allCards, userCardCollection, nickname, language, addNotification]);

// --- Dungeon Logic ---
const findEmptyInventorySlot = (inventory: (InventoryItem | null)[]) => {
    return inventory.findIndex(slot => slot === null);
};

useEffect(() => {
    const timer = setInterval(() => {
        setActiveDungeonQuests(quests => 
            quests.map(q => {
                if (q.endTime <= Date.now()) {
                    return { ...q, progress: 100 };
                }
                const progress = ((Date.now() - q.startTime) / (q.endTime - q.startTime)) * 100;
                return { ...q, progress: Math.min(100, progress) };
            })
        );
    }, 1000);
    return () => clearInterval(timer);
}, []);


const handleStartDungeonQuest = useCallback((dungeon: Dungeon, party: Card[]) => {
    const partyState: DungeonCardState[] = party.map(card => ({
        ...card,
        currentHp: card.stats.hp,
    }));

    const availableColors = ['#60a5fa', '#34d399', '#a78bfa']; // blue, green, purple
    const colorIndex = activeDungeonQuests.length % availableColors.length;
    
    // Simulate the entire dungeon run at the start
    let finalParty: DungeonCardState[] = JSON.parse(JSON.stringify(partyState));
    const log: DungeonLogEntry[] = [{ text: `[00:00] เริ่มออกเดินทางสู่ ${dungeon.name}!`, type: 'info' }];
    const finalRewards: InventoryItem[] = [];
    const isHardcore = dungeon.id === 'dungeon_hardcore';
    
    const numEvents = isHardcore 
        ? Math.floor(dungeon.duration / (60 * 1000) / 1.5) // Event every ~1.5 min for hardcore
        : Math.floor(dungeon.duration / (60 * 1000) / 2) || 1; 

    const damageMultiplier = isHardcore ? 2.5 : 1;
    const statCheckPenalty = isHardcore ? 15 : 0;
    
    const durationMinutes = dungeon.duration / (60 * 1000);

    for (let i = 0; i < numEvents; i++) {
        const timestamp = `[${Math.floor((durationMinutes / numEvents) * i).toString().padStart(2, '0')}:${Math.floor(Math.random()*60).toString().padStart(2, '0')}]`;
        if (finalParty.every(card => card.currentHp <= 0)) {
            log.push({ text: `${timestamp} ทีมพ่ายแพ้ทั้งหมด...`, type: 'fail' });
            break;
        }

        const event = DUNGEON_EVENT_DATABASE[Math.floor(Math.random() * DUNGEON_EVENT_DATABASE.length)];
        const survivingParty = finalParty.filter(c => c.currentHp > 0);
        const targetCard = survivingParty[Math.floor(Math.random() * survivingParty.length)];
        
        let success = true;
        if (event.statCheck) {
            const cardStat = targetCard.stats[event.statCheck.stat];
            const roll = Math.random() * 100;
            success = cardStat > (event.statCheck.difficulty - roll + statCheckPenalty);
        }

        if (event.damage && !success) {
            const dungeonLevelFactor = (dungeon.levelRange.min + dungeon.levelRange.max) / 2;
            const baseDamage = dungeonLevelFactor * (event.damage.min + Math.random() * (event.damage.max - event.damage.min)) / 10;
            const damageTaken = Math.max(1, Math.floor((baseDamage - (targetCard.stats.defense / 10)) * damageMultiplier));
            
            targetCard.currentHp = Math.max(0, targetCard.currentHp - damageTaken);
            log.push({ text: `${timestamp} ${targetCard.name[language]} ได้รับความเสียหาย ${damageTaken} จาก "${event.text}"! (HP: ${targetCard.currentHp})`, type: 'damage'});
        } else if (event.type === 'combat' && success) {
             log.push({ text: `${timestamp} เอาชนะ ${event.text.replace('เผชิญหน้ากับ ', '')} ได้!`, type: 'success' });
        } else {
            log.push({ text: `${timestamp} ${event.text}`, type: event.type });
        }

        if (event.rewardItem && success && (Math.random() * 100 < event.rewardItem.chance)) {
            const itemTemplate = ITEM_DATABASE.find(item => item.name === event.rewardItem.itemName);
            if (itemTemplate) {
                finalRewards.push(itemTemplate);
                log.push({ text: `${timestamp} พบ ${itemTemplate.name}!`, type: 'reward' });
            }
        }
    }

    const outcomes: DungeonQuestOutcome[] = finalParty.map(card => ({
        cardId: card.id, cardName: card.name, status: card.currentHp > 0 ? 'survived' : 'destroyed',
    }));
    
    if (finalParty.some(c => c.currentHp > 0)) {
        log.push({ text: `[${durationMinutes.toString().padStart(2,'0')}:00] ภารกิจสำเร็จ! ได้รับรางวัล`, type: 'success' });
        const rewardTier = dungeon.rewardTiers.uncommon;
        const itemTemplate = ITEM_DATABASE.find(item => item.id === rewardTier.item);
        if (itemTemplate) {
            for (let i = 0; i < rewardTier.quantity; i++) {
                 finalRewards.push(itemTemplate);
            }
        }
    } else {
        log.push({ text: `[${durationMinutes.toString().padStart(2,'0')}:00] ภารกิจล้มเหลว ทีมถูกกำจัดทั้งหมด`, type: 'fail' });
    }
    
    const newQuest: ActiveDungeonQuest = {
        questId: `dq-${Date.now()}`,
        dungeon,
        party: partyState,
        startTime: Date.now(),
        endTime: Date.now() + dungeon.duration,
        log: log,
        rewards: finalRewards,
        outcomes: outcomes,
        progress: 0,
        logColor: availableColors[colorIndex],
    };

    setActiveDungeonQuests(prev => [...prev, newQuest]);
    addNotification(`ทีมของคุณได้ออกเดินทางสู่ ${dungeon.name} แล้ว!`, 'info');
}, [addNotification, activeDungeonQuests.length, language]);


const handleClaimDungeonRewards = useCallback(async (questId: string): Promise<QuestCompletionData | undefined> => {
    const quest = activeDungeonQuests.find(q => q.questId === questId);
    if (!quest || Date.now() < quest.endTime || !pet) return undefined;

    let itemsToGive: InventoryItem[] = [...quest.rewards];
    const destroyedCards = quest.outcomes.filter(o => o.status === 'destroyed');
    const fragmentTemplate = ITEM_DATABASE.find(item => item.id === 'special_card_fragment');

    if (fragmentTemplate) {
        destroyedCards.forEach(() => {
            for(let i = 0; i < 10; i++) {
                itemsToGive.push(fragmentTemplate);
            }
        });
    }
    
    const { updatedPet, itemsNotAdded } = addItemsToInventory(pet, itemsToGive);
    setPet(updatedPet);

    if (itemsNotAdded.length > 0) {
        addNotification(`กระเป๋าสัตว์เลี้ยงเต็ม! ไอเท็มบางส่วนไม่ถูกเพิ่ม`, 'error');
    }

    const destroyedCardIds = new Set(destroyedCards.map(c => c.cardId));
    if (destroyedCardIds.size > 0) {
        const newCollection = userCardCollection.filter(c => !destroyedCardIds.has(c.id));
        handleCollectionChange(newCollection);
        await cardService.saveUserCollection(nickname, newCollection);
    }

    setActiveDungeonQuests(prev => prev.filter(q => q.questId !== questId));
    addNotification(`สำเร็จเควสดันเจี้ยน ${quest.dungeon.name}!`, 'success');
    
    const finalRewardsStacks = quest.rewards.reduce((acc, item) => {
        const existing = acc.find(stack => stack.item.id === item.id);
        if (existing) {
            existing.quantity++;
        } else {
            acc.push({ item, quantity: 1 });
        }
        return acc;
    }, [] as StackedInventoryItem[]);

    return {
        dungeonName: quest.dungeon.name,
        log: quest.log,
        rewards: finalRewardsStacks,
        outcomes: quest.outcomes
    };
}, [activeDungeonQuests, pet, userCardCollection, addNotification, handleCollectionChange, nickname, setPet]);


  // --- Achievement Logic ---
  const checkAndSaveAchievements = useCallback(async () => {
    if (isCheckingAchievements) return;
    setIsCheckingAchievements(true);
    
    const currentProgress = await achievementService.getAchievementProgress(nickname);

    let hasChanged = false;
    const newProgress = { ...currentProgress };

    ACHIEVEMENT_DATABASE.forEach(ach => {
        if (newProgress[ach.id]?.claimed) return;

        let progressValue = 0;
        switch(ach.criteria.type) {
            case 'COLLECT_TOTAL_CARDS':
                progressValue = userCardCollection.length;
                break;
            case 'COLLECT_RARITY_CARDS':
                 progressValue = userCardCollection.filter(c => c.season === ach.criteria.season && c.rarity === ach.criteria.rarity).length;
                break;
            case 'PET_LEVEL':
                progressValue = pet?.level || 0;
                break;
            // More criteria can be added here as state tracking is implemented
        }

        const existing = newProgress[ach.id]?.progress || 0;
        if (progressValue > existing) {
            newProgress[ach.id] = { ...newProgress[ach.id], progress: progressValue, claimed: false };
            hasChanged = true;
        } else if (!newProgress[ach.id]) {
            newProgress[ach.id] = { progress: progressValue, claimed: false };
            hasChanged = true;
        }
    });

    if (hasChanged) {
        await achievementService.saveAchievementProgress(nickname, newProgress);
        setAchievementProgress(newProgress);
    }
    setIsCheckingAchievements(false);
  }, [isCheckingAchievements, pet, userCardCollection, nickname]);

  useEffect(() => {
    checkAndSaveAchievements();
  }, [userCardCollection, pet, checkAndSaveAchievements]);

  const handleClaimAchievementReward = useCallback(async (achievementId: string) => {
    const ach = ACHIEVEMENT_DATABASE.find(a => a.id === achievementId);
    const progress = achievementProgress[achievementId];
    if (!ach || !progress || progress.claimed || progress.progress < ach.criteria.value) return;

    const reward = ach.reward;
    if (reward.type === 'coins') {
        const amount = reward.amount || 0;
        setCoins(c => c + amount);
        auditService.logTransaction(nickname, 'coin', amount, `Achievement: ${ach.name}`);
        addNotification(`ได้รับ ${amount} เหรียญ จากภารกิจ!`, 'success');
    } else if (reward.type === 'points') {
        const amount = reward.amount || 0;
        setPoints(p => p + amount);
        auditService.logTransaction(nickname, 'point', amount, `Achievement: ${ach.name}`);
        addNotification(`ได้รับ ${amount} แต้ม จากภารกิจ!`, 'success');
    } else if (reward.type === 'item' && reward.itemId && pet) {
        const itemTemplate = ITEM_DATABASE.find(item => item.id === reward.itemId);
        if (itemTemplate) {
            const itemsToAdd = Array(reward.amount || 1).fill(itemTemplate);
            const { updatedPet, itemsNotAdded } = addItemsToInventory(pet, itemsToAdd);
            setPet(updatedPet);

            const addedCount = itemsToAdd.length - itemsNotAdded.length;
            if (addedCount > 0) {
                 addNotification(`ได้รับ ${itemTemplate.name} x${addedCount} จากภารกิจ!`, 'success');
            }
            if(itemsNotAdded.length > 0) {
                 addNotification(`กระเป๋าสัตว์เลี้ยงเต็ม!`, 'error');
            }
        }
    }

    const newProgress = { ...achievementProgress, [achievementId]: { ...progress, claimed: true } };
    setAchievementProgress(newProgress);
    await achievementService.saveAchievementProgress(nickname, newProgress);
    addNotification(`สำเร็จภารกิจ: ${ach.name}!`, 'success');
  }, [achievementProgress, nickname, pet, addNotification, setPet]);


  const renderView = () => {
    const seasonBanners: Record<number, string> = {};
    SEASON_CONFIG.forEach(season => {
        seasonBanners[season.season] = siteConfig[`season_${season.season}_banner`];
    });

    switch (currentView) {
      case 'home':
        return <HomeView isAdmin={isAdmin} allCards={allCards} userCards={userCardCollection} leaderboardData={leaderboardData} />;
      case 'news':
        return <NewsView isAdmin={isAdmin} />;
      case 'games':
        return <GamesView onNavigate={setCurrentView} />;
      case 'slot':
        return <SlotMachine 
                    nickname={nickname}
                    coins={coins} 
                    onSpin={handleSpin} 
                    allCards={allCards}
                    onWinCoins={handleWinCoins}
                    onWinCards={handleWinCards}
                    onWinPoints={handleWinPoints}
                    onNavigate={setCurrentView}
                    language={language}
                />;
      case 'pachinko':
        return <PachinkoView
                  nickname={nickname}
                  coins={coins}
                  onCost={handleSpin}
                  onWin={handlePachinkoWin}
                  onNavigate={setCurrentView}
                />;
      case 'collection':
        return <CardCollectionView 
                    isAdmin={false}
                    userCards={userCardCollection}
                    allCards={allCards}
                    seasonBanners={seasonBanners}
                    language={language}
                    onLanguageChange={setLanguage}
                    selectedSeason={selectedSeason}
                    setSelectedSeason={setSelectedSeason}
                />;
      case 'manageCards':
        return <CardCollectionView 
                    isAdmin={true}
                    seasonBanners={seasonBanners}
                    allCards={allCards}
                    onCardsUpdate={handleCardsUpdate}
                    language={language}
                    onLanguageChange={setLanguage}
                    selectedSeason={selectedSeason}
                    setSelectedSeason={setSelectedSeason}
                />;
      case 'addPack':
        return <AddCardPackView onBack={() => setCurrentView('manageCards')} />;
      case 'manageUsers':
        return <ManageUsersView onBack={() => setCurrentView('manageCards')} />;
       case 'manageBanners':
        return <ManageBannersView onConfigChange={loadSiteConfig} />;
      case 'pets':
        return <PetView 
                  nickname={nickname} 
                  coins={coins}
                  points={points}
                  onQuestComplete={handleQuestComplete}
                  onCareCost={handlePetCareCost}
                  onFindCardPack={handleFindCardPack}
                  onCurrencyChange={handleCurrencyChange}
                  pet={pet}
                  setPet={setPet}
                  questBackgrounds={petQuestBackgrounds}
                  homeBackgrounds={petHomeBackgrounds}
                  siteConfig={siteConfig}
               />;
      case 'luckyDraw':
        return <LuckyDrawView
                  nickname={nickname}
                  onPrizeWon={handleLuckyDrawPrize}
                />;
      case 'packOpening':
        return <CardPackOpeningView
                  nickname={nickname}
                  userPacks={userPacks}
                  onPackOpened={handlePackOpened}
                  onPacksChange={handlePacksChange}
                  onBack={() => setCurrentView('collection')}
                  addNotification={(msg, type) => addNotification(msg, type as any)}
                  language={language}
                  userCardCollection={userCardCollection}
               />;
      case 'shop':
        return <ShopView
                  coins={coins}
                  onBuyPack={handleBuyPack}
                  pet={pet}
                  onRedeemCardFragments={handleRedeemCardFragments}
                  addNotification={(msg, type) => addNotification(msg, type as any)}
                />;
      case 'market':
        return <MarketplaceView
                  nickname={nickname}
                  coins={coins}
                  points={points}
                  userCards={userCardCollection}
                  userPacks={userPacks}
                  onCurrencyChange={handleCurrencyChange}
                  onCollectionChange={handleCollectionChange}
                  onPacksChange={handlePacksChange}
                  addNotification={(msg, type) => addNotification(msg, type as any)}
                  language={language}
               />;
       case 'chat':
        return <ChatView nickname={nickname} />;
      case 'dungeon':
        return <DungeonView
            userCards={userCardCollection}
            pet={pet}
            activeQuests={activeDungeonQuests}
            onStartQuest={handleStartDungeonQuest}
            onClaimRewards={handleClaimDungeonRewards}
            language={language}
            siteConfig={siteConfig}
        />;
      case 'achievements':
        return <AchievementsView userProgress={achievementProgress} onClaimReward={handleClaimAchievementReward} />;
      default:
        return null;
    }
  }
  
  const NavButton: React.FC<{ view: View; label: string; icon?: React.ReactNode; badge?: number }> = ({ view, label, icon, badge }) => {
    const isActive = currentView === view;
    const isDisabled = view === 'packOpening' && userPacks.length < 1;

    return (
        <button 
            onClick={() => {
              if (isDisabled) return;
              // Reset season view when navigating away from collection views
              if (currentView === 'collection' || currentView === 'manageCards') {
                  setSelectedSeason(1);
              }
              setCurrentView(view);
            }} 
            className={`relative flex items-center justify-center sm:justify-start gap-3 px-3 py-2.5 rounded-md transition-all text-base font-semibold w-full text-left group
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${isActive 
                ? 'bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }
            `}
        >
          <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-500 transition-transform duration-300 ${isActive ? 'scale-y-100' : 'scale-y-0'} group-hover:scale-y-50`}></div>
          <div className={`transition-transform duration-300 ${isActive ? 'translate-x-1' : ''}`}>
             {icon}
          </div>
          <span className="hidden sm:inline">{label}</span>
          {badge !== undefined && badge > 0 && (
              <span className="absolute top-1 right-1 sm:relative sm:top-auto sm:right-auto sm:ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {badge}
              </span>
          )}
        </button>
    );
};

  return (
    <div className="fixed inset-0">
        <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
            style={{ backgroundImage: `url(${background1})`, opacity: isBg1Active ? 1 : 0 }}
        />
        <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
            style={{ backgroundImage: `url(${background2})`, opacity: !isBg1Active ? 1 : 0 }}
        />
        <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-900/75" />

        <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
          <div className="fixed top-4 right-4 z-[100] flex flex-col items-end gap-3">
            {notifications.map(n => (
              <NotificationToast key={n.id} {...n} onClose={removeNotification} />
            ))}
          </div>
          <aside className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-r border-slate-300 dark:border-slate-700 w-full md:w-64 p-4 flex flex-col gap-6">
            <div className="relative flex items-center gap-3 text-slate-900 dark:text-white">
              <AnalogClock />
              <div>
                <h1 className="text-2xl font-bold font-rajdhani tracking-widest dark:text-white text-slate-900">STUDIO1923</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 tracking-wide">ซุปเปอร์เซฟโซน</p>
              </div>
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full transform rotate-12 shadow-md">
                BETA
              </div>
            </div>

            <div className="flex-grow space-y-1">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 px-3 mt-4 mb-2">เมนูหลัก</h2>
                <NavButton view="home" label="หน้าหลัก" icon={<HomeIcon className="w-5 h-5" />} />
                <NavButton view="news" label="ข่าวสารและกิจกรรม" icon={<NewspaperIcon className="w-5 h-5" />} />
                <NavButton view="achievements" label="ภารกิจ" icon={<MedalIcon className="w-5 h-5" />} />
                <NavButton view="collection" label="คอลเลคชั่นการ์ด" icon={<CollectionIcon className="w-5 h-5" />} />
                <NavButton view="packOpening" label="เปิดซองการ์ด" icon={<PackOpeningIcon className="w-5 h-5" />} badge={userPacks.length} />
                <NavButton view="shop" label="ร้านค้า" icon={<ShopIcon className="w-5 h-5" />} />
                <NavButton view="market" label="ตลาดซื้อขายการ์ด" icon={<ScaleIcon className="w-5 h-5" />} />
                <NavButton view="games" label="เกมส์" icon={<GamepadIcon className="w-5 h-5" />} />
                <NavButton view="dungeon" label="ดันเจี้ยน" icon={<DungeonIcon className="w-5 h-5" />} />
                <NavButton view="pets" label="สัตว์เลี้ยง" icon={<PetIcon className="w-5 h-5" />} />
                <NavButton view="luckyDraw" label="Lucky Draw" icon={<LuckyDrawIcon className="w-5 h-5" />} />
                <NavButton view="chat" label="ห้องแชท" icon={<ChatBubbleIcon className="w-5 h-5" />} />

                {isAdmin && (
                    <>
                        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 px-3 mt-6 mb-2">แผงควบคุม</h2>
                        <div className="space-y-1">
                            <NavButton view="manageCards" label="การ์ดทั้งหมด" icon={<ManageCardsIcon className="w-5 h-5" />} />
                            <NavButton view="addPack" label="เพิ่มซองการ์ด" icon={<AddPackIcon className="w-5 h-5" />} />
                            <NavButton view="manageUsers" label="จัดการผู้ใช้" icon={<ManageUsersIcon className="w-5 h-5" />} badge={suspiciousUserCount} />
                            <NavButton view="manageBanners" label="จัดการแบนเนอร์" icon={<BannerIcon className="w-5 h-5" />} />
                        </div>
                    </>
                )}
            </div>

            <div className="space-y-3">
              <div className="relative">
                <FreeCoinNotification show={showFreeCoinNotification} amount={10} onAnimationEnd={() => setShowFreeCoinNotification(false)} />
                <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800/50 p-2 rounded-lg">
                    <CoinIcon className="w-6 h-6 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white text-lg w-full text-right">{coins.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800/50 p-2 rounded-lg">
                  <PointIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                  <span className="font-bold text-slate-900 dark:text-white text-lg w-full text-right">{points.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-200 dark:bg-slate-800/50 p-3 rounded-lg">
                {isAdmin ? <AdminIcon className="w-8 h-8 text-yellow-500 dark:text-yellow-400" /> : <UserIcon className="w-8 h-8 text-slate-500 dark:text-slate-400" />}
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{nickname}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{isAdmin ? 'ผู้ดูแลระบบ' : 'สมาชิก'}</p>
                </div>
              </div>
              <button 
                onClick={onLogout} 
                className="w-full text-center bg-red-600/20 hover:bg-red-600/40 text-red-700 dark:text-white dark:bg-red-600/50 dark:hover:bg-red-600/80 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          </aside>

          <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
            <header className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300 dark:border-slate-700 rounded-lg p-4 mb-8 flex justify-center sm:justify-start">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {currentView === 'home' && '📖 คู่มือเกม'}
                {currentView === 'news' && '📰 ข่าวสารและกิจกรรม'}
                {currentView === 'achievements' && '🏆 ภารกิจและความสำเร็จ'}
                {currentView === 'collection' && `📚 คอลเลคชั่นของคุณ - ${SEASON_CONFIG.find(s => s.season === selectedSeason)?.name || ''}`}
                {currentView === 'packOpening' && '✨ คลังซองการ์ด'}
                {currentView === 'shop' && '🛒 ร้านค้าซองการ์ด'}
                {currentView === 'market' && '⚖️ ตลาดซื้อขายการ์ด'}
                {currentView === 'games' && '🎮 เกมส์'}
                {currentView === 'slot' && '🎰 Slots'}
                {currentView === 'pachinko' && '👾 Pachinko'}
                {currentView === 'dungeon' && '⚔️ ดันเจี้ยน'}
                {currentView === 'pets' && '🐾 EmojiMon World'}
                {currentView === 'luckyDraw' && '🎁 Lucky Draw ประจำวัน'}
                {currentView === 'chat' && '💬 ห้องแชทกลาง'}
                {currentView === 'manageCards' && `🗃️ คลังการ์ด - ${SEASON_CONFIG.find(s => s.season === selectedSeason)?.name || ''}`}
                {currentView === 'addPack' && '📦 เพิ่มซองการ์ด'}
                {currentView === 'manageUsers' && '👥 จัดการผู้ใช้'}
                {currentView === 'manageBanners' && '🖼️ จัดการแบนเนอร์และพื้นหลัง'}
              </h2>
            </header>
            
            {renderView()}
          </main>
          <style>{`
            main {
                height: 100vh;
            }
            main::-webkit-scrollbar {
                width: 8px;
            }
            main::-webkit-scrollbar-track {
                background: transparent;
            }
            main::-webkit-scrollbar-thumb {
                background-color: rgba(100, 116, 139, 0.5); /* slate-500 */
                border-radius: 10px;
                border: 2px solid transparent;
                background-clip: content-box;
            }
            main::-webkit-scrollbar-thumb:hover {
                background-color: rgba(100, 116, 139, 0.7);
            }
            html.light main::-webkit-scrollbar-thumb {
                background-color: rgba(148, 163, 184, 0.5); /* slate-400 */
            }
             html.light main::-webkit-scrollbar-thumb:hover {
                background-color: rgba(148, 163, 184, 0.7);
            }
            .toast-anim {
                animation-duration: 0.5s;
                animation-fill-mode: forwards;
                animation-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
            }
            .toast-anim.enter {
                animation-name: slideInRight;
            }
            .toast-anim.exit {
                animation-name: slideOutRight;
            }
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
          `}</style>
        </div>
    </div>
  );
};

export default LoggedInView;