import { useState, useEffect } from "react";

export function useSessionStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            if (typeof window === "undefined") {
                return initialValue;
            }

            const item = window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading sessionStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            if (typeof window !== "undefined") {
                window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(`Error setting sessionStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue];
}
