import { DEFAULT_CHART_COLORS, SUPPORTED_LOCALES } from '@/constants';
import { clearAllLaps, getAllLaps, importLaps } from '@/lib/db';
import { localeNames, useI18n, type Locale } from '@/lib/i18n';
import { downloadFile } from '@/lib/utils';
import type { SavedLap } from '@/types/types';
import {
    Box,
    Button,
    ColorInput,
    Divider,
    Group,
    Modal,
    Paper,
    Select,
    Stack,
    Text,
    Title,
    useMantineColorScheme
} from '@mantine/core';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { ArrowDownToLine, ArrowUpFromLine, Trash2 } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface ImportData {
  version?: number;
  laps?: SavedLap[];
  settings?: {
    chartColors?: { driver1: string; driver2: string };
    colorScheme?: string;
    locale?: string;
  };
}

const SettingsSection: React.FC = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { locale, setLocale, t } = useI18n();
  const [clearing, setClearing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmModalOpened, { open: openConfirmModal, close: closeConfirmModal }] =
    useDisclosure(false);
  const [importModalOpened, { open: openImportModal, close: closeImportModal }] =
    useDisclosure(false);
  const [importData, setImportData] = useState<ImportData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chartColors, setChartColors] = useLocalStorage({
    key: 'telemetry-chart-colors',
    defaultValue: DEFAULT_CHART_COLORS,
  });

  const handleClearData = async () => {
    setClearing(true);
    try {
      await clearAllLaps();
      notifications.show({
        title: t.common.success,
        message: t.settings.dataCleared,
        color: 'green',
      });
      closeConfirmModal();
    } catch (err) {
      console.error(err);
      notifications.show({
        title: t.common.error,
        message: t.settings.clearFailed,
        color: 'red',
      });
    }
    setClearing(false);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const laps = await getAllLaps();
      const settings = {
        chartColors: JSON.parse(localStorage.getItem('telemetry-chart-colors') || 'null'),
        colorScheme: localStorage.getItem('mantine-color-scheme-value'),
        locale: localStorage.getItem('telemetry-locale'),
      };
      
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        laps,
        settings,
      };

      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(exportData, `kart-telemetry-backup-${dateStr}.json`);
      notifications.show({
        title: t.common.success,
        message: t.settings.exportSuccess,
        color: 'green',
      });
    } catch (err) {
      console.error('Export failed:', err);
      notifications.show({
        title: t.common.error,
        message: 'Failed to export data',
        color: 'red',
      });
    }
    setExporting(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setImportData(json);
        openImportModal();
      } catch (err) {
        console.error('Invalid JSON:', err);
        notifications.show({
          title: t.common.error,
          message: t.settings.importError,
          color: 'red',
        });
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleImportData = async () => {
    if (!importData) return;
    
    closeImportModal();
    setImporting(true);
    try {
      // 1. Clear existing laps
      await clearAllLaps();

      // 2. Import laps if present
      if (importData.laps && Array.isArray(importData.laps)) {
        await importLaps(importData.laps);
      }

      // 3. Restore settings
      if (importData.settings) {
        if (importData.settings.chartColors) {
          localStorage.setItem('telemetry-chart-colors', JSON.stringify(importData.settings.chartColors));
        }
        if (importData.settings.colorScheme) {
          localStorage.setItem('mantine-color-scheme-value', importData.settings.colorScheme);
        }
        if (importData.settings.locale) {
          localStorage.setItem('telemetry-locale', importData.settings.locale);
        }
      }

      notifications.show({
        title: t.common.success,
        message: t.settings.importSuccess,
        color: 'green',
      });
      
      // Short delay to show success before reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Import failed:', err);
      notifications.show({
        title: t.common.error,
        message: t.settings.importError,
        color: 'red',
      });
      setImporting(false);
    }
  };

  const languageOptions = SUPPORTED_LOCALES.map((loc) => ({
    value: loc,
    label: localeNames[loc],
  }));

  const themeOptions = [
    { value: 'dark', label: t.settings.themeDark },
    { value: 'light', label: t.settings.themeLight },
  ];

  return (
    <Box p="lg" maw={900} w="100%" mx="auto">
      <Stack gap="md">
        <Box>
          <Title order={2}>{t.settings.title}</Title>
          <Text c="dimmed" size="sm">
            {t.settings.subtitle}
          </Text>
        </Box>

        <Paper withBorder p="md">
          <Stack gap="md">
            {/* Theme Setting */}
            <Group justify="space-between" align="center">
              <Box>
                <Text fw={600} size="sm">
                  {t.settings.theme}
                </Text>
                <Text c="dimmed" size="sm">
                  {t.settings.themeDescription}
                </Text>
              </Box>
              <Select
                value={colorScheme}
                onChange={(value) => value && setColorScheme(value as 'dark' | 'light')}
                data={themeOptions}
                w={120}
                size="sm"
              />
            </Group>

            <Divider />

            {/* Language Setting */}
            <Group justify="space-between" align="center">
              <Box>
                <Text fw={600} size="sm">
                  {t.settings.language}
                </Text>
                <Text c="dimmed" size="sm">
                  {t.settings.languageDescription}
                </Text>
              </Box>
              <Select
                value={locale}
                onChange={(value) => value && setLocale(value as Locale)}
                data={languageOptions}
                w={120}
                size="sm"
              />
            </Group>

            <Divider />

            {/* Chart Colors Setting */}
            <Group justify="space-between" align="flex-start">
              <Box>
                <Text fw={600} size="sm">
                  {t.settings.chartColors}
                </Text>
                <Text c="dimmed" size="sm">
                  {t.settings.chartColorsDescription}
                </Text>
              </Box>
              <Stack gap="xs">
                <Group>
                  <Text size="sm" w={80}>
                    {t.settings.color1}
                  </Text>
                  <ColorInput
                    value={chartColors.driver1}
                    onChange={(val) => setChartColors({ ...chartColors, driver1: val })}
                    size="sm"
                    w={120}
                  />
                </Group>
                <Group>
                  <Text size="sm" w={80}>
                    {t.settings.color2}
                  </Text>
                  <ColorInput
                    value={chartColors.driver2}
                    onChange={(val) => setChartColors({ ...chartColors, driver2: val })}
                    size="sm"
                    w={120}
                  />
                </Group>
              </Stack>
            </Group>

            <Divider />

            {/* Data Management */}
            <Group justify="space-between" align="center">
              <Box>
                <Text fw={600} size="sm">
                  {t.settings.dataManagement}
                </Text>
                <Text c="dimmed" size="sm">
                  {t.settings.dataManagementDescription}
                </Text>
              </Box>
              <Group>
                <Button
                  variant="default"
                  size="sm"
                  leftSection={<ArrowDownToLine size={16} />}
                  onClick={handleExportData}
                  loading={exporting}
                  disabled={importing || clearing}
                >
                  {t.settings.export}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  leftSection={<ArrowUpFromLine size={16} />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={exporting || clearing}
                >
                  {t.settings.import}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".json"
                  onChange={handleFileSelect}
                />
              </Group>
            </Group>

            <Divider />

            {/* Clear Data Setting */}
            <Group justify="space-between" align="center">
              <Box>
                <Text fw={600} size="sm">
                  {t.settings.clearData}
                </Text>
                <Text c="dimmed" size="sm">
                  {t.settings.clearDataDescription}
                </Text>
              </Box>
              <Button
                color="red"
                variant="filled"
                size="sm"
                leftSection={<Trash2 size={14} />}
                onClick={openConfirmModal}
                disabled={exporting || importing}
              >
                {t.settings.clearButton}
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>

      {/* Clear Confirmation Modal */}
      <Modal
        opened={confirmModalOpened}
        onClose={closeConfirmModal}
        title={t.settings.clearData}
        centered
        closeOnClickOutside={!clearing}
        closeOnEscape={!clearing}
        withCloseButton={!clearing}
      >
        <Stack>
          <Text>{t.settings.confirmClear}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeConfirmModal} disabled={clearing}>
              {t.common.cancel}
            </Button>
            <Button color="red" onClick={handleClearData} loading={clearing}>
              {t.common.delete}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Import Confirmation Modal */}
      <Modal
        opened={importModalOpened}
        onClose={closeImportModal}
        title={t.settings.importConfirmTitle}
        centered
        closeOnClickOutside={!importing}
        closeOnEscape={!importing}
        withCloseButton={!importing}
      >
        <Stack>
          <Text>{t.settings.importConfirmBody}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeImportModal} disabled={importing}>
              {t.common.cancel}
            </Button>
            <Button color="red" onClick={handleImportData} loading={importing}>
              {t.common.confirm}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default SettingsSection;
