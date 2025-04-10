/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  createClass,
  mintNFT,
  createLecture,
  getClasses,
  getLectures,
  getAttendanceRecords,
  createQuiz,
  addQuizQuestion,
  getQuizzes,
  getQuizzesByLecture,
  getQuizResults,
  deactivateQuiz,
  deployQuizContract,
  linkQuizToClass,
  getClassQuizzes,
  getNotesContractForClass,
  createNotesContract
} from "@/lib/contractService";
import { useWalletContext } from "@/context/WalletContext";
import QRious from "qrious";
import { motion } from "framer-motion";
import Popup from "../components/Popup";
import StudentForm from "../components/StudentForm";
import CreateClassForm from "../components/CreateClassForm";
import CreateQuizForm from "../components/CreateQuizForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, GraduationCap, BookOpen, Edit, Eye, FilePieChart, Link, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ethers } from "ethers";
import ClassContract from "@/lib/contracts/ClassContract.sol/ClassContract.json";

interface Class {
  id: string;
  name: string;
  studentCount: number;
  lectureCount: number;
  classAddress: string;
}

interface Lecture {
  id: number;
  topic: string;
}

interface LecturesByClass {
  [classAddress: string]: Lecture[];
}

interface AttendanceByLecture {
  [key: string]: AttendanceRecord[]; // key will be `${classAddress}-${lectureId}`
}

interface AttendanceRecord {
  address: string;
  name: string;
}

interface LectureTopicsByClass {
  [classAddress: string]: string;
}

interface PopupContentType {
  title: string;
  content: React.ReactNode;
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

interface QuizzesByContract {
  [quizContractAddress: string]: Quiz[];
}

interface QuizResultsByStudent {
  address: string;
  name: string;
  score: number;
  totalQuestions: number;
  attemptedAt: number;
}

interface NotesContractsByClass {
  [classAddress: string]: string;
}

export function TeacherDashboard() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [lecturesByClass, setLecturesByClass] = useState<LecturesByClass>({});
  const [attendanceByLecture, setAttendanceByLecture] =
    useState<AttendanceByLecture>({});
  const [qrData, setQrData] = useState<string | null>(null);
  const [lectureTopicsByClass, setLectureTopicsByClass] =
    useState<LectureTopicsByClass>({});
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupContent, setPopupContent] = useState<PopupContentType | null>(
    null
  );
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [isCreatingLecture, setIsCreatingLecture] = useState<{
    [key: string]: boolean;
  }>({});
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isFetchingLectures, setIsFetchingLectures] = useState<{
    [key: string]: boolean;
  }>({});
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isLoadingQuizResults, setIsLoadingQuizResults] = useState(false); // Add this state

  // Quiz related state
  const [quizzesByContract, setQuizzesByContract] = useState<QuizzesByContract>(
    {}
  );
  const [quizContractsByClass, setQuizContractsByClass] = useState<{
    [classAddress: string]: string[];
  }>({});
  const [isFetchingQuizzes, setIsFetchingQuizzes] = useState<{
    [key: string]: boolean;
  }>({});
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [isDeployingQuizContract, setIsDeployingQuizContract] = useState(false);
  const [isLinkingQuizContract, setIsLinkingQuizContract] = useState(false);
  const [selectedLectureForQuiz, setSelectedLectureForQuiz] = useState<{
    lectureId: number;
    classAddress: string;
  } | null>(null);
  const [quizResultsByQuiz, setQuizResultsByQuiz] = useState<{
    [key: string]: QuizResultsByStudent[];
  }>({});
  const [newQuizContractAddress, setNewQuizContractAddress] = useState("");

  // Notes related state
  const [notesContractsByClass, setNotesContractsByClass] = useState<NotesContractsByClass>({});
  const [isCreatingNotesContract, setIsCreatingNotesContract] = useState(false);

  const { provider, address } = useWalletContext();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoadingInitialData(true);
        const classList = await getClasses(provider);
        const formattedClasses = classList.map((classData) => ({
          classAddress: classData[0],
          name: classData[1],
          symbol: classData[2],
          studentCount: 0,
          lectureCount: 0,
        }));
        setClasses(formattedClasses);

        for (const classItem of formattedClasses) {
          await fetchLectures(classItem.classAddress); // Fetch lectures immediately
        }
        // For each class, fetch associated quiz contracts
        for (const classItem of formattedClasses) {
          try {
            const quizContracts = await getClassQuizzes(
              classItem.classAddress,
              provider
            );
            setQuizContractsByClass((prev) => ({
              ...prev,
              [classItem.classAddress]: quizContracts,
            }));

            // Fetch quizzes for each quiz contract
            for (const quizContractAddress of quizContracts) {
              await fetchQuizzes(quizContractAddress);
            }
          } catch (error) {
            console.error(
              `Error fetching quiz contracts for class ${classItem.classAddress}:`,
              error
            );
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
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setConfirmationMessage(
          "Failed to load classes. Please refresh the page."
        );
      } finally {
        setIsLoadingInitialData(false);
      }
    };
    fetchInitialData();
  }, [provider]);

  const handleCreateLecture = async (classAddress: string) => {
    const topic = lectureTopicsByClass[classAddress];
    if (!topic) return;

    try {
      setIsCreatingLecture((prev) => ({ ...prev, [classAddress]: true }));
      const id = await createLecture(classAddress, topic, provider);
      setLectureTopicsByClass((prev) => ({
        ...prev,
        [classAddress]: "",
      }));
      await fetchLectures(classAddress);
    } catch (error) {
      console.error("Error creating lecture:", error);
      setConfirmationMessage("Failed to create lecture. Please try again.");
    } finally {
      setIsCreatingLecture((prev) => ({ ...prev, [classAddress]: false }));
    }
  };

  useEffect(() => {
    if (qrData && isPopupOpen) {
      const canvasElements = document.querySelectorAll(
        'canvas[id^="qr-code-"]'
      );
      canvasElements.forEach((canvas) => {
        new QRious({
          element: canvas,
          value: qrData,
          size: 250,
        });
      });
    }
  }, [qrData, isPopupOpen]);

  const openMintForm = (classId: string) => {
    const handleFormSubmit = async (formData: {
      address: string;
      name: string;
      details: string;
    }) => {
      try {
        setIsAddingStudent(true);
        await mintNFT(classId, formData.address, formData.name, provider);
        setConfirmationMessage(`Student ${formData.name} added successfully!`);
        setIsPopupOpen(false);
      } catch (error) {
        console.error("Error adding student:", error);
        setConfirmationMessage("Failed to add student. Please try again.");
      } finally {
        setIsAddingStudent(false);
      }
    };

    setPopupContent({
      title: "Add New Student",
      content: (
        <StudentForm
          onSubmit={handleFormSubmit}
          isAddingStudent={isAddingStudent}
        />
      ),
    });
    setIsPopupOpen(true);
  };

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

  const handleTakeAttendance = (id: number, classAddress: string) => {
    const qrData = JSON.stringify({
      lectureId: id,
      classAddress: classAddress,
    });
    setQrData(qrData);

    const qrContent = (
      <div className="space-y-4">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4">
            Scan QR Code to Mark Attendance
          </h3>
          <canvas id={`qr-code-${id}`} className="mb-4" />
        </div>
      </div>
    );

    setPopupContent({
      title: "Take Attendance",
      content: qrContent,
    });
    setIsPopupOpen(true);
  };

  const fetchAttendanceRecords = async (
    lectureId: any,
    classAddress: string
  ) => {
    const [records, names] = await getAttendanceRecords(
      classAddress,
      lectureId,
      provider
    );
    console.log("Fetched attendance records:", records);
    console.log("Fetched student names:", names);
    const attendanceRecords = records.map((address, index) => ({
      address,
      name: names[index],
    }));
    const key = `${classAddress}-${lectureId}`;
    setAttendanceByLecture((prev) => ({
      ...prev,
      [key]: attendanceRecords,
    }));
  };

  const handleViewAttendance = async (
    lectureId: number,
    classAddress: string
  ) => {
    // Show loading state in popup first
    setPopupContent({
      title: "Attendance Records",
      content: <div className="text-center">Loading attendance records...</div>,
    });
    setIsPopupOpen(true);

    // Fetch records directly
    const [records, names] = await getAttendanceRecords(
      classAddress,
      lectureId,
      provider
    );
    const attendanceRecords = records.map((address: string, index: number) => ({
      address,
      name: names[index],
    }));

    // Update state for other uses
    const key = `${classAddress}-${lectureId}`;
    setAttendanceByLecture((prev) => ({
      ...prev,
      [key]: attendanceRecords,
    }));

    const attendanceContent = (
      <div className="space-y-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Attendance Records</h3>
            <Button
              onClick={() => downloadAttendanceData(classAddress, lectureId)}
              className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              Download Records
            </Button>
          </div>

          <div className="mb-6">
            <h4 className="text-md font-semibold mb-2">Attendance:</h4>
            {attendanceRecords.length > 0 ? (
              <ul className="space-y-2">
                {attendanceRecords.map((student) => (
                  <li
                    key={student.address}
                    className="p-2 bg-gray-100 rounded-lg"
                  >
                    <span className="font-semibold">{student.name}</span>
                    <br />
                    <span className="text-sm text-gray-600">
                      {student.address}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No attendance records yet.</p>
            )}
          </div>
        </div>
      </div>
    );

    // Update popup with combined data
    setPopupContent({
      title: "Attendance Records",
      content: attendanceContent,
    });
  };

  const downloadAttendanceData = (classAddress: string, lectureId: number) => {
    const key = `${classAddress}-${lectureId}`;
    const records = attendanceByLecture[key];

    if (!records || records.length === 0) {
      alert("No attendance records available to download.");
      return;
    }

    const csvRows = [
      ["Address", "Name"],
      ...records.map((record) => [record.address, record.name]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvRows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance_records.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setPopupContent(null);
  };

  const openCreateClassForm = () => {
    const handleFormSubmit = async (formData: {
      name: string;
      symbol: string;
    }) => {
      try {
        setIsCreatingClass(true);
        await createClass(formData.name, formData.symbol, provider);

        setConfirmationMessage(`Class ${formData.name} created successfully!`);
        setIsPopupOpen(false);

        // Update the classes list
        const classList = await getClasses(provider);
        const formattedClasses = classList.map((classData) => ({
          classAddress: classData[0],
          name: classData[1],
          symbol: classData[2],
          studentCount: 0,
          lectureCount: 0,
        }));
        setClasses(formattedClasses);
      } catch (error) {
        console.error("Error creating class:", error);
        setConfirmationMessage("Failed to create class. Please try again.");
      } finally {
        setIsCreatingClass(false);
      }
    };

    setPopupContent({
      title: "Create New Class",
      content: (
        <CreateClassForm
          onSubmit={handleFormSubmit}
          isCreating={isCreatingClass}
        />
      ),
    });
    setIsPopupOpen(true);
  };

  const fetchQuizzes = async (quizContractAddress: string) => {
    try {
      setIsFetchingQuizzes((prev) => ({
        ...prev,
        [quizContractAddress]: true,
      }));
      const quizzesList = await getQuizzes(quizContractAddress, provider);
      setQuizzesByContract((prev) => ({
        ...prev,
        [quizContractAddress]: quizzesList,
      }));
    } catch (error) {
      console.error(
        `Error fetching quizzes for contract ${quizContractAddress}:`,
        error
      );
      setConfirmationMessage("Failed to fetch quizzes. Please try again.");
    } finally {
      setIsFetchingQuizzes((prev) => ({
        ...prev,
        [quizContractAddress]: false,
      }));
    }
  };

  const openCreateQuizForm = (
    quizContractAddress: string,
    classAddress: string
  ) => {
    const classLectures = lecturesByClass[classAddress] || [];

    const handleFormSubmit = async (formData: {
      title: string;
      description: string;
      expiresAt: number;
      lectureId: number;
      questions: Array<{
        text: string;
        options: string[];
        correctOptionIndex: number;
      }>;
    }) => {
      try {
        setIsCreatingQuiz(true);

        // Create the quiz
        const quizId = await createQuiz(
          quizContractAddress,
          formData.title,
          formData.description,
          formData.expiresAt,
          formData.lectureId,
          provider
        );

        // Add questions to the quiz
        for (const question of formData.questions) {
          await addQuizQuestion(
            quizContractAddress,
            quizId,
            question.text,
            question.options,
            question.correctOptionIndex,
            provider
          );
        }

        setConfirmationMessage(
          `Quiz "${formData.title}" created successfully!`
        );
        await fetchQuizzes(quizContractAddress);
        setIsPopupOpen(false);
      } catch (error) {
        console.error("Error creating quiz:", error);
        setConfirmationMessage("Failed to create quiz. Please try again.");
      } finally {
        setIsCreatingQuiz(false);
      }
    };

    setPopupContent({
      title: "Create New Quiz",
      content: (
        <CreateQuizForm
          onSubmit={handleFormSubmit}
          lectures={classLectures}
          isCreatingQuiz={isCreatingQuiz}
        />
      ),
    });
    setIsPopupOpen(true);
  };

  const fetchQuizResultsByQuiz = async (
    quizId: number,
    quizContractAddress: string,
    classAddress: string
  ) => {
    try {
      // First, attempt to get all students from the class contract
      const signer = provider.getSigner();
      const classContract = new ethers.Contract(
        classAddress,
        ClassContract.abi,
        signer
      );
      const totalSupply = await classContract.totalSupply();

      // Get all student addresses and names
      const addresses = [];
      const names = [];

      for (let i = 1; i <= totalSupply.toNumber(); i++) {
        try {
          const studentAddress = await classContract.ownerOf(i);
          const studentName = await classContract.getStudentName(i);
          addresses.push(studentAddress);
          names.push(studentName);
        } catch (error) {
          console.error(`Error getting student at index ${i}:`, error);
        }
      }

      // Get results for each student
      const results: QuizResultsByStudent[] = [];

      for (let i = 0; i < addresses.length; i++) {
        try {
          const studentAddress = addresses[i];
          const studentName = names[i];

          const result = await getQuizResults(
            quizContractAddress,
            quizId,
            studentAddress,
            provider
          );

          if (result.hasAttempted) {
            results.push({
              address: studentAddress,
              name: studentName,
              score: result.score,
              totalQuestions: result.totalQuestions,
              attemptedAt: result.attemptedAt,
            });
          }
        } catch (error) {
          console.error("Error fetching result for student:", error);
        }
      }

      console.log(
        `Found ${results.length} students who attempted quiz ${quizId}`
      );

      setQuizResultsByQuiz((prev) => ({
        ...prev,
        [`${quizContractAddress}-${quizId}`]: results,
      }));
    } catch (error) {
      console.error("Error fetching quiz results:", error);
      setConfirmationMessage("Failed to fetch quiz results. Please try again.");
    }
  };

  const handleDeactivateQuiz = async (
    quizId: number,
    quizContractAddress: string
  ) => {
    try {
      await deactivateQuiz(quizContractAddress, quizId, provider);
      setConfirmationMessage("Quiz deactivated successfully!");

      // Refresh quizzes
      await fetchQuizzes(quizContractAddress);
    } catch (error) {
      console.error("Error deactivating quiz:", error);
      setConfirmationMessage("Failed to deactivate quiz. Please try again.");
    }
  };

  const handleViewQuizResults = async (
    quizId: number,
    quizContractAddress: string,
    classAddress: string,
    title: string
  ) => {
    setIsLoadingQuizResults(true); // Set loading state to true
    if (!quizResultsByQuiz[`${quizContractAddress}-${quizId}`]) {
      await fetchQuizResultsByQuiz(quizId, quizContractAddress, classAddress);
    }

    const results = quizResultsByQuiz[`${quizContractAddress}-${quizId}`] || [];

    const updatedResults =
      quizResultsByQuiz[`${quizContractAddress}-${quizId}`] || [];

    setPopupContent({
      title: `Results: ${title}`,
      content: (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            {updatedResults.length}{" "}
            {updatedResults.length === 1 ? "student has" : "students have"}{" "}
            attempted this quiz
          </div>
          {isLoadingQuizResults ? (
            <div className="text-center">Loading results...</div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 font-medium text-sm py-2 border-b">
                <div>Student</div>
                <div>Score</div>
              </div>

              {results.map((result, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 text-sm py-2 border-b border-gray-100"
                >
                  <div>{result.name}</div>
                  <div>
                    {result.score}/{result.totalQuestions} (
                    {Math.round((result.score / result.totalQuestions) * 100)}%)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No students have attempted this quiz yet.
            </div>
          )}
          <Button
            onClick={() => downloadQuizResults(quizId, title, results)}
            className="w-full mt-4"
          >
            Download Results CSV
          </Button>
        </div>
      ),
    });
    setIsLoadingQuizResults(false);
    setIsPopupOpen(true);
  };

  const downloadQuizResults = (
    quizId: number,
    quizTitle: string,
    results: QuizResultsByStudent[]
  ) => {
    const rows = [
      [
        "Student Name",
        "Address",
        "Score",
        "Total Questions",
        "Percentage",
        "Attempted At",
      ],
      ...results.map((r) => [
        r.name,
        r.address,
        r.score.toString(),
        r.totalQuestions.toString(),
        `${Math.round((r.score / r.totalQuestions) * 100)}%`,
        new Date(r.attemptedAt).toLocaleString(),
      ]),
    ];

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Quiz_${quizId}_${quizTitle.replace(/\s+/g, "_")}_Results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const refreshQuizContracts = async (classAddress: string) => {
    try {
      const quizContracts = await getClassQuizzes(classAddress, provider);
      setQuizContractsByClass((prev) => ({
        ...prev,
        [classAddress]: quizContracts,
      }));

      // Fetch quizzes for each contract
      for (const quizContractAddress of quizContracts) {
        await fetchQuizzes(quizContractAddress);
      }

      setConfirmationMessage("Quiz contracts refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing quiz contracts:", error);
      setConfirmationMessage(
        "Failed to refresh quiz contracts. Please try again."
      );
    }
  };

  // Quiz related functions
  const handleDeployQuizContract = async () => {
    try {
      setIsDeployingQuizContract(true);
      const quizContractAddress = await deployQuizContract(address, provider);
      setNewQuizContractAddress(quizContractAddress);
      setConfirmationMessage(
        `Quiz contract deployed at: ${quizContractAddress}`
      );
    } catch (error) {
      console.error("Error deploying quiz contract:", error);
      setConfirmationMessage(
        "Failed to deploy quiz contract. Please try again."
      );
    } finally {
      setIsDeployingQuizContract(false);
    }
  };

  const handleLinkQuizContract = async (
    classAddress: string,
    quizContractAddress: string
  ) => {
    if (!quizContractAddress) {
      setConfirmationMessage("Please enter a quiz contract address.");
      return;
    }

    try {
      setIsLinkingQuizContract(true);
      await linkQuizToClass(classAddress, quizContractAddress, provider);

      // Update quiz contracts for this class
      const quizContracts = await getClassQuizzes(classAddress, provider);
      setQuizContractsByClass((prev) => ({
        ...prev,
        [classAddress]: quizContracts,
      }));

      // Fetch quizzes for the newly linked contract
      await fetchQuizzes(quizContractAddress);

      setConfirmationMessage("Quiz contract linked successfully!");
      setNewQuizContractAddress("");
    } catch (error) {
      console.error("Error linking quiz contract:", error);
      setConfirmationMessage(
        "Failed to link quiz contract. Please check the address and try again."
      );
    } finally {
      setIsLinkingQuizContract(false);
    }
  };

  const openLinkQuizContractForm = (classAddress: string) => {
    setPopupContent({
      title: "Link Quiz Contract",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quizContractAddress">Quiz Contract Address</Label>
            <Input
              id="quizContractAddress"
              value={newQuizContractAddress}
              onChange={(e) => setNewQuizContractAddress(e.target.value)}
              placeholder="Enter quiz contract address"
              className="w-full"
            />
          </div>

          <Button
            onClick={() =>
              handleLinkQuizContract(classAddress, newQuizContractAddress)
            }
            disabled={isLinkingQuizContract}
            className="w-full"
          >
            {isLinkingQuizContract ? "Linking..." : "Link Quiz Contract"}
          </Button>

          <div className="text-center text-sm text-muted-foreground mt-2">
            <p>Don't have a quiz contract? Deploy one first.</p>
            <Button
              onClick={handleDeployQuizContract}
              disabled={isDeployingQuizContract}
              variant="outline"
              className="mt-2 w-full"
            >
              {isDeployingQuizContract
                ? "Deploying..."
                : "Deploy New Quiz Contract"}
            </Button>
          </div>
        </div>
      ),
    });
    setIsPopupOpen(true);
  };

  const handleCreateNotesContract = async (classAddress: string, className: string) => {
    try {
      setIsCreatingNotesContract(true);
      
      const notesContractAddress = await createNotesContract(address, className, classAddress, provider);
      
      if (notesContractAddress) {
        setNotesContractsByClass((prev) => ({
          ...prev,
          [classAddress]: notesContractAddress
        }));
        
        setConfirmationMessage("Notes contract created successfully!");
      } else {
        setConfirmationMessage("Failed to create notes contract. Please try again.");
      }
    } catch (error) {
      console.error("Error creating notes contract:", error);
      setConfirmationMessage("Failed to create notes contract. Please try again.");
    } finally {
      setIsCreatingNotesContract(false);
    }
  };

  const renderNotesSection = (classAddress: string, className: string) => {
    const notesContractAddress = notesContractsByClass[classAddress];
    
    if (!notesContractAddress) {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Notes Management</h3>
            <Button 
              onClick={() => handleCreateNotesContract(classAddress, className)}
              disabled={isCreatingNotesContract}
            >
              {isCreatingNotesContract ? "Creating..." : "Create Notes Contract"}
            </Button>
          </div>
          <p className="text-muted-foreground">
            Create a Notes contract to enable students to upload and share their notes as NFTs.
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Notes Management</h3>
          <p className="text-sm text-green-600">Notes enabled</p>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Student Notes</CardTitle>
              <Badge variant="outline">
                Contract: {notesContractAddress.slice(0, 6)}...{notesContractAddress.slice(-4)}
              </Badge>
            </div>
            <CardDescription>
              Students can share and purchase notes directly from each other
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Notes sharing is enabled for this class.</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Teacher Dashboard</h1>
        <Button onClick={openCreateClassForm}>
          <PlusCircle className="h-4 w-4 mr-2" /> New Class
        </Button>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GraduationCap className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Create Your First Class
            </h2>
            <p className="text-gray-500 mb-4">
              Get started by creating your first class to manage students and
              take attendance.
            </p>
            <Button onClick={openCreateClassForm}>
              <PlusCircle className="h-4 w-4 mr-2" /> Create Class
            </Button>
          </motion.div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {classes.map((classItem, index) => (
            <Card key={classItem.classAddress} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{classItem.name}</CardTitle>
                <CardDescription>
                  Class Address: {classItem.classAddress}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="students">

                  <TabsList className="w-full">
                    <TabsTrigger value="students" className="flex-1">
                      <GraduationCap className="h-4 w-4 mr-2" /> Students
                    </TabsTrigger>
                    <TabsTrigger value="lectures" className="flex-1">
                      <BookOpen className="h-4 w-4 mr-2" /> Lectures & Attendance
                    </TabsTrigger>
                    <TabsTrigger value="quizzes" className="flex-1">
                      <FilePieChart className="h-4 w-4 mr-2" /> Quizzes
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="flex-1">
                      <FileText className="h-4 w-4 mr-2" /> Notes
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="lectures" className="p-4">
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          className="border rounded p-2 flex-1"
                          value={
                            lectureTopicsByClass[classItem.classAddress] || ""
                          }
                          onChange={(e) =>
                            setLectureTopicsByClass((prev) => ({
                              ...prev,
                              [classItem.classAddress]: e.target.value,
                            }))
                          }
                          placeholder="Lecture Topic"
                        />
                        <Button
                          onClick={() =>
                            handleCreateLecture(classItem.classAddress)
                          }
                          disabled={isCreatingLecture[classItem.classAddress]}
                        >
                          {isCreatingLecture[classItem.classAddress]
                            ? "Creating..."
                            : "Create"}
                        </Button>
                      </div>
                    </div>


                    <Button
                      onClick={() => openMintForm(classItem.classAddress)}
                      variant="outline"
                      className="w-full mb-4"
                    >
                      {isFetchingLectures[classItem.classAddress]
                        ? "Loading lectures..."
                        : "Refresh Lectures"}
                    </Button>

                    {lecturesByClass[classItem.classAddress]?.length > 0 ? (
                      <div className="space-y-3">
                        {lecturesByClass[classItem.classAddress].map(
                          (lecture) => (
                            <div
                              key={lecture.id}
                              className="p-3 border rounded hover:bg-gray-50"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="font-medium">
                                    {lecture.topic}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    ID: {lecture.id}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() =>
                                      handleTakeAttendance(
                                        lecture.id,
                                        classItem.classAddress
                                      )
                                    }
                                    size="sm"
                                    variant="outline"
                                  >
                                    Take Attendance
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleViewAttendance(
                                        lecture.id,
                                        classItem.classAddress
                                      )
                                    }
                                    size="sm"
                                    variant="outline"
                                  >
                                    View Attendance
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-4 text-gray-500">
                        No lectures found for this class.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="students" className="p-4">
                    <Button
                      onClick={() => openMintForm(classItem.classAddress)}
                      className="w-full mb-4"
                    >
                      Add Student
                    </Button>
                  </TabsContent>

                  <TabsContent value="quizzes" className="p-4">
                    <div className="flex space-x-2 mb-4">
                      <Button
                        onClick={() =>
                          openLinkQuizContractForm(classItem.classAddress)
                        }
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Link className="h-4 w-4" /> Link Quiz Contract
                      </Button>
                      <Button
                        onClick={() =>
                          refreshQuizContracts(classItem.classAddress)
                        }
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        Refresh
                      </Button>
                    </div>

                    {quizContractsByClass[classItem.classAddress]?.length >
                    0 ? (
                      <div className="space-y-6">
                        {quizContractsByClass[classItem.classAddress].map(
                          (quizContractAddress) => (
                            <div
                              key={quizContractAddress}
                              className="space-y-3"
                            >
                              <div className="flex justify-between items-center">
                                <h3 className="text-sm font-semibold text-gray-500">
                                  Contract:{" "}
                                  {quizContractAddress.substring(0, 6)}...
                                  {quizContractAddress.substring(38)}
                                </h3>
                                <Button
                                  onClick={() =>
                                    openCreateQuizForm(
                                      quizContractAddress,
                                      classItem.classAddress
                                    )
                                  }
                                  size="sm"
                                  className="flex items-center gap-1"
                                >
                                  <PlusCircle className="h-3 w-3" /> Add Quiz
                                </Button>
                              </div>

                              <Button
                                onClick={() =>
                                  fetchQuizzes(quizContractAddress)
                                }
                                disabled={
                                  isFetchingQuizzes[quizContractAddress]
                                }
                                variant="outline"
                                size="sm"
                                className="w-full mb-2"
                              >
                                {isFetchingQuizzes[quizContractAddress]
                                  ? "Loading quizzes..."
                                  : "Load Quizzes"}
                              </Button>

                              {quizzesByContract[quizContractAddress]?.length >
                              0 ? (
                                <div className="space-y-3 pl-2 border-l-2 border-gray-200">
                                  {quizzesByContract[quizContractAddress].map(
                                    (quiz) => {
                                      const isExpired =
                                        Date.now() > quiz.expiresAt;
                                      const lectureInfo = lecturesByClass[
                                        classItem.classAddress
                                      ]?.find((l) => l.id === quiz.lectureId);

                                      return (
                                        <div
                                          key={quiz.id}
                                          className={`p-3 border rounded hover:bg-gray-50 ${
                                            !quiz.isActive || isExpired
                                              ? "opacity-70"
                                              : ""
                                          }`}
                                        >
                                          <div className="space-y-2">
                                            <div className="flex justify-between">
                                              <h3 className="font-medium">
                                                {quiz.title}
                                              </h3>
                                              {quiz.isActive ? (
                                                <span
                                                  className={`text-xs px-2 py-1 rounded-full ${
                                                    isExpired
                                                      ? "bg-red-100 text-red-800"
                                                      : "bg-green-100 text-green-800"
                                                  }`}
                                                >
                                                  {isExpired
                                                    ? "Expired"
                                                    : "Active"}
                                                </span>
                                              ) : (
                                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                                  Inactive
                                                </span>
                                              )}
                                            </div>

                                            <p className="text-sm">
                                              {quiz.description}
                                            </p>

                                            <div className="text-xs text-gray-500">
                                              <div>
                                                Questions: {quiz.questionCount}
                                              </div>
                                              <div>
                                                Lecture:{" "}
                                                {lectureInfo?.topic ||
                                                  quiz.lectureId}
                                              </div>
                                              <div>
                                                Expires:{" "}
                                                {new Date(
                                                  quiz.expiresAt
                                                ).toLocaleString()}
                                              </div>
                                            </div>

                                            <div className="flex space-x-2 pt-2">
                                              <Button
                                                onClick={() =>
                                                  handleViewQuizResults(
                                                    quiz.id,
                                                    quizContractAddress,
                                                    classItem.classAddress,
                                                    quiz.title
                                                  )
                                                }
                                                size="sm"
                                                variant="outline"
                                                className="flex items-center gap-1"
                                              >
                                                <Eye className="h-3 w-3" />{" "}
                                                Results
                                              </Button>

                                              {quiz.isActive && (
                                                <Button
                                                  onClick={() =>
                                                    handleDeactivateQuiz(
                                                      quiz.id,
                                                      quizContractAddress
                                                    )
                                                  }
                                                  size="sm"
                                                  variant="destructive"
                                                  className="flex items-center gap-1"
                                                >
                                                  Deactivate
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              ) : (
                                <div className="text-center p-3 text-gray-500 text-sm">
                                  No quizzes found for this contract.
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-4 text-gray-500">
                        No quiz contracts linked to this class.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
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

export default TeacherDashboard;
