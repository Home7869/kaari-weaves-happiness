import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  product_id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  size?: string;
  color?: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export const cartKey = (i: { product_id: string; size?: string; color?: string }) =>
  `${i.product_id}__${i.size ?? ""}__${i.color ?? ""}`;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      setOpen: (v) => set({ isOpen: v }),
      add: (item, qty = 1) => {
        const k = cartKey(item);
        const existing = get().items.find((i) => cartKey(i) === k);
        if (existing) {
          set({
            items: get().items.map((i) =>
              cartKey(i) === k ? { ...i, qty: Math.min(i.qty + qty, 10) } : i,
            ),
            isOpen: true,
          });
        } else {
          set({ items: [...get().items, { ...item, qty }], isOpen: true });
        }
      },
      remove: (key) => set({ items: get().items.filter((i) => cartKey(i) !== key) }),
      setQty: (key, qty) =>
        set({
          items: get().items.map((i) =>
            cartKey(i) === key ? { ...i, qty: Math.max(1, Math.min(10, qty)) } : i,
          ),
        }),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
      subtotal: () => get().items.reduce((s, i) => s + i.qty * i.price, 0),
    }),
    { name: "kaari-cart" },
  ),
);
