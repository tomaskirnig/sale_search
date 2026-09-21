import { useState, useEffect } from 'preact/hooks';
import type { SaleItem } from '../types/sales';
import { MOCK_SALES } from '../data/mockSales';

interface SalesDataPayload {
  updatedAt?: string;
  count?: number;
  items: SaleItem[];
}

export function useSalesData() {
  const [items, setItems] = useState<SaleItem[]>(MOCK_SALES);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        // Attempt to fetch latest generated sales dataset
        const res = await fetch('/data/sales.latest.json', {
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data: SalesDataPayload = await res.json();
        if (isMounted && data && Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items);
          if (data.updatedAt) {
            setLastUpdated(data.updatedAt);
          }
        }
      } catch (err) {
        console.warn('Could not fetch live sales.latest.json, falling back to bundled dataset:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { items, lastUpdated, isLoading };
}
