import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

interface StudentFormProps {
  onSubmit: (formData: { address: string; name: string; details: string }) => Promise<void>;
  isAddingStudent: boolean;
}

const StudentForm: React.FC<StudentFormProps> = ({ onSubmit, isAddingStudent }) => {
  const [formData, setFormData] = useState({
    address: '',
    name: '',
    details: ''
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

  const isLoading = isAddingStudent || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Student Wallet Address:
        </label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          placeholder="Enter student's wallet address"
          required
          disabled={isLoading}
          className="mt-1 block w-full border p-2 rounded-md disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Student Name:
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter student's name"
          required
          disabled={isLoading}
          className="mt-1 block w-full border p-2 rounded-md disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Additional Details:
        </label>
        <input
          type="text"
          name="details"
          value={formData.details}
          onChange={handleInputChange}
          placeholder="Optional additional information"
          disabled={isLoading}
          className="mt-1 block w-full border p-2 rounded-md disabled:bg-gray-100"
        />
      </div>
      <Button
        type="submit"
        disabled={isLoading || !formData.address || !formData.name}
        className={`w-full transition-colors duration-200 flex items-center justify-center space-x-2 ${
          isLoading || !formData.address || !formData.name
            ? 'bg-gray-400'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Adding Student...</span>
          </>
        ) : (
          'Add Student'
        )}
      </Button>
    </form>
  );
};

export default StudentForm; 