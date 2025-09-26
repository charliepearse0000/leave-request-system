'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface RoleDistributionChartProps {
  employees: number;
  managers: number;
  admins: number;
}

export default function RoleDistributionChart({ employees, managers, admins }: RoleDistributionChartProps) {
  const chartRef = useRef<ChartJS<'pie'>>(null);

  const data = {
    labels: ['Employees', 'Managers', 'Admins'],
    datasets: [
      {
        data: [employees, managers, admins],
        backgroundColor: [
          '#3B82F6', // Blue for employees
          '#10B981', // Green for managers
          '#8B5CF6', // Purple for admins
        ],
        borderColor: [
          '#2563EB',
          '#059669',
          '#7C3AED',
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          '#60A5FA',
          '#34D399',
          '#A78BFA',
        ],
        hoverBorderColor: [
          '#1D4ED8',
          '#047857',
          '#6D28D9',
        ],
        hoverBorderWidth: 3,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
          color: '#374151', // Gray-700
        },
      },
      tooltip: {
        backgroundColor: '#1F2937', // Gray-800
        titleColor: '#F9FAFB', // Gray-50
        bodyColor: '#F9FAFB', // Gray-50
        borderColor: '#4B5563', // Gray-600
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
    },
    elements: {
      arc: {
        borderJoinStyle: 'round',
      },
    },
  };

  // Update chart colors for dark mode
  useEffect(() => {
    const updateChartColors = () => {
      if (chartRef.current) {
        const isDarkMode = document.documentElement.classList.contains('dark');
        const chart = chartRef.current;
        
        if (chart.options.plugins?.legend?.labels) {
          chart.options.plugins.legend.labels.color = isDarkMode ? '#F3F4F6' : '#374151';
        }
        
        chart.update('none');
      }
    };

    // Initial update
    updateChartColors();

    // Listen for theme changes
    const observer = new MutationObserver(updateChartColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const total = employees + managers + admins;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2 text-sm">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <Pie ref={chartRef} data={data} options={options} />
    </div>
  );
}