/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getEligibleClasses, getLectures, getOwnAttendance, markAttendance, getQuizzes, getQuizzesByLecture, getQuizQuestions, submitQuizAnswers, getQuizResults, getClassQuizzes } from "@/lib/contractService";
import { useWalletContext } from "@/context/WalletContext";
import Popup from "../components/Popup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FilePieChart } from "lucide-react";
import TakeQuizForm from "../components/TakeQuizForm";
import QuizResults from "../components/QuizResults";

interface Class {
  classAddress: string;
  name: string;
  symbol: string;
}

interface Lecture {
  id: number;
  topic: string;
}

interface LecturesByClass {
  [classAddress: string]: Lecture[];
}

interface AttendanceByClass {
  [classAddress: string]: boolean[];
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  createdAt: number;
  expiresAt: number;
  lectureId: number;
  isActive: boolean;
  questionCount: number;
}

interface QuizContractsByClass {
  [classAddress: string]: string[];
}

interface QuizzesByContract {
  [quizContractAddress: string]: Quiz[];
}

interface Question {
  id: number;
  text: string;
  options: string[];
}

interface QuizResult {
  hasAttempted: boolean;
  score: number;
  attemptedAt: number;
  totalQuestions: number;
}

interface QuizResultsByContract {
  [key: string]: QuizResult; // key will be `${quizContractAddress}-${quizId}`
}

interface PopupContentType {
  title: string;
  content: React.ReactNode;
}

export function StudentDashboard() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [lecturesByClass, setLecturesByClass] = useState<LecturesByClass>({});
  const [attendanceByClass, setAttendanceByClass] =
    useState<AttendanceByClass>({});
  const [isFetchingLectures, setIsFetchingLectures] = useState<{
    [key: string]: boolean;
  }>({});
  const [isMarkingAttendance, setIsMarkingAttendance] = useState<{
    [key: string]: boolean;
  }>({});
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupContent, setPopupContent] = useState<PopupContentType | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState("");

  // Quiz related state
  const [quizContractsByClass, setQuizContractsByClass] = useState<QuizContractsByClass>({});
  const [quizzesByContract, setQuizzesByContract] = useState<QuizzesByContract>({});
  const [isFetchingQuizzes, setIsFetchingQuizzes] = useState<{
    [key: string]: boolean;
  }>({});
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState<Question[]>([]);
  const [isFetchingQuizQuestions, setIsFetchingQuizQuestions] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizResultsByContract, setQuizResultsByContract] = useState<QuizResultsByContract>({});

  const { provider, address } = useWalletContext();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoadingInitialData(true);
        const eligibleClasses = await getEligibleClasses(address, provider);
        const formattedClasses = eligibleClasses.map((classData) => ({
          classAddress: classData[0],
          name: classData[1],
          symbol: classData[2]
        }));
        
        setClasses(formattedClasses);
        
        if (formattedClasses.length > 0) {
          // Set the first class as selected by default
          setSelectedClass(formattedClasses[0]);
          
          // Load data for each class
          for (const classItem of formattedClasses) {
            await fetchLectures(classItem.classAddress);
            await fetchAttendance(classItem.classAddress);
            
            // Get quiz contracts for this class
            try {
              const quizContracts = await getClassQuizzes(classItem.classAddress, provider);
              setQuizContractsByClass((prev) => ({
                ...prev,
                [classItem.classAddress]: quizContracts
              }));
              
              // Fetch quizzes for each contract
              for (const quizContractAddress of quizContracts) {
                await fetchQuizzes(quizContractAddress);
              }
            } catch (error) {
              console.error(`Error fetching quiz contracts for class ${classItem.classAddress}:`, error);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setConfirmationMessage("Failed to load classes. Please refresh the page.");
      } finally {
        setIsLoadingInitialData(false);
      }
    };
    
    if (address && provider) {
      fetchInitialData();
    }
  }, [address, provider]);

  const fetchLectures = async (classAddress: string) => {
    try {
      setIsFetchingLectures((prev) => ({ ...prev, [classAddress]: true }));
      const lecturesList = await getLectures(classAddress, provider);
      setLecturesByClass((prev) => ({
        ...prev,
        [classAddress]: lecturesList,
      }));
    } catch (error) {
      console.error("Error fetching lectures:", error);
      setConfirmationMessage("Failed to fetch lectures. Please try again.");
    } finally {
      setIsFetchingLectures((prev) => ({ ...prev, [classAddress]: false }));
    }
  };

  const fetchAttendance = async (classAddress: string) => {
    try {
      const attendanceList = await getOwnAttendance(classAddress, provider);
      setAttendanceByClass((prev) => ({
        ...prev,
        [classAddress]: attendanceList,
      }));
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setConfirmationMessage("Failed to fetch attendance. Please try again.");
    }
  };

  const handleMarkAttendance = async (lectureId: number, classAddress: string) => {
    try {
      setIsMarkingAttendance((prev) => ({ ...prev, [`${classAddress}-${lectureId}`]: true }));
      await markAttendance(classAddress, lectureId, provider);
      setConfirmationMessage("Attendance marked successfully!");
      
      // Update the attendance data
      await fetchAttendance(classAddress);
    } catch (error) {
      console.error("Error marking attendance:", error);
      setConfirmationMessage("Failed to mark attendance. Please try again.");
    } finally {
      setIsMarkingAttendance((prev) => ({ ...prev, [`${classAddress}-${lectureId}`]: false }));
    }
  };

  // Quiz functionality
  const fetchQuizzes = async (quizContractAddress: string) => {
    try {
      setIsFetchingQuizzes((prev) => ({ ...prev, [quizContractAddress]: true }));
      const quizzesList = await getQuizzes(quizContractAddress, provider);
      setQuizzesByContract((prev) => ({
        ...prev,
        [quizContractAddress]: quizzesList,
      }));
    } catch (error) {
      console.error(`Error fetching quizzes for contract ${quizContractAddress}:`, error);
      setConfirmationMessage("Failed to fetch quizzes. Please try again.");
    } finally {
      setIsFetchingQuizzes((prev) => ({ ...prev, [quizContractAddress]: false }));
    }
  };

  const handleTakeQuiz = async (quiz: Quiz, quizContractAddress: string) => {
    try {
      setIsFetchingQuizQuestions(true);
      
      // First, check if the student has already taken this quiz
      const result = await getQuizResults(
        quizContractAddress,
        quiz.id,
        address,
        provider
      );
      
      if (result.hasAttempted) {
        // Show results instead of taking the quiz again
        showQuizResults(quiz, result);
        return;
      }
      
      // Fetch questions for the quiz
      const questions = await getQuizQuestions(
        quizContractAddress,
        quiz.id,
        provider
      );
      
      setCurrentQuizQuestions(questions);
      
      // Open the quiz taking popup
      setPopupContent({
        title: `Quiz: ${quiz.title}`,
        content: (
          <TakeQuizForm
            quiz={quiz}
            questions={questions}
            onSubmit={(answers) => handleSubmitQuiz(quiz.id, answers, quizContractAddress)}
            isSubmitting={isSubmittingQuiz}
          />
        ),
      });
      setIsPopupOpen(true);
    } catch (error) {
      console.error("Error preparing quiz:", error);
      setConfirmationMessage("Failed to load quiz questions. Please try again.");
    } finally {
      setIsFetchingQuizQuestions(false);
    }
  };

  const handleSubmitQuiz = async (quizId: number, answers: number[], quizContractAddress: string) => {
    try {
      setIsSubmittingQuiz(true);
      
      // Submit the quiz answers
      await submitQuizAnswers(
        quizContractAddress,
        quizId,
        answers,
        provider
      );
      
      // Get the results
      const result = await getQuizResults(
        quizContractAddress,
        quizId,
        address,
        provider
      );
      
      // Store the result
      setQuizResultsByContract((prev) => ({
        ...prev,
        [`${quizContractAddress}-${quizId}`]: result
      }));
      
      // Find the quiz details
      const quiz = Object.values(quizzesByContract)
        .flatMap(quizzes => quizzes)
        .find(q => q.id === quizId);
      
      if (quiz) {
        // Show the results
        showQuizResults(quiz, result);
      } else {
        setIsPopupOpen(false);
        setConfirmationMessage("Quiz submitted successfully!");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setConfirmationMessage("Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const showQuizResults = (quiz: Quiz, result: QuizResult) => {
    setPopupContent({
      title: `Quiz Results: ${quiz.title}`,
      content: (
        <QuizResults
          quizTitle={quiz.title}
          score={result.score}
          totalQuestions={result.totalQuestions}
          attemptedAt={new Date(result.attemptedAt)}
        />
      ),
    });
    setIsPopupOpen(true);
  };

  const fetchQuizResult = async (quizId: number, quizContractAddress: string) => {
    try {
      const result = await getQuizResults(
        quizContractAddress,
        quizId,
        address,
        provider
      );
      
      setQuizResultsByContract((prev) => ({
        ...prev,
        [`${quizContractAddress}-${quizId}`]: result
      }));
      
      return result;
    } catch (error) {
      console.error("Error fetching quiz result:", error);
      return null;
    }
  };

  const handleViewQuizResult = async (quiz: Quiz, quizContractAddress: string) => {
    try {
      // Check if we already have the result
      let result = quizResultsByContract[`${quizContractAddress}-${quiz.id}`];
      
      // If not, fetch it
      if (!result) {
        result = await fetchQuizResult(quiz.id, quizContractAddress);
      }
      
      if (result && result.hasAttempted) {
        showQuizResults(quiz, result);
      } else {
        setConfirmationMessage("You haven't attempted this quiz yet.");
      }
    } catch (error) {
      console.error("Error viewing quiz result:", error);
      setConfirmationMessage("Failed to load quiz results. Please try again.");
    }
  };

  const refreshQuizzes = async (classAddress: string) => {
    try {
      // Get quiz contracts for this class
      const quizContracts = await getClassQuizzes(classAddress, provider);
      setQuizContractsByClass((prev) => ({
        ...prev,
        [classAddress]: quizContracts
      }));
      
      // Fetch quizzes for each contract
      for (const quizContractAddress of quizContracts) {
        await fetchQuizzes(quizContractAddress);
      }
      
      setConfirmationMessage("Quizzes refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing quizzes:", error);
      setConfirmationMessage("Failed to refresh quizzes. Please try again.");
    }
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setPopupContent(null);
  };

  // Render all quizzes from all contracts
  const renderQuizzes = (classAddress: string) => {
    // Get all quiz contracts for this class
    const quizContracts = quizContractsByClass[classAddress] || [];
    
    // If no quiz contracts, show a message
    if (quizContracts.length === 0) {
      return (
        <div className="text-center p-4 text-gray-500">
          No quizzes available for this class.
        </div>
      );
    }
    
    // Count total quizzes across all contracts
    const totalQuizzes = quizContracts.reduce((count, contractAddress) => {
      const quizzes = quizzesByContract[contractAddress] || [];
      return count + quizzes.filter(quiz => quiz.isActive).length;
    }, 0);
    
    if (totalQuizzes === 0) {
      return (
        <div className="text-center p-4 text-gray-500">
          No active quizzes available for this class.
        </div>
      );
    }
    
    // Render all quizzes from all contracts
    return (
      <div className="space-y-3">
        {quizContracts.map(contractAddress => {
          const quizzes = quizzesByContract[contractAddress] || [];
          const activeQuizzes = quizzes.filter(quiz => quiz.isActive);
          
          if (activeQuizzes.length === 0) return null;
          
          return activeQuizzes.map(quiz => {
            const isExpired = Date.now() > quiz.expiresAt;
            const result = quizResultsByContract[`${contractAddress}-${quiz.id}`];
            const hasAttempted = result?.hasAttempted;
            
            const lectureInfo = lecturesByClass[classAddress]?.find(
              (l) => l.id === quiz.lectureId
            );
            
            return (
              <div
                key={`${contractAddress}-${quiz.id}`}
                className={`p-3 border rounded ${isExpired && !hasAttempted ? 'opacity-70' : ''}`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{quiz.title}</h3>
                    {hasAttempted ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        Completed
                      </span>
                    ) : isExpired ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                        Expired
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        Available
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm">{quiz.description}</p>
                  
                  <div className="text-xs text-gray-500">
                    <div>Questions: {quiz.questionCount}</div>
                    <div>Lecture: {lectureInfo?.topic || quiz.lectureId}</div>
                    <div>Expires: {new Date(quiz.expiresAt).toLocaleString()}</div>
                    {hasAttempted && (
                      <div className="text-green-600 font-medium">
                        Score: {result.score}/{result.totalQuestions} ({Math.round((result.score / result.totalQuestions) * 100)}%)
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    {hasAttempted ? (
                      <Button
                        onClick={() => handleViewQuizResult(quiz, contractAddress)}
                        variant="outline"
                        size="sm"
                      >
                        View Results
                      </Button>
                    ) : !isExpired ? (
                      <Button
                        onClick={() => handleTakeQuiz(quiz, contractAddress)}
                        disabled={isFetchingQuizQuestions}
                        size="sm"
                      >
                        {isFetchingQuizQuestions ? "Loading Quiz..." : "Take Quiz"}
                      </Button>
                    ) : (
                      <span className="text-red-600 text-sm">
                        This quiz has expired and can no longer be taken
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          });
        })}
      </div>
    );
  };

  // Render
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Student Dashboard</h1>
        {classes.length > 1 && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Select Class:</span>
            <select
              value={selectedClass?.classAddress || ""}
              onChange={(e) => {
                const selected = classes.find(
                  (c) => c.classAddress === e.target.value
                );
                if (selected) {
                  setSelectedClass(selected);
                }
              }}
              className="border rounded p-2"
            >
              {classes.map((classItem) => (
                <option key={classItem.classAddress} value={classItem.classAddress}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {confirmationMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          {confirmationMessage}
        </div>
      )}

      {isLoadingInitialData ? (
        <div className="text-center p-10">Loading your classes...</div>
      ) : classes.length === 0 ? (
        <div className="text-center p-10">
          <p>You are not enrolled in any classes.</p>
        </div>
      ) : (
        <div>
          {selectedClass && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{selectedClass.name}</CardTitle>
                <CardDescription>
                  You are enrolled in this class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="lectures">
                  <TabsList className="w-full">
                    <TabsTrigger value="lectures" className="flex-1">
                      <BookOpen className="h-4 w-4 mr-2" /> Lectures & Attendance
                    </TabsTrigger>
                    <TabsTrigger value="quizzes" className="flex-1">
                      <FilePieChart className="h-4 w-4 mr-2" /> Quizzes
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="lectures" className="pt-4">
                    <Button
                      onClick={() => fetchLectures(selectedClass.classAddress)}
                      disabled={isFetchingLectures[selectedClass.classAddress]}
                      variant="outline"
                      className="w-full mb-4"
                    >
                      {isFetchingLectures[selectedClass.classAddress]
                        ? "Loading lectures..."
                        : "Refresh Lectures"}
                    </Button>
                    
                    {lecturesByClass[selectedClass.classAddress]?.length > 0 ? (
                      <div className="space-y-3">
                        {lecturesByClass[selectedClass.classAddress].map((lecture, index) => {
                          const hasAttendance = attendanceByClass[selectedClass.classAddress]?.[index];
                          
                          return (
                            <div key={lecture.id} className="p-3 border rounded">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="font-medium">{lecture.topic}</h3>
                                  <p className="text-sm text-gray-500">ID: {lecture.id}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  {hasAttendance ? (
                                    <span className="text-green-600 font-medium">
                                      Attendance Marked ✓
                                    </span>
                                  ) : (
                                    <Button
                                      onClick={() => handleMarkAttendance(lecture.id, selectedClass.classAddress)}
                                      disabled={isMarkingAttendance[`${selectedClass.classAddress}-${lecture.id}`]}
                                      size="sm"
                                    >
                                      {isMarkingAttendance[`${selectedClass.classAddress}-${lecture.id}`]
                                        ? "Marking..."
                                        : "Mark Attendance"}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center p-4 text-gray-500">
                        No lectures available for this class.
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="quizzes" className="pt-4">
                    <Button
                      onClick={() => refreshQuizzes(selectedClass.classAddress)}
                      variant="outline"
                      className="w-full mb-4"
                    >
                      Refresh Quizzes
                    </Button>
                    
                    {renderQuizzes(selectedClass.classAddress)}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {isPopupOpen && popupContent && (
        <Popup
          title={popupContent.title}
          content={popupContent.content}
          onClose={closePopup}
        />
      )}
    </div>
  );
}

export default StudentDashboard;
