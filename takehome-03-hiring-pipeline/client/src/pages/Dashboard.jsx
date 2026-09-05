import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboard.service';
import { Users, Briefcase, Calendar, UserCheck } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Dashboard Components
import StatCard from '../components/dashboard/StatCard';
import StageChart from '../components/dashboard/StageChart';
import WeeklyTrendsChart from '../components/dashboard/WeeklyTrendsChart';
import JobBreakdownTable from '../components/dashboard/JobBreakdownTable';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await dashboardService.getDashboardStats();
        setStats(response.data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (!stats) {
    return <div className="text-red-500 text-center p-8 bg-red-50 rounded-lg">Failed to load dashboard data.</div>;
  }

  const { 
    headline, 
    applicationsByJob, 
    applicationsByStage, 
    weeklyApplications 
  } = stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your hiring pipeline</p>
      </div>

      {/* Headline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Open Positions" value={headline.openPositions} icon={Briefcase} colorClass="bg-blue-500" />
        <StatCard title="Active Applications" value={headline.activeApplications} icon={Users} colorClass="bg-indigo-500" />
        <StatCard title="Interviews This Week" value={headline.interviewsThisWeek} icon={Calendar} colorClass="bg-purple-500" />
        <StatCard title="Hires This Month" value={headline.hiresThisMonth} icon={UserCheck} colorClass="bg-emerald-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <StageChart data={applicationsByStage} />
        <WeeklyTrendsChart data={weeklyApplications} />
      </div>
      
      {/* Table */}
      <JobBreakdownTable data={applicationsByJob} />
    </div>
  );
};

export default Dashboard;
