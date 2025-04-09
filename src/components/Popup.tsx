import React from 'react';

interface PopupProps {
    title: string;
    onClose: () => void;
    content: React.ReactNode;
}

const Popup: React.FC<PopupProps> = ({ title, onClose, content }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full m-4 max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>
                <div className="mb-4">{content}</div>
            </div>
        </div>
    );
};

export default Popup;