import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Search, Plus, Trash2, Calendar, Droplet, Flame, Save, RefreshCw, 
  ChevronDown, Check, X, Edit2, Download, Upload, BarChart2, User, BookOpen, Menu, Camera, Copy, Activity, Target, Database
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// --- CONFIGURAZIONE FIREBASE CORAZZATA (ANTI-CRASH) ---
let app, auth, db;
try {
  // Se hai le tue chiavi di Firebase, puoi incollarle all'interno di queste parentesi graffe:
  const hardcodedConfig = {}; 
  
  const envConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
  const finalConfig = Object.keys(hardcodedConfig).length > 0 ? hardcodedConfig : envConfig;

  if (Object.keys(finalConfig).length > 0 && finalConfig.apiKey) {
    app = initializeApp(finalConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Firebase bypassato: Modalità Locale attivata.", error);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- DATABASE LOCALE ---
const basicFoodsDB = [
  { name: "Riso bianco cotto (Sushi)", calories: 130, protein: 2.7, carbs: 28.0, fat: 0.3 },
  { name: "Riso nero cotto", calories: 140, protein: 3.0, carbs: 30.0, fat: 1.0 },
  { name: "Salmone crudo", calories: 208, protein: 20.0, carbs: 0.0, fat: 13.0 },
  { name: "Avocado", calories: 160, protein: 2.0, carbs: 8.5, fat: 14.7 },
  { name: "Philadelphia classica", calories: 255, protein: 4.5, carbs: 3.0, fat: 25.0 },
  { name: "Edamame sgusciati", calories: 122, protein: 11.0, carbs: 10.0, fat: 5.0 },
  { name: "Salsa agrodolce piccante", calories: 190, protein: 0.5, carbs: 45.0, fat: 0.2 },
  { name: "Salsa di soia", calories: 53, protein: 8.0, carbs: 5.0, fat: 0.0 },
  { name: "Philadelphia proteica", calories: 87, protein: 11.0, carbs: 4.9, fat: 2.5, hasPieces: true, pieceWeight: 175 },
  { name: "Yogurt greco 0%", calories: 57, protein: 10.0, carbs: 4.0, fat: 0.0 },
  { name: "Albume d'uovo", calories: 52, protein: 11.0, carbs: 0.7, fat: 0.2 },
  { name: "Olio di oliva", calories: 884, protein: 0.0, carbs: 0.0, fat: 100.0 },
  { name: "Pomodori", calories: 19, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { name: "Patate", calories: 77, protein: 2.0, carbs: 17.0, fat: 0.1 },
  { name: "Macinato magro bovino adulto", calories: 147, protein: 21.0, carbs: 0, fat: 6.9 },
  { name: "Petto di pollo", calories: 120, protein: 23.0, carbs: 0, fat: 2.6 },
  { name: "Piadine integrali (Roberto)", calories: 283, protein: 8.5, carbs: 44.0, fat: 5.6, hasPieces: true, pieceWeight: 110 },
  { name: "Tonno rio mare 80g", calories: 403, protein: 25.0, carbs: 0, fat: 34.0, hasPieces: true, pieceWeight: 52 },
  { name: "Prosciutto crudo di Parma", calories: 267, protein: 26.0, carbs: 0.3, fat: 18.0 },
  { name: "Prosciutto cotto stella Negroni", calories: 136, protein: 19.5, carbs: 0.5, fat: 5.8 },
  { name: "Mozzarella proteica Granarolo", calories: 131, protein: 20.0, carbs: 1.4, fat: 5.0, hasPieces: true, pieceWeight: 100 },
  { name: "Melanzane", calories: 20, protein: 1.0, carbs: 3.5, fat: 0.2 },
  { name: "Grana padano", calories: 398, protein: 33.0, carbs: 0, fat: 29.0 },
  { name: "Parmigiano reggiano", calories: 402, protein: 32.0, carbs: 0, fat: 30.0 },
  { name: "Pecorino romano", calories: 387, protein: 32.0, carbs: 0, fat: 29.0 },
  { name: "Riso basmati", calories: 350, protein: 8.0, carbs: 78.0, fat: 0.9 },
  { name: "Uva", calories: 64, protein: 0.5, carbs: 15.6, fat: 0.1 },
  { name: "Miele", calories: 304, protein: 0.3, carbs: 80.0, fat: 0 },
  { name: "Caffè", calories: 2, protein: 0.1, carbs: 0.3, fat: 0.1 },
  { name: "Ketchup zero", calories: 46, protein: 1.5, carbs: 8.0, fat: 0.1 },
  { name: "Maionese light", calories: 231, protein: 0.5, carbs: 16.0, fat: 19.2 },
  { name: "Stracciatella", calories: 240, protein: 9.1, carbs: 1.4, fat: 22.0 },
  { name: "Zucchero", calories: 387, protein: 0, carbs: 100, fat: 0 },
  { name: "Farina 00", calories: 340, protein: 10, carbs: 70, fat: 1 },
  { name: "Farina Manitoba", calories: 341, protein: 14, carbs: 68, fat: 1 },
  { name: "Farina Caputo pizzeria", calories: 352, protein: 13, carbs: 70, fat: 1.5 },
  { name: "Burro", calories: 717, protein: 0.8, carbs: 0.1, fat: 81 },
  { name: "Uova sgusciate", calories: 143, protein: 13, carbs: 0.7, fat: 9.5, pieceWeight: 55, hasPieces: true },
  { name: "Latte intero", calories: 64, protein: 3.3, carbs: 5, fat: 3.6 },
  { name: "Panna fresca liquida", calories: 337, protein: 2, carbs: 3, fat: 35 },
  { name: "Lievito di birra secco", calories: 325, protein: 40, carbs: 41, fat: 4 },
  { name: "Cannella in polvere", calories: 247, protein: 4, carbs: 80, fat: 1.2 }
].sort((a, b) => b.name.length - a.name.length);

const generateId = (prefix) => {
  const rand1 = Math.random().toString(36).substring(2, 9);
  const rand2 = Math.floor(Math.random() * 1000000);
  return `${prefix}_${Date.now()}_${rand1}_${rand2}`;
};

export default function MacroTracker() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('diario');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [syncStatus, setSyncStatus] = useState('loading');
  const [toastMessage, setToastMessage] = useState('');

  // --- STATO OFFLINE-FIRST CORAZZATO ---
  const loadLocal = (key, fallback) => {
    try { 
      const item = localStorage.getItem(`mt_${key}`); 
      const parsed = item ? JSON.parse(item) : fallback;
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } 
    catch(e) { return fallback; }
  };

  const [diary, setDiary] = useState(() => loadLocal('diary', []));
  const [customFoods, setCustomFoods] = useState(() => loadLocal('customFoods', []));
  const [customRecipes, setCustomRecipes] = useState(() => loadLocal('customRecipes', []));
  const [customMeals, setCustomMeals] = useState(() => loadLocal('customMeals', []));
  const [recentFoods, setRecentFoods] = useState(() => loadLocal('recentFoods', []));
  const [activeCalMap, setActiveCalMap] = useState(() => loadLocal('activeCalMap', {}));
  const [waterMap, setWaterMap] = useState(() => loadLocal('waterMap', {}));
  const [weightMap, setWeightMap] = useState(() => loadLocal('weightMap', {}));
  const [profile, setProfile] = useState(() => loadLocal('profile', { 
    age: 30, weight: 70, height: 175, gender: 'M', 
    customWaterTarget: null, targetKcal: null, targetPro: null, targetCar: null, targetFat: null,
    goalMode: 'manual', smartGoal: 'recomp', jobActivity: 1.1, workoutActivity: 0.2
  }));

  // Stati UI
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [barcodeQuery, setBarcodeQuery] = useState('');

  const [newFood, setNewFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', isPackage: false, packageWeight: '', totalPieces: '' });
  const [editingFoodId, setEditingFoodId] = useState(null);

  const [recipeText, setRecipeText] = useState('');
  const [extractedIngs, setExtractedIngs] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeYield, setRecipeYield] = useState(1);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualSearchResults, setManualSearchResults] = useState([]);
  const [manualAddQty, setManualAddQty] = useState('');
  const [manualAddUnit, setManualAddUnit] = useState('g');

  const [editingMealId, setEditingMealId] = useState(null);
  const [mealBuilder, setMealBuilder] = useState({ name: '', items: [] });
  const [mealSearchQuery, setMealSearchQuery] = useState('');
  const [mealSearchResults, setMealSearchResults] = useState([]);

  const [selectedDiaryItems, setSelectedDiaryItems] = useState([]);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [mealModalName, setMealModalName] = useState('');
  const [mealModalSelectedExisting, setMealModalSelectedExisting] = useState('');

  const [swipedItemId, setSwipedItemId] = useState(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e, id) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e, id) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartX.current - currentX;
    const diffY = touchStartY.current - currentY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 20) {
      if (diffX > 50) setSwipedItemId(id); 
      else if (diffX < -30) setSwipedItemId(null); 
    }
  };

  // Autenticazione protetta per evitare crash se manca Firebase
  useEffect(() => {
    if (!auth) {
      setSyncStatus('local_only');
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (err) {
        setSyncStatus('local_only');
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
    });
    return () => unsubscribe();
  }, []);

  // Salvataggio ibrido: sempre locale, cloud solo se disponibile
  useEffect(() => {
    if (syncStatus === 'loading') return;
    const isCloudAvailable = user && db && auth;
    
    setSyncStatus(isCloudAvailable ? 'saving' : 'local_only');
    
    const dataToSave = { 
      diary: diary || [], customFoods: customFoods || [], customRecipes: customRecipes || [], 
      customMeals: customMeals || [], recentFoods: recentFoods || [], 
      activeCalMap: activeCalMap || {}, waterMap: waterMap || {}, weightMap: weightMap || {}, 
      profile: profile || {}
    };
    
    // Backup Locale Immediato Garantito
    Object.keys(dataToSave).forEach(key => localStorage.setItem(`mt_${key}`, JSON.stringify(dataToSave[key])));

    // Se Firebase esiste, salva nel Cloud
    if (isCloudAvailable) {
      const timer = setTimeout(async () => {
        try {
          const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'user_data', 'macrotracker_v3');
          await setDoc(docRef, dataToSave);
          setSyncStatus('synced');
        } catch (err) { setSyncStatus('error'); }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [diary, customFoods, customRecipes, customMeals, recentFoods, activeCalMap, waterMap, weightMap, profile, user]);

  useEffect(() => {
    document.body.style.overflow = (isMenuOpen || isMealModalOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen, isMealModalOpen]);

  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };

  const getBMR = () => {
    const w = parseFloat(profile?.weight) || 70;
    const h = parseFloat(profile?.height) || 175;
    const a = parseFloat(profile?.age) || 30;
    return profile?.gender === 'M' ? Math.round(10 * w + 6.25 * h - 5 * a + 5) : Math.round(10 * w + 6.25 * h - 5 * a - 161);
  };

  const bmr = getBMR();
  const dailyDiary = useMemo(() => (diary || []).filter(d => d.date === selectedDate), [diary, selectedDate]);
  const safeActiveCalMap = activeCalMap || {};
  const safeWaterMap = waterMap || {};
  const safeWeightMap = weightMap || {};

  const dailyActiveCals = Number(safeActiveCalMap[selectedDate]) || 0;
  const dailyWater = Number(safeWaterMap[selectedDate]) || 0;
  const todayWeight = safeWeightMap[selectedDate] !== undefined ? safeWeightMap[selectedDate] : (profile?.weight || '');
  
  const suggestedWater = profile?.weight ? Math.round(profile.weight * 30) : 2100;
  const dailyWaterTarget = profile?.customWaterTarget ? Number(profile.customWaterTarget) : suggestedWater;

  const isActiveDay = dailyDiary.length > 0 || dailyActiveCals > 0 || safeWeightMap[selectedDate] !== undefined;

  const dailyTotals = useMemo(() => {
    if (!isActiveDay) return { cal: 0, pro: 0, car: 0, fat: 0, balance: 0 };
    const totals = dailyDiary.reduce((acc, curr) => ({
      cal: acc.cal + (curr.calories || 0), pro: acc.pro + (curr.protein || 0),
      car: acc.car + (curr.carbs || 0), fat: acc.fat + (curr.fat || 0)
    }), { cal: 0, pro: 0, car: 0, fat: 0 });
    return { ...totals, balance: totals.cal - (bmr + dailyActiveCals) };
  }, [dailyDiary, isActiveDay, bmr, dailyActiveCals]);

  const historyData = useMemo(() => {
    const daysMap = {};
    (diary || []).forEach(item => {
      if (!daysMap[item.date]) daysMap[item.date] = { date: item.date, intake: 0, active: 0, weight: safeWeightMap[item.date] };
      daysMap[item.date].intake += (item.calories || 0);
    });
    Object.entries(safeActiveCalMap).forEach(([date, active]) => {
      if (!daysMap[date]) daysMap[date] = { date, intake: 0, active: 0, weight: safeWeightMap[date] };
      daysMap[date].active = Number(active) || 0;
    });
    Object.entries(safeWeightMap).forEach(([date, weight]) => {
        if (!daysMap[date]) daysMap[date] = { date, intake: 0, active: 0, weight: weight };
    });
    
    return Object.values(daysMap).sort((a, b) => new Date(b.date) - new Date(a.date)).map(day => {
      const burn = bmr + day.active;
      return { ...day, burn, balance: day.intake - burn };
    });
  }, [diary, safeActiveCalMap, safeWeightMap, bmr]);

  const showWeightReminder = useMemo(() => {
     const dates = Object.keys(safeWeightMap).sort();
     const lastDateStr = dates.pop(); 
     if (!lastDateStr) return true; 
     const diffTime = Math.abs(new Date(todayStr) - new Date(lastDateStr));
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
     return diffDays > 15;
  }, [safeWeightMap, todayStr]);

  const applySmartGoals = () => {
      if (!profile.weight || !profile.height || !profile.age) return showToast("Compila i dati biometrici nel profilo!");
      
      const multiplier = (parseFloat(profile.jobActivity) || 1.1) + (parseFloat(profile.workoutActivity) || 0);
      const tdee = bmr * multiplier;
      
      let targetKcal = tdee;
      let pF = 2.0; let fF = 1.0;

      switch(profile.smartGoal) {
          case 'lose_fat_fast': targetKcal = tdee - 600; pF = 2.4; fF = 0.8; break;
          case 'lose_fat_steady': targetKcal = tdee - 300; pF = 2.2; fF = 0.9; break;
          case 'recomp': targetKcal = tdee - 100; pF = 2.5; fF = 0.9; break;
          case 'lean_bulk': targetKcal = tdee + 250; pF = 2.0; fF = 1.0; break;
          case 'dirty_bulk': targetKcal = tdee + 500; pF = 2.0; fF = 1.2; break;
          default: targetKcal = tdee; pF = 2.0; fF = 1.0;
      }

      const pro = Math.round(profile.weight * pF);
      const fat = Math.round(profile.weight * fF);
      const car = Math.max(0, Math.round((targetKcal - (pro * 4) - (fat * 9)) / 4));

      setProfile(p => ({
          ...p, targetKcal: Math.round(targetKcal), targetPro: pro, targetFat: fat, targetCar: car,
          goalMode: 'smart' 
      }));
      showToast("Obiettivi Smart Applicati!");
  };

  const handleCopyFromYesterday = () => {
    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayItems = (diary || []).filter(d => d.date === yesterdayStr);
    if (yesterdayItems.length === 0) return showToast("Nessun alimento da copiare da ieri.");
    const newItems = yesterdayItems.map(item => ({ ...item, diaryId: generateId('copy'), date: selectedDate }));
    setDiary(prev => [...(prev || []), ...newItems]);
    if (safeWaterMap[yesterdayStr]) setWaterMap(p => ({...p, [selectedDate]: safeWaterMap[yesterdayStr]}));
    showToast(`Copiati ${newItems.length} elementi da ieri!`);
  };

  const addFoodToDiary = (food, qty, unit = 'g') => {
    const safeQty = Number(qty) || 0;
    let factor = safeQty / 100;
    if (unit === 'pz') factor = ((food.pieceWeight || 100) * safeQty) / 100;

    const newItem = {
      ...food, diaryId: generateId('diary'), date: selectedDate, displayQty: qty, unit: unit,
      calories: Math.round((food.baseCalories || food.calories || 0) * factor), protein: parseFloat(((food.baseProtein || food.protein || 0) * factor).toFixed(1)),
      carbs: parseFloat(((food.baseCarbs || food.carbs || 0) * factor).toFixed(1)), fat: parseFloat(((food.baseFat || food.fat || 0) * factor).toFixed(1)),
      baseCalories: food.baseCalories || food.calories || 0, baseProtein: food.baseProtein || food.protein || 0,
      baseCarbs: food.baseCarbs || food.carbs || 0, baseFat: food.baseFat || food.fat || 0,
    };
    setDiary(prev => [...(prev || []), newItem]);
    setRecentFoods(prev => [food, ...(prev || []).filter(f => f.name !== food.name)].slice(0, 20));
    showToast(`Aggiunto: ${food.name}`);
  };

  const addMealToDiary = (meal) => {
    // BUG FIX: Creiamo array completo e facciamo un solo push nello stato per non sovrascrivere
    const newItems = (meal.items || []).map((item, idx) => {
        const qty = parseFloat(item.displayQty) || 100;
        let factor = qty / 100;
        if (item.unit === 'pz') factor = ((item.pieceWeight || 100) * qty) / 100;

        return {
            ...item,
            diaryId: generateId(`meal_item_${idx}`),
            date: selectedDate,
            displayQty: qty,
            unit: item.unit || 'g',
            calories: Math.round((item.baseCalories || item.calories || 0) * factor),
            protein: parseFloat(((item.baseProtein || item.protein || 0) * factor).toFixed(1)),
            carbs: parseFloat(((item.baseCarbs || item.carbs || 0) * factor).toFixed(1)),
            fat: parseFloat(((item.baseFat || item.fat || 0) * factor).toFixed(1))
        };
    });
    setDiary(prev => [...(prev || []), ...newItems]);
    showToast(`Pasto iniettato: ${meal.name}`);
  };

  const handleCreateMealFromSelection = () => {
    if (!mealModalName.trim()) return showToast("Inserisci un nome per il pasto");
    const itemsToAdd = dailyDiary.filter(d => selectedDiaryItems.includes(d.diaryId)).map(d => ({
        id: generateId('meal_item'), name: d.name, displayQty: d.displayQty !== undefined ? d.displayQty : 100,
        unit: d.unit || 'g', hasPieces: d.hasPieces || d.unit === 'pz', pieceWeight: d.pieceWeight || 100,
        baseCalories: d.baseCalories || 0, baseProtein: d.baseProtein || 0, baseCarbs: d.baseCarbs || 0, baseFat: d.baseFat || 0
    }));
    setCustomMeals(prev => [...(prev || []), { id: generateId('meal'), name: mealModalName.trim(), items: itemsToAdd }]);
    setSelectedDiaryItems([]); setIsMealModalOpen(false); setMealModalName(''); showToast("Pasto creato!");
  };

  const fetchOpenFoodFacts = async (query, isBarcode = false) => {
    try {
      const url = isBarcode 
        ? `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(query)}.json`
        : `https://it.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=6`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (isBarcode && data.status === 1 && data.product) {
         const p = data.product;
         let kcal = p.nutriments['energy-kcal_100g'] || Math.round((p.nutriments.energy_100g || 0) / 4.184);
         return [{
            id: p._id, name: p.product_name || "Prodotto", calories: Math.round(kcal || 0),
            protein: parseFloat(p.nutriments.proteins_100g || 0), carbs: parseFloat(p.nutriments.carbohydrates_100g || 0),
            fat: parseFloat(p.nutriments.fat_100g || 0), source: 'api'
         }];
      } else if (!isBarcode && data.products) {
         return data.products.filter(p => p.nutriments && (p.nutriments['energy-kcal_100g'] || p.nutriments.energy_100g)).map(p => {
          let kcal = p.nutriments['energy-kcal_100g'] || Math.round(p.nutriments.energy_100g / 4.184);
          return {
            id: p._id, name: p.product_name || "Prodotto", calories: Math.round(kcal || 0),
            protein: parseFloat(p.nutriments.proteins_100g || 0), carbs: parseFloat(p.nutriments.carbohydrates_100g || 0),
            fat: parseFloat(p.nutriments.fat_100g || 0), source: 'api'
          };
        });
      }
      return [];
    } catch (e) { return []; }
  };

  const handleSearch = async (query, type = 'catalog') => {
    const isCatalog = type === 'catalog';
    const isMeal = type === 'meal';
    const isManual = type === 'manual';
    
    if (isCatalog) setSearchQuery(query);
    if (isMeal) setMealSearchQuery(query);
    if (isManual) setManualSearchQuery(query);

    if (!query || query.length < 2) {
      if (isCatalog) setSearchResults([]); if (isMeal) setMealSearchResults([]); if (isManual) setManualSearchResults([]);
      return;
    }
    
    if (isCatalog) setIsSearching(true);
    
    const lower = query.toLowerCase();
    const localMatches = [...(customRecipes || []), ...(customFoods || []), ...basicFoodsDB]
      .filter(f => f.name.toLowerCase().includes(lower))
      .map(f => ({ ...f, source: 'local' }));
      
    if (isCatalog) setSearchResults(localMatches);
    if (isMeal) setMealSearchResults(localMatches.slice(0, 8));
    if (isManual) setManualSearchResults(localMatches.slice(0, 5));

    const apiMatches = await fetchOpenFoodFacts(query, false);
    
    const updateFunc = prev => {
      const ids = new Set((prev || []).map(i => i.name.toLowerCase()));
      return [...(prev || []), ...apiMatches.filter(a => !ids.has(a.name.toLowerCase()))];
    };
    
    if (isCatalog) { setSearchResults(updateFunc); setIsSearching(false); }
    if (isMeal) setMealSearchResults(updateFunc);
    if (isManual) setManualSearchResults(updateFunc);
  };

  const handleBarcodeSearch = async () => {
     if (!barcodeQuery || barcodeQuery.length < 5) return showToast("Codice EAN non valido.");
     setIsSearching(true);
     const result = await fetchOpenFoodFacts(barcodeQuery, true);
     setIsSearching(false);
     if (result.length > 0) {
        setSearchResults(result); showToast("Prodotto Trovato!"); setBarcodeQuery('');
     } else { showToast("Prodotto non trovato nel database globale."); }
  };

  const extractIngredients = async () => {
    if (!recipeText) return;
    setIsExtracting(true);
    const lines = recipeText.split('\n').map(l => l.replace(/[:,.-]/g, ' ').replace(/\s+/g, ' ').trim()).filter(l => l);
    const parsedList = [];

    for (let line of lines) {
      let qty = 100; let isPieces = false; let nameStr = line;
      const matchPrefix = line.match(/^(\d+(?:[.,]\d+)?)\s*(g|ml|pz|fette)?\s+(.+)$/i);
      const matchSuffix = line.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(g|ml|pz|fette)?$/i);
      const matchNumberIsolated = line.match(/^(\d+)\s+(.+)$/i) || line.match(/^(.+)\s+(\d+)$/i);

      if (matchPrefix) { qty = parseFloat(matchPrefix[1].replace(',', '.')); isPieces = !matchPrefix[2] || ['pz', 'fette'].includes(matchPrefix[2].toLowerCase()); nameStr = matchPrefix[3].trim(); } 
      else if (matchSuffix) { qty = parseFloat(matchSuffix[2].replace(',', '.')); isPieces = !matchSuffix[3] || ['pz', 'fette'].includes(matchSuffix[3].toLowerCase()); nameStr = matchSuffix[1].trim(); } 
      else if (matchNumberIsolated) { if (line.match(/^(\d+)\s+(.+)$/i)) { qty = parseFloat(matchNumberIsolated[1]); nameStr = matchNumberIsolated[2].trim(); } else { qty = parseFloat(matchNumberIsolated[2]); nameStr = matchNumberIsolated[1].trim(); } isPieces = true; }

      let foundMacro = [...(customFoods || []), ...basicFoodsDB].find(f => nameStr.toLowerCase().includes(f.name.toLowerCase()));
      if (!foundMacro) {
        let terms = nameStr.split(' ').slice(0, 2).join(' ');
        try {
          const res = await fetch(`https://it.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(terms)}&search_simple=1&json=1&page_size=1`);
          const data = await res.json();
          const p = data.products?.find(pr => pr.nutriments && (pr.nutriments['energy-kcal_100g'] || pr.nutriments.energy_100g));
          if (p) foundMacro = { name: p.product_name, calories: p.nutriments['energy-kcal_100g'] || Math.round(p.nutriments.energy_100g / 4.184), protein: p.nutriments.proteins_100g || 0, carbs: p.nutriments.carbohydrates_100g || 0, fat: p.nutriments.fat_100g || 0 };
        } catch (e) {}
      }

      const base = foundMacro || { name: nameStr, calories: 0, protein: 0, carbs: 0, fat: 0 };
      let weightGrams = qty;
      if (isPieces && base.pieceWeight) weightGrams = qty * base.pieceWeight;
      else if (isPieces && nameStr.toLowerCase().includes('uov')) weightGrams = qty * 55;

      parsedList.push({
        id: generateId('ing'), name: base.name, qty: qty, unit: isPieces ? 'pz' : 'g',
        baseCalories: base.calories || 0, baseProtein: base.protein || 0, baseCarbs: base.carbs || 0, baseFat: base.fat || 0,
        weightInGrams: weightGrams, pieceWeight: base.pieceWeight || (nameStr.toLowerCase().includes('uov') ? 55 : 100)
      });
      await new Promise(r => setTimeout(r, 200));
    }
    setExtractedIngs(parsedList); setIsExtracting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans relative">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsMenuOpen(true)} className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">MacroTracker Pro</h1>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          {syncStatus === 'saving' && <span className="text-orange-400 font-semibold flex items-center"><RefreshCw size={14} className="mr-1 animate-spin"/> Sync...</span>}
          {syncStatus === 'synced' && <span className="text-emerald-400 flex items-center"><Check size={16} className="mr-1"/> Cloud</span>}
          {syncStatus === 'local_only' && <span className="text-amber-400 flex items-center"><Database size={14} className="mr-1"/> Locale</span>}
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-72 max-w-[80%] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center shadow-md">
              <h2 className="font-bold text-lg">Menu Principale</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-1 text-slate-300 hover:text-white"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain py-2">
              {[
                { id: 'diario', icon: '📅', label: 'Diario' },
                { id: 'catalogo', icon: '🔍', label: 'Catalogo' },
                { id: 'pasti', icon: '🍱', label: 'I miei pasti' },
                { id: 'ricette', icon: '🥣', label: 'Le mie ricette' },
                { id: 'crea_cibo', icon: '🥑', label: 'Crea cibo' },
                { id: 'idratazione', icon: '💧', label: 'Idratazione' },
                { id: 'storico', icon: '📊', label: 'Storico' },
                { id: 'profilo', icon: '👤', label: 'Profilo' }
              ].map(tab => (
                <button 
                  key={tab.id} onClick={() => { setActiveTab(tab.id); setIsMenuOpen(false); }} 
                  className={`w-full flex items-center px-6 py-4 font-bold text-sm transition-colors border-b border-slate-50 ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700 border-l-4 border-l-indigo-600' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                >
                  <span className="mr-3 text-lg">{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="p-4 max-w-3xl mx-auto space-y-6">
        
        {/* === SCHEDA DIARIO === */}
        {activeTab === 'diario' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {showWeightReminder && (
               <div className="bg-amber-100 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start shadow-sm">
                   <span className="text-xl mr-3">⚠️</span>
                   <p className="text-sm font-bold">Sono passati più di 15 giorni dalla tua ultima pesata. Registra il tuo peso odierno per mantenere i calcoli precisi!</p>
               </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border p-4 flex justify-between items-center relative z-0">
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-slate-100 p-2 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">BMR Attivo</p>
                <p className="font-bold text-lg">{bmr} kcal</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
              <h2 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-1">Bilancio Netto (Assunte - Bruciate)</h2>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <span className={`text-5xl font-black ${!isActiveDay ? 'text-slate-400' : dailyTotals.balance < 0 ? 'text-emerald-400' : dailyTotals.balance > 0 ? 'text-rose-400' : 'text-white'}`}>
                    {isActiveDay ? (dailyTotals.balance > 0 ? '+' : '') + dailyTotals.balance : '0'}
                  </span>
                  <span className="text-slate-400 ml-2 font-medium">kcal</span>
                </div>
                <div className="text-right space-y-1 text-sm text-slate-300">
                  <p>Assunte: <b>{dailyTotals.cal}</b></p>
                  <p>Bruciate: <b>{isActiveDay ? bmr + dailyActiveCals : 0}</b></p>
                </div>
              </div>

              {profile.targetKcal && (
                <div className="mb-5 bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    <span>Obiettivo Kcal</span>
                    <span>{dailyTotals.cal} / {profile.targetKcal} kcal</span>
                  </div>
                  <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div style={{width: `${Math.min((dailyTotals.cal / profile.targetKcal)*100, 100)}%`}} className={`h-full rounded-full transition-all ${dailyTotals.cal > profile.targetKcal ? 'bg-rose-500' : 'bg-indigo-400'}`}></div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4 border-t border-slate-700 pt-4">
                <div className="bg-slate-800/50 p-3 rounded-2xl text-center">
                  <p className="text-indigo-300 text-xs font-bold uppercase">Pro</p>
                  <p className="font-bold text-lg">{(dailyTotals.pro || 0).toFixed(0)}g</p>
                  {profile.targetPro && <p className="text-[10px] text-slate-400 mt-1">/ {profile.targetPro}g</p>}
                  {profile.targetPro && <div className="h-1.5 bg-slate-700 mt-1.5 rounded-full overflow-hidden"><div style={{width: `${Math.min((dailyTotals.pro / profile.targetPro)*100, 100)}%`}} className="h-full bg-indigo-400 rounded-full"></div></div>}
                </div>
                <div className="bg-slate-800/50 p-3 rounded-2xl text-center">
                  <p className="text-amber-300 text-xs font-bold uppercase">Carbo</p>
                  <p className="font-bold text-lg">{(dailyTotals.car || 0).toFixed(0)}g</p>
                  {profile.targetCar && <p className="text-[10px] text-slate-400 mt-1">/ {profile.targetCar}g</p>}
                  {profile.targetCar && <div className="h-1.5 bg-slate-700 mt-1.5 rounded-full overflow-hidden"><div style={{width: `${Math.min((dailyTotals.car / profile.targetCar)*100, 100)}%`}} className="h-full bg-amber-400 rounded-full"></div></div>}
                </div>
                <div className="bg-slate-800/50 p-3 rounded-2xl text-center">
                  <p className="text-rose-300 text-xs font-bold uppercase">Grassi</p>
                  <p className="font-bold text-lg">{(dailyTotals.fat || 0).toFixed(0)}g</p>
                  {profile.targetFat && <p className="text-[10px] text-slate-400 mt-1">/ {profile.targetFat}g</p>}
                  {profile.targetFat && <div className="h-1.5 bg-slate-700 mt-1.5 rounded-full overflow-hidden"><div style={{width: `${Math.min((dailyTotals.fat / profile.targetFat)*100, 100)}%`}} className="h-full bg-rose-400 rounded-full"></div></div>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center text-center">
                <div className="flex items-center space-x-1.5 mb-2"><Flame className="text-orange-500" size={18} /><p className="text-xs font-bold text-slate-500 uppercase">Cal. Attive</p></div>
                <input type="number" value={safeActiveCalMap[selectedDate] !== undefined ? safeActiveCalMap[selectedDate] : ''} onChange={e => setActiveCalMap(p => ({...p, [selectedDate]: e.target.value === '' ? '' : parseInt(e.target.value)}))} placeholder="0" className="w-full bg-slate-50 p-2 rounded-xl text-center font-bold text-lg outline-none" />
              </div>
              <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center text-center">
                <div className="flex items-center space-x-1.5 mb-2"><Activity className="text-indigo-500" size={18} /><p className="text-xs font-bold text-slate-500 uppercase">Peso Odierno</p></div>
                <div className="flex items-center space-x-1">
                   <input type="number" value={todayWeight} onChange={e => {
                       const v = e.target.value === '' ? '' : parseFloat(e.target.value);
                       setWeightMap(p => ({...(p || {}), [selectedDate]: v}));
                       if(new Date(selectedDate) >= new Date(todayStr)) setProfile(p => ({...p, weight: v}));
                   }} placeholder="kg" className="w-20 bg-slate-50 p-2 rounded-xl text-center font-bold text-lg outline-none" />
                   <span className="text-sm font-bold text-slate-400">kg</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center space-x-1.5"><Droplet className="text-cyan-500" size={18} /><p className="text-xs font-bold text-slate-500 uppercase">Idratazione</p></div>
                   <div className="text-right"><span className="font-bold text-lg text-cyan-600">{dailyWater}</span><span className="text-xs text-slate-500"> / {dailyWaterTarget} ml</span></div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex mb-4">
                   <div style={{ width: `${Math.min((dailyWater / dailyWaterTarget) * 100, 100)}%` }} className={`h-full transition-all duration-500 ${dailyWater >= dailyWaterTarget ? 'bg-emerald-400' : 'bg-cyan-400'}`}></div>
                </div>
                <div className="flex space-x-2">
                   <button onClick={() => setWaterMap(p => ({...(p || {}), [selectedDate]: (Number((p || {})[selectedDate])||0) + 250}))} className="flex-1 bg-cyan-50 text-cyan-700 py-2 rounded-xl font-bold text-sm shadow-sm hover:shadow-md active:scale-95 transition-all">+ 250ml</button>
                   <button onClick={() => setWaterMap(p => ({...(p || {}), [selectedDate]: (Number((p || {})[selectedDate])||0) + 500}))} className="flex-1 bg-cyan-50 text-cyan-700 py-2 rounded-xl font-bold text-sm shadow-sm hover:shadow-md active:scale-95 transition-all">+ 500ml</button>
                   <button onClick={() => setWaterMap(p => ({...(p || {}), [selectedDate]: 0}))} className="px-3 bg-slate-100 text-slate-500 rounded-xl active:scale-95 transition-transform"><Trash2 size={16}/></button>
                </div>
             </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center ml-1 mb-2">
                <h3 className="font-bold text-lg">Alimenti Consumati</h3>
                <div className="flex space-x-2">
                   {dailyDiary.length === 0 && <button onClick={handleCopyFromYesterday} className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center shadow-sm active:scale-95 transition-all"><Copy size={12} className="mr-1"/> Copia Ieri</button>}
                   {dailyDiary.length > 0 && <button onClick={() => selectedDiaryItems.length === dailyDiary.length ? setSelectedDiaryItems([]) : setSelectedDiaryItems(dailyDiary.map(d => d.diaryId))} className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all">{selectedDiaryItems.length === dailyDiary.length ? 'Deseleziona' : 'Seleziona Tutti'}</button>}
                </div>
              </div>
              
              {dailyDiary.length === 0 ? (
                <div className="text-center p-8 bg-white border border-dashed rounded-2xl text-slate-400">Nessun alimento. Cerca nel catalogo o copia da ieri.</div>
              ) : (
                <>
                  {dailyDiary.map(item => (
                    <div key={item.diaryId} className="relative overflow-hidden rounded-2xl mb-3 shadow-sm border border-slate-200">
                      <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-rose-400 flex justify-end items-center px-6"><Trash2 className="text-white" size={24} /></div>
                      <div 
                        onTouchStart={(e) => handleTouchStart(e, item.diaryId)} onTouchMove={(e) => handleTouchMove(e, item.diaryId)}
                        className={`relative bg-white p-4 flex items-center space-x-3 transition-transform duration-300 ease-out ${swipedItemId === item.diaryId ? '-translate-x-20' : 'translate-x-0'}`}
                      >
                        <input type="checkbox" checked={selectedDiaryItems.includes(item.diaryId)} onChange={(e) => e.target.checked ? setSelectedDiaryItems(p => [...p, item.diaryId]) : setSelectedDiaryItems(p => p.filter(id => id !== item.diaryId))} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0" />
                        <div className="flex-1 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <div className="flex items-center space-x-2 text-sm mt-1">
                              <input 
                                type="number" value={item.displayQty !== undefined ? item.displayQty : ''} 
                                onChange={(e) => {
                                  const rawVal = e.target.value; const safeQty = Number(rawVal) || 0;
                                  let factor = safeQty / 100; if (item.unit === 'pz') factor = ((item.pieceWeight || 100) * safeQty) / 100;
                                  setDiary(prev => (prev || []).map(d => d.diaryId === item.diaryId ? { ...d, displayQty: rawVal, calories: Math.round((d.baseCalories || 0) * factor), protein: parseFloat(((d.baseProtein || 0) * factor).toFixed(1)), carbs: parseFloat(((d.baseCarbs || 0) * factor).toFixed(1)), fat: parseFloat(((d.baseFat || 0) * factor).toFixed(1)) } : d));
                                }}
                                className="w-16 bg-slate-50 p-1 rounded text-center outline-none border font-bold"
                              />
                              {(item.hasPieces || item.unit === 'pz') ? (
                                <select value={item.unit} onChange={(e) => {
                                    const newUnit = e.target.value; const safeQty = Number(item.displayQty) || 0;
                                    let factor = safeQty / 100; if (newUnit === 'pz') factor = ((item.pieceWeight || 100) * safeQty) / 100;
                                    setDiary(prev => (prev || []).map(d => d.diaryId === item.diaryId ? { ...d, unit: newUnit, calories: Math.round((d.baseCalories || 0) * factor), protein: parseFloat(((d.baseProtein || 0) * factor).toFixed(1)), carbs: parseFloat(((d.baseCarbs || 0) * factor).toFixed(1)), fat: parseFloat(((d.baseFat || 0) * factor).toFixed(1)) } : d));
                                  }} className="bg-slate-50 p-1 rounded border outline-none font-bold text-slate-600"
                                >
                                  <option value="g">g</option><option value="pz">pz</option>
                                </select>
                              ) : <span className="text-slate-500 font-medium">g</span>}
                              <div className="flex flex-col ml-2">
                                <span className="font-bold text-indigo-600">{item.calories} kcal</span>
                                <span className="text-[10px] text-slate-500 font-medium">P:{item.protein} C:{item.carbs} G:{item.fat}</span>
                              </div>
                            </div>
                          </div>
                          {swipedItemId === item.diaryId ? (
                             <button onClick={() => { setDiary(p => p.filter(d => d.diaryId !== item.diaryId)); setSwipedItemId(null); }} className="absolute right-0 h-full w-20 flex items-center justify-center bg-gradient-to-r from-rose-500 to-rose-400 text-white rounded-r-2xl shadow-inner -mr-4"><Trash2 size={20}/></button>
                          ) : (
                             <button onClick={() => { setDiary(p => p.filter(d => d.diaryId !== item.diaryId)); setSelectedDiaryItems(p => p.filter(id => id !== item.diaryId)); }} className="p-2 text-slate-300 hover:text-rose-400 hover:bg-rose-50 rounded-full flex-shrink-0 transition-colors md:hidden"><Trash2 size={18} /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedDiaryItems.length > 0 && (
                    <button onClick={() => setIsMealModalOpen(true)} className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white py-3.5 rounded-2xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all">🍱 Salva {selectedDiaryItems.length} in Pasto Usuale</button>
                  )}
                  <p className="text-center text-[10px] text-slate-400 mt-2 flex justify-center items-center"><ChevronDown size={12} className="mr-1 rotate-90"/> Scorri a sinistra l'alimento per eliminarlo velocemente</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* === SCHEDA STORICO === */}
        {activeTab === 'storico' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
              <div><h2 className="font-black text-xl text-slate-800">Storico Progressi</h2><p className="text-sm text-slate-500">Analisi trend peso e calorie</p></div>
              <BarChart2 className="text-indigo-500" size={32} />
            </div>

            <div className="space-y-4">
              {historyData.length === 0 ? (
                <div className="text-center p-8 bg-white border border-dashed rounded-2xl text-slate-400">Nessun dato storico disponibile.</div>
              ) : (
                historyData.map(day => {
                  const maxVal = Math.max(day.intake, day.burn, 1);
                  const inPct = (day.intake / maxVal) * 100;
                  const outPct = (day.burn / maxVal) * 100;
                  
                  return (
                  <div key={day.date} className="bg-white p-5 rounded-3xl border shadow-sm relative">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                         <p className="font-bold text-slate-800 capitalize">{new Date(day.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                         {day.weight && <p className="text-xs font-bold text-slate-400 flex items-center"><Activity size={12} className="mr-1"/> Peso: {day.weight} kg</p>}
                      </div>
                      <span className={`px-3 py-1.5 rounded-xl font-black text-sm border ${day.balance < 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        {day.balance > 0 ? '+' : ''}{day.balance} kcal
                      </span>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                       <div className="flex items-center text-sm">
                          <div className="w-16 text-slate-500 font-bold">Assunte</div>
                          <div className="flex-1 bg-slate-100 rounded-full h-3 flex overflow-hidden">
                             <div style={{width: `${inPct}%`}} className="bg-amber-400 h-full rounded-full transition-all"></div>
                          </div>
                          <div className="w-12 text-right font-bold text-slate-700">{day.intake}</div>
                       </div>
                       <div className="flex items-center text-sm">
                          <div className="w-16 text-slate-500 font-bold">Bruciate</div>
                          <div className="flex-1 bg-slate-100 rounded-full h-3 flex overflow-hidden">
                             <div style={{width: `${outPct}%`}} className="bg-indigo-400 h-full rounded-full transition-all"></div>
                          </div>
                          <div className="w-12 text-right font-bold text-slate-700">{day.burn}</div>
                       </div>
                    </div>
                  </div>
                )})
              )}
            </div>
          </div>
        )}

        {/* === SCHEDA PROFILO === */}
        {activeTab === 'profilo' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><User size={24} /></div>
                <div><h2 className="font-black text-xl text-slate-800">Profilo Biometrico</h2><p className="text-xs text-slate-500">Mifflin-St Jeor Formula</p></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Sesso</label>
                  <select value={profile.gender || 'M'} onChange={e => setProfile({ ...profile, gender: e.target.value })} className="w-full mt-1 bg-slate-50 border p-3 rounded-xl outline-none font-bold">
                    <option value="M">Uomo</option><option value="F">Donna</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Età (Anni)</label>
                  <input type="number" value={profile.age !== undefined ? profile.age : ''} onChange={e => setProfile({ ...profile, age: e.target.value === '' ? '' : parseFloat(e.target.value) })} className="w-full mt-1 bg-slate-50 border p-3 rounded-xl outline-none font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Peso (kg)</label>
                  <input type="number" value={profile.weight !== undefined ? profile.weight : ''} onChange={e => {
                     const v = e.target.value === '' ? '' : parseFloat(e.target.value);
                     setProfile({ ...profile, weight: v }); 
                     setWeightMap(p => ({...(p || {}), [todayStr]: v})); 
                  }} className="w-full mt-1 bg-slate-50 border p-3 rounded-xl outline-none font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Altezza (cm)</label>
                  <input type="number" value={profile.height !== undefined ? profile.height : ''} onChange={e => setProfile({ ...profile, height: e.target.value === '' ? '' : parseFloat(e.target.value) })} className="w-full mt-1 bg-slate-50 border p-3 rounded-xl outline-none font-bold" />
                </div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl flex justify-between items-center border border-indigo-100">
                <div><p className="text-xs font-bold text-indigo-800 uppercase">BMR Calcolato</p><p className="text-xs text-indigo-600">Consumo a riposo</p></div>
                <span className="text-2xl font-black text-indigo-700">{bmr} kcal</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
               <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center space-x-3">
                   <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Target size={24} /></div>
                   <div><h2 className="font-black text-xl text-slate-800">Obiettivi Macro</h2><p className="text-xs text-slate-500">I tuoi target giornalieri</p></div>
                 </div>
               </div>

               <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                  <button onClick={() => setProfile({...profile, goalMode: 'manual'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${profile.goalMode === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Manuale</button>
                  <button onClick={() => setProfile({...profile, goalMode: 'smart'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${profile.goalMode === 'smart' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm' : 'text-slate-500'}`}>Guidato (Smart)</button>
               </div>

               {profile.goalMode === 'smart' && (
                  <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 space-y-4 mb-4 animate-in slide-in-from-top-2">
                     <p className="text-xs font-bold text-indigo-800 uppercase mb-2">Motore di Calcolo TDEE</p>
                     <div>
                        <label className="text-xs font-bold text-slate-600">1. Lavoro / Stile di Vita (Senza Sport)</label>
                        <select value={profile.jobActivity} onChange={e => setProfile({...profile, jobActivity: parseFloat(e.target.value)})} className="w-full mt-1 bg-white border border-indigo-100 p-2.5 rounded-xl outline-none font-bold text-slate-700 shadow-sm">
                           <option value={1.1}>Sedentario (Es. ufficio, smart working)</option>
                           <option value={1.2}>Leggermente Attivo (Es. insegnante, commesso)</option>
                           <option value={1.3}>Attivo (Es. cameriere, artigiano)</option>
                           <option value={1.45}>Molto Attivo (Es. muratore, agricoltore)</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-600">2. Frequenza Allenamento (Sport)</label>
                        <select value={profile.workoutActivity} onChange={e => setProfile({...profile, workoutActivity: parseFloat(e.target.value)})} className="w-full mt-1 bg-white border border-indigo-100 p-2.5 rounded-xl outline-none font-bold text-slate-700 shadow-sm">
                           <option value={0}>Nessuno (0 allenamenti/settimana)</option>
                           <option value={0.1}>Leggero (1-2 allenamenti/settimana)</option>
                           <option value={0.2}>Moderato (3-5 allenamenti/settimana)</option>
                           <option value={0.3}>Intenso (6-7 allenamenti o agonismo)</option>
                        </select>
                     </div>
                     <div className="pt-2">
                        <label className="text-xs font-bold text-slate-600">3. Scegli il tuo Obiettivo</label>
                        <select value={profile.smartGoal} onChange={e => setProfile({...profile, smartGoal: e.target.value})} className="w-full mt-1 bg-white border border-indigo-100 p-2.5 rounded-xl outline-none font-bold text-slate-700 shadow-sm">
                           <option value="lose_fat_fast">Dimagrimento Veloce (Forte Deficit)</option>
                           <option value="lose_fat_steady">Dimagrimento Costante (Deficit Lieve)</option>
                           <option value="recomp">Ricomposizione (Massa pulita/Brucia Grassi)</option>
                           <option value="lean_bulk">Costruzione Massa Lenta (Lean Bulk)</option>
                           <option value="dirty_bulk">Massa Estrema (Dirty Bulk)</option>
                        </select>
                     </div>
                     <button onClick={applySmartGoals} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold py-3 rounded-xl mt-3 shadow-md hover:shadow-lg active:scale-95 transition-all">✨ Calcola e Applica Macro</button>
                  </div>
               )}

               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kcal Totali</label>
                    <input type="number" value={profile.targetKcal !== undefined && profile.targetKcal !== null ? profile.targetKcal : ''} onChange={e => setProfile({...profile, targetKcal: e.target.value === '' ? null : parseInt(e.target.value)})} placeholder="Es. 2000" className="w-full mt-1 bg-slate-50 border p-2.5 rounded-xl outline-none font-bold text-center text-indigo-600 shadow-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Proteine (g)</label>
                    <input type="number" value={profile.targetPro !== undefined && profile.targetPro !== null ? profile.targetPro : ''} onChange={e => setProfile({...profile, targetPro: e.target.value === '' ? null : parseInt(e.target.value)})} placeholder="Es. 150" className="w-full mt-1 bg-slate-50 border p-2.5 rounded-xl outline-none font-bold text-center shadow-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Carbo (g)</label>
                    <input type="number" value={profile.targetCar !== undefined && profile.targetCar !== null ? profile.targetCar : ''} onChange={e => setProfile({...profile, targetCar: e.target.value === '' ? null : parseInt(e.target.value)})} placeholder="Es. 200" className="w-full mt-1 bg-slate-50 border p-2.5 rounded-xl outline-none font-bold text-center shadow-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Grassi (g)</label>
                    <input type="number" value={profile.targetFat !== undefined && profile.targetFat !== null ? profile.targetFat : ''} onChange={e => setProfile({...profile, targetFat: e.target.value === '' ? null : parseInt(e.target.value)})} placeholder="Es. 60" className="w-full mt-1 bg-slate-50 border p-2.5 rounded-xl outline-none font-bold text-center shadow-sm" />
                  </div>
               </div>
               <p className="text-[10px] text-slate-400 text-center leading-tight mt-3">I valori inseriti fungeranno da traguardo visivo nelle barre di progresso della scheda Diario.</p>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <h3 className="font-black text-lg text-slate-800 mb-1">Backup Locale e Cloud</h3>
              <p className="text-sm text-slate-500 mb-4">Esporta un salvataggio o ripristina i dati.</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => {
                  const data = { diary, customFoods, customRecipes, customMeals, recentFoods, activeCalMap: safeActiveCalMap, waterMap: safeWaterMap, weightMap: safeWeightMap, profile, exportDate: new Date().toISOString() };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `macrotracker_backup_${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                  showToast("Backup Esportato!");
                }} className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl font-bold flex flex-col items-center shadow-md hover:shadow-lg active:scale-95 transition-all">
                  <Download size={22} className="mb-2" /><span>Esporta</span>
                </button>
                <label className="bg-indigo-50 text-indigo-700 border-2 border-dashed border-indigo-200 p-4 rounded-2xl font-bold flex flex-col items-center cursor-pointer hover:bg-indigo-100 hover:border-indigo-300 active:scale-95 transition-all">
                  <Upload size={22} className="mb-2" /><span>Importa</span>
                  <input type="file" accept=".json" onChange={e => {
                    const file = e.target.files[0]; if(!file) return;
                    const r = new FileReader();
                    r.onload = ev => {
                      try {
                        const p = JSON.parse(ev.target.result);
                        if(p.diary) setDiary(p.diary); if(p.customFoods) setCustomFoods(p.customFoods); if(p.customRecipes) setCustomRecipes(p.customRecipes);
                        if(p.customMeals) setCustomMeals(p.customMeals); if(p.profile) setProfile(p.profile); 
                        if(p.weightMap) setWeightMap(p.weightMap); if(p.waterMap) setWaterMap(p.waterMap); 
                        if(p.activeCalMap) setActiveCalMap(p.activeCalMap); if(p.recentFoods) setRecentFoods(p.recentFoods);
                        showToast("Ripristino completato!");
                      } catch(err) {}
                    }; r.readAsText(file);
                  }} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* === SCHEDA IDRATAZIONE === */}
        {activeTab === 'idratazione' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl"><Droplet size={24} /></div>
                  <div><h2 className="font-black text-xl text-slate-800">Piano Idratazione</h2><p className="text-xs text-slate-500">Linee guida nutrizionali: ~30ml per kg</p></div>
                </div>

                <div className="bg-cyan-50 p-5 rounded-2xl flex justify-between items-center border border-cyan-100 shadow-inner">
                  <div><p className="text-xs font-bold text-cyan-800 uppercase tracking-wider mb-1">Fabbisogno Suggerito</p><p className="text-sm font-medium text-cyan-700">Per il tuo peso ({profile?.weight || 0} kg)</p></div>
                  <span className="text-3xl font-black text-cyan-700">{suggestedWater} <span className="text-lg">ml</span></span>
                </div>

                <div className="pt-2">
                   <label className="text-sm font-bold text-slate-700 flex items-center space-x-2"><span>🎯 Imposta Target Personalizzato</span></label>
                   <p className="text-xs text-slate-500 mb-3 mt-1">Se desideri un obiettivo diverso, inseriscilo qui sotto. (Lascia vuoto per usare quello suggerito).</p>
                   <div className="relative">
                     <Droplet className="absolute left-4 top-4 text-slate-400" size={20} />
                     <input type="number" placeholder={`es. ${suggestedWater}`} value={profile.customWaterTarget !== undefined && profile.customWaterTarget !== null ? profile.customWaterTarget : ''} onChange={e => setProfile({...profile, customWaterTarget: e.target.value === '' ? null : parseInt(e.target.value)})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-2xl outline-none font-bold text-lg text-slate-700 focus:border-cyan-400" />
                   </div>
                </div>
             </div>
          </div>
        )}
        
        {/* === SCHEDA CATALOGO === */}
        {activeTab === 'catalogo' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-3">
               <div className="relative">
                 <Search className="absolute left-4 top-4 text-slate-400" size={20} />
                 <input type="text" placeholder="Ricerca testuale alimenti..." value={searchQuery} onChange={(e) => handleSearch(e.target.value, 'catalog')} className="w-full bg-white border-2 border-slate-200 p-4 pl-12 rounded-2xl font-medium focus:border-indigo-500 outline-none shadow-sm" />
               </div>
               
               <div className="flex space-x-2">
                  <div className="relative flex-1">
                     <Camera className="absolute left-3 top-3 text-indigo-400" size={18} />
                     <input type="number" placeholder="O digita Barcode (EAN)" value={barcodeQuery} onChange={e => setBarcodeQuery(e.target.value)} className="w-full bg-indigo-50/50 border border-indigo-100 p-2.5 pl-10 rounded-xl font-medium outline-none focus:border-indigo-400" />
                  </div>
                  <button onClick={handleBarcodeSearch} className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold px-4 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all">Cerca EAN</button>
               </div>
            </div>
            
            {isSearching && <p className="text-center text-slate-500 animate-pulse font-medium">Ricerca globale in corso...</p>}
            
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg">Risultati Ricerca</h3>
                {searchResults.map((food, i) => (
                  <div key={food.id || i} className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0 ${food.source === 'local' ? 'bg-emerald-50 border-emerald-100' : 'bg-white'}`}>
                    <div>
                      <p className="font-bold text-slate-800">{food.name} {food.source === 'local' && '⭐'}</p>
                      <p className="text-sm text-slate-500">{food.calories} kcal / 100g (P:{food.protein} C:{food.carbs} G:{food.fat})</p>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => addFoodToDiary(food, 100, 'g')} className="flex-1 bg-white border border-indigo-200 text-indigo-700 px-3 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-50 hover:border-indigo-300 active:scale-95 transition-all">+ 100g</button>
                      {food.hasPieces && <button onClick={() => addFoodToDiary(food, 1, 'pz')} className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-3 py-2 rounded-xl font-bold text-sm shadow-sm hover:shadow-md active:scale-95 transition-all">+ 1 pz</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!searchQuery && !barcodeQuery && recentFoods.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg">Ultimi Utilizzati</h3>
                {recentFoods.map((food, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                    <p className="font-bold text-slate-800">{food.name}</p>
                    <div className="flex space-x-2 items-center">
                      <button onClick={() => addFoodToDiary(food, 100, 'g')} className="flex-1 bg-white border border-indigo-200 text-indigo-700 px-3 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-50 hover:border-indigo-300 active:scale-95 transition-all">+ 100g</button>
                      {food.hasPieces && <button onClick={() => addFoodToDiary(food, 1, 'pz')} className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-3 py-2 rounded-xl font-bold text-sm shadow-sm hover:shadow-md active:scale-95 transition-all">+ 1 pz</button>}
                      <button onClick={() => setRecentFoods(p => p.filter((_, idx) => idx !== i))} className="p-2 text-slate-400 hover:text-rose-500 bg-slate-50 rounded-xl active:scale-95 transition-transform"><X size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* === SCHEDA CREA CIBO === */}
        {activeTab === 'crea_cibo' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
              <h2 className="font-black text-xl text-slate-800">{editingFoodId ? 'Modifica Cibo' : 'Crea Nuovo Cibo'}</h2>
              <input type="text" placeholder="Nome Alimento" value={newFood.name} onChange={e => setNewFood({ ...newFood, name: e.target.value })} className="w-full bg-slate-50 border p-3 rounded-xl outline-none font-bold shadow-sm" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Kcal per 100g" value={newFood.calories !== undefined ? newFood.calories : ''} onChange={e => setNewFood({ ...newFood, calories: e.target.value })} className="bg-slate-50 border p-3 rounded-xl outline-none shadow-sm" />
                <input type="number" placeholder="Proteine (g)" value={newFood.protein !== undefined ? newFood.protein : ''} onChange={e => setNewFood({ ...newFood, protein: e.target.value })} className="bg-slate-50 border p-3 rounded-xl outline-none shadow-sm" />
                <input type="number" placeholder="Carboidrati (g)" value={newFood.carbs !== undefined ? newFood.carbs : ''} onChange={e => setNewFood({ ...newFood, carbs: e.target.value })} className="bg-slate-50 border p-3 rounded-xl outline-none shadow-sm" />
                <input type="number" placeholder="Grassi (g)" value={newFood.fat !== undefined ? newFood.fat : ''} onChange={e => setNewFood({ ...newFood, fat: e.target.value })} className="bg-slate-50 border p-3 rounded-xl outline-none shadow-sm" />
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border">
                <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={newFood.isPackage} onChange={e => setNewFood({ ...newFood, isPackage: e.target.checked })} className="w-5 h-5 rounded text-indigo-600" />
                  <span>È una confezione a pezzi? (es. fette)</span>
                </label>
                {newFood.isPackage && (
                  <div className="flex space-x-4 mt-3">
                    <input type="number" placeholder="Peso Pezzo (g)" value={newFood.packageWeight} onChange={e => setNewFood({ ...newFood, packageWeight: e.target.value })} className="w-full p-2 rounded-lg border outline-none font-medium shadow-sm" />
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                 <button onClick={() => {
                     if (!newFood.name || !newFood.calories) return showToast("Nome e Calorie obbligatori");
                     let pieceWeight = 0; if (newFood.isPackage) pieceWeight = parseFloat(newFood.packageWeight) || 100;
                     
                     const foodData = { id: editingFoodId || generateId('custom_food'), name: newFood.name, calories: parseFloat(newFood.calories) || 0, protein: parseFloat(newFood.protein) || 0, carbs: parseFloat(newFood.carbs) || 0, fat: parseFloat(newFood.fat) || 0, hasPieces: newFood.isPackage, pieceWeight: pieceWeight, isCustom: true };
                     
                     if (editingFoodId) { 
                         setCustomFoods(prev => (prev || []).map(f => f.id === editingFoodId ? foodData : f)); 
                         setEditingFoodId(null); 
                     } else { 
                         setCustomFoods(prev => [...(prev || []), foodData]); 
                     }
                     
                     // Aggiornamento a cascata sui pasti usuali
                     setCustomMeals(prev => (prev || []).map(m => {
                         let changed = false;
                         const newItems = (m.items || []).map(it => {
                             if (it.name.toLowerCase() === foodData.name.toLowerCase()) { changed = true; return { ...it, name: foodData.name, baseCalories: foodData.calories, baseProtein: foodData.protein, baseCarbs: foodData.carbs, baseFat: foodData.fat, hasPieces: foodData.hasPieces, pieceWeight: foodData.pieceWeight }; }
                             return it;
                         });
                         return changed ? { ...m, items: newItems } : m;
                     }));
                     
                     setNewFood({ name: '', calories: '', protein: '', carbs: '', fat: '', isPackage: false, packageWeight: '', totalPieces: '' }); showToast(editingFoodId ? "Cibo Aggiornato!" : "Cibo Creato!");
                 }} className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all">{editingFoodId ? '💾 Aggiorna Alimento' : '💾 Salva Alimento'}</button>
                 {editingFoodId && <button onClick={() => { setEditingFoodId(null); setNewFood({ name: '', calories: '', protein: '', carbs: '', fat: '', isPackage: false, packageWeight: '', totalPieces: '' }); }} className="px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all">Annulla</button>}
              </div>
            </div>

            {customFoods.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg">I Tuoi Alimenti Creati</h3>
                {customFoods.map(food => {
                  const cals = food.hasPieces ? Math.round((food.calories * food.pieceWeight) / 100) : food.calories;
                  const p = food.hasPieces ? ((food.protein * food.pieceWeight) / 100).toFixed(1) : food.protein;
                  const c = food.hasPieces ? ((food.carbs * food.pieceWeight) / 100).toFixed(1) : food.carbs;
                  const f = food.hasPieces ? ((food.fat * food.pieceWeight) / 100).toFixed(1) : food.fat;
                  
                  return (
                  <div key={food.id} className="bg-white border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                    <div>
                      <p className="font-bold text-slate-800 text-lg">{food.name}</p>
                      <p className="text-sm text-slate-500">{cals} kcal {food.hasPieces ? `(P: ${p} C: ${c} G: ${f}) per pezzo da ${food.pieceWeight}g` : `(P: ${p} C: ${c} G: ${f}) su 100g`}</p>
                    </div>
                    <div className="flex space-x-2 items-center">
                      <button onClick={() => addFoodToDiary(food, 100, 'g')} className="flex-1 bg-white border border-indigo-200 text-indigo-700 px-3 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-50 hover:border-indigo-300 active:scale-95 transition-all">+ 100g</button>
                      {food.hasPieces && <button onClick={() => addFoodToDiary(food, 1, 'pz')} className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-3 py-2 rounded-xl font-bold text-sm shadow-sm hover:shadow-md active:scale-95 transition-all">+ 1 pz</button>}
                      <div className="flex space-x-1 ml-2">
                        <button onClick={() => { setEditingFoodId(food.id); setNewFood({ name: food.name, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat, isPackage: food.hasPieces, packageWeight: food.hasPieces ? food.pieceWeight : '', totalPieces: food.hasPieces ? 1 : '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 active:scale-95 transition-transform"><Edit2 size={18}/></button>
                        <button onClick={() => setCustomFoods(pr => pr.filter(x => x.id !== food.id))} className="p-2 text-rose-400 bg-rose-50 rounded-xl hover:bg-rose-100 active:scale-95 transition-transform"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}
        
        {/* === SCHEDA PASTI === */}
        {activeTab === 'pasti' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
              <h2 className="font-black text-xl text-slate-800">{editingMealId ? 'Modifica Pasto' : 'Crea Pasto Usuale'}</h2>
              <input type="text" placeholder="Nome del Pasto (es. Poké Grande)" value={mealBuilder.name} onChange={e => setMealBuilder({ ...mealBuilder, name: e.target.value })} className="w-full bg-slate-50 border p-3 rounded-xl outline-none font-bold text-slate-700 shadow-sm" />
              
              <div className="space-y-3 mt-4">
                {(mealBuilder.items || []).map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border flex justify-between items-center shadow-sm">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <input 
                          type="number" value={item.displayQty !== undefined ? item.displayQty : ''} 
                          onChange={(e) => {
                            const raw = e.target.value;
                            setMealBuilder(prev => ({ ...prev, items: (prev.items || []).map((it, i) => i === idx ? { ...it, displayQty: raw } : it) }));
                          }}
                          className="w-16 p-1.5 rounded-lg border text-center font-bold outline-none bg-white shadow-sm"
                        />
                        {(item.hasPieces || item.unit === 'pz') ? (
                          <select value={item.unit} onChange={(e) => setMealBuilder(prev => ({ ...prev, items: (prev.items || []).map((it, i) => i === idx ? { ...it, unit: e.target.value } : it) }))} className="p-1.5 rounded-lg border outline-none font-medium bg-white shadow-sm">
                            <option value="g">g</option><option value="pz">pz</option>
                          </select>
                        ) : <span>g</span>}
                        {(() => {
                          const sQ = Number(item.displayQty) || 0;
                          let f = sQ / 100; if (item.unit === 'pz') f = ((item.pieceWeight || 100) * sQ) / 100;
                          return (
                            <div className="flex flex-col ml-2">
                              <span className="text-xs text-indigo-600 font-bold">{Math.round((item.baseCalories || 0) * f)} kcal</span>
                              <span className="text-[10px] text-slate-500 font-medium">P:{((item.baseProtein || 0) * f).toFixed(1)} C:{((item.baseCarbs || 0) * f).toFixed(1)} G:{((item.baseFat || 0) * f).toFixed(1)}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <button onClick={() => setMealBuilder(p => ({ ...p, items: (p.items || []).filter((_, i) => i !== idx) }))} className="text-rose-400 p-2 active:scale-95 transition-transform"><Trash2 size={20}/></button>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t relative">
                <p className="text-sm font-bold text-slate-500 mb-2">Aggiungi ingrediente al pasto:</p>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="text" placeholder="Cerca tra Base, Tuoi Alimenti, Ricette e Web..." value={mealSearchQuery} onChange={e => handleSearch(e.target.value, 'meal')} className="w-full bg-white border-2 border-slate-200 p-2.5 pl-10 rounded-xl outline-none focus:border-indigo-400 shadow-sm" />
                </div>
                {mealSearchResults.length > 0 && (
                  <div className="mt-2 bg-white rounded-2xl shadow-xl border p-2 space-y-1 max-h-60 overflow-y-auto overscroll-contain relative z-20">
                    {mealSearchResults.map((food, i) => (
                      <div key={food.id || i} className="flex justify-between items-center p-2.5 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0">
                        <div>
                          <div className="flex items-center space-x-1.5"><span className="font-bold text-sm text-slate-800">{food.name}</span>{food.isRecipe && <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">Ricetta</span>}</div>
                          <p className="text-xs text-slate-500">{food.calories} kcal/100g • P: {food.protein}g | C: {food.carbs}g</p>
                        </div>
                        <button type="button" onClick={() => {
                          const dQ = food.hasPieces ? 1 : 100; const dU = food.hasPieces ? 'pz' : 'g';
                          setMealBuilder(p => ({ ...p, items: [...(p.items || []), { id: generateId('mi'), name: food.name, displayQty: dQ, unit: dU, hasPieces: food.hasPieces || false, pieceWeight: food.pieceWeight || 100, baseCalories: food.calories || 0, baseProtein: food.protein || 0, baseCarbs: food.carbs || 0, baseFat: food.fat || 0 }]}));
                          setMealSearchQuery(''); setMealSearchResults([]); showToast(`Aggiunto: ${food.name}`);
                        }} className="text-xs bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold px-3 py-2 rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center"><Plus size={14} className="mr-1" /> Aggiungi</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-2">
                <button onClick={() => {
                  if (!mealBuilder.name || !mealBuilder.items || mealBuilder.items.length === 0) return showToast("Nome e ingredienti necessari");
                  if (editingMealId) { setCustomMeals(p => (p || []).map(m => m.id === editingMealId ? { ...mealBuilder, id: editingMealId } : m)); setEditingMealId(null); } 
                  else { setCustomMeals(p => [...(p || []), { ...mealBuilder, id: generateId('meal') }]); }
                  setMealBuilder({ name: '', items: [] }); setMealSearchQuery(''); setMealSearchResults([]); showToast("Pasto Salvato!");
                }} className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all">{editingMealId ? '💾 Aggiorna Pasto' : '💾 Salva Pasto'}</button>
                {editingMealId && <button onClick={() => { setEditingMealId(null); setMealBuilder({ name: '', items: [] }); setMealSearchQuery(''); setMealSearchResults([]); }} className="px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all">Annulla</button>}
              </div>
            </div>

            {customMeals.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">I Tuoi Pasti Salvati</h3>
                {customMeals.map(meal => {
                  const mCals = (meal.items || []).reduce((sum, item) => {
                    const q = Number(item.displayQty) || 0; let f = q / 100; if (item.unit === 'pz') f = ((item.pieceWeight || 100) * q) / 100;
                    return sum + Math.round((item.baseCalories || 0) * f);
                  }, 0);
                  const mPro = (meal.items || []).reduce((sum, item) => { const q = Number(item.displayQty) || 0; let f = q / 100; if (item.unit === 'pz') f = ((item.pieceWeight || 100) * q) / 100; return sum + ((item.baseProtein || 0) * f); }, 0);
                  const mCar = (meal.items || []).reduce((sum, item) => { const q = Number(item.displayQty) || 0; let f = q / 100; if (item.unit === 'pz') f = ((item.pieceWeight || 100) * q) / 100; return sum + ((item.baseCarbs || 0) * f); }, 0);
                  const mFat = (meal.items || []).reduce((sum, item) => { const q = Number(item.displayQty) || 0; let f = q / 100; if (item.unit === 'pz') f = ((item.pieceWeight || 100) * q) / 100; return sum + ((item.baseFat || 0) * f); }, 0);

                  return (
                  <div key={meal.id} className="bg-white p-4 rounded-3xl border shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-lg text-slate-800">{meal.name}</p>
                      <div className="flex space-x-1">
                        <button onClick={() => { setEditingMealId(meal.id); setMealBuilder(meal); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-slate-400 hover:text-indigo-600 p-2 bg-slate-50 rounded-xl active:scale-95 transition-transform"><Edit2 size={18}/></button>
                        <button onClick={() => setCustomMeals(p => (p || []).filter(m => m.id !== meal.id))} className="text-rose-400 p-2 bg-rose-50 rounded-xl hover:bg-rose-100 active:scale-95 transition-transform"><Trash2 size={18}/></button>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-indigo-600 mb-3">{mCals} kcal <span className="text-xs font-medium text-slate-500">(P: {mPro.toFixed(1)} C: {mCar.toFixed(1)} G: {mFat.toFixed(1)})</span></p>

                    <div className="space-y-1 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">{(meal.items || []).map((item, idx) => <p key={idx} className="text-sm text-slate-600 font-medium">• {item.displayQty}{item.unit} {item.name}</p>)}</div>
                    <button onClick={() => addMealToDiary(meal)} className="w-full bg-white border border-indigo-200 text-indigo-700 py-3 rounded-xl font-bold shadow-sm hover:border-indigo-300 hover:bg-indigo-50 active:scale-95 transition-all">Inietta Intero Pasto nel Diario</button>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}
        
        {/* === SCHEDA RICETTE === */}
        {activeTab === 'ricette' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <h2 className="font-black text-xl mb-2 text-slate-800">{editingRecipeId ? 'Modifica Ricetta' : 'Analizzatore Ricette'}</h2>
              {!editingRecipeId && (
                <>
                  <textarea value={recipeText} onChange={(e) => setRecipeText(e.target.value)} placeholder="Incolla gli ingredienti...\nEs:\nFarina 300g\nUova 3" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 min-h-[140px] outline-none focus:border-indigo-400 font-medium shadow-sm" />
                  <button onClick={extractIngredients} disabled={!recipeText || isExtracting} className="w-full mt-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95 transition-all">{isExtracting ? '⏳ Estrazione...' : '⚡ Analizza'}</button>
                </>
              )}
            </div>

            {extractedIngs.length > 0 && (
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 space-y-4 shadow-sm">
                <input type="text" placeholder="Nome Ricetta" value={recipeName} onChange={(e) => setRecipeName(e.target.value)} className="w-full text-xl font-bold p-3 rounded-xl outline-none shadow-sm" />
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-slate-700">Resa (Pezzi):</span>
                  <input type="number" value={recipeYield !== undefined ? recipeYield : ''} onChange={e => setRecipeYield(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-20 p-2 rounded-lg text-center font-bold outline-none shadow-sm" />
                </div>
                <div className="space-y-3">
                  {(extractedIngs || []).map(ing => {
                    const wg = Number(ing.weightInGrams)||0; const bk = Number(ing.baseCalories)||0;
                    const bp = Number(ing.baseProtein)||0; const bc = Number(ing.baseCarbs)||0; const bf = Number(ing.baseFat)||0;
                    return (
                      <div key={ing.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-2">
                            <input type="number" value={ing.qty !== undefined ? ing.qty : ''} onChange={e => {
                               const rq = e.target.value; const nq = parseFloat(rq)||0;
                               setExtractedIngs(p => (p || []).map(i => i.id === ing.id ? { ...i, qty: rq, weightInGrams: i.unit === 'pz' ? nq*(i.pieceWeight||100) : nq } : i));
                            }} className="w-16 bg-slate-100 p-1.5 rounded-lg font-bold text-center outline-none" />
                            <span className="font-bold text-slate-700">{ing.unit}</span>
                            <span className="font-bold text-slate-800 ml-2">{ing.name}</span>
                          </div>
                          <button onClick={() => setExtractedIngs(p => (p || []).filter(i => i.id !== ing.id))} className="text-rose-400 bg-rose-50 p-1.5 rounded-full active:scale-95 transition-transform"><X size={16}/></button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center mt-2">
                          <div><p className="text-[10px] uppercase font-bold text-slate-400">kcal</p><input type="number" value={ing.customKcalInput !== undefined ? ing.customKcalInput : Math.round((bk*wg)/100)} onChange={e => {
                              const rk = e.target.value;
                              if (rk === '') setExtractedIngs(p => (p || []).map(i => i.id === ing.id ? { ...i, customKcalInput: '' } : i));
                              else setExtractedIngs(p => (p || []).map(i => i.id === ing.id ? { ...i, baseCalories: wg > 0 ? ((parseFloat(rk)||0)/wg)*100 : 0, customKcalInput: rk } : i));
                          }} className="w-full bg-slate-50 font-bold text-indigo-600 rounded text-center p-1 outline-none border border-slate-100" /></div>
                          <div><p className="text-[10px] uppercase font-bold text-slate-400">Pro (g)</p><p className="bg-slate-50 rounded p-1 font-medium border border-slate-100">{(bp*wg/100).toFixed(1)}</p></div>
                          <div><p className="text-[10px] uppercase font-bold text-slate-400">Car (g)</p><p className="bg-slate-50 rounded p-1 font-medium border border-slate-100">{(bc*wg/100).toFixed(1)}</p></div>
                          <div><p className="text-[10px] uppercase font-bold text-slate-400">Gra (g)</p><p className="bg-slate-50 rounded p-1 font-medium border border-slate-100">{(bf*wg/100).toFixed(1)}</p></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="bg-white p-3 rounded-xl border border-indigo-200 mt-3 space-y-2 shadow-sm relative">
                  <p className="text-xs font-bold text-slate-500 uppercase">Aggiungi altro ingrediente manualmente</p>
                  <div className="flex space-x-2 relative z-10">
                    <input type="text" placeholder="Cerca..." value={manualSearchQuery} onChange={e => handleSearch(e.target.value, 'manual')} className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded-lg text-sm outline-none focus:border-indigo-400" />
                    <input type="number" placeholder="Qtà" value={manualAddQty} onChange={e => setManualAddQty(e.target.value)} className="w-16 bg-slate-50 border border-slate-200 p-2 rounded-lg text-sm text-center outline-none" />
                    <select value={manualAddUnit} onChange={e => setManualAddUnit(e.target.value)} className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-sm outline-none"><option value="g">g</option><option value="pz">pz</option></select>
                  </div>
                  {manualSearchResults.length > 0 && (
                    <div className="bg-white shadow-xl rounded-lg p-2 border border-slate-200 space-y-1 max-h-48 overflow-y-auto overscroll-contain relative z-20">
                      {manualSearchResults.map((food, idx) => (
                        <div key={food.id || idx} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg text-sm border-b border-slate-50 last:border-0 transition-colors">
                          <span className="font-semibold text-slate-700">{food.name}</span>
                          <button onClick={() => {
                             const q = Number(manualAddQty) || 100; let w = q; if (manualAddUnit === 'pz') w = q * (food.pieceWeight || 100);
                             setExtractedIngs(p => [...(p || []), { id: generateId('ing'), name: food.name, qty: manualAddQty || 100, unit: manualAddUnit, baseCalories: food.calories || 0, baseProtein: food.protein || 0, baseCarbs: food.carbs || 0, baseFat: food.fat || 0, weightInGrams: w, pieceWeight: food.pieceWeight || 100 }]);
                             setManualSearchQuery(''); setManualSearchResults([]); setManualAddQty('');
                          }} className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:shadow-md active:scale-95 transition-all">+ Aggiungi</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-2">
                  <button onClick={() => {
                      if (!recipeName) return showToast("Inserisci nome ricetta!");
                      const totalGrams = (extractedIngs || []).reduce((sum, i) => sum + (Number(i.weightInGrams) || 0), 0);
                      if (totalGrams === 0) return;
                      const tCals = (extractedIngs || []).reduce((sum, i) => sum + ((Number(i.baseCalories) || 0) * (Number(i.weightInGrams) || 0) / 100), 0);
                      const tPro = (extractedIngs || []).reduce((sum, i) => sum + ((Number(i.baseProtein) || 0) * (Number(i.weightInGrams) || 0) / 100), 0);
                      const tCar = (extractedIngs || []).reduce((sum, i) => sum + ((Number(i.baseCarbs) || 0) * (Number(i.weightInGrams) || 0) / 100), 0);
                      const tFat = (extractedIngs || []).reduce((sum, i) => sum + ((Number(i.baseFat) || 0) * (Number(i.weightInGrams) || 0) / 100), 0);
                      const safeYield = Number(recipeYield) || 1;
                      const pieceWeight = Math.round(totalGrams / safeYield);
                      const recipeData = { id: editingRecipeId || generateId('recipe'), name: recipeName, yield: safeYield, calories: Math.round((tCals / totalGrams) * 100), protein: parseFloat(((tPro / totalGrams) * 100).toFixed(1)), carbs: parseFloat(((tCar / totalGrams) * 100).toFixed(1)), fat: parseFloat(((tFat / totalGrams) * 100).toFixed(1)), hasPieces: true, pieceWeight: pieceWeight, isRecipe: true, weightInGrams: totalGrams, ingredients: extractedIngs };
                      
                      if (editingRecipeId) { 
                          setCustomRecipes(prev => (prev || []).map(r => r.id === editingRecipeId ? recipeData : r)); 
                          setEditingRecipeId(null); 
                      } else { 
                          setCustomRecipes(prev => [...(prev || []), recipeData]); 
                      }
                      
                      // Aggiornamento a cascata sui pasti usuali
                      setCustomMeals(prev => (prev || []).map(m => {
                          let changed = false;
                          const newItems = (m.items || []).map(it => {
                              if (it.name.toLowerCase() === recipeData.name.toLowerCase()) { changed = true; return { ...it, name: recipeData.name, baseCalories: recipeData.calories, baseProtein: recipeData.protein, baseCarbs: recipeData.carbs, baseFat: recipeData.fat, hasPieces: recipeData.hasPieces, pieceWeight: recipeData.pieceWeight }; }
                              return it;
                          });
                          return changed ? { ...m, items: newItems } : m;
                      }));

                      setExtractedIngs([]); setRecipeName(''); setRecipeYield(1); showToast("Ricetta Salvata!");
                  }} className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all">{editingRecipeId ? '💾 Aggiorna' : '💾 Salva'}</button>
                  {editingRecipeId && <button onClick={() => { setEditingRecipeId(null); setRecipeName(''); setRecipeYield(1); setExtractedIngs([]); }} className="px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all">Annulla</button>}
                </div>
              </div>
            )}
            
            {customRecipes.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <h3 className="font-bold text-lg">Le Tue Ricette</h3>
                {customRecipes.map(r => {
                  const cals = r.hasPieces ? Math.round((r.calories * r.pieceWeight) / 100) : r.calories;
                  const p = r.hasPieces ? ((r.protein * r.pieceWeight) / 100).toFixed(1) : r.protein;
                  const c = r.hasPieces ? ((r.carbs * r.pieceWeight) / 100).toFixed(1) : r.carbs;
                  const f = r.hasPieces ? ((r.fat * r.pieceWeight) / 100).toFixed(1) : r.fat;

                  return (
                  <div key={r.id} className="bg-white border p-4 rounded-3xl shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800 text-lg">{r.name}</p>
                        <p className="text-sm text-slate-500">{cals} kcal {r.hasPieces ? `(P: ${p} C: ${c} G: ${f}) per pezzo da ${r.pieceWeight}g` : `(P: ${p} C: ${c} G: ${f}) su 100g`}</p>
                      </div>
                      <div className="flex space-x-1">
                        <button onClick={() => {
                           setEditingRecipeId(r.id); setRecipeName(r.name); setRecipeYield(r.yield || 1);
                           setExtractedIngs((r.ingredients || []).map(ing => ({ ...ing, qty: ing.qty !== undefined ? ing.qty : 100, unit: ing.unit || 'g', weightInGrams: ing.weightInGrams || 100 })));
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                        }} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl active:scale-95 transition-transform"><Edit2 size={18} /></button>
                        <button onClick={() => setCustomRecipes(pr => (pr || []).filter(x => x.id !== r.id))} className="p-2 text-rose-400 bg-rose-50 hover:bg-rose-100 rounded-xl active:scale-95 transition-transform"><Trash2 size={18}/></button>
                      </div>
                    </div>
                    <button onClick={() => addFoodToDiary(r, 1, 'pz')} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white py-3 rounded-xl font-bold text-sm shadow-sm hover:shadow-md active:scale-95 transition-all">➕ Aggiungi al Diario (1 pz)</button>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}

      </main>

      {/* MODALE PASTI VELOCI (INIEZIONE) */}
      {isMealModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl">
             <h3 className="font-black text-xl text-slate-800">Crea o Aggiungi Pasto</h3>
             <div className="space-y-2">
                <p className="font-bold text-sm text-indigo-600 uppercase">1. Nuovo Pasto</p>
                <div className="flex space-x-2">
                   <input type="text" placeholder="Nome..." value={mealModalName} onChange={e => setMealModalName(e.target.value)} className="flex-1 border-2 border-slate-100 p-3 rounded-xl font-medium outline-none focus:border-indigo-400 shadow-sm" />
                   <button onClick={handleCreateMealFromSelection} className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-5 rounded-xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all">Crea</button>
                </div>
             </div>
             {customMeals.length > 0 && (
                <>
                   <div className="flex items-center my-4"><div className="flex-1 border-t-2 border-slate-100"></div><span className="px-3 text-xs font-bold text-slate-400">OPPURE</span><div className="flex-1 border-t-2 border-slate-100"></div></div>
                   <div className="space-y-2">
                      <p className="font-bold text-sm text-indigo-600 uppercase">2. Pasto Esistente</p>
                      <div className="flex space-x-2">
                         <select value={mealModalSelectedExisting} onChange={e => setMealModalSelectedExisting(e.target.value)} className="flex-1 border-2 border-slate-100 p-3 rounded-xl font-medium outline-none shadow-sm">
                            <option value="">Seleziona...</option>
                            {customMeals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                         </select>
                         <button onClick={() => {
                            if (!mealModalSelectedExisting) return showToast("Seleziona pasto");
                            const items = dailyDiary.filter(d => selectedDiaryItems.includes(d.diaryId)).map(d => ({
                                id: generateId('meal_item'), name: d.name, displayQty: d.displayQty !== undefined ? d.displayQty : 100, unit: d.unit || 'g', hasPieces: d.hasPieces || d.unit === 'pz', pieceWeight: d.pieceWeight || 100, baseCalories: d.baseCalories || 0, baseProtein: d.baseProtein || 0, baseCarbs: d.baseCarbs || 0, baseFat: d.baseFat || 0
                            }));
                            setCustomMeals(p => (p || []).map(m => m.id === mealModalSelectedExisting ? { ...m, items: [...(m.items || []), ...items] } : m));
                            setSelectedDiaryItems([]); setIsMealModalOpen(false); setMealModalSelectedExisting(''); showToast("Aggiunti!");
                         }} className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-5 rounded-xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all">Aggiungi</button>
                      </div>
                   </div>
                </>
             )}
             <button onClick={() => { setIsMealModalOpen(false); setMealModalName(''); setMealModalSelectedExisting(''); }} className="w-full mt-2 bg-white border border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all">Annulla</button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl z-[200] animate-in slide-in-from-bottom-5">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
