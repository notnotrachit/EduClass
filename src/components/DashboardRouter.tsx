import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/context/WalletContext";
import {
  BookOpen,
  GraduationCap,
  Shield,
  CheckCircle,
  Clock,
  TrendingUp,
  BrainCircuit,
  FileText,
  Activity,
  ChevronRight,
} from "lucide-react";
import TeacherDashboard from "@/pages/TeacherDashboard";
import StudentDashboard from "@/pages/StudentDashboard";

export function DashboardRouter() {
  const [userRole, setUserRole] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const { isConnected, address, connectWallet } = useWalletContext();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isConnected) {
    return <HomePage connectWallet={connectWallet} scrolled={scrolled} />;
  }

  if (!userRole) {
    return <RoleSelector address={address} setUserRole={setUserRole} />;
  }

  return (
    <div>
      {userRole === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
      <Button
        onClick={() => setUserRole(null)}
        variant="outline"
        className="fixed bottom-4 right-4 bg-white/90 hover:bg-white text-indigo-600 border-indigo-400 hover:border-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg z-50"
      >
        Switch Role
      </Button>
    </div>
  );
}

const HomePage = ({ connectWallet, scrolled }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-700 text-white overflow-hidden">
      {/* Header */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-indigo-900/90 backdrop-blur-md py-2 shadow-lg"
            : "bg-transparent py-4"
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 rounded-lg p-2">
              <BrainCircuit className="text-white" size={24} />
            </div>
            <h1 className="font-bold text-2xl">EduClass</h1>
          </div>
          <Button
            onClick={connectWallet}
            className="bg-white text-indigo-700 hover:bg-indigo-100 transition-colors duration-300 rounded-full shadow-lg hover:shadow-xl"
          >
            Connect Wallet
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 container mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-block bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium">
              Empowering Education 🚀
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Smart Education <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-blue-400">
                Powered by Blockchain
              </span>
            </h1>
            <p className="text-xl text-white/80">
              Transforming classrooms with AI-driven quizzes, secure attendance
              tracking, and collaborative note sharing.
            </p>
            <div className="flex gap-4 pt-4">
              <Button
                onClick={connectWallet}
                className="bg-white text-indigo-700 hover:bg-indigo-100 transition-colors duration-300 text-lg py-3 px-6 rounded-full shadow-lg hover:shadow-xl font-medium"
              >
                Get Started <ChevronRight className="ml-2" size={18} />
              </Button>
              <Button
                variant="outline"
                className="text-black border-white/30 hover:bg-white/10 transition-colors duration-300 text-lg py-3 px-6 rounded-full"
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl rotate-3 scale-105 opacity-30 blur-lg"></div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/20 z-20">
              <img
                src="https://www.educatorstechnology.com/wp-content/webp-express/webp-images/uploads/2024/05/top-educational-ai-tools-1024x535.png.webp"
                alt="Smart Classroom"
                className="rounded-md shadow-2xl relative z-10 border border-gray-800"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Smart Features for Modern Education
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Our platform combines the security of blockchain with intuitive
            tools teachers and students need
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<BookOpen size={32} className="text-indigo-300" />}
            title="Smart Attendance"
            description="Blockchain-secured attendance tracking with QR codes. No more paper sheets or proxy issues."
            color="from-blue-500/20 to-indigo-500/20"
          />
          <FeatureCard
            icon={<BrainCircuit size={32} className="text-pink-300" />}
            title="AI-Powered Quizzes"
            description="Generate relevant quizzes instantly and analyze student performance with AI assistance."
            color="from-pink-500/20 to-purple-500/20"
            highlighted
          />
          <FeatureCard
            icon={<FileText size={32} className="text-green-300" />}
            title="Collaborative Notes"
            description="Share lecture notes seamlessly among students with version tracking and access control."
            color="from-green-500/20 to-teal-500/20"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How EduClass Works</h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            A seamless experience for both teachers and students
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-5 bg-gradient-to-br from-indigo-800/50 to-purple-800/50 rounded-xl p-6 backdrop-blur-md border border-white/10">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <GraduationCap className="text-purple-300" />
              For Teachers
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="bg-white/10 rounded-full p-1 mt-1">
                  <CheckCircle size={16} className="text-green-400" />
                </div>
                <p>Create classes and add lectures with detailed information</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-white/10 rounded-full p-1 mt-1">
                  <CheckCircle size={16} className="text-green-400" />
                </div>
                <p>Generate QR codes for secure attendance verification</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-white/10 rounded-full p-1 mt-1">
                  <CheckCircle size={16} className="text-green-400" />
                </div>
                <p>Create AI-powered quizzes with automatic grading</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-white/10 rounded-full p-1 mt-1">
                  <CheckCircle size={16} className="text-green-400" />
                </div>
                <p>Access comprehensive analytics on student performance</p>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 flex justify-center">
            <div className="h-full w-px bg-gradient-to-b from-transparent via-white/30 to-transparent relative">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full w-10 h-10 bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Shield className="text-white" size={20} />
              </div>
            </div>
          </div>

          <div className="md:col-span-5 bg-gradient-to-br from-blue-800/50 to-indigo-800/50 rounded-xl p-6 backdrop-blur-md border border-white/10">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="text-blue-300" />
              For Students
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="bg-white/10 rounded-full p-1 mt-1">
                  <CheckCircle size={16} className="text-green-400" />
                </div>
                <p>Mark attendance by scanning class-specific QR codes</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-white/10 rounded-full p-1 mt-1">
                  <CheckCircle size={16} className="text-green-400" />
                </div>
                <p>Participate in interactive quizzes during lectures</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-white/10 rounded-full p-1 mt-1">
                  <CheckCircle size={16} className="text-green-400" />
                </div>
                <p>Access and share lecture notes with classmates</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-white/10 rounded-full p-1 mt-1">
                  <CheckCircle size={16} className="text-green-400" />
                </div>
                <p>Track personal attendance and performance statistics</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard
            number="100%"
            label="Attendance Accuracy"
            icon={<CheckCircle className="text-green-400" />}
          />
          <StatCard
            number="5x"
            label="Faster Roll Calls"
            icon={<Clock className="text-blue-400" />}
          />
          <StatCard
            number="24/7"
            label="Access to Materials"
            icon={<FileText className="text-purple-400" />}
          />
          <StatCard
            number="100%"
            label="Blockchain Security"
            icon={<Shield className="text-amber-400" />}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 container mx-auto">
        <div className="bg-gradient-to-r from-indigo-600/40 to-purple-600/40 rounded-2xl p-8 backdrop-blur-md border border-white/10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/5 opacity-30"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Classroom?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Join EduClass today and experience the future of education with
              blockchain technology.
            </p>
            <Button
              onClick={connectWallet}
              className="bg-white text-indigo-700 hover:bg-indigo-100 transition-colors duration-300 text-lg py-3 px-8 rounded-full shadow-lg hover:shadow-xl font-medium"
            >
              Connect Wallet and Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 container mx-auto border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-white/10 rounded-lg p-2">
              <BrainCircuit className="text-white" size={20} />
            </div>
            <h1 className="font-bold text-xl">EduClass</h1>
          </div>
          <p className="text-white/60 text-sm">
            © 2025 EduClass · Hackathon Project · All rights reserved
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="text-white/60 hover:text-white transition-colors"
            >
              About
            </a>
            <a
              href="#"
              className="text-white/60 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#"
              className="text-white/60 hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
  color,
  highlighted = false,
}) => {
  return (
    <div
      className={`relative group transition-all duration-300 rounded-xl p-6 h-full ${
        highlighted ? "transform hover:-translate-y-2" : "hover:-translate-y-1"
      }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${color} rounded-xl opacity-80 backdrop-blur-md border border-white/10 -z-10`}
      ></div>
      {highlighted && (
        <div className="absolute -inset-px bg-gradient-to-r from-pink-500 to-indigo-500 rounded-xl opacity-70 blur -z-20"></div>
      )}
      <div className="bg-white/10 rounded-2xl p-3 inline-block mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-white/70">{description}</p>
    </div>
  );
};

const StatCard = ({ number, label, icon }) => {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <div className="text-3xl font-bold mb-1">{number}</div>
      <div className="text-white/70 text-sm">{label}</div>
    </div>
  );
};

const RoleSelector = ({ address, setUserRole }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-700 text-white">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-white/10 rounded-full p-4 inline-flex mb-4">
            <BrainCircuit className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold mb-2">Welcome to EduClass</h2>
          <p className="text-white/70">Please select your role to continue</p>
          <div className="mt-4 py-2 px-4 bg-white/10 rounded-full text-sm inline-block">
            Wallet: {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => setUserRole("teacher")}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 py-4 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-3 group"
          >
            <div className="bg-white/20 rounded-full p-2 group-hover:bg-white/30 transition-colors">
              <GraduationCap size={24} />
            </div>
            <span className="font-medium text-lg">I'm a Teacher</span>
          </button>
          <button
            onClick={() => setUserRole("student")}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white transition-all duration-300 py-4 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-3 group"
          >
            <div className="bg-white/20 rounded-full p-2 group-hover:bg-white/30 transition-colors">
              <BookOpen size={24} />
            </div>
            <span className="font-medium text-lg">I'm a Student</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardRouter;
