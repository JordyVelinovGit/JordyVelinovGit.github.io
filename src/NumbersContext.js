import React, { createContext, useState } from 'react';

export const NumbersContext = createContext();

export const NumbersProvider = ({ children }) => {
  const [numbers, setNumbers] = useState([]);
  const [stats, setStats] = useState([]);
  const [listModified, setListModified] = useState(false); // New state to track list modifications

  const addNumbers = (newNumbers) => {
    const updatedNumbers = newNumbers.map((num, index) => ({
      id: `number-${numbers.length + index}`,
      primary: num.toString()
    }));

    setNumbers(prev => [...prev, ...updatedNumbers]);
    setListModified(true); // Mark list as modified when numbers are added
  };
  
  const clearNumbers = () => {
    setNumbers([]);
    setStats([]);
    setListModified(false); // Optionally reset list modification tracking when clearing numbers
  };

  const markListAsModified = () => {
    setListModified(true); // Method to explicitly mark list as modified
  };

  const resetListModified = () => {
    setListModified(false); // Method to reset list modification tracking
  };

  return (
    <NumbersContext.Provider value={{
      numbers,
      stats,
      setStats,
      setNumbers,
      addNumbers,
      clearNumbers,
      listModified, // Include new state in context value
      markListAsModified, // Include methods to update and reset list modification tracking
      resetListModified
    }}>
      {children}
    </NumbersContext.Provider>
  );
};