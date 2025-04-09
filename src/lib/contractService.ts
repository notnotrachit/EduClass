/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import ClassFactory from './contracts/ClassFactory.sol/ClassFactory.json';
import ClassContract from './contracts/ClassContract.sol/ClassContract.json';
// TODO: Update these paths to match the actual locations of the artifacts once available
// The actual paths should be something like:
import QuizContract from './contracts/QuizContract.sol/QuizContract.json';
import QuizContractFactory from './contracts/QuizContractFactory.sol/QuizContractFactory.json';


const CONTRACT_ADDRESS = '0x21f06dEA00f63464733FcEE46E7721b949a4B6B2';
// TODO: Update this with the actual QuizContractFactory address after deployment
const QUIZ_FACTORY_ADDRESS = '0xDEe3817700f5E4BBc3EEf2Ba224597E87468AD52';

export const createClass = async (name: string, symbol: string, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const factoryContract = new ethers.Contract(CONTRACT_ADDRESS, ClassFactory.abi, signer);
    const tx = await factoryContract.createClass(name, symbol);
    await tx.wait();
};

export const getClasses = async (provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const factoryContract = new ethers.Contract(CONTRACT_ADDRESS, ClassFactory.abi, signer);
    return await factoryContract.getClasses();
};

export const mintNFT = async (classAddress: string, studentAddress: string, studentName: string, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const classContract = new ethers.Contract(classAddress, ClassContract.abi, signer);
    const tx = await classContract.mintNFT(studentAddress, studentName);
    await tx.wait();
};

export const createLecture = async (classAddress: string, topic: string, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const classContract = new ethers.Contract(classAddress, ClassContract.abi, signer);
    const tx = await classContract.createLecture(topic);
    await tx.wait();
};

export const markAttendance = async (classAddress: string, lectureId: any, provider: ethers.providers.Web3Provider) => {
    try {
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        // Handle BigNumber lectureId
        const validLectureId = lectureId.hex ? 
            parseInt(lectureId.hex, 16) : // Convert hex to decimal if it's a BigNumber
            Number(lectureId);            // Otherwise try normal number conversion
            
        if (isNaN(validLectureId)) {
            throw new Error('Invalid lecture ID');
        }

        // Sign the attendance data
        const timestamp = Date.now();
        const message = ethers.utils.solidityKeccak256(
            ['address', 'uint256', 'uint256'],
            [address, validLectureId, timestamp]
        );
        const signature = await signer.signMessage(ethers.utils.arrayify(message));

        // Submit to blockchain
        const classContract = new ethers.Contract(classAddress, ClassContract.abi, signer);
        const tx = await classContract.markAttendance(validLectureId);
        await tx.wait();

        // Store attendance data on chain
        const attendanceData = {
            studentAddress: address,
            lectureId: validLectureId,
            timestamp,
            signature
        };

        // Emit the attendance data in an event for transparency
        await classContract.emitAttendanceEvent(
            attendanceData.studentAddress,
            attendanceData.lectureId,
            attendanceData.timestamp,
            attendanceData.signature
        );

    } catch (error) {
        console.error('Error marking attendance:', error);
        throw error;
    }
};

export const getAttendanceRecords = async (classAddress: string, lectureId: number, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const classContract = new ethers.Contract(classAddress, ClassContract.abi, signer);
    return await classContract.getAllAttendance(lectureId);
    // Note: This function returns arrays of addresses and names which don't need conversion
};

export const getOwnAttendance = async (classAddress: string, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const classContract = new ethers.Contract(classAddress, ClassContract.abi, signer);
    const attendance = await classContract.getOwnAttendance();
    // This returns an array of booleans, no conversion needed
    return attendance;
};

export const getLectures = async (classAddress: string, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const classContract = new ethers.Contract(classAddress, ClassContract.abi, signer);
    const lectures = await classContract.getLectures();
    
    // Convert BigNumber values to regular numbers
    return lectures.map((lecture: any) => ({
        id: lecture.id.toNumber(),
        topic: lecture.topic,
        date: lecture.date.toNumber()
    }));
};

export const getEligibleClasses = async (studentAddress: string, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const classFactoryContract = new ethers.Contract(CONTRACT_ADDRESS, ClassFactory.abi, signer);
    const eligibleClasses = await classFactoryContract.getEligibleClasses(studentAddress);
    return eligibleClasses;
};

// Quiz functionality

export const createQuizContract = async (
    ownerAddress: string,
    provider: ethers.providers.Web3Provider
) => {
    const signer = provider.getSigner();
    const quizFactoryContract = new ethers.Contract(QUIZ_FACTORY_ADDRESS, QuizContractFactory.abi, signer);
    const tx = await quizFactoryContract.createQuizContract(ownerAddress);
    const receipt = await tx.wait();
    
    // Find the QuizContractCreated event to get the quiz contract address
    const event = receipt.events?.find((e: any) => e.event === 'QuizContractCreated');
    return event?.args?.quizContractAddress || null;
};

export const getQuizContracts = async (provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const quizFactoryContract = new ethers.Contract(QUIZ_FACTORY_ADDRESS, QuizContractFactory.abi, signer);
    const contracts = await quizFactoryContract.getQuizContracts();
    
    return contracts.map((contract: any) => ({
        contractAddress: contract.contractAddress,
        owner: contract.owner,
        createdAt: contract.createdAt.toNumber()
    }));
};

export const getOwnerQuizContracts = async (
    ownerAddress: string,
    provider: ethers.providers.Web3Provider
) => {
    const signer = provider.getSigner();
    const quizFactoryContract = new ethers.Contract(QUIZ_FACTORY_ADDRESS, QuizContractFactory.abi, signer);
    return await quizFactoryContract.getOwnerQuizContracts(ownerAddress);
};

export const getQuizContractCount = async (provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const quizFactoryContract = new ethers.Contract(QUIZ_FACTORY_ADDRESS, QuizContractFactory.abi, signer);
    const count = await quizFactoryContract.getQuizContractCount();
    return count.toNumber();
};

export const deployQuizContract = async (
    initialOwner: string,
    provider: ethers.providers.Web3Provider
) => {
    return await createQuizContract(initialOwner, provider);
};

export const linkQuizToClass = async (
    classAddress: string,
    quizContractAddress: string,
    provider: ethers.providers.Web3Provider
) => {
    const signer = provider.getSigner();
    const factoryContract = new ethers.Contract(CONTRACT_ADDRESS, ClassFactory.abi, signer);
    const tx = await factoryContract.linkQuizToClass(classAddress, quizContractAddress);
    await tx.wait();
};

export const getClassQuizzes = async (
    classAddress: string,
    provider: ethers.providers.Web3Provider
) => {
    const signer = provider.getSigner();
    const factoryContract = new ethers.Contract(CONTRACT_ADDRESS, ClassFactory.abi, signer);
    return await factoryContract.getClassQuizzes(classAddress);
};

export const createQuiz = async (
    quizContractAddress: string, 
    title: string, 
    description: string, 
    expiresAt: number, 
    lectureId: number, 
    provider: ethers.providers.Web3Provider
) => {
    const signer = provider.getSigner();
    const quizContract = new ethers.Contract(quizContractAddress, QuizContract.abi, signer);
    const tx = await quizContract.createQuiz(title, description, expiresAt, lectureId);
    const receipt = await tx.wait();
    
    // Find the QuizCreated event to get the quiz ID
    const event = receipt.events?.find((e: any) => e.event === 'QuizCreated');
    return event?.args?.quizId.toNumber() || null;
};

export const addQuizQuestion = async (
    quizContractAddress: string,
    quizId: number,
    questionText: string,
    options: string[],
    correctOptionIndex: number,
    provider: ethers.providers.Web3Provider
) => {
    const signer = provider.getSigner();
    const quizContract = new ethers.Contract(quizContractAddress, QuizContract.abi, signer);
    const tx = await quizContract.addQuestion(quizId, questionText, options, correctOptionIndex);
    await tx.wait();
};

export const submitQuizAnswers = async (
    quizContractAddress: string,
    quizId: number,
    selectedOptions: number[],
    provider: ethers.providers.Web3Provider
) => {
    const signer = provider.getSigner();
    const quizContract = new ethers.Contract(quizContractAddress, QuizContract.abi, signer);
    const tx = await quizContract.submitQuiz(quizId, selectedOptions);
    await tx.wait();
};

export const getQuizzes = async (
    quizContractAddress: string,
    provider: ethers.providers.Web3Provider
) => {
    const signer = provider.getSigner();
    const quizContract = new ethers.Contract(quizContractAddress, QuizContract.abi, signer);
    const activeQuizIds = await quizContract.getActiveQuizzes();
    
    // Get details for each quiz
    const quizzes = await Promise.all(
        activeQuizIds.map(async (quizId: any) => {
            try {
                const quizDetails = await quizContract.getQuiz(quizId);
                return {
                    id: quizDetails.id.toNumber ? quizDetails.id.toNumber() : Number(quizDetails.id),
                    title: quizDetails.title,
                    description: quizDetails.description,
                    createdAt: quizDetails.createdAt.toNumber ? quizDetails.createdAt.toNumber() : Number(quizDetails.createdAt),
                    expiresAt: quizDetails.expiresAt.toNumber ? quizDetails.expiresAt.toNumber() : Number(quizDetails.expiresAt),
                    lectureId: quizDetails.lectureId.toNumber ? quizDetails.lectureId.toNumber() : Number(quizDetails.lectureId),
                    isActive: quizDetails.isActive,
                    questionCount: quizDetails.questionCountT.toNumber ? quizDetails.questionCountT.toNumber() : Number(quizDetails.questionCountT)
                };
            } catch (error) {
                console.error("Error processing quiz details:", error);
                return null;
            }
        })
    );
    
    // Filter out any null values from errors
    return quizzes.filter(quiz => quiz !== null);
};

export const getQuizzesByLecture = async (
    quizContractAddress: string,
    lectureId: number,
    provider: ethers.providers.Web3Provider
) => {
    const signer = provider.getSigner();
    const quizContract = new ethers.Contract(quizContractAddress, QuizContract.abi, signer);
    const quizIds = await quizContract.getQuizzesForLecture(lectureId);
    
    // Get details for each quiz
    const quizzes = await Promise.all(
        quizIds.map(async (quizId: any) => {
            try {
                const quizDetails = await quizContract.getQuiz(quizId);
                return {
                    id: quizDetails.id.toNumber ? quizDetails.id.toNumber() : Number(quizDetails.id),
                    title: quizDetails.title,
                    description: quizDetails.description,
                    createdAt: quizDetails.createdAt.toNumber ? quizDetails.createdAt.toNumber() : Number(quizDetails.createdAt),
                    expiresAt: quizDetails.expiresAt.toNumber ? quizDetails.expiresAt.toNumber() : Number(quizDetails.expiresAt),
                    lectureId: quizDetails.lectureId.toNumber ? quizDetails.lectureId.toNumber() : Number(quizDetails.lectureId),
                    isActive: quizDetails.isActive,
                    questionCount: quizDetails.questionCountT.toNumber ? quizDetails.questionCountT.toNumber() : Number(quizDetails.questionCountT)
                };
            } catch (error) {
                console.error("Error processing quiz details:", error);
                return null;
            }
        })
    );
    
    // Filter out any null values from errors
    return quizzes.filter(quiz => quiz !== null);
};

export const getQuizQuestions = async (
    quizContractAddress: string,
    quizId: number,
    provider: ethers.providers.Web3Provider
) => {
    const signer = provider.getSigner();
    const quizContract = new ethers.Contract(quizContractAddress, QuizContract.abi, signer);
    
    // Get question IDs for this quiz
    const questionIds = await quizContract.getQuizQuestions(quizId);
    
    // Get details for each question
    const questions = await Promise.all(
        questionIds.map(async (questionId: any) => {
            try {
                const questionDetails = await quizContract.getQuestion(questionId);
                return {
                    id: questionId.toNumber ? questionId.toNumber() : Number(questionId),
                    text: questionDetails.questionText,
                    options: questionDetails.options
                };
            } catch (error) {
                console.error("Error processing question details:", error);
                return null;
            }
        })
    );
    
    // Filter out any null values from errors
    return questions.filter(question => question !== null);
};

export const getQuizResults = async (
    quizContractAddress: string,
    quizId: number,
    studentAddress: string,
    provider: ethers.providers.Web3Provider
) => {
    const signer = provider.getSigner();
    const quizContract = new ethers.Contract(quizContractAddress, QuizContract.abi, signer);
    
    try {
        const result = await quizContract.getQuizScore(studentAddress, quizId);
        
        return {
            hasAttempted: result.hasAttempted,
            score: result.score.toNumber ? result.score.toNumber() : Number(result.score),
            attemptedAt: result.attemptedAt.toNumber ? result.attemptedAt.toNumber() : Number(result.attemptedAt),
            totalQuestions: result.totalQuestions.toNumber ? result.totalQuestions.toNumber() : Number(result.totalQuestions)
        };
    } catch (error) {
        console.error("Error getting quiz results:", error);
        return {
            hasAttempted: false,
            score: 0,
            attemptedAt: 0,
            totalQuestions: 0
        };
    }
};

export const deactivateQuiz = async (
    quizContractAddress: string,
    quizId: number,
    provider: ethers.providers.Web3Provider
) => {
    const signer = provider.getSigner();
    const quizContract = new ethers.Contract(quizContractAddress, QuizContract.abi, signer);
    const tx = await quizContract.deactivateQuiz(quizId);
    await tx.wait();
};
