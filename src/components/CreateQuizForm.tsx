import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2 } from "lucide-react";

interface CreateQuizFormProps {
  onSubmit: (formData: {
    title: string;
    description: string;
    expiresAt: number;
    lectureId: number;
    questions: Array<{
      text: string;
      options: string[];
      correctOptionIndex: number;
    }>;
  }) => void;
  lectures: Array<{
    id: number;
    topic: string;
  }>;
  isCreatingQuiz: boolean;
}

export default function CreateQuizForm({ onSubmit, lectures, isCreatingQuiz }: CreateQuizFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedLectureId, setSelectedLectureId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Array<{
    text: string;
    options: string[];
    correctOptionIndex: number;
  }>>([
    { text: '', options: ['', ''], correctOptionIndex: 0 }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !expiryDate || !selectedLectureId) {
      alert('Please fill all the required fields');
      return;
    }
    
    if (questions.some(q => !q.text || q.options.some(o => !o))) {
      alert('Please fill all question texts and options');
      return;
    }
    
    const formData = {
      title,
      description,
      expiresAt: new Date(expiryDate).getTime(), // Convert to timestamp
      lectureId: selectedLectureId,
      questions
    };
    
    onSubmit(formData);
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', ''], correctOptionIndex: 0 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push('');
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    if (questions[questionIndex].options.length <= 2) return;
    
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    
    // If the correct option is deleted, reset to the first one
    if (optionIndex === updatedQuestions[questionIndex].correctOptionIndex) {
      updatedQuestions[questionIndex].correctOptionIndex = 0;
    } else if (optionIndex < updatedQuestions[questionIndex].correctOptionIndex) {
      // If an option before the correct one is deleted, adjust the index
      updatedQuestions[questionIndex].correctOptionIndex--;
    }
    
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const setCorrectOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].correctOptionIndex = optionIndex;
    setQuestions(updatedQuestions);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Quiz Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter quiz title"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter quiz description"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="expiryDate">Expiry Date</Label>
        <Input
          id="expiryDate"
          type="datetime-local"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="lectureId">Associated Lecture</Label>
        <Select
          onValueChange={(value) => setSelectedLectureId(Number(value))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select lecture" />
          </SelectTrigger>
          <SelectContent>
            {lectures.map((lecture) => (
              <SelectItem key={lecture.id} value={lecture.id.toString()}>
                {lecture.topic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Questions</h3>
          <Button
            type="button"
            onClick={addQuestion}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" /> Add Question
          </Button>
        </div>
        
        {questions.map((question, qIndex) => (
          <div key={qIndex} className="p-4 border rounded-md space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`question-${qIndex}`}>Question {qIndex + 1}</Label>
                <Textarea
                  id={`question-${qIndex}`}
                  value={question.text}
                  onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                  placeholder="Enter question text"
                  required
                />
              </div>
              {questions.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  variant="destructive"
                  size="icon"
                  className="mt-7"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Options</Label>
                {question.options.length < 5 && (
                  <Button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <PlusCircle className="h-3 w-3" /> Option
                  </Button>
                )}
              </div>
              
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      required
                    />
                    <Button
                      type="button"
                      onClick={() => setCorrectOption(qIndex, oIndex)}
                      variant={question.correctOptionIndex === oIndex ? "default" : "outline"}
                      size="sm"
                    >
                      Correct
                    </Button>
                  </div>
                  
                  {question.options.length > 2 && (
                    <Button
                      type="button"
                      onClick={() => removeOption(qIndex, oIndex)}
                      variant="destructive"
                      size="icon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <Button type="submit" disabled={isCreatingQuiz}>
        {isCreatingQuiz ? 'Creating Quiz...' : 'Create Quiz'}
      </Button>
    </form>
  );
} 