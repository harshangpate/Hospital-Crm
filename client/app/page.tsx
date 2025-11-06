'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ParticleBackground from '@/components/ui/ParticleBackground';
import ScrollReveal from '@/components/ui/ScrollReveal';
import Card3D from '@/components/ui/Card3D';
import { 
  fadeInUp, 
  staggerContainer, 
  staggerItem, 
  scaleInBounce,
  float
} from '@/lib/animations';
import {
  Activity,
  Calendar,
  FileText,
  Pill,
  TestTube,
  Users,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  HeartPulse,
  Hospital,
  Shield,
  Clock,
  BarChart3,
  Zap,
  Star,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Patient Management',
    description: 'Complete patient records, history, and care coordination in one place.',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    icon: Calendar,
    title: 'Appointment Scheduling',
    description: 'Smart scheduling system with automated reminders and conflict detection.',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    icon: Stethoscope,
    title: 'Doctor Portal',
    description: 'Comprehensive tools for diagnosis, prescriptions, and patient care.',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    icon: TestTube,
    title: 'Laboratory Management',
    description: 'Digital lab reports, test tracking, and result management.',
    gradient: 'from-orange-500 to-red-600',
  },
  {
    icon: Pill,
    title: 'Pharmacy System',
    description: 'Inventory management, prescriptions, and medication tracking.',
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    icon: DollarSign,
    title: 'Billing & Payments',
    description: 'Automated billing, insurance claims, and payment processing.',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    icon: Hospital,
    title: 'IPD Management',
    description: 'Bed allocation, ward management, and inpatient care tracking.',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Real-time insights, performance metrics, and detailed reporting.',
    gradient: 'from-yellow-500 to-orange-600',
  },
];

const stats = [
  { value: '530+', label: 'Features' },
  { value: '7', label: 'User Roles' },
  { value: '50+', label: 'Modules' },
  { value: '99.9%', label: 'Uptime' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Hospital CRM
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Healthcare Management System</p>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Link href="/login">
              <Button variant="outline" className="border-2">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30">
                Get Started
              </Button>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 lg:py-28 overflow-hidden">
        {/* Animated Particle Background */}
        <ParticleBackground particleCount={30} />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div
              variants={scaleInBounce}
              className="mb-6 inline-block"
            >
              <Badge className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 border-none shadow-lg">
                <motion.div
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="inline-flex items-center"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  530+ Features • Modern Design • Production Ready
                </motion.div>
              </Badge>
            </motion.div>
            
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold mb-6"
            >
              <span className="text-gray-900 dark:text-white">Complete Hospital</span>
              <br />
              <motion.span
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  backgroundSize: '200% auto',
                }}
              >
                Management System
              </motion.span>
            </motion.h1>
            
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              A comprehensive, modern CRM system designed for multi-specialty hospitals
              with{' '}
              <motion.span
                className="font-semibold text-blue-600 dark:text-blue-400"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                530+ features
              </motion.span>{' '}
              covering every aspect of hospital operations.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-2 hover:border-blue-600 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400">
                  Sign In
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
                >
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <ScrollReveal variant="fadeInUp">
          <div className="text-center mb-16">
            <Badge className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 border-none mb-4">
              <Star className="w-4 h-4 mr-1 inline" />
              Core Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Powerful features designed to streamline hospital operations and improve patient care.
            </p>
          </div>
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="group"
            >
              <Card3D
                className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-300"
                intensity={10}
              >
                <motion.div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </motion.div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </Card3D>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto p-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl relative overflow-hidden"
        >
          {/* Animated background circles */}
          <motion.div
            className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          <motion.div
            className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full"
            animate={{
              scale: [1.2, 1, 1.2],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <div className="relative z-10 text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Join hundreds of healthcare facilities using our platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 h-14 bg-white text-blue-600 hover:bg-gray-100 shadow-xl">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-2 border-white text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Hospital CRM
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              &copy; 2025 Hospital CRM. Built with Next.js, TypeScript, and PostgreSQL.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              A comprehensive hospital management system with 530+ features.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
