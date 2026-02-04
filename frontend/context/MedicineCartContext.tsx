import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { Medicine } from "@/services/medicine.service";
import { useAuthContext } from "@/state/AuthContext";

export type CartItem = Medicine & {
    quantity: number;
};

type MedicineCartContextType = {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    addMedicine: (medicine: Medicine) => void;
    updateQuantity: (id: string, quantity: number) => void;
    removeMedicine: (id: string) => void;
    clearCart: () => void;
};

const MedicineCartContext = createContext<MedicineCartContextType | null>(null);

export const MedicineCartProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const { user } = useAuthContext();

    const isAgent = useMemo(() =>
        user?.roles?.some((r) => r.toLowerCase().includes("agent") || r.toLowerCase().includes("admin")) ?? false,
        [user]);

    /* ================= ADD ================= */
    const addMedicine = (medicine: Medicine) => {
        setItems((prev) => {
            const existing = prev.find((i) => i._id === medicine._id);
            if (existing) {
                return prev.map((i) =>
                    i._id === medicine._id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [...prev, { ...medicine, quantity: 1 }];
        });
    };

    /* ================= UPDATE ================= */
    const updateQuantity = (id: string, quantity: number) => {
        if (quantity <= 0) {
            removeMedicine(id);
            return;
        }
        setItems((prev) =>
            prev.map((i) => (i._id === id ? { ...i, quantity } : i))
        );
    };

    /* ================= REMOVE ================= */
    const removeMedicine = (id: string) => {
        setItems((prev) => prev.filter((i) => i._id !== id));
    };

    /* ================= CLEAR ================= */
    const clearCart = () => setItems([]);

    /* ================= DERIVED ================= */
    const totalItems = useMemo(
        () => items.reduce((sum, i) => sum + i.quantity, 0),
        [items]
    );

    const totalPrice = useMemo(() => {
        return items.reduce((sum, i) => {
            const price = i.pricing?.price || 0;
            const specialPrice = i.pricing?.specialPrice || 0;
            const sellingPrice = (isAgent && specialPrice > 0) ? specialPrice : price;
            return sum + (i.quantity * sellingPrice);
        }, 0);
    }, [items, isAgent]);

    return (
        <MedicineCartContext.Provider
            value={{
                items,
                totalItems,
                totalPrice,
                addMedicine,
                updateQuantity,
                removeMedicine,
                clearCart,
            }}
        >
            {children}
        </MedicineCartContext.Provider>
    );
};

export const useMedicineCart = () => {
    const ctx = useContext(MedicineCartContext);
    if (!ctx) {
        throw new Error("useMedicineCart must be used inside MedicineCartProvider");
    }
    return ctx;
};
