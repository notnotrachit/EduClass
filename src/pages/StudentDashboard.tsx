/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getEligibleClasses, getLectures, getOwnAttendance, markAttendance, getQuizzes, getQuizzesByLecture, getQuizQuestions, submitQuizAnswers, getQuizResults, getClassQuizzes, getNotesContractForClass } from "@/lib/contractService";
import { useWalletContext } from "@/context/WalletContext";
import Popup from "../components/Popup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FilePieChart, FileText, QrCode, CheckCircle } from "lucide-react";
import TakeQuizForm from "../components/TakeQuizForm";
import QuizResults from "../components/QuizResults";
import UploadNotesForm from "../components/UploadNotesForm";
import NotesMarketplace from "../components/NotesMarketplace";
import MyNotes from "../components/MyNotes";
import QRScanner from "../components/QRScanner";
import { LoaderCircle } from "lucide-react";

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

interface NotesContractsByClass {
  [classAddress: string]: string;
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
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

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

  // Notes related state
  const [notesContractsByClass, setNotesContractsByClass] = useState<NotesContractsByClass>({});
  const [activeTab, setActiveTab] = useState("attendance");

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
            
            // Get notes contract for this class
            try {
              const notesContract = await getNotesContractForClass(classItem.classAddress, provider);
              if (notesContract && notesContract !== '0x0000000000000000000000000000000000000000') {
                setNotesContractsByClass((prev) => ({
                  ...prev,
                  [classItem.classAddress]: notesContract
                }));
              }
            } catch (error) {
              console.error(`Error fetching notes contract for class ${classItem.classAddress}:`, error);
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
    const key = `${classAddress}-${lectureId}`;
    try {
      // Set the marking status
      setIsMarkingAttendance((prev) => ({ ...prev, [key]: true }));
      
      // Mark attendance on the blockchain
      await markAttendance(classAddress, lectureId, provider);
      
      // Set success message
      setConfirmationMessage("Attendance marked successfully!");
      
      // Then fetch updated attendance data
      try {
        const attendanceList = await getOwnAttendance(classAddress, provider);
        setAttendanceByClass((prev) => ({
          ...prev,
          [classAddress]: attendanceList,
        }));
      } catch (fetchError) {
        // Log fetch error but don't show it to the user since attendance was marked successfully
        console.error("Error refreshing attendance data:", fetchError);
      }
    } catch (error) {
      // Handle error in the attendance marking process
      console.error("Error marking attendance:", error);
      
      // Extract specific error message if available
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes('Failed to mark attendance:')) {
          // Extract the specific error from the contract service
          const specificError = message.split('Failed to mark attendance:')[1].trim();
          setConfirmationMessage(`Error: ${specificError}`);
        } else {
          setConfirmationMessage(`Error: ${message}`);
        }
      } else {
        setConfirmationMessage("Failed to mark attendance. Please try again.");
      }
    } finally {
      // Reset marking status
      setIsMarkingAttendance((prev) => ({ ...prev, [key]: false }));
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

  const handleUploadNotes = () => {
    if (!selectedClass || !notesContractsByClass[selectedClass.classAddress]) {
      setConfirmationMessage("Notes feature is not available for this class.");
      return;
    }
    
    const lectures = lecturesByClass[selectedClass.classAddress] || [];
    
    setPopupContent({
      title: "Upload Notes",
      content: (
        <UploadNotesForm 
          lectures={lectures}
          notesContractAddress={notesContractsByClass[selectedClass.classAddress]}
          onSuccess={() => {
            setIsPopupOpen(false);
            setConfirmationMessage("Notes uploaded successfully! They will be reviewed by the instructor.");
          }}
        />
      )
    });
    
    setIsPopupOpen(true);
  };

  const renderNotesTabs = () => {
    if (!selectedClass) {
      return <p>Please select a class</p>;
    }
    
    const notesContractAddress = notesContractsByClass[selectedClass.classAddress];
    
    if (!notesContractAddress) {
      return (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Notes Not Available</h3>
          <p className="mt-2 text-sm text-gray-500">
            The notes feature is not available for this class.
          </p>
        </div>
      );
    }
    
    return (
      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="my-notes">My Notes</TabsTrigger>
          <TabsTrigger value="upload">Upload Notes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="marketplace" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Notes Marketplace</h2>
          </div>
          <NotesMarketplace notesContractAddress={notesContractAddress} />
        </TabsContent>
        
        <TabsContent value="my-notes" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">My Notes</h2>
          </div>
          <MyNotes notesContractAddress={notesContractAddress} />
        </TabsContent>
        
        <TabsContent value="upload" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Upload Notes</h2>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Share Your Notes</CardTitle>
              <CardDescription>
                Upload your notes as a PDF to share with classmates. Your notes will be reviewed by the instructor before becoming available.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadNotesForm 
                lectures={lecturesByClass[selectedClass.classAddress] || []}
                notesContractAddress={notesContractsByClass[selectedClass.classAddress]}
                onSuccess={() => {
                  setConfirmationMessage("Notes uploaded successfully! They will be reviewed by the instructor.");
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
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

    // Render
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

  const openQRScanner = () => {
    setPopupContent({
      title: "Scan Attendance QR Code",
      content: (
        <QRScanner
          onScan={handleQRScan}
          onError={(error) => {
            console.error("QR Scanner error:", error);
            setConfirmationMessage("Error accessing camera. Please check camera permissions and try again.");
            setIsPopupOpen(false);
          }}
          onCancel={() => setIsPopupOpen(false)}
        />
      ),
    });
    setIsPopupOpen(true);
  };

  const handleQRScan = (data: { lectureId: number; classAddress: string }) => {
    // Verify the data contains what we need
    if (!data || !data.lectureId || !data.classAddress) {
      setConfirmationMessage("Invalid QR code. Please scan a valid attendance QR code.");
      setIsPopupOpen(false);
      return;
    }

    // Check if the scanned QR is for the currently selected class
    if (selectedClass && data.classAddress !== selectedClass.classAddress) {
      setConfirmationMessage("The scanned QR code is for a different class than the one you have selected.");
      setIsPopupOpen(false);
      return;
    }
    
    // All checks passed, mark attendance
    try {
      // Close the QR scanner popup first
      setIsPopupOpen(false);
      // Then mark attendance
      handleMarkAttendance(data.lectureId, data.classAddress);
    } catch (error) {
      console.error("Error in QR scan process:", error);
      setConfirmationMessage("Failed to process attendance. Please try again.");
    }
  };

  // Render
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">Student Dashboard</h1>
          <p className="text-gray-500 mt-1">View your classes, attendance, and quizzes</p>
        </div>
        <Button 
          onClick={openQRScanner}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        >
          <QrCode className="h-4 w-4 mr-2" />
          Scan Attendance QR
        </Button>
      </div>
      
      {isLoadingInitialData ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-100">
          <LoaderCircle className="h-8 w-8 text-blue-600 animate-spin mb-2" />
          <p className="text-gray-600">Loading classes...</p>
        </div>
      ) : (
        <>
          {confirmationMessage && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{confirmationMessage}</p>
                </div>
              </div>
            </div>
          )}

          {classes.length > 0 ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">My Classes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map((classItem) => (
                    <div 
                      key={classItem.classAddress}
                      onClick={() => setSelectedClass(classItem)}
                      className={`bg-white rounded-lg border cursor-pointer transition-all duration-200 overflow-hidden ${
                        selectedClass?.classAddress === classItem.classAddress 
                          ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' 
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`h-2 w-full ${
                        selectedClass?.classAddress === classItem.classAddress 
                          ? 'bg-blue-500' 
                          : 'bg-gray-200'
                      }`}></div>
                      <div className="p-4">
                        <h3 className="font-medium text-lg text-gray-900">{classItem.name}</h3>
                        <div className="flex items-center mt-1">
                          <span className="text-xs bg-gray-100 rounded px-2 py-1 text-gray-600">
                            {classItem.symbol}
                          </span>
                        </div>
                        <div className="mt-3 text-sm text-gray-500 truncate font-mono">
                          {classItem.classAddress.slice(0, 10)}...{classItem.classAddress.slice(-8)}
                        </div>
                        {selectedClass?.classAddress === classItem.classAddress && (
                          <div className="mt-3 text-xs text-blue-600 font-medium">
                            Currently Selected
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedClass ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  <TabsList className="w-full rounded-none justify-start px-6 pt-4 bg-white border-b">
                    <TabsTrigger value="attendance" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Attendance
                    </TabsTrigger>
                    <TabsTrigger value="quizzes" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                      <FilePieChart className="mr-2 h-4 w-4" />
                      Quizzes
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                      <FileText className="mr-2 h-4 w-4" />
                      Notes
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="attendance" className="p-6">
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-xl font-semibold text-gray-900">Attendance Records</h2>
                        <Button 
                          onClick={openQRScanner}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <QrCode className="mr-2 h-4 w-4" />
                          Scan QR Code
                        </Button>
                      </div>

                      {isFetchingLectures[selectedClass.classAddress] ? (
                        <div className="flex items-center justify-center h-40">
                          <LoaderCircle className="h-6 w-6 text-blue-600 animate-spin mr-2" />
                          <span className="text-gray-600">Loading lectures...</span>
                        </div>
                      ) : lecturesByClass[selectedClass.classAddress]?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {lecturesByClass[selectedClass.classAddress].map((lecture) => (
                            <div key={lecture.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                              <div className="p-4">
                                <h3 className="font-medium text-lg text-gray-900 mb-2">{lecture.topic}</h3>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">
                                    Lecture ID: {lecture.id}
                                  </span>
                                  {attendanceByClass[selectedClass.classAddress]?.[lecture.id - 1] ? (
                                    <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                      Attended
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                      Not Attended
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-500">
                          <BookOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p>No lectures found for this class.</p>
                          <p className="text-sm mt-1">Lecture information will appear once your teacher creates them.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="quizzes" className="p-6">
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-xl font-semibold text-gray-900">Quizzes</h2>
                        <Button
                          variant="outline"
                          onClick={() => refreshQuizzes(selectedClass.classAddress)}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          Refresh Quizzes
                        </Button>
                      </div>
                      {renderQuizzes(selectedClass.classAddress)}
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="p-6">
                    <div className="space-y-6">
                      {renderNotesTabs()}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <div className="text-center p-8">
                    <BookOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 font-medium">Please Select a Class</p>
                    <p className="text-sm text-gray-500 mt-1">Click on any class card above to view details.</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <div className="text-center p-8">
                <BookOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 font-medium">No Classes Found</p>
                <p className="text-sm text-gray-500 mt-1">You are not enrolled in any classes yet.</p>
              </div>
            </div>
          )}
        </>
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
