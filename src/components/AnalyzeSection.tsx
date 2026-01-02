'use client';

import { CHART_RESAMPLING_POINTS, DEFAULT_CHART_COLORS } from '@/constants';
import { useLaps } from '@/hooks/useLaps';
import { useI18n } from '@/lib/i18n';
import { blendColors, formatLapTime, haversineDistance } from '@/lib/utils';
import type { SavedLap } from '@/types/types';
import {
  Box,
  Button,
  Group,
  Paper,
  Select,
  Skeleton,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  TooltipItem,
} from 'chart.js';
import { BarChart3, Download } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Legend, Tooltip);

// Fixed export dimensions (A4 landscape)
const EXPORT_WIDTH = 1754;
const EXPORT_HEIGHT = 1240;
const EXPORT_PADDING = 60;
const SPEED_CHART_HEIGHT = 700;
const DELTA_CHART_HEIGHT = 350;

interface ProcessedLapData {
  distances: number[];
  speeds: number[];
  times: number[];
}

const processLapData = (lap: SavedLap): ProcessedLapData => {
  const coords = lap.data.geometry.coordinates;
  const timestamps = lap.data.properties.AbsoluteUtcMicroSec;
  const distances: number[] = [0];
  const speeds: number[] = [];
  const times: number[] = [0];
  let cumulativeDistance = 0;

  for (let i = 1; i < coords.length; i++) {
    const dist = haversineDistance(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
    cumulativeDistance += dist;
    distances.push(cumulativeDistance);
    const timeDiff = (timestamps[i] - timestamps[i - 1]) / 1000000;
    times.push((timestamps[i] - timestamps[0]) / 1000000);
    speeds.push(timeDiff > 0 ? (dist / timeDiff) * 3.6 : speeds[speeds.length - 1] || 0);
  }
  speeds.unshift(speeds[0] || 0);
  return { distances, speeds, times };
};

const resampleToDistance = (
  distances: number[],
  values: number[],
  times: number[],
  targetDistances: number[]
): { values: number[]; times: number[] } => {
  const result: number[] = [];
  const resultTimes: number[] = [];

  for (const targetDist of targetDistances) {
    let idx = distances.findIndex((d) => d >= targetDist);
    if (idx === -1) idx = distances.length - 1;
    if (idx === 0) idx = 1;
    const d1 = distances[idx - 1];
    const d2 = distances[idx];
    const ratio = d2 !== d1 ? (targetDist - d1) / (d2 - d1) : 0;
    result.push(values[idx - 1] + ratio * (values[idx] - values[idx - 1]));
    resultTimes.push(times[idx - 1] + ratio * (times[idx] - times[idx - 1]));
  }
  return { values: result, times: resultTimes };
};

const AnalyzeSection: React.FC = () => {
  const { t } = useI18n();
  const { colorScheme } = useMantineColorScheme();
  const { laps, loading } = useLaps();
  const [selectedLap1, setSelectedLap1] = useState<string | null>(null);
  const [selectedLap2, setSelectedLap2] = useState<string | null>(null);

  const [chartColors] = useLocalStorage({
    key: 'telemetry-chart-colors',
    defaultValue: DEFAULT_CHART_COLORS,
  });

  const lap1 = laps.find((l) => l.id === selectedLap1);
  const lap2 = laps.find((l) => l.id === selectedLap2);

  useEffect(() => {
    if (lap1 && lap2 && lap1.trackName !== lap2.trackName) {
      setSelectedLap2(null);
    }
  }, [lap1, lap2]);

  const getLapLabel = (lap: SavedLap, includeTrack: boolean = true) => {
    const name = lap.driverName || '?';
    if (includeTrack) {
      return `${name} - ${lap.trackName} L${lap.lapNumber} (${formatLapTime(lap.lapTime)})`;
    }
    return `${name} - L${lap.lapNumber} (${formatLapTime(lap.lapTime)})`;
  };

  const getLap2Options = () => {
    if (!lap1) return laps.filter((l) => l.id !== selectedLap1);
    return laps.filter((l) => l.id !== selectedLap1 && l.trackName === lap1.trackName);
  };

  // Process chart data
  const chartData = useMemo(() => {
    if (!lap1 || !lap2) return [];

    const data1 = processLapData(lap1);
    const data2 = processLapData(lap2);
    const maxDist1 = data1.distances[data1.distances.length - 1] ?? 0;
    const maxDist2 = data2.distances[data2.distances.length - 1] ?? 0;
    const maxDist = Math.min(maxDist1, maxDist2);
    const commonDistances = Array.from(
      { length: CHART_RESAMPLING_POINTS },
      (_, i) => (i / (CHART_RESAMPLING_POINTS - 1)) * maxDist
    );
    const r1 = resampleToDistance(data1.distances, data1.speeds, data1.times, commonDistances);
    const r2 = resampleToDistance(data2.distances, data2.speeds, data2.times, commonDistances);
    const deltaTimes = commonDistances.map((_, i) => r2.times[i] - r1.times[i]);

    const processedData = commonDistances.map((d, i) => ({
      distance: Math.round(d),
      speed1: parseFloat(r1.values[i].toFixed(1)),
      speed2: parseFloat(r2.values[i].toFixed(1)),
      delta: parseFloat(deltaTimes[i].toFixed(3)),
    }));

    return processedData;
  }, [lap1, lap2]);

  const isDark = colorScheme === 'dark';
  const gridColor = isDark ? '#373A40' : '#e5e7eb';
  const textColor = isDark ? '#909296' : '#6b7280';
  const bgColor = isDark ? '#1A1B1E' : '#ffffff';
  const tooltipBgColor = isDark ? '#1A1B1E' : '#ffffff';

  const chartFont = {
    family: '"Barlow Semi Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    size: 14,
    weight: 600 as const,
  };

  const tickFont = {
    family: '"Barlow Semi Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    size: 13,
    weight: 600 as const,
  };



  // Speed chart configuration
  const speedChartData = useMemo(
    () => ({
      labels: chartData.map((d) => d.distance),
      datasets: [
        {
          label: lap1?.driverName || t.analyze.driver1,
          data: chartData.map((d) => d.speed1),
          borderColor: chartColors.driver1,
          backgroundColor: chartColors.driver1 + '20',
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: chartColors.driver1,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          tension: 0.3,
          fill: false,
          borderCapStyle: 'round' as const,
          borderJoinStyle: 'round' as const,
        },
        {
          label: lap2?.driverName || t.analyze.driver2,
          data: chartData.map((d) => d.speed2),
          borderColor: chartColors.driver2,
          backgroundColor: chartColors.driver2 + '20',
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: chartColors.driver2,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          tension: 0.3,
          fill: false,
          borderCapStyle: 'round' as const,
          borderJoinStyle: 'round' as const,
        },
      ],
    }),
    [chartData, chartColors, lap1, lap2, t]
  );

  // Delta chart configuration
  const deltaChartData = useMemo(
    () => ({
      labels: chartData.map((d) => d.distance),
      datasets: [
        {
          label: t.analyze.delta,
          data: chartData.map((d) => d.delta),
          borderColor: isDark ? '#a1a1aa' : '#52525b',
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.4,
          fill: true,
      backgroundColor: (context: { chart: ChartJS }) => {
            const chart = context.chart;
            const { ctx, chartArea, scales } = chart;
            if (!chartArea) return 'rgba(34, 197, 94, 0.6)';

            const yAxis = scales.y;
            if (!yAxis) return 'rgba(34, 197, 94, 0.6)';

            // Calculate zero position relative to chart area
            const zeroPixel = yAxis.getPixelForValue(0);
            const chartHeight = chartArea.bottom - chartArea.top;
            let offset = (zeroPixel - chartArea.top) / chartHeight;

            // Clamp offset
            offset = Math.max(0, Math.min(1, offset));

            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.6)'); // Red at top (positive delta)
            gradient.addColorStop(offset, 'rgba(239, 68, 68, 0.6)');
            gradient.addColorStop(offset, 'rgba(34, 197, 94, 0.6)'); // Green at bottom (negative delta)
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0.6)');
            return gradient;
          },
        },
      ],
    }),
    [chartData, isDark, t]
  );

  // Generate ticks every 50 meters
  const maxDistance = chartData.length > 0 ? chartData[chartData.length - 1].distance : 0;
  const xTicks = Array.from({ length: Math.floor(maxDistance / 50) + 1 }, (_, i) => i * 50);

  // Speed chart options
  const speedChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          align: 'end' as const,
          onClick: () => {},
          labels: {
            color: textColor,
            font: { family: '"Barlow Semi Condensed", sans-serif', size: 14, weight: 500 as const },
            usePointStyle: true,
            pointStyle: 'line',
            pointStyleWidth: 24,
            padding: 16,
            boxHeight: 8,
          },
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(26, 27, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          displayColors: true,
          usePointStyle: true,
          boxPadding: 6,
          titleFont: { family: '"Barlow Semi Condensed", sans-serif', size: 13, weight: 600 as const },
          bodyFont: { family: '"Barlow Semi Condensed", sans-serif', size: 13, weight: 500 as const },
          callbacks: {
            title: (items: TooltipItem<'line'>[]) => items[0] ? `${items[0].label}m` : '',
            label: (context: TooltipItem<'line'>) => ` ${context.dataset.label}: ${context.parsed.y} km/h`,
            labelColor: (context: TooltipItem<'line'>) => ({
              borderColor: context.dataset.borderColor as string,
              backgroundColor: blendColors(context.dataset.borderColor as string, tooltipBgColor, 0.2),
            }),
          },
        },
      },
      scales: {
        x: {
          type: 'linear' as const,
          title: {
            display: true,
            text: t.analyze.distanceUnit,
            color: textColor,
            font: chartFont,
          },
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            color: textColor,
            font: tickFont,
            callback: (value: number | string) => {
              const numValue = typeof value === 'string' ? parseFloat(value) : value;
              return xTicks.includes(numValue) ? numValue : null;
            },
          },
          min: 0,
          max: maxDistance,
        },
        y: {
          title: {
            display: true,
            text: t.analyze.speedUnit,
            color: textColor,
            font: chartFont,
          },
          grid: {
            color: gridColor,
            drawTicks: false,
          },
          border: {
            display: false,
            dash: [3, 3],
          },
          ticks: {
            color: textColor,
            font: tickFont,
          },
        },
      },
    }),
    [isDark, gridColor, textColor, t, xTicks, maxDistance]
  );

  // Delta chart options
  const deltaChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(26, 27, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          displayColors: false,
          titleFont: { family: '"Barlow Semi Condensed", sans-serif', size: 13, weight: 600 as const },
          bodyFont: { family: '"Barlow Semi Condensed", sans-serif', size: 13, weight: 500 as const },
          callbacks: {
            title: (items: TooltipItem<'line'>[]) => items[0] ? `${items[0].label}m` : '',
            label: (context: TooltipItem<'line'>) => ` Δ ${(context.parsed.y ?? 0) > 0 ? '+' : ''}${(context.parsed.y ?? 0).toFixed(2)}s`,
          },
        },
      },
      scales: {
        x: {
          type: 'linear' as const,
          display: false,
          min: 0,
          max: maxDistance,
        },
        y: {
          title: {
            display: true,
            text: t.analyze.deltaTime,
            color: textColor,
            font: chartFont,
          },
          grid: {
            color: gridColor,
            drawTicks: false,
          },
          border: {
            display: false,
            dash: [3, 3],
          },
          ticks: {
            color: textColor,
            font: tickFont,
          },
        },
      },
    }),
    [isDark, gridColor, textColor, t, maxDistance]
  );

  // Export as PNG with fixed dimensions
  const exportPng = async () => {
    if (!lap1 || !lap2 || chartData.length === 0) return;

    try {
      // Create an off-screen canvas for the combined export
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = EXPORT_WIDTH;
      exportCanvas.height = EXPORT_HEIGHT;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      // Fill background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

      // Create temporary canvases for each chart with fixed dimensions
      const speedCanvas = document.createElement('canvas');
      speedCanvas.width = EXPORT_WIDTH - EXPORT_PADDING * 2;
      speedCanvas.height = SPEED_CHART_HEIGHT;

      const deltaCanvas = document.createElement('canvas');
      deltaCanvas.width = EXPORT_WIDTH - EXPORT_PADDING * 2;
      deltaCanvas.height = DELTA_CHART_HEIGHT;

      // Create speed chart for export
      const speedChart = new ChartJS(speedCanvas, {
        type: 'line',
        data: {
          labels: chartData.map((d) => d.distance),
          datasets: [
            {
              label: lap1?.driverName || t.analyze.driver1,
              data: chartData.map((d) => d.speed1),
              borderColor: chartColors.driver1,
              backgroundColor: chartColors.driver1 + '20',
              borderWidth: 2.5,
              pointRadius: 0,
              tension: 0.3,
              fill: false,
              borderCapStyle: 'round' as const,
              borderJoinStyle: 'round' as const,
            },
            {
              label: lap2?.driverName || t.analyze.driver2,
              data: chartData.map((d) => d.speed2),
              borderColor: chartColors.driver2,
              backgroundColor: chartColors.driver2 + '20',
              borderWidth: 2.5,
              pointRadius: 0,
              tension: 0.3,
              fill: false,
              borderCapStyle: 'round' as const,
              borderJoinStyle: 'round' as const,
            },
          ],
        },
        options: {
          responsive: false,
          animation: false,
          devicePixelRatio: 1,
          plugins: {
            legend: {
              position: 'top' as const,
              align: 'end' as const,
              labels: {
                color: textColor,
                font: { family: '"Barlow Semi Condensed", sans-serif', size: 14, weight: 500 },
                usePointStyle: true,
                pointStyle: 'line',
                pointStyleWidth: 24,
                padding: 16,
                boxHeight: 8,
              },
            },
          },
          scales: {
            x: {
              type: 'linear' as const,
              title: {
                display: true,
                text: t.analyze.distanceUnit,
                color: textColor,
                font: { family: '"Barlow Semi Condensed", sans-serif', size: 14, weight: 600 },
              },
              grid: { display: false },
              border: { display: false },
              ticks: {
                color: textColor,
                font: { family: '"Barlow Semi Condensed", sans-serif', size: 13, weight: 600 },
                callback: (value: number | string) => {
                  const numValue = typeof value === 'string' ? parseFloat(value) : value;
                  return xTicks.includes(numValue) ? numValue : null;
                },
              },
              min: 0,
              max: maxDistance,
            },
            y: {
              title: {
                display: true,
                text: t.analyze.speedUnit,
                color: textColor,
                font: { family: '"Barlow Semi Condensed", sans-serif', size: 14, weight: 600 },
              },
              grid: { color: gridColor, drawTicks: false },
              border: { display: false },
              ticks: { color: textColor, font: { family: '"Barlow Semi Condensed", sans-serif', size: 13, weight: 600 } },
            },
          },
        },
      });

      // Create delta chart for export
      const deltaChart = new ChartJS(deltaCanvas, {
        type: 'line',
        data: {
          labels: chartData.map((d) => d.distance),
          datasets: [
            {
              label: t.analyze.delta,
              data: chartData.map((d) => d.delta),
              borderColor: isDark ? '#a1a1aa' : '#52525b',
              borderWidth: 1,
              pointRadius: 0,
              tension: 0.4,
              fill: true,
              backgroundColor: (context: { chart: ChartJS }) => {
                const chart = context.chart;
                const { ctx, chartArea, scales } = chart;
                if (!chartArea) return 'rgba(34, 197, 94, 0.6)';
    
                const yAxis = scales.y;
                if (!yAxis) return 'rgba(34, 197, 94, 0.6)';
    
                // Calculate zero position relative to chart area
                const zeroPixel = yAxis.getPixelForValue(0);
                const chartHeight = chartArea.bottom - chartArea.top;
                let offset = (zeroPixel - chartArea.top) / chartHeight;
    
                // Clamp offset
                offset = Math.max(0, Math.min(1, offset));
    
                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.6)'); // Red at top (positive delta)
                gradient.addColorStop(offset, 'rgba(239, 68, 68, 0.6)');
                gradient.addColorStop(offset, 'rgba(34, 197, 94, 0.6)'); // Green at bottom (negative delta)
                gradient.addColorStop(1, 'rgba(34, 197, 94, 0.6)');
                return gradient;
              },
            },
          ],
        },
        options: {
          responsive: false,
          animation: false,
          devicePixelRatio: 1,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              type: 'linear' as const,
              display: false,
              min: 0,
              max: maxDistance,
            },
            y: {
              title: {
                display: true,
                text: t.analyze.deltaTime,
                color: textColor,
                font: { family: '"Barlow Semi Condensed", sans-serif', size: 14, weight: 600 },
              },
              grid: { color: gridColor, drawTicks: false },
              border: { display: false },
              ticks: { color: textColor, font: { family: '"Barlow Semi Condensed", sans-serif', size: 13, weight: 600 } },
            },
          },
        },
      });

      // Wait for charts to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Draw speed chart onto export canvas
      ctx.drawImage(speedCanvas, EXPORT_PADDING, EXPORT_PADDING, EXPORT_WIDTH - EXPORT_PADDING * 2, SPEED_CHART_HEIGHT);

      // Draw separator line
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(EXPORT_PADDING, EXPORT_PADDING + SPEED_CHART_HEIGHT + 15);
      ctx.lineTo(EXPORT_WIDTH - EXPORT_PADDING, EXPORT_PADDING + SPEED_CHART_HEIGHT + 15);
      ctx.stroke();

      // Draw delta chart onto export canvas
      ctx.drawImage(deltaCanvas, EXPORT_PADDING, EXPORT_PADDING + SPEED_CHART_HEIGHT + 30, EXPORT_WIDTH - EXPORT_PADDING * 2, DELTA_CHART_HEIGHT);

      // Clean up temporary charts
      speedChart.destroy();
      deltaChart.destroy();

      // Export
      const link = document.createElement('a');
      link.download = `telemetry_${lap1.driverName || 'driver1'}_vs_${lap2.driverName || 'driver2'}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    }
  };

  if (loading) {
    return (
      <Box p={{ base: 'md', sm: 'lg' }} maw={900} w="100%" mx="auto">
        <Stack gap="md">
          <Box>
            <Skeleton height={32} width={150} mb="xs" />
            <Skeleton height={16} width={200} />
          </Box>
          <Group align="flex-end" wrap="wrap">
            <Box w={{ base: '100%', sm: 280 }} maw={350}>
              <Skeleton height={20} width={100} mb={6} /> {/* Label */}
              <Skeleton height={36} width="100%" radius="sm" /> {/* Input */}
            </Box>
             <Box w={{ base: '100%', sm: 280 }} maw={350}>
              <Skeleton height={20} width={100} mb={6} />
              <Skeleton height={36} width="100%" radius="sm" />
            </Box>
          </Group>
        </Stack>
      </Box>
    );
  }

  return (
    <Box p={{ base: 'md', sm: 'lg' }} maw={900} w="100%" mx="auto" style={{ overflowX: 'hidden' }}>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Box>
            <Title order={2}>{t.analyze.title}</Title>
            <Text c="dimmed" size="sm">
              {t.analyze.subtitle}
            </Text>
          </Box>
          {chartData.length > 0 && (
            <Button leftSection={<Download size={16} />} onClick={exportPng}>
              {t.common.download}
            </Button>
          )}
        </Group>

        {laps.length < 2 ? (
          <Paper withBorder ta="center" py="xl">
            <BarChart3 size={48} style={{ opacity: 0.5 }} />
            <Text fw={600} mt="xs">
              {t.analyze.needTwoLaps}
            </Text>
          </Paper>
        ) : (
          <Group align="flex-end" wrap="wrap">
            <Select
              label={t.analyze.lap1Label}
              placeholder={t.analyze.selectPlaceholder}
              data={laps
                .filter((l) => l.id !== selectedLap2)
                .map((l) => ({ value: l.id, label: getLapLabel(l, true) }))}
              value={selectedLap1}
              onChange={setSelectedLap1}
              size="sm"
              w={{ base: '100%', sm: 280 }}
              maw={350}
            />
            <Select
              label={t.analyze.lap2Label}
              placeholder={t.analyze.selectPlaceholder}
              data={getLap2Options().map((l) => ({ value: l.id, label: getLapLabel(l, !lap1) }))}
              value={selectedLap2}
              onChange={setSelectedLap2}
              size="sm"
              w={{ base: '100%', sm: 280 }}
              maw={350}
              disabled={!lap1}
            />
          </Group>
        )}

        {chartData.length > 0 && lap1 && lap2 && (
          <Paper p="xs" withBorder>
            <Stack gap={0}>
              <Box p={{ base: 'xs', sm: 'md' }} pb="xl" h={{ base: 250, sm: 400 }}>
                <Line data={speedChartData} options={speedChartOptions} />
              </Box>

              <Box p={{ base: 'xs', sm: 'md' }} h={{ base: 150, sm: 200 }} style={{ borderTop: `1px solid ${gridColor}` }}>
                <Line data={deltaChartData} options={deltaChartOptions} />
              </Box>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
};

export default AnalyzeSection;
