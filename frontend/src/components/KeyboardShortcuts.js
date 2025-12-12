import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const KeyboardShortcuts = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if typing in an input or textarea
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                return;
            }

            if (e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case 'n': // Shift+N -> New Sale
                        navigate('/sales');
                        // In a real app we might pass state to open the modal immediately
                        break;
                    case 'p': // Shift+P -> New Purchase
                        navigate('/purchases');
                        break;
                    case 'h': // Shift+H -> Dashboard (Home)
                        navigate('/dashboard');
                        break;
                    case 'i': // Shift+I -> Inventory
                        navigate('/inventory');
                        break;
                    default:
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    return null; // Headless component
};

export default KeyboardShortcuts;
