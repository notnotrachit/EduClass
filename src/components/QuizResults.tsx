import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CircleCheck, CircleX } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface QuizResultsProps {
  quizTitle: string;
  score: number;
  totalQuestions: number;
  attemptedAt: Date;
}

export default function QuizResults({ quizTitle, score, totalQuestions, attemptedAt }: QuizResultsProps) {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz Results: {quizTitle}</CardTitle>
        <CardDescription>
          Attempted on {formatDate(attemptedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Your Score</span>
            <span className="text-lg font-bold">{score} / {totalQuestions}</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="text-right text-sm text-muted-foreground">{percentage}%</div>
        </div>
        
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2">
            {percentage >= 70 ? (
              <>
                <CircleCheck className="h-6 w-6 text-green-500" />
                <span className="font-medium">
                  {percentage >= 90 ? 'Excellent work!' : 'Good job!'}
                </span>
              </>
            ) : (
              <>
                <CircleX className="h-6 w-6 text-red-500" />
                <span className="font-medium">
                  {percentage >= 50 ? 'You passed, but there\'s room for improvement.' : 'You might need more practice.'}
                </span>
              </>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {percentage >= 90 ? (
              'You\'ve mastered this material!'
            ) : percentage >= 70 ? (
              'You have a good understanding of the material.'
            ) : percentage >= 50 ? (
              'Keep studying to improve your knowledge.'
            ) : (
              'Consider reviewing the material and retaking the quiz.'
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 