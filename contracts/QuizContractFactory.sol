// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract QuizContractFactory is Ownable {
    event QuizContractCreated(address quizContractAddress, address owner);

    struct QuizContractInfo {
        address contractAddress;
        address owner;
        uint256 createdAt;
    }

    QuizContractInfo[] public quizContracts;
    mapping(address => address[]) public ownerQuizContracts; // owner => quizContractAddresses

    constructor() Ownable(msg.sender) {}

    function createQuizContract(address owner) public onlyOwner returns (address) {
        QuizContract newQuizContract = new QuizContract(owner);
        address quizContractAddress = address(newQuizContract);
        
        quizContracts.push(QuizContractInfo({
            contractAddress: quizContractAddress,
            owner: owner,
            createdAt: block.timestamp
        }));
        
        ownerQuizContracts[owner].push(quizContractAddress);
        emit QuizContractCreated(quizContractAddress, owner);
        
        return quizContractAddress;
    }

    function getQuizContracts() public view returns (QuizContractInfo[] memory) {
        return quizContracts;
    }

    function getOwnerQuizContracts(address owner) public view returns (address[] memory) {
        return ownerQuizContracts[owner];
    }

    function getQuizContractCount() public view returns (uint256) {
        return quizContracts.length;
    }
} 


contract QuizContract is Ownable {
    struct Question {
        string questionText;
        string[] options;
        uint8 correctOptionIndex;
    }

    struct Quiz {
        uint256 id;
        string title;
        string description;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 lectureId; // Associated lecture ID
        bool isActive;
        uint256[] questionIds;
    }

    struct StudentQuizResult {
        bool hasAttempted;
        uint256 score;
        uint256 attemptedAt;
        mapping(uint256 => uint8) answers; // questionId -> selectedOption
    }

    // Mappings
    mapping(uint256 => Quiz) public quizzes;
    mapping(uint256 => Question) public questions;
    mapping(address => mapping(uint256 => StudentQuizResult)) public quizResults; // student -> quizId -> result
    
    // Counters
    uint256 public quizCount;
    uint256 public questionCount;

    // Events
    event QuizCreated(uint256 indexed quizId, string title, uint256 expiresAt);
    event QuizSubmitted(address indexed student, uint256 indexed quizId, uint256 score);

    constructor(address initialOwner) Ownable(initialOwner) {}

    // Create a new quiz
    function createQuiz(
        string memory title,
        string memory description,
        uint256 expiresAt,
        uint256 lectureId
    ) public onlyOwner returns (uint256) {
        quizCount++;
        uint256 quizId = quizCount;
        
        quizzes[quizId] = Quiz({
            id: quizId,
            title: title,
            description: description,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            lectureId: lectureId,
            isActive: true,
            questionIds: new uint256[](0)
        });
        
        emit QuizCreated(quizId, title, expiresAt);
        return quizId;
    }
    
    // Add a question to a quiz
    function addQuestion(
        uint256 quizId,
        string memory questionText,
        string[] memory options,
        uint8 correctOptionIndex
    ) public onlyOwner {
        require(quizId > 0 && quizId <= quizCount, "Quiz does not exist");
        require(correctOptionIndex < options.length, "Invalid correct option index");
        
        questionCount++;
        uint256 questionId = questionCount;
        
        questions[questionId] = Question({
            questionText: questionText,
            options: options,
            correctOptionIndex: correctOptionIndex
        });
        
        quizzes[quizId].questionIds.push(questionId);
    }
    
    // Submit a quiz answer
    function submitQuiz(uint256 quizId, uint8[] memory selectedOptions) public {
        Quiz storage quiz = quizzes[quizId];
        require(quiz.id > 0, "Quiz does not exist");
        require(quiz.isActive, "Quiz is not active");
        require(block.timestamp <= quiz.expiresAt, "Quiz has expired");
        require(selectedOptions.length == quiz.questionIds.length, "Invalid number of answers");
        
        StudentQuizResult storage result = quizResults[msg.sender][quizId];
        require(!result.hasAttempted, "Quiz already attempted");
        
        // Calculate score
        uint256 score = 0;
        for (uint256 i = 0; i < quiz.questionIds.length; i++) {
            uint256 questionId = quiz.questionIds[i];
            uint8 selectedOption = selectedOptions[i];
            
            // Store the answer
            result.answers[questionId] = selectedOption;
            
            // Check if answer is correct
            if (selectedOption == questions[questionId].correctOptionIndex) {
                score++;
            }
        }
        
        // Update the result
        result.hasAttempted = true;
        result.score = score;
        result.attemptedAt = block.timestamp;
        
        emit QuizSubmitted(msg.sender, quizId, score);
    }
    
    // Get quiz details (without questions)
    function getQuiz(uint256 quizId) public view returns (
        uint256 id,
        string memory title,
        string memory description,
        uint256 createdAt,
        uint256 expiresAt,
        uint256 lectureId,
        bool isActive,
        uint256 questionCount
    ) {
        Quiz storage quiz = quizzes[quizId];
        require(quiz.id > 0, "Quiz does not exist");
        
        return (
            quiz.id,
            quiz.title,
            quiz.description,
            quiz.createdAt,
            quiz.expiresAt,
            quiz.lectureId,
            quiz.isActive,
            quiz.questionIds.length
        );
    }
    
    // Get quiz questions
    function getQuizQuestions(uint256 quizId) public view returns (uint256[] memory) {
        Quiz storage quiz = quizzes[quizId];
        require(quiz.id > 0, "Quiz does not exist");
        
        return quiz.questionIds;
    }
    
    // Get specific question details
    function getQuestion(uint256 questionId) public view returns (
        string memory questionText,
        string[] memory options
    ) {
        Question storage question = questions[questionId];
        
        return (
            question.questionText,
            question.options
        );
    }
    
    // Get student's score for a quiz
    function getQuizScore(address student, uint256 quizId) public view returns (
        bool hasAttempted,
        uint256 score,
        uint256 attemptedAt,
        uint256 totalQuestions
    ) {
        Quiz storage quiz = quizzes[quizId];
        require(quiz.id > 0, "Quiz does not exist");
        
        StudentQuizResult storage result = quizResults[student][quizId];
        
        return (
            result.hasAttempted,
            result.score,
            result.attemptedAt,
            quiz.questionIds.length
        );
    }
    
    // Get all active quizzes
    function getActiveQuizzes() public view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count active quizzes
        for (uint256 i = 1; i <= quizCount; i++) {
            if (quizzes[i].isActive && block.timestamp <= quizzes[i].expiresAt) {
                count++;
            }
        }
        
        uint256[] memory activeQuizIds = new uint256[](count);
        uint256 index = 0;
        
        // Fill active quiz IDs
        for (uint256 i = 1; i <= quizCount; i++) {
            if (quizzes[i].isActive && block.timestamp <= quizzes[i].expiresAt) {
                activeQuizIds[index] = i;
                index++;
            }
        }
        
        return activeQuizIds;
    }
    
    // Deactivate a quiz
    function deactivateQuiz(uint256 quizId) public onlyOwner {
        require(quizId > 0 && quizId <= quizCount, "Quiz does not exist");
        quizzes[quizId].isActive = false;
    }

    // Get all quizzes for a lecture
    function getQuizzesForLecture(uint256 lectureId) public view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count quizzes for the lecture
        for (uint256 i = 1; i <= quizCount; i++) {
            if (quizzes[i].lectureId == lectureId) {
                count++;
            }
        }
        
        uint256[] memory lectureQuizIds = new uint256[](count);
        uint256 index = 0;
        
        // Fill quiz IDs for the lecture
        for (uint256 i = 1; i <= quizCount; i++) {
            if (quizzes[i].lectureId == lectureId) {
                lectureQuizIds[index] = i;
                index++;
            }
        }
        
        return lectureQuizIds;
    }
} 