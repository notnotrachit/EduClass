import React, { useState } from 'react';
import TeacherDashboard from '@/pages/TeacherDashboard';
import StudentDashboard from '@/pages/StudentDashboard';
import { Button } from '@/components/ui/button';
import { useWalletContext } from '@/context/WalletContext';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, Shield, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export function DashboardRouter() {
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
  const { isConnected, address, connectWallet } = useWalletContext();

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold mb-6">Welcome to EduClass</h1>
            <p className="text-xl mb-8">Smart attendance tracking powered by blockchain</p>
            <Button
              onClick={connectWallet}
              className="bg-white text-indigo-600 hover:bg-indigo-100 transition-colors duration-300 text-lg py-2 px-6 rounded-full shadow-lg hover:shadow-xl"
            >
              Connect Wallet
            </Button>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img
                src="https://akriviahcm.com/blog/wp-content/uploads/2024/03/Features-of-time-and-attendance-system.jpg"
                alt="Digital Attendance"
                className="rounded-lg shadow-2xl"
              />
            </motion.div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-3xl font-bold mb-6">Features</h2>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-green-400" />
                  Decentralized attendance verification
                </li>
                <li className="flex items-center">
                  <Clock className="mr-2 text-green-400" />
                  Quick and efficient roll calls
                </li>
                <li className="flex items-center">
                  <Shield className="mr-2 text-green-400" />
                  Tamper-proof attendance records
                </li>
                <li className="flex items-center">
                  <TrendingUp className="mr-2 text-green-400" />
                  Comprehensive attendance analytics
                </li>
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                <BookOpen className="text-4xl mb-4" />
                <h3 className="text-xl font-semibold mb-2">For Teachers</h3>
                <p>Create and manage attendance sessions with ease</p>
              </div>
              <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                <GraduationCap className="text-4xl mb-4" />
                <h3 className="text-xl font-semibold mb-2">For Students</h3>
                <p>Mark attendance securely using QR codes</p>
              </div>
              <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                <Shield className="text-4xl mb-4" />
                <h3 className="text-xl font-semibold mb-2">Blockchain Security</h3>
                <p>Immutable and transparent attendance records</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold mb-6">Select your role</h2>
          <p className="mb-6 text-lg bg-white/20 py-2 px-4 rounded-full inline-block">
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => setUserRole('teacher')}
              className="w-64 bg-green-500 hover:bg-green-600 text-white transition-colors duration-300 text-lg py-3 rounded-lg shadow-md hover:shadow-lg flex items-center justify-center"
            >
              <BookOpen className="mr-2" /> I'm a Teacher
            </Button>
            <Button
              onClick={() => setUserRole('student')}
              className="w-64 bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-300 text-lg py-3 rounded-lg shadow-md hover:shadow-lg flex items-center justify-center"
            >
              <GraduationCap className="mr-2" /> I'm a Student
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {userRole === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />}
      <Button
        onClick={() => setUserRole(null)}
        variant="outline"
        className="fixed bottom-4 right-4 bg-white/80 hover:bg-white text-indigo-600 border-indigo-400 hover:border-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg"
      >
        Switch Role
      </Button>
    </div>
  );
}

export default DashboardRouter;
