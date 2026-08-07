import React, { createContext, useContext, useState } from 'react';
import { CountryEnum } from '../types';

interface CountryContextType {
  country: CountryEnum;
  setCountry: (country: CountryEnum) => void;
  currency: string;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export const CountryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [country, setCountry] = useState<CountryEnum>('US');
  const currency = country === 'IN' ? 'INR' : 'USD';

  return (
    <CountryContext.Provider value={{ country, setCountry, currency }}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = () => {
  const context = useContext(CountryContext);
  if (!context) throw new Error('useCountry must be used within CountryProvider');
  return context;
};
