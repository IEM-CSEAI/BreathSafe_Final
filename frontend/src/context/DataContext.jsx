import { createContext, useContext } from "react";
import { useLiveData } from "../hooks/useLiveData";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const value = useLiveData();
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);