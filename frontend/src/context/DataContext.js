import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCrops } from '../api/crops';
import { getContacts } from '../api/contacts';

// 1. Create the context
const DataContext = createContext();

// 2. Create a custom hook for easy consumption of the context
export const useData = () => useContext(DataContext);

// 3. Create the provider component
export const DataProvider = ({ children }) => {
    const [crops, setCrops] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Function to fetch all initial data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [cropsData, contactsData] = await Promise.all([
                getCrops(),
                getContacts(),
            ]);
            
            setCrops(cropsData);
            setContacts(contactsData);
            setSuppliers(contactsData.filter(c => c.is_supplier));
            setCustomers(contactsData.filter(c => c.is_customer));

        } catch (error) {
            console.error("Failed to fetch shared data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data on initial mount
    useEffect(() => {
        fetchData();
    }, []);

    // The value provided to consuming components
    const value = {
        crops,
        contacts,
        suppliers,
        customers,
        loading,
        refreshData: fetchData // Expose a function to allow components to trigger a refresh
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
