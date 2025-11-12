import { PetSpeciesData } from "../types";
import { PET_SPECIES_DATABASE } from "./petSpeciesDatabase";

const fallbackSpecies: PetSpeciesData = {
    emoji: "❓",
    speciesName: "สปีชีส์ปริศนา",
    description: "สิ่งมีชีวิตลึกลับที่ยังไม่มีใครรู้จัก",
    baseStats: { hp: 10, sp: 10, atk: 10, def: 10, agi: 10, dex: 10, luk: 10 },
    growthRates: { hp: 2, sp: 2, atk: 2, def: 2, agi: 2, dex: 2, luk: 2 },
};

/**
 * Retrieves species data for a given emoji from the static database.
 * @param emoji The emoji to get species data for.
 * @returns The PetSpeciesData object.
 */
export const getPetSpecies = (emoji: string): PetSpeciesData => {
    const species = PET_SPECIES_DATABASE.find(s => s.emoji === emoji);
    
    if (species) {
        return species;
    }

    console.warn(`Species for emoji '${emoji}' not found in database. Returning fallback.`);
    return { ...fallbackSpecies, emoji };
};
