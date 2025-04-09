/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import ClassFactory from './contracts/ClassFactory.sol/ClassFactory.json';
import ClassContract from './contracts/ClassContract.sol/ClassContract.json';

const CONTRACT_ADDRESS = '0x5A632EAA2E19543120c6852240cbc8de243226d9';

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
};

export const getOwnAttendance = async (classAddress: string, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const classContract = new ethers.Contract(classAddress, ClassContract.abi, signer);
    return await classContract.getOwnAttendance();
};

export const getLectures = async (classAddress: string, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const classContract = new ethers.Contract(classAddress, ClassContract.abi, signer);
    const lectures = await classContract.getLectures();
    return lectures;
};

export const getEligibleClasses = async (studentAddress: string, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const classFactoryContract = new ethers.Contract(CONTRACT_ADDRESS, ClassFactory.abi, signer);
    const eligibleClasses = await classFactoryContract.getEligibleClasses(studentAddress);
    return eligibleClasses;
};
