import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CircleCheck } from "lucide-react";

interface Question {
  id: number;
  text: string;
  options: string[];
}

interface TakeQuizFormProps {
  quiz: {
    id: number;
    title: string;
    description: string;
    expiresAt: number;
    questionCount: number;
  };
  questions: Question[];
  onSubmit: (answers: number[]) => void;
  isSubmitting: boolean;
}

export default function TakeQuizForm({ quiz, questions, onSubmit, isSubmitting }: TakeQuizFormProps) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>(new Array(questions.length).fill(-1));
  const [currentStep, setCurrentStep] = useState(0);
  
  const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[questionIndex] = optionIndex;
    setSelectedOptions(newSelectedOptions);
  };
  
  const handleSubmit = () => {
    // Check if all questions are answered
    if (selectedOptions.some(option => option === -1)) {
      alert('Please answer all questions before submitting');
      return;
    }
    
    onSubmit(selectedOptions);
  };
  
  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Time remaining calculation
  const now = Date.now();
  const timeRemaining = Math.max(0, quiz.expiresAt - now);
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  const isQuizExpired = timeRemaining <= 0;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          <CardDescription>{quiz.description}</CardDescription>
          <div className={`text-sm mt-2 ${timeRemaining < 1000 * 60 * 30 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {isQuizExpired ? (
              <span className="text-red-500 font-semibold">Quiz has expired</span>
            ) : (
              <>Time remaining: {hoursRemaining}h {minutesRemaining}m</>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Question {currentStep + 1} of {questions.length}
            </div>
            <div className="flex gap-1">
              {questions.map((_, index) => (
                <div 
                  key={index}
                  className={`h-2 w-2 rounded-full cursor-pointer ${
                    index === currentStep 
                      ? 'bg-primary' 
                      : selectedOptions[index] !== -1 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                  }`}
                  onClick={() => setCurrentStep(index)}
                />
              ))}
            </div>
          </div>
          
          {questions.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">{questions[currentStep].text}</h3>
              <RadioGroup 
                value={selectedOptions[currentStep]?.toString() || ''}
                onValueChange={(value) => handleOptionSelect(currentStep, parseInt(value))}
                className="space-y-3"
              >
                {questions[currentStep].options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-3 rounded-lg">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                    {selectedOptions[currentStep] === index && (
                      <CircleCheck className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          {currentStep < questions.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={selectedOptions[currentStep] === -1}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isQuizExpired || selectedOptions.some(option => option === -1)}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 