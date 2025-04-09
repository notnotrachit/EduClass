import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

interface CreateClassFormProps {
  onSubmit: (formData: { name: string; symbol: string }) => Promise<void>;
  isCreating: boolean;
}

const CreateClassForm: React.FC<CreateClassFormProps> = ({ onSubmit, isCreating }) => {
  const [formData, setFormData] = useState({
    name: '',
    symbol: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isLoading = isCreating || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Class Name:
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter class name"
          required
          disabled={isLoading}
          className="mt-1 block w-full border p-2 rounded-md disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Class Symbol:
        </label>
        <input
          type="text"
          name="symbol"
          value={formData.symbol}
          onChange={handleInputChange}
          placeholder="Enter class symbol"
          required
          disabled={isLoading}
          className="mt-1 block w-full border p-2 rounded-md disabled:bg-gray-100"
        />
      </div>
      <Button
        type="submit"
        disabled={isLoading || !formData.name || !formData.symbol}
        className={`w-full transition-colors duration-200 flex items-center justify-center space-x-2 ${
          isLoading || !formData.name || !formData.symbol
            ? 'bg-gray-400'
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Creating Class...</span>
          </>
        ) : (
          'Create Class'
        )}
      </Button>
    </form>
  );
};

export default CreateClassForm; 