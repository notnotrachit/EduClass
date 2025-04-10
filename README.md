# EduClass - Blockchain-Powered Education Platform

EduClass is a comprehensive decentralized education platform that leverages blockchain technology to provide secure, transparent, and efficient tools for educational institutions and organizations.

## Features

### Attendance Management
- **Decentralized Verification**: Secure attendance records using blockchain technology
- **QR Code Integration**: Easy attendance marking through QR code scanning
- **Real-Time Updates**: Instant attendance tracking and verification
- **Tamper-Proof Records**: Immutable attendance data stored on the blockchain
- **Analytics Dashboard**: Comprehensive attendance statistics and reporting

### Quiz Module
- **Smart Contract Integration**: Deploy quiz contracts linked to specific classes
- **Interactive Assessments**: Create engaging quizzes with multiple question types
- **Automatic Grading**: Immediate feedback and automatic score calculation
- **Result Analytics**: Track student performance with detailed analytics
- **Time-Bound Quizzes**: Set expiration times for limited-duration assessments

### Notes Sharing System
- **Collaborative Learning**: Share lecture notes among students
- **Version Control**: Track changes and updates to shared notes
- **Access Control**: Manage who can view and edit notes
- **Peer Verification**: Community validation of note quality

### Student Management
- **NFT-Based Enrollment**: Students receive NFT tokens representing their enrollment
- **Role-Based Access**: Separate interfaces for teachers and students
- **Student Profiles**: Comprehensive student tracking and management

## Tech Stack

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Blockchain Network**: Educhain
- **Smart Contracts**: Solidity

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or pnpm
- MetaMask wallet

### Installation

1. Clone the repository
```bash
git clone https://github.com/notnotrachit/educlass.git
cd educlass
```

2. Install dependencies
```bash
npm install
# or
pnpm install
```

3. Start the development server
```bash
npm run dev
# or
pnpm run dev
```

4. Open your browser and visit `http://localhost:8080`

### Connecting to Educhain

1. Install MetaMask browser extension
2. Add Educhain network with these details:
   - Network Name: Educhain
   - RPC URL: https://rpc.open-campus-codex.gelato.digital
   - Chain ID: 65647
   - Currency Symbol: EDU
3. Connect your wallet to the application
4. Select your role (Teacher/Student)

## Usage

### For Teachers

- Create new classes and add students
- Generate attendance QR codes for lectures
- View and download attendance records
- Create and deploy quiz contracts
- Design quizzes with custom questions
- Analyze quiz results and student performance
- Approve and manage shared notes

### For Students

- Scan QR codes to mark attendance
- Check enrolled classes and attendance history
- Participate in quizzes and view results
- Access and contribute to shared notes
- Track personal academic performance

## Project Structure

```
src/
├── components/         # Reusable UI components
├── context/           # React context providers
├── lib/              # Utility functions and blockchain services
├── pages/            # Main application pages
└── styles/           # Global styles and Tailwind config
```
