/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getEligibleClasses, getLectures, getOwnAttendance, markAttendance, getQuizzes, getQuizzesByLecture, getQuizQuestions, submitQuizAnswers, getQuizResults, getClassQuizzes, getNotesContractForClass } from "@/lib/contractService";
import { useWalletContext } from "@/context/WalletContext";
import Popup from "../components/Popup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FilePieChart, FileText, QrCode } from "lucide-react";
import TakeQuizForm from "../components/TakeQuizForm";
import QuizResults from "../components/QuizResults";
import UploadNotesForm from "../components/UploadNotesForm";
import NotesMarketplace from "../components/NotesMarketplace";
import MyNotes from "../components/MyNotes";
import QRScanner from "../components/QRScanner";

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
                notesContractAddress={notesContractAddress}
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
    handleMarkAttendance(data.lectureId, data.classAddress);
    setIsPopupOpen(false);
  };

  // Render
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>
      
      {isLoadingInitialData ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading classes...</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label htmlFor="classSelect" className="block text-sm font-medium mb-2">
              Select Class
            </label>
            <select
              id="classSelect"
              className="w-full md:w-1/2 p-2 border rounded-md"
              value={selectedClass ? selectedClass.classAddress : ""}
              onChange={(e) => {
                const selectedClassObj = classes.find(
                  (c) => c.classAddress === e.target.value
                );
                setSelectedClass(selectedClassObj || null);
              }}
            >
              <option value="">Select a class</option>
              {classes.map((classItem) => (
                <option key={classItem.classAddress} value={classItem.classAddress}>
                  {classItem.name} ({classItem.symbol})
                </option>
              ))}
            </select>
          </div>

          {confirmationMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {confirmationMessage}
            </div>
          )}

          {selectedClass && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-8">
                <TabsTrigger value="attendance">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Attendance
                </TabsTrigger>
                <TabsTrigger value="quizzes">
                  <FilePieChart className="mr-2 h-4 w-4" />
                  Quizzes
                </TabsTrigger>
                <TabsTrigger value="notes">
                  <FileText className="mr-2 h-4 w-4" />
                  Notes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="attendance">
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Attendance</h2>
                    <Button onClick={openQRScanner}>
                      <QrCode className="mr-2 h-4 w-4" />
                      Scan QR Code
                    </Button>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Lectures</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isFetchingLectures[selectedClass.classAddress] ? (
                        <p>Loading lectures...</p>
                      ) : lecturesByClass[selectedClass.classAddress]?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {lecturesByClass[selectedClass.classAddress].map((lecture) => (
                            <Card key={lecture.id} className="overflow-hidden">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg">{lecture.topic}</CardTitle>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <p className="text-sm">
                                  Lecture ID: {lecture.id}
                                </p>
                              </CardContent>
                              <div className="p-4 pt-0 flex justify-end">
                                {attendanceByClass[selectedClass.classAddress]?.[
                                  lecture.id - 1
                                ] ? (
                                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                    Attended
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                                    Not Attended
                                  </span>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p>No lectures found for this class.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="quizzes">
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Quizzes</h2>
                    <Button
                      variant="outline"
                      onClick={() => refreshQuizzes(selectedClass.classAddress)}
                    >
                      Refresh Quizzes
                    </Button>
                  </div>
                  {renderQuizzes(selectedClass.classAddress)}
                </div>
              </TabsContent>

              <TabsContent value="notes">
                <div className="grid grid-cols-1 gap-6">
                  {renderNotesTabs()}
                </div>
              </TabsContent>
            </Tabs>
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
