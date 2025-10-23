import { MenuItem, MENU_ITEMS } from '@/lib/menuItems';

interface PriceHistory {
  itemId: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  changedAt: string;
}

class MenuService {
  private storageKey = 'menu_items';
  private historyKey = 'menu_price_history';

  getMenuItems(): MenuItem[] {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with default items
    localStorage.setItem(this.storageKey, JSON.stringify(MENU_ITEMS));
    return MENU_ITEMS;
  }

  updatePrice(itemId: string, newPrice: number, changedBy: string): boolean {
    const items = this.getMenuItems();
    const itemIndex = items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return false;
    }

    const oldPrice = items[itemIndex].price;
    items[itemIndex].price = newPrice;
    
    // Save updated items
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    
    // Add to history
    this.addToHistory({
      itemId,
      oldPrice,
      newPrice,
      changedBy,
      changedAt: new Date().toISOString(),
    });
    
    return true;
  }

  private addToHistory(entry: PriceHistory): void {
    const history = this.getPriceHistory();
    history.push(entry);
    localStorage.setItem(this.historyKey, JSON.stringify(history));
  }

  getPriceHistory(): PriceHistory[] {
    const stored = localStorage.getItem(this.historyKey);
    return stored ? JSON.parse(stored) : [];
  }

  getItemByName(name: string): MenuItem | undefined {
    const items = this.getMenuItems();
    return items.find(item => 
      item.name.toLowerCase().includes(name.toLowerCase())
    );
  }
}

export const menuService = new MenuService();
export type { PriceHistory };